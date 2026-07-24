#!/usr/bin/env node
"use strict";
/**
 * scripts/checks/beta-verdict-citation-receipt.js — ED-239 (CRITICAL) enforcer.
 *
 * "A reported teammate verdict (especially a β consult verdict) must be receipt-backed at report
 * time: attribution without receipt = unverified claim, treated as absent." A downstream artifact
 * (ADR, tracker, ROADMAP) that CITES a β verdict as load-bearing justification must be able to
 * point at the receipt — the msg_id of the delivered verdict, resolvable in paths.betaEvents.
 *
 * Sibling of reasoned-consult-honesty.js (row well-formedness) + betaevents-dedup-lint.js (row
 * dedup/msg_id hygiene): those check the LEDGER; this checks the CITATIONS that reference it.
 *
 * TWO finding classes (β plan→design scoping — STRUCTURAL receipt-presence, not semantic msg-log
 * authentication, which is ED-275):
 *   HARD (gate-able): a β-verdict citation that CARRIES a `msg_id <token>` whose token does NOT
 *     resolve to a betaEvents VERDICT row. A present-but-unresolved receipt is a forged / typo'd /
 *     stale reference — near-zero false-positive, so it can BLOCK under --enforce.
 *   SOFT (report-only advisory, never blocks): a load-bearing β-verdict citation with NO msg_id at
 *     all — the conductor-side contract nudge ("cite the receipt"). Report-only because the
 *     historical corpus predates the msg_id convention; blocking it would flood.
 *
 * GITIGNORED-LEDGER POSTURE (mirrors betaevents-dedup-lint): betaEvents lives under
 * .claude/agents/.../beta/ — advisory, may be ABSENT on a fresh clone / CI. Absent => the HARD
 * resolution can't run => SKIP-with-note (exit 0). Present-but-unreadable => fail-closed exit 2.
 * SCOPE: /scan:full only; report-only by default; `--enforce` => exit 1 on any HARD finding.
 *
 * Exit: 0 clean / report-only / skip · 1 HARD finding under --enforce · 2 fail-closed.
 * Pure evaluate({docs, betaEventsText}) is exported for sealed-fixture tests (no disk).
 */

const fs = require("fs");
const path = require("path");

const REPO = path.resolve(__dirname, "..", "..");
const NAME = "beta-verdict-citation-receipt";
// β Q1(b) CEILING DISCLAIMER (printed on ALL paths, like ED-234): a GREEN means the cited receipt
// is PRESENT, not AUTHENTIC. This verifies a citation's msg_id EXISTS in betaEvents — NOT that the
// betaEvents row is itself authentic / from the right β instance. A real msg_id pointing at a
// forged / wrong-instance row passes BY DESIGN; that authenticity layer is ED-275 (msg-log
// authenticator), out of scope here. Scan:full-only, never CI (betaEvents is gitignored).
const DISCLAIMER = "receipt PRESENT, not authenticated — a cited msg_id resolving in betaEvents is NOT proof the row is authentic/right-instance (that is ED-275). /scan:full-only, never CI.";
const DEFAULT_BETA_EVENTS = path.join(REPO, ".claude", "agents", "president", "_system", "beta", "events.jsonl");
// Default corpus: ADRs + the roadmap + epic trackers (where a β verdict is cited as justification).
const DEFAULT_DOC_DIRS = [
  path.join(REPO, ".claude", "agents", "president", "_system", "policy", "adr"),
  path.join(REPO, "trackers", "epics"),
];
const DEFAULT_DOC_FILES = [path.join(REPO, "ROADMAP.md")];

// A β-verdict CITATION: a β/beta token adjacent to a canonical verdict token. Tight on purpose
// (precise > noisy): the decision vocabulary is the closed β set, or the explicit "ruled/verdict".
// NB: a leading `\b` does NOT work before `β` (a non-ASCII char has no ASCII word boundary against
// a preceding space) — use a negative lookbehind so both `β DECIDE` and `beta DECIDE` match.
const CITATION_RE = /(?<![A-Za-z])(?:β|beta|Beta)\s+(?:DECIDE|DIRECTIVE|ESCALATE|ruled|verdict|approved|DECIDES)\b/;
// A receipt token on the SAME line: the literal `msg_id` label before an id-shaped token (uuid/slug).
// Requiring the label avoids matching stray hex; {6,} avoids matching tiny tokens.
const MSGID_IN_TEXT_RE = /\bmsg_id[:=\s]+([A-Za-z0-9][A-Za-z0-9_-]{5,})/i;
// A betaEvents row's own msg_id (id-shaped).
const MSGID_SHAPE_RE = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

// Verdict row types (from reasoned-consult-honesty's live corpus) — the rows a citation's receipt
// should resolve to. A citation's msg_id must appear as the msg_id of one of these.
const VERDICT_TYPES = new Set([
  "beta-consult-verdict", "beta-consult-verdict-reconfirm", "beta-verdict", "beta-directive",
  "design-boundary-verdict", "fix-lock-verdict", "design-lock", "fix-lock", "beta-consult-retraction",
  "boundary", "beta-consult", // beta-consult may carry a verdict; include so a real receipt resolves
]);

/** Skip append-only HISTORY sections (Session log / Change log) — a dated past citation is a record. */
function historyStart(lines) {
  for (let i = 0; i < lines.length; i++) {
    if (/^#{1,4}\s+(Session log|Change log|Changelog|History)\b/i.test(lines[i])) return i;
  }
  return lines.length;
}

/** Build the set of msg_ids present on betaEvents VERDICT rows. null betaEventsText => absent ledger. */
function verdictMsgIds(betaEventsText) {
  if (betaEventsText == null) return null; // absent — caller SKIPs
  const set = new Set();
  for (const line of String(betaEventsText).split(/\r?\n/)) {
    const t = line.trim();
    if (!t) continue;
    let o;
    try { o = JSON.parse(t); } catch { continue; } // malformed row skipped (never crash)
    // A row contributes its msg_id if it is a recognized verdict-carrying row with an id-shaped msg_id.
    const type = typeof o.type === "string" ? o.type : null;
    const mid = typeof o.msg_id === "string" ? o.msg_id : null;
    if (mid && MSGID_SHAPE_RE.test(mid) && (type === null || VERDICT_TYPES.has(type))) set.add(mid);
    // Some rows nest the delivered msg_id under data/ids; be lenient — also index a top-level `ids` array.
    if (Array.isArray(o.msg_ids)) for (const m of o.msg_ids) if (typeof m === "string") set.add(m);
  }
  return set;
}

/**
 * Pure core. docs = [{ path, text }]; betaEventsText = raw jsonl or null (absent).
 * Returns { skip, hard:[], soft:[], scannedCitations }.
 */
function evaluate({ docs, betaEventsText }) {
  const known = verdictMsgIds(betaEventsText);
  if (known === null) return { skip: true, hard: [], soft: [], scannedCitations: 0 };
  const hard = [];
  const soft = [];
  let scannedCitations = 0;
  for (const d of docs || []) {
    const lines = String(d.text || "").split(/\r?\n/);
    const end = historyStart(lines);
    for (let i = 0; i < end; i++) {
      const line = lines[i];
      if (!CITATION_RE.test(line)) continue;
      scannedCitations++;
      const m = line.match(MSGID_IN_TEXT_RE);
      if (m) {
        const mid = m[1];
        if (!known.has(mid)) {
          hard.push({
            doc: d.path, line: i + 1, msg_id: mid,
            reason: `β-verdict citation cites msg_id '${mid}' which does NOT resolve to a betaEvents verdict row — unverified receipt (forged/typo/stale). Citation: ${line.trim().slice(0, 120)}`,
          });
        }
      } else {
        soft.push({
          doc: d.path, line: i + 1,
          reason: `load-bearing β-verdict citation with NO msg_id receipt — add the delivered verdict's msg_id (ED-239 conductor-side contract). Citation: ${line.trim().slice(0, 120)}`,
        });
      }
    }
  }
  return { skip: false, hard, soft, scannedCitations };
}

// ── Filesystem gathering ──────────────────────────────────────────────────────

function gatherDocs(dirs, files) {
  const out = [];
  const pushFile = (fp) => {
    try {
      const txt = fs.readFileSync(fp, "utf8");
      out.push({ path: path.relative(REPO, fp), text: txt });
    } catch { /* unreadable single doc — skip (not the ledger; a missing ADR is not fail-closed) */ }
  };
  for (const dir of dirs) {
    let entries;
    try { entries = fs.readdirSync(dir); } catch { continue; }
    for (const n of entries) if (/\.md$/i.test(n)) pushFile(path.join(dir, n));
  }
  for (const f of files) if (fs.existsSync(f)) pushFile(f);
  return out;
}

function main(argv) {
  const jsonOut = argv.includes("--json");
  const enforce = argv.includes("--enforce");
  const bi = argv.indexOf("--beta-events");
  const betaEventsPath = bi !== -1 && argv[bi + 1] ? path.resolve(argv[bi + 1]) : DEFAULT_BETA_EVENTS;

  let betaEventsText;
  try {
    betaEventsText = fs.readFileSync(betaEventsPath, "utf8");
  } catch (e) {
    if (e && e.code === "ENOENT") {
      const out = { name: NAME, status: "skip", reason: `betaEvents absent (${betaEventsPath}) — gitignored ledger; receipt resolution skipped`, disclaimer: DISCLAIMER };
      process.stdout.write(jsonOut ? JSON.stringify(out) + "\n" : `SKIP [${NAME}] betaEvents absent (gitignored) — nothing to resolve against\n     (${DISCLAIMER})\n`);
      return 0;
    }
    process.stderr.write(`ERROR [${NAME}] betaEvents unreadable (fail-closed): ${e.message}\n`);
    return 2;
  }

  const docs = gatherDocs(DEFAULT_DOC_DIRS, DEFAULT_DOC_FILES);
  const { hard, soft, scannedCitations } = evaluate({ docs, betaEventsText });
  const blocking = enforce && hard.length > 0;
  const out = {
    name: NAME, status: blocking ? "red" : "green", betaEvents: betaEventsPath,
    enforced: enforce, scannedCitations, hardFindings: hard, softAdvisories: soft, disclaimer: DISCLAIMER,
  };
  if (jsonOut) {
    process.stdout.write(JSON.stringify(out) + "\n");
  } else {
    if (hard.length) {
      process.stderr.write(`${blocking ? "FAIL" : "WARN"} [${NAME}] ${hard.length} β-verdict citation(s) with an UNRESOLVED msg_id receipt:\n`);
      for (const f of hard) process.stderr.write(`     - ${f.doc}:${f.line} msg_id '${f.msg_id}' not in betaEvents\n`);
    }
    if (soft.length) {
      process.stderr.write(`INFO [${NAME}] ${soft.length} β-verdict citation(s) with no msg_id receipt (report-only advisory):\n`);
      for (const f of soft.slice(0, 20)) process.stderr.write(`     - ${f.doc}:${f.line}\n`);
      if (soft.length > 20) process.stderr.write(`     … +${soft.length - 20} more\n`);
    }
    if (!hard.length && !soft.length) process.stdout.write(`OK   [${NAME}] ${scannedCitations} β-verdict citation(s) scanned; all receipt-backed\n`);
    process.stderr.write(`     NOTE (${NAME}): ${DISCLAIMER}\n`); // β Q1(b) — disclose the ceiling on EVERY path
  }
  return blocking ? 1 : 0;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { evaluate, verdictMsgIds, NAME, DISCLAIMER };
