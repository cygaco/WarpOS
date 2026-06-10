#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// planning-principles.test.js — S-LC-08 (E-LIFECYCLE-001 §8.11). The named
// enforcer for the planning principles (scripts/checks/planning-principles.js).
//
//   - a planted plan doc MISSING the enforcer/proof/blast-radius sections → the
//     check FLAGS it (report-only, in the findings list).               [PLANTED]
//   - a well-formed plan (all three present) → NO finding.
//   - partial omission → flagged with EXACTLY the missing section(s).
//   - README.md inside the dir is NOT treated as a plan doc.
//   - FAIL-OPEN: a missing _planning/epics/ dir → exit 0 clean, no findings.
//   - REPORT-ONLY: even with a planted violation the CLI exits 0.
//   - --json emits a parseable envelope.
//
// Uses the planted-fixture pattern (temp dir + --planning-dir override), like the
// other S-LC tests.
// ─────────────────────────────────────────────────────────────────────────────
"use strict";

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..", "..", "..");
const CHECK = path.join(ROOT, "scripts", "checks", "planning-principles.js");
const mod = require(CHECK);

let pass = 0;
let fail = 0;
function ok(name, fn) {
  try {
    fn();
    pass++;
    console.log(`  ok  ${name}`);
  } catch (e) {
    fail++;
    console.log(`FAIL  ${name}\n      ${e.stack || e.message}`);
  }
}

// Build a throwaway planning tree: <tmp>/epics/ with the given {name: contents}.
// Pass `makeEpics:false` to OMIT the epics/ dir entirely (fail-open case).
function makePlanningDir(files, { makeEpics = true } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "slc08-plan-"));
  if (makeEpics) {
    const epics = path.join(dir, "epics");
    fs.mkdirSync(epics, { recursive: true });
    for (const [name, contents] of Object.entries(files || {})) {
      fs.writeFileSync(path.join(epics, name), contents);
    }
  }
  return dir;
}

// A well-formed plan: names an enforcer, proof/acceptance, and a blast radius.
const WELL_FORMED = `---
tracker: trackers/epics/E-GOOD-001-good.md
---
# E-GOOD-001 — a well-formed plan

## Enforcer
Every policy here is enforced by scripts/checks/example.js (report-only).

## Proof
Acceptance: a planted fixture must be caught; verified by the regression test.

## Blast radius
Touches: scripts/example.js, the manifest, two hooks. No backward-incompat.
`;

// A planted-violation plan: omits ALL THREE required sections. Deliberately avoids
// the trigger words (no "enforcer"/"proof"/"acceptance"/"blast radius") so the
// detector genuinely has to flag the absence.
const PLANTED_BAD = `# E-BAD-001 — an incomplete plan

This document lists some work and an owner, but stops short of the discipline the
canonical principles require.

## Tasks
- do the thing
- then ship it
`;

// Partial: has enforcer + proof but NO blast radius.
const PARTIAL = `# E-PARTIAL-001 — partial plan

## Enforcer
Enforced by scripts/checks/partial.js.

## Proof
Acceptance criteria: the gate fails a planted defect.
`;

// ── PLANTED VIOLATION: a doc missing all three → flagged ─────────────────────
ok("PLANTED: a plan missing enforcer/proof/blast-radius is FLAGGED (report-only)", () => {
  const dir = makePlanningDir({ "E-BAD-001.md": PLANTED_BAD });
  const r = mod.scanPlanningPrinciples({ planningDir: dir });
  assert.strictEqual(r.counts.docs, 1, "one plan doc scanned");
  assert.strictEqual(r.counts.gaps, 1, "the planted bad plan is a gap");
  const f = r.findings.find((x) => /E-BAD-001\.md$/.test(x.file));
  assert.ok(f, "the planted bad plan appears in findings");
  assert.strictEqual(f.missing.length, 3, "all three sections flagged missing");
  assert.ok(
    f.missing.some((m) => /enforcer/i.test(m)) &&
      f.missing.some((m) => /proof/i.test(m)) &&
      f.missing.some((m) => /blast/i.test(m)),
    "the finding names enforcer, proof, and blast-radius",
  );
  // ok=false because there IS a gap — but it remains report-only (exit 0 at CLI).
  assert.strictEqual(r.ok, false);
});

// ── well-formed → no finding ─────────────────────────────────────────────────
ok("a well-formed plan (all three present) produces NO finding", () => {
  const dir = makePlanningDir({ "E-GOOD-001.md": WELL_FORMED });
  const r = mod.scanPlanningPrinciples({ planningDir: dir });
  assert.strictEqual(r.counts.docs, 1);
  assert.strictEqual(r.counts.gaps, 0, "well-formed plan is not flagged");
  assert.strictEqual(r.ok, true);
});

// ── partial omission → flagged with EXACTLY the missing section ──────────────
ok("a partial plan (missing only blast-radius) is flagged with exactly that gap", () => {
  const dir = makePlanningDir({ "E-PARTIAL-001.md": PARTIAL });
  const r = mod.scanPlanningPrinciples({ planningDir: dir });
  assert.strictEqual(r.counts.gaps, 1);
  const f = r.findings[0];
  assert.strictEqual(f.missing.length, 1, "exactly one section missing");
  assert.ok(/blast/i.test(f.missing[0]), "the one gap is blast-radius");
});

// ── mixed tree: good + bad together; only bad flagged ────────────────────────
ok("a mixed tree flags only the omitting doc", () => {
  const dir = makePlanningDir({
    "E-GOOD-001.md": WELL_FORMED,
    "E-BAD-001.md": PLANTED_BAD,
  });
  const r = mod.scanPlanningPrinciples({ planningDir: dir });
  assert.strictEqual(r.counts.docs, 2);
  assert.strictEqual(r.counts.gaps, 1, "only the bad doc is a gap");
  assert.ok(/E-BAD-001\.md$/.test(r.findings[0].file));
});

// ── README.md is the dir contract, NOT a plan doc ────────────────────────────
ok("README.md inside the dir is excluded from plan-doc scanning", () => {
  const dir = makePlanningDir({
    "README.md": "# epics/ contract\nno enforcer/proof/blast here, but it is a README\n",
    "E-GOOD-001.md": WELL_FORMED,
  });
  const r = mod.scanPlanningPrinciples({ planningDir: dir });
  assert.strictEqual(r.counts.docs, 1, "README.md is not counted as a plan doc");
  assert.strictEqual(r.counts.gaps, 0, "the README is not flagged");
});

// ── FAIL-OPEN: a missing epics/ dir → exit 0 clean, no findings ──────────────
ok("FAIL-OPEN: a missing _planning/epics/ dir → 0 docs, 0 gaps, ok", () => {
  const dir = makePlanningDir({}, { makeEpics: false });
  const r = mod.scanPlanningPrinciples({ planningDir: dir });
  assert.strictEqual(r.counts.docs, 0);
  assert.strictEqual(r.counts.gaps, 0);
  assert.strictEqual(r.ok, true, "a missing dir must read clean (fail-open)");
});

// ── CLI: report-only — even a planted violation exits 0 ──────────────────────
ok("CLI: a planted violation is REPORT-ONLY (exit 0)", () => {
  const dir = makePlanningDir({ "E-BAD-001.md": PLANTED_BAD });
  const res = spawnSync("node", [CHECK, "--planning-dir", dir], { cwd: ROOT, encoding: "utf8" });
  assert.strictEqual(res.status, 0, `report-only must exit 0, got ${res.status}; stderr=${res.stderr}`);
  assert.ok(/FINDINGS/.test(res.stdout), "the report surfaces the finding");
  assert.ok(/E-BAD-001\.md/.test(res.stdout), "the report names the planted doc");
});

// ── CLI: --json envelope is parseable ────────────────────────────────────────
ok("CLI: --json emits a parseable envelope with the gap", () => {
  const dir = makePlanningDir({ "E-BAD-001.md": PLANTED_BAD });
  const res = spawnSync("node", [CHECK, "--planning-dir", dir, "--json"], { cwd: ROOT, encoding: "utf8" });
  assert.strictEqual(res.status, 0);
  const parsed = JSON.parse(res.stdout);
  assert.strictEqual(parsed.check, "planning-principles");
  assert.strictEqual(parsed.reportOnly, true);
  assert.strictEqual(parsed.counts.gaps, 1);
});

// ── CLI: a missing dir is fail-open (exit 0, OK) ─────────────────────────────
ok("CLI: a missing epics/ dir is fail-open (exit 0)", () => {
  const dir = makePlanningDir({}, { makeEpics: false });
  const res = spawnSync("node", [CHECK, "--planning-dir", dir], { cwd: ROOT, encoding: "utf8" });
  assert.strictEqual(res.status, 0);
  assert.ok(/OK/.test(res.stdout));
});

console.log(`\nS-LC-08 planning-principles: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
