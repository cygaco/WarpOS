You are a security reviewer doing a RE-REVIEW of a subprocess REAPER after a fix-cycle. A prior review FAILed it with these findings — verify each is now RESOLVED, and look for any NEW defect introduced by the fixes. Render a BINDING verdict: PASS or FAIL.

PRIOR FINDINGS (must all be fixed):
- CRIT-1: unparseable start time => ageMs:Infinity => age gate passed on ambiguity. (Fix claimed: classify requires Number.isFinite(ageMs) && ageMs>=floor; non-finite => SKIP "age-unknown".)
- CRIT-2: --min-age-ms NaN/0 disabled the age gate. (Fix claimed: both classify() and run() ignore a non-finite or below-floor value, default to ORPHAN_MIN_AGE_MS.)
- CRIT-3: no re-validation before terminate => PID reuse could kill a fresh legit process. (Fix claimed: enumerate captures startMs identity token; run() calls revalidateOrphans() which re-enumerates + re-classifies + requires matching startMs before terminate.)
- HIGH-4: liveLockPids() empty-on-error was fail-unsafe. (Fix claimed: returns {pids, ok}; ok:false on error; classify with locksOk:false skips EVERYTHING "lock-state-unknown".)
- HIGH-5: signature substring match killed foreign procs carrying the string in an arg. (Fix claimed: isDispatchProc requires the wrapper as a real PATH [path-separator-anchored] OR an assignment-form WARPOS marker + a known exe token.)
- HIGH-6: POSIX ps-args newline injection forged rows; terminate(0) signaled the group. (Fix claimed: ps uses lstart with a fixed 5-token shape anchored regex; pid<=1 dropped at enum AND classify; terminate refuses pid<=1.)
- MEDIUM-7: terminate() lacked PID validation. (Fix claimed: refuses unless Number.isSafeInteger(pid) && pid>1 && pid!==process.pid.)
- MEDIUM-8: own-tree excluded ancestors not descendants. (Fix claimed: selfTree now adds descendants via fixed-point sweep.)

Verify each fix is REAL and COMPLETE in the code below. Check for NEW issues: does revalidateOrphans fail-safe (empty set on error)? Can the new regexes be bypassed? Does the lstart regex correctly reject a forged row? Any way the identity-token match (startMs) can be spoofed or collide? Output VERDICT: PASS or VERDICT: FAIL, then findings tagged [CRITICAL]/[HIGH]/[MEDIUM]/[LOW] with line/mechanism/fix. PASS only if all CRITICAL+HIGH are resolved and no new CRITICAL/HIGH introduced.

=== FILE: scripts/dispatch/reap-orphans.js (HARDENED) ===
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
/** The PIDs holding a FRESH (non-stale) concurrency lock — live, tracked dispatches
 *  that are NEVER orphan candidates. Returns `{ pids, ok }`. SECURITY (gauntlet
 *  HIGH-4): lock state is a SAFETY input, so it must fail SAFE, not "fail-open to
 *  empty". On ANY enumeration/parse error `ok:false` — and run() then reaps NOTHING
 *  (an empty-set-on-error would let --apply kill a process that actually holds a
 *  fresh lock). The lock-failure contract: can't read the locks ⇒ can't reap. */
function liveLockPids() {
  const pids = new Set();
  try {
    const cl = require("../hooks/lib/concurrency-lock");
    const now = Date.now();
    for (const provider of cl.listAllLockDirs()) {
      for (const lk of cl.listLocks(provider)) {
        // Fresh = within the stale window. (We do NOT additionally require the PID
        // alive here — a fresh lock for a PID is enough to spare it; if the lock is
        // genuinely stale the mtime window already excludes it.)
        const fresh = now - lk.mtimeMs <= cl.STALE_AFTER_MS;
        const pid = lk.meta && lk.meta.pid;
        if (fresh && Number.isFinite(pid)) pids.add(pid);
      }
    }
    return { pids, ok: true };
  } catch {
    // FAIL-SAFE: lock state unknown ⇒ not "no live locks", but "cannot determine".
    return { pids, ok: false };
  }
}

// ── Self process-tree (never reap our own ancestry OR descendants). ──────────
/** PIDs of this reaper + its ancestors (so we never SIGTERM ourselves or a parent
 *  that would take us down) AND its descendants (gauntlet MEDIUM-8: the parent-alive
 *  gate usually covers descendants, but the stated full-tree exclusion must too —
 *  e.g. a subprocess WE spawned that happens to match the signature). Walks PPID up
 *  for ancestors + a fixed-point sweep down for descendants. */
function selfTree(procs) {
  const tree = new Set([process.pid]);
  const byPid = new Map(procs.map((p) => [p.pid, p]));
  // Ancestors: walk PPID up from us.
  let cur = process.pid;
  for (let i = 0; i < 64; i++) {
    const node = byPid.get(cur);
    if (!node || !Number.isFinite(node.ppid) || node.ppid <= 0) break;
    if (tree.has(node.ppid)) break;
    tree.add(node.ppid);
    cur = node.ppid;
  }
  // Descendants: fixed-point — add any proc whose ppid is already in the tree,
  // until no growth (bounded by proc count; a malformed cycle terminates on no-growth).
  let grew = true;
  let guard = 0;
  while (grew && guard++ < procs.length + 8) {
    grew = false;
    for (const p of procs) {
      if (!tree.has(p.pid) && Number.isFinite(p.ppid) && tree.has(p.ppid)) {
        tree.add(p.pid);
        grew = true;
      }
    }
  }
  return tree;
}

// ── Process enumeration (cross-platform; cmdline + PPID + start time identity). ─
/** Enumerate processes as [{ pid, ppid, ageMs, startMs, cmd }]. `startMs` is the
 *  process START TIME (epoch ms) — the IDENTITY TOKEN that closes the CRIT-3 PID-
 *  reuse TOCTOU: a PID re-used by a new process has a DIFFERENT start time, so a
 *  re-enumeration before terminate() can detect the swap. `ageMs` is non-finite
 *  (Infinity) when the start time is unknown — classify() then SKIPS it (CRIT-1:
 *  unknown age is ambiguity, never "old"). pid<=1 and malformed rows are dropped
 *  (HIGH-6: a parser-injected fake row carrying pid 0/1 must never reach terminate).
 *  Windows: PowerShell CIM. POSIX: `ps -eo pid,ppid,lstart,args` (lstart = absolute
 *  start time — NOT etimes, which is relative and not an identity token). Fail-open:
 *  any error ⇒ [] (⇒ no candidates ⇒ nothing reaped). */
function enumerateProcs() {
  const now = Date.now();
  try {
    if (process.platform === "win32") {
      // CIM gives CommandLine (full argv) + ParentProcessId + CreationDate (start).
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
      const procs = [];
      for (const r of rows) {
        const pid = Number(r.ProcessId);
        const ppid = Number(r.ParentProcessId);
        if (!Number.isInteger(pid) || pid <= 1) continue; // HIGH-6: drop pid<=1 + junk
        const created = r.CreationDate ? Date.parse(normalizeCimDate(r.CreationDate)) : NaN;
        procs.push({
          pid,
          ppid: Number.isInteger(ppid) ? ppid : NaN,
          startMs: Number.isFinite(created) ? created : NaN,
          ageMs: Number.isFinite(created) ? now - created : Infinity,
          cmd: String(r.CommandLine || ""),
        });
      }
      return procs;
    }
    // POSIX: lstart = absolute start time (identity token); args = full command line.
    // Field order: pid ppid lstart(=5 ws-separated tokens) args. lstart has a FIXED
    // 5-token shape ("Day Mon DD HH:MM:SS YYYY"), so we anchor the regex on it and
    // never trust a free-form split (HIGH-6: argv with embedded newlines can't forge
    // a row that matches the leading-int + fixed lstart shape).
    const out = execFileSync("ps", ["-eo", "pid=,ppid=,lstart=,args="], {
      encoding: "utf8",
      timeout: 20000,
      maxBuffer: 32 * 1024 * 1024,
    });
    const procs = [];
    const RE = /^(\d+)[ \t]+(\d+)[ \t]+([A-Za-z]{3}[ \t]+[A-Za-z]{3}[ \t]+\d{1,2}[ \t]+\d{2}:\d{2}:\d{2}[ \t]+\d{4})[ \t]+(.*)$/;
    for (const line of out.split("\n")) {
      const t = line.replace(/\r$/, "");
      if (!t.trim()) continue;
      const m = t.match(RE);
      if (!m) continue; // a forged/embedded-newline row won't match the lstart shape
      const pid = Number(m[1]);
      const ppid = Number(m[2]);
      if (!Number.isInteger(pid) || pid <= 1) continue; // HIGH-6: never pid<=1
      const startMs = Date.parse(m[3]);
      procs.push({
        pid,
        ppid: Number.isInteger(ppid) ? ppid : NaN,
        startMs: Number.isFinite(startMs) ? startMs : NaN,
        ageMs: Number.isFinite(startMs) ? now - startMs : Infinity,
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
/** @param {{procs, selfTree:Set, livePids:Set, locksOk?:boolean, now, minAgeMs}} input
 *  @returns {{orphans:[], skipped:[]}}
 *  `locksOk:false` (lock state unreadable) ⇒ EVERY candidate is skipped
 *  ("lock-state-unknown") — the HIGH-4 fail-safe. `minAgeMs` is sanitized by the
 *  caller (CRIT-2); here a non-finite floor defaults to ORPHAN_MIN_AGE_MS. */
function classify(input) {
  const procs = (input && input.procs) || [];
  const self = (input && input.selfTree) || new Set();
  const livePids = (input && input.livePids) || new Set();
  const locksOk = !(input && input.locksOk === false); // default true (back-compat)
  // CRIT-2: a non-finite / non-positive floor is NOT honored — fall back to the
  // hard default rather than letting NaN/0 disable the age gate.
  const rawMin = input && input.minAgeMs;
  const minAgeMs =
    Number.isFinite(rawMin) && rawMin >= ORPHAN_MIN_AGE_MS ? rawMin : ORPHAN_MIN_AGE_MS;
  const byPid = new Map(procs.map((p) => [p.pid, p]));

  const orphans = [];
  const skipped = [];
  for (const p of procs) {
    // GATE 0 — a valid PID > 1 (HIGH-6 defense in depth; enum already drops these).
    if (!Number.isInteger(p.pid) || p.pid <= 1) continue;
    // GATE 1 — signature: must be a WarpOS dispatch subprocess.
    if (!isDispatchProc(p.cmd)) continue; // not ours at all — not even a "skip"

    const reasons = [];
    // GATE 5 — never our own tree (ancestors AND descendants).
    if (self.has(p.pid)) reasons.push("own-process-tree");
    // GATE 4 — a fresh live lock means alive + tracked. HIGH-4: if lock state is
    // UNKNOWN (enumeration failed), spare EVERYTHING — can't read locks ⇒ can't reap.
    if (!locksOk) reasons.push("lock-state-unknown");
    else if (livePids.has(p.pid)) reasons.push("has-live-lock");
    // GATE 3 — age floor. CRIT-1: a NON-FINITE age (unknown start time) is AMBIGUITY,
    // never "old" — require a finite age at or past the floor.
    if (!(Number.isFinite(p.ageMs) && p.ageMs >= minAgeMs))
      reasons.push(Number.isFinite(p.ageMs) ? `too-young(<${Math.round(minAgeMs / 1000)}s)` : "age-unknown");
    // GATE 2 — orphaned: parent dead OR reparented to init (ppid<=1).
    const orphaned = isOrphaned(p, byPid);
    if (orphaned === null) reasons.push("parent-liveness-unknown"); // ambiguity ⇒ skip
    else if (orphaned === false) reasons.push("parent-alive");

    if (reasons.length === 0) {
      // Carry the IDENTITY TOKEN (startMs) + ppid + cmd so terminate can re-validate
      // the exact same process before signaling (CRIT-3 TOCTOU close).
      orphans.push({ pid: p.pid, ppid: p.ppid, startMs: p.startMs, ageMs: p.ageMs, cmd: clip(p.cmd) });
    } else {
      skipped.push({ pid: p.pid, ppid: p.ppid, reasons, cmd: clip(p.cmd) });
    }
  }
  return { orphans, skipped };
}

// ── Signature match (HIGH-5: structural, not a loose substring). ──────────────
/** Does the command line identify a WarpOS dispatch subprocess? Two narrow ways,
 *  both more specific than a bare substring (a foreign process that merely contains
 *  "dispatch-agent.js" or "WARPOS_RUN_ID" in a free-text arg must NOT match):
 *    (a) it INVOKES one of our wrapper scripts — a `node …/scripts/dispatch-*.js`
 *        token where the script path is a real path component (slash-anchored), OR
 *    (b) it carries a telemetry marker in ASSIGNMENT form (`WARPOS_RUN_ID=<v>` /
 *        `WARPOS_DISPATCH…=<v>`) AND the executable is a known provider/runtime
 *        (node/claude/codex/gemini) — an env-style marker on a real dispatch child,
 *        not the literal string sitting inside someone's `--prompt "...WARPOS_RUN_ID..."`. */
function isDispatchProc(cmd) {
  const c = String(cmd || "");
  if (!c) return false;
  // (a) wrapper-script INVOCATION: the script must appear as a real PATH (preceded
  // by a path separator — `…/scripts/dispatch-agent.js` / `…\dispatch-claude.js`),
  // NOT as a bare argument to another tool (`grep dispatch-agent.js file` has only a
  // space before it → not a match). The path-separator anchor is what distinguishes
  // "node runs the wrapper" from "a foreign process mentions its name" (HIGH-5).
  if (/[\/\\]dispatch-(?:claude|agent)\.js(?=$|[\s"'])/i.test(c)) return true;
  // (b) telemetry marker in ASSIGNMENT form + a known executable token.
  const hasAssignedMarker = /\b(?:WARPOS_RUN_ID|WARPOS_DISPATCH[A-Z_]*)=/.test(c);
  const knownExe = /(^|[\s"'\/\\])(?:node(?:\.exe)?|claude(?:\.exe)?|codex(?:\.exe)?|gemini(?:\.exe)?)(?=$|[\s"'])/i.test(c);
  if (hasAssignedMarker && knownExe) return true;
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

// ── Termination (SIGTERM-first; --apply only; hard PID guard). ───────────────
/** Gracefully terminate one orphan. Windows: taskkill /T (tree) WITHOUT /F first.
 *  POSIX: kill -TERM. MEDIUM-7: a final hard guard — only a safe integer PID > 1
 *  that is NOT our own PID is ever signaled (a pid of 0 has process-GROUP semantics
 *  on POSIX and must never reach process.kill). Returns { pid, signalled, error? };
 *  best-effort, never throws. */
function terminate(pid) {
  if (!Number.isSafeInteger(pid) || pid <= 1 || pid === process.pid) {
    return { pid, signalled: false, error: "refused: pid out of safe range (>1, not self)" };
  }
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

// ── CRIT-3: re-validate orphans against a FRESH snapshot before killing. ─────
/** Given the orphan list from the first classify pass, re-enumerate NOW and return
 *  the set of PIDs that are STILL the same process (pid + start-time identity match)
 *  AND still classify as an orphan against the fresh snapshot. A PID that exited,
 *  was reused (different startMs), or no longer meets every gate is dropped — so a
 *  fresh legitimate process that inherited a reaped orphan's PID is never killed.
 *  Fail-SAFE: on any error, return an EMPTY set (kill nothing). */
function revalidateOrphans(firstOrphans, minAgeMs) {
  const confirmed = new Set();
  try {
    if (!Array.isArray(firstOrphans) || firstOrphans.length === 0) return confirmed;
    const wantByPid = new Map(firstOrphans.map((o) => [o.pid, o]));
    const procs2 = enumerateProcs();
    const locks2 = liveLockPids();
    const fresh = classify({
      procs: procs2,
      selfTree: selfTree(procs2),
      livePids: locks2.pids,
      locksOk: locks2.ok,
      now: Date.now(),
      minAgeMs,
    });
    for (const o2 of fresh.orphans) {
      const want = wantByPid.get(o2.pid);
      if (!want) continue; // not an orphan we intended to kill
      // IDENTITY MATCH: same start time (the PID-reuse discriminator). Both must be
      // finite + equal; a missing/changed startMs ⇒ not the same process ⇒ drop.
      if (
        Number.isFinite(want.startMs) &&
        Number.isFinite(o2.startMs) &&
        want.startMs === o2.startMs
      ) {
        confirmed.add(o2.pid);
      }
    }
  } catch {
    return new Set(); // fail-safe: cannot re-confirm ⇒ kill nothing
  }
  return confirmed;
}

// ── Run (enumerate → classify → RE-VALIDATE → optionally terminate → log). ────
function run(opts = {}) {
  const apply = !!opts.apply;
  // CRIT-2: sanitize the floor here too (defense-in-depth with classify()); a
  // non-finite or below-floor value is NOT honored.
  const reqMin = opts.minAgeMs;
  const minAgeMs = Number.isFinite(reqMin) && reqMin >= ORPHAN_MIN_AGE_MS ? reqMin : ORPHAN_MIN_AGE_MS;
  const procs = enumerateProcs();
  const locks = liveLockPids(); // { pids, ok } — HIGH-4 fail-safe carries ok
  const result = classify({
    procs,
    selfTree: selfTree(procs),
    livePids: locks.pids,
    locksOk: locks.ok,
    now: Date.now(),
    minAgeMs,
  });
  const terminated = [];
  if (apply) {
    // CRIT-3: re-enumerate IMMEDIATELY before killing and re-run the full gate set,
    // matching on the IDENTITY TOKEN (pid + startMs + cmd) — a PID re-used by a new
    // process since `classify` has a different start time and is NOT re-confirmed,
    // so we never SIGTERM a fresh legitimate process that inherited the PID.
    const confirmed = revalidateOrphans(result.orphans, minAgeMs);
    for (const o of result.orphans) {
      const ok = confirmed.has(o.pid);
      if (ok) terminated.push(terminate(o.pid));
      else terminated.push({ pid: o.pid, signalled: false, error: "revalidation failed (PID reuse / state changed) — not killed" });
    }
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

module.exports = { classify, isDispatchProc, isOrphaned, selfTree, terminate, revalidateOrphans, run, ORPHAN_MIN_AGE_MS };

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

=== END ===
