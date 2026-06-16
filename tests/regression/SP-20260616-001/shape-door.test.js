#!/usr/bin/env node
"use strict";

/**
 * shape-door.test.js — E-DISPATCH-SHAPE-001 W2-core (SP-20260616-001).
 *
 * Unit gauntlet for dispatch-shape.js#shapeDoor — the ONE shared per-wrapper enforce gate.
 * Planted BOTH modes (β#3 + DoE): report=>advisory+proceed, enforce=>refuse(exit2 at caller),
 * kill-switch overrides enforce, sanctioned lane proceeds+suppressed, resolver-throw=>fail-open,
 * legacy WARPOS_DISPATCH_CONTRACT_ENFORCE back-compat, report-only-pin never refuses, and the
 * conservative property (only HIGH severity refuses; MEDIUM stays advisory even under enforce).
 *
 *   node tests/regression/SP-20260616-001/shape-door.test.js
 */

const assert = require("assert");
const path = require("path");
const { shapeDoor } = require(path.resolve(__dirname, "../../../scripts/dispatch/dispatch-shape.js"));

let passed = 0, failed = 0;
const fails = [];
function test(name, fn) {
  try { fn(); passed++; console.log(`  ok  ${name}`); }
  catch (e) { failed++; fails.push(`${name}: ${e.message}`); console.log(`  FAIL ${name} — ${e.message}`); }
}

// HIGH-severity mismatch: a skill resolves to inline/unproven, dispatched as a subprocess.
const hiUnit = { kind: "skill", id: "scan:full" };
// MEDIUM mismatch: a build-chain builder pushed through the cross-provider path (wrong wrapper, not dangerous).
const medUnit = { kind: "agent", id: "backend-builder" };

test("report-mode-advisory-proceeds", () => {
  const r = shapeDoor("subprocess-claude", hiUnit, {}, {});
  assert.strictEqual(r.action, "proceed");
  assert.strictEqual(r.mode, "report");
  assert.ok(r.mismatch && r.mismatch.mismatch, "the mismatch is surfaced as an advisory");
});

test("enforce-high-severity-refuses", () => {
  const r = shapeDoor("subprocess-claude", hiUnit, { WARPOS_SHAPE_DOOR: "enforce" }, {});
  assert.strictEqual(r.action, "refuse");
  assert.strictEqual(r.mode, "enforce");
  assert.strictEqual(r.severity, "high");
  assert.ok(/shape-door REFUSE/.test(r.reason), "carries a named reason");
});

test("kill-switch-overrides-enforce", () => {
  const r = shapeDoor("subprocess-claude", hiUnit, { WARPOS_SHAPE_DOOR: "enforce", WARPOS_DISABLE_SHAPE_DOOR: "1" }, {});
  assert.strictEqual(r.action, "proceed");
  assert.strictEqual(r.mode, "report", "kill-switch forces report even under enforce");
});

test("sanctioned-lane-proceeds-under-enforce", () => {
  const r = shapeDoor("subprocess-claude", hiUnit, { WARPOS_SHAPE_DOOR: "enforce" }, { sanctioned: true });
  assert.strictEqual(r.action, "proceed");
  assert.strictEqual(r.suppressed, true, "sanctioned lane suppresses the advisory (FIX-A3 preserved)");
});

test("resolver-error-fail-open", () => {
  // A unit whose .kind getter throws propagates out of resolveShape -> shapeMismatch -> the door's catch.
  const boom = { get kind() { throw new Error("boom"); } };
  let threw = false, r;
  try { r = shapeDoor("subprocess-claude", boom, { WARPOS_SHAPE_DOOR: "enforce" }, {}); } catch { threw = true; }
  assert.strictEqual(threw, false, "shapeDoor must NEVER throw — fail-OPEN");
  assert.strictEqual(r.action, "proceed");
  assert.ok(/resolver-threw-fail-open/.test(r.reason), "names the fail-open path");
});

test("enforce-medium-stays-advisory", () => {
  // Conservative: only HIGH severity refuses. A wrong-wrapper MEDIUM mismatch is advisory even under enforce.
  const r = shapeDoor("subprocess-cross-provider", medUnit, { WARPOS_SHAPE_DOOR: "enforce" }, {});
  assert.strictEqual(r.action, "proceed");
  assert.strictEqual(r.severity, "medium");
});

test("legacy-WARPOS_DISPATCH_CONTRACT_ENFORCE-back-compat", () => {
  const legacy = shapeDoor("subprocess-claude", hiUnit, { WARPOS_DISPATCH_CONTRACT_ENFORCE: "block" }, {});
  const modern = shapeDoor("subprocess-claude", hiUnit, { WARPOS_SHAPE_DOOR: "enforce" }, {});
  assert.strictEqual(legacy.action, "refuse", "old var still enforces the shape gate (no silent regression)");
  assert.strictEqual(legacy.action, modern.action, "old var is identical to the new var for the shape gate");
});

test("report-only-pin-never-refuses", () => {
  // dispatch-skill pins this: a high-severity skill mismatch must NOT refuse even under enforce.
  const r = shapeDoor("subprocess-claude", hiUnit, { WARPOS_SHAPE_DOOR: "enforce" }, { reportOnlyPin: true });
  assert.strictEqual(r.action, "proceed");
  assert.strictEqual(r.mode, "report");
});

test("never-throws-on-adversarial-input", () => {
  for (const u of [null, undefined, 7, "x", {}, { kind: "agent" }, { kind: "skill", id: 123 }]) {
    const r = shapeDoor("subprocess-claude", u, {}, {});
    assert.strictEqual(r.action, "proceed", "adversarial input must never block a dispatch");
  }
});

console.log(`\n${failed === 0 ? "PASS" : "FAIL"} — shape-door: ${passed} passed, ${failed} failed`);
if (failed) { console.error("\n" + fails.join("\n")); process.exit(1); }
