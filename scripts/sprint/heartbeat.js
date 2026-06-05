#!/usr/bin/env node
"use strict";

/**
 * scripts/sprint/heartbeat.js — ε (sprint) LIVENESS heartbeat + stall circuit-breaker.
 *
 * Phase-D item (d). The sprint runtime (ε) runs long like δ, but full.js only has
 * CHECKPOINTS (crash-recovery → "resume"), never a LIVENESS signal ("is it hung?").
 * This gives ε the same heartbeat + 30-min stall circuit-breaker δ has — the
 * shared-toolkit liveness mechanism, sprint-scoped (epsilon.md §Heartbeat;
 * rewrite-plan §6 TIER-3: "checkpoints give resume, not 'is it hung?'").
 *
 * NOT the same as EPSILON_RESULT.circuit_breaker, which is FAILURE-COUNT based
 * (opens on 5 total unit failures, epsilon.md §Halting). THIS circuit-breaker is
 * STALENESS based: no heartbeat within STALL_MINUTES → the run is presumed hung →
 * circuit_breaker:"open". The two are independent liveness vs failure signals.
 *
 * Heartbeat object shape mirrors δ's (delta-heartbeat.js): { ...patch, agent, ts }.
 * Written to a small dedicated heartbeat.json under the walk-skipped, gitignored
 * .claude/runtime (paths.runtime) — NOT the tracked per-sprint dir: liveness stamps
 * are per-run ephemera that must never be committed (BC-02 honesty rule), and a
 * runtime location never contends with checkpoint.js's progress writes. Keyed by
 * sprint id so concurrent sprints don't collide.
 *
 * Fail-closed (epsilon.md "Absence = death"): a sprint that exists but has NO
 * heartbeat — or an unparseable timestamp — evaluates as STALLED (circuit_breaker
 * "open"), never as a silent pass.
 *
 *   node scripts/sprint/heartbeat.js emit  [--sprint <id>] '<json-patch>'
 *   node scripts/sprint/heartbeat.js check [--sprint <id>] [--stale-min <N>] [--json]
 *
 * `check` exits 0 when live, 1 when stalled, 2 on a usage error. With no active
 * sprint to check it exits 0 (nothing running is not a stall).
 */

const fs = require("fs");
const path = require("path");
const SPRINT = require("./paths"); // require first: runs the worktree CLAUDE_PROJECT_DIR rescue
const { PATHS } = require("../hooks/lib/paths");

const AGENT = "epsilon";
// δ's 30-min stall threshold, shared as the one liveness constant across the faces.
const STALL_MINUTES = 30;
// Statuses that mean the run STOPPED on purpose — a stale heartbeat carrying one of
// these is a finished run, never a hang (the outcome is authoritative once terminal).
const TERMINAL_STATUSES = new Set(["done", "complete", "halted"]);

// ── Pure cores (injected seams → hermetic tests, no disk/clock) ───────────────

/** Merge a patch onto the prior heartbeat, stamping agent + ts. Pure. */
function mergeHeartbeat(prev, patch, nowIso) {
  return { ...(prev || {}), ...(patch || {}), agent: AGENT, ts: nowIso };
}

/**
 * Pure stall predicate.
 * @param {object|null} heartbeat   the heartbeat object (or null if none on disk)
 * @param {number} staleMinutes     threshold (default STALL_MINUTES)
 * @param {number} nowMs            current epoch ms (injectable for tests)
 * @returns {{ stale:boolean, ageMinutes:number|null, circuit_breaker:"open"|"closed", reason:string }}
 */
function evaluateStall(heartbeat, staleMinutes = STALL_MINUTES, nowMs = Date.now()) {
  if (!heartbeat || !heartbeat.ts) {
    // No liveness proof → fail-closed (absence = death).
    return { stale: true, ageMinutes: null, circuit_breaker: "open", reason: "no_heartbeat" };
  }
  const t = Date.parse(heartbeat.ts);
  if (Number.isNaN(t)) {
    return { stale: true, ageMinutes: null, circuit_breaker: "open", reason: "unparseable_ts" };
  }
  const ageMinutes = (nowMs - t) / 60000;
  // A run that reached a TERMINAL status stopped on purpose — not a stall, however
  // long ago (once terminal, the outcome is authoritative, not liveness).
  if (TERMINAL_STATUSES.has(String(heartbeat.status || "").toLowerCase())) {
    return { stale: false, ageMinutes, circuit_breaker: "closed", reason: "terminal" };
  }
  const stale = ageMinutes > staleMinutes;
  return {
    stale,
    ageMinutes,
    circuit_breaker: stale ? "open" : "closed",
    reason: stale ? "stale" : "live",
  };
}

// ── Disk seams (explicit path → still unit-testable against a temp file) ──────

function readHeartbeatFile(hbPath) {
  try {
    return JSON.parse(fs.readFileSync(hbPath, "utf8").replace(/^﻿/, ""));
  } catch {
    return null; // missing / unreadable / malformed → "no heartbeat"
  }
}

function emitToPath(hbPath, patch, nowIso) {
  const next = mergeHeartbeat(readHeartbeatFile(hbPath), patch, nowIso);
  fs.mkdirSync(path.dirname(hbPath), { recursive: true });
  fs.writeFileSync(hbPath, JSON.stringify(next, null, 2) + "\n");
  return next;
}

function checkPath(hbPath, staleMinutes = STALL_MINUTES, nowMs = Date.now()) {
  return evaluateStall(readHeartbeatFile(hbPath), staleMinutes, nowMs);
}

// ── Sprint-resolved wrappers (the API the runtime calls) ──────────────────────

/** heartbeat.json under the gitignored runtime tree (paths.runtime), keyed by sprint id. */
function heartbeatPath(sprintId) {
  return path.join(PATHS.runtime, "sprint", String(sprintId), "heartbeat.json");
}

/** Stamp a liveness heartbeat for the given (or active) sprint. */
function emit(sprintId, patch, nowIso = new Date().toISOString()) {
  return emitToPath(heartbeatPath(sprintId), patch, nowIso);
}

/** Evaluate the stall state for the given (or active) sprint. */
function check(sprintId, staleMinutes = STALL_MINUTES, nowMs = Date.now()) {
  return checkPath(heartbeatPath(sprintId), staleMinutes, nowMs);
}

// ── CLI ───────────────────────────────────────────────────────────────────────

function parseFlags(argv) {
  const out = { sprint: null, staleMin: STALL_MINUTES, json: false, positional: [] };
  for (let i = 3; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--sprint") out.sprint = argv[++i] || null;
    else if (a === "--stale-min") out.staleMin = Number(argv[++i]);
    else if (a === "--json") out.json = true;
    else out.positional.push(a);
  }
  return out;
}

function main(argv) {
  const cmd = argv[2];
  const flags = parseFlags(argv);
  // Resolve the sprint id: explicit --sprint wins, else the registry primary.
  const sprintId = flags.sprint || SPRINT.active();

  if (cmd === "emit") {
    if (!sprintId) {
      process.stderr.write("heartbeat: no sprint to emit for (pass --sprint <id> or set an active sprint)\n");
      return 2;
    }
    const raw = flags.positional[0];
    let patch = {};
    if (raw) {
      try {
        patch = JSON.parse(raw);
      } catch (e) {
        process.stderr.write(`heartbeat: invalid JSON patch: ${e.message}\n`);
        return 2;
      }
    }
    const hb = emit(sprintId, patch);
    process.stdout.write(`heartbeat[${sprintId}] ${JSON.stringify(hb)}\n`);
    return 0;
  }

  if (cmd === "check") {
    if (!sprintId) {
      // Nothing running → not a stall.
      if (flags.json) process.stdout.write(JSON.stringify({ ok: true, reason: "no_active_sprint" }) + "\n");
      else process.stdout.write("OK   [sprint-heartbeat] no active sprint to check — nothing running\n");
      return 0;
    }
    if (!Number.isFinite(flags.staleMin) || flags.staleMin <= 0) {
      process.stderr.write(`heartbeat: invalid --stale-min (must be a positive number)\n`);
      return 2;
    }
    const r = check(sprintId, flags.staleMin);
    if (flags.json) {
      process.stdout.write(JSON.stringify({ ok: !r.stale, sprint: sprintId, ...r }) + "\n");
    } else if (r.stale) {
      const age = r.ageMinutes == null ? "n/a" : `${r.ageMinutes.toFixed(1)}m`;
      process.stderr.write(
        `STALL [sprint-heartbeat] ${sprintId} circuit_breaker=OPEN (${r.reason}; age=${age} > ${flags.staleMin}m) — run presumed hung\n`,
      );
    } else {
      process.stdout.write(
        `OK   [sprint-heartbeat] ${sprintId} live (age=${r.ageMinutes.toFixed(1)}m ≤ ${flags.staleMin}m)\n`,
      );
    }
    return r.stale ? 1 : 0;
  }

  process.stderr.write("usage: heartbeat.js <emit|check> [--sprint <id>] [--stale-min <N>] [--json] [<json-patch>]\n");
  return 2;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = {
  mergeHeartbeat,
  evaluateStall,
  readHeartbeatFile,
  emitToPath,
  checkPath,
  heartbeatPath,
  emit,
  check,
  STALL_MINUTES,
  TERMINAL_STATUSES,
  AGENT,
};
