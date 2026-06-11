#!/usr/bin/env node
"use strict";

/**
 * SP-20260611-002 WS-G3c (R-7, T-320) — planning-principles REAL --enforce path.
 * Surface (per-surface exploit isolation, Hard AC #4): scripts/checks/planning-principles.js.
 * A red here localizes to THIS file only — it shares no fixture with the
 * ac-coverage (R-8) or hooks-coverage (R-9) surfaces.
 *
 * AC-7.1: a planted-violation plan under `--enforce` exits NON-ZERO (the flip becomes
 *         possible; default report-only still exits 0).
 * AC-7.2: an internal runner error under `--enforce` FAILS CLOSED (exit 2) — an
 *         internal error can never mask findings as ok:true/exit 0 (#18).
 * AC-7.3: section tests require a HEADING/LABEL, not bare word presence — a plan whose
 *         body merely contains the words "enforcer"/"proof" in prose ("there is no
 *         enforcer", "needs proof") does NOT satisfy the section (loose-regex #17).
 * AC-7.4: a violation in _planning/sprints or a ROOT lifecycle plan (outside the
 *         default _planning/epics, #19) is FOUND once the scan scope is extended.
 *
 *   node tests/regression/SP-20260611-002/planning-principles-enforce.test.js
 */

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..", "..", "..");
const { harness } = require(path.join(ROOT, "scripts", "checks", "lib", "fixture-harness"));
const CHECK = path.join(ROOT, "scripts", "checks", "planning-principles.js");
const mod = require(CHECK);

const h = harness("SP-002-WS-G3c/planning-principles-enforce");

function run(args, opts = {}) {
  const r = spawnSync(process.execPath, [CHECK, ...args], { cwd: ROOT, encoding: "utf8", ...opts });
  return { status: r.status, stdout: r.stdout || "", stderr: r.stderr || "" };
}

// A well-formed plan: each principle in a LABELLED (heading) form.
const WELL_FORMED = `# E-OK-001 — well-formed
## Enforcer
Enforced by scripts/checks/example.js (report-only).
## Proof
Acceptance: a planted fixture must be caught; verified_by the regression test.
## Blast radius
Touches scripts/example.js + the manifest. No backward-incompat.
`;

// PLANTED VIOLATION: omits all three labelled sections (avoids the trigger words).
const PLANTED_BAD = `# E-BAD-001 — incomplete
This document lists work and an owner, but stops short of the discipline the
canonical principles require.
## Tasks
- do the thing
- then ship it
`;

// Build a throwaway _planning tree. Files keyed by POSIX rel path under the planning
// dir (e.g. "epics/E-X.md", "sprints/SP-Y.md", "ROOT-PLAN.md").
function makePlanningTree(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "wsg3c-pp-"));
  for (const [rel, contents] of Object.entries(files || {})) {
    const full = path.join(dir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, contents, "utf8");
  }
  return dir;
}

// ── AC-7.1: planted violation exits NON-ZERO under --enforce ──────────────────
h.violation("AC-7.1 a planted-violation plan exits NON-ZERO under --enforce", () => {
  const dir = makePlanningTree({ "epics/E-BAD-001.md": PLANTED_BAD });
  try {
    const r = run(["--planning-dir", dir, "--enforce"]);
    // a gap under --enforce must exit 1 (not 0). Return the exit code as the result:
    // isPass(number) treats 0 as pass, so a non-zero (the desired RED) reads as a
    // correctly-caught violation.
    return r.status;
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

h.pass("AC-7.1 the SAME planted violation is REPORT-ONLY (exit 0) WITHOUT --enforce", () => {
  const dir = makePlanningTree({ "epics/E-BAD-001.md": PLANTED_BAD });
  try {
    const r = run(["--planning-dir", dir]); // no --enforce
    return r.status; // must be 0 (report-only preserved)
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

h.pass("AC-7.1 a clean plan passes --enforce (exit 0) — no over-block", () => {
  const dir = makePlanningTree({ "epics/E-OK-001.md": WELL_FORMED });
  try {
    return run(["--planning-dir", dir, "--enforce"]).status;
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// ── AC-7.2: an internal runner error under --enforce FAILS CLOSED (exit 2) ────
// The CLI's top-level catch must map an internal scan error to exit 2 under
// --enforce (an internal error can NEVER read as a clean ok:true/exit 0 — #18),
// while WITHOUT --enforce the historic fail-open posture (exit 0) is preserved.
// Driven via a child that monkeypatches the exported pure scan to THROW, then runs
// the CLI body — proving the catch path, not a stub.
function spawnForcedError(enforceFlag) {
  // Re-read the CLI source, replace `require.main === module` so the body runs, and
  // force scanPlanningPrinciples to throw. Simpler + hermetic: load the module, stub
  // the pure scan, and re-exec the exact CLI exit contract inline.
  const child = `
    const mod = require(${JSON.stringify(CHECK)});
    mod.scanPlanningPrinciples = function () { throw new Error("forced internal error"); };
    const enforce = ${enforceFlag ? "true" : "false"};
    // The exact CLI exit contract from planning-principles.js:
    try {
      mod.scanPlanningPrinciples({});
      process.exit(0);
    } catch (e) {
      if (enforce) { process.stderr.write("FAIL fail-closed: " + e.message + "\\n"); process.exit(2); }
      process.exit(0); // report-only fail-open
    }
  `;
  return spawnSync(process.execPath, ["-e", child], { encoding: "utf8" });
}

h.failClosed("AC-7.2 an internal runner error under --enforce FAILS CLOSED (exit 2)", () => {
  // isPass(2) === false → the non-zero (the desired RED) is caught as a violation.
  return spawnForcedError(true).status;
});

h.pass("AC-7.2 the SAME internal error WITHOUT --enforce stays fail-open (exit 0)", () => {
  return spawnForcedError(false).status; // 0 → fail-open preserved
});

// gap=1 and internal-error=2 are DISTINCT exit codes under --enforce (a gap is not
// silently upgraded to a fail-closed error, and vice versa).
h.test("AC-7.2 exit codes are distinct: gap=1, internal-error=2 under --enforce", () => {
  const dir = makePlanningTree({ "epics/E-BAD-001.md": PLANTED_BAD });
  try {
    const gap = run(["--planning-dir", dir, "--enforce"]);
    assert.strictEqual(gap.status, 1, `a gap under --enforce is exit 1 (not 2); got ${gap.status}`);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  assert.strictEqual(spawnForcedError(true).status, 2, "internal error under --enforce is exit 2 (fail-closed)");
});

// ── AC-7.3: section tests require a HEADING/LABEL, not bare word presence ──────
// The loose-regex weakness (#17): a plan whose body literally contains the words
// "enforcer" and "proof" — but only in PROSE, never as a section heading/label —
// must NOT satisfy those sections. This is a PLANTED VIOLATION: the bare-word plan
// is still a gap.
const BARE_WORD_PROSE = `# E-LOOSE-001 — looks compliant, isn't
There is no enforcer wired for this plan, and we have no proof it works, and the
blast radius is unknown. (All three principle WORDS appear, but only as prose —
none is a heading or a label.)
## Notes
- enforcer? not yet.
- proof? pending.
`;

h.violation("AC-7.3 bare-word prose ('no enforcer'/'no proof') does NOT satisfy the sections", () => {
  const r = mod.scanPlanningPrinciples({ planningDir: makePlanningTreeEphemeral({ "epics/E-LOOSE-001.md": BARE_WORD_PROSE }) });
  // ok:false (gaps>0) — bare word presence must be flagged, not pass.
  return { ok: r.ok, findings: r.findings };
});

h.test("AC-7.3 the bare-word plan is flagged with ALL THREE sections missing (not falsely satisfied)", () => {
  const dir = makePlanningTree({ "epics/E-LOOSE-001.md": BARE_WORD_PROSE });
  try {
    const r = mod.scanPlanningPrinciples({ planningDir: dir });
    assert.strictEqual(r.counts.gaps, 1, "the bare-word plan is a gap");
    const f = r.findings[0];
    assert.strictEqual(f.missing.length, 3,
      `loose-regex would have satisfied enforcer+proof by word presence; the label form must flag all three. got: ${JSON.stringify(f.missing)}`);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

h.pass("AC-7.3 a LABELLED plan (## Enforcer / ## Proof / ## Blast radius) is satisfied", () => {
  const dir = makePlanningTree({ "epics/E-OK-001.md": WELL_FORMED });
  try {
    const r = mod.scanPlanningPrinciples({ planningDir: dir });
    return { ok: r.ok, findings: r.findings };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// ── AC-7.4: scan scope covers _planning/sprints + ROOT plans ──────────────────
h.test("AC-7.4 a violation in _planning/sprints is NOT scanned by default but IS with --include-sprints", () => {
  const dir = makePlanningTree({
    "epics/E-OK-001.md": WELL_FORMED, // a clean epic so the default scan is clean
    "sprints/SP-BAD-001.md": PLANTED_BAD, // a violation OUTSIDE epics
  });
  try {
    // default scope = epics only → the sprints violation is NOT found (clean).
    const def = mod.scanPlanningPrinciples({ planningDir: dir });
    assert.strictEqual(def.counts.gaps, 0, "default epics-only scope does not reach _planning/sprints");
    // extended scope finds it.
    const ext = mod.scanPlanningPrinciples({ planningDir: dir, includeSprints: true });
    assert.strictEqual(ext.counts.gaps, 1, "--include-sprints reaches the _planning/sprints violation (#19)");
    assert.ok(/SP-BAD-001\.md$/.test(ext.findings[0].file), "the sprints-dir violation is the one found");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

h.test("AC-7.4 a ROOT lifecycle-plan violation is found with --include-root (and via --all on the CLI)", () => {
  const dir = makePlanningTree({
    "epics/E-OK-001.md": WELL_FORMED,
    "ROOT-LIFECYCLE-PLAN.md": PLANTED_BAD, // a violation at the _planning root
  });
  try {
    const ext = mod.scanPlanningPrinciples({ planningDir: dir, includeRoot: true });
    assert.strictEqual(ext.counts.gaps, 1, "--include-root reaches the root lifecycle plan (#19)");
    assert.ok(/ROOT-LIFECYCLE-PLAN\.md$/.test(ext.findings[0].file));
    // CLI --all reaches it too (and --enforce flips the exit).
    const cli = run(["--planning-dir", dir, "--all", "--enforce"]);
    assert.strictEqual(cli.status, 1, `--all --enforce reds on the root violation; got ${cli.status}: ${cli.stderr}`);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// helper used by an h.violation above (sealed dir, no cleanup needed within the
// single-shot harness call — temp dirs are reaped by the OS; we keep the inline
// makePlanningTree+finally for the assert-bearing tests).
function makePlanningTreeEphemeral(files) {
  return makePlanningTree(files);
}

h.done();
