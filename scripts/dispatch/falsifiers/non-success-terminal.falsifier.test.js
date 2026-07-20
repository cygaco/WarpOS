"use strict";
// FALSIFIER: AC-F6 non-success-terminal-as-success — record-trust gate (SP-20260718-005), surface acceptance-record-at-integration.
// Adversarial: a WorkOrder whose terminal_state is partial/blocked/failed, but the ResultEnvelope claims success.
// Only a terminal_state === "success" WorkOrder + a valid AcceptanceRecord authorizes. MUST-BLOCK. RED until SEC-2.
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..", "..", "..");
const MOD = path.join(ROOT, "scripts", "dispatch", "acceptance-record.js");

for (const nonSuccess of ["partial", "blocked", "failed", "cancelled"]) {
  test(`AC-F6 non-success terminal (${nonSuccess}) claiming success MUST-BLOCK integration`, (t) => {
    if (!fs.existsSync(MOD)) return t.skip("pending SEC-2 — acceptance-record.js not yet built (falsifier RED)");
    const { authorizesIntegration } = require(MOD);
    const record = {
      workorder_digest: "wo-X",
      base_commit: "base-X",
      result_tree_hash: "tree-X",
      target_ref: "refs/heads/integration",
      terminal_state: nonSuccess, // NOT success
      envelope_claims_success: true, // the untrusted envelope lies
    };
    const authorized = authorizesIntegration(record, "refs/heads/integration");
    assert.strictEqual(
      authorized,
      false,
      `MUST-BLOCK: a ${nonSuccess} WorkOrder must not authorize integration even when its envelope claims success`,
    );
  });
}
