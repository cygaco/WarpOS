"use strict";
// FALSIFIER: AC-F4 target-mismatch / re-correlation — record-trust gate (SP-20260718-005), surface acceptance-record-at-integration.
// Adversarial: a VALID, content-addressed AcceptanceRecord produced for target A is presented to integrate target B
// (the SHARP-2(a) re-correlation attack — closes ED-232's residual at INTEGRATION stakes). MUST-BLOCK. RED until SEC-2.
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..", "..", "..");
const MOD = path.join(ROOT, "scripts", "dispatch", "acceptance-record.js");

test("AC-F4 target-mismatch MUST-BLOCK integration (valid record for target A presented for target B)", (t) => {
  if (!fs.existsSync(MOD)) return t.skip("pending SEC-2 — acceptance-record.js not yet built (falsifier RED)");
  const { authorizesIntegration } = require(MOD);
  const recordForA = {
    workorder_digest: "wo-A",
    base_commit: "base-A",
    result_tree_hash: "tree-A",
    target_ref: "refs/heads/feature-A",
    terminal_state: "success",
  };
  const authorized = authorizesIntegration(recordForA, "refs/heads/feature-B"); // presented for a DIFFERENT target
  assert.strictEqual(
    authorized,
    false,
    "MUST-BLOCK: a valid AcceptanceRecord bound to target A must not authorize integration of target B (re-correlation)",
  );
});
