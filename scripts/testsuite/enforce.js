#!/usr/bin/env node
/**
 * scripts/testsuite/enforce.js — regression-seed ENFORCER (0.17.0).
 *
 * The named enforcer for the per-sprint test-suite convention (_docs/sprint/TESTSUITE.md).
 * Runs scripts/testsuite/run.js --json as a child process and turns its verdict
 * into a pass/fail signal that the regression_seed release gate (and CI) can act on.
 *
 * Role-aware (via ./role.js, the interim repo-role stub):
 *   - product repos    → enforcement is opt-in; no-op, exit 0. Consumer-only
 *                        detectors (n/a in canonical) would falsely fail here.
 *   - canonical/framework → mandatory. Any regression in a covered class fails.
 *
 *   node scripts/testsuite/enforce.js            # human report
 *   node scripts/testsuite/enforce.js --strict   # also fail on incoherent registry rows
 *   node scripts/testsuite/enforce.js --json      # machine-readable verdict
 *
 * Exit codes:
 *   0 — clean (canonical green, or product no-op)
 *   1 — regression in a covered class (or, with --strict, an incoherent row)
 *   2 — run.js produced no parseable output (runner error — NOT a clean pass)
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { isCanonical, roleLabel } = require("./role");

const ROOT = path.resolve(__dirname, "..", "..");
const RUN = path.join(__dirname, "run.js");
const REG = path.join(ROOT, "_requirements", "07-testing", "recurring-bug-classes.json");

// Mirror run.js's own `regressions` filter: a covered/expected-to-pass class
// whose detector ran and failed. (expect "pass", or unscoped runnable detector.)
function isRegression(r) {
  return (
    ["fail", "error", "timeout"].includes(r.result) &&
    (r.expect === "pass" || (r.expect == null && r.type !== "none" && r.type !== "manual"))
  );
}

// Strict-mode coherence check: a registry class that claims coverage
// (status !== "gap") must carry a *runnable* detector — a non-empty argv array
// in detector.run. A non-gap row whose run is null, omitted, a non-array, or an
// empty array is incoherent: it asserts a held-closed bug class with nothing the
// runner can execute. (TESTSUITE.md: a non-gap class MUST have a non-null array
// detector.run.) This deliberately also flags `partial` rows backed only by a
// manual skill (run:null) — under the convention they owe a runnable detector,
// so surfacing them as the suite's coverage backlog is the point.
function incoherentClasses() {
  let reg;
  try {
    reg = JSON.parse(fs.readFileSync(REG, "utf8").replace(/^﻿/, ""));
  } catch {
    return [];
  }
  return (reg.classes || [])
    .filter((c) => {
      if (c.status === "gap") return false;
      const d = c.detector;
      return !d || !Array.isArray(d.run) || d.run.length === 0;
    })
    .map((c) => ({ id: c.id, name: c.name }));
}

// Class ids declared as known-red BASELINE (pre-existing tracked debt, registry
// `baseline: "red"`). The enforcer reports these but does NOT block release on
// them — it blocks only on NEW reds (a class that should be green going red).
// This implements the "don't increase the pre-existing reds" contract; clearing
// a class's debt = remove its baseline marker, and it becomes blocking again.
function baselineRedIds() {
  try {
    const reg = JSON.parse(fs.readFileSync(REG, "utf8").replace(/^﻿/, ""));
    return new Set((reg.classes || []).filter((c) => c.baseline === "red").map((c) => c.id));
  } catch {
    return new Set();
  }
}

/**
 * run({strict}) → verdict object the release gate / CI can consume:
 *   { enforced, role, regressions, incoherent: [...ids], exit, ...internal }
 * Spawning run.js keeps the suite's exit semantics authoritative; no logic dup.
 */
function run(opts) {
  const strict = !!(opts && opts.strict);
  const role = roleLabel();
  const canonical = isCanonical();

  if (!canonical) {
    return { enforced: false, role, regressions: 0, incoherent: [], exit: 0, mode: "opt-in" };
  }

  const r = spawnSync(process.execPath, [RUN, "--json"], { cwd: ROOT, encoding: "utf8", timeout: 120000 });
  let parsed;
  try {
    parsed = JSON.parse((r.stdout || "").trim());
  } catch {
    return {
      enforced: true,
      role,
      regressions: 0,
      incoherent: [],
      exit: 2,
      error: `run.js produced no parseable JSON (status=${r.status}, error=${r.error ? r.error.code : "none"}).`,
      stderrTail: (r.stderr || r.stdout || "").split(/\r?\n/).filter(Boolean).slice(-6),
    };
  }

  const summary = parsed.summary || {};
  const results = Array.isArray(parsed.results) ? parsed.results : [];
  const baseline = baselineRedIds();
  const allOffending = results.filter(isRegression);
  // Block only on NEW reds; known-baseline reds are tracked debt, not blocking.
  const offending = allOffending.filter((o) => !baseline.has(o.id));
  const baselineReds = allOffending.filter((o) => baseline.has(o.id)).map((o) => o.id);
  const regressions = offending.length;
  const incoherent = strict ? incoherentClasses() : [];

  const exit = regressions > 0 || (strict && incoherent.length > 0) ? 1 : 0;
  return {
    enforced: true,
    role,
    regressions,
    baselineReds,
    incoherent: incoherent.map((c) => c.id),
    exit,
    summary,
    offending,
    incoherentDetail: incoherent,
    strict,
  };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const strict = args.includes("--strict");
  const json = args.includes("--json");
  const v = run({ strict });

  if (v.exit === 2) {
    process.stderr.write(`enforce: ${v.error}\n`);
    for (const l of v.stderrTail || []) process.stderr.write(`  ${l}\n`);
    if (json) process.stdout.write(JSON.stringify({ enforced: v.enforced, role: v.role, regressions: v.regressions, incoherent: v.incoherent, exit: v.exit }) + "\n");
    process.exit(2);
  }

  if (json) {
    process.stdout.write(
      JSON.stringify({ enforced: v.enforced, role: v.role, regressions: v.regressions, baselineReds: v.baselineReds, incoherent: v.incoherent, exit: v.exit }) + "\n",
    );
    process.exit(v.exit);
  }

  if (!v.enforced) {
    process.stdout.write(`test-suite enforcement is opt-in for product repos (repoRole=${v.role}); no-op.\n`);
    process.exit(0);
  }

  if (v.regressions > 0) {
    process.stdout.write(`test-suite enforcement FAILED: ${v.regressions} regression(s) in covered classes (repoRole=${v.role}).\n`);
    for (const o of v.offending) process.stdout.write(`  ${o.id}  ${o.name}  (exit ${o.exit})\n`);
  }
  if (v.strict && v.incoherentDetail.length > 0) {
    process.stdout.write(`incoherent registry rows (status != gap but detector.run === null):\n`);
    for (const c of v.incoherentDetail) process.stdout.write(`  ${c.id}  ${c.name}\n`);
  }
  if (v.baselineReds && v.baselineReds.length) {
    process.stdout.write(`known-baseline reds (tracked debt, NOT release-blocking): ${v.baselineReds.join(", ")}\n`);
  }
  if (v.exit === 0) {
    process.stdout.write(
      `test-suite enforcement: ${v.summary.passing}/${v.summary.runnable} runnable green, 0 NEW regressions — canonical clean.\n`,
    );
  }
  process.exit(v.exit);
}

module.exports = { run, isRegression, incoherentClasses };
