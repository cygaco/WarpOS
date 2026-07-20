"use strict";
// FALSIFIER: AC-F11 forged/provider-authored AcceptanceRecord — record-trust gate (SP-20260718-005), surface
// acceptance-record-at-integration. Adversarial (product-lead REVISE + the SP-003 attestation-needs-writer-origin
// class): content-addressing proves CONSISTENCY, not TRUSTED acceptance. A provider hand-authors a record with a
// FABRICATED result_tree_hash; the trusted verifier RECOMPUTEs the tree from the record's immutable candidate and
// MUST-BLOCK on the mismatch.
// ED-240a SCHEMA MIGRATION: the ED-238 hardening (validateCommitIdentity requires full-SHA base/result) made the
// pre-schema fixture (base_commit:"HEAD") short-circuit at the identity gate BEFORE the recompute — a DEAD GATE
// (BC-16), proven: treeResolver call-count was 0. This rebuild starts from a VALID current-schema record
// (produceForTest + a real lease), alters ONLY the claimed tree, and PROVES the recompute gate is REACHED (the
// treeResolver spy is invoked) + pairs an honest-tree control that AUTHORIZES (isolates the recompute gate).
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const ROOT = path.resolve(__dirname, "..", "..", "..");
const ACC = path.join(ROOT, "scripts", "dispatch", "acceptance-record.js");
const LEASE = path.join(ROOT, "scripts", "dispatch", "conductor-lease.js");

test("AC-F11 provider-authored AcceptanceRecord with a fabricated result-tree hash MUST-BLOCK (verifier recomputes, not trusts) — recompute gate REACHED", (t) => {
  if (!fs.existsSync(ACC) || !fs.existsSync(LEASE)) return t.skip("pending SEC-2 — modules not yet built (falsifier RED)");
  const acc = require(ACC);
  const lease = require(LEASE);
  const leaseRoot = fs.mkdtempSync(path.join(os.tmpdir(), "acc-f11-"));
  const spId = "SP-FALSIFIER-F11";
  const held = lease.acquire(spId, { root: leaseRoot, sessionId: "sess-f11" });

  // A VALID current-schema record whose ONLY defect is a FABRICATED result_tree_hash (the provider-claimed value).
  const forged = acc.produceForTest({
    target_ref: "refs/heads/integration",
    lease_fencing_token: held.token,
    result_tree_hash: "f".repeat(40), // fabricated — does NOT match the honest recompute of record.result_commit
  });
  let treeCalls = 0;
  const opts = {
    integrationHead: forged.base_commit, // mandatory freshness coordinate (=== the record's immutable full-SHA base)
    spId,
    leaseRoot,
    treeResolver: () => { treeCalls++; return "tree-OK"; }, // the HONEST recomputed tree of the candidate
    ancestryResolver: () => true,
  };
  const authorized = acc.authorizesIntegration(forged, "refs/heads/integration", opts);
  assert.strictEqual(authorized, false, "MUST-BLOCK: a fabricated result_tree_hash the verifier recomputes-and-mismatches must not authorize");
  assert.ok(treeCalls > 0, "GATE-REACHED PROOF: the recompute (treeResolver) MUST be invoked — a 0-call means the record short-circuited at an earlier gate (the dead-gate the migration fixes)");

  // CONTROL: the SAME context with an HONEST tree AUTHORIZES — proves every other gate passes, so the block above
  // is attributable ONLY to the recompute mismatch (delta = the claimed tree).
  const honest = acc.produceForTest({ target_ref: "refs/heads/integration", lease_fencing_token: held.token });
  const okAuthorized = acc.authorizesIntegration(honest, "refs/heads/integration", { ...opts, treeResolver: () => honest.result_tree_hash });
  assert.strictEqual(okAuthorized, true, "CONTROL: identical context + honest tree MUST authorize (isolates the recompute gate as the sole differentiator)");
});
