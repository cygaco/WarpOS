#!/usr/bin/env node
/* eslint-disable no-console */
"use strict";
/**
 * scripts/checks/test-warpos-ship-coverage.js
 *
 * Fixture-driven tests for warpos-ship-coverage.js (AC1, run-0160).
 * Drives the gate against ephemeral temp directories — no live manifest dependency.
 *
 * Test cases:
 *   (a) NEW dangling seeded_from (not in KNOWN_DANGLING)  → gate exits 1 (RED)
 *   (b) All seeded_from in KNOWN_DANGLING allowlist       → gate exits 0 (OK)
 *   (c) Malformed _warpos/MANIFEST.json                   → gate exits 2 (setup error)
 *   (d) EXHAUSTIVE: run against THIS worktree              → info_gaps_count===0,
 *                                                             dangling_unallowlisted===0, ok===true
 *
 * Exit: 0 iff all tests pass, 1 otherwise.
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const cp = require("child_process");

const GATE = path.resolve(__dirname, "warpos-ship-coverage.js");
const WORKTREE_ROOT = path.resolve(__dirname, "..", "..");

let passes = 0;
let failures = 0;

function ok(name, condition, detail) {
  if (condition) {
    passes++;
    console.log(`  ok  ${name}`);
  } else {
    failures++;
    const suffix = detail ? ` — ${detail}` : "";
    console.log(`  FAIL ${name}${suffix}`);
  }
}

// ── Fixture helpers ────────────────────────────────────────────────────────────

/**
 * Create a minimal temp fixture directory with:
 *   _warpos/MANIFEST.json      (provided as warposManifest, or literal JSON string)
 *   .claude/framework-manifest.json  (includes _guides/ to satisfy must-ship check)
 *
 * Returns the temp dir path.
 */
function makeTempFixture(warposManifest) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "wsc-test-"));

  // _warpos/ dir + MANIFEST.json
  fs.mkdirSync(path.join(dir, "_warpos"), { recursive: true });
  if (typeof warposManifest === "string") {
    fs.writeFileSync(path.join(dir, "_warpos", "MANIFEST.json"), warposManifest);
  } else {
    fs.writeFileSync(
      path.join(dir, "_warpos", "MANIFEST.json"),
      JSON.stringify(warposManifest, null, 2),
    );
  }

  // .claude/ + minimal framework-manifest.json
  // Must include a _guides/ entry so the must-ship boundary check passes.
  fs.mkdirSync(path.join(dir, ".claude"), { recursive: true });
  const fm = {
    assets: {
      guide: [{ src: "_guides/placeholder.md", dest: "_guides/placeholder.md" }],
    },
  };
  fs.writeFileSync(
    path.join(dir, ".claude", "framework-manifest.json"),
    JSON.stringify(fm, null, 2),
  );

  return dir;
}

function rmrf(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    /* ignore cleanup errors */
  }
}

/** Run the gate against a fixture dir. Returns { code, stdout, stderr, json }. */
function runGate(fixtureDir, extraArgs = []) {
  const result = cp.spawnSync(
    process.execPath,
    [GATE, "--root", fixtureDir, "--json", ...extraArgs],
    { encoding: "utf8", timeout: 15_000 },
  );
  let json = null;
  try {
    json = JSON.parse(result.stdout);
  } catch {
    /* not valid JSON — may be exit-2 error output */
  }
  return {
    code: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    json,
  };
}

// ── Test (a): new dangling seeded_from, NOT in KNOWN_DANGLING → exit 1 ────────
console.log("\n[a] New dangling seeded_from (not allowlisted) → exit 1");
{
  // Use a seeded_from path that is NOT under framework/templates/_requirements/ or
  // framework/templates/policy/ — so it falls outside KNOWN_DANGLING.
  const manifest = {
    paths: {
      "_requirements/SomeFile.md": {
        owner: "project",
        kind: "file",
        seeded_from: "framework/templates/THIS_DOES_NOT_EXIST_NOT_IN_ALLOWLIST.md",
      },
    },
  };
  const dir = makeTempFixture(manifest);
  try {
    const r = runGate(dir);
    ok("(a) exit code is 1", r.code === 1, `got ${r.code}`);
    ok("(a) ok===false", r.json && r.json.ok === false, `json.ok=${r.json && r.json.ok}`);
    ok(
      "(a) dangling_unallowlisted has the new path",
      r.json &&
        Array.isArray(r.json.dangling_unallowlisted) &&
        r.json.dangling_unallowlisted.some((p) =>
          p.includes("THIS_DOES_NOT_EXIST_NOT_IN_ALLOWLIST"),
        ),
      `dangling_unallowlisted=${JSON.stringify(r.json && r.json.dangling_unallowlisted)}`,
    );
  } finally {
    rmrf(dir);
  }
}

// ── Test (b): seeded_from under KNOWN_DANGLING prefix → exit 0 ────────────────
console.log("\n[b] seeded_from in KNOWN_DANGLING allowlist → exit 0");
{
  const manifest = {
    paths: {
      "_requirements/README.md": {
        owner: "project",
        kind: "file",
        seeded_from: "framework/templates/_requirements/README.md",
      },
      "_requirements/SomePolicy.md": {
        owner: "project",
        kind: "file",
        seeded_from: "framework/templates/policy/decision-policy.md",
      },
    },
  };
  const dir = makeTempFixture(manifest);
  try {
    const r = runGate(dir);
    ok("(b) exit code is 0", r.code === 0, `got ${r.code}; stderr=${r.stderr}`);
    ok("(b) ok===true", r.json && r.json.ok === true, `json.ok=${r.json && r.json.ok}`);
    ok(
      "(b) dangling_seeds_total===2",
      r.json && r.json.dangling_seeds_total === 2,
      `got ${r.json && r.json.dangling_seeds_total}`,
    );
    ok(
      "(b) dangling_allowlisted===2",
      r.json && r.json.dangling_allowlisted === 2,
      `got ${r.json && r.json.dangling_allowlisted}`,
    );
    ok(
      "(b) dangling_unallowlisted is empty",
      r.json &&
        Array.isArray(r.json.dangling_unallowlisted) &&
        r.json.dangling_unallowlisted.length === 0,
      `got ${JSON.stringify(r.json && r.json.dangling_unallowlisted)}`,
    );
  } finally {
    rmrf(dir);
  }
}

// ── Test (c): malformed _warpos/MANIFEST.json → exit 2 ───────────────────────
console.log("\n[c] Malformed _warpos/MANIFEST.json → exit 2");
{
  const dir = makeTempFixture("{ this is not valid json >>>"); // intentionally invalid
  try {
    const r = runGate(dir);
    ok("(c) exit code is 2", r.code === 2, `got ${r.code}`);
    // json output is undefined since gate exits before printing JSON
    ok(
      "(c) stderr contains 'invalid JSON' or 'warpos-ship-coverage'",
      typeof r.stderr === "string" && r.stderr.includes("warpos-ship-coverage"),
      `stderr=${r.stderr.slice(0, 200)}`,
    );
  } finally {
    rmrf(dir);
  }
}

// ── Test (d): exhaustive — run against THIS worktree ─────────────────────────
console.log("\n[d] Exhaustive run against worktree → ok, info_gaps_count===0, dangling_unallowlisted===0");
{
  const r = runGate(WORKTREE_ROOT);
  ok("(d) exit code is 0", r.code === 0, `got ${r.code}; stderr=${(r.stderr || "").slice(0, 200)}`);
  ok("(d) ok===true", r.json && r.json.ok === true, `json.ok=${r.json && r.json.ok}`);
  ok(
    "(d) info_gaps_count===0",
    r.json && r.json.info_gaps_count === 0,
    `got ${r.json && r.json.info_gaps_count}; remaining=${JSON.stringify(r.json && r.json.info_gaps)}`,
  );
  ok(
    "(d) dangling_unallowlisted===0",
    r.json &&
      Array.isArray(r.json.dangling_unallowlisted) &&
      r.json.dangling_unallowlisted.length === 0,
    `got ${JSON.stringify(r.json && r.json.dangling_unallowlisted)}`,
  );
  ok(
    "(d) dangling_seeds_total===100 (all 100 known-dangling)",
    r.json && r.json.dangling_seeds_total === 100,
    `got ${r.json && r.json.dangling_seeds_total}`,
  );
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n${passes + failures} tests: ${passes} passed, ${failures} failed`);
if (failures > 0) {
  console.error(`FAIL test-warpos-ship-coverage: ${failures} test(s) failed`);
  process.exit(1);
} else {
  console.log("OK   test-warpos-ship-coverage: all tests passed");
  process.exit(0);
}
