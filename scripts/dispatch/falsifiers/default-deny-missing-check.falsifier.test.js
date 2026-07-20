"use strict";
// FALSIFIER: G4.3 default-deny-missing-check — record-trust gate Surface 4 (SP-20260720-002 Phase 4, AC-7).
// An expected check with NO result at all -> `missing-required-check`, the ONE distinct reason for this
// mode (not a shared `not-authorized`). MUST-BLOCK.
const test = require("node:test");
const assert = require("node:assert");
const path = require("path");
const fs = require("fs");

const CONTROLLER = path.join(__dirname, "..", "trusted-controller.js");

test("G4.3 default-deny-missing-check — an expected check with no result MUST-BLOCK (missing-required-check)", (t) => {
  if (!fs.existsSync(CONTROLLER)) return t.skip("pending backend-builder — controller not yet built (falsifier RED)");
  const ctl = require("../trusted-controller");
  const { manifest, result } = require("./_lib/run-manifest-fixtures");

  const rm = manifest({ expected_checks: ["alpha", "beta"], required_checks: ["alpha", "beta"] });
  const results = [result("alpha")]; // "beta" never produced a result at all

  const out = ctl.reconcileRunManifest(rm, results);
  assert.strictEqual(out.ok, false);
  assert.strictEqual(out.reason, "missing-required-check");
  assert.strictEqual(out.offending, "beta");
});
