"use strict";
// FALSIFIER: AC-F12 validation-to-merge race (CAS) — record-trust gate (SP-20260718-005), surface
// acceptance-record-at-integration. Adversarial (product-lead REVISE): the head can advance BETWEEN the freshness
// validation and the atomic ref update. The merge MUST be a compare-and-swap against the integration ref — an
// integration whose expected head != the live head at commit time MUST-BLOCK (no check->merge TOCTOU at the ref
// update itself, distinct from F3's base-stale-at-validation). RED until BE-6/SEC-2.
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..", "..", "..");
const MOD = path.join(ROOT, "scripts", "dispatch", "acceptance-record.js");

test("AC-F12 CAS: an integration whose expected head moved before the atomic ref update MUST-BLOCK", (t) => {
  if (!fs.existsSync(MOD)) return t.skip("pending BE-6/SEC-2 — acceptance-record.js commitIntegration not yet built (falsifier RED)");
  const acc = require(MOD);
  if (typeof acc.commitIntegration !== "function")
    assert.fail("MUST-BLOCK: acceptance-record must expose commitIntegration(record, target, {expectedHead}) — CAS at the ref update (an absent CAS API is a fail-open)");
  const record = {
    workorder_digest: "wo-F12",
    base_commit: "H1",
    result_tree_hash: "tree-F12",
    target_ref: "refs/heads/integration",
    terminal_state: "success",
  };
  // Validated against H1, but the live head advanced to H2 before the atomic ref update.
  const committed = acc.commitIntegration(record, "refs/heads/integration", { expectedHead: "H1", liveHead: "H2" });
  assert.strictEqual(
    committed && committed.ok,
    false,
    "MUST-BLOCK: the CAS ref update must fail when the integration head advanced after validation (validation-to-merge race)",
  );
});
