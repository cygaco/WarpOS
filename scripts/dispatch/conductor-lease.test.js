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

// ── C1 (SP-20260718-005 gauntlet): mutation-lock serialization + re-read-under-lock ──────────────────

test("TEETH (C1): withMutationLock SERIALIZES — a nested acquire while held is excluded (mutation-contended)", () => {
  const root = tmpRoot("c1-mutex");
  const spId = "SP-MUTX";
  let inner;
  const outer = lease._withMutationLock(spId, root, () => {
    // While the outer holds the per-SP mutation lock, a re-entrant acquire MUST NOT get in — proving the
    // read-check-mutate of release/renew/reclaim can never interleave (the exact TOCTOU window flagged).
    inner = lease._withMutationLock(spId, root, () => ({ ok: true, ran: true }), { maxWaitMs: 40 });
    return { ok: true };
  });
  assert.strictEqual(outer.ok, true);
  assert.strictEqual(inner.ok, false);
  assert.strictEqual(inner.reason, "mutation-contended");
});

test("TEETH (C1): a superseded holder's release CANNOT delete the current lease (re-read under the lock)", () => {
  const root = tmpRoot("c1-release");
  const spId = "SP-C1";
  const a1 = lease.acquire(spId, { root, sessionId: "A" }); // token 1
  assert.strictEqual(a1.token, 1);
  // Force A's lease stale so B may reclaim (mirrors a crashed/idle-past-TTL holder).
  const lp = path.join(root, "conductor-leases", `${spId}.lease`);
  const stale = Object.assign(JSON.parse(fs.readFileSync(lp, "utf8")), {
    renewed_at: Date.now() - (lease.STALE_AFTER_MS + 1000),
    acquired_at: Date.now() - (lease.STALE_AFTER_MS + 1000),
  });
  fs.writeFileSync(lp, JSON.stringify(stale) + "\n");
  const b = lease.reclaim(spId, { root, sessionId: "B" }); // token 2 supersedes token 1
  assert.strictEqual(b.ok, true);
  assert.ok(b.token > a1.token);
  // A (stale, token 1) tries to release — must REFUSE (re-read sees token 2), never delete B's lease.
  const rel = lease.release(spId, { root, token: a1.token });
  assert.strictEqual(rel.ok, false);
  assert.strictEqual(rel.reason, "fencing-mismatch");
  // B's lease + token survive intact.
  assert.strictEqual(lease.verifyToken(spId, b.token, { root }), true);
});

// ── C1/R2 (gauntlet round 2): mutation-lock reclaim keys on OWNER LIVENESS, never mtime alone ─────────
test("TEETH (C1/R2): a LIVE owner's mutation lock is NOT reclaimed — a contender fails-contended, never unlinks it", () => {
  const root = tmpRoot("c1r2-live");
  const spId = "SP-C1R2-LIVE";
  fs.mkdirSync(path.join(root, "conductor-leases"), { recursive: true });
  const mlp = path.join(root, "conductor-leases", `${spId}.mutation.lock`);
  // Stamp the lock with a LIVE pid (our own) + backdate its mtime WAY past the stale window.
  fs.writeFileSync(mlp, JSON.stringify({ pid: process.pid, ts: Date.now() - (lease.STALE_AFTER_MS + 60000) }) + "\n");
  const old = Date.now() - (24 * 60 * 60 * 1000);
  fs.utimesSync(mlp, new Date(old), new Date(old)); // ancient mtime — mtime-only would have reclaimed it
  let ran = false;
  const res = lease._withMutationLock(spId, root, () => { ran = true; return { ok: true }; }, { maxWaitMs: 40 });
  assert.strictEqual(ran, false, "must NOT reclaim a live owner's lock even though its mtime is ancient");
  assert.strictEqual(res.ok, false);
  assert.strictEqual(res.reason, "mutation-contended");
  assert.ok(fs.existsSync(mlp), "the live owner's lock must survive");
});

test("TEETH (C1/R2): a DEAD owner's mutation lock IS reclaimed (safe crashed-holder recovery)", () => {
  const root = tmpRoot("c1r2-dead");
  const spId = "SP-C1R2-DEAD";
  fs.mkdirSync(path.join(root, "conductor-leases"), { recursive: true });
  const mlp = path.join(root, "conductor-leases", `${spId}.mutation.lock`);
  // Stamp with a pid that does not exist (dead) + an immutable nonce (the R5 stamp shape) — a proven-dead,
  // nonce-identified owner is reclaimed via the atomic election so the mutator can proceed.
  fs.writeFileSync(mlp, JSON.stringify({ pid: 999999999, ts: Date.now(), nonce: "deadgen0001" }) + "\n");
  let ran = false;
  const res = lease._withMutationLock(spId, root, () => { ran = true; return { ok: true, v: 42 }; }, { maxWaitMs: 200 });
  assert.strictEqual(ran, true, "a proven-dead, nonce-identified owner's lock must be reclaimed so the mutator can proceed");
  assert.deepStrictEqual(res, { ok: true, v: 42 });
});

// ── C1/R3 (gauntlet round 3): an UNIDENTIFIABLE lock (live pre-stamp / torn-stamp) is NEVER mtime-reclaimed ──
// The R3 finding: reclaim keyed on mtime for an unidentifiable lock. But an EMPTY lock (a live holder paused
// between openSync() and its PID stamp) is indistinguishable from a crashed torn-stamp holder by mtime — so
// mtime-reclaiming it lets a contender unlink a LIVE owner's lock, re-opening the exact TOCTOU the lock closes.
// These teeth assert an unidentifiable ANCIENT lock is NEVER acquired-over or removed by a contender.

test("TEETH (C1/R3): an EMPTY (live pre-stamp) ancient mutation lock is NEVER mtime-reclaimed — contender fails-contended and cannot remove it", () => {
  const root = tmpRoot("c1r3-empty");
  const spId = "SP-C1R3-EMPTY";
  fs.mkdirSync(path.join(root, "conductor-leases"), { recursive: true });
  const mlp = path.join(root, "conductor-leases", `${spId}.mutation.lock`);
  // An EMPTY lock: a live holder that won openSync("wx") but is paused BEFORE writing its PID stamp. Give it an
  // ANCIENT mtime — the old mtime-reclaim path would have wrongly unlinked it.
  fs.writeFileSync(mlp, "");
  const old = Date.now() - (24 * 60 * 60 * 1000);
  fs.utimesSync(mlp, new Date(old), new Date(old));
  let ran = false;
  const res = lease._withMutationLock(spId, root, () => { ran = true; return { ok: true }; }, { maxWaitMs: 40 });
  assert.strictEqual(ran, false, "must NOT reclaim an unidentifiable lock by mtime — a live pre-stamp holder looks identical to a crash");
  assert.strictEqual(res.ok, false);
  assert.strictEqual(res.reason, "mutation-contended");
  assert.ok(fs.existsSync(mlp), "the unidentifiable lock must survive (manual-recovery-required, never auto-mtime-reclaimed)");
});

test("TEETH (C1/R3): a TORN-stamp (unparseable JSON) ancient mutation lock is NEVER reclaimed either", () => {
  const root = tmpRoot("c1r3-torn");
  const spId = "SP-C1R3-TORN";
  fs.mkdirSync(path.join(root, "conductor-leases"), { recursive: true });
  const mlp = path.join(root, "conductor-leases", `${spId}.mutation.lock`);
  fs.writeFileSync(mlp, '{"pid": 12'); // truncated / torn mid-write — unparseable
  const old = Date.now() - (24 * 60 * 60 * 1000);
  fs.utimesSync(mlp, new Date(old), new Date(old));
  let ran = false;
  const res = lease._withMutationLock(spId, root, () => { ran = true; return { ok: true }; }, { maxWaitMs: 40 });
  assert.strictEqual(ran, false, "an unparseable owner stamp is unidentifiable — never mtime-reclaimed");
  assert.strictEqual(res.ok, false);
  assert.strictEqual(res.reason, "mutation-contended");
  assert.ok(fs.existsSync(mlp), "the torn-stamp lock must survive");
});

test("TEETH (C1/R3): a stamp with NO finite pid (identity-less) ancient mutation lock is NEVER reclaimed", () => {
  const root = tmpRoot("c1r3-nopid");
  const spId = "SP-C1R3-NOPID";
  fs.mkdirSync(path.join(root, "conductor-leases"), { recursive: true });
  const mlp = path.join(root, "conductor-leases", `${spId}.mutation.lock`);
  fs.writeFileSync(mlp, JSON.stringify({ ts: Date.now() }) + "\n"); // parseable but no pid → unidentifiable owner
  const old = Date.now() - (24 * 60 * 60 * 1000);
  fs.utimesSync(mlp, new Date(old), new Date(old));
  let ran = false;
  const res = lease._withMutationLock(spId, root, () => { ran = true; return { ok: true }; }, { maxWaitMs: 40 });
  assert.strictEqual(ran, false, "a stamp with no finite pid cannot prove the owner is dead — never mtime-reclaimed");
  assert.strictEqual(res.ok, false);
  assert.strictEqual(res.reason, "mutation-contended");
  assert.ok(fs.existsSync(mlp), "the identity-less lock must survive");
});

// ── C1/R5 (bounded-final, β-authorized): whole-lifecycle generation fencing + atomic election + proven-dead ──
// R4 (backend+qa) found the R3 fix still had: (A1) an ABA race — a non-atomic read-then-unlink-by-pathname
// reclaim, where a stale reclaimer could delete the winner's fresh replacement; and (A2) PID-death not proven
// — invalid finite pids (0/-1/1.5/out-of-range) and non-ESRCH errors treated as dead. R5 fences the WHOLE
// lifecycle by an immutable per-lock nonce (link-with-content publish, atomic nonce-keyed election reclaim,
// content-fenced cleanup) and gates reclaim on pidProvenDead (positive safe-int + ESRCH only).

test("TEETH (C1/R5 ABA): a stale reclaimer holding the OLD dead decision cannot unlink the winner's LIVE replacement nor enter its callback", () => {
  const root = tmpRoot("c1r5-aba");
  const spId = "SP-C1R5-ABA";
  fs.mkdirSync(path.join(root, "conductor-leases"), { recursive: true });
  const mlp = lease._mutationLockPath(spId, root);
  const deadNonce = "deadgenABA01";
  // A dead generation (proven-dead pid + nonce) that BOTH contenders A and B observed.
  fs.writeFileSync(mlp, JSON.stringify({ pid: 999999999, ts: Date.now(), nonce: deadNonce }) + "\n");
  let checked = false;
  const res = lease._withMutationLock(spId, root, () => {
    // A reclaimed the dead lock and now holds its OWN live replacement.
    const aOwner = JSON.parse(fs.readFileSync(mlp, "utf8").trim());
    assert.strictEqual(aOwner.pid, process.pid, "A (this process) now holds the reclaimed lock");
    assert.ok(aOwner.nonce && aOwner.nonce !== deadNonce, "A's generation is a NEW nonce, not the dead one");
    // Stale contender B, still holding the OLD dead decision, tries to retire the dead generation — but the
    // lock is now A's LIVE replacement. The non-destructive election + re-verify must leave A's lock intact.
    lease._reclaimDeadGeneration(mlp, deadNonce, 999999999);
    assert.ok(fs.existsSync(mlp), "A's live lock must survive B's stale reclaim attempt");
    assert.strictEqual(JSON.parse(fs.readFileSync(mlp, "utf8").trim()).nonce, aOwner.nonce, "A's generation intact");
    // And B cannot ACQUIRE while A holds → fails-contended → cannot enter its callback.
    let bRan = false;
    const bRes = lease._withMutationLock(spId, root, () => { bRan = true; return { ok: true }; }, { maxWaitMs: 30 });
    assert.strictEqual(bRan, false, "B must NOT enter its callback while A holds");
    assert.strictEqual(bRes.reason, "mutation-contended");
    checked = true;
    return { ok: true };
  }, { maxWaitMs: 300 });
  assert.strictEqual(res.ok, true);
  assert.ok(checked, "the in-hold ABA assertions ran");
  assert.ok(!fs.existsSync(mlp), "A's content-fenced cleanup removed its OWN generation on release");
});

test("TEETH (C1/R5 fence): unlinkIfNonce removes ONLY our generation — cleanup cannot unlink another holder's replacement", () => {
  const root = tmpRoot("c1r5-fence");
  const spId = "SP-C1R5-FENCE";
  fs.mkdirSync(path.join(root, "conductor-leases"), { recursive: true });
  const mlp = lease._mutationLockPath(spId, root);
  fs.writeFileSync(mlp, JSON.stringify({ pid: process.pid, ts: Date.now(), nonce: "genA" }) + "\n");
  lease._unlinkIfNonce(mlp, "genB-different"); // a DIFFERENT generation's cleanup must not touch genA
  assert.ok(fs.existsSync(mlp), "content-fenced cleanup on a different nonce must NOT remove the lock");
  lease._unlinkIfNonce(mlp, "genA"); // our own generation
  assert.ok(!fs.existsSync(mlp), "content-fenced cleanup on our own nonce removes it");
});

test("TEETH (C1/R5 election): only ONE contender retires a dead generation — a pre-existing reap link makes a 2nd contender lose without removing the lock", () => {
  const root = tmpRoot("c1r5-elect");
  const spId = "SP-C1R5-ELECT";
  fs.mkdirSync(path.join(root, "conductor-leases"), { recursive: true });
  const mlp = lease._mutationLockPath(spId, root);
  const deadNonce = "deadElect01";
  fs.writeFileSync(mlp, JSON.stringify({ pid: 999999999, ts: Date.now(), nonce: deadNonce }) + "\n");
  fs.linkSync(mlp, `${mlp}.${deadNonce}.reap`); // simulate contender A having ALREADY won this election
  const won = lease._reclaimDeadGeneration(mlp, deadNonce, 999999999);
  assert.strictEqual(won, false, "the 2nd contender must LOSE the election (EEXIST on the reap link)");
  assert.ok(fs.existsSync(mlp), "the loser must not remove the dead lock — retirement belongs to the election winner");
});

test("TEETH (C1/R5): a PROVEN-DEAD owner WITHOUT a nonce is NOT reclaimed (the election needs a generation id → contended/manual-recovery)", () => {
  const root = tmpRoot("c1r5-nononce");
  const spId = "SP-C1R5-NONONCE";
  fs.mkdirSync(path.join(root, "conductor-leases"), { recursive: true });
  const mlp = lease._mutationLockPath(spId, root);
  fs.writeFileSync(mlp, JSON.stringify({ pid: 999999999, ts: Date.now() }) + "\n"); // dead pid, NO nonce
  const old = Date.now() - (24 * 60 * 60 * 1000);
  fs.utimesSync(mlp, new Date(old), new Date(old));
  let ran = false;
  const res = lease._withMutationLock(spId, root, () => { ran = true; return { ok: true }; }, { maxWaitMs: 40 });
  assert.strictEqual(ran, false, "a dead but nonce-less lock cannot be generation-elected → contended");
  assert.strictEqual(res.reason, "mutation-contended");
  assert.ok(fs.existsSync(mlp), "the nonce-less lock must survive (fail-closed)");
});

for (const badPid of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, "1234", NaN]) {
  test(`TEETH (C1/R5 pid): an ancient lock stamped with an INVALID pid (${String(badPid)}) is NEVER reclaimed`, () => {
    const tag = "c1r5-pid-" + String(badPid).replace(/[^a-z0-9]/gi, "");
    const root = tmpRoot(tag);
    const spId = "SP-C1R5-PID";
    fs.mkdirSync(path.join(root, "conductor-leases"), { recursive: true });
    const mlp = lease._mutationLockPath(spId, root);
    fs.writeFileSync(mlp, JSON.stringify({ pid: badPid, ts: Date.now(), nonce: "genPID" }) + "\n");
    const old = Date.now() - (24 * 60 * 60 * 1000);
    fs.utimesSync(mlp, new Date(old), new Date(old));
    let ran = false;
    const res = lease._withMutationLock(spId, root, () => { ran = true; return { ok: true }; }, { maxWaitMs: 40 });
    assert.strictEqual(ran, false, `pid ${String(badPid)} is not PROVEN dead → unidentifiable → contended`);
    assert.strictEqual(res.reason, "mutation-contended");
    assert.ok(fs.existsSync(mlp), "the lock must survive an invalid-pid stamp");
  });
}

test("pidProvenDead: TRUE only for a positive safe-integer pid that is ESRCH-absent; every other case is NOT proven dead", () => {
  assert.strictEqual(lease.pidProvenDead(process.pid), false, "our own live pid is not proven dead");
  assert.strictEqual(lease.pidProvenDead(0), false);
  assert.strictEqual(lease.pidProvenDead(-1), false);
  assert.strictEqual(lease.pidProvenDead(1.5), false);
  assert.strictEqual(lease.pidProvenDead(Number.MAX_SAFE_INTEGER + 1), false);
  assert.strictEqual(lease.pidProvenDead("1234"), false);
  assert.strictEqual(lease.pidProvenDead(NaN), false);
  assert.strictEqual(lease.pidProvenDead(999999999), true, "a positive safe-int pid with no such process (ESRCH) is proven dead");
});
