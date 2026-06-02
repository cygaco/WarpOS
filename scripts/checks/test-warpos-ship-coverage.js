#!/usr/bin/env node
/* eslint-disable no-console */
"use strict";
/**
 * scripts/checks/test-warpos-ship-coverage.js
 *
 * Fixture-driven tests for warpos-ship-coverage.js (AC1, run-0160).
 * Drives the gate against ephemeral temp directories — no live manifest dependency.
 *
 * Test cases (0.16.0: KNOWN_DANGLING_SET is EMPTY — zero-tolerance for dangling seeded_from):
 *   (a) NEW dangling seeded_from (outside the old dirs) → exit 1 (RED)
 *   (b) dangling seeded_from with EMPTY KNOWN_DANGLING (former framework/templates values) → exit 1 (RED)
 *   (c) Malformed _warpos/MANIFEST.json                                         → exit 2 (setup error)
 *   (d) EXHAUSTIVE: run against THIS worktree → info_gaps_count===0, dangling_unallowlisted===0, dangling_seeds_total===0, ok===true
 *   (e) FIX1: unallowlisted owner=framework info_gap path → exit 1, info_gaps_count>0 (not just INFO)
 *   (f) FIX2: a dangle inside framework/templates/_requirements/ (set empty) → exit 1 (RED)
 *   (g) a FORMER known-100 value as seeded_from → now RED (allowlist emptied in 0.16.0)
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

// ── Test (b): old known-dangling values are now RED (empty set, zero-tolerance) ─
// 0.16.0 reconcile: KNOWN_DANGLING_SET is EMPTY, so the former framework/templates/...
// values (which never resolved) are unallowlisted → exit 1. The mechanism still
// exists for a future dangle; it just allowlists nothing today.
console.log("\n[b] dangling seeded_from with empty KNOWN_DANGLING → exit 1 (zero-tolerance)");
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
    ok("(b) exit code is 1", r.code === 1, `got ${r.code}; stderr=${r.stderr}`);
    ok("(b) ok===false", r.json && r.json.ok === false, `json.ok=${r.json && r.json.ok}`);
    ok(
      "(b) dangling_seeds_total===2",
      r.json && r.json.dangling_seeds_total === 2,
      `got ${r.json && r.json.dangling_seeds_total}`,
    );
    ok(
      "(b) dangling_allowlisted===0 (set is empty)",
      r.json && r.json.dangling_allowlisted === 0,
      `got ${r.json && r.json.dangling_allowlisted}`,
    );
    ok(
      "(b) dangling_unallowlisted has both paths",
      r.json &&
        Array.isArray(r.json.dangling_unallowlisted) &&
        r.json.dangling_unallowlisted.length === 2,
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
    "(d) dangling_seeds_total===0 (0.16.0: prefix-drift reconciled in the generator)",
    r.json && r.json.dangling_seeds_total === 0,
    `got ${r.json && r.json.dangling_seeds_total}`,
  );
}

// ── Test (e): FIX1 — unallowlisted owner=framework info_gap → exit 1 ─────────
// Before FIX1, an unallowlisted owner=framework path outside hard-signal roots
// was reported as INFO but the gate still exited 0 (false-green). After FIX1,
// infoGaps.length === 0 is part of result.ok, so this now exits 1.
console.log("\n[e] FIX1: unallowlisted owner=framework info_gap path → exit 1 (enforced)");
{
  // Use a path that is:
  //   - owner=framework, kind=file (so the gate processes it)
  //   - NOT under HARD_SIGNAL_ROOTS (framework/, schemas/, patterns/, .claude/commands/, .claude/agents/)
  //     → goes to infoGaps, NOT hardGaps
  //   - NOT in KNOWN_NOT_SHIPPED (no matching prefix or predicate)
  //   - NOT shipped in the minimal framework-manifest fixture
  const manifest = {
    paths: {
      "some-custom-dir/unreviewd-framework-tool.js": {
        owner: "framework",
        kind: "file",
      },
    },
  };
  const dir = makeTempFixture(manifest);
  try {
    const r = runGate(dir);
    ok("(e) exit code is 1 (info_gaps now block)", r.code === 1, `got ${r.code}; stderr=${r.stderr}`);
    ok("(e) ok===false", r.json && r.json.ok === false, `json.ok=${r.json && r.json.ok}`);
    ok(
      "(e) info_gaps_count > 0",
      r.json && r.json.info_gaps_count > 0,
      `got info_gaps_count=${r.json && r.json.info_gaps_count}`,
    );
    ok(
      "(e) hard_gaps is empty (path is NOT a hard-signal root)",
      r.json &&
        Array.isArray(r.json.hard_gaps) &&
        r.json.hard_gaps.length === 0,
      `hard_gaps=${JSON.stringify(r.json && r.json.hard_gaps)}`,
    );
  } finally {
    rmrf(dir);
  }
}

// ── Test (f): FIX2 — new dangle INSIDE framework/templates/_requirements/ ────
// but NOT one of the known-100 → exit 1.
// This is the EXACT false-green FIX2 closes: before FIX2, a prefix-based
// KNOWN_DANGLING would have silently allowlisted any seeded_from under
// framework/templates/_requirements/, even a brand-new typo'd filename.
// After FIX2 (exact-match Set), only the 100 known values are allowlisted;
// a new filename → danglingUnallowlisted → exit 1.
console.log("\n[f] FIX2: new dangle inside framework/templates/_requirements/ NOT in known-100 → exit 1");
{
  // This filename does NOT appear in KNOWN_DANGLING_SET (the 100 exact strings).
  // It IS under framework/templates/_requirements/ — the old prefix match would have
  // silently passed it (false-green). The new exact match must RED it.
  const newDangle = "framework/templates/_requirements/BRAND_NEW_UNREVIEWD_TEMPLATE.md";
  const manifest = {
    paths: {
      "_requirements/SomeSeededFile.md": {
        owner: "project",
        kind: "file",
        seeded_from: newDangle,
      },
    },
  };
  const dir = makeTempFixture(manifest);
  // Do NOT create the source file in the fixture — it must be dangling.
  try {
    const r = runGate(dir);
    ok("(f) exit code is 1 (new dangle in known-dir REDs with exact match)", r.code === 1, `got ${r.code}`);
    ok("(f) ok===false", r.json && r.json.ok === false, `json.ok=${r.json && r.json.ok}`);
    ok(
      "(f) dangling_unallowlisted contains the new path",
      r.json &&
        Array.isArray(r.json.dangling_unallowlisted) &&
        r.json.dangling_unallowlisted.some((p) => p.includes("BRAND_NEW_UNREVIEWD_TEMPLATE")),
      `dangling_unallowlisted=${JSON.stringify(r.json && r.json.dangling_unallowlisted)}`,
    );
  } finally {
    rmrf(dir);
  }
}

// ── Test (g): a FORMER known-100 value is now RED (0.16.0 emptied the allowlist) ─
// Guards that the reconcile actually emptied KNOWN_DANGLING_SET: a value that USED
// to be allowlisted no longer passes — zero-tolerance holds, no accidental re-populate.
console.log("\n[g] former known-100 value as seeded_from → now RED (allowlist empty)");
{
  const formerlyAllowed = "framework/templates/_requirements/03-architecture/SECURITY.md";
  const manifest = {
    paths: {
      "_requirements/Architecture/Security.md": {
        owner: "project",
        kind: "file",
        seeded_from: formerlyAllowed,
      },
    },
  };
  const dir = makeTempFixture(manifest);
  // Do NOT create the file — it must be dangling (not on disk).
  try {
    const r = runGate(dir);
    ok("(g) exit code is 1 (former allowlisted value now RED)", r.code === 1, `got ${r.code}; stderr=${r.stderr}`);
    ok("(g) ok===false", r.json && r.json.ok === false, `json.ok=${r.json && r.json.ok}`);
    ok(
      "(g) dangling_allowlisted===0 (set empty)",
      r.json && r.json.dangling_allowlisted === 0,
      `got ${r.json && r.json.dangling_allowlisted}`,
    );
    ok(
      "(g) dangling_unallowlisted contains the former value",
      r.json &&
        Array.isArray(r.json.dangling_unallowlisted) &&
        r.json.dangling_unallowlisted.some((p) => p.includes("SECURITY.md")),
      `dangling_unallowlisted=${JSON.stringify(r.json && r.json.dangling_unallowlisted)}`,
    );
  } finally {
    rmrf(dir);
  }
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
