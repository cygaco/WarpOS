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
const crypto = require("node:crypto");

// CWD-independent anchor (mirrors concurrency-lock.js's PROJECT_ROOT reasoning —
// a worktree-cwd dispatch must not get its own separate lease pool).
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const DEFAULT_ROOT = path.join(PROJECT_ROOT, ".claude", "runtime");

// Mirrors concurrency-lock.js's crash-recovery window.
const STALE_AFTER_MS = 20 * 60 * 1000;

// SP-20260718-005 gauntlet C1 (R3→R5-hardened): a per-SP MUTATION lock serializes release/renew/reclaim so
// their read-check-mutate is atomic against each other. The WHOLE lifecycle is GENERATION-FENCED by an
// immutable per-lock `nonce` (R5, β-binding):
//   - PUBLISH is link-with-content (write a stamped temp, then fs.linkSync(tmp, lp) as the O_EXCL create): lp
//     is NEVER visible in an un-stamped state, so there is no empty pre-stamp window and every visible lock is
//     identifiable the instant it exists.
//   - RECLAIM of a crashed holder fires ONLY for a PARSEABLE owner whose pid is PROVEN DEAD (pidProvenDead:
//     positive safe-integer AND process.kill→ESRCH — never an invalid pid, never a non-ESRCH error), and even
//     then ONLY via an ATOMIC ELECTION keyed by the dead owner's nonce (fs.linkSync to a nonce-derived reap
//     path): exactly one contender retires a given dead generation; it re-verifies the linked inode is STILL
//     that dead generation before removing it, so it can never destroy a LIVE replacement (closes the R4 ABA
//     read-then-unlink-by-pathname race).
//   - CLEANUP (the finally + any abort) is content-fenced via unlinkIfNonce: it removes lp ONLY if lp still
//     holds OUR generation, so cleanup is STRUCTURALLY unable to unlink another holder's replacement.
// An UNIDENTIFIABLE lock (empty / torn / unparseable / non-positive-safe-int pid) is NEVER reclaimed —
// contended / manual-recovery-required (fail-CLOSED). Residual (tracked, fail-closed): a reclaimer crash in
// the microsecond window between the election link and its cleanup leaks a reap link → that generation becomes
// manual-recovery-required; and link-with-content assumes same-volume hardlink support (NTFS/POSIX local — a
// non-supporting FS surfaces the link error loudly rather than degrading silently).
const MUTATION_LOCK_WAIT_MS = 5 * 1000; // total spin budget waiting for a contended mutation lock

function mutationLockPath(spId, root) {
  return path.join(leaseRoot(root), `${spId}.mutation.lock`);
}

/**
 * withMutationLock(spId, root, fn) — run fn() while holding a generation-fenced per-SP mutation lock, so
 * release/renew/reclaim never interleave their read-check-mutate. Reclaims ONLY a PROVEN-DEAD, nonce-
 * identified owner via an atomic election; an unidentifiable lock is contended/manual-recovery. Returns
 * fn()'s value, or { ok:false, reason:"mutation-contended" } if the lock can't be taken within the budget.
 */
function withMutationLock(spId, root, fn, opts = {}) {
  ensureDir(leaseRoot(root));
  const lp = mutationLockPath(spId, root);
  const deadline = Date.now() + (Number.isFinite(opts.maxWaitMs) ? opts.maxWaitMs : MUTATION_LOCK_WAIT_MS);
  const ourNonce = crypto.randomBytes(12).toString("hex");
  const tmp = `${lp}.${ourNonce}.tmp`;
  let prepared = false;
  for (;;) {
    // (1) Stage our STAMPED lock content in a private temp so, when it becomes visible at lp, it is ALREADY
    //     identifiable (no empty pre-stamp window; C1/R3+R5). The stamp carries an immutable nonce.
    if (!prepared) {
      try {
        fs.writeFileSync(tmp, JSON.stringify({ pid: process.pid, ts: Date.now(), nonce: ourNonce }) + "\n");
        prepared = true;
      } catch {
        if (Date.now() > deadline) return { ok: false, reason: "mutation-contended" };
        const s = Date.now() + 2; while (Date.now() < s) { /* brief spin */ }
        continue;
      }
    }
    // (2) PUBLISH atomically: fs.linkSync is an O_EXCL create-with-content (EEXIST if lp already held). On
    //     success lp exists ALREADY stamped with ourNonce — never empty.
    try {
      fs.linkSync(tmp, lp);
      try { fs.unlinkSync(tmp); } catch {} // drop the temp name; lp (same inode) survives as the lock
      break; // WE HOLD lp
    } catch (e) {
      if (!e || e.code !== "EEXIST") {
        // A real FS failure (e.g. hardlinks unsupported) — surface loudly, never silently degrade. Clean the temp.
        try { fs.unlinkSync(tmp); } catch {}
        throw e;
      }
      // (3) Held by someone. Reclaim ONLY a PROVEN-DEAD, nonce-identified owner, via an atomic election.
      let owner = null;
      try {
        const raw = fs.readFileSync(lp, "utf8").trim();
        owner = raw ? JSON.parse(raw) : null;
      } catch (readErr) {
        if (readErr && readErr.code === "ENOENT") continue; // vanished between publish-attempt and read — retry
        owner = null; // unreadable → unidentifiable → contended
      }
      if (owner && typeof owner.nonce === "string" && owner.nonce && pidProvenDead(owner.pid)) {
        if (reclaimDeadGeneration(lp, owner.nonce, owner.pid)) continue; // retired the dead lock → retry publish
      }
      // contended: alive/unidentifiable owner, or lost/failed election
      if (Date.now() > deadline) { try { fs.unlinkSync(tmp); } catch {} return { ok: false, reason: "mutation-contended" }; }
      const s = Date.now() + 2; while (Date.now() < s) { /* busy-wait 2ms — contention is rare + brief */ }
      continue;
    }
  }
  try {
    return fn();
  } finally {
    // Content-fenced cleanup: remove lp ONLY if it STILL holds OUR generation. Structurally cannot unlink
    // another holder's replacement (β-binding whole-lifecycle fence).
    unlinkIfNonce(lp, ourNonce);
  }
}

/**
 * Atomic reclaim election for a PROVEN-DEAD generation, keyed by the dead owner's immutable nonce. Returns
 * true iff this contender retired the dead lock (lp is now free to re-publish). NON-DESTRUCTIVE: it links
 * (never MOVES) the dead inode to a nonce-derived reap path — fs.linkSync is O_EXCL, so exactly one contender
 * wins retiring THIS dead generation; the winner RE-VERIFIES the linked inode is still that dead generation
 * (same nonce, still proven dead) BEFORE removing lp, so a live replacement created in the meantime is left
 * intact (closes the R4 ABA). A loser (EEXIST) or an already-retired lock (ENOENT) simply falls through.
 */
function reclaimDeadGeneration(lp, deadNonce, deadPid) {
  const reap = `${lp}.${deadNonce}.reap`;
  try {
    fs.linkSync(lp, reap); // O_EXCL election: exactly one contender wins retiring this dead generation
  } catch {
    return false; // EEXIST (already elected) / ENOENT (already retired) / unsupported → contended
  }
  let retired = false;
  try {
    const raw = fs.readFileSync(reap, "utf8").trim(); // same inode as lp
    const o = raw ? JSON.parse(raw) : null;
    if (o && o.nonce === deadNonce && pidProvenDead(o.pid)) {
      // Retire the dead-lock name (election-held; still proven dead). Record whether it was ACTUALLY removed.
      try { fs.unlinkSync(lp); retired = true; } catch { retired = false; }
    }
    // else: lp is no longer the dead generation (a live replacement appeared) — leave it INTACT (retired stays false).
  } catch {
    /* reap unreadable — fall through to clean the reap link */
  }
  try { fs.unlinkSync(reap); } catch {} // always clean the reap link
  // F1 (β design-lock 0.91): return true ONLY when the dead lock is CONFIRMED gone. A swallowed unlink failure
  // must NOT read as retirement — otherwise withMutationLock treats `true` as success and `continue`s in a loop
  // that never observes its deadline (an unbounded busy-loop on a persistent EPERM). If the unlink failed but lp
  // is already absent (raced away), that still counts as retired. Otherwise return false → the caller falls to
  // the contended/deadline path and returns a BOUNDED mutation-contended.
  if (!retired) {
    try { retired = !fs.existsSync(lp); } catch { retired = false; }
  }
  return retired;
}

/**
 * Remove `lp` ONLY if it still holds the given generation nonce. The structural cleanup fence: it cannot
 * unlink a lock of a DIFFERENT generation (another holder's replacement). Best-effort; absent/unreadable/
 * mismatched → left untouched.
 */
function unlinkIfNonce(lp, nonce) {
  try {
    const raw = fs.readFileSync(lp, "utf8").trim();
    const owner = raw ? JSON.parse(raw) : null;
    if (owner && owner.nonce === nonce) fs.unlinkSync(lp);
  } catch {
    /* gone / unreadable → nothing to clean */
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

/**
 * pidLiveness(pid) -> "dead" | "live" | "indeterminate". The ONE liveness primitive — the SOLE call site of
 * the OS liveness signal in this module (ED-237, β design-lock 0.90). Every reclaim/supersede decision is a
 * GATE on this 3-STATE result, at EVERY site; INDETERMINATE never authorizes a reclaim (it short-circuits to
 * contended / manual-recovery), so an invalid pid (0 / negative / fractional / out-of-range / non-integer) or
 * a non-ESRCH signal error can NEVER be mistaken for dead — the R4/R5 unsafe-reclaim class root.
 *   - not a positive safe integer          -> "indeterminate"
 *   - signal(0) succeeds                    -> "live"
 *   - signal(0) throws ESRCH                -> "dead"          (no such process — PROVEN absent)
 *   - signal(0) throws EPERM / other        -> "indeterminate" (cannot prove absence)
 */
function pidLiveness(pid) {
  if (!Number.isSafeInteger(pid) || pid <= 0) return "indeterminate";
  try {
    process.kill(pid, 0);
    return "live";
  } catch (e) {
    if (e && e.code === "ESRCH") return "dead";
    return "indeterminate"; // EPERM / any other error → cannot prove absence
  }
}

/**
 * pidProvenDead(pid) -> boolean. Thin SINGLE-SOURCE wrapper over pidLiveness (β note 2): TRUE iff the pid is
 * PROVEN dead (ESRCH). Retained for the mutation-lock dead-gate call sites + the invalid-pid regression teeth;
 * all liveness flows through the ONE pidLiveness primitive.
 */
function pidProvenDead(pid) {
  return pidLiveness(pid) === "dead";
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
 * A crashed holder's lease is reclaimable per the ED-237 3-state liveness GATE
 * (pidLiveness): DEAD (proven-ESRCH) reclaims; LIVE reclaims ONLY when
 * stale-past-TTL (STALE_AFTER_MS, fencing-token-protected hung-conductor
 * recovery); INDETERMINATE (invalid pid / non-ESRCH) is refused
 * (`lease-indeterminate`, manual-recovery — never reclaimed). Reclaim mints a
 * NEW, strictly higher fencing token that supersedes the old one — safe, not a
 * manual force-delete. A live, non-stale lease refuses reclaim (`lease-active`).
 * If nothing is currently held, reclaim behaves like a cold acquire.
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
      // ED-237 (β design-lock 0.90): liveness is a 3-STATE GATE evaluated BEFORE the TTL/stale branch. This
      // RIPS OUT the R5 `dead || stale` OR that let an INDETERMINATE-but-stale lease reclaim via the stale path
      // (the occurrence-3 leak). INDETERMINATE (invalid pid / non-ESRCH) short-circuits to manual-recovery and
      // is NEVER reclaimed. DEAD (proven-ESRCH) reclaims. LIVE reclaims ONLY when stale-past-TTL — the
      // intentional hung-conductor recovery, FENCING-TOKEN-PROTECTED (the new token supersedes; the stale live
      // holder's release/renew are refused by the fencing check in release()/renew()).
      const liveness = pidLiveness(holder.pid);
      if (liveness === "indeterminate") {
        return { ok: false, reason: "lease-indeterminate", token: holder.token, holder };
      }
      if (liveness === "live") {
        const stale = Date.now() - (holder.renewed_at || holder.acquired_at || 0) > STALE_AFTER_MS;
        if (!stale) {
          return { ok: false, reason: "lease-active", token: holder.token, holder };
        }
        // live AND stale-past-TTL → fall through to reclaim (fencing-token-protected live-recovery).
      }
      // liveness === "dead" (proven), OR (liveness === "live" AND stale) → reclaim.
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
  pidLiveness,
  pidProvenDead,
  STALE_AFTER_MS,
  DEFAULT_ROOT,
  // exported for the C1 mutation-lock teeth tests (serialization + R5 election/fence guarantees)
  _withMutationLock: withMutationLock,
  _reclaimDeadGeneration: reclaimDeadGeneration,
  _unlinkIfNonce: unlinkIfNonce,
  _mutationLockPath: mutationLockPath,
};
