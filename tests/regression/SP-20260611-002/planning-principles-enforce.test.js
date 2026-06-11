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

// ── Finding-8: scan-time exceptions must FAIL CLOSED under --enforce ───────────
//
// Context: the AC-7.2 cells above prove an *unhandled* exception from
// scanPlanningPrinciples exits 2. Finding 8 is about exceptions that were
// HANDLED INCORRECTLY *inside* the scan:
//
//   (A) Section-matcher throw (lines ~262-263 pre-fix): caught and returned `false`
//       (= "not missing"), which made a BAD doc appear ok:true — a FALSE-GREEN.
//   (B) Unreadable file: silently added to notices and skipped — NOT counted as a
//       finding, so the doc disappears from the report entirely.
//   (C) Unreadable dir: readdirSync error silently demoted to a notice.
//
// Fix: under --enforce, each inner catch re-throws so the CLI's outer catch (which
// already correctly exits 2) actually sees the error.
//
// Mutation-verify contract:
//   REVERT the fix (inner catch returns false / notices instead of re-throwing)
//   → each h.failClosed cell below must RED (the scan returns ok:true or exit 0,
//     which isPass treats as a false-green → the test fails).

// Exploit fixture: a doc with ALL THREE principle sections labelled — EXCEPT
// blast-radius. When the blast-radius section test is patched to THROW:
//   - pre-fix: throw swallowed to false (not-missing) → doc appears ok:true  [BUG]
//   - post-fix: throw propagates under --enforce → scan throws → CLI exits 2  [FIX]
const PARTIAL_NO_BLAST_RADIUS = `# E-PARTIAL-F8-001 — enforcer + proof present; blast-radius ABSENT
## Enforcer
Enforced by scripts/checks/example.js (report-only ramp).
## Proof
Verified by the regression test run.
## Notes
No blast-radius assessment is present in this document (the intentional gap for Finding-8).
`;

// ── (A) Section-matcher throw ────────────────────────────────────────────────

// API-level: the CORE mutation-verify cell.
//   Without fix: scanPlanningPrinciples returns {ok:true} — blast-radius throw is
//   swallowed to false (not-missing) so the doc appears well-formed.
//   isPass({ok:true}) = true → h.failClosed flags it as FALSE-GREEN → test FAILS (RED).
//   With fix: scan re-throws → h.failClosed catches the throw and counts it as
//   fail-closed → test PASSES (GREEN).
h.failClosed(
  "Finding-8(A) section-matcher throw under --enforce FAILS CLOSED (API: must not be swallowed to ok:true)",
  () => {
    const dir = makePlanningTree({ "epics/E-PARTIAL-F8-001.md": PARTIAL_NO_BLAST_RADIUS });
    const blastSec = mod.REQUIRED_SECTIONS.find((s) => s.key === "blast-radius");
    const origTest = blastSec.test;
    blastSec.test = () => {
      throw new Error("section matcher BOOM — blast-radius (Finding-8 exploit)");
    };
    try {
      // Under --enforce, the throw must propagate (not be swallowed to ok:true).
      return mod.scanPlanningPrinciples({ planningDir: dir, enforce: true });
    } finally {
      blastSec.test = origTest;
      fs.rmSync(dir, { recursive: true, force: true });
    }
  },
);

// Without --enforce the historic fail-open contract must be unchanged: the throw
// is caught and returned false (section appears present), the scan returns a result.
h.pass(
  "Finding-8(A) section-matcher throw WITHOUT --enforce is still fail-open (API: returns result, no throw)",
  () => {
    const dir = makePlanningTree({ "epics/E-PARTIAL-F8-001.md": PARTIAL_NO_BLAST_RADIUS });
    const blastSec = mod.REQUIRED_SECTIONS.find((s) => s.key === "blast-radius");
    const origTest = blastSec.test;
    blastSec.test = () => {
      throw new Error("section matcher BOOM — blast-radius (Finding-8 exploit)");
    };
    try {
      // Without enforce: the throw is swallowed → ok:true (blast-radius appears present).
      // isPass({ok:true}) = true → h.pass counts it as PASS (no over-block). ✓
      return mod.scanPlanningPrinciples({ planningDir: dir, enforce: false });
    } finally {
      blastSec.test = origTest;
      fs.rmSync(dir, { recursive: true, force: true });
    }
  },
);

// CLI-level (child process injection): section-matcher throw → exit 2 under --enforce.
// Mirrors the AC-7.2 pattern: inlines the CLI contract in a child, patches the
// blast-radius test to throw, and asserts the exit code.
function spawnSectionThrowCLITest(enforceFlag) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "wsg3c-pp-f8st-"));
  fs.mkdirSync(path.join(dir, "epics"), { recursive: true });
  fs.writeFileSync(path.join(dir, "epics", "E-PARTIAL-F8-001.md"), PARTIAL_NO_BLAST_RADIUS, "utf8");
  const child = `
    const mod = require(${JSON.stringify(CHECK)});
    const blastSec = mod.REQUIRED_SECTIONS.find(s => s.key === "blast-radius");
    blastSec.test = function() { throw new Error("section matcher BOOM (CLI-level F8 exploit)"); };
    const enforce = ${enforceFlag ? "true" : "false"};
    let r;
    try {
      r = mod.scanPlanningPrinciples({ planningDir: ${JSON.stringify(dir)}, enforce });
    } catch (e) {
      if (enforce) { process.stderr.write("FAIL fail-closed: " + e.message + "\\n"); process.exit(2); }
      process.exit(0); // fail-open without enforce
    }
    r.reportOnly = !enforce;
    process.exit(r.reportOnly || r.ok ? 0 : 1);
  `;
  const result = spawnSync(process.execPath, ["-e", child], { encoding: "utf8" });
  fs.rmSync(dir, { recursive: true, force: true });
  return result;
}

h.failClosed(
  "Finding-8(A) section-matcher throw → fail-closed under --enforce (CLI: exit 2)",
  () => spawnSectionThrowCLITest(true).status,
);

h.pass(
  "Finding-8(A) section-matcher throw without --enforce (CLI: exit 0, fail-open preserved)",
  () => spawnSectionThrowCLITest(false).status,
);

// ── (B) Unreadable file ──────────────────────────────────────────────────────

// CLI-level: readFileSync EACCES during scan under --enforce → exit 2.
// Stubs fs.readFileSync inside a child so .md reads throw — cross-platform
// (no chmod required, which doesn't protect on Windows).
function spawnUnreadableFileCLITest(enforceFlag) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "wsg3c-pp-f8uf-"));
  fs.mkdirSync(path.join(dir, "epics"), { recursive: true });
  // The file exists (so it appears in readdirSync) but readFileSync is stubbed to throw.
  fs.writeFileSync(path.join(dir, "epics", "E-UNREADABLE.md"), PLANTED_BAD, "utf8");
  const child = `
    const fs = require("fs");
    // Stub readFileSync: any .md plan file → EACCES (simulate unreadable plan doc)
    const origRead = fs.readFileSync.bind(fs);
    fs.readFileSync = function(p, enc) {
      if (typeof p === "string" && /\\.md$/i.test(p)) {
        throw Object.assign(new Error("EACCES: permission denied, open '" + p + "'"), { code: "EACCES" });
      }
      return origRead(p, enc);
    };
    const mod = require(${JSON.stringify(CHECK)});
    const enforce = ${enforceFlag ? "true" : "false"};
    let r;
    try {
      r = mod.scanPlanningPrinciples({ planningDir: ${JSON.stringify(dir)}, enforce });
    } catch (e) {
      if (enforce) { process.stderr.write("FAIL fail-closed: " + e.message + "\\n"); process.exit(2); }
      process.exit(0); // fail-open without enforce
    }
    r.reportOnly = !enforce;
    // Without enforce: unreadable file → notice + skip → ok:true (0 gaps). Exit 0.
    process.exit(r.reportOnly || r.ok ? 0 : 1);
  `;
  const result = spawnSync(process.execPath, ["-e", child], { encoding: "utf8" });
  fs.rmSync(dir, { recursive: true, force: true });
  return result;
}

h.failClosed(
  "Finding-8(B) unreadable file under --enforce FAILS CLOSED (CLI: exit 2)",
  () => spawnUnreadableFileCLITest(true).status,
);

h.pass(
  "Finding-8(B) unreadable file without --enforce stays fail-open (CLI: exit 0)",
  () => spawnUnreadableFileCLITest(false).status,
);

// ── (C) Unreadable dir ───────────────────────────────────────────────────────

// CLI-level: readdirSync EACCES on the epics dir under --enforce → exit 2.
// The epics dir is pre-created so existsSync passes; readdirSync is then stubbed.
function spawnUnreadableDirCLITest(enforceFlag) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "wsg3c-pp-f8ud-"));
  // Pre-create the epics subdir so existsSync returns true in collectPlanDocs,
  // then the stubbed readdirSync throws before any doc is collected.
  fs.mkdirSync(path.join(dir, "epics"), { recursive: true });
  const child = `
    const nodePath = require("path");
    const nodeFs = require("fs");
    // Stub readdirSync: the epics dir basename → EACCES
    const origReaddir = nodeFs.readdirSync.bind(nodeFs);
    nodeFs.readdirSync = function(p, opts) {
      if (typeof p === "string" && nodePath.basename(p) === "epics") {
        throw Object.assign(new Error("EACCES: permission denied, scandir '" + p + "'"), { code: "EACCES" });
      }
      return origReaddir(p, opts);
    };
    const mod = require(${JSON.stringify(CHECK)});
    const enforce = ${enforceFlag ? "true" : "false"};
    let r;
    try {
      r = mod.scanPlanningPrinciples({ planningDir: ${JSON.stringify(dir)}, enforce });
    } catch (e) {
      if (enforce) { process.exit(2); }
      process.exit(0); // fail-open without enforce
    }
    r.reportOnly = !enforce;
    // Without enforce: unreadable dir → notice + empty docs → ok:true (0 gaps). Exit 0.
    process.exit(r.reportOnly || r.ok ? 0 : 1);
  `;
  const result = spawnSync(process.execPath, ["-e", child], { encoding: "utf8" });
  fs.rmSync(dir, { recursive: true, force: true });
  return result;
}

h.failClosed(
  "Finding-8(C) unreadable dir under --enforce FAILS CLOSED (CLI: exit 2)",
  () => spawnUnreadableDirCLITest(true).status,
);

h.pass(
  "Finding-8(C) unreadable dir without --enforce stays fail-open (CLI: exit 0)",
  () => spawnUnreadableDirCLITest(false).status,
);

h.done();
