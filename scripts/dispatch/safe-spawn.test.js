#!/usr/bin/env node
"use strict";

/**
 * Isolated P5 test for safe-spawn.js (the dispatch safety kernel). Proves:
 *   - assertArgs ALLOWS a clean codex/claude invocation,
 *   - assertArgs REJECTS: an unknown flag, a shell metachar, a UNC/abs-exe arg,
 *     a bad flag value (planted violations — the "safe-spawn != safe args" class),
 *   - resolveTool REJECTS a non-allowlisted id, a repo-local resolution, a temp
 *     resolution (PATH-hijack guard),
 *   - normalizeStdin strips a BOM + normalizes CRLF,
 *   - safeSpawnSync fails CLOSED on an arg violation (no spawn) and runs a real
 *     deterministic command on the happy path.
 *
 *   node scripts/dispatch/safe-spawn.test.js
 */

const assert = require("assert");
const path = require("path");
const { harness, sealedDir } = require("../checks/lib/fixture-harness");
const { assertArgs, resolveTool, normalizeStdin, safeSpawnSync, PROJECT_ROOT } = require("./safe-spawn");

const h = harness("safe-spawn");

// ── assertArgs — known-answer (clean invocations pass) ──────
h.pass("codex clean invocation passes", () =>
  assertArgs("codex", ["exec", "--sandbox", "workspace-write", "--ask-for-approval", "never", "-m", "gpt-5.5", "-"]));
h.pass("claude clean invocation passes", () =>
  assertArgs("claude", ["-p", "--agent", "frontend-reviewer", "--model", "claude-opus-4-8", "--effort", "high"]));

// ── assertArgs — PLANTED VIOLATIONS (the arg-allowlist) ─────
h.violation("unknown/disallowed flag rejected", () =>
  assertArgs("codex", ["exec", "--dangerously-skip", "-"]));
h.violation("shell metachar in a flag value rejected", () =>
  assertArgs("codex", ["exec", "-m", "gpt-5.5;rm -rf /", "-"]));
h.violation("UNC / absolute-exe arg rejected (model never picks the exe)", () =>
  assertArgs("codex", ["exec", "\\\\attacker\\share\\evil.exe", "-"]));
h.violation("bad flag value rejected (sandbox not in allowlist)", () =>
  assertArgs("codex", ["exec", "--sandbox", "full-access-please", "-"]));
h.violation("claude --worktree outside repo rejected", () =>
  assertArgs("claude", ["-p", "--agent", "builder", "--worktree", "C:\\Windows\\Temp\\x"]));
// GPT-5.5 review CRITICAL regression guard: a consumed flag VALUE carrying a cmd
// metachar must be rejected even when the per-flag validator (codex -o path check)
// would accept the path. This is the CVE-2024-27980 .cmd-shim bypass.
h.violation("codex -o value with a cmd metachar (in-repo path + &) is rejected", () => {
  const repoPath = path.join(PROJECT_ROOT, "out&calc");
  return assertArgs("codex", ["exec", "-o", repoPath, "-"]);
});
h.violation("codex -o value with a pipe metachar is rejected", () =>
  assertArgs("codex", ["exec", "-o", path.join(PROJECT_ROOT, "a|b"), "-"]));
// GPT-5.5 review HIGH regression guard: a temp-PREFIX path that is not a temp CHILD
// must be rejected (string-prefix bug: "TempEvil".startsWith("Temp")).
h.violation("codex -o a temp-prefix-not-child path is rejected (boundary, not prefix)", () => {
  const os = require("os");
  return assertArgs("codex", ["exec", "-o", os.tmpdir() + "Evil" + path.sep + "x", "-"]);
});
// GPT-5.5 review R2 fixes: cmd var-expansion + a code-exec git subcommand.
h.violation("codex -o value with %VAR% cmd expansion is rejected", () =>
  assertArgs("codex", ["exec", "-o", path.join(PROJECT_ROOT, "a%PATH%b"), "-"]));
h.violation("codex -o value with !VAR! delayed expansion is rejected", () =>
  assertArgs("codex", ["exec", "-o", path.join(PROJECT_ROOT, "a!x!b"), "-"]));
h.violation("git config (code-exec/persistence) is rejected", () =>
  assertArgs("git", ["config", "core.pager", "x"]));
h.violation("git unknown subcommand is rejected (not a permissive positional)", () =>
  assertArgs("git", ["nonsense"]));

// ── resolveTool — PATH-hijack guard ─────────────────────────
h.test("resolveTool('node') resolves to a real native exe outside the repo", () => {
  const r = resolveTool("node");
  assert.strictEqual(r.ok, true, JSON.stringify(r));
  assert.ok(path.isAbsolute(r.path));
  assert.ok(!r.path.startsWith(PROJECT_ROOT + path.sep), "must not be repo-local");
});
h.violation("non-allowlisted tool-id refused", () => resolveTool("rm"));
h.violation("repo-local resolution refused (planted shim)", () => {
  const fx = sealedDir({ "claude.cmd": "@echo planted" }, "hijack");
  // Force the resolver at a repo-local file by pointing it inside PROJECT_ROOT.
  const planted = path.join(PROJECT_ROOT, "scripts", "dispatch", "__planted_shim.cmd");
  try {
    require("fs").writeFileSync(planted, "@echo planted\n");
    const r = resolveTool("claude", { path: planted });
    return r; // ok:false expected (repo-local) => isPass false => violation passes
  } finally {
    try { require("fs").unlinkSync(planted); } catch {}
    fx.cleanup();
  }
});
h.violation("temp-dir resolution refused (writable hijack)", () => {
  const fx = sealedDir({ "codex.exe": "x" }, "temphijack");
  try {
    return resolveTool("codex", { path: fx.file("codex.exe") }); // under os.tmpdir() => refused
  } finally {
    fx.cleanup();
  }
});

// ── normalizeStdin ──────────────────────────────────────────
h.test("normalizeStdin strips BOM + normalizes CRLF->LF, forces UTF-8 buffer", () => {
  const out = normalizeStdin("﻿line1\r\nline2\r\n");
  assert.ok(Buffer.isBuffer(out));
  assert.strictEqual(out.toString("utf8"), "line1\nline2\n");
});

// ── safeSpawnSync — fail-closed + real happy path ───────────
h.failClosed("safeSpawnSync fails closed on an arg violation (NO spawn)", () => {
  const r = safeSpawnSync("codex", ["exec", "--evil-flag", "-"]);
  // ok:true only if it wrongly spawned/passed; correct = ok:false, reason arg_policy_violation.
  return { ok: r.ok === true || r.reason !== "arg_policy_violation" };
});
h.test("safeSpawnSync runs a real deterministic command on the happy path", () => {
  const r = safeSpawnSync("git", ["rev-parse", "--is-inside-work-tree"], { cwd: PROJECT_ROOT });
  // In this repo git is available; rev-parse prints "true". If git is somehow
  // absent the kernel returns a clean reap (ok:false) — assert it never throws and
  // returns a well-formed shape.
  assert.ok(typeof r === "object" && "ok" in r && "reaped" in r, JSON.stringify(r));
  if (r.ok) assert.match(r.stdout.trim(), /^true$/, `stdout=${JSON.stringify(r.stdout)}`);
});

h.done();
