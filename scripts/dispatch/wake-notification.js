#!/usr/bin/env node
"use strict";

/**
 * wake-notification.js — F1 durable completion signal / re-wake seam
 * (SP-20260718-005 BE-8, AC-11, ties to G3.8 reaper-ranking / SEC-5).
 *
 * THE PROBLEM (WG-6 — the dropped re-wake class, 9+ occurrences this session,
 * see .claude/agents/_system/guides/teammate-stall-rules.md): a background
 * dispatch subprocess completing does NOT reliably re-wake the orchestrator
 * that fired it. The harness re-wakes a teammate only on an incoming
 * SendMessage; nothing wakes a poller the instant a subprocess exits. A
 * process VANISHING is also not a safe stand-in for "it finished" — the
 * grandchild provider CLI can be REAPED by the harness (ED-039/RI-004) while
 * still mid-work, or long after it actually finished (the "reaped" case that
 * turned out to have completed late, teammate-stall-rules.md's poll-patience
 * section). So:
 *
 *   PROCESS-ABSENCE IS NEVER THE COMPLETION SIGNAL.
 *
 * THE FIX — FIRE-AND-POLL, with a DURABLE marker as the one true signal:
 *
 *   1. FIRE: the dispatch launches (elsewhere — this module does not spawn
 *      anything).
 *   2. On completion, the dispatch (or its supervisor) calls
 *      `signalCompletion(dispatchId, outcome, {root})`, which writes a
 *      DURABLE marker file via an atomic write-then-rename. "Durable" means:
 *      the marker exists on disk independently of any in-memory watcher, so
 *      it is detected by a poller EVEN IF nobody was actively polling at the
 *      instant the marker was written (no missed-wake window — the marker
 *      just sits there until read).
 *   3. The waiting side calls `pollCompletion(dispatchId, {root})` on its own
 *      clock (bounded, repeated — see teammate-stall-rules.md's "POLL a
 *      durable signal, in-turn"). It reads the marker; presence = completed,
 *      ABSENCE = "not completed yet" — NEVER "must have finished because the
 *      process is gone". A missing marker covers BOTH "still running" and
 *      "reaped with nothing ever recorded" — those two cases are only told
 *      apart by `isReapNotCompletion()` below, which additionally consults a
 *      caller-supplied process-liveness signal.
 *   4. `isReapNotCompletion(dispatchId, {root, pidAlive})` names the failure
 *      class explicitly: if the marker is present, it was NEVER a reap (it's
 *      a completion, full stop — regardless of whatever the process table
 *      says). If the marker is absent AND the process is confirmed dead, THAT
 *      is a reap (SEC-5 reaper-ranking: process-absence ALONE never justifies
 *      calling something done, and — the same signal read the other way —
 *      absence + dead-pid IS how a reap gets correctly named, not silently
 *      inferred as success).
 *
 * CONTRACT (read this before wiring a new poller):
 *   - The marker file is the ONLY completion signal this module recognizes.
 *   - A poller MUST treat "no marker" as "not completed" and keep polling
 *     (bounded) or classify via isReapNotCompletion — it must NEVER infer
 *     completion from the dispatched process no longer being in the process
 *     table.
 *   - signalCompletion is safe to call from a process that is about to exit
 *     (write-then-rename lands the marker before this module returns).
 *   - pollCompletion is safe to call before signalCompletion has ever run
 *     (returns {completed:false}) and any number of times after (idempotent
 *     read; the marker is not consumed/deleted by reading it).
 *
 * No external deps. Windows + POSIX safe: the rename is same-directory (same
 * volume) so it is atomic on both platforms (Node uses MoveFileExW with
 * MOVEFILE_REPLACE_EXISTING on Windows; a plain rename(2) on POSIX).
 */

const fs = require("node:fs");
const path = require("node:path");

// CWD-independent anchor (mirrors conductor-lease.js / concurrency-lock.js —
// a worktree-cwd dispatch must land its markers in the SAME pool a canonical
// poller reads, never a separate per-worktree pool).
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const DEFAULT_ROOT = path.join(PROJECT_ROOT, ".claude", "runtime");

function wakeDir(root) {
  return path.join(root || DEFAULT_ROOT, "dispatch-wake");
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

// dispatchId flows straight into a filename. Reject anything that isn't a
// non-empty string rather than silently coercing (a coerced/blank id would
// let two different dispatches collide on the same marker).
function assertValidId(dispatchId) {
  if (typeof dispatchId !== "string" || !dispatchId.trim()) {
    throw new Error("wake-notification: dispatchId is required (non-empty string)");
  }
}

// Filesystem-safe encoding of the id — collision-free for any distinct input
// string (percent-encodes every byte outside the safe set, so two different
// ids can never fold onto the same filename).
function encodeId(dispatchId) {
  return dispatchId.replace(/[^a-zA-Z0-9_-]/g, (ch) =>
    "%" + Buffer.from(ch, "utf8").toString("hex"),
  );
}

function markerPath(dispatchId, root) {
  return path.join(wakeDir(root), `${encodeId(dispatchId)}.done`);
}

/**
 * signalCompletion(dispatchId, outcome, {root}) -> {ok, path}
 *
 * Writes the durable completion marker. Atomic write-then-rename: the record
 * is fully written to a temp file in the SAME directory, then renamed onto
 * the final marker path — a poller never observes a torn/partial marker, and
 * an overwrite (double-signal, e.g. a retried completion callback) is a clean
 * atomic replace, not a corrupt interleave.
 *
 * @param {string} dispatchId
 * @param {*} outcome any JSON-serializable outcome payload (e.g.
 *   {ok:true, ...} or a terminal_state string) — this module does not
 *   interpret it, only carries it durably.
 * @param {{root?: string}} [opts]
 */
function signalCompletion(dispatchId, outcome, opts = {}) {
  assertValidId(dispatchId);
  const { root } = opts;
  const dir = wakeDir(root);
  ensureDir(dir);
  const finalPath = markerPath(dispatchId, root);
  const tmpPath = path.join(
    dir,
    `.tmp-${encodeId(dispatchId)}-${process.pid}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`,
  );
  const record = {
    dispatch_id: dispatchId,
    outcome: outcome === undefined ? null : outcome,
    signaled_at: new Date().toISOString(),
    pid: process.pid,
  };
  fs.writeFileSync(tmpPath, JSON.stringify(record) + "\n");
  fs.renameSync(tmpPath, finalPath); // atomic replace — same dir/volume
  return { ok: true, path: finalPath };
}

/**
 * pollCompletion(dispatchId, {root}) -> {completed, outcome, signaledAt}
 *
 * The fire-and-poll READ side. Reads the durable marker if present. A MISSING
 * marker ALWAYS means `completed:false` — never inferred-complete from
 * process absence (that inference is exactly the fail-open this module
 * closes; see isReapNotCompletion for how process-absence is actually
 * handled). A present-but-unparseable marker (torn write from a crash mid-
 * write — should not happen given the atomic rename, but defensive) is also
 * treated as not-yet-completed rather than fabricating an outcome from noise.
 */
function pollCompletion(dispatchId, opts = {}) {
  assertValidId(dispatchId);
  const { root } = opts;
  let raw;
  try {
    raw = fs.readFileSync(markerPath(dispatchId, root), "utf8");
  } catch {
    return { completed: false, outcome: null, signaledAt: null };
  }
  let record;
  try {
    record = JSON.parse(raw);
  } catch {
    return { completed: false, outcome: null, signaledAt: null };
  }
  return {
    completed: true,
    outcome: record.outcome === undefined ? null : record.outcome,
    signaledAt: record.signaled_at || null,
  };
}

/**
 * isReapNotCompletion(dispatchId, {root, pidAlive}) -> boolean
 *
 * Names the failure class SEC-5 (reaper-ranking) depends on: a process that
 * VANISHED WITHOUT a completion marker is a REAP, not a completion.
 *
 * `pidAlive` is INJECTED (a boolean, or a zero-arg function returning one) —
 * this module makes no OS process-liveness call itself; callers supply the
 * real probe (e.g. concurrency-lock.js#pidAlive / reap-orphans' tree check)
 * or a fixture in tests.
 *
 * Truth table (marker present always wins — it is the only trusted signal):
 *   marker present                       -> false (a completion; never a reap,
 *                                            no matter what the process table says)
 *   marker absent, pid confirmed dead    -> true  (a reap: vanished with
 *                                            nothing ever recorded)
 *   marker absent, pid still alive       -> false (still running — not a reap,
 *                                            not a completion, just in-flight;
 *                                            keep polling)
 *
 * @returns {boolean} true ONLY for the "vanished, no marker" reap case.
 */
function isReapNotCompletion(dispatchId, opts = {}) {
  const { root, pidAlive } = opts;
  const poll = pollCompletion(dispatchId, { root });
  if (poll.completed) return false; // durable marker exists: a completion, never a reap
  const alive = typeof pidAlive === "function" ? !!pidAlive() : !!pidAlive;
  // No marker: the process is either still running (not yet a reap) or it
  // has vanished with NO completion ever recorded — exactly the reap this
  // function names. Absence of the marker is NEVER read as "must have
  // succeeded"; only "dead AND no marker" earns the reap label.
  return !alive;
}

module.exports = {
  signalCompletion,
  pollCompletion,
  isReapNotCompletion,
  markerPath,
  wakeDir,
  DEFAULT_ROOT,
};
