"use strict";
// POSITIVE COMPANION (SP-20260718-005 AC-4 happy-path) — record-trust gate defense against the reject-everything
// stub (quality-lead: a constant `authorizesIntegration = () => false` passes FOUR falsifiers while authorizing
// nothing real). This asserts the GOLDEN path: a content-valid AcceptanceRecord — matching target, terminal_state
// "success", fresh base against the integration head, valid digests, current lease token — DOES authorize. Paired
// with the F2/F3/F4/F6 falsifiers, it makes a reject-everything stub FAIL. NOT a falsifier (no MUST-BLOCK); the
// record-trust-gate enforcer tracks it as a required positive_companion. RED until SEC-2.
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const ROOT = path.resolve(__dirname, "..", "..", "..");
const MOD = path.join(ROOT, "scripts", "dispatch", "acceptance-record.js");

test("AC-4 positive companion — a fully valid AcceptanceRecord DOES authorize integration", (t) => {
  if (!fs.existsSync(MOD)) return t.skip("pending SEC-2 — acceptance-record.js not yet built (companion RED)");
  const acc = require(MOD);
  const lease = require(path.join(ROOT, "scripts", "dispatch", "conductor-lease.js"));
  // SP-20260718-005 gauntlet R2/C2: authorization now requires the FULL mandatory context — a live integration
  // head, real lease coordinates + a current fencing token on the record, full identity digests, and the tree
  // resolver. The golden path mints a real lease so the record's token is CURRENT (production's exact shape).
  const leaseRoot = fs.mkdtempSync(path.join(os.tmpdir(), "acc-pos-companion-"));
  const spId = "SP-ACC-POS-COMPANION";
  const held = lease.acquire(spId, { root: leaseRoot, sessionId: "sess-companion" });
  // produceForTest already carries the full checker/policy/evidence identity; add the current lease token.
  const record = acc.produceForTest({ target_ref: "refs/heads/integration", lease_fencing_token: held.token });
  const authorized = acc.authorizesIntegration(record, "refs/heads/integration", {
    integrationHead: record.base_commit, // === the record's immutable full-SHA base (ED-238 head-coord) — mandatory freshness coordinate
    spId,
    leaseRoot, // mandatory lease coordinates; token verified current
    treeResolver: () => record.result_tree_hash, // mandatory recompute (from the record's immutable result_commit); honest tree matches
    ancestryResolver: () => true, // base IS an ancestor of the candidate (the honest golden-path relationship)
  });
  assert.strictEqual(
    authorized,
    true,
    "the golden path must AUTHORIZE — a reject-everything stub fails here (defeats the constant-false false-green)",
  );
});
