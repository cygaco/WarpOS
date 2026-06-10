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
  // §17.4 strengthening: shared output_digest (proof-of-artifact) + argv schema
  // version stampers — identical schema across both wrappers.
  outputDigest,
  argvSchemaVersion,
} = require("./dispatch-agent");

// PLAN §17.2 step-1 wire-through: the build-chain Claude spawn routes through the
// shared dispatch SAFETY KERNEL (scripts/dispatch/safe-spawn.js) — tool resolved
// to an absolute path so the model never chooses the exe (repo/temp PATH-hijack
// refused), every flag/value allowlisted, stdin UTF-8/BOM/CRLF-normalized,
// whole-tree kill on timeout, and cmd.exe/c for the .cmd shim. Loaded best-effort;
// the PRODUCTION path fails CLOSED if it's missing (refuses the legacy shell spawn
// rather than re-opening the injection surface) — mirrors the providers.js
// Wave-1 wire-through.
let safeSpawn = null;
try {
  safeSpawn = require("./dispatch/safe-spawn");
} catch {
  safeSpawn = null;
}

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

// GENERIC BUILD IDS — G1 / β option (c) / EVT-dispatch-shape-w0-plan-design-001.
// These ids are mandated by the dispatch GUIDE for build-chain dispatch but are
// deliberately NOT in role-registry.json (the FE/BE split is contextual; a 1:1
// alias would be wrong — role-aliases.js intentionally omits them). The result:
// validateDispatch({ role:"builder" }) returns ok:false + "(fail-closed)" — correct
// for the registry (the role truly is unresolvable there) but LYING when printed as
// the dispatch advisory, because this wrapper DOES know "builder" is a valid
// build-chain sentinel. Fix: for a generic id, re-validate against build_chain_worker
// directly (the class dispatch-claude.js already enforces via BUILD_CHAIN_ROLES +
// the isolation gate). The wrapper and the contract then AGREE on the truthful result.
const GENERIC_BUILD_IDS = new Set(["builder"]);

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
// the CLI create an isolated worktree (see _system/guides/agent-dispatch-guide.md §10). The wrapper
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
  const { validateDispatch, validateDispatchForClass } = require("./dispatch/dispatch-contract");
  const verdict = validateDispatch({
    role,
    shape: "subprocess-claude",
    toolId: "claude",
    cwd: runCwd,
  });
  if (!verdict.ok && GENERIC_BUILD_IDS.has(role.toLowerCase())) {
    // G1 / β option (c): re-validate against build_chain_worker class directly.
    // validateDispatch returned ok:false only because 'builder' (the generic id the
    // GUIDE mandates) is not in role-registry.json — NOT because the dispatch is
    // wrong. dispatch-claude.js already enforced the isolation gate (BUILD_CHAIN_ROLES
    // + the -w / --worktree check above). Use the class-level helper so the advisory
    // is TRUTHFUL: either "resolved to build_chain_worker (OK)" or a real violation
    // (e.g. cwd is canonical when -w isn't providing its own worktree). NOT "(fail-closed)".
    // EVT-dispatch-shape-w0-plan-design-001 (β ratified option c).
    const classVerdict = validateDispatchForClass({
      class: "build_chain_worker",
      shape: "subprocess-claude",
      toolId: "claude",
      cwd: runCwd,
    });
    if (classVerdict.ok) {
      // Truthful informational: generic id resolved to a real class, shape OK.
      process.stderr.write(
        `[dispatch-claude] dispatch-contract: generic build id '${role}' resolved to class 'build_chain_worker' (subprocess-claude OK)\n`,
      );
    } else {
      // A real violation (e.g. worktree-required + canonical cwd when using -w).
      // Report it honestly — still NOT "(fail-closed)", since the shape/tool are correct.
      process.stderr.write(
        `[dispatch-claude] dispatch-contract advisory: ${classVerdict.violations.join("; ")}\n`,
      );
    }
    // Proceed-on-advisory default unchanged (W0 scope; no REFUSE flip).
  } else if (!verdict.ok) {
    // Genuinely unknown id (not in role-registry, not a GENERIC_BUILD_ID), or a real
    // violation for a registered role. Keep the honest fail-closed wording unchanged.
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

// ── Shape-resolver self-detection (T-20260608-271) ──────────────────────────
// This wrapper OWNS the subprocess-claude shape. Consult the LIVE resolver
// (dispatch-shape.js) as the independent authority: if resolveShape would pick a
// DIFFERENT shape for this role, the role is being routed through the WRONG wrapper
// (e.g. a cross-provider reviewer pushed through dispatch-claude) — the wrong shape
// self-detects on a REAL dispatch (the north star's 2nd clause). Report-only by default
// (same ramp as the contract consult); WARPOS_DISPATCH_CONTRACT_ENFORCE=block makes a
// high-severity mismatch fatal. Fail-OPEN on any resolver error.
try {
  const { shapeMismatch } = require("./dispatch/dispatch-shape");
  const mm = shapeMismatch("subprocess-claude", { kind: "agent", id: role });
  if (mm && mm.mismatch) {
    if (GENERIC_BUILD_IDS.has(role.toLowerCase())) {
      // G1: the resolver falls back to adhoc/inline for 'builder' because it isn't
      // in role-registry — but we KNOW it's a build-chain sentinel (class-resolved
      // above). Suppress the misleading "resolver picks 'inline'" advisory; the
      // contract consult block above already emitted the truthful note.
    } else {
      const blocking = process.env.WARPOS_DISPATCH_CONTRACT_ENFORCE === "block" && mm.severity === "high";
      process.stderr.write(
        `[dispatch-claude] shape-resolver ${blocking ? "VIOLATION" : "advisory"}: ` +
          `role '${role}' dispatched as 'subprocess-claude' but the resolver picks '${mm.expected}' ` +
          `(${mm.expectedReason || mm.reason}; severity=${mm.severity || "medium"}).\n`,
      );
      if (blocking) {
        console.log(
          JSON.stringify({ ok: false, provider: PROVIDER, role, reaped: false, reason: "dispatch_shape_mismatch", expected: mm.expected, actual: "subprocess-claude", severity: mm.severity }),
        );
        process.exit(1);
      }
    }
  }
} catch {
  /* fail-open — the resolver consult never crashes a working dispatch */
}

// ── Spawn: production → the safety kernel; test-seam → direct ─
// PRODUCTION (no DISPATCH_CLAUDE_BIN): route through safeSpawnSync — the model
// never chooses the exe (claude resolved to an abs path; repo/temp PATH-hijack
// refused), every flag/value is allowlisted, stdin is UTF-8/BOM/CRLF-normalized,
// and the WHOLE process tree is killed on timeout (taskkill /T /F). Fail CLOSED if
// the kernel is missing. (PLAN §17.2 step-1 / §16.3 / §17.3.)
// TEST SEAM (DISPATCH_CLAUDE_BIN set): a direct spawn of the injected fake node
// bin, so dispatch-claude.test.js reproduces the reap fixtures deterministically
// without the real CLI. This branch is unreachable in real dispatch; the kernel's
// own spawn/resolve/arg behavior is covered by safe-spawn.test.js and the live
// wire-through is probe-verified (mirrors the providers.js Wave-1 pattern).
const usingSeam = !!process.env.DISPATCH_CLAUDE_BIN;

let stdoutBuf = Buffer.alloc(0);
let stderrBuf = Buffer.alloc(0);
let status = null; // exit code; null when killed by signal / refused pre-spawn
let signal = null; // 'SIGTERM' on a seam-path timeout kill (kernel handles its own)
let spawnFailDetail = null; // arg-policy / resolution refusal detail for the death hint
let reaped = false;
let reason = null;

if (usingSeam) {
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
  stdoutBuf = spawned.stdout || Buffer.alloc(0);
  stderrBuf = spawned.stderr || Buffer.alloc(0);
  status = spawned.status;
  signal = spawned.signal;
  const errCode = spawned.error && spawned.error.code ? spawned.error.code : null;
  const timedOut = errCode === "ETIMEDOUT" || signal === "SIGTERM" || signal === "SIGKILL";
  const spawnFailed = errCode === "ENOENT" || errCode === "EACCES" || errCode === "EPERM";
  // Best-effort tree-kill on the seam (the production path's kernel does this for real).
  if (timedOut && process.platform === "win32" && spawned.pid) {
    try {
      spawnSync("taskkill", ["/T", "/F", "/PID", String(spawned.pid)], { timeout: 5000 });
    } catch {
      /* best effort */
    }
  }
  // trim() defeats whitespace/banner-only false-greens: a CLI emitting only a blank
  // line or a banner is NOT a successful build. Classification order: timeout →
  // spawn-failure → non-zero exit → empty/whitespace stdout (the ED-018 signature).
  const trimmedStdoutLen = stdoutBuf.toString("utf8").trim().length;
  if (timedOut) {
    reaped = true;
    reason = "builder_timeout_reap";
  } else if (spawnFailed) {
    reaped = true;
    reason = "builder_spawn_failed";
    spawnFailDetail = errCode;
  } else if (typeof status === "number" && status !== 0) {
    reaped = true;
    reason = "builder_nonzero_exit";
  } else if (trimmedStdoutLen === 0) {
    reaped = true;
    reason = "builder_zero_byte_reap"; // exit 0 but no real output → silent reap
  }
} else {
  // Production — fail CLOSED if the kernel can't be loaded (refuse the legacy spawn).
  if (!safeSpawn) {
    usage(
      "dispatch safety kernel (scripts/dispatch/safe-spawn.js) unavailable — refusing the " +
        "legacy shell spawn rather than re-opening the injection surface. Restore the module.",
    );
  }
  const r = safeSpawn.safeSpawnSync("claude", claudeArgs, {
    input: promptBuf,
    timeoutMs: TIMEOUT_MS,
    maxBuffer: MAX_BUFFER,
    cwd: runCwd,
    env: childEnv,
  });
  // The kernel already resolved + arg-checked + spawned + tree-killed + classified.
  // It suppresses stdout to "" on a reap, so a reaped run records 0 stdout bytes.
  stdoutBuf = Buffer.from(r.stdout || "", "utf8");
  stderrBuf = Buffer.from(r.stderr || "", "utf8");
  status = typeof r.exitCode === "number" ? r.exitCode : null;
  // Translate the kernel's classification → the builder_* reason vocabulary the
  // death record + gauntlet post-mortem expect. A PRE-spawn refusal (disallowed
  // arg / hijacked exe / unresolved cmd.exe) is a LOUD spawn failure, never a
  // silent pass — fail-closed, with the kernel's detail carried into the hint.
  if (
    r.reason === "arg_policy_violation" ||
    r.reason === "tool_resolution_refused" ||
    r.reason === "cmd_exe_unresolved"
  ) {
    reaped = true;
    reason = "builder_spawn_failed";
    spawnFailDetail = r.violations ? `arg-policy: ${r.violations.join("; ")}` : r.detail || r.reason;
  } else if (r.reaped) {
    reaped = true;
    reason =
      r.reason === "timeout_reap"
        ? "builder_timeout_reap"
        : r.reason === "spawn_failed"
          ? "builder_spawn_failed"
          : r.reason === "zero_byte_reap"
            ? "builder_zero_byte_reap"
            : "builder_nonzero_exit";
    if (reason === "builder_spawn_failed") spawnFailDetail = r.detail || r.reason;
  }
}

const stdoutBytes = stdoutBuf.length;
const stderrBytes = stderrBuf.length;

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
  // §17.4 strengthening: schema version (anti-stale/backfill), cwd (the worktree
  // the builder ran in), and output_digest (proof of non-trivial output — "" on a
  // reap yields null, so a reaped record carries no false artifact proof).
  argv_schema_version: argvSchemaVersion(),
  cwd: runCwd,
  output_digest: outputDigest(stdoutBuf),
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
            ? `could not spawn the '${role}' builder via the dispatch safety kernel (${spawnFailDetail || "spawn refused"}).`
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
