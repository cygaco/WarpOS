"use strict";
// FALSIFIER: G4.3 default-deny-duplicate-check — record-trust gate Surface 4 (SP-20260720-002 Phase 4,
// AC-7). More than one result for the SAME check name -> `duplicate-check-result` (distinct reason).
// MUST-BLOCK.
const test = require("node:test");
const assert = require("node:assert");
const path = require("path");
const fs = require("fs");

const CONTROLLER = path.join(__dirname, "..", "trusted-controller.js");

test("G4.3 default-deny-duplicate-check — >1 result for one check name MUST-BLOCK (duplicate-check-result)", (t) => {
  if (!fs.existsSync(CONTROLLER)) return t.skip("pending backend-builder — controller not yet built (falsifier RED)");
  const ctl = require("../trusted-controller");
  const { manifest, result } = require("./_lib/run-manifest-fixtures");

  const rm = manifest({ expected_checks: ["alpha"], required_checks: ["alpha"] });
  const results = [result("alpha"), result("alpha")]; // duplicated

  const out = ctl.reconcileRunManifest(rm, results);
  assert.strictEqual(out.ok, false);
  assert.strictEqual(out.reason, "duplicate-check-result");
  assert.strictEqual(out.offending, "alpha");
});
