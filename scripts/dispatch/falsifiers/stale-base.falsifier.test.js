"use strict";
// FALSIFIER: AC-F3 stale-base — record-trust gate (SP-20260718-005), surface acceptance-record-at-integration
// (freshness). Adversarial: an AcceptanceRecord whose immutable base_commit != the integration head AFTER the head
// advanced (the check->merge TOCTOU). Integration MUST-BLOCK (no stale merge over newer work, G3.7).
// ED-240a SCHEMA MIGRATION: the pre-schema fixture (base_commit:"aaaaaaa_old_base", integrationHead:"bbb..._head")
// short-circuited at validateCommitIdentity/isFullSha BEFORE the base!=head freshness compare — a DEAD GATE (BC-16),
// proven: base===integrationHead but non-SHA still returned false. This rebuild starts from a VALID current-schema
// record, alters ONLY the integration head (a DIFFERENT valid full SHA = the advanced head), asserts the stale
// record blocks, and pairs a matching-head control that AUTHORIZES — isolating the freshness gate.
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const ROOT = path.resolve(__dirname, "..", "..", "..");
const ACC = path.join(ROOT, "scripts", "dispatch", "acceptance-record.js");
const LEASE = path.join(ROOT, "scripts", "dispatch", "conductor-lease.js");

test("AC-F3 stale-base MUST-BLOCK integration (head advanced after the freshness check) — freshness gate REACHED", (t) => {
  if (!fs.existsSync(ACC) || !fs.existsSync(LEASE)) return t.skip("pending BE-6/SEC-2 — modules not yet built (falsifier RED)");
  const acc = require(ACC);
  const lease = require(LEASE);
  const spId = "SP-FALSIFIER-F3";
  const leaseRoot = fs.mkdtempSync(path.join(os.tmpdir(), "acc-f3-"));
  const held = lease.acquire(spId, { root: leaseRoot, sessionId: "sess-f3" });
  t.after(() => { try { lease.release(spId, { root: leaseRoot, token: held.token }); } catch {} try { fs.rmSync(leaseRoot, { recursive: true, force: true }); } catch {} });
  const record = acc.produceForTest({ target_ref: "refs/heads/integration", lease_fencing_token: held.token });

  // Full-valid authz context (identical for both) so the freshness gate is actually REACHED.
  const baseOpts = {
    spId,
    leaseRoot,
    treeResolver: () => record.result_tree_hash, // honest recompute
    ancestryResolver: () => true,
  };
  const ADVANCED_HEAD = "e".repeat(40); // a DIFFERENT valid full SHA — the head moved on after the record was produced

  // ATTACK: the live integration head advanced to a different SHA; the record's base is now stale.
  assert.strictEqual(
    acc.authorizesIntegration(record, "refs/heads/integration", { ...baseOpts, integrationHead: ADVANCED_HEAD }),
    false,
    "MUST-BLOCK: a record whose base is stale against the advanced integration head must not authorize the merge (TOCTOU)",
  );

  // CONTROL: the SAME record with the integration head === its base AUTHORIZES — proves the freshness gate is
  // REACHED and the stale head is the sole differentiator (delta = integrationHead).
  assert.strictEqual(
    acc.authorizesIntegration(record, "refs/heads/integration", { ...baseOpts, integrationHead: record.base_commit }),
    true,
    "CONTROL: identical context + matching head MUST authorize (isolates the freshness gate)",
  );
});
