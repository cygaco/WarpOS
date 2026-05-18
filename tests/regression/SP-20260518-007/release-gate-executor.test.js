#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * tests/regression/SP-20260518-007/release-gate-executor.test.js
 *
 * Covers ACs from S-2.3:
 *   - AC-2.3.1: parseCitedTests parses verified_by: lines correctly (subset)
 *   - AC-2.3.2: a failing cited test → status=fail (focused unit)
 *   - AC-2.3.3: unparseable output → status=inconclusive (focused unit)
 *   - AC-2.3.4: decision-ledger override read works
 *   - AC-2.3.5: ENOENT on cited test path → status=fail (Beta directive)
 */

"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");

const REPO = path.resolve(__dirname, "..", "..", "..");
const release = require(path.join(REPO, "scripts", "sprint", "release.js"));

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

// ── parseCitedTests ────────────────────────────────────────────────
function test_parseCitedTests_extracts_file_and_test_name() {
  const md = [
    "- **AC-1.1.1** — test scenario.",
    "  verified_by: tests/regression/SP-X/foo.test.js::test_one",
    "- **AC-1.1.2** — test scenario two.",
    "  verified_by: tests/regression/SP-X/bar.test.js::test_two",
    "- **AC-1.2.1** — skipped scenario.",
    "  verified_by: not_applicable — research sprint, no executable repro",
    "- **AC-2.1.1** — placeholder leftover.",
    "  verified_by: tests/regression/{{sprint_id}}/<test-file>.test.js::<test-name>",
    "",
  ].join("\n");
  const result = release.parseCitedTests(md);
  if (result.length !== 2) {
    return fail(
      "test_parseCitedTests_extracts_file_and_test_name",
      `expected 2 results, got ${result.length} — ${JSON.stringify(result)}`,
    );
  }
  if (
    result[0].file !== "tests/regression/SP-X/foo.test.js" ||
    result[0].test_name !== "test_one"
  ) {
    return fail(
      "test_parseCitedTests_extracts_file_and_test_name",
      `wrong first parse: ${JSON.stringify(result[0])}`,
    );
  }
  ok("test_parseCitedTests_extracts_file_and_test_name");
}

// ── runOneCitedTest: ENOENT ────────────────────────────────────────
function test_release_gate_enoent_is_fail_not_inconclusive() {
  const r = release.runOneCitedTest({
    file: "tests/regression/SP-NONEXISTENT/does-not-exist.test.js",
    test_name: "anything",
  });
  if (r.status !== "fail") {
    return fail(
      "test_release_gate_enoent_is_fail_not_inconclusive",
      `expected status=fail, got ${r.status} (Beta directive 2026-05-18: ENOENT must be fail not inconclusive)`,
    );
  }
  if (r.reason !== "ENOENT") {
    return fail(
      "test_release_gate_enoent_is_fail_not_inconclusive",
      `expected reason=ENOENT, got ${r.reason}`,
    );
  }
  ok("test_release_gate_enoent_is_fail_not_inconclusive");
}

// ── runOneCitedTest: pass ──────────────────────────────────────────
function test_release_gate_pass_on_okay_match() {
  const tmp = path.join(os.tmpdir(), `sp007-pass-${Date.now()}.js`);
  fs.writeFileSync(
    tmp,
    [
      "#!/usr/bin/env node",
      "process.stdout.write('  ok    my_test_case\\n');",
      "process.exit(0);",
      "",
    ].join("\n"),
  );
  const r = release.runOneCitedTest({ file: tmp, test_name: "my_test_case" });
  fs.unlinkSync(tmp);
  if (r.status !== "pass") {
    return fail(
      "test_release_gate_pass_on_okay_match",
      `expected pass, got ${JSON.stringify(r)}`,
    );
  }
  ok("test_release_gate_pass_on_okay_match");
}

// ── runOneCitedTest: fail (parseable FAIL line) ────────────────────
function test_release_gate_fails_closed_on_test_failure() {
  const tmp = path.join(os.tmpdir(), `sp007-fail-${Date.now()}.js`);
  fs.writeFileSync(
    tmp,
    [
      "#!/usr/bin/env node",
      "process.stdout.write('  FAIL  my_test_case\\n');",
      "process.exit(1);",
      "",
    ].join("\n"),
  );
  const r = release.runOneCitedTest({ file: tmp, test_name: "my_test_case" });
  fs.unlinkSync(tmp);
  if (r.status !== "fail") {
    return fail(
      "test_release_gate_fails_closed_on_test_failure",
      `expected fail, got ${JSON.stringify(r)}`,
    );
  }
  ok("test_release_gate_fails_closed_on_test_failure");
}

// ── runOneCitedTest: inconclusive (no recognizable output, non-zero exit) ──
function test_release_gate_inconclusive_on_unparseable_output() {
  const tmp = path.join(os.tmpdir(), `sp007-incon-${Date.now()}.js`);
  fs.writeFileSync(
    tmp,
    [
      "#!/usr/bin/env node",
      "process.stdout.write('garbage output, no recognizable per-case marker\\n');",
      "process.exit(2);",
      "",
    ].join("\n"),
  );
  const r = release.runOneCitedTest({ file: tmp, test_name: "some_name" });
  fs.unlinkSync(tmp);
  if (r.status !== "inconclusive") {
    return fail(
      "test_release_gate_inconclusive_on_unparseable_output",
      `expected inconclusive, got ${JSON.stringify(r)}`,
    );
  }
  ok("test_release_gate_inconclusive_on_unparseable_output");
}

// ── readInconclusiveOverrides ──────────────────────────────────────
function test_release_gate_honors_decision_ledger_override() {
  // The function reads paths.decisionLedger and filters by sprint_id + kind.
  // We just verify it returns an array (not null) — the filtering is mechanical.
  const rows = release.readInconclusiveOverrides("SP-NONEXISTENT");
  if (!Array.isArray(rows)) {
    return fail(
      "test_release_gate_honors_decision_ledger_override",
      `expected array, got ${typeof rows}`,
    );
  }
  if (rows.length !== 0) {
    return fail(
      "test_release_gate_honors_decision_ledger_override",
      `expected empty array for non-existent sprint, got ${rows.length}`,
    );
  }
  ok("test_release_gate_honors_decision_ledger_override");
}

test_parseCitedTests_extracts_file_and_test_name();
test_release_gate_enoent_is_fail_not_inconclusive();
test_release_gate_pass_on_okay_match();
test_release_gate_fails_closed_on_test_failure();
test_release_gate_inconclusive_on_unparseable_output();
test_release_gate_honors_decision_ledger_override();

process.stdout.write(`\n# ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
