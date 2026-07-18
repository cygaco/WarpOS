#!/usr/bin/env node
"use strict";
/**
 * Self-verifying teeth for the STRUCTURAL choke-point guard (SP-20260718-003, α round-6 + β teeth-4). The
 * guard is delegation-COMPLETE: it flags a consumer that decides lane/hunter identity from ANY record field
 * by catching the identity VALUE ("security_claude_hunter" / "in-process-agent") in a comparison/assignment
 * — NOT a hardcoded label-field list (which recreated the SR-017 blind spot). Proven against β's exact
 * evasion probes (aliased var, renamed/new field, label-only, reversed operands) AND green on the consumers.
 *
 *   node scripts/checks/provenance-invariants.test.js
 */
const assert = require("assert");
const g = require("./provenance-invariants");

let passed = 0;
const failures = [];
function test(name, fn) {
  try { fn(); passed++; } catch (e) { failures.push(`${name}: ${e.message}`); }
}

// ── β evasion probes: EVERY re-implementation that decides identity must be caught, regardless of field. ──
test("catches the SR-017 label-only vector — sanctioned_lane_id, NO .shape in sight", () => {
  assert.equal(g.hasLocalIdentityDecision(`m = recs.find(r => r.sanctioned_lane_id === "security_claude_hunter");`), true);
});
test("catches a NEW/renamed label field (blocklist would miss it)", () => {
  assert.equal(g.hasLocalIdentityDecision(`if (r.record_source === "security_claude_hunter") ok = true;`), true);
  assert.equal(g.hasLocalIdentityDecision(`if (rec.lane_marker === "in-process-agent") ...`), true);
});
test("catches an ALIASED var (const s = r.field; s === value)", () => {
  const code = `const s = r.sanctioned_lane_id;\nif (s === "security_claude_hunter") accept();`;
  assert.equal(g.hasLocalIdentityDecision(code), true);
});
test("catches a local const holding the identity value (to compare via the const)", () => {
  assert.equal(g.hasLocalIdentityDecision(`const HUNTER = "security_claude_hunter";`), true);
});
test("catches REVERSED operands", () => {
  assert.equal(g.hasLocalIdentityDecision(`if ("in-process-agent" === rec.shape) ...`), true);
  assert.equal(g.hasLocalIdentityDecision(`if ("security_claude_hunter" === r.role) ...`), true);
});
test("clean: a pv delegate has no local identity decision", () => {
  assert.equal(g.hasLocalIdentityDecision(`m = recs.find(r => pv.isHunterRecord(r) && r.output_digest);`), false);
});
test("clean: the identity value inside a DIAGNOSTIC message string is NOT a decision", () => {
  assert.equal(g.hasLocalIdentityDecision(`reason: "no same-run in-process HUNTER record (shape in-process-agent + role security_claude_hunter, with evidence)"`), false);
});

// ── R6-BE-002 (ADR-0022): the HARDENED detector catches the constant-ref / Object.is / destructuring
//    role-evasions the string-literal regex missed. The hunter ROLE value is flagged in EVERY form. ──
test("R6-BE-002: a constant-ref to the role (=== pv.HUNTER_ROLE) is flagged (regex-evasion closed)", () => {
  assert.equal(g.hasLocalIdentityDecision(`if (rec.role === pv.HUNTER_ROLE) accept();`), true);
});
test("R6-BE-002: Object.is with the role constant is flagged", () => {
  assert.equal(g.hasLocalIdentityDecision(`if (Object.is(rec.role, HUNTER_ROLE)) accept();`), true);
});
test("R6-BE-002: a destructured role constant (const {HUNTER_ROLE}=pv) is flagged", () => {
  assert.equal(g.hasLocalIdentityDecision(`const { HUNTER_ROLE } = pv;\nif (r.role === HUNTER_ROLE) ok();`), true);
});
test("R6-BE-002: a renamed destructure whose line still names HUNTER_ROLE is flagged", () => {
  assert.equal(g.hasLocalIdentityDecision(`const { HUNTER_ROLE: R } = require("./provenance-verifier");\nif (r.role === R) ok();`), true);
});
// ── R6-BE-002 carve-out (SR-020 compatibility): a SHAPE-constant ref for manifest/lane validation is NOT a
//    hunter-identity decision (a shape-only check needs no role) — it must stay CLEAN so panel-lanes delegates. ──
test("R6-BE-002 carve-out: a shape-constant ref (lane.shape === IN_PROCESS_SHAPE) is CLEAN (manifest validation)", () => {
  assert.equal(g.hasLocalIdentityDecision(`if (lane.shape === IN_PROCESS_SHAPE) violations.push(...);`), false);
  assert.equal(g.hasLocalIdentityDecision(`const expectShape = provider === "claude" ? pv.IN_PROCESS_SHAPE : pv.CROSS_PROVIDER_SHAPE;`), false);
});

// ── DELEGATE: a consumer must import the verifier. ──
test("importsVerifier: detects the require (relative + path.join)", () => {
  assert.equal(g.importsVerifier(`const pv = require("../dispatch/provenance-verifier");`), true);
  assert.equal(g.importsVerifier(`const pv = require(path.join(x, "dispatch", "provenance-verifier"));`), true);
  assert.equal(g.importsVerifier(`const x = require("./something-else");`), false);
});

// ── INV-3 (git-head): every ref-read path SHA-validates (kept SEPARATE from the identity invariant). ──
test("INV-3: flags a readPackedRef that does NOT SHA-validate", () => {
  const leak = ["function readGitHead(root) {", "  if (/^[0-9a-f]{7,40}$/i.test(x)) return x;", "  if (/^[0-9a-f]{7,40}$/i.test(y)) return y;", "}", "function readPackedRef(p, ref) {", "  return t.slice(0, sp);", "}"].join("\n");
  assert.equal(g.gitHeadTokenValidated(leak), false);
});
test("INV-3: a fully SHA-validating git-head is clean", () => {
  const clean = ["function readGitHead(root) {", "  if (/^[0-9a-f]{7,40}$/i.test(x)) return x;", "  if (/^[0-9a-f]{7,40}$/i.test(y)) return y;", "}", "function readPackedRef(p, ref) {", "  const s = t.slice(0, sp);", "  return /^[0-9a-f]{7,40}$/i.test(s) ? s : '';", "}"].join("\n");
  assert.equal(g.gitHeadTokenValidated(clean), true);
});

// ── the LIVE guard: the refactored consumers delegate → ZERO violations (its own falsifiability: seeded
//    re-implementations above FAIL the detector; the live run is GREEN). ──
test("live: cert-attest + dispatch-review delegate identity to the verifier (0 violations)", () => {
  const v = g.run();
  assert.equal(v.length, 0, `guard must be green on the delegated consumers: ${v.map((x) => `[${x.inv}] ${x.file}: ${x.msg}`).join(" | ")}`);
});

if (failures.length) {
  process.stderr.write(`FAIL [provenance-invariants.test] ${failures.length} failure(s):\n${failures.map((f) => `  - ${f}`).join("\n")}\n`);
  process.exit(1);
}
process.stdout.write(`OK   [provenance-invariants.test] ${passed} passed (delegation-COMPLETE: catches label-only + aliased + new-field + reversed; message-string safe; live consumers delegate)\n`);
