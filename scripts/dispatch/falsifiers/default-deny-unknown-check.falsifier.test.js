"use strict";
// FALSIFIER: G4.3 default-deny-unknown-check — record-trust gate Surface 4 (SP-20260720-002 Phase 4, AC-7).
// A result whose name is NOT in the manifest's expected_checks -> `unknown-check-result` (distinct reason).
// MUST-BLOCK.
const test = require("node:test");
const assert = require("node:assert");
const path = require("path");
const fs = require("fs");

const CONTROLLER = path.join(__dirname, "..", "trusted-controller.js");

test("G4.3 default-deny-unknown-check — a result name not in expected_checks MUST-BLOCK (unknown-check-result)", (t) => {
  if (!fs.existsSync(CONTROLLER)) return t.skip("pending backend-builder — controller not yet built (falsifier RED)");
  const ctl = require("../trusted-controller");
  const { manifest, result } = require("./_lib/run-manifest-fixtures");

  const rm = manifest({ expected_checks: ["alpha"], required_checks: ["alpha"] });
  const results = [result("not-a-real-check")];

  const out = ctl.reconcileRunManifest(rm, results);
  assert.strictEqual(out.ok, false);
  assert.strictEqual(out.reason, "unknown-check-result");
  assert.strictEqual(out.offending, "not-a-real-check");
});
