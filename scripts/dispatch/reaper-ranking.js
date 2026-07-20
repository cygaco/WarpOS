#!/usr/bin/env node
"use strict";

/**
 * reaper-ranking.js — SP-20260718-005 SEC-5 (packet-08 harvest, G3.8 / AC-14).
 *
 * THE PROBLEM (packet-08 harvest, restated): the recurring bug class across the
 * dispatch control plane is reaping a dispatch from PROCESS ABSENCE ALONE. A
 * vanished OS process is AMBIGUOUS — it may have:
 *   (a) completed normally and exited clean,
 *   (b) been reaped by the harness itself while a GRANDCHILD provider process
 *       kept doing real work (ED-039 / RI-004), or
 *   (c) genuinely died mid-task with real uncommitted work lost.
 * Treating "the process is gone" as sufficient proof of death destroys real
 * in-flight work in case (b) and (c)'s recoverable variants. The fix is an
 * 8-SIGNAL RANKING: process-absence is the WEAKEST signal and is NEVER, by
 * itself, sufficient to justify a reap. A reap decision requires corroboration
 * from at least one STRONGER signal (rank 1-7).
 *
 * This module is a PURE decision core (no fs/process/child_process access —
 * Windows + POSIX safe, zero external deps). Callers (e.g. reap-orphans.js,
 * a future `dispatch doctor`) gather the raw evidence themselves (completion
 * ledger reads, wake-notification markers, git log, captured stdout, etc.)
 * and pass a flat `signals` map into shouldReap(); this module only ranks and
 * decides, never reads disk/process state on its own.
 *
 * THE 8 RANKED SIGNALS (strongest, rank 1, -> weakest, rank 8):
 *   1. completion_record         — an explicit completion/death record written
 *                                  by the dispatch itself (recordCompletion /
 *                                  dispatch-record-fields — the SAME sink both
 *                                  CLI and epsilon-runtime writers use).
 *   2. wake_marker                — a durable completion marker (BE-8 F1
 *                                  wake-notification) — a robust re-wake
 *                                  signal independent of the primary record.
 *   3. worktree_commit            — the worktree carries a real committed
 *                                  change — indirect but strong proof the
 *                                  dispatch's work actually landed.
 *   4. stdout_captured            — non-empty stdout was captured from the
 *                                  dispatch before it vanished.
 *   5. timeout_sigterm_record     — an outer-timeout SIGTERM record: the
 *                                  harness/wrapper logged that IT deliberately
 *                                  terminated the dispatch — the absence that
 *                                  follows is EXPLAINED, not mysterious.
 *   6. wrapper_death_record       — the wrapper's own graceful-death record
 *                                  (it caught its termination and logged a
 *                                  planned exit) — self-reported, weaker than
 *                                  the dispatch's OWN terminal-state record.
 *   7. stale_lock                 — a concurrency lock for this dispatch is
 *                                  stale past TTL — suggestive of abandonment,
 *                                  but a stale LOCK is not proof of what
 *                                  happened to the PROCESS.
 *   8. process_absent (WEAKEST)   — the OS process can no longer be found.
 *                                  NEVER sufficient alone (see THE PROBLEM).
 *
 * shouldReap(signals) is the ONLY decision entrypoint: REFUSE (`reap:false`)
 * whenever the ONLY present signal is rank 8 (process_absent); otherwise a
 * reap is allowed once at least one stronger (rank 1-7) signal corroborates.
 */

// ── The 8 ranked reap-signals, STRONGEST (rank 1) -> WEAKEST (rank 8). ───────
const SIGNALS = Object.freeze(
  [
    {
      rank: 1,
      id: "completion_record",
      label: "an explicit completion/death record written by the dispatch itself",
      detail:
        "the SAME writer (recordCompletion / dispatch-record-fields) attests the dispatch reached a terminal state — the strongest possible evidence a reap decision can rest on.",
    },
    {
      rank: 2,
      id: "wake_marker",
      label: "a durable completion marker (BE-8 wake-notification)",
      detail:
        "a robust re-wake signal was written independent of the primary completion record — corroborates a real completion even if the primary record write raced or failed.",
    },
    {
      rank: 3,
      id: "worktree_commit",
      label: "a worktree with a real committed change",
      detail:
        "git history shows the dispatch's work actually landed — strong indirect proof the work finished, even absent any record.",
    },
    {
      rank: 4,
      id: "stdout_captured",
      label: "non-empty stdout captured from the dispatch",
      detail:
        "the wrapper captured real output before the process vanished — evidence of activity/progress, weaker than a committed artifact.",
    },
    {
      rank: 5,
      id: "timeout_sigterm_record",
      label: "an outer-timeout SIGTERM record",
      detail:
        "the harness/wrapper logged that IT deliberately terminated the dispatch on a timeout — the absence that follows is EXPLAINED, not mysterious.",
    },
    {
      rank: 6,
      id: "wrapper_death_record",
      label: "the wrapper's own graceful-death record",
      detail:
        "the wrapper process logged its own planned exit (caught its termination signal, flushed, exited) — self-reported, and weaker than the dispatch's OWN terminal-state record (rank 1).",
    },
    {
      rank: 7,
      id: "stale_lock",
      label: "a stale concurrency lock past TTL",
      detail:
        "the concurrency-lock file for this dispatch is older than its STALE_AFTER_MS window — suggestive of abandonment, but a lock going stale is NOT proof of what happened to the process itself.",
    },
    {
      rank: 8,
      id: "process_absent",
      label: "process-absence",
      detail:
        "the OS process can no longer be found. WEAKEST signal by design: a vanished process may have completed normally, been reaped by the harness (leaving a still-working grandchild orphaned), or genuinely died. NEVER sufficient alone.",
    },
  ].map(Object.freeze),
);

const SIGNAL_IDS = Object.freeze(SIGNALS.map((s) => s.id));
const WEAKEST_SIGNAL_ID = "process_absent";
const STRONGEST_SIGNAL_ID = "completion_record";

/** Look up a signal's metadata by id (or null if unknown). */
function signalById(id) {
  return SIGNALS.find((s) => s.id === id) || null;
}

/**
 * Build the ranked-evidence view for a `signals` map: ALL 8 signals, in rank
 * order (1 -> 8), each annotated with whether it was observed present. Never
 * throws — a non-object `signals` is treated as "nothing observed".
 */
function rankedEvidence(signals) {
  const s = signals && typeof signals === "object" ? signals : {};
  return SIGNALS.map((sig) => ({
    rank: sig.rank,
    id: sig.id,
    label: sig.label,
    present: !!s[sig.id],
  }));
}

/**
 * shouldReap(signals) -> { reap: boolean, reason: string, rankedEvidence: [] }
 *
 * `signals` is a flat map of signal-id -> truthy/falsy (any subset of the 8
 * SIGNAL_IDS; unknown keys are ignored; malformed/non-object input is treated
 * as "no evidence" — fail-closed, never a reap).
 *
 * THE CORE RULE (G3.8 / AC-14): process-absence (rank 8, the weakest signal)
 * is NEVER sufficient by itself. A reap is allowed ONLY when at least one
 * signal ranked 1-7 (strictly stronger than process-absence) is ALSO present.
 */
function shouldReap(signals) {
  const evidence = rankedEvidence(signals);
  const present = evidence.filter((e) => e.present);

  if (present.length === 0) {
    return {
      reap: false,
      reason:
        "no-evidence: none of the 8 ranked signals is present — nothing corroborates a reap decision",
      rankedEvidence: evidence,
    };
  }

  const processAbsentPresent = present.some((e) => e.id === WEAKEST_SIGNAL_ID);
  const corroborating = present.filter((e) => e.id !== WEAKEST_SIGNAL_ID);

  if (corroborating.length === 0) {
    // The ONLY present signal is process-absence (rank 8, weakest) — REFUSE.
    return {
      reap: false,
      reason:
        "process-absence-alone: rank 8 (the WEAKEST signal) can never justify a reap by itself — a vanished process may have completed normally, been reaped by the harness leaving a still-working grandchild orphaned, or genuinely died. Corroboration from a stronger signal (rank 1-7) is required.",
      rankedEvidence: evidence,
    };
  }

  // At least one stronger (rank 1-7) signal corroborates — reap is allowed.
  // Cite the STRONGEST corroborating signal in the reason (audit-friendly).
  const strongest = corroborating.slice().sort((a, b) => a.rank - b.rank)[0];
  return {
    reap: true,
    reason:
      `corroborated by rank ${strongest.rank} signal (${strongest.id}): ${strongest.label}` +
      (processAbsentPresent
        ? " — process-absence was also observed, but is not load-bearing for this decision"
        : ""),
    rankedEvidence: evidence,
  };
}

// ── Conformance fixture corpus (AC-14 — a fixture per ranked signal in ───────
// isolation + the process-absence-only refusal case + corroboration cases).
// Table-driven so the test file (and any future gauntlet gate) has a single
// source of truth to assert against.
const CONFORMANCE_FIXTURES = Object.freeze(
  [
    {
      name: "rank-1 completion_record alone -> reap allowed",
      signals: { completion_record: true },
      expectReap: true,
    },
    {
      name: "rank-2 wake_marker alone -> reap allowed",
      signals: { wake_marker: true },
      expectReap: true,
    },
    {
      name: "rank-3 worktree_commit alone -> reap allowed",
      signals: { worktree_commit: true },
      expectReap: true,
    },
    {
      name: "rank-4 stdout_captured alone -> reap allowed",
      signals: { stdout_captured: true },
      expectReap: true,
    },
    {
      name: "rank-5 timeout_sigterm_record alone -> reap allowed",
      signals: { timeout_sigterm_record: true },
      expectReap: true,
    },
    {
      name: "rank-6 wrapper_death_record alone -> reap allowed",
      signals: { wrapper_death_record: true },
      expectReap: true,
    },
    {
      name: "rank-7 stale_lock alone -> reap allowed",
      signals: { stale_lock: true },
      expectReap: true,
    },
    {
      name: "rank-8 process_absent ALONE -> reap REFUSED (the core AC-14 rule)",
      signals: { process_absent: true },
      expectReap: false,
    },
    {
      name: "process_absent + the strongest corroborator (completion_record) -> reap allowed",
      signals: { process_absent: true, completion_record: true },
      expectReap: true,
    },
    {
      name: "process_absent + the weakest possible corroborator (stale_lock) -> reap allowed",
      signals: { process_absent: true, stale_lock: true },
      expectReap: true,
    },
    {
      name: "no signals at all -> reap REFUSED",
      signals: {},
      expectReap: false,
    },
  ].map(Object.freeze),
);

module.exports = {
  SIGNALS,
  SIGNAL_IDS,
  WEAKEST_SIGNAL_ID,
  STRONGEST_SIGNAL_ID,
  signalById,
  rankedEvidence,
  shouldReap,
  CONFORMANCE_FIXTURES,
};
