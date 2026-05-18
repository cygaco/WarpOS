#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * tests/regression/SP-20260518-007/check-ac-coverage.test.js
 *
 * Covers ACs from S-3.1:
 *   - AC-3.1.1: analyzeFile recognizes the three states (executable / not_applicable / missing)
 *   - AC-3.1.2: --json output is a JSON array (parsed cleanly)
 *   - AC-3.1.3: skill body follows /check:* conventions (frontmatter + sections)
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const REPO = path.resolve(__dirname, "..", "..", "..");
const checkSkill = require(
  path.join(REPO, "scripts", "sprint", "check-ac-coverage.js"),
);

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

// ── AC-3.1.1 (analyzeFile state recognition) ───────────────────────
function test_ac_coverage_recognizes_three_linkage_states() {
  const md = [
    "- **AC-1.1** — example.",
    "  verified_by: tests/regression/SP-X/foo.test.js::case_one",
    "- **AC-1.2** — example.",
    "  verified_by: not_applicable — research sprint, no executable repro",
    "- **AC-1.3** — example.",
    "- **AC-1.4** — example.",
    "  verified_by: tests/regression/{{sprint_id}}/<test-file>.test.js::<test-name>",
    "- **AC-1.5** — empty not_applicable justification.",
    "  verified_by: not_applicable —",
    "",
  ].join("\n");
  const result = checkSkill.analyzeFile(md);
  // Expect: 1 executable, 1 not_applicable, 3 missing (1.3, 1.4 placeholder, 1.5 empty).
  const exec = result.filter((d) => d.state === "executable").length;
  const na = result.filter((d) => d.state === "not_applicable").length;
  const missing = result.filter((d) => d.state === "missing").length;
  if (exec !== 1 || na !== 1 || missing !== 3) {
    return fail(
      "test_ac_coverage_recognizes_three_linkage_states",
      `expected exec=1 na=1 missing=3; got exec=${exec} na=${na} missing=${missing} ${JSON.stringify(result)}`,
    );
  }
  ok("test_ac_coverage_recognizes_three_linkage_states");
}

// ── AC-3.1.2 (--json output shape) ─────────────────────────────────
function test_check_ac_coverage_json_output_shape() {
  const r = spawnSync(
    process.execPath,
    [
      path.join(REPO, "scripts", "sprint", "check-ac-coverage.js"),
      "--sprint",
      "SP-20260518-007",
      "--json",
    ],
    { encoding: "utf8", cwd: REPO },
  );
  let parsed;
  try {
    parsed = JSON.parse(r.stdout);
  } catch (err) {
    return fail(
      "test_check_ac_coverage_json_output_shape",
      `JSON parse failed: ${err.message}; stdout=${r.stdout.slice(0, 200)}`,
    );
  }
  if (!Array.isArray(parsed)) {
    return fail(
      "test_check_ac_coverage_json_output_shape",
      `expected array, got ${typeof parsed}`,
    );
  }
  if (parsed.length === 0) {
    return fail(
      "test_check_ac_coverage_json_output_shape",
      `expected non-empty array for valid sprint`,
    );
  }
  const r0 = parsed[0];
  const required = [
    "sprint_id",
    "gate_applicable",
    "total_acs",
    "executable",
    "not_applicable",
    "missing",
    "details",
  ];
  for (const k of required) {
    if (!(k in r0)) {
      return fail(
        "test_check_ac_coverage_json_output_shape",
        `missing key ${k} in JSON: ${JSON.stringify(r0).slice(0, 200)}`,
      );
    }
  }
  ok("test_check_ac_coverage_json_output_shape");
}

// ── AC-3.1.1 / prose form ──────────────────────────────────────────
function test_check_ac_coverage_emits_prose_and_correct_exit_code() {
  const r = spawnSync(
    process.execPath,
    [
      path.join(REPO, "scripts", "sprint", "check-ac-coverage.js"),
      "--sprint",
      "SP-20260518-007",
    ],
    { encoding: "utf8", cwd: REPO },
  );
  if (!/ac-coverage — sprint SP-20260518-007/.test(r.stdout)) {
    return fail(
      "test_check_ac_coverage_emits_prose_and_correct_exit_code",
      `prose output missing summary line: ${r.stdout.slice(0, 200)}`,
    );
  }
  if (r.status !== 0) {
    return fail(
      "test_check_ac_coverage_emits_prose_and_correct_exit_code",
      `exit ${r.status} expected 0 (Sprint A's PC has no goal_verification — gate not applicable; informational)`,
    );
  }
  ok("test_check_ac_coverage_emits_prose_and_correct_exit_code");
}

// ── AC-3.1.3 (skill body conventions) ──────────────────────────────
function test_check_ac_coverage_skill_body_conventions() {
  const body = fs.readFileSync(
    path.join(REPO, ".claude", "commands", "check", "ac-coverage.md"),
    "utf8",
  );
  if (!/user-invocable:\s*true/.test(body)) {
    return fail(
      "test_check_ac_coverage_skill_body_conventions",
      "missing user-invocable: true",
    );
  }
  if (!/## Input/.test(body)) {
    return fail(
      "test_check_ac_coverage_skill_body_conventions",
      "missing ## Input section",
    );
  }
  if (!/## Output/.test(body)) {
    return fail(
      "test_check_ac_coverage_skill_body_conventions",
      "missing ## Output section",
    );
  }
  if (!/## Implementation/.test(body)) {
    return fail(
      "test_check_ac_coverage_skill_body_conventions",
      "missing ## Implementation section",
    );
  }
  if (/--kill-orphans/.test(body)) {
    return fail(
      "test_check_ac_coverage_skill_body_conventions",
      "should NOT mention --kill-orphans (that flag is for /check:node-procs which also rejects it in v1; ac-coverage is unrelated). Verify cross-contamination.",
    );
  }
  ok("test_check_ac_coverage_skill_body_conventions");
}

test_ac_coverage_recognizes_three_linkage_states();
test_check_ac_coverage_json_output_shape();
test_check_ac_coverage_emits_prose_and_correct_exit_code();
test_check_ac_coverage_skill_body_conventions();

process.stdout.write(`\n# ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
