"use strict";
// FALSIFIER: AC-F7 simultaneous-lease-race — record-trust gate (SP-20260718-005), surface conductor-lease-at-acquire.
// Adversarial: two sessions attempt to O_EXCL-acquire the SAME SP-id lease at once. Exactly ONE must win; the other
// gets a clean no-go (NOT a crash, NOT a double-hold). MUST-BLOCK the second holder. RED until BE-4.
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const os = require("os");
const ROOT = path.resolve(__dirname, "..", "..", "..");
const MOD = path.join(ROOT, "scripts", "dispatch", "conductor-lease.js");

test("AC-F7 simultaneous acquire of the same SP-id yields exactly ONE holder (second MUST-BLOCK)", (t) => {
  if (!fs.existsSync(MOD)) return t.skip("pending BE-4 — conductor-lease.js not yet built (falsifier RED)");
  const lease = require(MOD);
  const spId = "SP-FALSIFIER-F7";
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lease-f7-"));
  const opts = { root: dir };
  const a = lease.acquire(spId, { ...opts, sessionId: "sess-A" });
  const b = lease.acquire(spId, { ...opts, sessionId: "sess-B" }); // contends for the held lease
  const winners = [a, b].filter((r) => r && r.ok === true);
  assert.strictEqual(
    winners.length,
    1,
    "MUST-BLOCK: exactly one session may hold the SP-id lease; the second acquire must cleanly fail (no double-hold)",
  );
});
