#!/usr/bin/env node
"use strict";

// ─────────────────────────────────────────────────────────────────────────────
// ac-category-coverage.test.js — S-LC-11 (Wave 5, E-LIFECYCLE-001).
//
// The 20-CATEGORY coverage axis (PLAN §11) layered ON TOP of the existing
// per-AC verified_by linkage axis. A plan/epic/sprint AC artifact must carry AC
// for all 20 enforcement-criteria categories, each with a proof. REPORT-ONLY
// ramp: a missing category is FLAGGED (exit 0), not blocked, until --enforce.
//
// PLANTED VIOLATIONS (no false-green): an artifact with N categories dropped MUST
// be flagged with EXACTLY those N named. DRIFT GUARD: the single-source list has
// exactly 20 entries and the checker + scaffold read the SAME list.
// ─────────────────────────────────────────────────────────────────────────────

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..", "..", "..");
const { harness } = require(path.join(ROOT, "scripts", "checks", "lib", "fixture-harness"));
const {
  checkCategoryCoverage,
  AC_CATEGORIES,
} = require(path.join(ROOT, "scripts", "sprint", "check-ac-coverage.js"));
const {
  AC_CATEGORIES: SRC_CATEGORIES,
  categoryChecklistMarkdown,
} = require(path.join(ROOT, "scripts", "sprint", "ac-categories.js"));
const epicPlan = require(path.join(ROOT, "scripts", "epic", "plan.js"));

const CHECK = path.join(ROOT, "scripts", "sprint", "check-ac-coverage.js");
const h = harness("S-LC-11/ac-category-coverage");

// A COMPLETE artifact: all 20 categories named + a real (non-stub) proof.
function completeArtifact() {
  return (
    "## Acceptance criteria\n\n" +
    AC_CATEGORIES.map(
      (c, i) => `- [x] **${c}** — proof: fixture-${i}.test.js::case${i}`,
    ).join("\n") +
    "\n"
  );
}

// A PARTIAL artifact that drops the given categories entirely.
function artifactMissing(drop) {
  return (
    "## Acceptance criteria\n\n" +
    AC_CATEGORIES.filter((c) => !drop.includes(c))
      .map((c, i) => `- [x] **${c}** — proof: fixture-${i}.test.js::case${i}`)
      .join("\n") +
    "\n"
  );
}

// ── DRIFT GUARD: exactly 20, single-sourced, no drift between consumers ────────
h.pass("single-source list has exactly 20 categories", () => AC_CATEGORIES.length === 20);
h.pass("checker + source agree on the list (no drift)", () =>
  JSON.stringify(AC_CATEGORIES) === JSON.stringify(SRC_CATEGORIES),
);

// ── COMPLETE artifact → no finding ────────────────────────────────────────────
h.pass("complete artifact (all 20 named + proven) → ok, zero uncovered", () => {
  const r = checkCategoryCoverage(completeArtifact());
  return r.ok === true && r.uncovered.length === 0 && r.covered === 20;
});

// ── PLANTED VIOLATION: drop N categories → not-a-pass (FLAGGED) ────────────────
h.violation("artifact missing categories is FLAGGED (not a pass) — no false-green", () => {
  const dropped = [AC_CATEGORIES[2], AC_CATEGORIES[11], AC_CATEGORIES[18]];
  return checkCategoryCoverage(artifactMissing(dropped)); // { ok:false, findings:[...] }
});

// ── … and the EXACT N dropped categories are the ones named ───────────────────
h.test("the N dropped categories are named EXACTLY in `missing`", () => {
  const dropped = [AC_CATEGORIES[2], AC_CATEGORIES[11], AC_CATEGORIES[18]];
  const r = checkCategoryCoverage(artifactMissing(dropped));
  assert.deepStrictEqual(
    [...r.missing].sort(),
    [...dropped].sort(),
    "exactly the dropped categories are missing",
  );
  assert.strictEqual(r.uncovered.length, dropped.length, "uncovered == dropped");
  assert.strictEqual(r.covered, 20 - dropped.length, "the rest stay covered");
});

// ── A bare stub (`proof: TODO`) is named-but-unproven, distinct from missing ──
h.test("a fresh scaffold is 20 named_no_proof, 0 covered, 0 missing", () => {
  const r = checkCategoryCoverage(categoryChecklistMarkdown());
  assert.strictEqual(r.covered, 0, "fresh scaffold proves nothing");
  assert.strictEqual(r.named_no_proof.length, 20, "all 20 named but unproven");
  assert.strictEqual(r.missing.length, 0, "all 20 ARE named");
  assert.strictEqual(r.ok, false, "an all-stub scaffold is not complete");
});

// ── FAIL-OPEN: a missing file reports nothing + exits 0 (report-only) ─────────
h.test("CLI --categories --file <nonexistent> fails open (exit 0)", () => {
  const r = spawnSync(
    process.execPath,
    [CHECK, "--categories", "--file", path.join(ROOT, "no", "such", "file.md")],
    { encoding: "utf8" },
  );
  assert.strictEqual(r.status, 0, `fail-open expected exit 0, got ${r.status}: ${r.stderr}`);
});

// ── --enforce flips report-only → blocking on a planted-bad artifact ──────────
h.test("CLI default is report-only (exit 0); --enforce blocks (exit 1) on a gap", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "warpos-acc-"));
  try {
    const f = path.join(tmp, "ac.md");
    fs.writeFileSync(f, artifactMissing([AC_CATEGORIES[0]]), "utf8");
    // default (report-only) → exit 0 even with a gap
    let r = spawnSync(process.execPath, [CHECK, "--categories", "--file", f], { encoding: "utf8" });
    assert.strictEqual(r.status, 0, `report-only: gap flagged but exit 0 (got ${r.status})`);
    assert.ok(/FLAGGED/.test(r.stdout), "the gap is surfaced in findings");
    // --enforce → exit 1
    r = spawnSync(process.execPath, [CHECK, "--categories", "--file", f, "--enforce"], { encoding: "utf8" });
    assert.strictEqual(r.status, 1, `--enforce: gap blocks (exit 1), got ${r.status}`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

// ── /epic:plan's emitted plan artifact now carries all 20 category stubs ──────
h.test("/epic:plan (buildEpic) emits all 20 category stubs in the plan artifact", () => {
  const built = epicPlan.buildEpic({
    epicId: "E-EXAMPLE-001",
    title: "S-LC-11 scaffold test",
    definitionOfDone: ["proven by this test"],
    date: "2026-06-09",
  });
  assert.ok(built.ok, `epic build must succeed: ${(built.errors || []).join("; ")}`);
  for (const cat of AC_CATEGORIES) {
    assert.ok(built.plan.includes(`**${cat}**`), `plan artifact names category "${cat}"`);
  }
  // The scaffold reads as 20 named-but-unproven by the same checker (round-trip).
  const cov = checkCategoryCoverage(built.plan);
  assert.strictEqual(cov.missing.length, 0, "all 20 categories are named in the emitted plan");
  assert.strictEqual(cov.named_no_proof.length, 20, "all 20 are stubs awaiting proof");
});

h.done();
