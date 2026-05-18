#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * tests/regression/SP-20260518-007/linters-run-discovery.test.js
 *
 * Covers ACs:
 *   - AC-4.1.1: /linters:run --list includes sprint-test-plan-honors-registry-primary
 *   - AC-4.1.2: tests/regression/<SP-id>/ files NOT picked up by /linters:run
 *
 * Closes the prevention-follow-up from /sprint:full v1's /fix:deep:
 * RT-008 plan.js drift bug class is now caught at lint-time.
 */

"use strict";

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

function listOutput() {
  const r = spawnSync(
    process.execPath,
    [path.join(REPO, "scripts", "linters", "run.js"), "--list"],
    { encoding: "utf8", cwd: REPO },
  );
  return r.stdout || "";
}

function test_linters_run_list_includes_sprint_test_plan_honors_registry_primary() {
  const out = listOutput();
  if (!/sprint-test-plan-honors-registry-primary/.test(out)) {
    return fail(
      "test_linters_run_list_includes_sprint_test_plan_honors_registry_primary",
      `output missing entry. stdout=${out.slice(0, 300)}`,
    );
  }
  if (!/scripts\/sprint\/test-plan-honors-registry-primary\.js/.test(out)) {
    return fail(
      "test_linters_run_list_includes_sprint_test_plan_honors_registry_primary",
      `cmd does not point at scripts/sprint/test-plan-honors-registry-primary.js`,
    );
  }
  ok("test_linters_run_list_includes_sprint_test_plan_honors_registry_primary");
}

function test_linters_run_excludes_tests_regression_subtree() {
  const out = listOutput();
  // No discovered linter should reference tests/regression/
  const lines = out.split(/\r?\n/).filter((l) => l.includes("→"));
  for (const line of lines) {
    if (/tests[\\/]regression[\\/]/.test(line)) {
      return fail(
        "test_linters_run_excludes_tests_regression_subtree",
        `linter list references tests/regression: ${line}`,
      );
    }
  }
  ok("test_linters_run_excludes_tests_regression_subtree");
}

test_linters_run_list_includes_sprint_test_plan_honors_registry_primary();
test_linters_run_excludes_tests_regression_subtree();

process.stdout.write(`\n# ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
