#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// handoff-live.js — Layer-1 cheap deterministic live-state writer (S-11, RI-006).
//
// Wired to BOTH `Stop` (end of every reply) and `SessionEnd` (incl. source:clear).
// No LLM → ~ms → safe to run every turn. Writes a PER-session_id file
// `handoff-live-<sid>.md` and NEVER touches the rich `handoff.md` (Layer 2,
// owned by session-stop.js). It is the SAFETY NET for tracker-drift + untracked
// work: GROUND TRUTH (git) independent of TRACKER.md.
//
// Coverage model: a snapshot after every completed turn keeps the system ≤1 turn
// behind any disaster (crash / accidental terminal close / /clear / close) —
// because all of those happen AFTER a completed turn already on disk. The ONLY
// unrecoverable loss is a crash MID-turn (no hook observes an unfinished turn).
//
// Design discipline (the 4 load-bearing acceptance criteria, S-11):
//   1. Per-session_id keying — concurrent sessions must not clobber each other.
//   2. Writes on SessionEnd(clear) too (no once-sentinel) → the /clear bridge.
//   3. Atomic write (temp + rename) so a reader never sees a half file.
//   4. Honest physics — a mid-turn hard kill is simply not captured; we never
//      imply otherwise.
//
// Cross-cutting: all git is READ-ONLY + short-timeout + FAIL-OPEN (an index.lock
// from a concurrent git op must never hang or fail the turn). Any throw → exit 0.
// `runtime/` is gitignored → this never travels cross-machine (that is the
// committed TRACKER.md's job; keep the two roles distinct).
// ─────────────────────────────────────────────────────────────────────────────
"use strict";

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

let input = "";
process.stdin.on("data", (c) => (input += c));
process.stdin.on("end", () => {
  try {
    run(input);
  } catch {
    /* fail-open — never block the turn */
  }
  process.exit(0);
});

// Read-only git, short timeout, fail-open per call.
function gitRO(args, cwd) {
  try {
    return execSync(`git ${args}`, {
      cwd,
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 2500,
    })
      .toString()
      .trim();
  } catch {
    return "";
  }
}

function readFileSafe(p) {
  try {
    return fs.readFileSync(p, "utf8").trim();
  } catch {
    return "";
  }
}

// Per-session_id keying (decision #1). Prefer the REAL Claude session id (the
// payload / env), NOT the shared `.session-id` file (which concurrent sessions
// clobber — the exact bug this keying fixes). Sanitize for a filename.
function resolveSid(event, runtimeDir) {
  const raw =
    (event && event.session_id) ||
    process.env.CLAUDE_SESSION_ID ||
    readFileSafe(path.join(runtimeDir, ".session-id")) ||
    "unknown";
  const safe = String(raw).replace(/[^A-Za-z0-9_-]/g, "").slice(0, 48);
  return safe || "unknown";
}

// Parse `git status --porcelain` into staged / unstaged / untracked file lists.
// The status is ALWAYS the first two columns; the path is everything after,
// trimmed. We deliberately do NOT hard-slice at offset 3 — git-for-windows has
// been observed to emit a 2-char prefix (`"M .claude/..."`) for some staged
// entries, and a fixed slice(3) then eats the leading "." → a wrong path in the
// untracked-work signal. slice(2)+trim is correct for both the standard 3-char
// prefix and that 2-char variant. Also unwraps rename arrows + quoted paths.
function parsePorcelain(porcelain) {
  const staged = [];
  const unstaged = [];
  const untracked = [];
  if (!porcelain) return { staged, unstaged, untracked };
  for (const line of porcelain.split("\n")) {
    if (!line || line.length < 3) continue;
    const x = line[0]; // index (staged) status
    const y = line[1]; // worktree (unstaged) status
    let file = line.slice(2).trim();
    // renames/copies: "R  old -> new" → record the NEW path
    const arrow = file.indexOf(" -> ");
    if (arrow !== -1) file = file.slice(arrow + 4).trim();
    // git quotes paths with special chars
    if (file.startsWith('"') && file.endsWith('"')) file = file.slice(1, -1);
    if (!file) continue;
    if (x === "?" && y === "?") {
      untracked.push(file);
      continue;
    }
    if (x !== " " && x !== "?") staged.push(file);
    if (y !== " " && y !== "?") unstaged.push(file);
  }
  return { staged, unstaged, untracked };
}

// Last N user asks + last tool action, from the centralized event log (cheap).
function eventLogContext(cwd) {
  const out = { asks: [], lastAction: "" };
  try {
    const { query } = require("./lib/logger");
    const prompts = query({ cat: "prompt", limit: 3 }) || [];
    out.asks = prompts.map((e) => {
      const ts = new Date(e.ts).toISOString().slice(11, 19);
      return `[${ts}] ${(e.data && e.data.stripped ? e.data.stripped : "(no text)").slice(0, 180)}`;
    });
    const tools = query({ cat: "tool", limit: 1 }) || [];
    if (tools.length) {
      const t = tools[0];
      const name = (t.data && (t.data.tool || t.data.name)) || "tool";
      out.lastAction = `${name}${t.data && t.data.target ? " → " + String(t.data.target).slice(0, 80) : ""}`;
    }
  } catch {
    /* event log optional — omit on failure */
  }
  return out;
}

// Atomic write: temp (pid-suffixed) + rename. rename replaces the destination on
// Windows + POSIX, so a reader never observes a partial file.
function atomicWrite(finalPath, body) {
  const tmp = `${finalPath}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, body);
  fs.renameSync(tmp, finalPath);
}

function run(raw) {
  let event = {};
  try {
    event = JSON.parse(raw);
  } catch {
    /* tolerate empty / garbled stdin */
  }
  const cwd = process.env.CLAUDE_PROJECT_DIR || (event && event.cwd) || process.cwd();
  const claudeDir = path.join(cwd, ".claude");
  const runtimeDir = path.join(claudeDir, "runtime");
  try {
    fs.mkdirSync(runtimeDir, { recursive: true });
  } catch {
    /* ignore */
  }

  const sid = resolveSid(event, runtimeDir);
  const hookEvent =
    (event && (event.hook_event_name || event.hookEventName)) || "Stop";
  const source = (event && event.source) || "";

  const now = new Date();
  const ts = now.toISOString();

  // ── Git ground truth (each call independent + fail-open) ──
  const branch = gitRO("rev-parse --abbrev-ref HEAD", cwd) || "unknown";
  const head = gitRO("rev-parse --short HEAD", cwd);
  const lastMsg = gitRO("log -1 --pretty=%s", cwd);
  // Per-sid baseline (decision #1). Seed ONCE from the shared `.session-start-commit`
  // (set at SessionStart, before any turn — the accurate session origin) into a
  // per-sid copy that SURVIVES session-stop.js deleting the shared file, and is not
  // clobbered by concurrent sessions. Falls back to current HEAD if no shared file.
  // NOTE: handoff-live.js must run BEFORE session-stop.js in the Stop hook order so
  // it can read the shared baseline before that cleanup removes it.
  const perSidBaseline = path.join(runtimeDir, `.session-start-commit-${sid}`);
  let startCommit = readFileSafe(perSidBaseline);
  if (!startCommit) {
    startCommit = readFileSafe(path.join(claudeDir, ".session-start-commit")) || head;
    if (startCommit) {
      try {
        fs.writeFileSync(perSidBaseline, startCommit);
      } catch {
        /* ignore */
      }
    }
  }
  let sessionCommits = "";
  if (startCommit && head) {
    sessionCommits = gitRO(`log --oneline ${startCommit}..HEAD`, cwd);
  }
  const porcelain = gitRO("status --porcelain", cwd);
  const stagedStat = gitRO("diff --staged --stat", cwd);
  const unstagedStat = gitRO("diff --stat", cwd);
  const { staged, unstaged, untracked } = parsePorcelain(porcelain);

  const { asks, lastAction } = eventLogContext(cwd);

  // ── Assemble ──
  const L = [];
  L.push(`# Handoff (LIVE) — session \`${sid}\` — ${ts}`);
  L.push("");
  L.push(
    "> **Layer-1 live-state safety net** (S-11). Cheap deterministic snapshot, rewritten after every turn.",
  );
  L.push(
    "> GROUND TRUTH (git), independent of `TRACKER.md` — use it to catch uncommitted / untracked work the narrative handoff may not yet reflect.",
  );
  L.push(
    "> Physics: a mid-turn hard kill is NOT captured (no hook sees an unfinished turn); otherwise this is ≤1 turn stale. After a crash the rich `handoff.md` is simply absent.",
  );
  L.push("");
  L.push(`- Written by: \`${hookEvent}\`${source ? ` (source: ${source})` : ""}`);
  L.push("");

  L.push("## Git ground truth");
  L.push(`- When: ${ts}`);
  L.push(
    `- Branch: \`${branch}\` · HEAD: \`${head || "?"}\`${lastMsg ? ` — ${lastMsg}` : ""}`,
  );
  if (startCommit) {
    L.push(`- Session start commit: \`${startCommit.slice(0, 12)}\``);
  }
  if (sessionCommits) {
    L.push("");
    L.push("### Commits this session");
    sessionCommits.split("\n").forEach((c) => L.push(`- \`${c}\``));
  }
  L.push("");
  L.push(
    `### Uncommitted (the untracked-work signal) — staged ${staged.length} · unstaged ${unstaged.length} · untracked ${untracked.length}`,
  );
  const listBlock = (label, arr) => {
    if (!arr.length) return;
    L.push(`- **${label}:** ${arr.slice(0, 40).map((f) => `\`${f}\``).join(", ")}${arr.length > 40 ? ` … (+${arr.length - 40})` : ""}`);
  };
  listBlock("Staged", staged);
  listBlock("Unstaged", unstaged);
  listBlock("Untracked", untracked);
  if (stagedStat) {
    L.push("");
    L.push("Staged diffstat:");
    L.push("```");
    L.push(stagedStat);
    L.push("```");
  }
  if (unstagedStat) {
    L.push("");
    L.push("Unstaged diffstat:");
    L.push("```");
    L.push(unstagedStat);
    L.push("```");
  }
  L.push("");

  if (asks.length) {
    L.push("## Last user asks");
    asks.forEach((a) => L.push(`- ${a}`));
    L.push("");
  }
  if (lastAction) {
    L.push("## Last action");
    L.push(`- ${lastAction}`);
    L.push("");
  }

  const body = L.join("\n");
  atomicWrite(path.join(runtimeDir, `handoff-live-${sid}.md`), body);
}

// Exported for the fixture test (P5) — the test drives run() with synthetic
// payloads + sealed env rather than spawning a real session.
module.exports = {
  resolveSid,
  parsePorcelain,
  atomicWrite,
  _run: run,
};
