#!/usr/bin/env node
"use strict";

/**
 * scripts/sprint/validate-autonomy-config.exitcodes.test.js
 *
 * SP-20260829-001 bundle B4, Task 3 (ED-380) — teeth for the
 * validate-autonomy-config.js exit-code repair.
 *
 * VERIFIED ENVIRONMENT FACT this suite depends on: this repo has no root
 * package.json / node_modules, so require.resolve("ajv") always throws
 * MODULE_NOT_FOUND here — the schema half of validate-autonomy-config.js has
 * never actually run. That is the live, reachable defect ED-380 names (not a
 * hypothetical). This suite asserts the NEW, distinguishable exit-code
 * contract against that real, current environment rather than mocking ajv's
 * absence.
 *
 * Run with: node --test scripts/sprint/validate-autonomy-config.exitcodes.test.js
 */

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const SCRIPT = path.join(__dirname, "validate-autonomy-config.js");
const REAL_DEFAULT_CONFIG = path.join(
  REPO_ROOT,
  ".claude",
  "agents",
  "president",
  "_system",
  "policy",
  "sprint-full-autonomy.json",
);

function run(args) {
  const r = spawnSync(process.execPath, [SCRIPT, ...args], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    timeout: 30000,
  });
  return { code: r.status, stdout: r.stdout || "", stderr: r.stderr || "" };
}

test("precondition: ajv is NOT resolvable in this repo", () => {
  let resolved = false;
  try {
    require.resolve("ajv");
    resolved = true;
  } catch {
    resolved = false;
  }
  assert.equal(
    resolved,
    false,
    "ajv became resolvable — this repo's schema half now actually runs; " +
      "the exit-3/skip path below is no longer exercised by default and " +
      "this suite needs a companion test for the schema-ran case.",
  );
});

test("valid config, ajv unavailable, NO --allow-schema-skip: exits 3, not 0", () => {
  const res = run(["--file", REAL_DEFAULT_CONFIG]);
  assert.equal(
    res.code,
    3,
    `expected exit 3 (contract-passed-but-schema-skipped); got ${res.code}. ` +
      `stdout=${res.stdout} stderr=${res.stderr}`,
  );
  assert.match(res.stderr, /SCHEMA VALIDATION WAS SKIPPED/);
  assert.match(res.stderr, /ED-380/);
  // The old (pre-fix) behavior was: this exact scenario exited 0, identical
  // to a full schema+contract pass. Exit 3 !== 0 is the whole repair.
  assert.notEqual(res.code, 0);
});

test("valid config, ajv unavailable, WITH --allow-schema-skip: exits 0, message says why", () => {
  const res = run(["--file", REAL_DEFAULT_CONFIG, "--allow-schema-skip"]);
  assert.equal(res.code, 0, `stdout=${res.stdout} stderr=${res.stderr}`);
  assert.match(res.stdout, /SCHEMA VALIDATION WAS SKIPPED/);
  assert.match(res.stdout, /--allow-schema-skip was passed/);
});

test("no-op guard: --allow-schema-skip does NOT mask a genuine contract failure", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "autonomy-broken-"));
  try {
    const cfg = JSON.parse(fs.readFileSync(REAL_DEFAULT_CONFIG, "utf8"));
    // Inject a real contract violation: hard_ceilings[] no longer matches
    // the hardcoded enum (drop one entry).
    cfg.hard_ceilings = cfg.hard_ceilings.slice(0, -1);
    const brokenPath = path.join(tmp, "broken-autonomy.json");
    fs.writeFileSync(brokenPath, JSON.stringify(cfg, null, 2));

    const withoutFlag = run(["--file", brokenPath]);
    assert.equal(withoutFlag.code, 1, "broken config must fail without the flag");
    assert.match(withoutFlag.stderr, /hard_ceilings\[\] mismatch/);

    const withFlag = run(["--file", brokenPath, "--allow-schema-skip"]);
    assert.equal(
      withFlag.code,
      1,
      "NO-OP GUARD FAILED: --allow-schema-skip must only affect the " +
        "schema-skip branch, never mask a real contract failure",
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
