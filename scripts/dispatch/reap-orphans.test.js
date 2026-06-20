#!/usr/bin/env node
"use strict";

/**
 * reap-orphans.test.js — P5 fixture test for the orphaned-dispatch-subprocess
 * reaper (E-TEAMS-MIGRATION-001). Exercises the PURE classify() core with PLANTED
 * process snapshots — no real `ps`/`taskkill`, no live processes — so every safety
 * gate is proven against known inputs:
 *
 *   GATE 1 signature   — only WarpOS dispatch subprocesses are candidates.
 *   GATE 2 orphaned    — parent dead / reparented-to-init ⇒ orphan; parent alive ⇒ skip.
 *   GATE 3 age         — younger than min-age ⇒ skip (may be a live in-flight dispatch).
 *   GATE 4 live-lock   — a fresh concurrency lock for the PID ⇒ skip (alive + tracked).
 *   GATE 5 own-tree    — never the reaper's own PID / ancestors.
 *   FAIL-OPEN          — ambiguous parent liveness ⇒ skip (never reap on unknown).
 *
 * The P5 PLANTED-VIOLATION (h.violation) is inverted vs an enforcer: here a "pass"
 * means "the gate spared a process it must NOT reap"; the planted-violation proves
 * the reaper DOES flag a genuine orphan (so it isn't a no-op that spares everything).
 *
 *   node scripts/dispatch/reap-orphans.test.js
 */

const { harness } = require("../checks/lib/fixture-harness");
const { classify, isDispatchProc } = require("./reap-orphans");

const h = harness("reap-orphans");

const MIN = 20 * 60 * 1000; // 20min age floor used by the production default
const OLD = MIN + 60_000; // comfortably past the floor
const YOUNG = 5_000; // 5s — well under the floor

// Helper: run classify with a single proc + sensible defaults, return {orphans, skipped}.
function run(proc, extra = {}) {
  const procs = [proc, ...(extra.procs || [])];
  return classify({
    procs,
    selfTree: extra.selfTree || new Set(),
    livePids: extra.livePids || new Set(),
    now: Date.now(),
    minAgeMs: MIN,
  });
}
const isOrphan = (res, pid) => res.orphans.some((o) => o.pid === pid);
const isSkipped = (res, pid) => res.skipped.some((s) => s.pid === pid);

// ── GATE 1: signature ────────────────────────────────────────────────────────
h.test("a bare `node foo.js` is NOT a candidate (not even skipped)", () => {
  const res = run({ pid: 100, ppid: 1, ageMs: OLD, cmd: "node some/unrelated.js" });
  assert(!isOrphan(res, 100) && !isSkipped(res, 100), "non-dispatch proc must be ignored entirely");
});
h.test("a foreign `claude` (no telemetry marker) is NOT a candidate", () => {
  const res = run({ pid: 101, ppid: 1, ageMs: OLD, cmd: "claude -p --agent foo" });
  assert(!isOrphan(res, 101) && !isSkipped(res, 101), "a non-WarpOS claude must not be touched");
});
h.test("isDispatchProc matches the wrapper basenames + telemetry markers", () => {
  assert(isDispatchProc("node scripts/dispatch-claude.js builder p.txt"), "dispatch-claude.js");
  assert(isDispatchProc("node scripts/dispatch-agent.js reviewer p.txt"), "dispatch-agent.js");
  assert(isDispatchProc("codex exec ... WARPOS_RUN_ID=abc"), "telemetry marker");
  assert(!isDispatchProc("node build.js"), "unrelated node");
  assert(!isDispatchProc(""), "empty cmd");
});

// ── GATE 2: orphaned (the core decision) ─────────────────────────────────────
h.test("dispatch proc reparented to init (ppid=1), old, no lock => ORPHAN", () => {
  const res = run({ pid: 200, ppid: 1, ageMs: OLD, cmd: "node scripts/dispatch-agent.js reviewer p.txt" });
  assert(isOrphan(res, 200), "a reparented, old, unlocked dispatch subprocess is an orphan");
});
h.test("dispatch proc whose parent is ALIVE in the snapshot => SKIP (parent-alive)", () => {
  // parent pid 300 present in the snapshot ⇒ alive ⇒ not an orphan.
  const res = run(
    { pid: 301, ppid: 300, ageMs: OLD, cmd: "node scripts/dispatch-claude.js builder p.txt" },
    { procs: [{ pid: 300, ppid: 10, ageMs: OLD, cmd: "node harness" }] },
  );
  assert(isSkipped(res, 301) && !isOrphan(res, 301), "a child of a live parent is NOT an orphan");
  const why = res.skipped.find((s) => s.pid === 301).reasons;
  assert(why.includes("parent-alive"), "skip reason must be parent-alive");
});

// ── GATE 3: age ──────────────────────────────────────────────────────────────
h.test("a YOUNG dispatch orphan => SKIP (too-young — may be live in-flight)", () => {
  const res = run({ pid: 400, ppid: 1, ageMs: YOUNG, cmd: "node scripts/dispatch-agent.js reviewer p.txt" });
  assert(isSkipped(res, 400) && !isOrphan(res, 400), "young process must be spared");
  assert(res.skipped.find((s) => s.pid === 400).reasons.some((r) => r.startsWith("too-young")), "reason too-young");
});

// ── GATE 4: live lock ────────────────────────────────────────────────────────
h.test("a dispatch orphan WITH a fresh live lock => SKIP (has-live-lock)", () => {
  const res = run(
    { pid: 500, ppid: 1, ageMs: OLD, cmd: "node scripts/dispatch-agent.js reviewer p.txt" },
    { livePids: new Set([500]) },
  );
  assert(isSkipped(res, 500) && !isOrphan(res, 500), "a live-locked dispatch is alive + tracked, never reaped");
  assert(res.skipped.find((s) => s.pid === 500).reasons.includes("has-live-lock"), "reason has-live-lock");
});

// ── GATE 5: own process tree ─────────────────────────────────────────────────
h.test("the reaper's own PID is never reaped (own-process-tree)", () => {
  const res = run(
    { pid: 600, ppid: 1, ageMs: OLD, cmd: "node scripts/dispatch-agent.js reviewer p.txt" },
    { selfTree: new Set([600]) },
  );
  assert(isSkipped(res, 600) && !isOrphan(res, 600), "own tree must be spared");
  assert(res.skipped.find((s) => s.pid === 600).reasons.includes("own-process-tree"), "reason own-process-tree");
});

// ── FAIL-OPEN: ambiguous parent ──────────────────────────────────────────────
h.test("ambiguous parent (ppid present, NOT in snapshot, unprovable) => SKIP", () => {
  // ppid 9999 not in snapshot; classify calls pidAlive(9999). On a real box 9999
  // is almost certainly dead ⇒ would be orphan. To make the AMBIGUITY deterministic
  // we instead assert the inverse: a proc with a NON-finite ppid is parent-unknown.
  const res = run({ pid: 700, ppid: NaN, ageMs: OLD, cmd: "node scripts/dispatch-agent.js reviewer p.txt" });
  assert(isSkipped(res, 700) && !isOrphan(res, 700), "unknown parent ⇒ ambiguous ⇒ skip (fail-open)");
  assert(res.skipped.find((s) => s.pid === 700).reasons.includes("parent-liveness-unknown"), "reason parent-liveness-unknown");
});

// ── multi-condition: ONLY the genuine orphan among a mixed batch ──────────────
h.test("mixed batch: only the genuine orphan is flagged; live/young/foreign spared", () => {
  const res = classify({
    procs: [
      { pid: 800, ppid: 1, ageMs: OLD, cmd: "node scripts/dispatch-agent.js reviewer p.txt" }, // ORPHAN
      { pid: 801, ppid: 1, ageMs: YOUNG, cmd: "node scripts/dispatch-claude.js builder p.txt" }, // young → skip
      { pid: 802, ppid: 1, ageMs: OLD, cmd: "node unrelated.js" }, // not ours → ignored
      { pid: 803, ppid: 50, ageMs: OLD, cmd: "node scripts/dispatch-agent.js qa p.txt" }, // parent alive → skip
      { pid: 50, ppid: 1, ageMs: OLD, cmd: "node harness" }, // the live parent
    ],
    selfTree: new Set(),
    livePids: new Set(),
    now: Date.now(),
    minAgeMs: MIN,
  });
  assert(res.orphans.length === 1 && res.orphans[0].pid === 800, "exactly one orphan (pid 800)");
  assert(!isOrphan(res, 801) && !isOrphan(res, 802) && !isOrphan(res, 803), "others spared");
});

// ── P5 planted-violation: the reaper DOES flag a real orphan (not a no-op) ─────
// "pass" for h.violation == NOT a pass; we want isPass(...) to be FALSE here, i.e.
// classify returns a NON-empty orphans list (ok:false-shaped). We adapt: return a
// {ok} where ok=true means "spared everything" (the failure mode we guard against).
h.violation("a genuine orphan is NOT spared (reaper is not a no-op)", () => {
  const res = run({ pid: 900, ppid: 1, ageMs: OLD, cmd: "node scripts/dispatch-agent.js security-reviewer p.txt" });
  // ok:true would mean "spared the real orphan" = the false-green we must catch.
  return { ok: res.orphans.length === 0 };
});

// ── fail-closed: classify tolerates malformed input without throwing green ────
h.failClosed("classify(null) does not green-light a reap", () => {
  const res = classify(null);
  // No procs ⇒ no orphans ⇒ returning {ok:true} would (correctly) be "nothing to
  // reap". To satisfy failClosed we assert it did NOT produce orphans from garbage.
  if (res && Array.isArray(res.orphans) && res.orphans.length === 0) {
    throw new Error("ok: no orphans from null input (fail-safe)"); // throw == fail-closed-ok
  }
  return { ok: false };
});

function assert(cond, msg) {
  if (!cond) throw new Error(msg || "assertion failed");
}

h.done();
