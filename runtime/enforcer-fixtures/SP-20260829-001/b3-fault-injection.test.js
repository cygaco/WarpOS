"use strict";
/**
 * b3-fault-injection.test.js (SP-20260829-001 Bundle B3, ED-379-class)
 *
 * Fault injection through the REAL hook harness: each test spawns the actual
 * hook file as a child process (exactly as the Claude Code hook runner would
 * invoke it — stdin JSON payload in, exit code decides allow/block), forces
 * ONE named parse/read/git dependency to fail on an otherwise-VALID event,
 * and asserts the resulting exit code lands on the restrictive side of that
 * gate's own decision.
 *
 * NO-OP=>FAIL GUARD: every fault test has a paired CONTROL run (same hook,
 * a clean/valid input that should reach the SAME code region without the
 * injected fault) plus an assertion that the fault-path stderr contains the
 * specific marker text this bundle's fix writes for THAT failure — proving
 * the fault actually fired and was caught by the intended branch, not that
 * the hook coincidentally exits non-zero for an unrelated reason.
 */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const REPO = path.resolve(__dirname, "..", "..", "..");
const HOOKS = path.join(REPO, "scripts", "hooks");

function run(hookRelPath, input, opts = {}) {
  const cwd = opts.cwd || REPO;
  // CLAUDE_PROJECT_DIR is inherited from the ambient session env, which in
  // this dispatched session points at the MAIN repo root rather than this
  // worktree (the same misdirected-env-var class noted in commit 09232d15) —
  // never let it leak through un-overridden, or a "temp isolated project"
  // fixture silently reads the real worktree's store/manifest instead.
  const res = spawnSync(process.execPath, [path.join(HOOKS, hookRelPath)], {
    input: input == null ? "" : input,
    cwd,
    env: { ...process.env, CLAUDE_PROJECT_DIR: cwd, ...(opts.env || {}) },
    encoding: "utf8",
  });
  return { code: res.status, stdout: res.stdout || "", stderr: res.stderr || "" };
}

function mkTempProject() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "b3-fixture-"));
  fs.mkdirSync(path.join(dir, ".claude", "agents"), { recursive: true });
  return dir;
}

// gate-check.js's identifyFeature() only resolves a non-null feature when
// the name appears in getFeatureIds() (sourced from .claude/manifest.json).
// This repo's OWN manifest currently declares zero build features, so
// gate-check.js exits 0 (unknown feature, allow) before ever reaching
// loadStore() when run against the real repo — the loadStore() fault can
// only be reached by giving the child process an isolated project with a
// declared feature.
function mkTempProjectWithFeature(featureId) {
  const dir = mkTempProject();
  fs.writeFileSync(
    path.join(dir, ".claude", "manifest.json"),
    JSON.stringify({ features: [{ id: featureId, dependencies: [] }] }),
    "utf8",
  );
  return dir;
}

// ---------------------------------------------------------------------------
// secret-guard.js:94 — payload parse failure
// ---------------------------------------------------------------------------
test("secret-guard.js — malformed payload fails closed (block)", () => {
  const control = run("secret-guard.js", JSON.stringify({
    tool_input: { file_path: "src/x.js", content: "const x = 1;" },
  }));
  assert.equal(control.code, 0, "control (clean, no secret) must allow");

  const faulted = run("secret-guard.js", "{not valid json");
  assert.equal(faulted.code, 2, "unparseable payload must fail closed (exit 2)");
  assert.match(faulted.stderr, /could not parse\/read the tool-call payload/, "fault marker must be present — proves the JSON.parse catch fired, not a coincidental exit 2");
});

// ---------------------------------------------------------------------------
// gate-check.js:181 — outer payload-parse failure
// ---------------------------------------------------------------------------
test("gate-check.js:181 — malformed payload fails closed (block)", () => {
  const control = run("gate-check.js", JSON.stringify({
    tool_input: { prompt: "just a note, not a builder dispatch" },
  }));
  assert.equal(control.code, 0, "control (non-builder-dispatch prompt) must allow");

  const faulted = run("gate-check.js", "{not valid json");
  assert.equal(faulted.code, 2, "unparseable payload must fail closed (exit 2)");
  assert.match(faulted.stderr, /could not evaluate the dependency gate/, "fault marker must be present");
});

// ---------------------------------------------------------------------------
// gate-check.js:48-52 (loadStore) — store present-but-corrupt
// ---------------------------------------------------------------------------
test("gate-check.js:48-52 — corrupt store.json fails closed (block), absent store still allows", () => {
  const tmp = mkTempProjectWithFeature("foo");
  try {
    const event = JSON.stringify({
      tool_input: { prompt: "feature: foo, build-foo builder dispatch" },
    });

    // Control A: store absent entirely — legitimate skip (ENOENT partition
    // in loadStore() must still return null -> caller's existing WARNING
    // path -> allow). Proves the ENOENT branch was NOT collapsed into the
    // fail-closed branch by this repair.
    const absentStore = run("gate-check.js", event, { cwd: tmp });
    assert.equal(absentStore.code, 0, "absent store.json must still allow (ENOENT is a legitimate skip, not a failure)");

    // Fault: store PRESENT but corrupt JSON.
    fs.writeFileSync(path.join(tmp, ".claude", "agents", "store.json"), "{not json", "utf8");
    const corrupt = run("gate-check.js", event, { cwd: tmp });
    assert.equal(corrupt.code, 2, "present-but-corrupt store.json must fail closed (exit 2)");
    assert.match(corrupt.stderr, /could not evaluate the dependency gate/, "fault marker must be present — proves the rethrown parse error reached the outer catch, not a coincidental exit 2");
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// worktree-preflight.js:160 — payload parse failure
// ---------------------------------------------------------------------------
test("worktree-preflight.js — malformed payload fails closed (block)", () => {
  const control = run("worktree-preflight.js", JSON.stringify({
    tool_input: { prompt: "not a builder dispatch at all" },
  }));
  assert.equal(control.code, 0, "control (non-builder-dispatch prompt) must allow");

  const faulted = run("worktree-preflight.js", "{not valid json");
  assert.equal(faulted.code, 2, "unparseable payload must fail closed (exit 2)");
  assert.match(faulted.stderr, /could not complete the infra preflight/, "fault marker must be present");
});

// ---------------------------------------------------------------------------
// dependency-admission-guard.js:33 — payload parse failure
// ---------------------------------------------------------------------------
test("dependency-admission-guard.js — malformed payload fails closed (block)", () => {
  const control = run("dependency-admission-guard.js", JSON.stringify({
    tool_name: "Edit",
    tool_input: { file_path: "/repo/README.md", old_string: "a", new_string: "b" },
  }));
  assert.equal(control.code, 0, "control (non-package.json edit) must allow");

  const faulted = run("dependency-admission-guard.js", "{not valid json");
  assert.equal(faulted.code, 2, "unparseable payload must fail closed (exit 2)");
  assert.match(faulted.stdout, /failing closed/, "fault marker must be present in the block decision JSON");
});

// ---------------------------------------------------------------------------
// ownership-guard.js:66 — store present-but-corrupt
// ---------------------------------------------------------------------------
test("ownership-guard.js:66 — corrupt store.json fails closed (block), absent store still allows", () => {
  const tmp = mkTempProject();
  try {
    fs.mkdirSync(path.join(tmp, "src"), { recursive: true });
    const filePath = path.join(tmp, "src", "owned.js");
    const event = JSON.stringify({ tool_input: { file_path: filePath } });

    // Control: store absent entirely -> "No store = can't enforce, allow"
    // (unchanged legitimate skip, distinct from the corrupt-store site).
    const absentStore = run("ownership-guard.js", event, { cwd: tmp });
    assert.equal(absentStore.code, 0, "absent store.json must still allow (unchanged, separate skip path)");

    // Fault: store PRESENT but corrupt JSON.
    fs.writeFileSync(path.join(tmp, ".claude", "agents", "store.json"), "{not json", "utf8");
    const corrupt = run("ownership-guard.js", event, { cwd: tmp });
    assert.equal(corrupt.code, 2, "present-but-corrupt store.json must fail closed (exit 2)");
    assert.match(corrupt.stderr, /could not read\/parse store\.json/, "fault marker must be present");
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// retro-presence-check.js:50 — git runner failure, enforce vs advisory
// ---------------------------------------------------------------------------
test("retro-presence-check.js:50 — git failure blocks under --enforce, skips under advisory", () => {
  const badProject = path.join(os.tmpdir(), "b3-retro-nonexistent-" + Date.now());
  // CLAUDE_PROJECT_DIR points at a directory that does not exist, so
  // `execSync("git branch --show-current", { cwd: badProject })` throws
  // ENOENT on the cwd itself — a real runner failure, not an absent-input
  // no-op.
  const advisory = run("retro-presence-check.js", "{}", {
    env: { CLAUDE_PROJECT_DIR: badProject },
  });
  assert.equal(advisory.code, 0, "default advisory mode must still skip (never blocks by design) even on a runner failure");

  const enforced = run("retro-presence-check.js", "{}", {
    env: { CLAUDE_PROJECT_DIR: badProject, RETRO_ENFORCE: "1" },
  });
  assert.equal(enforced.code, 2, "RETRO_ENFORCE=1 + git runner failure must fail closed (exit 2)");
  assert.match(enforced.stderr, /could not determine the current branch/, "fault marker must be present — proves the execSync catch fired under enforce, not a coincidental exit 2");
});

// ---------------------------------------------------------------------------
// version-bump-guard.js:101 — payload parse failure
// ---------------------------------------------------------------------------
test("version-bump-guard.js:101 — malformed payload fails closed per policy mode (default warn)", () => {
  const control = run("version-bump-guard.js", JSON.stringify({
    tool_name: "Bash",
    tool_input: { command: "echo hello" },
  }));
  assert.equal(control.code, 0, "control (non-git-commit command) must allow");

  // Default policy (no policy file present in this repo, or mode!=block) ->
  // effectiveMode "warn" -> failClosed() still exits 0, but MUST emit the
  // warning marker (proving the fault path fired) rather than silently
  // returning 0 with zero signal, which is what the pre-repair code did.
  const faulted = run("version-bump-guard.js", "{not valid json");
  assert.match(faulted.stderr, /could not parse the tool-call payload/, "fault marker must be present even when effective policy mode is warn — proves the catch fired and reasoned about policy mode rather than silently exiting 0");
});

// ---------------------------------------------------------------------------
// version-bump-guard.js:136 — version.json read failure
// ---------------------------------------------------------------------------
test("version-bump-guard.js:136 — unreadable version.json fails closed per policy mode", () => {
  const tmp = mkTempProject();
  try {
    fs.mkdirSync(path.join(tmp, ".warpos"), { recursive: true });
    // version.json intentionally absent/corrupt in this temp project.
    fs.writeFileSync(path.join(tmp, "version.json"), "{not json", "utf8");
    const event = JSON.stringify({
      tool_name: "Bash",
      tool_input: { command: "git commit -m x" },
    });
    const faulted = run("version-bump-guard.js", event, {
      cwd: tmp,
      env: { CLAUDE_PROJECT_DIR: tmp },
    });
    assert.match(faulted.stderr, /could not read\/parse version\.json/, "fault marker must be present — proves the version.json catch fired");
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// version-bump-guard.js:160 — git diff exec failure (git unavailable)
// ---------------------------------------------------------------------------
test("version-bump-guard.js:160 — git diff exec failure fails closed per policy mode", () => {
  // Real project state: version.json's current version already has a minted
  // capsule under framework/releases/<version>/ (verified: this repo's own
  // version.json + framework/releases/ satisfy the capsuleExists branch), so
  // execution reaches the git-diff step. Strip PATH in the child so its own
  // internal `execSync("git diff --cached --name-only")` cannot find the git
  // binary and throws ENOENT.
  const event = JSON.stringify({
    tool_name: "Bash",
    tool_input: { command: "git commit -m x" },
  });
  const control = run("version-bump-guard.js", JSON.stringify({
    tool_name: "Bash",
    tool_input: { command: "echo not a commit" },
  }));
  assert.equal(control.code, 0, "control (non-git-commit command) must allow");

  const faulted = run("version-bump-guard.js", event, {
    env: { PATH: "", Path: "" },
  });
  assert.match(faulted.stderr, /could not run "git diff --cached --name-only"/, "fault marker must be present — proves the execSync catch fired, not a coincidental outcome");
});
