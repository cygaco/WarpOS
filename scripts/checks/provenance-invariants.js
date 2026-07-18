#!/usr/bin/env node
"use strict";
/**
 * provenance-invariants.js — the STRUCTURAL anti-recurrence guard for the security-panel evidence-
 * provenance class (SP-20260718-003, β round-5 ruling). Five gauntlet rounds recurred the SAME three
 * invariants at MISSED SITES (a coverage-discipline gap, not a model leak). This guard makes a missed
 * site SELF-DETECTING: it fails (exit 1) if ANY site of these classes drifts back to the leaky form,
 * so a future edit can't silently re-open the class between gauntlet rounds.
 *
 * INV-1 HUNTER-IDENTITY: the sanctioned in-process hunter is identified by its STRUCTURAL channel shape
 *   (`in-process-agent`) + role — NEVER a settable `via`/`record_via` label OR'd as an alternative to
 *   shape (SR-016: a subprocess record with via:"epsilon-agent" masqueraded as the hunter).
 * INV-2 RUN-IDENTITY: every attestation-gating ledger filter/correlation keys on `panel_run_id` (the
 *   minted panel identity, SR-011), NEVER `run_id` (QA-014: run_id is written from a different env → the
 *   live filter discarded real runner records).
 * INV-3 PROVENANCE-TOKEN: every git-head ref-read path (loose, detached, packed) validates the token as
 *   a hex SHA before returning (R5-BE-001: an unvalidated packed-ref yielded a non-commit code_sha).
 *
 *   node scripts/checks/provenance-invariants.js [--json]
 * Exit: 0 all invariants hold · 1 a site drifted (the finding) · 2 fail-closed (a guarded file unreadable).
 */
const fs = require("fs");
const path = require("path");

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..");
const NAME = "provenance-invariants";

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

// Strip doc-comments + line comments so a comment MENTIONING an old pattern isn't a false positive.
function stripComments(src) {
  return src.replace(/^\s*\*.*$/gm, "").replace(/\/\/.*$/gm, "");
}

// ── PURE detectors (injectable content → boolean leak) — the guard's testable core. ──

// INV-1 leak: a hunter-identity check ORs a settable via/record_via label as an ALTERNATIVE to the shape.
function hasHunterIdentityLeak(code) {
  return /(r\.via\s*===\s*["']epsilon-agent["']\s*\|\||r\.record_via\s*===\s*["']inprocess["']\s*\|\|)/.test(stripComments(code));
}
// INV-2 leak: an attestation filter keys on r.run_id (the panel identity is panel_run_id). `run_id: x` (output) is fine.
function hasRunIdentityLeak(code) {
  return /r\.run_id\s*(===|!==)\s*(runId|panelRunId)/.test(stripComments(code));
}
// INV-3 hold: every git-head ref-read path (packed + loose/detached) SHA-validates its token.
function gitHeadTokenValidated(src) {
  const packed = /function readPackedRef[\s\S]*?\n}/.exec(src);
  const loose = /readGitHead[\s\S]*?\n}/.exec(src);
  const packedOk = !!packed && /\[0-9a-f\]\{7,40\}/.test(packed[0]);
  const looseOk = !!loose && (loose[0].match(/\[0-9a-f\]\{7,40\}/g) || []).length >= 2;
  return packedOk && looseOk;
}

function checkHunterIdentity(violations) {
  for (const f of ["scripts/checks/cert-attest.js", "scripts/dispatch-review.js", "scripts/dispatch/panel-lanes.js"]) {
    let src;
    try { src = read(f); } catch (e) { violations.push({ inv: "INV-1", file: f, msg: `unreadable (fail-closed): ${e.message}`, fatal: true }); continue; }
    if (hasHunterIdentityLeak(src)) violations.push({ inv: "INV-1", file: f, msg: "a hunter-identity check ORs a settable via/record_via label — require shape==='in-process-agent' AND role, not the label (SR-016)" });
  }
}
function checkRunIdentity(violations) {
  const f = "scripts/checks/cert-attest.js";
  let src;
  try { src = read(f); } catch (e) { violations.push({ inv: "INV-2", file: f, msg: `unreadable (fail-closed): ${e.message}`, fatal: true }); return; }
  if (hasRunIdentityLeak(src)) violations.push({ inv: "INV-2", file: f, msg: "an attestation filter keys on r.run_id — the panel identity is panel_run_id (QA-014/SR-011)" });
}
function checkProvenanceToken(violations) {
  const f = "scripts/dispatch/git-head.js";
  let src;
  try { src = read(f); } catch (e) { violations.push({ inv: "INV-3", file: f, msg: `unreadable (fail-closed): ${e.message}`, fatal: true }); return; }
  if (!gitHeadTokenValidated(src)) violations.push({ inv: "INV-3", file: f, msg: "a git-head ref-read path returns a token without hex-SHA validation (R5-BE-001)" });
}

function run() {
  const violations = [];
  checkHunterIdentity(violations);
  checkRunIdentity(violations);
  checkProvenanceToken(violations);
  return violations;
}

if (require.main === module) {
  const json = process.argv.includes("--json");
  let violations;
  try {
    violations = run();
  } catch (e) {
    process.stderr.write(`FAIL [${NAME}] fail-closed: ${e.message}\n`);
    process.exit(2);
  }
  const fatal = violations.some((v) => v.fatal);
  if (json) {
    process.stdout.write(JSON.stringify({ check: NAME, ok: violations.length === 0, violations }, null, 2) + "\n");
  } else if (violations.length === 0) {
    process.stdout.write(`OK   [${NAME}] hunter-identity (shape not label), run-identity (panel_run_id), provenance-token (SHA-validated) hold at every guarded site\n`);
  } else {
    process.stderr.write(`FAIL [${NAME}] ${violations.length} invariant drift(s):\n${violations.map((v) => `  - [${v.inv}] ${v.file}: ${v.msg}`).join("\n")}\n`);
  }
  process.exit(violations.length === 0 ? 0 : fatal ? 2 : 1);
}

module.exports = { run, NAME, hasHunterIdentityLeak, hasRunIdentityLeak, gitHeadTokenValidated };
