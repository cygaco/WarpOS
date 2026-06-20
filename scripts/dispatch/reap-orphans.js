#!/usr/bin/env node
"use strict";

/**
 * reap-orphans.js — detect + (optionally) reap ORPHANED WarpOS dispatch
 * subprocesses (E-TEAMS-MIGRATION-001, operator-flagged).
 *
 * THE PROBLEM (the reap / bg-drop class — ED-039 / RI-004):
 *   dispatch-claude.js / dispatch-agent.js spawn a provider CLI (claude / codex /
 *   gemini) via spawnSync. When the harness REAPS the wrapper (auto-background +
 *   maxTurns), the OS can leave the GRANDCHILD provider process running with no
 *   parent to collect it and NO completion record written — an orphan that holds
 *   a model session, a slot, and memory until the box reboots. The existing
 *   concurrency-lock pruneDeadLocks() removes the dead-PID *lock file*, but it
 *   does NOT kill the orphaned *process*. This closes that gap.
 *
 * SAFETY (β H-002 exposure-model discipline — a kill is a privilege surface):
 *   A process is reaped ONLY when ALL of these hold (any ambiguity ⇒ SKIP):
 *     1. SIGNATURE — its command line matches a WarpOS dispatch subprocess
 *        (dispatch-claude.js / dispatch-agent.js, or a provider CLI carrying our
 *        WARPOS_RUN_ID / dispatch telemetry marker). A bare "node" or a foreign
 *        "claude" is NEVER a candidate.
 *     2. ORPHANED — its parent PID is DEAD, or it has been reparented to init
 *        (PPID == 1 on POSIX). A child of a LIVE session is NOT an orphan.
 *     3. AGE — older than ORPHAN_MIN_AGE_MS (default 20min, ≥ the longest legit
 *        dispatch wall-time). A young process may be a legit in-flight dispatch.
 *     4. NO LIVE LOCK — no FRESH concurrency-lock for that PID (a fresh lock ⇒
 *        the dispatch is alive and tracked; overrides the orphan signal).
 *     5. NOT OURS — never this reaper's own PID, its parent, or its ancestors.
 *   FAIL-OPEN: any enumeration / parse / tooling error ⇒ reap NOTHING (a missed
 *   orphan is cheap; killing a live builder loses uncommitted worktree work).
 *   SIGTERM-FIRST: terminate gracefully (taskkill without /F on Windows; SIGTERM
 *   on POSIX), never SIGKILL-first. Report-only by DEFAULT; --apply to terminate.
 *
 * USAGE:
 *   node scripts/dispatch/reap-orphans.js              # DRY-RUN: list orphans, kill nothing
 *   node scripts/dispatch/reap-orphans.js --apply      # terminate confirmed orphans (SIGTERM)
 *   node scripts/dispatch/reap-orphans.js --json        # machine output
 *   node scripts/dispatch/reap-orphans.js --min-age-ms <n>   # override the age gate
 *
 * EXIT: 0 always (fail-open — a reaper must never crash a caller / session start).
 *
 * The pure core `classify({ procs, selfTree, locks, now, minAgeMs })` returns the
 * reap/skip decision per process for the planted-fixture test (no real ps / kill).
 */

const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..");
const NAME = "reap-orphans";

// Age floor: a candidate younger than this may be a legit in-flight dispatch.
// 20min mirrors concurrency-lock STALE_AFTER_MS (longer than runProvider's 15min).
const ORPHAN_MIN_AGE_MS = 20 * 60 * 1000;

// WarpOS dispatch-subprocess command-line signatures. A candidate's command line
// must contain one of these for it to be considered ours. Kept narrow on purpose:
// the wrapper scripts by basename, and the telemetry env marker the wrappers export
// onto their child env (so a reaped grandchild provider CLI still self-identifies).
const DISPATCH_SIGNATURES = [
  "dispatch-claude.js",
  "dispatch-agent.js",
  "scripts/dispatch-claude",
  "scripts/dispatch-agent",
  "scripts\\dispatch-claude",
  "scripts\\dispatch-agent",
];
// Telemetry env markers the wrappers set on the spawn (dispatch-agent.js exports
// WARPOS_RUN_ID/PHASE_ID/SPRINT_ID onto wrapper env; a child inherits them). A
// provider CLI (claude/codex/gemini) carrying one of these IN ITS COMMAND LINE is
// a WarpOS dispatch child. (Command-line-only — we do not read other procs' env.)
const TELEMETRY_MARKERS = ["WARPOS_RUN_ID", "WARPOS_DISPATCH"];

// ── pidAlive: reuse the concurrency-lock primitive (EPERM ⇒ treat as alive). ──
let pidAlive;
try {
  ({ pidAlive } = require("../hooks/lib/concurrency-lock"));
} catch {
  // Fail-safe local fallback (treat EPERM as alive — never wrongly call dead).
  pidAlive = function (pid) {
    if (!Number.isFinite(pid) || pid <= 0) return false;
    try {
      process.kill(pid, 0);
      return true;
    } catch (e) {
      return !!(e && e.code === "EPERM");
    }
  };
}

// ── Live-lock PIDs (a fresh lock ⇒ the dispatch is alive + tracked). ──────────
/** The set of PIDs holding a FRESH (non-stale) concurrency lock — these are
 *  live, tracked dispatches and are NEVER orphan candidates. Fail-open: on any
 *  error return an empty set (no protection lost vs the other gates). */
function liveLockPids() {
  const pids = new Set();
  try {
    const cl = require("../hooks/lib/concurrency-lock");
    const now = Date.now();
    for (const provider of cl.listAllLockDirs()) {
      for (const lk of cl.listLocks(provider)) {
        // Fresh = within the stale window AND its PID is still alive.
        const fresh = now - lk.mtimeMs <= cl.STALE_AFTER_MS;
        const pid = lk.meta && lk.meta.pid;
        if (fresh && Number.isFinite(pid)) pids.add(pid);
      }
    }
  } catch {
    /* fail-open — empty set */
  }
  return pids;
}

// ── Self process-tree (never reap our own ancestry). ─────────────────────────
/** PIDs of this reaper + its ancestors, so we can never SIGTERM ourselves or a
 *  parent that would take us down. Walks PPID up via the platform enumerator. */
function selfTree(procs) {
  const tree = new Set([process.pid]);
  const byPid = new Map(procs.map((p) => [p.pid, p]));
  let cur = process.pid;
  for (let i = 0; i < 64; i++) {
    const node = byPid.get(cur);
    if (!node || !Number.isFinite(node.ppid) || node.ppid <= 0) break;
    if (tree.has(node.ppid)) break;
    tree.add(node.ppid);
    cur = node.ppid;
  }
  return tree;
}

// ── Process enumeration (cross-platform; command line + PPID + start time). ───
/** Enumerate processes as [{ pid, ppid, ageMs, cmd }]. Windows: PowerShell CIM
 *  (CommandLine + ParentProcessId + CreationDate). POSIX: `ps -eo pid,ppid,etimes,args`.
 *  Fail-open: any error ⇒ [] (⇒ nothing is a candidate ⇒ nothing reaped). */
function enumerateProcs() {
  const now = Date.now();
  try {
    if (process.platform === "win32") {
      // CIM gives CommandLine (the full argv) + ParentProcessId + CreationDate.
      const ps =
        "Get-CimInstance Win32_Process | " +
        "Select-Object ProcessId,ParentProcessId,CreationDate,CommandLine | " +
        "ConvertTo-Json -Compress -Depth 2";
      const out = execFileSync(
        "powershell.exe",
        ["-NoProfile", "-NonInteractive", "-Command", ps],
        { encoding: "utf8", timeout: 20000, maxBuffer: 32 * 1024 * 1024 },
      );
      let rows = JSON.parse(out || "[]");
      if (!Array.isArray(rows)) rows = [rows];
      return rows.map((r) => {
        const created = r.CreationDate ? Date.parse(normalizeCimDate(r.CreationDate)) : NaN;
        return {
          pid: Number(r.ProcessId),
          ppid: Number(r.ParentProcessId),
          ageMs: Number.isFinite(created) ? now - created : Infinity,
          cmd: String(r.CommandLine || ""),
        };
      });
    }
    // POSIX: etimes = elapsed seconds; args = full command line.
    const out = execFileSync("ps", ["-eo", "pid=,ppid=,etimes=,args="], {
      encoding: "utf8",
      timeout: 20000,
      maxBuffer: 32 * 1024 * 1024,
    });
    const procs = [];
    for (const line of out.split("\n")) {
      const t = line.trim();
      if (!t) continue;
      const m = t.match(/^(\d+)\s+(\d+)\s+(\d+)\s+(.*)$/);
      if (!m) continue;
      procs.push({
        pid: Number(m[1]),
        ppid: Number(m[2]),
        ageMs: Number(m[3]) * 1000,
        cmd: m[4],
      });
    }
    return procs;
  } catch {
    return []; // fail-open: no enumeration ⇒ no candidates ⇒ reap nothing
  }
}

/** CIM CreationDate may arrive as a /Date(ms)/ JSON string or a CIM_DATETIME
 *  ("yyyymmddHHMMSS.ffffff+zzz"). Normalize both to something Date.parse reads. */
function normalizeCimDate(v) {
  const s = String(v);
  const dm = s.match(/\/Date\((\d+)\)\//);
  if (dm) return new Date(Number(dm[1])).toISOString();
  const cm = s.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
  if (cm) return `${cm[1]}-${cm[2]}-${cm[3]}T${cm[4]}:${cm[5]}:${cm[6]}`;
  return s;
}

// ── PURE CORE: classify each process reap | skip (with reason). ───────────────
/** @param {{procs, selfTree:Set, livePids:Set, now, minAgeMs}} input
 *  @returns {{orphans:[], skipped:[]}} */
function classify(input) {
  const procs = (input && input.procs) || [];
  const self = (input && input.selfTree) || new Set();
  const livePids = (input && input.livePids) || new Set();
  const minAgeMs =
    input && typeof input.minAgeMs === "number" ? input.minAgeMs : ORPHAN_MIN_AGE_MS;
  const byPid = new Map(procs.map((p) => [p.pid, p]));

  const orphans = [];
  const skipped = [];
  for (const p of procs) {
    // GATE 1 — signature: must be a WarpOS dispatch subprocess.
    if (!isDispatchProc(p.cmd)) continue; // not ours at all — not even a "skip"

    const reasons = [];
    // GATE 5 — never our own tree.
    if (self.has(p.pid)) reasons.push("own-process-tree");
    // GATE 4 — a fresh live lock means the dispatch is alive + tracked.
    if (livePids.has(p.pid)) reasons.push("has-live-lock");
    // GATE 3 — age floor.
    if (!(Number.isFinite(p.ageMs) ? p.ageMs : Infinity) || p.ageMs < minAgeMs)
      reasons.push(`too-young(<${Math.round(minAgeMs / 1000)}s)`);
    // GATE 2 — orphaned: parent dead OR reparented to init (ppid<=1).
    const orphaned = isOrphaned(p, byPid);
    if (orphaned === null) reasons.push("parent-liveness-unknown"); // ambiguity ⇒ skip
    else if (orphaned === false) reasons.push("parent-alive");

    if (reasons.length === 0) {
      orphans.push({ pid: p.pid, ppid: p.ppid, ageMs: p.ageMs, cmd: clip(p.cmd) });
    } else {
      skipped.push({ pid: p.pid, ppid: p.ppid, reasons, cmd: clip(p.cmd) });
    }
  }
  return { orphans, skipped };
}

/** Does the command line match a WarpOS dispatch subprocess signature? */
function isDispatchProc(cmd) {
  const c = String(cmd || "");
  if (!c) return false;
  if (DISPATCH_SIGNATURES.some((sig) => c.includes(sig))) return true;
  // A provider CLI carrying our telemetry marker in its command line is ours.
  if (TELEMETRY_MARKERS.some((mk) => c.includes(mk))) return true;
  return false;
}

/** Is `p` orphaned? TRUE = parent dead or reparented to init. FALSE = parent
 *  alive (in our snapshot, or pidAlive-confirmed). NULL = cannot determine
 *  (ambiguity ⇒ caller SKIPS — never reaps on an unknown parent). */
function isOrphaned(p, byPid) {
  const ppid = p.ppid;
  if (!Number.isFinite(ppid)) return null; // unknown parent ⇒ ambiguous
  // POSIX reparent-to-init: ppid 1 (or 0). A reaped child's surviving grandchild
  // is reparented to init — the canonical orphan signal.
  if (ppid <= 1) return true;
  // Parent present in our snapshot ⇒ alive.
  if (byPid.has(ppid)) return false;
  // Parent NOT in snapshot — confirm with a direct liveness probe. Dead ⇒ orphan.
  // (pidAlive treats EPERM as alive, so a parent we can't signal stays "alive" —
  // the safe side: we will NOT reap when the parent's liveness is unprovable-dead.)
  try {
    return pidAlive(ppid) ? false : true;
  } catch {
    return null; // probe failed ⇒ ambiguous ⇒ skip
  }
}

function clip(s) {
  const t = String(s || "").replace(/\s+/g, " ").trim();
  return t.length > 160 ? t.slice(0, 157) + "…" : t;
}

// ── Termination (SIGTERM-first; --apply only). ───────────────────────────────
/** Gracefully terminate one orphan. Windows: taskkill /T (tree) WITHOUT /F first.
 *  POSIX: kill -TERM. Returns { pid, signalled, error? }. Best-effort, never throws. */
function terminate(pid) {
  try {
    if (process.platform === "win32") {
      // /T terminates the child tree too; NO /F — graceful first (SIGTERM-equiv).
      execFileSync("taskkill", ["/T", "/PID", String(pid)], { timeout: 8000, stdio: "pipe" });
    } else {
      process.kill(pid, "SIGTERM");
    }
    return { pid, signalled: true };
  } catch (e) {
    return { pid, signalled: false, error: e && e.message ? e.message : String(e) };
  }
}

// ── Run (enumerate → classify → optionally terminate → log). ─────────────────
function run(opts = {}) {
  const apply = !!opts.apply;
  const minAgeMs = typeof opts.minAgeMs === "number" ? opts.minAgeMs : ORPHAN_MIN_AGE_MS;
  const procs = enumerateProcs();
  const result = classify({
    procs,
    selfTree: selfTree(procs),
    livePids: liveLockPids(),
    now: Date.now(),
    minAgeMs,
  });
  const terminated = [];
  if (apply) {
    for (const o of result.orphans) terminated.push(terminate(o.pid));
  }
  const summary = {
    check: NAME,
    apply,
    scanned: procs.length,
    orphans: result.orphans,
    orphanCount: result.orphans.length,
    skipped: result.skipped,
    terminated,
    ts: new Date().toISOString(),
  };
  // Best-effort audit log (fail-open).
  try {
    const { log } = require("../hooks/lib/logger");
    log(
      "dispatch-reap",
      {
        event: apply ? "reap-orphans:apply" : "reap-orphans:dry-run",
        scanned: summary.scanned,
        orphanCount: summary.orphanCount,
        orphanPids: result.orphans.map((o) => o.pid),
        terminatedPids: terminated.filter((t) => t.signalled).map((t) => t.pid),
      },
      { actor: "reap-orphans" },
    );
  } catch {
    /* logging is best-effort */
  }
  return summary;
}

module.exports = { classify, isDispatchProc, isOrphaned, selfTree, run, ORPHAN_MIN_AGE_MS };

if (require.main === module) {
  const argv = process.argv.slice(2);
  const opts = { apply: argv.includes("--apply"), json: argv.includes("--json") };
  const ai = argv.indexOf("--min-age-ms");
  if (ai !== -1 && argv[ai + 1]) opts.minAgeMs = parseInt(argv[ai + 1], 10);
  let res;
  try {
    res = run(opts);
  } catch (e) {
    // Absolute fail-open: a reaper must NEVER crash its caller (session start).
    if (opts.json) console.log(JSON.stringify({ check: NAME, ok: true, error: String(e && e.message ? e.message : e), orphanCount: 0 }));
    else console.error(`[${NAME}] non-fatal error (fail-open, reaped nothing): ${e && e.message ? e.message : e}`);
    process.exit(0);
  }
  if (opts.json) {
    console.log(JSON.stringify(res));
  } else {
    const mode = res.apply ? "APPLY" : "DRY-RUN";
    console.log(`[${NAME}] ${mode} — scanned ${res.scanned} proc(s), ${res.orphanCount} orphan(s)`);
    for (const o of res.orphans) {
      console.log(`  orphan pid=${o.pid} ppid=${o.ppid} age=${Math.round((o.ageMs || 0) / 1000)}s  ${o.cmd}`);
    }
    if (res.apply) {
      for (const t of res.terminated) {
        console.log(`  ${t.signalled ? "SIGTERM" : "FAILED "} pid=${t.pid}${t.error ? "  (" + t.error + ")" : ""}`);
      }
    } else if (res.orphanCount > 0) {
      console.log(`  (dry-run — re-run with --apply to terminate. ${res.orphanCount} would be SIGTERM'd.)`);
    }
  }
  process.exit(0);
}
