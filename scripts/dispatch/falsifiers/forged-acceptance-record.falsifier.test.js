"use strict";
// FALSIFIER: AC-F11 forged/provider-authored AcceptanceRecord — record-trust gate (SP-20260718-005), surface
// acceptance-record-at-integration. Adversarial (product-lead REVISE + the SP-003 attestation-needs-writer-origin
// class): content-addressing proves CONSISTENCY, not TRUSTED acceptance. A provider hand-authors a STRUCTURALLY
// VALID AcceptanceRecord with self-reported digests. The trusted verifier must RECOMPUTE the result-tree hash from
// the ACTUAL target ref (not trust the record's claimed value) — a fabricated digest MUST-BLOCK. RED until SEC-2.
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..", "..", "..");
const MOD = path.join(ROOT, "scripts", "dispatch", "acceptance-record.js");

test("AC-F11 provider-authored AcceptanceRecord with a fabricated result-tree hash MUST-BLOCK (verifier recomputes, not trusts)", (t) => {
  if (!fs.existsSync(MOD)) return t.skip("pending SEC-2 — acceptance-record.js not yet built (falsifier RED)");
  const acc = require(MOD);
  // A record that LOOKS valid but whose result_tree_hash is a fabricated value the provider wrote — it does not
  // match what the trusted verifier recomputes from the real target ref. Content-addressed trust => recompute.
  const forged = {
    workorder_digest: "wo-forged",
    base_commit: "HEAD",
    result_tree_hash: "ffffffffffffffffffffffffffffffffffffffff", // fabricated, not the real tree
    target_ref: "refs/heads/integration",
    terminal_state: "success",
    // No trusted-verifier origin: authored by the provider, not the conductor/gauntlet verifier.
  };
  const authorized = acc.authorizesIntegration(forged, "refs/heads/integration", { recompute: true });
  assert.strictEqual(
    authorized,
    false,
    "MUST-BLOCK: a provider-authored record whose digests the trusted verifier recomputes-and-mismatches must not authorize integration (structurally-valid != trusted)",
  );
});
