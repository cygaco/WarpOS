"use strict";
// FALSIFIER: AC-F3 stale-base — record-trust gate (SP-20260718-005), surface acceptance-record-at-integration (freshness).
// Adversarial: a WorkOrder/AcceptanceRecord whose immutable base_commit != the integration head AFTER the head
// advanced (the check->merge TOCTOU). Integration MUST-BLOCK (no stale merge over newer work, G3.7). RED until BE-6.
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..", "..", "..");
const MOD = path.join(ROOT, "scripts", "dispatch", "acceptance-record.js");

test("AC-F3 stale-base MUST-BLOCK integration (head advanced after the freshness check)", (t) => {
  if (!fs.existsSync(MOD)) return t.skip("pending BE-6/SEC-2 — acceptance-record.js not yet built (falsifier RED)");
  const mod = require(MOD);
  // A valid, content-addressed AcceptanceRecord whose base is now STALE relative to the live integration head.
  const record = {
    workorder_digest: "wo-deadbeef",
    base_commit: "aaaaaaa_old_base",
    result_tree_hash: "tree-1",
    target_ref: "refs/heads/integration",
    terminal_state: "success",
  };
  const liveHead = "bbbbbbb_advanced_head"; // head moved on after the record was produced
  const authorized = mod.authorizesIntegration(record, "refs/heads/integration", { integrationHead: liveHead });
  assert.strictEqual(
    authorized,
    false,
    "MUST-BLOCK: a record whose base is stale against the advanced integration head must not authorize the merge (TOCTOU)",
  );
});
