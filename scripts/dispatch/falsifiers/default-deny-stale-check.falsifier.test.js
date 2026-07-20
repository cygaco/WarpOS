"use strict";
// FALSIFIER: G4.3 default-deny-stale-check — record-trust gate Surface 4 (SP-20260720-002 Phase 4, AC-7).
// A result whose nonce != the manifest's minted nonce -> `stale-check-result` (distinct reason). This is
// the anti-stale-evidence fence: presence alone never passes; a nonce-fresh FIRED result is required.
// MUST-BLOCK.
const test = require("node:test");
const assert = require("node:assert");
const path = require("path");
const fs = require("fs");

const CONTROLLER = path.join(__dirname, "..", "trusted-controller.js");

test("G4.3 default-deny-stale-check — a result whose nonce != the manifest's nonce MUST-BLOCK (stale-check-result)", (t) => {
  if (!fs.existsSync(CONTROLLER)) return t.skip("pending backend-builder — controller not yet built (falsifier RED)");
  const ctl = require("../trusted-controller");
  const { manifest, result } = require("./_lib/run-manifest-fixtures");

  const rm = manifest({ expected_checks: ["alpha"], required_checks: ["alpha"] });
  const results = [result("alpha", { nonce: "a-different-stale-nonce" })];

  const out = ctl.reconcileRunManifest(rm, results);
  assert.strictEqual(out.ok, false);
  assert.strictEqual(out.reason, "stale-check-result");
  assert.strictEqual(out.offending, "alpha");
});
