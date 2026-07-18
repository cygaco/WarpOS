#!/usr/bin/env node
"use strict";
/**
 * Self-verifying teeth for the STRUCTURAL choke-point guard (SP-20260718-003, α round-6 ruling). The guard
 * is only a class-CLOSE if it catches every equivalent spelling of a re-introduced leak — so each detector
 * is proven against R6-BE-002's exact fragility list (reversed operands, renamed callback vars, the
 * sanctioned_lane_id settable-label vector) AND the live guard is asserted GREEN on the refactored consumers.
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

// ── NO-SETTABLE-LABEL: sanctioned_lane_id (SR-017), via (SR-016), record_via — any operand order/var name. ──
test("catches sanctioned_lane_id identity (SR-017), authored order", () => {
  assert.equal(g.hasSettableLabelIdentity(`m = recs.find(r => r.sanctioned_lane_id === HUNTER && r.shape === S);`), true);
});
test("catches sanctioned_lane_id identity, REVERSED operands (R6-BE-002)", () => {
  assert.equal(g.hasSettableLabelIdentity(`m = recs.find(r => HUNTER === r.sanctioned_lane_id);`), true);
});
test("catches via identity with a RENAMED callback variable (R6-BE-002)", () => {
  assert.equal(g.hasSettableLabelIdentity(`m = recs.find(record => record.via === "epsilon-agent");`), true);
  assert.equal(g.hasSettableLabelIdentity(`m = recs.find(x => x.record_via === "inprocess");`), true);
});
test("clean: no settable-label comparison", () => {
  assert.equal(g.hasSettableLabelIdentity(`m = recs.find(r => pv.isHunterRecord(r) && r.output_digest);`), false);
});

// ── NO-LOCAL-IDENTITY: a RECORD .shape==='in-process-agent' comparison (either order). ──
test("catches a local shape-identity re-implementation, authored + reversed order", () => {
  assert.equal(g.hasLocalShapeIdentity(`if (r.shape === "in-process-agent") ...`), true);
  assert.equal(g.hasLocalShapeIdentity(`if ("in-process-agent" === rec.shape) ...`), true);
});
test("clean: a shape object-LITERAL assignment is not a comparison; a pv delegate is clean", () => {
  assert.equal(g.hasLocalShapeIdentity(`return { shape: "in-process-agent", role: HUNTER };`), false);
  assert.equal(g.hasLocalShapeIdentity(`if (pv.recordMatchesLane(r, contract, prov)) ...`), false);
});

// ── DELEGATE: a consumer must import the verifier. ──
test("importsVerifier: detects the require", () => {
  assert.equal(g.importsVerifier(`const pv = require("../dispatch/provenance-verifier");`), true);
  assert.equal(g.importsVerifier(`const pv = require(path.join(x, "dispatch", "provenance-verifier"));`), true);
  assert.equal(g.importsVerifier(`const x = require("./something-else");`), false);
});

// ── INV-3 (git-head): every ref-read path SHA-validates (multi-line function bodies). ──
test("INV-3: flags a readPackedRef that does NOT SHA-validate", () => {
  const leak = ["function readGitHead(root) {", "  if (/^[0-9a-f]{7,40}$/i.test(x)) return x;", "  if (/^[0-9a-f]{7,40}$/i.test(y)) return y;", "}", "function readPackedRef(p, ref) {", "  return t.slice(0, sp);", "}"].join("\n");
  assert.equal(g.gitHeadTokenValidated(leak), false);
});
test("INV-3: a fully SHA-validating git-head is clean", () => {
  const clean = ["function readGitHead(root) {", "  if (/^[0-9a-f]{7,40}$/i.test(x)) return x;", "  if (/^[0-9a-f]{7,40}$/i.test(y)) return y;", "}", "function readPackedRef(p, ref) {", "  const s = t.slice(0, sp);", "  return /^[0-9a-f]{7,40}$/i.test(s) ? s : '';", "}"].join("\n");
  assert.equal(g.gitHeadTokenValidated(clean), true);
});

// ── the LIVE guard: the refactored consumers delegate to the choke-point → ZERO violations. ──
test("live: cert-attest + dispatch-review delegate identity to the verifier (0 violations)", () => {
  const v = g.run();
  assert.equal(v.length, 0, `guard must be green on the refactored consumers: ${v.map((x) => `[${x.inv}] ${x.file}: ${x.msg}`).join(" | ")}`);
});

if (failures.length) {
  process.stderr.write(`FAIL [provenance-invariants.test] ${failures.length} failure(s):\n${failures.map((f) => `  - ${f}`).join("\n")}\n`);
  process.exit(1);
}
process.stdout.write(`OK   [provenance-invariants.test] ${passed} passed (order/name-independent; catches sanctioned_lane_id + reversed + renamed; live consumers delegate)\n`);
