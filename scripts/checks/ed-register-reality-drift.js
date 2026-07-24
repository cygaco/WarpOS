#!/usr/bin/env node
"use strict";
/**
 * scripts/checks/ed-register-reality-drift.js — ED-056 residual: REGISTER-reality drift.
 *
 * The sibling tracker-reality-drift.js catches "claimed-missing-but-exists" drift in EPIC
 * trackers (trackers/epics/), and tracker-fidelity.js does the same for sprint YAML. NEITHER
 * scans the enforcement-debt REGISTER — and a stale-open register row is exactly what nearly
 * caused a duplicate keystone build (task #4, 2026-07-24: ED-256/257/258 were marked status:open
 * while their enforcers were built+landed on main). This check closes that residual.
 *
 * THE CHECK (deliberately TIGHT — precise > noisy, same discipline as tracker-reality-drift):
 *   an OPEN ED (no closure/resolution row, genesis status != closed) whose row TEXT names a
 *   concrete NEW enforcer script `scripts/(checks|enforcement)/<name>.(js|cjs|mjs)` that BOTH
 *   (a) EXISTS on disk AND (b) has a sibling `<name>.test.js` — the "shipped-with-teeth"
 *   discriminator — is a drift finding: the deliverable landed but the register still says open.
 *
 *   The test-sibling requirement is load-bearing: an ED that merely REFERENCES an existing file
 *   it intends to MODIFY (e.g. "add a check to scripts/dispatch-claude.js") will NOT have a NEW
 *   matching <name>.test.js unless the work actually shipped as its own tested enforcer, so the
 *   modify-existing case does not false-RED.
 *
 *   PARTIAL-RESOLUTION EXCLUSION (load-bearing, learned from dogfooding the live register): "the
 *   file exists" is NOT "the debt is resolved". An ED can ship one enforcer while retaining named
 *   OPEN sub-items (ED-264: an amendment resolved sub-item iii but (i)/(ii) stay open_adr) — such
 *   an ED is INTENTIONALLY open, not stale. So an id is EXCLUDED when any of its rows carries a
 *   partial-resolution signal: the structured fields `open_adr` / `partial_enforced` /
 *   `remaining_open`, or the text markers REMAINING OPEN / open_adr / residual / sub-item /
 *   partially / partial_enforced / deferred / still open / remains open. This is a CANDIDATE
 *   surfacer (report-only), never an auto-close mandate — a flagged id means "verify + close-or-
 *   annotate", and the finding says so. Precise > noisy: better to miss a stale id than to
 *   false-RED an actively-managed partial.
 *
 * GITIGNORED-LEDGER POSTURE (mirrors betaevents-dedup-lint / reasoned-consult-honesty): the
 * register lives under .claude/project/memory/ which is .gitignored — ABSENT on a fresh clone /
 * CI / a fresh worktree. Absent (ENOENT) => SKIP-with-note, exit 0 (NOT a gate on machines that
 * never had the ledger). Present-but-UNREADABLE => fail-closed exit 2 (a broken scan must never
 * report "0 drift"). Report-only by default (findings printed, exit 0); `--enforce` => exit 1.
 *
 * Exit: 0 clean / 0 report-only-with-findings / 0 skip-absent · 1 drift under --enforce · 2 fail-closed.
 * Pure evaluate(registerText, fileExists) is exported for sealed-fixture tests (no disk).
 */

const fs = require("fs");
const path = require("path");

const REPO = path.resolve(__dirname, "..", "..");
const DEFAULT_REGISTER = path.join(REPO, ".claude", "project", "memory", "enforcement-debt.jsonl");
const NAME = "ed-register-reality-drift";

// A concrete NEW-enforcer script path anywhere in a row's text. Anchored to the two enforcer
// dirs so a stray scripts/lib/... reference is not treated as a shipped enforcer deliverable.
const ENFORCER_PATH_RE = /scripts\/(?:checks|enforcement)\/[A-Za-z0-9_.-]+\.(?:js|cjs|mjs)/g;

// The row fields that may name a deliverable (trigger = "build X"; file = target; missing_enforcer
// / gap = the described gap). We scan their concatenation — a path in ANY of them counts.
const DELIVERABLE_FIELDS = ["trigger", "file", "missing_enforcer", "gap", "policy"];

// Partial-resolution signal — an id carrying ANY of these is INTENTIONALLY open (residual work
// named), not stale, so it is excluded from candidate findings. Text markers (case-insensitive):
const PARTIAL_MARKER_RE = /\b(REMAINING OPEN|open_adr|residual|sub-item|partially|partial_enforced|deferred|still open|remains open)\b/i;
// ...plus these STRUCTURED fields on any row (present + truthy/non-empty => actively-managed partial).
const PARTIAL_FIELDS = ["open_adr", "partial_enforced", "remaining_open"];

function hasPartialSignal(objs) {
  for (const o of objs) {
    for (const k of PARTIAL_FIELDS) {
      const v = o[k];
      if (v === true || (typeof v === "string" && v.length > 0) || (Array.isArray(v) && v.length > 0)) return true;
    }
    if (PARTIAL_MARKER_RE.test(JSON.stringify(o))) return true;
  }
  return false;
}

/** Reuse the register parser so genesis/closure classification can't drift from the dup-id lint. */
function loadParser() {
  return require(path.join(REPO, "scripts", "enforcement", "ed-registry")).parseRegister;
}

/**
 * Pure core. `registerText` = raw jsonl; `fileExists(relPath)` = injectable existence oracle
 * (relPath is repo-relative, forward-slash). `parse` is injectable (defaults to the real parser).
 * Returns { skip, findings, malformedLines }.
 */
function evaluate({ registerText, fileExists, parse }) {
  const parseRegister = parse || loadParser();
  const rows = parseRegister(registerText);
  // Group rows by id; an id is CLOSED if any of its rows is a closure/resolution/amendment-close.
  const byId = new Map();
  let malformedLines = 0;
  for (const r of rows) {
    if (r.malformed) { malformedLines++; continue; }
    if (!r.id) continue;
    if (!byId.has(r.id)) byId.set(r.id, []);
    byId.get(r.id).push(r.obj);
  }
  const findings = [];
  const phantomClose = []; // β Q2 direction (b): closed ED whose named deliverable is ABSENT.
  let skippedPartial = 0;
  for (const [id, objs] of byId) {
    const closed = objs.some(
      (o) => o.status === "closed" || o.closure_receipt !== undefined || o.closed_ts !== undefined || o.resolution !== undefined,
    );
    if (closed) {
      // β Q2 (b) PHANTOM-CLOSE (the more dangerous direction — hides undone work): a CLOSED ED whose
      // CLOSURE row explicitly names an enforcer deliverable that does NOT exist on disk. Tight: only a
      // path named on a CLOSURE/resolution row (not the open genesis, which may name a not-yet-built
      // target), and only scripts/(checks|enforcement)/<name>.js — a stub/rename left the closure lying.
      // Candidate-probe, NOT proof (a present-but-stub file still fools direction (a)); report-only.
      const closureRows = objs.filter((o) => o.status === "closed" || o.closure_receipt !== undefined || o.closed_ts !== undefined);
      const seenC = new Set();
      for (const cr of closureRows) {
        const ctext = ["enforcer", "closure_receipt", "resolution", "note", "file"].map((k) => (typeof cr[k] === "string" ? cr[k] : "")).join("\n");
        let cm; ENFORCER_PATH_RE.lastIndex = 0;
        while ((cm = ENFORCER_PATH_RE.exec(ctext)) !== null) {
          const rel = cm[0];
          if (seenC.has(rel)) continue; seenC.add(rel);
          if (!fileExists(rel)) {
            phantomClose.push({ id, deliverable: rel, reason: `PHANTOM-CLOSE candidate: ED ${id} is marked closed citing enforcer ${rel}, but that file does NOT exist on disk — the closure may be lying (renamed/removed/never-shipped). VERIFY.` });
          }
        }
      }
      continue; // resolved — not a stale-open (direction a) candidate
    }
    // Intentionally-open (named residual work) — excluded so a managed partial never false-REDs.
    if (hasPartialSignal(objs)) { skippedPartial++; continue; }
    // The genesis row (carries the substantive description) holds the deliverable references.
    const genesis = objs.find((o) => DELIVERABLE_FIELDS.some((k) => typeof o[k] === "string" && o[k].length > 0)) || objs[0];
    if (!genesis) continue;
    const text = DELIVERABLE_FIELDS.map((k) => (typeof genesis[k] === "string" ? genesis[k] : "")).join("\n");
    const seen = new Set();
    let m;
    ENFORCER_PATH_RE.lastIndex = 0;
    while ((m = ENFORCER_PATH_RE.exec(text)) !== null) {
      const rel = m[0];
      if (seen.has(rel)) continue;
      seen.add(rel);
      // Shipped-with-teeth: the enforcer file AND a sibling <name>.test.js both exist.
      const testRel = rel.replace(/\.(js|cjs|mjs)$/, ".test.$1");
      if (fileExists(rel) && fileExists(testRel)) {
        findings.push({
          id,
          deliverable: rel,
          test: testRel,
          reason: `CANDIDATE stale-open: ED ${id} is marked open, but its named enforcer ${rel} exists on disk WITH a sibling test ${testRel} and the row carries no open-residual markers — VERIFY against the requirement, then append a closure row if resolved (or record the open residual).`,
        });
      }
    }
  }
  return { skip: false, findings, phantomClose, malformedLines, skippedPartial };
}

// ── CLI ──────────────────────────────────────────────────────────────────────

function realFileExists(rel) {
  try {
    return fs.existsSync(path.join(REPO, rel));
  } catch {
    return false;
  }
}

function main(argv) {
  const jsonOut = argv.includes("--json");
  const enforce = argv.includes("--enforce");
  const ri = argv.indexOf("--register");
  const registerPath = ri !== -1 && argv[ri + 1] ? path.resolve(argv[ri + 1]) : DEFAULT_REGISTER;

  let registerText;
  try {
    registerText = fs.readFileSync(registerPath, "utf8");
  } catch (e) {
    if (e && e.code === "ENOENT") {
      // Gitignored ledger absent (fresh clone / CI / fresh worktree) — SKIP, never a false gate.
      const out = { name: NAME, status: "skip", reason: `register absent (${registerPath}) — gitignored ledger, nothing to check`, findings: [] };
      process.stdout.write(jsonOut ? JSON.stringify(out) + "\n" : `SKIP [${NAME}] register absent (gitignored) — ${registerPath}\n`);
      return 0;
    }
    // Present but unreadable → fail-closed (a broken scan must not report 0 drift).
    process.stderr.write(`ERROR [${NAME}] register unreadable (fail-closed): ${e.message}\n`);
    return 2;
  }

  const { findings, phantomClose, malformedLines, skippedPartial } = evaluate({ registerText, fileExists: realFileExists });
  // β Q2: the HARD-gate direction is (a) stale-open only; phantom-close (b) is report-only advisory
  // (candidate-probe, more false-positive-prone since a legit rename can absent a closure's path).
  const blocking = enforce && findings.length > 0;
  const REALITY_DISCLAIMER = "CANDIDATE-probe, NOT proof: 'file exists' is not 'ED resolved' (a stub/unwired file fools it) and 'file absent' is not 'closure false' (a legit rename). GREEN = no candidates, NOT register-accurate; never auto-close.";
  const out = {
    name: NAME,
    status: blocking ? "red" : "green",
    register: registerPath,
    enforced: enforce,
    findings,
    phantomClose,
    skippedPartial,
    malformedLines,
    disclaimer: REALITY_DISCLAIMER,
  };
  if (jsonOut) {
    process.stdout.write(JSON.stringify(out) + "\n");
  } else {
    if (findings.length) {
      process.stderr.write(`${blocking ? "FAIL" : "WARN"} [${NAME}] ${findings.length} open ED(s) whose enforcer shipped (register lags reality — direction a):\n`);
      for (const f of findings) process.stderr.write(`     - ${f.id}: ${f.deliverable} (+ ${f.test}) exists — verify + append a closure row\n`);
    }
    if (phantomClose.length) {
      process.stderr.write(`INFO [${NAME}] ${phantomClose.length} PHANTOM-CLOSE candidate(s) (closed ED, named enforcer ABSENT — direction b, report-only):\n`);
      for (const f of phantomClose) process.stderr.write(`     - ${f.id}: ${f.deliverable} absent\n`);
    }
    if (malformedLines) process.stderr.write(`     (${malformedLines} malformed register line(s) skipped)\n`);
    if (!findings.length && !phantomClose.length) process.stdout.write(`OK   [${NAME}] no reality-drift candidates (neither stale-open nor phantom-close)\n`);
    process.stderr.write(`     NOTE (${NAME}): ${REALITY_DISCLAIMER}\n`);
  }
  return blocking ? 1 : 0;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { evaluate, NAME };
