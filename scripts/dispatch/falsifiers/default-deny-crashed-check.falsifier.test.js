"use strict";
// FALSIFIER: G4.3 default-deny-crashed-check — record-trust gate Surface 4 (SP-20260720-002 Phase 4,
// AC-7). A `status:"fail"` result (a check that ran and genuinely failed / crashed-to-fail per check-lib's
// own fail-closed contract) -> `check-failed` (distinct reason). MUST-BLOCK.
const test = require("node:test");
const assert = require("node:assert");
const path = require("path");
const fs = require("fs");

const CONTROLLER = path.join(__dirname, "..", "trusted-controller.js");

test("G4.3 default-deny-crashed-check — status:fail MUST-BLOCK (check-failed)", (t) => {
  if (!fs.existsSync(CONTROLLER)) return t.skip("pending backend-builder — controller not yet built (falsifier RED)");
  const ctl = require("../trusted-controller");
  const { manifest, result } = require("./_lib/run-manifest-fixtures");

  const rm = manifest({ expected_checks: ["alpha"], required_checks: ["alpha"] });
  const out = ctl.reconcileRunManifest(rm, [result("alpha", { status: "fail", reason: "check-threw" })]);
  assert.strictEqual(out.ok, false);
  assert.strictEqual(out.reason, "check-failed");
  assert.strictEqual(out.offending, "alpha");
});
