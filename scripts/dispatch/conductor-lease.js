"use strict";
/**
 * conductor-lease.js — cross-session conductor lease for an SP-id
 * (SP-20260718-005 BE-4, AC-6/AC-7/AC-7b).
 *
 * A "conductor" claims an SP-id so two sessions can't conduct the same
 * sprint at once. This is a CROSS-SESSION artifact (SHARP-1): its trust
 * anchor is atomic-FS (O_EXCL create) + a durable MONOTONIC fencing token —
 * NEVER a per-session HMAC (that's the R3 cross-session false-RED class)
 * and NEVER mtime (clock skew / same-ms collisions — DoE risk #3).
 *
 * Reuses the CREATE-pattern from scripts/hooks/lib/concurrency-lock.js
 * (`fs.openSync(path, "wx")`, i.e. O_EXCL) as the actual mutex: exactly one
 * caller among simultaneous acquirers wins the wx-open, OS-guaranteed. Does
 * NOT reuse concurrency-lock's mtime-based staleness pruning for the fencing
 * token itself — the token is a durable counter persisted in an append-only
 * claimlog, not derived from file mtimes.
 *
 * Lifecycle: acquire (cold) / release (fencing-checked) / renew (extend a
 * live hold, same token) / reclaim (a crashed/stale holder's lease is safely
 * superseded with a NEW, strictly higher token — never a manual
 * force-delete) / verifyToken (is `token` the CURRENT holder's token).
 *
 * No external deps. Windows + POSIX safe.
 */

const fs = require("node:fs");
const path = require("node:path");

// CWD-independent anchor (mirrors concurrency-lock.js's PROJECT_ROOT reasoning —
// a worktree-cwd dispatch must not get its own separate lease pool).
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const DEFAULT_ROOT = path.join(PROJECT_ROOT, ".claude", "runtime");

// Mirrors concurrency-lock.js's crash-recovery window.
const STALE_AFTER_MS = 20 * 60 * 1000;

// SP-20260718-005 gauntlet C1 fix: a per-SP MUTATION lock serializes release/renew/reclaim so their
// read-check-mutate is atomic against each other. A lease mutation is microseconds; a mutation-lock file
// older than this is a crashed holder and is reclaimable (mtime is SAFE here — unlike the fencing token,
// this lock carries no durable identity, it is a pure short-lived mutex). Deliberately small.
const MUTATION_LOCK_STALE_MS = 10 * 1000; // 10s — a mutation never legitimately holds this long
const MUTATION_LOCK_WAIT_MS = 5 * 1000; // total spin budget waiting for a contended mutation lock

function mutationLockPath(spId, root) {
  return path.join(leaseRoot(root), `${spId}.mutation.lock`);
}

/**
 * withMutationLock(spId, root, fn) — run fn() while holding an O_EXCL per-SP mutation lock, so
 * release/renew/reclaim never interleave their read-check-mutate. Reclaims a STALE mutation lock (a
 * crashed holder, by mtime — safe for a short-lived mutex). Returns fn()'s value, or
 * { ok:false, reason:"mutation-contended" } if the lock can't be taken within the wait budget.
 */
function withMutationLock(spId, root, fn, opts = {}) {
  ensureDir(leaseRoot(root));
  const lp = mutationLockPath(spId, root);
  const deadline = Date.now() + (Number.isFinite(opts.maxWaitMs) ? opts.maxWaitMs : MUTATION_LOCK_WAIT_MS);
  let fd = null;
  for (;;) {
    try {
      fd = fs.openSync(lp, "wx");
      break;
    } catch (e) {
      if (!e || e.code !== "EEXIST") throw e;
      // Held — reclaim it if the holder crashed (mtime past the stale window), else spin briefly.
      try {
        const st = fs.statSync(lp);
        if (Date.now() - st.mtimeMs > MUTATION_LOCK_STALE_MS) {
          fs.unlinkSync(lp);
          continue;
        }
      } catch {
        continue; // lock vanished between open and stat — retry the create
      }
      if (Date.now() > deadline) return { ok: false, reason: "mutation-contended" };
      // Tiny synchronous spin — a lease mutation completes in microseconds; contention is rare + brief.
      const spinUntil = Date.now() + 2;
      while (Date.now() < spinUntil) { /* busy-wait 2ms */ }
    }
  }
  try {
    return fn();
  } finally {
    try { fs.closeSync(fd); } catch {}
    try { fs.unlinkSync(lp); } catch {}
  }
}

function leaseRoot(root) {
  return path.join(root || DEFAULT_ROOT, "conductor-leases");
}
function leasePath(spId, root) {
  return path.join(leaseRoot(root), `${spId}.lease`);
}
function claimlogPath(spId, root) {
  return path.join(leaseRoot(root), `${spId}.claimlog`);
}
function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function pidAlive(pid) {
  if (!Number.isFinite(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    // ESRCH = no such process; EPERM = exists but we lack signal rights
    // (treat as alive — better to leave the lease than wrongly reclaim it).
    if (e && e.code === "EPERM") return true;
    return false;
  }
}

/**
 * Monotonic fencing-token mint. This is ONLY ever invoked by the sole
 * winner of an O_EXCL lease-file creation (see acquire()/reclaim() below) —
 * the wx-open IS the mutex, so there is no cross-process race on this
 * read-max-then-append. Persisted as an append-only JSONL claimlog so the
 * token is durable + auditable across sessions/process restarts.
 */
function mintToken(spId, root, meta) {
  const p = claimlogPath(spId, root);
  let maxSeq = 0;
  try {
    const raw = fs.readFileSync(p, "utf8");
    for (const line of raw.split("\n")) {
      if (!line.trim()) continue;
      try {
        const entry = JSON.parse(line);
        if (typeof entry.token === "number" && entry.token > maxSeq) maxSeq = entry.token;
      } catch {
        /* skip a corrupt/torn line — append-only tolerates a partial last write */
      }
    }
  } catch {
    /* no claimlog yet — first token is 1 */
  }
  const token = maxSeq + 1;
  const entry = Object.assign({ token, ts: Date.now() }, meta || {});
  fs.appendFileSync(p, JSON.stringify(entry) + "\n");
  return token;
}

function readHolder(spId, root) {
  try {
    const raw = fs.readFileSync(leasePath(spId, root), "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeHolderFd(fd, holder) {
  fs.writeSync(fd, JSON.stringify(holder) + "\n");
}

/**
 * acquire(spId, {root, sessionId}) -> {ok, token, holder, reason?}
 * COLD acquire: O_EXCL-creates `<root>/conductor-leases/<spId>.lease`.
 * Exactly one caller among simultaneous acquirers wins; every other caller
 * gets a clean {ok:false} — no crash, no double-hold (AC-6, AC-F7).
 */
function acquire(spId, opts = {}) {
  const { root, sessionId } = opts;
  ensureDir(leaseRoot(root));
  const lp = leasePath(spId, root);
  let fd;
  try {
    fd = fs.openSync(lp, "wx");
  } catch {
    const holder = readHolder(spId, root);
    return { ok: false, reason: "held", token: holder ? holder.token : null, holder };
  }
  try {
    const token = mintToken(spId, root, {
      sessionId: sessionId || null,
      pid: process.pid,
      action: "acquire",
    });
    const holder = {
      token,
      sessionId: sessionId || null,
      pid: process.pid,
      acquired_at: Date.now(),
      renewed_at: Date.now(),
    };
    writeHolderFd(fd, holder);
    return { ok: true, token, holder };
  } finally {
    fs.closeSync(fd);
  }
}

/**
 * release(spId, {root, token}) -> {ok, reason?}
 * Fencing-checked: only the CURRENT holder's token may release. A release
 * attempt carrying a superseded token is refused (it cannot even clear a
 * lease it no longer legitimately holds).
 */
function release(spId, opts = {}) {
  const { root, token } = opts;
  // C1 fix: read-check-unlink under the mutation lock, RE-READING the holder inside — so a reclaim that
  // superseded this token between a stale read and the unlink is seen (fencing-mismatch), never deleted.
  return withMutationLock(spId, root, () => {
    const holder = readHolder(spId, root);
    if (!holder) return { ok: false, reason: "not-held" };
    if (holder.token !== token) return { ok: false, reason: "fencing-mismatch" };
    try {
      fs.unlinkSync(leasePath(spId, root));
    } catch {
      /* already gone — treat as released */
    }
    return { ok: true };
  });
}

/**
 * renew(spId, {root, token}) -> {ok, token?, reason?}
 * Extends a live hold (refreshes renewed_at) WITHOUT minting a new token —
 * the token identity of a hold does not change across a renew.
 */
function renew(spId, opts = {}) {
  const { root, token } = opts;
  // C1 fix: read-check-write under the mutation lock, RE-READING inside — a stale renew can no longer
  // overwrite a lease a reclaimer already superseded (which had rolled the fencing token backward).
  return withMutationLock(spId, root, () => {
    const holder = readHolder(spId, root);
    if (!holder) return { ok: false, reason: "not-held" };
    if (holder.token !== token) return { ok: false, reason: "fencing-mismatch" };
    const updated = Object.assign({}, holder, { renewed_at: Date.now() });
    fs.writeFileSync(leasePath(spId, root), JSON.stringify(updated) + "\n");
    return { ok: true, token: holder.token };
  });
}

/**
 * reclaim(spId, {root, sessionId}) -> {ok, token, holder, reclaimed_from?, reason?}
 * A crashed holder's lease is reclaimable: pid-dead OR stale-past-TTL
 * (mirrors concurrency-lock's pidAlive + STALE_AFTER_MS). Reclaim mints a
 * NEW, strictly higher fencing token that supersedes the dead one — safe,
 * not a manual force-delete. A live, healthy lease refuses reclaim. If
 * nothing is currently held, reclaim behaves like a cold acquire.
 */
function reclaim(spId, opts = {}) {
  const { root, sessionId } = opts;
  ensureDir(leaseRoot(root));
  // C1 fix: the whole read-decide-delete-recreate runs under the mutation lock, so a reclaim can never
  // interleave with a concurrent release/renew — the exact window backend-reviewer flagged.
  return withMutationLock(spId, root, () => {
    const lp = leasePath(spId, root);
    const holder = readHolder(spId, root);
    if (holder) {
      const dead = !pidAlive(holder.pid);
      const stale = Date.now() - (holder.renewed_at || holder.acquired_at || 0) > STALE_AFTER_MS;
      if (!dead && !stale) {
        return { ok: false, reason: "lease-active", token: holder.token, holder };
      }
      try {
        fs.unlinkSync(lp);
      } catch {
        /* raced with another reclaimer/release — fall through; the wx create
           below will fail cleanly if someone else already won */
      }
    }
    let fd;
    try {
      fd = fs.openSync(lp, "wx");
    } catch {
      const current = readHolder(spId, root);
      return { ok: false, reason: "raced", token: current ? current.token : null, holder: current };
    }
    try {
      const token = mintToken(spId, root, {
        sessionId: sessionId || null,
        pid: process.pid,
        action: "reclaim",
      });
      const newHolder = {
        token,
        sessionId: sessionId || null,
        pid: process.pid,
        acquired_at: Date.now(),
        renewed_at: Date.now(),
      };
      writeHolderFd(fd, newHolder);
      return { ok: true, token, holder: newHolder, reclaimed_from: holder || null };
    } finally {
      fs.closeSync(fd);
    }
  });
}

/**
 * verifyToken(spId, token, {root}) -> boolean
 * TRUE only if `token` is exactly the current holder's fencing token. A
 * write carrying a superseded (or simply non-current) token is refused.
 * Cross-session-valid: monotonic counter, no HMAC, no mtime (AC-7, AC-F5).
 */
function verifyToken(spId, token, opts = {}) {
  const { root } = opts;
  const holder = readHolder(spId, root);
  if (!holder) return false;
  return holder.token === token;
}

/**
 * status(spId, {root}) -> current holder object | null
 * Read-only inspection helper (resume admission / ledger-visibility support,
 * AC-7b) — no side effects.
 */
function status(spId, opts = {}) {
  return readHolder(spId, opts.root);
}

module.exports = {
  acquire,
  release,
  renew,
  reclaim,
  verifyToken,
  status,
  pidAlive,
  STALE_AFTER_MS,
  DEFAULT_ROOT,
  // exported for the C1 mutation-lock teeth test (serialization guarantee)
  _withMutationLock: withMutationLock,
};
