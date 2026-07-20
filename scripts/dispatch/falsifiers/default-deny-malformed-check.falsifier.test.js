"use strict";
// FALSIFIER: G4.3 default-deny-malformed-check — record-trust gate Surface 4 (SP-20260720-002 Phase 4,
// AC-7). A result missing status/digest or with the wrong shape -> `malformed-check-result` (distinct
// reason). MUST-BLOCK, across several concrete malformations.
const test = require("node:test");
const assert = require("node:assert");
const path = require("path");
const fs = require("fs");

const CONTROLLER = path.join(__dirname, "..", "trusted-controller.js");

test("G4.3 default-deny-malformed-check — missing digest / missing status / non-string digest MUST-BLOCK (malformed-check-result)", (t) => {
  if (!fs.existsSync(CONTROLLER)) return t.skip("pending backend-builder — controller not yet built (falsifier RED)");
  const ctl = require("../trusted-controller");
  const { manifest, result, NONCE } = require("./_lib/run-manifest-fixtures");

  const rm = manifest({ expected_checks: ["alpha"], required_checks: ["alpha"] });

  const malformations = [
    { ...result("alpha"), digest: undefined },
    { ...result("alpha"), status: undefined },
    { ...result("alpha"), digest: 12345 },
    { name: "alpha", status: "pass", nonce: NONCE }, // no digest field at all
  ];
  for (const m of malformations) {
    const out = ctl.reconcileRunManifest(rm, [m]);
    assert.strictEqual(out.ok, false, JSON.stringify(m));
    assert.strictEqual(out.reason, "malformed-check-result", JSON.stringify(m));
  }

  // A recognized-but-unenumerated status string (not pass/fail/skipped/timeout) surfaces at the coverage
  // loop as malformed too (defense-in-depth — check-lib itself already only emits the 4 valid statuses,
  // but the controller's OWN reconcile must never silently treat an unrecognized status as a pass).
  const out2 = ctl.reconcileRunManifest(rm, [result("alpha", { status: "banana" })]);
  assert.strictEqual(out2.ok, false);
  assert.strictEqual(out2.reason, "malformed-check-result");
  assert.strictEqual(out2.offending, "alpha");
});
