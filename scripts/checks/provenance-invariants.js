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
 *   (b) re-implements a hunter-identity check locally — the identity VALUE ('security_claude_hunter' /
 *       'in-process-agent') compared/assigned in any named form (literal, HUNTER_ROLE ref, either order), OR
 *   (c) keys identity on ANY settable per-record label — a `.via` / `.record_via` / `.sanctioned_lane_id`
 *       comparison (either operand order, any variable name), OR
 *   (d) reads the RECORD's `.role` field for an identity DECISION (member/computed/destructure/alias) —
 *       the R6-BE-002 .role-ACCESS hardening (β DECIDE B/0.88), which catches the runtime-value-reconstruction
 *       evasion (`role === [...].join("_")`) that no VALUE-detector — regex OR full-AST — can bound.
 * Plus INV-3: git-head.js SHA-validates every ref-read path. The check is order/name-independent (R6-BE-002's
 * fragility list is its test set), not a brittle single-spelling grep.
 *
 * HONEST CEILING (do NOT re-inflate this to a "delegation-COMPLETE / self-detecting" completeness claim — the
 * gpt binding-FAIL that forced this rescope was precisely that dishonest overclaim): this guard flags the
 * COMMON static identity re-implementation forms — the identity VALUE named in any form, and the record's
 * .role read via member / reversed / computed / destructure / alias / Object.is / switch. It does NOT claim to
 * catch EVERY static form (a novel syntactic wrapper can evade any regex), and it CANNOT catch a fully-computed
 * runtime obfuscator that reads identity without naming either (e.g. `Object.entries(rec).find(([k,v]) => v ===
 * <reconstructed>)`) — not statically decidable in a dynamic language. A full AST/dataflow parser is tracked
 * DEFERRED debt (ED-229). (β P-061 honest-ceiling; ADR-0024.)
 *
 * *** ED-231 RESOLVED (2026-07-18, ADR-0025 origin-proof) — WITHIN a NAMED boundary. *** History: the prior
 * claim "the live evidence layer is the real protection" was REFUTED + reproduced — a HAND-AUTHORED ledger
 * record with the right fields ATTESTED because `cert-attest` validated record FIELDS but not WRITER ORIGIN.
 * FIX (ADR-0025): the single shared writer signs the canonical identity fields with a per-session HMAC secret;
 * `cert-attest.attestLane` verifies the signature FIRST, so an unsigned/forged record is NOT attested (the
 * reproduced forgery now fails-closed; teeth in cert-attest-panel.test). So the evidence layer IS the real
 * protection AGAIN — but ONLY WITHIN the named same-user boundary: a same-user FS-READ adversary can read the
 * secret + re-sign (the machine/account ceiling; ADR-0025). Origin-proof converts forgery from MISTAKE-REACHABLE
 * to REQUIRES-DELIBERATE-INTENT. The R6 residual is inert against the MISTAKE class; the deliberate-intent case
 * is the NAMED account ceiling, not a silent false-green. Do NOT re-inflate to an UNQUALIFIED "always the real
 * protection" — it holds WITHIN the ADR-0025 boundary, which is explicitly bounded, not absolute.
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
// provenance-verifier.isSanctionedHunterLane (structural laneId+provider+shape), so it is a full CONSUMER; the
// guard covers the COMMON static identity re-implementation forms across the lane-identity consumers — value-named AND .role-access
// (not enumerate-the-known-callers). It is NOT a completeness claim: the undecidable runtime-reconstruction
// residual is named in the header HONEST CEILING and defended by the live binding-evidence layer.
const CONSUMERS = ["scripts/checks/cert-attest.js", "scripts/dispatch-review.js", "scripts/dispatch/panel-lanes.js"];
const VERIFIER = "provenance-verifier";
// INV-4 (R5-MEDIUM-01, SP-20260719-001) — the SERVED-MODEL choke-point enforcer. The runtime consolidation
// (attestLane + buildObserved both call pv.servedModelUnverifiableFromRecord) was CONVENTION, not enforced — a
// FUTURE ledger reader with an inline `record/lane.provider === "antigravity"` served-model check would import
// the verifier (passing the identity invariants) yet bypass the served-model choke-point undetected, so the
// R3-CRITICAL-02 sibling-reader class could RECUR. This makes the choke-point STRUCTURAL for the ledger
// readers. SCOPED to the RECORD readers only: cert-attest's evaluateAttestation is a RAW-CLI LOG evaluator (a
// different evidence class — it decides on the `providerId` PARAM + the log output, NOT a ledger record's
// `.provider`), so its inline `providerId === "antigravity"` §7 honest-ceiling is PERMITTED by construction
// (it never touches a record's `.provider` member). panel-lanes.js is a structural-validation consumer (profile
// set computation), not a served-model reader, so it is NOT in this set.
const SERVED_MODEL_READERS = ["scripts/checks/cert-attest.js", "scripts/dispatch-review.js"];
const SERVED_MODEL_CHOKEPOINT = "servedModelUnverifiableFromRecord";

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}
function stripComments(src) {
  return src.replace(/^\s*\*.*$/gm, "").replace(/\/\/.*$/gm, "");
}

// ── PURE detectors (injectable content → boolean) — order/name-independent (R6-BE-002-robust). ──

// IDENTITY-VALUE detector (β round-6 catch; NOT a completeness claim): a hunter/lane-identity DECISION requires one of the
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
//     names it — it delegates to pv.isHunterRecord/isSanctionedHunterLane. So it is flagged in its COMMON naming
//     forms: the raw literal AND any reference to pv's `HUNTER_ROLE` export (member `pv.HUNTER_ROLE`, a destructured
//     `const {HUNTER_ROLE}=pv`, an `Object.is(x, HUNTER_ROLE)`, or a renamed alias whose destructure line
//     still names HUNTER_ROLE). This is NOT a completeness claim: a role RECONSTRUCTED at runtime (join/concat/
//     char-codes), or named in a syntactic shape these context rules don't match, is NOT caught — the honest
//     static ceiling, defended by the origin-proof evidence layer (ADR-0025), not this detector.
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
// R6-BE-002 (β DECIDE B/0.88 — the .role-ACCESS structural hardening): the value-detector above is
// bounded by the identity VALUE, which a runtime reconstruction (join/concat/char-codes) defeats — an
// unbounded chase no regex OR full-AST value-analysis wins. β's inversion: detect the record's `.role`
// ACCESS instead of the role VALUE. A COMPLETE hunter-identity decision MUST READ the record's role
// (isHunterRecord needs provider+shape+ROLE); honest consumers NEVER read a record's `.role` — they
// delegate to pv.isHunterRecord/recordMatchesLane/isSanctionedHunterLane (verified: zero `.role`
// decisions in the three consumers; the ONLY record.role reads live in the verifier, which is NOT a
// CONSUMER so it is exempt BY CONSTRUCTION — TEETH-1 module-identity scope, not a settable flag). The
// gpt-demonstrated evasion `record.role === [...].join("_")` READS `.role`, so this catches it while the
// value-reconstruction is irrelevant. Forms caught (TEETH-3): member comparison, reversed, computed
// `["role"]`, destructure `{role}=<record>`, and alias `const x = rec.role`. NOT flagged (TEETH-2):
// `contract.role` in a MESSAGE string (no comparison adjacent) and an opts-param destructure
// `{...role...} = {}` (RHS is an object literal, not a record identifier). The HONEST CEILING (rescoped
// claim below): a fully-computed field scan (`Object.entries(rec).find(([k,v]) => v === recon)`) reads
// identity WITHOUT naming `.role` and is NOT statically decidable — that residual is defended by the LIVE
// binding layer (same-run evidence-digest + code_sha + panel_run_id attestation), tracked as deferred
// AST/dataflow debt. This guard does NOT claim to catch it; the runtime layer (origin-proof-signed evidence,
// ADR-0025) is the real protection WITHIN the named same-user boundary.
function readsRecordRoleForDecision(code) {
  const c = stripComments(code);
  return (
    /\.role\s*\)?\s*(===|!==|==|!=)/.test(c) || // X.role === ...  AND  (X.role) === ... (parenthesized)
    /(===|!==|==|!=)\s*\(?\s*[A-Za-z_$][\w$.[\]"']*\.role\b/.test(c) || // ... === X.role  /  === (X.role) (reversed)
    /\[\s*["']role["']\s*\]\s*\)?\s*(===|!==|==|!=)/.test(c) || // X["role"] === ... (computed)
    /(===|!==|==|!=)\s*\(?\s*[A-Za-z_$][\w$.[\]"']*\[\s*["']role["']\s*\]/.test(c) || // ... === X["role"]
    /Object\.is\(\s*[^)]*(\.role\b|\[\s*["']role["']\s*\])/.test(c) || // Object.is(X.role, y) / Object.is(X["role"], y)
    /switch\s*\(\s*[^)]*(\.role\b|\[\s*["']role["']\s*\])/.test(c) || // switch (X.role) { case HUNTER: ... }
    /(?:const|let|var)\s+\{[^}]*\brole\b[^}]*\}\s*=\s*[A-Za-z_$]/.test(c) || // const {role} = <identifier>
    /(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*=\s*\(?\s*[A-Za-z_$][\w$.[\]]*\.role\b/.test(c) // const x = Y.role (alias)
  );
}
function importsVerifier(code) {
  return new RegExp(`require\\([^)]*${VERIFIER}[^)]*\\)`).test(code);
}
// INV-4a: a served-model ledger reader must INVOKE the choke-point (a CALL — open paren — not a bare mention
// in prose). If a reader file stops calling it, the fail-close either reverted to an inline check or vanished.
function invokesServedModelChokePoint(code) {
  return new RegExp(`${SERVED_MODEL_CHOKEPOINT}\\s*\\(`).test(stripComments(code));
}
// INV-4b: a served-model ledger reader must NOT re-implement the agy fail-close as an inline check on a
// RECORD/LANE's `.provider` MEMBER (the exact R3-CRITICAL-02 form: `l.provider === "antigravity"`). Keyed on
// the `.provider` member access compared to "antigravity" (either order) — this EXEMPTS the raw-CLI evaluator's
// `providerId === "antigravity"` (a bare param, no `.provider` member) so the §7 log honest-ceiling stays
// permitted BY CONSTRUCTION. HONEST CEILING (consistent with this file's other detectors): a runtime-
// reconstructed provider value or a differently-named field evades any regex — the same static ceiling as the
// identity detectors, backed by the reader-set enumeration + the live binding layer; a fully-computed evasion
// is deferred AST debt (ED-229 class), not a claimed catch.
function hasInlineAgyRecordProviderCheck(code) {
  const c = stripComments(code);
  return (
    /\.provider\s*(===|!==|==|!=)\s*["']antigravity["']/.test(c) || // X.provider === "antigravity"
    /["']antigravity["']\s*(===|!==|==|!=)\s*[A-Za-z_$][\w$.[\]"']*\.provider\b/.test(c) // "antigravity" === X.provider (reversed)
  );
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
    // R6-BE-002 (.role-ACCESS hardening): catches the runtime-reconstruction evasion the value-detector
    // misses — a consumer reading the RECORD's role field for a decision (isHunterRecord needs the role,
    // and honest consumers delegate). Bounded by the ACCESS, not the value.
    if (readsRecordRoleForDecision(src)) violations.push({ inv: "NO-RECORD-ROLE-DECISION", file: f, msg: "reads a record's .role field for an identity DECISION (member/computed/destructure/alias) outside the verifier — a COMPLETE hunter-identity decision requires the record's role, and honest consumers delegate to provenance-verifier.isHunterRecord/recordMatchesLane. This catches the value-reconstruction evasion (role assembled at runtime via join/concat/char-codes) that a value-only detector misses (R6-BE-002). A fully-computed field scan that never names .role is the honest static ceiling — defended by the live binding-evidence layer, not this guard." });
  }
  // INV-4 (R5-MEDIUM-01): the served-model ledger readers must route the agy fail-close through the ONE
  // choke-point, with no inline record/lane `.provider === "antigravity"` re-implementation (the raw-CLI §7
  // evaluator's `providerId` param check is exempt by construction — see hasInlineAgyRecordProviderCheck).
  for (const f of SERVED_MODEL_READERS) {
    let src;
    try { src = read(f); } catch (e) { violations.push({ inv: "SERVED-MODEL-READER", file: f, msg: `unreadable (fail-closed): ${e.message}`, fatal: true }); continue; }
    if (!invokesServedModelChokePoint(src)) violations.push({ inv: "SERVED-MODEL-CHOKEPOINT", file: f, msg: `a served-model ledger reader that does not invoke pv.${SERVED_MODEL_CHOKEPOINT} — the agy served-model fail-close MUST route through the ONE choke-point, never an inline check (R3-CRITICAL-02 sibling-reader class: attestLane closed attestPanelRun but buildObserved re-implemented the trust inline and greened the panel-3lab binding)` });
    if (hasInlineAgyRecordProviderCheck(src)) violations.push({ inv: "NO-INLINE-AGY-SERVED-MODEL", file: f, msg: `re-implements the agy served-model fail-close as an inline record/lane '.provider === "antigravity"' check — delegate to pv.${SERVED_MODEL_CHOKEPOINT}. The raw-CLI §7 evaluator (providerId PARAM, not a record's .provider) is exempt by construction` });
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
  else if (violations.length === 0) process.stdout.write(`OK   [${NAME}] all ${CONSUMERS.length} lane-identity consumers (${CONSUMERS.map((f) => f.split("/").pop()).join(", ")}) delegate identity to the provenance-verifier choke-point; no STATIC identity re-implementation (value-named), no consumer read of a record's .role for a decision, no settable-label identity; git-head SHA-validates every ref-read. HONEST CEILING: a fully-computed runtime obfuscator (never naming the value or .role) is not statically decidable — defended by the live same-run binding-evidence layer (ADR-0024 + deferred ED-229), NOT this static guard\n`);
  else process.stderr.write(`FAIL [${NAME}] ${violations.length} drift(s):\n${violations.map((v) => `  - [${v.inv}] ${v.file}: ${v.msg}`).join("\n")}\n`);
  process.exit(violations.length === 0 ? 0 : fatal ? 2 : 1);
}

module.exports = { run, NAME, hasLocalIdentityDecision, readsRecordRoleForDecision, importsVerifier, gitHeadTokenValidated, invokesServedModelChokePoint, hasInlineAgyRecordProviderCheck };
