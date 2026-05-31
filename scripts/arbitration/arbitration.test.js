#!/usr/bin/env node
"use strict";

/**
 * Bite-test for the S1.2 arbitration mechanism — proves emit() + the resolver
 * BITE (an enforcer-first guard with no negative test is a false-green waiting
 * to happen). Covers β's ratified design (EVT-s1-2-hard-halt-arbitration-beta-001):
 * per-unit bundling, precedence ordering, fail-closed default, run-end gate.
 *
 *   node scripts/arbitration/arbitration.test.js
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const os = require("os");

const { emit } = require("./emit");
const { collectOpen, bundlePerUnit } = require("./resolver");

let passed = 0;
const failures = [];
function test(name, fn) {
  try {
    fn();
    passed++;
  } catch (e) {
    failures.push(`${name}: ${e.message}`);
  }
}

// 1. emit() produces a schema-shaped decision_record with all required fields.
test("emit produces a valid-shaped decision_record", () => {
  const rec = emit({
    unit: "test-unit-A",
    owner: "test_enforcer",
    decision: "park: design_brief missing",
    rationale: "no design_brief resolves for this unit; cannot judge tokens/hierarchy",
    confidence: 0.3,
    arbitrationNeeded: true,
    artifactPrecedence: 40,
  });
  for (const k of ["type", "id", "decision", "owner", "rationale", "precedence_basis", "confidence", "arbitration_needed"]) {
    assert.ok(rec[k] !== undefined, `required field ${k} present`);
  }
  assert.strictEqual(rec.type, "decision_record");
  assert.strictEqual(rec.arbitration_needed, true);
  assert.ok(fs.existsSync(rec._file === undefined ? path.dirname(require("./emit").STORE) : require("./emit").STORE), "store dir exists");
  // cleanup this record
  try { fs.rmSync(path.join(require("./emit").STORE, "test-unit-A"), { recursive: true, force: true }); } catch {}
});

// 2. FAIL-CLOSED default (β Q2): omitting arbitrationNeeded ⇒ true (uncertain parks).
test("fail-closed default — omitting arbitrationNeeded ⇒ arbitration_needed:true", () => {
  const rec = emit({ unit: "test-unit-B", owner: "e", decision: "d", rationale: "uncertain" });
  assert.strictEqual(rec.arbitration_needed, true, "uncertain ⇒ parked (fail-closed)");
  try { fs.rmSync(path.join(require("./emit").STORE, "test-unit-B"), { recursive: true, force: true }); } catch {}
});

// 3. A CONFIDENT-resolved enforcer must explicitly pass false.
test("explicit arbitrationNeeded:false ⇒ not parked", () => {
  const rec = emit({ unit: "test-unit-C", owner: "e", decision: "d", rationale: "resolved", arbitrationNeeded: false });
  assert.strictEqual(rec.arbitration_needed, false);
  try { fs.rmSync(path.join(require("./emit").STORE, "test-unit-C"), { recursive: true, force: true }); } catch {}
});

// 4. PER-UNIT bundling (β ADR delta) — two enforcers parking the SAME unit bundle together, NOT per-enforcer.
test("bundlePerUnit groups by unit, ordered by precedence DESC", () => {
  const recs = [
    { unit: "u1", owner: "design_quality", decision: "d-design", rationale: "r", confidence: 0.5, arbitration_needed: true, artifact_precedence: 40 },
    { unit: "u1", owner: "build_spec_enforcer", decision: "d-build", rationale: "r", confidence: 0.4, arbitration_needed: true, artifact_precedence: 90 },
    { unit: "u2", owner: "x", decision: "d", rationale: "r", confidence: 0.6, arbitration_needed: true, artifact_precedence: 50 },
  ];
  const b = bundlePerUnit(recs);
  assert.strictEqual(Object.keys(b).length, 2, "two units");
  assert.strictEqual(b.u1.length, 2, "u1 bundles BOTH concerns (per-unit, not per-enforcer)");
  assert.strictEqual(b.u1[0].artifact_precedence, 90, "highest-precedence concern leads the bundle");
  assert.strictEqual(b.u1[1].artifact_precedence, 40, "lower-precedence concern follows");
});

// 5. collectOpen finds OPEN records and skips resolved ones (the run-end gate's input).
test("collectOpen returns open, skips resolved", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "arb-test-"));
  const u = path.join(tmp, "unit-x");
  fs.mkdirSync(u, { recursive: true });
  fs.writeFileSync(path.join(u, "a.json"), JSON.stringify({ type: "decision_record", id: "a", unit: "unit-x", decision: "d", owner: "o", rationale: "r", precedence_basis: "n/a", confidence: 0.2, arbitration_needed: true, resolved: false }));
  fs.writeFileSync(path.join(u, "b.json"), JSON.stringify({ type: "decision_record", id: "b", unit: "unit-x", decision: "d", owner: "o", rationale: "r", precedence_basis: "n/a", confidence: 0.9, arbitration_needed: true, resolved: true }));
  const open = collectOpen(tmp);
  assert.strictEqual(open.length, 1, "1 open (resolved one skipped)");
  assert.strictEqual(open[0].id, "a");
  fs.rmSync(tmp, { recursive: true, force: true });
});

// 6. Empty store ⇒ ship-ready (the gate clears when nothing is parked).
test("empty store ⇒ no open records (ship-ready)", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "arb-empty-"));
  assert.strictEqual(collectOpen(tmp).length, 0);
  fs.rmSync(tmp, { recursive: true, force: true });
});

if (failures.length) {
  process.stderr.write(`arbitration bite-test: ${passed} passed, ${failures.length} FAILED\n`);
  for (const f of failures) process.stderr.write(`  - ${f}\n`);
  process.exit(1);
}
process.stdout.write(`arbitration bite-test: ${passed}/${passed} passed (emit shape + fail-closed default + per-unit precedence bundling + run-end gate input)\n`);
process.exit(0);
