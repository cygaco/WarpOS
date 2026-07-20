"use strict";
// FALSIFIER: AC-F12 validation-to-merge race (CAS) — record-trust gate (SP-20260718-005), surface
// acceptance-record-at-integration. Adversarial (product-lead REVISE): the head can advance BETWEEN the freshness
// validation and the atomic ref update. commitIntegration MUST be a compare-and-swap — an integration whose
// expectedHead != the live head at commit time MUST-BLOCK (distinct from F3's base-stale-at-validation).
// ED-240a SCHEMA MIGRATION: the pre-schema fixture (base_commit:"H1") short-circuited at validateCommitIdentity
// (reason "invalid-commit-identity") BEFORE the CAS-race gate — a DEAD GATE (BC-16). This rebuild starts from a
// VALID current-schema record, gives a full-valid authz context so the nested authorization PASSES, moves ONLY the
// live head, and asserts the EXACT reason "validation-to-merge-race" (proving the CAS-race gate is REACHED, not an
// earlier short-circuit) + pairs an unmoved-head control that commits ok.
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const ROOT = path.resolve(__dirname, "..", "..", "..");
const ACC = path.join(ROOT, "scripts", "dispatch", "acceptance-record.js");
const LEASE = path.join(ROOT, "scripts", "dispatch", "conductor-lease.js");

test("AC-F12 CAS: an integration whose expected head moved before the atomic ref update MUST-BLOCK — race gate REACHED", (t) => {
  if (!fs.existsSync(ACC) || !fs.existsSync(LEASE)) return t.skip("pending BE-6/SEC-2 — commitIntegration not yet built (falsifier RED)");
  const acc = require(ACC);
  const lease = require(LEASE);
  assert.strictEqual(typeof acc.commitIntegration, "function", "MUST-BLOCK: acceptance-record must expose commitIntegration (an absent CAS API is a fail-open)");
  const spId = "SP-FALSIFIER-F12";
  const leaseRoot = fs.mkdtempSync(path.join(os.tmpdir(), "acc-f12-"));
  const held = lease.acquire(spId, { root: leaseRoot, sessionId: "sess-f12" });
  const record = acc.produceForTest({ target_ref: "refs/heads/integration", lease_fencing_token: held.token });

  // Full-valid authz context so the nested authorizesIntegration PASSES and control reaches the CAS.
  const commonOpts = {
    expectedHead: record.base_commit, // the validated destination head === base (an immutable full SHA)
    spId,
    leaseRoot,
    treeResolver: () => record.result_tree_hash, // honest recompute
    ancestryResolver: () => true,
  };
  const MOVED_HEAD = "d".repeat(40); // a DIFFERENT immutable full SHA — the live head advanced after validation

  // ATTACK: the live head moved to a different SHA before the atomic ref update.
  const raced = acc.commitIntegration(record, "refs/heads/integration", { ...commonOpts, liveHead: MOVED_HEAD });
  assert.strictEqual(raced.ok, false, "MUST-BLOCK: the CAS must fail when the integration head advanced after validation");
  assert.strictEqual(
    raced.reason,
    "validation-to-merge-race",
    "GATE-REACHED PROOF: the EXACT reason MUST be the CAS race — any other reason (invalid-commit-identity / not-authorized / superseded-lease) means an earlier gate short-circuited (the dead-gate the migration fixes)",
  );

  // CONTROL: the SAME context with the head UNMOVED commits ok — proves authorization + the CAS were REACHED and the
  // race is the sole differentiator (delta = liveHead).
  const unmoved = acc.commitIntegration(record, "refs/heads/integration", { ...commonOpts, liveHead: record.base_commit });
  assert.strictEqual(unmoved.ok, true, unmoved.reason);
});
