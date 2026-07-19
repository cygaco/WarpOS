"use strict";
/**
 * cwd-sandbox-invariants.test.js — G2.5 (SP-20260718-004 Phase 2). The standing guard for the
 * per-provider cwd/sandbox behavior documented in cwd-sandbox-behavior.md. RATIFIED-PLAN Phase-2 requires
 * these tests to exist BEFORE any "neutral cwd" change (changing cwd moves codex's sandbox root). No cwd
 * change was made this sprint; this test locks the CURRENT invariants so a future change can't silently
 * regress them. Source-level assertions (the invariants live in the dispatch bridges' spawn setup).
 */
const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const CLAUDE = fs.readFileSync(path.join(__dirname, "..", "dispatch-claude.js"), "utf8");
const AGENTBR = fs.readFileSync(path.join(__dirname, "..", "dispatch-agent.js"), "utf8");

test("Invariant 1 (builder write-root isolation): dispatch-claude refuses a build-chain role without a worktree", () => {
  // The isolation gate: a build-chain role with neither -w nor a valid worktree is refused (never edits canonical).
  assert.match(
    CLAUDE,
    /isBuildChainRole\(role\)\s*&&\s*!passW\s*&&\s*!worktreeValid/,
    "the build-chain worktree-isolation gate must be present (a builder never edits canonical)",
  );
});

test("Invariant 2 (canonical telemetry env, ED-016): the builder child env forces canonical CLAUDE_PROJECT_DIR", () => {
  // Even when cwd is a worktree, the child env carries canonical CLAUDE_PROJECT_DIR so telemetry resolves canonical.
  assert.match(
    CLAUDE,
    /CLAUDE_PROJECT_DIR:\s*AGENT_ROOT/,
    "the child env must force CLAUDE_PROJECT_DIR = AGENT_ROOT (canonical) even in a worktree cwd",
  );
});

test("Invariant 3 (no global neutral-cwd override): the dispatch bridges do NOT process.chdir to a neutral dir", () => {
  // A global cwd override would move codex's sandbox root + swap which AGENTS.md it slurps. The only cwd move
  // allowed is the per-builder isolated worktree (passed to spawnSync as `cwd`, not a process-wide chdir).
  assert.ok(!/process\.chdir\s*\(/.test(CLAUDE), "dispatch-claude must not process.chdir (no global cwd override)");
  assert.ok(!/process\.chdir\s*\(/.test(AGENTBR), "dispatch-agent must not process.chdir (codex sandbox-root safety)");
});

test("Invariant 4 (builder cwd = the validated worktree): dispatch-claude runs the builder in its worktree write-root", () => {
  // runCwd resolves to the validated worktree for a builder (the write root), falling back to canonical only
  // when no worktree isolation is used. The spawn passes cwd: runCwd.
  assert.match(CLAUDE, /runCwd\s*=\s*worktreeValid\s*&&\s*worktreeReal\s*\?\s*worktreeReal/, "runCwd must be the validated worktree for a builder");
  assert.match(CLAUDE, /cwd:\s*runCwd/, "the builder spawn must use cwd: runCwd (its isolated worktree write-root)");
});
