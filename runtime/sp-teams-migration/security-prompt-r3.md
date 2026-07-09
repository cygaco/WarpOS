You are a security reviewer doing a SECOND re-review of a subprocess REAPER after fix-cycle 2. Two HIGH findings remained after cycle 1; verify they are now RESOLVED and check for NEW defects. Render a BINDING verdict: PASS or FAIL.

REMAINING FINDINGS FROM CYCLE 1 (must now be fixed):
- HIGH-6 (POSIX newline row forgery): cycle-1 still parsed newline-delimited `ps args`, so a forged row could inject a candidate PID. FIX APPLIED: POSIX no longer row-parses args. On Linux it enumerates from /proc (per-PID reads: /proc/<pid>/stat for ppid+starttime, /proc/<pid>/cmdline NUL-delimited for argv — un-forgeable, each PID read from its own dir). On macOS/BSD (no /proc) it reads pid+ppid+lstart from a FIELDS-ONLY `ps` query (NO args field, so argv can't forge a row) and fetches each command separately via `ps -p <pid> -o command=`.
- HIGH-5 (signature path false-positive): cycle-1 matched `/dispatch-agent.js` anywhere. FIX APPLIED: isDispatchProc now TOKENIZES the command line, requires argv[0] to be a known runtime (node/claude/codex/gemini by basename), and requires a token that RESOLVES (against ROOT, or as an already-absolute path) to EQUAL one of the project's REAL wrapper script paths (DISPATCH_SCRIPT_PATHS = resolved scripts/dispatch-claude.js + dispatch-agent.js). So `python worker.py --file /tmp/dispatch-agent.js` fails (argv[0]≠runtime AND path≠ours), and `node /tmp/evil/dispatch-claude.js` fails (path not under our scripts/). The marker path (b) requires argv[0]=known runtime + an assignment-form WARPOS_RUN_ID= marker.

VERIFY both are real + complete. Look for NEW issues: the /proc stat parser (does it correctly handle a comm with spaces/parens by slicing after the last ')'? is the starttime field index right?); the tokenizer (can a crafted quoted string defeat it? can argv[0] be spoofed?); the path resolution (any traversal/normalization bypass to make a foreign path equal a real path?); the macOS ps fallback (is the fields-only query truly un-forgeable?). Also re-confirm the cycle-1 resolved items did not regress (CRIT-1/2/3, HIGH-4, MEDIUM-7/8). 

Output VERDICT: PASS or VERDICT: FAIL, then findings tagged [CRITICAL]/[HIGH]/[MEDIUM]/[LOW] with line/mechanism/fix. PASS only if no CRITICAL/HIGH remain. Note: this reaper's PRODUCTION host is Windows (PowerShell CIM enumeration — structured JSON, not row-forgeable); the POSIX paths are for portability.

=== FILE: scripts/dispatch/reap-orphans.js (TWICE-HARDENED) ===
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

// The CANONICAL absolute paths of THIS project's dispatch wrapper scripts. The
// signature match (HIGH-5) anchors on these REAL paths — a token in the command
// line that RESOLVES to one of them — not a loose `dispatch-agent.js` substring (so
// `python worker.py --file /tmp/dispatch-agent.js` does NOT match). Lower-cased +
// forward-slashed for comparison (Windows is case-insensitive; cmd lines vary).
const DISPATCH_SCRIPT_PATHS = ["dispatch-claude.js", "dispatch-agent.js"].map((b) =>
  path.resolve(ROOT, "scripts", b).replace(/\\/g, "/").toLowerCase(),
);
// The known runtime/provider executables a real dispatch child runs as argv[0].
const KNOWN_EXES = new Set(["node", "node.exe", "claude", "claude.exe", "codex", "codex.exe", "gemini", "gemini.exe"]);
// Telemetry env markers the wrappers set on the spawn (dispatch-agent.js exports
// WARPOS_RUN_ID/PHASE_ID/SPRINT_ID onto wrapper env; a child inherits them). Matched
// only in ASSIGNMENT form (`WARPOS_RUN_ID=…`) AND only when argv[0] is a known exe.
const TELEMETRY_MARKER_RE = /\b(?:WARPOS_RUN_ID|WARPOS_DISPATCH[A-Z_]*)=/;

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
    // POSIX: enumerate from /proc — the UN-FORGEABLE source (HIGH-6 r2). Each PID is
    // read from its OWN /proc/<pid>/ dir, so a crafted argv with embedded newlines
    // CANNOT inject a fake row (the prior `ps args` row-parse could). /proc/<pid>/stat
    // gives ppid + starttime (clock ticks since boot — the identity token);
    // /proc/<pid>/cmdline is NUL-delimited argv (we join with spaces for matching).
    if (fs.existsSync("/proc")) return enumerateProcFromProc(now);
    // No /proc (e.g. macOS) — fall back to `ps`, but read pid/ppid/lstart in a
    // STRUCTURED, row-forgery-resistant way: take pid+ppid+lstart from a fields-only
    // query (no args, so argv can't inject rows), then read each cmd separately.
    return enumerateProcFromPs(now);
  } catch {
    return []; // fail-open: no enumeration ⇒ no candidates ⇒ reap nothing
  }
}

/** Linux /proc enumeration — per-PID reads, un-forgeable. */
function enumerateProcFromProc(now) {
  const procs = [];
  let pids;
  try {
    pids = fs.readdirSync("/proc").filter((n) => /^\d+$/.test(n));
  } catch {
    return [];
  }
  // Boot time (epoch ms) to convert starttime-ticks → absolute start. btime is in
  // /proc/stat (seconds since epoch). Hz is typically 100; CLK_TCK isn't exposed to
  // node without a syscall, so we use the conventional 100 and treat starttime as an
  // IDENTITY token (relative ordering is what matters for PID-reuse detection, and an
  // exact ms is not required for the >20min age gate).
  let btimeMs = 0;
  try {
    const stat = fs.readFileSync("/proc/stat", "utf8");
    const m = stat.match(/^btime\s+(\d+)/m);
    if (m) btimeMs = Number(m[1]) * 1000;
  } catch {
    /* btime unknown — ageMs will be Infinity (⇒ age-unknown ⇒ skip, the safe side) */
  }
  const HZ = 100;
  for (const pidStr of pids) {
    const pid = Number(pidStr);
    if (!Number.isInteger(pid) || pid <= 1) continue;
    let ppid = NaN;
    let startMs = NaN;
    try {
      const st = fs.readFileSync(`/proc/${pidStr}/stat`, "utf8");
      // Field 4 = ppid, field 22 = starttime. comm (field 2) is parenthesized and may
      // contain spaces/parens — split AFTER the last ')' to avoid comm corruption.
      const rparen = st.lastIndexOf(")");
      const rest = rparen >= 0 ? st.slice(rparen + 1).trim().split(/\s+/) : [];
      // rest[0]=state, rest[1]=ppid, …, starttime is field 22 ⇒ rest index 22-4=… :
      // after state(1) the fields are 1-indexed from rest[0]=state; ppid=rest[1];
      // starttime is the (22 - 3)=19th token of rest (rest[0] is field 3=state).
      const ppidTok = Number(rest[1]);
      if (Number.isInteger(ppidTok)) ppid = ppidTok;
      const startTicks = Number(rest[19]);
      if (Number.isFinite(startTicks) && btimeMs)
        startMs = btimeMs + (startTicks / HZ) * 1000;
    } catch {
      continue; // process vanished mid-scan — skip
    }
    let cmd = "";
    try {
      const raw = fs.readFileSync(`/proc/${pidStr}/cmdline`);
      cmd = raw.toString("utf8").replace(/\0/g, " ").trim();
    } catch {
      cmd = ""; // unreadable cmdline ⇒ empty ⇒ won't match the signature ⇒ ignored
    }
    procs.push({
      pid,
      ppid: Number.isInteger(ppid) ? ppid : NaN,
      startMs: Number.isFinite(startMs) ? startMs : NaN,
      ageMs: Number.isFinite(startMs) ? now - startMs : Infinity,
      cmd,
    });
  }
  return procs;
}

/** macOS/BSD fallback: structured `ps` reads. pid+ppid+lstart come from a fields-
 *  only query (args EXCLUDED so an argv newline can't forge a row); the command line
 *  for each pid is fetched separately with `ps -p <pid> -o command=`. Row-forgery-
 *  resistant: the row-bearing query has no free-form args field. */
function enumerateProcFromPs(now) {
  const procs = [];
  let out;
  try {
    out = execFileSync("ps", ["-eo", "pid=,ppid=,lstart="], {
      encoding: "utf8",
      timeout: 20000,
      maxBuffer: 8 * 1024 * 1024,
    });
  } catch {
    return [];
  }
  // No args field ⇒ each line is exactly "pid ppid <lstart 5 tokens>" — fixed shape.
  const RE = /^(\d+)[ \t]+(\d+)[ \t]+([A-Za-z]{3}[ \t]+[A-Za-z]{3}[ \t]+\d{1,2}[ \t]+\d{2}:\d{2}:\d{2}[ \t]+\d{4})\s*$/;
  for (const line of out.split("\n")) {
    const t = line.replace(/\r$/, "");
    if (!t.trim()) continue;
    const m = t.match(RE);
    if (!m) continue;
    const pid = Number(m[1]);
    const ppid = Number(m[2]);
    if (!Number.isInteger(pid) || pid <= 1) continue;
    const startMs = Date.parse(m[3]);
    let cmd = "";
    try {
      cmd = execFileSync("ps", ["-p", String(pid), "-o", "command="], {
        encoding: "utf8",
        timeout: 5000,
        maxBuffer: 1 * 1024 * 1024,
      }).split("\n")[0].trim();
    } catch {
      cmd = "";
    }
    procs.push({
      pid,
      ppid: Number.isInteger(ppid) ? ppid : NaN,
      startMs: Number.isFinite(startMs) ? startMs : NaN,
      ageMs: Number.isFinite(startMs) ? now - startMs : Infinity,
      cmd,
    });
  }
  return procs;
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

// ── Signature match (HIGH-5 r2: tokenize + resolve against the REAL script paths). ─
/** Does the command line identify a WarpOS dispatch subprocess? TOKENIZE the command
 *  line and decide STRUCTURALLY — never a loose substring. Two narrow ways:
 *    (a) argv[0] is a known runtime (node/claude/…) AND SOME argv token, RESOLVED to
 *        an absolute path, EQUALS one of THIS project's real wrapper script paths
 *        (DISPATCH_SCRIPT_PATHS). So `python worker.py --file /tmp/dispatch-agent.js`
 *        fails on BOTH counts (argv[0]≠runtime; /tmp/dispatch-agent.js ≠ our path).
 *    (b) argv[0] is a known runtime AND the command carries a telemetry marker in
 *        ASSIGNMENT form (`WARPOS_RUN_ID=…`) — the reaped grandchild provider CLI.
 *  Resolution makes a relative `scripts/dispatch-agent.js` token resolve under cwd…
 *  but we can't know the proc's cwd, so we resolve relative tokens against ROOT and
 *  ALSO accept an absolute token that already equals a real path. A bare relative
 *  `dispatch-agent.js` with no dir does NOT resolve to our scripts/ path → no match. */
function isDispatchProc(cmd) {
  const c = String(cmd || "");
  if (!c.trim()) return false;
  const argv = tokenizeCmd(c);
  if (argv.length === 0) return false;
  // argv[0] must be a known runtime/provider executable (by basename).
  const exe0 = path.basename(String(argv[0]).replace(/\\/g, "/")).toLowerCase();
  if (!KNOWN_EXES.has(exe0)) return false;
  // (a) does any token resolve to one of our real wrapper script paths?
  for (const tok of argv.slice(1)) {
    const t = String(tok);
    if (!/dispatch-(?:claude|agent)\.js$/i.test(t)) continue; // cheap pre-filter
    const norm = t.replace(/\\/g, "/").toLowerCase();
    // absolute token that already equals a real path, OR a token resolved under ROOT.
    const candidates = [
      norm,
      path.resolve(ROOT, t).replace(/\\/g, "/").toLowerCase(),
    ];
    if (candidates.some((cand) => DISPATCH_SCRIPT_PATHS.includes(cand))) return true;
  }
  // (b) known runtime as argv[0] + an assignment-form telemetry marker anywhere.
  if (TELEMETRY_MARKER_RE.test(c)) return true;
  return false;
}

/** Minimal command-line tokenizer: splits on whitespace, honoring "double" and
 *  'single' quotes (so a quoted path with spaces stays one token). Good enough to
 *  recover argv[0] + path arguments for the structural signature check. */
function tokenizeCmd(c) {
  const out = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let m;
  while ((m = re.exec(c)) !== null) {
    out.push(m[1] !== undefined ? m[1] : m[2] !== undefined ? m[2] : m[3]);
  }
  return out;
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
