"use strict";
// FALSIFIER: AC-F10 lease x acceptance composition — record-trust gate (SP-20260718-005), cross-surface seam
// (conductor-lease-at-acquire x acceptance-record-at-integration). Adversarial: a CONTENT-VALID AcceptanceRecord
// minted by a conductor whose lease was SUPERSEDED (stale fencing token) is presented to authorizesIntegration.
// Even though the record itself is well-formed, integration MUST-BLOCK — a superseded conductor cannot authorize
// (SEC-4). Tests the seam quality-lead flagged: verifyToken-in-isolation isn't enough. RED until BE-4 + SEC-2/4.
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const os = require("os");
const ROOT = path.resolve(__dirname, "..", "..", "..");
const ACC = path.join(ROOT, "scripts", "dispatch", "acceptance-record.js");
const LEASE = path.join(ROOT, "scripts", "dispatch", "conductor-lease.js");

test("AC-F10 valid AcceptanceRecord minted under a SUPERSEDED lease MUST-BLOCK integration", (t) => {
  if (!fs.existsSync(ACC) || !fs.existsSync(LEASE)) return t.skip("pending BE-4 + SEC-2/4 — modules not yet built (falsifier RED)");
  const acc = require(ACC);
  const lease = require(LEASE);
  const spId = "SP-FALSIFIER-F10";
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lease-x-acc-"));
  const opts = { root: dir };
  const a1 = lease.acquire(spId, { ...opts, sessionId: "sess-stale" });
  lease.release(spId, { ...opts, token: a1.token });
  lease.acquire(spId, { ...opts, sessionId: "sess-current" }); // supersedes a1
  // A well-formed AcceptanceRecord that carries the STALE fencing token.
  const record = {
    workorder_digest: "wo-F10",
    base_commit: "base-F10",
    result_tree_hash: "tree-F10",
    target_ref: "refs/heads/integration",
    terminal_state: "success",
    lease_fencing_token: a1.token, // superseded
  };
  const authorized = acc.authorizesIntegration(record, "refs/heads/integration", { spId, leaseRoot: dir });
  assert.strictEqual(
    authorized,
    false,
    "MUST-BLOCK: a record minted under a superseded lease token must not authorize integration (cross-surface seam)",
  );
});
