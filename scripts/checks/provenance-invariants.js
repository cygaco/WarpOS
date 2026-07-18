#!/usr/bin/env node
"use strict";
/**
 * provenance-invariants.js — the STRUCTURAL anti-recurrence guard for the security-panel evidence-
 * provenance class (SP-20260718-003; α round-6 CHOKE-POINT ruling; ED-225). The 6-round recurrence proved
 * a grep-guard is insufficient (R6-BE-002: it missed reversed operands, renamed callback vars, and the
 * sanctioned_lane_id settable-label vector — SR-017). α's fix: ONE module (scripts/dispatch/provenance-
 * verifier.js) owns the identity predicates; the CONSUMERS (cert-attest.js, dispatch-review.js) call it and
 * re-implement NOTHING. This guard enforces THAT — it FAILS if a consumer:
 *   (a) does not import the provenance-verifier (it must consume the choke-point), OR
 *   (b) re-implements a hunter-identity check locally — a RECORD `.shape === "in-process-agent"` comparison
 *       (either operand order), OR
 *   (c) keys identity on ANY settable per-record label — a `.via` / `.record_via` / `.sanctioned_lane_id`
 *       comparison (either operand order, any variable name).
 * Plus INV-3: git-head.js SHA-validates every ref-read path. The check is order/name-independent (R6-BE-002's
 * fragility list is its test set), not a brittle single-spelling grep — a missed site is now self-detecting.
 *
 *   node scripts/checks/provenance-invariants.js [--json]
 * Exit: 0 all hold · 1 a consumer drifted (the finding) · 2 fail-closed (a guarded file unreadable).
 */
const fs = require("fs");
const path = require("path");

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..");
const NAME = "provenance-invariants";
// The lane-identity CONSUMERS that must delegate identity to the choke-point (NOT the module itself). SR-020
// (ADR-0022 teeth-2) added panel-lanes.js: it used to decide the sanctioned in-process lane from the settable
// `sanctioned_lane_id`/`role` label (the third settable-identity consumer) — it now delegates to
// provenance-verifier.isSanctionedHunterLane (structural laneId+provider+shape), so it is a full CONSUMER and
// the guard is delegation-COMPLETE across EVERY lane-identity consumer (not enumerate-the-known-callers).
const CONSUMERS = ["scripts/checks/cert-attest.js", "scripts/dispatch-review.js", "scripts/dispatch/panel-lanes.js"];
const VERIFIER = "provenance-verifier";

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}
function stripComments(src) {
  return src.replace(/^\s*\*.*$/gm, "").replace(/\/\/.*$/gm, "");
}

// ── PURE detectors (injectable content → boolean) — order/name-independent (R6-BE-002-robust). ──

// DELEGATION-COMPLETE identity check (β round-6 catch): a hunter/lane-identity DECISION requires one of the
// identity VALUES — the hunter role "security_claude_hunter" or the in-process channel shape "in-process-
// agent". Those values belong ONLY in the verifier. A consumer that COMPARES a field to one (any field —
// via/record_via/sanctioned_lane_id/shape/a new label), or ASSIGNS one to a local const (to compare via an
// aliased var), re-implements identity — the VALUE is the tell, not the field name. This closes the SR-017
// blocklist gap: it does NOT enumerate label fields (a new/renamed field would slip a field-list), it
// catches the identity VALUE in a comparison/assignment context. NOT flagged: a value appearing INSIDE a
// larger diagnostic message string (not a standalone quoted literal after ===/!==/=).
// R6-BE-002 (ADR-0022 teeth-2): the detector is HARDENED beyond the string-literal regex to catch the
// constant-ref / Object.is / destructuring evasions the old regex missed — WITHOUT a JS-AST parser (none is a
// dependency of this repo; a true parser-based AST is a separate dependency decision, tracked). The
// hardening is VALUE-KIND-AWARE, which is what lets it stay compatible with the SR-020 panel-lanes consumer:
//
//   - The hunter ROLE value ("security_claude_hunter") is PURE record-identity: a consumer NEVER legitimately
//     names it — it delegates to pv.isHunterRecord/isSanctionedHunterLane. So it is flagged in EVERY form:
//     the raw literal AND any reference to pv's `HUNTER_ROLE` export (member `pv.HUNTER_ROLE`, a destructured
//     `const {HUNTER_ROLE}=pv`, an `Object.is(x, HUNTER_ROLE)`, or a renamed alias whose destructure line
//     still names HUNTER_ROLE). A COMPLETE hunter-identity re-implementation ALWAYS needs the role → always caught.
//   - The in-process SHAPE value ("in-process-agent") is flagged as a raw LITERAL only. A constant-REF
//     (`x === IN_PROCESS_SHAPE` / `x === pv.IN_PROCESS_SHAPE`) is intentionally ALLOWED: that is legitimate
//     manifest/observed-lane SHAPE validation (panel-lanes' assertCliOnlyPanel + validatePanelManifest), and a
//     shape-only check decides NO hunter identity (that needs the role, caught above). This is the deliberate
//     carve-out that makes panel-lanes a clean CONSUMER without over-flagging its contract validation.
//
// RESIDUAL (documented, not a hunter-identity hole): a consumer could write a SHAPE-ONLY re-implementation via
// the imported IN_PROCESS_SHAPE constant and it would not be flagged — but a shape-only comparison establishes
// no hunter identity on its own. A full parser-based AST that reasons about the compared object's ORIGIN
// (record vs manifest-lane) would close even that; it needs a parser dependency (out of this build's scope).
const HUNTER_ROLE_VALUE = `["']security_claude_hunter["']`;
const SHAPE_VALUE = `["']in-process-agent["']`;
function hasLocalIdentityDecision(code) {
  const c = stripComments(code);
  return (
    // (A) the hunter ROLE value — literal OR any ref to pv's HUNTER_ROLE export (constant/member/destructured).
    new RegExp(HUNTER_ROLE_VALUE).test(c) || // literal "security_claude_hunter" (its own quoted string; message-safe)
    /\bHUNTER_ROLE\b/.test(c) || // pv.HUNTER_ROLE / {HUNTER_ROLE} / Object.is(x, HUNTER_ROLE) / aliased destructure
    // (B) the in-process SHAPE value as a raw LITERAL in a comparison/assignment (import the constant instead).
    new RegExp(`(===|!==)\\s*${SHAPE_VALUE}`).test(c) || // <field> === "in-process-agent"
    new RegExp(`${SHAPE_VALUE}\\s*(===|!==)`).test(c) || // "in-process-agent" === <field> (reversed)
    new RegExp(`=\\s*${SHAPE_VALUE}\\s*[;,)]`).test(c) // const X = "in-process-agent"; (aliased into a var)
  );
}
function importsVerifier(code) {
  return new RegExp(`require\\([^)]*${VERIFIER}[^)]*\\)`).test(code);
}
// INV-3: every git-head ref-read path (packed + loose/detached) SHA-validates its token.
function gitHeadTokenValidated(src) {
  const packed = /function readPackedRef[\s\S]*?\n}/.exec(src);
  const readHead = /function readGitHead[\s\S]*?\n}/.exec(src);
  const packedOk = !!packed && /\[0-9a-f\]\{7,40\}/.test(packed[0]);
  const looseOk = !!readHead && (readHead[0].match(/\[0-9a-f\]\{7,40\}/g) || []).length >= 2;
  return packedOk && looseOk;
}

function run() {
  const violations = [];
  for (const f of CONSUMERS) {
    let src;
    try { src = read(f); } catch (e) { violations.push({ inv: "CONSUMER", file: f, msg: `unreadable (fail-closed): ${e.message}`, fatal: true }); continue; }
    if (!importsVerifier(src)) violations.push({ inv: "DELEGATE", file: f, msg: `does not import the ${VERIFIER} choke-point — it must consume the shared identity predicates, not re-implement them` });
    if (hasLocalIdentityDecision(src)) violations.push({ inv: "NO-LOCAL-IDENTITY", file: f, msg: "re-implements a lane/hunter-identity DECISION — compares/assigns an identity VALUE ('security_claude_hunter' or 'in-process-agent') outside the verifier. Delegate to provenance-verifier.isHunterRecord/recordMatchesLane; identity is derived from the channel (shape) + contract (role), NEVER a per-record field (SR-016/SR-017)" });
  }
  let gh;
  try { gh = read("scripts/dispatch/git-head.js"); } catch (e) { violations.push({ inv: "INV-3", file: "scripts/dispatch/git-head.js", msg: `unreadable (fail-closed): ${e.message}`, fatal: true }); }
  if (gh && !gitHeadTokenValidated(gh)) violations.push({ inv: "INV-3", file: "scripts/dispatch/git-head.js", msg: "a ref-read path returns a token without hex-SHA validation (R5/R6-BE-001)" });
  return violations;
}

if (require.main === module) {
  const json = process.argv.includes("--json");
  let violations;
  try { violations = run(); } catch (e) { process.stderr.write(`FAIL [${NAME}] fail-closed: ${e.message}\n`); process.exit(2); }
  const fatal = violations.some((v) => v.fatal);
  if (json) process.stdout.write(JSON.stringify({ check: NAME, ok: violations.length === 0, violations }, null, 2) + "\n");
  else if (violations.length === 0) process.stdout.write(`OK   [${NAME}] all ${CONSUMERS.length} lane-identity consumers (${CONSUMERS.map((f) => f.split("/").pop()).join(", ")}) delegate identity to the provenance-verifier choke-point; no local re-implementation, no settable-label identity; git-head SHA-validates every ref-read\n`);
  else process.stderr.write(`FAIL [${NAME}] ${violations.length} drift(s):\n${violations.map((v) => `  - [${v.inv}] ${v.file}: ${v.msg}`).join("\n")}\n`);
  process.exit(violations.length === 0 ? 0 : fatal ? 2 : 1);
}

module.exports = { run, NAME, hasLocalIdentityDecision, importsVerifier, gitHeadTokenValidated };
