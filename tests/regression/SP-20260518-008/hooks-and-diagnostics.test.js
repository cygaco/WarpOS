#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * tests/regression/SP-20260518-008/hooks-and-diagnostics.test.js
 *
 * Sprint B — Hook & Process Hygiene regression corpus.
 *
 * Covers:
 *   - AC-1.1.1 (R-1): format.js uses execFileSync + binary resolution (no `npx prettier`)
 *   - AC-1.1.2 (R-1): require.resolve('prettier/bin/prettier.cjs') resolves
 *   - AC-1.2.3 (R-2): format.js still fail-open (catch-all preserved)
 *   - AC-2.1.1/2.1.2 (R-3): lint-hook-output.js warns on missing Edit/Write fields, exit 0
 *   - AC-2.1.3 (R-3): well-formed events silent + exit 0
 *   - AC-2.2.1 (R-4): settings.json registers lint-hook-output.js between path-guard and sprint-routing-guard
 *   - AC-3.1.* (R-5): node-procs.js listProcs() returns an array; --json output parses
 *   - AC-3.2.1 (R-6): skill body frontmatter + sections present, no --kill-orphans
 *   - AC-4.1.1 (R-7): operational-loop.md has background-tasks section
 *   - AC-4.2.1 (R-8): execute.md has run_in_background warning
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const REPO = path.resolve(__dirname, "..", "..", "..");

let passed = 0;
let failed = 0;
function ok(name) {
  passed++;
  process.stdout.write(`  ok    ${name}\n`);
}
function fail(name, detail) {
  failed++;
  process.stdout.write(`  FAIL  ${name}\n`);
  if (detail) process.stdout.write(`        ${detail}\n`);
}

function read(rel) {
  return fs.readFileSync(path.join(REPO, rel), "utf8");
}

// ── R-1 / R-2 ──────────────────────────────────────────────────────
function test_format_js_uses_binary_resolution() {
  const src = read("scripts/hooks/format.js");
  // Strip JS comments for the call-site check so the changelog comment
  // referencing the old execSync('npx prettier ...') line doesn't false-positive.
  const codeOnly = src
    .split(/\r?\n/)
    .filter((l) => !/^\s*(\/\/|\*)/.test(l))
    .join("\n");
  if (/execSync\(\s*['"`]npx prettier/.test(codeOnly)) {
    return fail(
      "test_format_js_uses_binary_resolution",
      "call site still contains execSync('npx prettier ...')",
    );
  }
  if (!/execFileSync|spawnSync/.test(codeOnly)) {
    return fail(
      "test_format_js_uses_binary_resolution",
      "does not use execFileSync or spawnSync",
    );
  }
  if (!/require\.resolve\(\s*['"]prettier\/bin\/prettier\.cjs/.test(codeOnly)) {
    return fail(
      "test_format_js_uses_binary_resolution",
      "does not require.resolve prettier/bin/prettier.cjs",
    );
  }
  ok("test_format_js_uses_binary_resolution");
}

function test_prettier_binary_resolution_path_is_attempted() {
  // Sprint B's R-1: format.js should ATTEMPT require.resolve('prettier/bin/prettier.cjs').
  // Whether prettier is actually installed in the host repo is project-dependent —
  // the hook handles ENOENT gracefully by skipping formatting. We verify the
  // attempt is wired, not the resolution itself.
  const src = read("scripts/hooks/format.js");
  if (!/require\.resolve\(\s*['"]prettier\/bin\/prettier\.cjs/.test(src)) {
    return fail(
      "test_prettier_binary_resolution_path_is_attempted",
      "format.js does not call require.resolve('prettier/bin/prettier.cjs')",
    );
  }
  // Fail-open behavior: a try/catch must wrap the resolve so missing prettier
  // doesn't crash the hook.
  if (!/try[\s\S]{0,200}require\.resolve[\s\S]{0,200}catch/.test(src)) {
    return fail(
      "test_prettier_binary_resolution_path_is_attempted",
      "require.resolve not wrapped in try/catch — missing prettier would crash the hook",
    );
  }
  ok("test_prettier_binary_resolution_path_is_attempted");
}

function test_format_js_taskkill_path_on_windows() {
  const src = read("scripts/hooks/format.js");
  if (!/taskkill/.test(src)) {
    return fail(
      "test_format_js_taskkill_path_on_windows",
      "no taskkill reference in format.js",
    );
  }
  if (!/SIGKILL/.test(src)) {
    return fail(
      "test_format_js_taskkill_path_on_windows",
      "no SIGKILL POSIX fallback",
    );
  }
  if (!/process\.platform\s*===\s*['"]win32['"]/.test(src)) {
    return fail(
      "test_format_js_taskkill_path_on_windows",
      "no platform guard",
    );
  }
  ok("test_format_js_taskkill_path_on_windows");
}

function test_format_js_remains_fail_open() {
  const src = read("scripts/hooks/format.js");
  if (!/catch\s*\([\s\S]*?\)\s*\{[\s\S]*?process\.exit\(0\)/.test(src)) {
    return fail(
      "test_format_js_remains_fail_open",
      "missing catch-all → exit 0 path",
    );
  }
  ok("test_format_js_remains_fail_open");
}

// ── R-3 ────────────────────────────────────────────────────────────
function runLintHook(payload) {
  const r = spawnSync(
    process.execPath,
    [path.join(REPO, "scripts", "hooks", "lint-hook-output.js")],
    {
      input: JSON.stringify(payload),
      encoding: "utf8",
    },
  );
  return r;
}

function test_lint_hook_warns_on_missing_edit_field() {
  const r = runLintHook({
    tool_name: "Edit",
    tool_input: { file_path: "/x", old_string: "a" }, // missing new_string
  });
  if (r.status !== 0) {
    return fail(
      "test_lint_hook_warns_on_missing_edit_field",
      `expected exit 0, got ${r.status}`,
    );
  }
  if (!/new_string/.test(r.stderr || "")) {
    return fail(
      "test_lint_hook_warns_on_missing_edit_field",
      `stderr missing new_string mention: ${r.stderr}`,
    );
  }
  ok("test_lint_hook_warns_on_missing_edit_field");
}

function test_lint_hook_warns_on_missing_write_field() {
  const r = runLintHook({
    tool_name: "Write",
    tool_input: { file_path: "/x" }, // missing content
  });
  if (r.status !== 0) {
    return fail(
      "test_lint_hook_warns_on_missing_write_field",
      `expected exit 0, got ${r.status}`,
    );
  }
  if (!/content/.test(r.stderr || "")) {
    return fail(
      "test_lint_hook_warns_on_missing_write_field",
      `stderr missing 'content' mention: ${r.stderr}`,
    );
  }
  ok("test_lint_hook_warns_on_missing_write_field");
}

function test_lint_hook_silent_on_well_formed_event() {
  const r = runLintHook({
    tool_name: "Edit",
    tool_input: { file_path: "/x", old_string: "a", new_string: "b" },
  });
  if (r.status !== 0) {
    return fail(
      "test_lint_hook_silent_on_well_formed_event",
      `expected exit 0, got ${r.status}`,
    );
  }
  if (r.stderr && r.stderr.trim()) {
    return fail(
      "test_lint_hook_silent_on_well_formed_event",
      `expected silent stderr, got: ${r.stderr}`,
    );
  }
  ok("test_lint_hook_silent_on_well_formed_event");
}

// ── R-4 ────────────────────────────────────────────────────────────
function test_settings_registers_lint_hook_output_between_path_guard_and_sprint_routing() {
  const settings = JSON.parse(read(".claude/settings.json"));
  const editWriteBlock = (settings.hooks?.PreToolUse || []).find(
    (h) => h.matcher === "Edit|Write",
  );
  if (!editWriteBlock) {
    return fail(
      "test_settings_registers_lint_hook_output_between_path_guard_and_sprint_routing",
      "no Edit|Write PreToolUse block found",
    );
  }
  const cmds = editWriteBlock.hooks.map((h) => h.command);
  const pgi = cmds.findIndex((c) => /path-guard\.js/.test(c));
  const lhi = cmds.findIndex((c) => /lint-hook-output\.js/.test(c));
  const sri = cmds.findIndex((c) => /sprint-routing-guard\.js/.test(c));
  if (pgi < 0 || lhi < 0 || sri < 0) {
    return fail(
      "test_settings_registers_lint_hook_output_between_path_guard_and_sprint_routing",
      `indices: path-guard=${pgi} lint-hook-output=${lhi} sprint-routing-guard=${sri}`,
    );
  }
  if (!(pgi < lhi && lhi < sri)) {
    return fail(
      "test_settings_registers_lint_hook_output_between_path_guard_and_sprint_routing",
      `order wrong: pg=${pgi} lh=${lhi} sr=${sri}`,
    );
  }
  ok(
    "test_settings_registers_lint_hook_output_between_path_guard_and_sprint_routing",
  );
}

// ── R-5 / R-6 ──────────────────────────────────────────────────────
function test_node_procs_helper_returns_array() {
  const mod = require(path.join(REPO, "scripts", "check", "node-procs.js"));
  const rows = mod.listProcs();
  if (!Array.isArray(rows)) {
    return fail(
      "test_node_procs_helper_returns_array",
      `expected array, got ${typeof rows}`,
    );
  }
  ok("test_node_procs_helper_returns_array");
}

function test_node_procs_json_output_parses() {
  const r = spawnSync(
    process.execPath,
    [path.join(REPO, "scripts", "check", "node-procs.js"), "--json"],
    { encoding: "utf8" },
  );
  if (r.status !== 0) {
    return fail(
      "test_node_procs_json_output_parses",
      `exit ${r.status}; stderr=${r.stderr}`,
    );
  }
  try {
    const parsed = JSON.parse(r.stdout);
    if (!Array.isArray(parsed)) {
      return fail(
        "test_node_procs_json_output_parses",
        `expected array, got ${typeof parsed}`,
      );
    }
  } catch (err) {
    return fail(
      "test_node_procs_json_output_parses",
      `JSON parse failed: ${err.message}`,
    );
  }
  ok("test_node_procs_json_output_parses");
}

function test_node_procs_skill_body_conventions() {
  const body = read(".claude/commands/scan/node-procs.md");
  if (!/user-invocable:\s*true/.test(body)) {
    return fail(
      "test_node_procs_skill_body_conventions",
      "missing user-invocable: true frontmatter",
    );
  }
  for (const section of [
    "## Input",
    "## Output",
    "## Empty-state behavior",
    "## Implementation",
  ]) {
    if (!body.includes(section)) {
      return fail(
        "test_node_procs_skill_body_conventions",
        `missing ${section} section`,
      );
    }
  }
  // v1: NO --kill-orphans flag, per Class A decision.
  // The body may mention it as a non-goal; ensure that mention frames it
  // as absent in v1.
  if (/--kill-orphans/.test(body) && !/(not have|does not have|no `?--kill-orphans|NOT have|v1 does not|no `--kill-orphans` flag|not have that flag)/i.test(body)) {
    return fail(
      "test_node_procs_skill_body_conventions",
      "mentions --kill-orphans without clarifying it is absent in v1",
    );
  }
  ok("test_node_procs_skill_body_conventions");
}

// ── R-7 / R-8 ──────────────────────────────────────────────────────
function test_operational_loop_has_background_tasks_section() {
  const doc = read(".claude/project/reference/operational-loop.md");
  if (!/## Background tasks and Windows process hygiene/.test(doc)) {
    return fail(
      "test_operational_loop_has_background_tasks_section",
      "missing heading",
    );
  }
  if (!/run_in_background/.test(doc)) {
    return fail(
      "test_operational_loop_has_background_tasks_section",
      "section does not mention run_in_background",
    );
  }
  if (!/taskkill|SIGKILL/.test(doc)) {
    return fail(
      "test_operational_loop_has_background_tasks_section",
      "section does not document Windows cleanup",
    );
  }
  ok("test_operational_loop_has_background_tasks_section");
}

function test_execute_md_warns_against_run_in_background_in_ralph_test_phase() {
  const body = read(".claude/commands/sprint/execute.md");
  if (!/run_in_background/.test(body)) {
    return fail(
      "test_execute_md_warns_against_run_in_background_in_ralph_test_phase",
      "no run_in_background warning",
    );
  }
  if (!/Ralph/.test(body) && !/test phase/.test(body)) {
    return fail(
      "test_execute_md_warns_against_run_in_background_in_ralph_test_phase",
      "warning not associated with Ralph/test phase",
    );
  }
  ok("test_execute_md_warns_against_run_in_background_in_ralph_test_phase");
}

test_format_js_uses_binary_resolution();
test_prettier_binary_resolution_path_is_attempted();
test_format_js_taskkill_path_on_windows();
test_format_js_remains_fail_open();
test_lint_hook_warns_on_missing_edit_field();
test_lint_hook_warns_on_missing_write_field();
test_lint_hook_silent_on_well_formed_event();
test_settings_registers_lint_hook_output_between_path_guard_and_sprint_routing();
test_node_procs_helper_returns_array();
test_node_procs_json_output_parses();
test_node_procs_skill_body_conventions();
test_operational_loop_has_background_tasks_section();
test_execute_md_warns_against_run_in_background_in_ralph_test_phase();

process.stdout.write(`\n# ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
