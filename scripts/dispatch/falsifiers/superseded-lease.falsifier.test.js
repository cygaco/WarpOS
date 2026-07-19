"use strict";
// FALSIFIER: AC-F5 superseded-lease — record-trust gate (SP-20260718-005), surface conductor-lease-at-acquire.
// Adversarial: a conductor writes under an expired/superseded fencing token (the late-firing-prior-conductor case,
// SP-003 R6). Its writes MUST-BLOCK (verifyToken refuses a token < the current holder's). Fencing token is
// cross-session-valid (monotonic counter, NOT mtime). RED until BE-4.
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const os = require("os");
const ROOT = path.resolve(__dirname, "..", "..", "..");
const MOD = path.join(ROOT, "scripts", "dispatch", "conductor-lease.js");

test("AC-F5 superseded-lease write MUST-BLOCK (fencing token < current holder)", (t) => {
  if (!fs.existsSync(MOD)) return t.skip("pending BE-4 — conductor-lease.js not yet built (falsifier RED)");
  const lease = require(MOD);
  const spId = "SP-FALSIFIER-F5";
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lease-f5-"));
  const opts = { root: dir }; // build exposes a root override for the bite-test
  // Session 1 acquires (token T1), then a later session supersedes (token T2 > T1).
  const a1 = lease.acquire(spId, { ...opts, sessionId: "sess-1" });
  lease.release(spId, { ...opts, token: a1.token }); // or expiry
  const a2 = lease.acquire(spId, { ...opts, sessionId: "sess-2" });
  assert.ok(a2.token > a1.token, "fencing token must be monotonic (a2 > a1)");
  // The superseded session-1 tries to write under its stale token T1.
  const accepted = lease.verifyToken(spId, a1.token, opts);
  assert.strictEqual(
    accepted,
    false,
    "MUST-BLOCK: a write under the superseded (lower) fencing token must be refused",
  );
});
