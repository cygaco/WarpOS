"use strict";
// FALSIFIER: G4.3 default-deny-skipped-required-check — record-trust gate Surface 4 (SP-20260720-002 Phase
// 4, AC-7). A `status:"skipped"` result on a REQUIRED check -> `required-check-skipped` (distinct reason).
// A skip on a NON-required (optional) check is legitimate and does NOT block — asserted here too, so the
// distinction is proven, not assumed. MUST-BLOCK (required) / PASS (optional).
const test = require("node:test");
const assert = require("node:assert");
const path = require("path");
const fs = require("fs");

const CONTROLLER = path.join(__dirname, "..", "trusted-controller.js");

test("G4.3 default-deny-skipped-required-check — a REQUIRED check skipped MUST-BLOCK; an OPTIONAL check skipped does not", (t) => {
  if (!fs.existsSync(CONTROLLER)) return t.skip("pending backend-builder — controller not yet built (falsifier RED)");
  const ctl = require("../trusted-controller");
  const { manifest, result } = require("./_lib/run-manifest-fixtures");

  // REQUIRED skip -> MUST-BLOCK.
  const rmRequired = manifest({ expected_checks: ["alpha"], required_checks: ["alpha"] });
  const outRequired = ctl.reconcileRunManifest(rmRequired, [result("alpha", { status: "skipped" })]);
  assert.strictEqual(outRequired.ok, false);
  assert.strictEqual(outRequired.reason, "required-check-skipped");
  assert.strictEqual(outRequired.offending, "alpha");

  // OPTIONAL skip (expected but NOT in required_checks) -> legitimate, does not block.
  const rmOptional = manifest({ expected_checks: ["alpha", "gamma"], required_checks: ["alpha"] });
  const outOptional = ctl.reconcileRunManifest(rmOptional, [result("alpha"), result("gamma", { status: "skipped" })]);
  assert.strictEqual(outOptional.ok, true, JSON.stringify(outOptional));
});
