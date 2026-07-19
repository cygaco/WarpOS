"use strict";
/**
 * conductor-lease.test.js — cross-session conductor lease (SP-20260718-005 BE-4).
 * Run: node --test scripts/dispatch/conductor-lease.test.js
 */
const os = require("node:os");
const path = require("node:path");
const fs = require("node:fs");
const { test } = require("node:test");
const assert = require("node:assert");

const lease = require("./conductor-lease");

function tmpRoot(tag) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `lease-${tag}-`));
}

test("cold acquire on an unheld SP-id succeeds and mints token 1", () => {
  const root = tmpRoot("cold");
  const r = lease.acquire("SP-A", { root, sessionId: "sess-1" });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.token, 1);
  assert.strictEqual(r.holder.sessionId, "sess-1");
});

test("acquire on an already-held SP-id cleanly fails (no crash, no double-hold)", () => {
  const root = tmpRoot("held");
  const a = lease.acquire("SP-B", { root, sessionId: "sess-1" });
  const b = lease.acquire("SP-B", { root, sessionId: "sess-2" });
  assert.strictEqual(a.ok, true);
  assert.strictEqual(b.ok, false);
  assert.strictEqual(b.reason, "held");
});

test("release requires the CURRENT fencing token; a stale token is refused", () => {
  const root = tmpRoot("release");
  const a = lease.acquire("SP-C", { root, sessionId: "sess-1" });
  const badRelease = lease.release("SP-C", { root, token: a.token + 999 });
  assert.strictEqual(badRelease.ok, false);
  assert.strictEqual(badRelease.reason, "fencing-mismatch");
  const goodRelease = lease.release("SP-C", { root, token: a.token });
  assert.strictEqual(goodRelease.ok, true);
  // Now unheld — a fresh cold acquire succeeds again with a NEW higher token.
  const b = lease.acquire("SP-C", { root, sessionId: "sess-2" });
  assert.strictEqual(b.ok, true);
  assert.ok(b.token > a.token, "token must be monotonic across release+reacquire");
});

test("renew extends a live hold WITHOUT minting a new token; wrong token is refused", () => {
  const root = tmpRoot("renew");
  const a = lease.acquire("SP-D", { root, sessionId: "sess-1" });
  const before = lease.status("SP-D", { root });
  const bad = lease.renew("SP-D", { root, token: a.token + 999 });
  assert.strictEqual(bad.ok, false);
  assert.strictEqual(bad.reason, "fencing-mismatch");
  const ok = lease.renew("SP-D", { root, token: a.token });
  assert.strictEqual(ok.ok, true);
  assert.strictEqual(ok.token, a.token, "renew must NOT change the token identity");
  const after = lease.status("SP-D", { root });
  assert.strictEqual(after.token, before.token);
  assert.ok(after.renewed_at >= before.renewed_at);
});

test("verifyToken is true ONLY for the exact current holder token", () => {
  const root = tmpRoot("verify");
  const a = lease.acquire("SP-E", { root, sessionId: "sess-1" });
  assert.strictEqual(lease.verifyToken("SP-E", a.token, { root }), true);
  assert.strictEqual(lease.verifyToken("SP-E", a.token + 1, { root }), false);
  assert.strictEqual(lease.verifyToken("SP-NEVER-ACQUIRED", 1, { root }), false);
});

test("fencing token is monotonic across release+reacquire cycles (cross-session)", () => {
  const root = tmpRoot("monotonic");
  const spId = "SP-F";
  const tokens = [];
  for (let i = 0; i < 4; i++) {
    const r = lease.acquire(spId, { root, sessionId: `sess-${i}` });
    assert.strictEqual(r.ok, true);
    tokens.push(r.token);
    lease.release(spId, { root, token: r.token });
  }
  for (let i = 1; i < tokens.length; i++) {
    assert.ok(tokens[i] > tokens[i - 1], `token[${i}]=${tokens[i]} must exceed token[${i - 1}]=${tokens[i - 1]}`);
  }
});

test("reclaim refuses to touch a live, healthy lease", () => {
  const root = tmpRoot("reclaim-live");
  const a = lease.acquire("SP-G", { root, sessionId: "sess-1" });
  const r = lease.reclaim("SP-G", { root, sessionId: "sess-2" });
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.reason, "lease-active");
  assert.strictEqual(lease.verifyToken("SP-G", a.token, { root }), true, "the live holder's token must remain valid");
});

test("reclaim supersedes a lease whose holder PID is dead (crash simulation)", () => {
  const root = tmpRoot("reclaim-dead");
  const spId = "SP-H";
  const a = lease.acquire(spId, { root, sessionId: "sess-crashed" });
  // Simulate a crash: overwrite the lease file's holder pid with one that
  // cannot possibly be alive.
  const leaseFile = path.join(root, "conductor-leases", `${spId}.lease`);
  const holder = JSON.parse(fs.readFileSync(leaseFile, "utf8"));
  holder.pid = 999999999;
  fs.writeFileSync(leaseFile, JSON.stringify(holder) + "\n");

  const r = lease.reclaim(spId, { root, sessionId: "sess-rescuer" });
  assert.strictEqual(r.ok, true);
  assert.ok(r.token > a.token, "reclaim must mint a NEW, strictly higher fencing token");
  assert.strictEqual(lease.verifyToken(spId, a.token, { root }), false, "the dead holder's token must no longer verify");
  assert.strictEqual(lease.verifyToken(spId, r.token, { root }), true);
});

test("reclaim supersedes a lease that is stale-past-TTL even with a live PID", () => {
  const root = tmpRoot("reclaim-stale");
  const spId = "SP-I";
  const a = lease.acquire(spId, { root, sessionId: "sess-stale" });
  const leaseFile = path.join(root, "conductor-leases", `${spId}.lease`);
  const holder = JSON.parse(fs.readFileSync(leaseFile, "utf8"));
  // Push renewed_at/acquired_at back beyond STALE_AFTER_MS. PID stays our own
  // (alive) — staleness alone must be sufficient to allow reclaim.
  holder.acquired_at = Date.now() - (lease.STALE_AFTER_MS + 60_000);
  holder.renewed_at = Date.now() - (lease.STALE_AFTER_MS + 60_000);
  fs.writeFileSync(leaseFile, JSON.stringify(holder) + "\n");

  const r = lease.reclaim(spId, { root, sessionId: "sess-rescuer" });
  assert.strictEqual(r.ok, true);
  assert.ok(r.token > a.token);
});

test("reclaim on an unheld SP-id behaves like a cold acquire", () => {
  const root = tmpRoot("reclaim-cold");
  const r = lease.reclaim("SP-J", { root, sessionId: "sess-1" });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.token, 1);
});

test("simultaneous acquire race: exactly one winner (AC-6/AC-F7 shape)", () => {
  const root = tmpRoot("race");
  const spId = "SP-K";
  const results = [];
  for (let i = 0; i < 5; i++) {
    results.push(lease.acquire(spId, { root, sessionId: `sess-${i}` }));
  }
  const winners = results.filter((r) => r.ok === true);
  assert.strictEqual(winners.length, 1);
});
