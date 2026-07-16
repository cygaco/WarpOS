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
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");
const { harness, sealedDir } = require("../checks/lib/fixture-harness");
const { assertArgs, resolveTool, normalizeStdin, treeKill, safeSpawnSync, safeSpawnFile, PROJECT_ROOT } = require("./safe-spawn");

// Synchronous, event-loop-free sleep so a process-liveness poll can block inside a
// synchronous h.test without a foreground shell `sleep`. The detached descendants
// append their PIDs from their OWN processes, so we only need to re-read a file —
// no event loop required between reads.
function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}
const isAlive = (pid) => {
  try { process.kill(pid, 0); return true; } catch { return false; }
};

const h = harness("safe-spawn");

// ── assertArgs — known-answer (clean invocations pass) ──────
h.pass("codex clean invocation passes", () =>
  assertArgs("codex", ["exec", "--sandbox", "workspace-write", "--ask-for-approval", "never", "-m", "gpt-5.5", "-"]));
h.pass("claude clean invocation passes", () =>
  assertArgs("claude", ["-p", "--agent", "frontend-reviewer", "--model", "claude-opus-4-8", "--effort", "high"]));

// ── #27 agy INJECT_META carve-out — multi-line `-p` value slot ONLY (both ways) ──
const AGY_MULTILINE = "line one\nline two\nline three";
// (a) accepted: a MULTI-LINE prompt in agy's native-exe `-p` value slot rides the carve-out.
h.pass("agy multi-line -p accepted (the ONE carve-out slot)", () =>
  assertArgs("agy", ["--model", "gemini-3.1-pro-high", "--print-timeout", "90s", "-p", AGY_MULTILINE]));
// (b) refused: the SAME multi-line content in ANY OTHER agy arg (--model) hits full INJECT_META.
h.violation("agy multi-line in --model rejected (carve-out is -p only)", () =>
  assertArgs("agy", ["--model", AGY_MULTILINE, "-p", "hi"]));
// (c) refused: a newline to a DIFFERENT tool (codex -m) is not carved out — agy-only.
h.violation("codex -m multi-line rejected (carve-out is agy-only)", () =>
  assertArgs("codex", ["exec", "-m", AGY_MULTILINE, "-"]));
// (d) refused: agy `-p` still rejects every OTHER injection metachar (backtick / pipe).
h.violation("agy -p with a backtick still rejected (only newline is carved out)", () =>
  assertArgs("agy", ["-p", "hi `whoami`"]));
h.violation("agy -p with a pipe still rejected", () =>
  assertArgs("agy", ["-p", "a | b"]));
// (e) refused: a .cmd/.bat SHIM agy is refused in safeSpawnSync (native-exe only — cmd.exe /c would
// reparse the newline). The native-exe half of the allowlist-of-shape.
h.failClosed("agy .cmd-shim refused (native-exe only carve-out)", () => {
  const dir = path.join(PROJECT_ROOT, "runtime", ".agy-shim-test");
  fs.mkdirSync(dir, { recursive: true });
  const shim = path.join(dir, "agy.cmd");
  fs.writeFileSync(shim, "@echo off\r\necho hi\r\n");
  try {
    const r = safeSpawnSync("agy", ["--model", "gemini-3.1-pro-high", "-p", AGY_MULTILINE], {
      resolve: { path: shim, allowRepoLocal: true },
      timeoutMs: 3000,
    });
    return { ok: r.ok === true || r.reason !== "agy_requires_native_exe" };
  } finally {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ }
  }
});

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

// ── treeKill — CHILD *and* GRANDCHILD die (PLAN §17.3 / §17.6 precond #2) ──
// The "orphaned paid subprocess tree" residual: CLIs spawn their OWN children, so
// killing only the top process leaks grandchildren that keep burning paid tokens.
// This plants a real 3-level node tree (parent → child → GRANDCHILD, all real PIDs,
// long-sleeping) and proves treeKill(parentPid) reaps ALL THREE — the GRANDCHILD
// death being the load-bearing assertion the prior 21 cases never exercised.
h.test("treeKill reaps a parent + child + GRANDCHILD process tree (not just the top)", () => {
  // Cross-platform: parent/child are spawned detached so on POSIX treeKill's
  // process-group kill reaches them; on win32 `taskkill /T` walks the live tree.
  // Each level appends its own PID to a sealed temp file (deterministic handoff that
  // doesn't depend on stdio inheritance across spawn hops).
  const pidFile = path.join(os.tmpdir(), `warpos-treekill-${process.pid}-${Date.now()}.txt`);
  fs.writeFileSync(pidFile, "");
  const fj = JSON.stringify(pidFile);
  const detached = process.platform !== "win32";
  const dj = String(detached);
  // GRANDCHILD: record PID, then sleep ~60s (kept alive only by the timer).
  const gSrc = `const fs=require("fs");fs.appendFileSync(${fj},"G "+process.pid+"\\n");setTimeout(()=>{},60000);`;
  // CHILD: spawn the grandchild, record PID, sleep.
  const cSrc = `const cp=require("child_process");const fs=require("fs");cp.spawn(process.execPath,["-e",${JSON.stringify(gSrc)}],{stdio:"ignore",detached:${dj}}).unref();fs.appendFileSync(${fj},"C "+process.pid+"\\n");setTimeout(()=>{},60000);`;
  // PARENT: spawn the child, record PID, sleep.
  const pSrc = `const cp=require("child_process");const fs=require("fs");cp.spawn(process.execPath,["-e",${JSON.stringify(cSrc)}],{stdio:"ignore",detached:${dj}}).unref();fs.appendFileSync(${fj},"P "+process.pid+"\\n");setTimeout(()=>{},60000);`;

  let pids = {};
  let killed = false;
  try {
    const parent = spawn(process.execPath, ["-e", pSrc], { stdio: "ignore", detached });
    parent.unref();

    // Harvest all three PIDs from the sealed file (bounded poll, fully synchronous).
    const harvestDeadline = Date.now() + 8000;
    while (Date.now() < harvestDeadline) {
      const lines = fs.readFileSync(pidFile, "utf8").trim().split(/\r?\n/).filter(Boolean);
      if (lines.length >= 3) {
        for (const l of lines) { const [k, v] = l.split(" "); pids[k] = Number(v); }
        break;
      }
      sleepSync(50);
    }
    assert.ok(pids.P && pids.C && pids.G, `failed to harvest all 3 PIDs (got ${JSON.stringify(pids)})`);
    assert.ok(isAlive(pids.P) && isAlive(pids.C) && isAlive(pids.G), `tree not fully alive pre-kill: ${JSON.stringify(pids)}`);

    // The unit under test: a SINGLE treeKill on the top PID must reap the whole tree.
    assert.strictEqual(treeKill(pids.P), true, "treeKill should report success");
    killed = true;

    // Poll for death (taskkill /T + process teardown is async at the OS level).
    const deathDeadline = Date.now() + 5000;
    while (Date.now() < deathDeadline && (isAlive(pids.P) || isAlive(pids.C) || isAlive(pids.G))) {
      sleepSync(50);
    }
    assert.ok(!isAlive(pids.P), `parent ${pids.P} survived treeKill`);
    assert.ok(!isAlive(pids.C), `child ${pids.C} survived treeKill`);
    // THE key assertion: a grandchild two levels down must NOT outlive a tree-kill.
    assert.ok(!isAlive(pids.G), `GRANDCHILD ${pids.G} survived treeKill — orphaned paid subprocess leak`);
  } finally {
    // Deterministic: never leak processes even if an assertion above failed.
    for (const pid of [pids.P, pids.C, pids.G]) {
      if (pid && isAlive(pid)) { try { treeKill(pid); } catch {} }
    }
    if (!killed && pids.P) { try { treeKill(pids.P); } catch {} }
    try { fs.unlinkSync(pidFile); } catch {}
  }
});

// ── safeSpawnFile — durable-file + savepoint recovery (RI-004 reap fix) ──
// Ticket T-20260608-269: the §13.6 ping reaped ~50% because safeSpawnSync buffers
// stdout in RAM and only surfaces it at child exit — an outer-harness reap of the
// dispatcher lost a result `claude` had already produced. safeSpawnFile writes the
// child's stdout to a DURABLE FILE and drops a savepoint sentinel, so the result is
// recoverable independent of how the parent dies.

// (1) Happy path: the out-file holds the real output AND a savepoint sentinel lands.
h.test("safeSpawnFile writes a durable out-file + savepoint sentinel on a clean run", () => {
  const fx = sealedDir({}, "ssfile-ok");
  try {
    const outFile = fx.file("out.txt");
    const r = safeSpawnFile("git", ["rev-parse", "--is-inside-work-tree"], { cwd: PROJECT_ROOT, outFile });
    assert.ok(r.ok, `expected ok, got ${JSON.stringify(r)}`);
    assert.strictEqual(r.recovered, false, "first run is NOT a recovery");
    // The durable file holds the output (not an in-memory buffer that dies with the parent).
    assert.ok(fs.existsSync(outFile), "out-file must exist on disk");
    assert.match(fs.readFileSync(outFile, "utf8").trim(), /^true$/, "out-file holds the real stdout");
    assert.match(r.stdout.trim(), /^true$/, "returned stdout mirrors the file");
    // The savepoint sentinel proves a recoverable result for a later retry.
    assert.ok(fs.existsSync(outFile + ".done"), "savepoint sentinel must exist");
    const sv = JSON.parse(fs.readFileSync(outFile + ".done", "utf8"));
    assert.strictEqual(sv.ok, true, "sentinel marks a clean run");
  } finally {
    fx.cleanup();
  }
});

// (2) THE load-bearing reap-resistance assertion: a second call with a valid
// savepoint RECOVERS the prior result WITHOUT re-spawning — so a bounded retry after
// an outer reap returns the real bytes the reaped attempt produced, with no re-spend.
h.test("safeSpawnFile RECOVERS from a savepoint without re-spawning (no re-spend)", () => {
  const fx = sealedDir({}, "ssfile-recover");
  try {
    const outFile = fx.file("out.txt");
    // Plant a savepoint as if a PRIOR attempt finished cleanly but the parent was then
    // reaped before it could surface the result. Point the tool-id at a NON-EXISTENT
    // exe via the path seam: if recovery did NOT happen, the re-spawn would FAIL — so a
    // successful, correct result PROVES the savepoint path was taken (no spawn at all).
    fs.writeFileSync(outFile, "RECOVERED-PAYLOAD\n", "utf8");
    fs.writeFileSync(outFile + ".done", JSON.stringify({ ok: true, exitCode: 0, bytes: 18, durationMs: 999 }) + "\n", "utf8");
    const r = safeSpawnFile("git", ["rev-parse", "--is-inside-work-tree"], {
      cwd: PROJECT_ROOT,
      outFile,
      // Force resolution to a bogus exe: a real spawn would reap; recovery must win first.
      resolve: { path: path.join(PROJECT_ROOT, "does-not-exist-ssfile.exe") },
    });
    assert.ok(r.ok, `recovery must succeed, got ${JSON.stringify(r)}`);
    assert.strictEqual(r.recovered, true, "must report recovered:true (savepoint path)");
    assert.match(r.stdout, /RECOVERED-PAYLOAD/, "recovered the prior attempt's real bytes");
  } finally {
    fx.cleanup();
  }
});

// (3) A reaped run leaves NO trustworthy savepoint (so a retry re-spawns, never
// recovers a phantom). Plant a zero-byte out-file with NO sentinel → a fresh spawn
// runs and a real result replaces it.
h.test("safeSpawnFile does NOT recover from a missing/zero-byte savepoint", () => {
  const fx = sealedDir({}, "ssfile-noreap");
  try {
    const outFile = fx.file("out.txt");
    fs.writeFileSync(outFile, "", "utf8"); // empty, NO .done sentinel
    const r = safeSpawnFile("git", ["rev-parse", "--is-inside-work-tree"], { cwd: PROJECT_ROOT, outFile });
    // No valid savepoint → it must actually re-run (recovered:false) and succeed.
    assert.strictEqual(r.recovered, false, "must NOT recover without a sentinel");
    assert.ok(r.ok, `re-spawn should succeed, got ${JSON.stringify(r)}`);
    assert.match(r.stdout.trim(), /^true$/, "real re-run output");
  } finally {
    fx.cleanup();
  }
});

// (4) Fail-closed: safeSpawnFile without an outFile refuses (no spawn).
h.failClosed("safeSpawnFile fails closed without an outFile (NO spawn)", () => {
  const r = safeSpawnFile("git", ["rev-parse", "--is-inside-work-tree"], { cwd: PROJECT_ROOT });
  return { ok: r.ok === true || r.reason !== "missing_out_file" };
});

// (5) Fail-closed: an arg violation is refused BEFORE any spawn or file write.
h.failClosed("safeSpawnFile fails closed on an arg violation (NO spawn, NO file)", () => {
  const fx = sealedDir({}, "ssfile-argviol");
  try {
    const outFile = fx.file("out.txt");
    const r = safeSpawnFile("codex", ["exec", "--evil-flag", "-"], { outFile });
    const wrong = r.ok === true || r.reason !== "arg_policy_violation" || fs.existsSync(outFile);
    return { ok: wrong };
  } finally {
    fx.cleanup();
  }
});

h.done();
