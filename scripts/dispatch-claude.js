#!/usr/bin/env node
/**
 * dispatch-claude.js — Bounded dispatch for Claude-role build-chain agents.
 *
 * THE RI-004 / ED-018 FIX. Sibling to dispatch-agent.js (which bridges only
 * openai/gemini and hard-refuses Claude roles). This script owns Claude-role
 * builder/fixer/stub-scaffold dispatch and makes a SILENT REAP LOUD.
 *
 * The wound (RI-004): when an orchestrator (γ/δ) dispatches a builder via raw
 *   `claude -p --agent builder "$(cat prompt)"`
 * the Claude Code harness auto-backgrounds the long call and reaps it at the
 * CLI buffer — 0 bytes out, NO completion record, exit code lost to `$(...)`.
 * gauntlet-verify never sees the builder (it isn't in its verified set), so the
 * gauntlet reports green on a role that never ran. ED-018: the reap is invisible
 * because `claude -p --agent` writes no completion record at all.
 *
 * The fix (make absence loud — two layers):
 *   1. BOUND the inner `claude -p` call with a timeout SHORTER than the harness
 *      auto-background threshold, so the wrapper returns control in time to
 *      write a durable record instead of being reaped mid-flight.
 *   2. On ANY reap signal — timeout, spawn failure, 0-byte stdout (even on
 *      exit 0 — the ED-018 signature), or non-zero exit — write a DEATH record
 *      AND an ok:false completion record to the canonical ledger, and exit
 *      NON-ZERO. The caller's `if [ $? -ne 0 ]` liveness check now fires.
 *   Backstop: even if the WRAPPER itself is reaped before writing, the builder
 *   has no ok:true record → gauntlet-verify (with `builder` in its role set)
 *   RED's on no-record. Absence is the signal, both ways.
 *
 * Telemetry reuse: recordCompletion / recordDeath / makeDispatchId /
 * cmdlineChecksum are imported from dispatch-agent.js so this wrapper writes to
 * the IDENTICAL canonical ledger gauntlet-verify reads (canonicalFile-anchored,
 * ED-016-safe). No second copy of the record/path logic.
 *
 * Usage:
 *   node scripts/dispatch-claude.js <role> <prompt-file | '-'> [--model <m>] [--worktree <path>]
 *
 * Output on stdout: JSON { ok, provider:"claude", role, output, reaped, reason? }
 *
 * Exit codes:
 *   0 — builder ran and produced a well-formed (non-empty) result.
 *   1 — REAP: timeout / spawn-failure / zero-byte / non-zero exit. Loud death.
 *   2 — usage / config error.
 *
 * Test seam (no real `claude` CLI required):
 *   DISPATCH_CLAUDE_BIN        — executable to spawn (default "claude")
 *   DISPATCH_CLAUDE_BIN_ARGS   — JSON array prepended before the claude args
 *                                (e.g. ["/path/fake.js"] so `node fake.js …` runs)
 *   DISPATCH_BUILDER_TIMEOUT_MS — bound override (default 20 min)
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

// Reuse the canonical telemetry helpers — SAME ledger gauntlet-verify reads.
const {
  recordCompletion,
  recordDeath,
  makeDispatchId,
  cmdlineChecksum,
  AGENT_ROOT,
  // N-1 (§17.4): same run-context + prompt-digest stampers as the cross-provider
  // wrapper, so both write a uniformly coverage-gradeable record.
  runContext,
  promptDigest,
} = require("./dispatch-agent");

const PROVIDER = "claude";
const DEFAULT_TIMEOUT_MS = 20 * 60 * 1000; // 20 min — builders are heavier than the 15-min review ceiling
const MAX_BUFFER = 32 * 1024 * 1024; // 32 MB

// Build-chain roles edit a repo — they MUST run isolated (a worktree), never in
// canonical. Mirrors BUILD_CHAIN_ROLES in dispatch-route-guard.js.
const BUILD_CHAIN_ROLES = new Set([
  "builder",
  "backend-builder",
  "frontend-builder",
  "fixer",
  "skeleton-builder", // S-7: was `stub-scaffold` (this set is matched WITHOUT normalize)
  "stub-scaffold", // S-7 legacy id (back-compat)
]);

function usage(msg) {
  console.error(
    JSON.stringify({
      ok: false,
      provider: PROVIDER,
      error: msg,
      usage:
        "node scripts/dispatch-claude.js <role> <prompt-file | '-'> [--model <m>] (-w | --worktree <path>)  # build roles REQUIRE -w or --worktree",
    }),
  );
  process.exit(2);
}

// ── Parse args ──────────────────────────────────────────────
const argv = process.argv.slice(2);
const role = argv[0];
const promptArg = argv[1];

function parseFlag(name) {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : null;
}
const model = parseFlag("--model");
const effort = parseFlag("--effort"); // forwarded to claude (builders/fixers force --effort max)
const worktree = parseFlag("--worktree");
// `-w` passthrough: the framework's builder dispatch uses `claude … -w` to have
// the CLI create an isolated worktree (.claude/agents/_system/agent-system.md). The wrapper
// MUST preserve that isolation — forward `-w` to claude unchanged. (Use
// --worktree <path> instead when the orchestrator already created the worktree
// and wants the child to run with cwd set to it.)
const passW = argv.includes("-w");

if (!role || !promptArg) {
  usage("Usage: <role> and <prompt-file | '-'> are both required.");
}
// Controlled tokens only — these are interpolated into a shell command line when
// the real claude bin is used (shell:true on Windows). Refuse shell metacharacters.
if (!/^[a-z0-9][a-z0-9_-]*$/i.test(role)) {
  usage(`Invalid role token: ${JSON.stringify(role)} (expected [a-z0-9_-]).`);
}
if (model && !/^[a-z0-9][a-z0-9._:-]*$/i.test(model)) {
  usage(`Invalid model token: ${JSON.stringify(model)}.`);
}
if (effort && !/^[a-z]+$/i.test(effort)) {
  usage(`Invalid effort token: ${JSON.stringify(effort)} (expected e.g. low|medium|high|max).`);
}

// CRITICAL ISOLATION GATE (reviewer-CRITICAL ×2): a build-chain role must run
// isolated — either `-w` (claude creates a worktree) OR `--worktree <path>` to a
// REAL, distinct git worktree. NEVER fall back to canonical (AGENT_ROOT): a
// builder running in canonical would edit the live repo. A `--worktree` is valid
// only when, after realpath:
//   (a) it exists and is a directory,
//   (b) it is NOT the canonical root (defeats `--worktree .` / `--worktree <root>`),
//   (c) it carries a LINKED-worktree `.git` (a `.git` FILE whose content starts
//       with `gitdir:` — the form `git worktree add` always writes). This defeats
//       a plain subdir like `--worktree scripts` (no `.git`) AND a nested clone or
//       the canonical root (whose `.git` is a DIRECTORY, not a `gitdir:` file),
//       while still accepting every real linked worktree — so it does not false-RED.
let worktreeValid = false;
let worktreeReal = null;
if (worktree && fs.existsSync(worktree)) {
  try {
    if (fs.statSync(worktree).isDirectory()) {
      const wtReal = fs.realpathSync(worktree);
      const agentReal = fs.realpathSync(AGENT_ROOT);
      const isCanonical = wtReal === agentReal;
      const gitPath = path.join(wtReal, ".git");
      const isLinkedWorktree =
        fs.existsSync(gitPath) &&
        fs.statSync(gitPath).isFile() &&
        fs.readFileSync(gitPath, "utf8").trimStart().startsWith("gitdir:");
      if (!isCanonical && isLinkedWorktree) {
        worktreeValid = true;
        worktreeReal = wtReal;
      }
    }
  } catch {
    worktreeValid = false;
  }
}
if (BUILD_CHAIN_ROLES.has(role.toLowerCase()) && !passW && !worktreeValid) {
  usage(
    `Build-chain role '${role}' requires isolation: pass -w (claude creates the worktree) ` +
      `or --worktree <distinct-git-worktree>. A missing, canonical, or non-worktree path is ` +
      `refused so a builder never edits canonical.`,
  );
}

// ── Load the prompt ─────────────────────────────────────────
let promptStr = "";
try {
  promptStr = promptArg === "-" ? fs.readFileSync(0, "utf8") : fs.readFileSync(promptArg, "utf8");
} catch (e) {
  usage(`Prompt not readable (${promptArg}): ${e && e.message ? e.message : e}`);
}
if (!promptStr.trim()) usage("Empty prompt.");
const promptBuf = Buffer.from(promptStr, "utf8");
const promptBytes = promptBuf.length;

// ── Build the spawn ─────────────────────────────────────────
const BIN = process.env.DISPATCH_CLAUDE_BIN || "claude";
let prefixArgs = [];
try {
  prefixArgs = JSON.parse(process.env.DISPATCH_CLAUDE_BIN_ARGS || "[]");
  if (!Array.isArray(prefixArgs)) prefixArgs = [];
} catch {
  prefixArgs = [];
}
const claudeArgs = [...prefixArgs, "-p", "--agent", role];
if (model) claudeArgs.push("--model", model);
if (effort) claudeArgs.push("--effort", effort);
if (passW) claudeArgs.push("-w"); // forward worktree-creation to claude (preserve isolation)

const TIMEOUT_MS = parseInt(
  process.env.DISPATCH_BUILDER_TIMEOUT_MS || `${DEFAULT_TIMEOUT_MS}`,
  10,
);

// cwd = the VALIDATED worktree (builder edits there); else canonical root. When
// only `-w` is passed, claude creates its own worktree and the wrapper stays at
// AGENT_ROOT (telemetry resolves canonical).
const runCwd = worktreeValid && worktreeReal ? worktreeReal : AGENT_ROOT;
// CRITICAL (ED-016 class): pass canonical CLAUDE_PROJECT_DIR even when cwd is a
// worktree, so any nested telemetry resolves to canonical, not the worktree.
const childEnv = { ...process.env, CLAUDE_PROJECT_DIR: AGENT_ROOT };

// Real claude on Windows is a .cmd shim → needs shell. The test seam sets
// DISPATCH_CLAUDE_BIN (a real node executable) → no shell needed.
const useShell = process.env.DISPATCH_CLAUDE_BIN ? false : process.platform === "win32";

const dispatchId = makeDispatchId();
const startedAt = new Date().toISOString();
const startedMs = Date.now();
const cmdChecksum = cmdlineChecksum(role, PROVIDER, promptBytes);

// ── Dispatch-contract consult (§17.1 keystone) ──────────────
// Every dispatcher READS FROM the contract. This wrapper owns the subprocess-claude
// shape, so it asserts the role is contract-allowed to be dispatched this way (a
// cross-provider reviewer routed here, or a role that forbids subprocess-claude,
// is a routing error). REPORT-ONLY by default (PLAN §4 ramp: report-only -> blocking);
// set WARPOS_DISPATCH_CONTRACT_ENFORCE=block to make a violation fatal. Fail-OPEN
// on any contract-read error — the contract must never crash a working dispatch.
try {
  const { validateDispatch } = require("./dispatch/dispatch-contract");
  const verdict = validateDispatch({
    role,
    shape: "subprocess-claude",
    toolId: "claude",
    cwd: runCwd,
  });
  if (!verdict.ok) {
    const blocking = process.env.WARPOS_DISPATCH_CONTRACT_ENFORCE === "block";
    process.stderr.write(
      `[dispatch-claude] dispatch-contract ${blocking ? "VIOLATION" : "advisory"}: ` +
        `${verdict.violations.join("; ")}\n`,
    );
    if (blocking) {
      console.log(
        JSON.stringify({ ok: false, provider: PROVIDER, role, reaped: false, reason: "dispatch_contract_violation", violations: verdict.violations }),
      );
      process.exit(1);
    }
  }
} catch {
  /* fail-open — contract consult never blocks a working dispatch */
}

const spawned = spawnSync(BIN, claudeArgs, {
  input: promptBuf,
  timeout: TIMEOUT_MS,
  maxBuffer: MAX_BUFFER,
  cwd: runCwd,
  env: childEnv,
  encoding: "buffer",
  shell: useShell,
  windowsHide: true,
});

// ── Classify the outcome ────────────────────────────────────
const stdoutBuf = spawned.stdout || Buffer.alloc(0);
const stderrBuf = spawned.stderr || Buffer.alloc(0);
const stdoutBytes = stdoutBuf.length;
const stderrBytes = stderrBuf.length;
// trim() defeats whitespace/banner-only false-greens (reviewer-HIGH): a CLI that
// emits only a blank line or a banner is NOT a successful build.
const trimmedStdoutLen = stdoutBuf.toString("utf8").trim().length;
const status = spawned.status; // null when killed by signal
const signal = spawned.signal; // 'SIGTERM' on timeout kill
const errCode = spawned.error && spawned.error.code ? spawned.error.code : null;

const timedOut = errCode === "ETIMEDOUT" || signal === "SIGTERM" || signal === "SIGKILL";
const spawnFailed = errCode === "ENOENT" || errCode === "EACCES" || errCode === "EPERM";

// Best-effort (reviewer-HIGH): on a Windows timeout, spawnSync's SIGTERM kills
// the shell but the claude grandchild may survive. taskkill the tree by pid.
// The REAL safety net is the isolation gate above — a survivor edits a throwaway
// worktree, never canonical. (Residual: a reparented grandchild may escape.)
if (timedOut && process.platform === "win32" && spawned.pid) {
  try {
    spawnSync("taskkill", ["/T", "/F", "/PID", String(spawned.pid)], { timeout: 5000 });
  } catch {
    /* best effort */
  }
}

// Classification order (reviewer-fix): timeout → spawn-failure → non-zero exit →
// empty/whitespace stdout on exit 0 (the ED-018 silent-reap signature). A
// non-zero exit is named as such even when it produced no bytes.
let reaped = false;
let reason = null;
if (timedOut) {
  reaped = true;
  reason = "builder_timeout_reap";
} else if (spawnFailed) {
  reaped = true;
  reason = "builder_spawn_failed";
} else if (typeof status === "number" && status !== 0) {
  reaped = true;
  reason = "builder_nonzero_exit";
} else if (trimmedStdoutLen === 0) {
  reaped = true;
  reason = "builder_zero_byte_reap"; // exit 0 but no real output → silent reap
}

// CONTRACT BOUNDARY (reviewer-HIGH, scoped decision): this wrapper detects a
// REAP (silent death / timeout / empty output) — "did the process run and
// produce non-trivial output". It does NOT validate that the output is a valid
// builder result, because build-chain output is free-form (code + prose), not a
// fixed JSON envelope — schema-validating it here would false-REJECT valid
// builds. "Did the builder produce REAL code" is the orchestrator's worktree-diff
// liveness gate (gamma.md "Verify before report"): non-empty output AND a real
// worktree change, BEFORE the gauntlet. Banner-only stdout with no worktree
// change is caught there. The two gates are layered, not redundant.
const ok = !reaped;
const completedAt = new Date().toISOString();
const elapsedMs = Date.now() - startedMs;

// ALWAYS write a completion record — a real run is greenable (ok:true,
// well-formed per gauntlet-verify#isWellFormedOkRecord), a reap is ok:false →
// gauntlet-verify sees "failed", not the ambiguous "no-record".
recordCompletion({
  dispatch_id: dispatchId,
  pid: process.pid,
  role,
  provider: PROVIDER,
  model: model || null,
  started_at: startedAt,
  completed_at: completedAt,
  elapsed_ms: elapsedMs,
  prompt_bytes: promptBytes,
  cmdline_checksum: cmdChecksum,
  exit_code: typeof status === "number" ? status : null,
  stdout_bytes: stdoutBytes,
  stderr_bytes: stderrBytes,
  fallback: false,
  ok,
  // N-1 (§17.4): run-context + shape + tool + prompt digest for the coverage gate.
  ...runContext(),
  prompt_digest: promptDigest(promptBuf),
  shape: "subprocess-claude",
  tool_id: "claude",
});

// On a reap, write the durable DEATH record (mirrors the silent_zero_byte_death
// shape in dispatch-agent.js) so a post-mortem can name WHICH reap mode hit.
if (reaped) {
  recordDeath({
    dispatch_id: dispatchId,
    timestamp: completedAt,
    pid: process.pid,
    role,
    provider: PROVIDER,
    model: model || null,
    prompt_bytes: promptBytes,
    cmdline_checksum: cmdChecksum,
    exit_code: typeof status === "number" ? status : null,
    signal: signal || null,
    stdout_bytes: stdoutBytes,
    stderr_bytes: stderrBytes,
    timeout_ms: TIMEOUT_MS,
    reason,
    hint:
      reason === "builder_timeout_reap"
        ? `claude -p --agent ${role} exceeded ${TIMEOUT_MS}ms bound and was killed (likely harness reap / hang).`
        : reason === "builder_zero_byte_reap"
          ? `claude -p --agent ${role} produced 0 bytes of stdout (silent reap — the ED-018 signature).`
          : reason === "builder_spawn_failed"
            ? `could not spawn '${BIN}' (${errCode}).`
            : `claude -p --agent ${role} exited ${status}.`,
  });
}

// Emit a structured result the orchestrator can capture.
const output = stdoutBuf.toString("utf8");
process.stdout.write(
  JSON.stringify({
    ok,
    provider: PROVIDER,
    role,
    reaped,
    reason: reason || undefined,
    output: ok ? output : "",
    stderr: reaped ? stderrBuf.toString("utf8").slice(0, 2000) : undefined,
  }) + "\n",
);

process.exit(ok ? 0 : 1);
