"use strict";
// FALSIFIER: AC-F10 lease x acceptance composition — record-trust gate (SP-20260718-005), cross-surface seam
// (conductor-lease-at-acquire x acceptance-record-at-integration). Adversarial: a CONTENT-VALID AcceptanceRecord
// minted by a conductor whose lease was SUPERSEDED (stale fencing token) MUST-BLOCK integration (SEC-4) — a
// superseded conductor cannot authorize even a well-formed record.
// ED-240a SCHEMA MIGRATION: the pre-schema fixture (base_commit:"base-F10", no integrationHead) short-circuited at
// the identity/freshness gate BEFORE the lease gate (DEAD GATE / BC-16). This rebuild starts from a VALID current-
// schema record, alters ONLY the lease currency (stale vs current token), asserts the STALE-token record blocks,
// and pairs a CURRENT-token control that AUTHORIZES — proving the lease gate is REACHED (a dead gate would block BOTH).
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const ROOT = path.resolve(__dirname, "..", "..", "..");
const ACC = path.join(ROOT, "scripts", "dispatch", "acceptance-record.js");
const LEASE = path.join(ROOT, "scripts", "dispatch", "conductor-lease.js");

test("AC-F10 valid AcceptanceRecord minted under a SUPERSEDED lease MUST-BLOCK integration — lease gate REACHED", (t) => {
  if (!fs.existsSync(ACC) || !fs.existsSync(LEASE)) return t.skip("pending BE-4 + SEC-2/4 — modules not yet built (falsifier RED)");
  const acc = require(ACC);
  const lease = require(LEASE);
  const spId = "SP-FALSIFIER-F10";
  const leaseRoot = fs.mkdtempSync(path.join(os.tmpdir(), "lease-x-acc-"));
  const a1 = lease.acquire(spId, { root: leaseRoot, sessionId: "sess-stale" });
  lease.release(spId, { root: leaseRoot, token: a1.token });
  const a2 = lease.acquire(spId, { root: leaseRoot, sessionId: "sess-current" }); // supersedes a1

  // Full-valid authz context (identical for both) so the lease gate is actually REACHED.
  const baseOpts = (record) => ({
    integrationHead: record.base_commit, // mandatory freshness
    spId,
    leaseRoot,
    treeResolver: () => record.result_tree_hash, // honest recompute
    ancestryResolver: () => true,
  });

  // ATTACK: a VALID record carrying the STALE (superseded a1) fencing token.
  const stale = acc.produceForTest({ target_ref: "refs/heads/integration", lease_fencing_token: a1.token });
  assert.strictEqual(
    acc.authorizesIntegration(stale, "refs/heads/integration", baseOpts(stale)),
    false,
    "MUST-BLOCK: a record minted under a superseded lease token must not authorize integration (cross-surface seam)",
  );

  // CONTROL: the SAME record shape carrying the CURRENT (a2) token AUTHORIZES — proves the block above is
  // attributable ONLY to lease currency (delta = the fencing token) AND that the lease gate is REACHED.
  const current = acc.produceForTest({ target_ref: "refs/heads/integration", lease_fencing_token: a2.token });
  assert.strictEqual(
    acc.authorizesIntegration(current, "refs/heads/integration", baseOpts(current)),
    true,
    "CONTROL: identical context + current lease token MUST authorize (isolates the lease-currency gate)",
  );
});
