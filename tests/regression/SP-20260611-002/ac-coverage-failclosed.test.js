#!/usr/bin/env node
"use strict";

/**
 * SP-20260611-002 WS-G3c (R-8, T-320) — check-ac-coverage --enforce fail-closed +
 * legacy scoping. Surface (per-surface exploit isolation, Hard AC #4):
 * scripts/sprint/check-ac-coverage.js. A red here localizes to THIS file only.
 *
 * AC-8.1: a planted-MISSING / unreadable NAMED artifact under --enforce is a FAILURE
 *         (exit non-zero) — closing the {error:"unreadable", ok:true} → exit-0
 *         false-green (#18). report-only stays exit 0.
 * AC-8.2: a no-target / greenfield run (no NAMED artifact at all) PRESERVES fail-open
 *         even under --enforce — the fail-closed is for a NAMED-but-unreadable
 *         artifact, NOT the absence of any target.
 * AC-8.3: legacy scoping consumes the SAME shared cutoff helper as R-5 (IMPORTED,
 *         cutoffFor("check-ac-coverage")); a post-cutoff named-unreadable artifact
 *         still REDS (scope-then-flip), a pre-cutoff (historic) one is legacy-exempt.
 * AC-8.4: the proof-syntax weakness (chunkHasProof accepts "proof: yes") is a
 *         DOCUMENTED RESIDUE — asserted present (still lenient) + the carried-residue
 *         note is in the source, so it is recorded, not silently dropped.
 *
 *   node tests/regression/SP-20260611-002/ac-coverage-failclosed.test.js
 */

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..", "..", "..");
const { harness } = require(path.join(ROOT, "scripts", "checks", "lib", "fixture-harness"));
const CHECK = path.join(ROOT, "scripts", "sprint", "check-ac-coverage.js");
const mod = require(CHECK);
const cutoffMod = require(path.join(ROOT, "scripts", "dispatch", "legacy-cutoff"));

const h = harness("SP-002-WS-G3c/ac-coverage-failclosed");

// Capture runCategoryMode's exit code while swallowing its stdout (it writes prose).
function runCat(args, inject) {
  const realWrite = process.stdout.write;
  process.stdout.write = () => true;
  try {
    return mod.runCategoryMode({ json: false, categories: true, ...args }, inject);
  } finally {
    process.stdout.write = realWrite;
  }
}

function cli(extra) {
  const r = spawnSync(process.execPath, [CHECK, "--categories", ...extra], {
    cwd: ROOT,
    encoding: "utf8",
  });
  return { status: r.status, stdout: r.stdout || "", stderr: r.stderr || "" };
}

const CUTOFF = cutoffMod.cutoffFor("check-ac-coverage");
const PRE = "20260101"; // a sprint-id date segment safely BEFORE the cutoff
const POST = "20271231"; // safely AFTER the cutoff

// A NAMED target whose path does NOT exist (planted-missing). `date` drives legacy.
function missingNamedTarget(date) {
  return {
    label: date ? `SP-${date}-001` : "named-missing.md",
    path: path.join(os.tmpdir(), `wsg3c-does-not-exist-${Date.now()}-${Math.random()}.md`),
    named: true,
    date: date ? `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}` : null,
  };
}

// ── AC-8.1: a NAMED-but-unreadable artifact REDS under --enforce ──────────────
h.violation("AC-8.1 a planted-missing NAMED artifact REDS under --enforce", () => {
  // injected named, undatable (in-scope) target → fail-closed exit 1 under --enforce.
  return runCat({ enforce: true }, { targets: [missingNamedTarget(null)] }); // 1 → caught
});

h.pass("AC-8.1 the SAME missing NAMED artifact is report-only (exit 0) WITHOUT --enforce", () => {
  return runCat({ enforce: false }, { targets: [missingNamedTarget(null)] }); // 0
});

h.violation("AC-8.1 (CLI) --file <nonexistent> --enforce REDS (exit non-zero)", () => {
  const r = cli(["--file", path.join(ROOT, "no", "such", "ac.md"), "--enforce"]);
  return r.status; // 1 → caught (isPass(1) === false)
});

h.pass("AC-8.1 (CLI) --file <nonexistent> WITHOUT --enforce is fail-open (exit 0)", () => {
  // Historic report-only posture: a missing --file is FLAGGED but not blocking.
  return cli(["--file", path.join(ROOT, "no", "such", "ac.md")]).status; // 0
});

// ── AC-8.2: greenfield (no NAMED target) PRESERVES fail-open under --enforce ──
h.pass("AC-8.2 a no-target/greenfield run is fail-open (exit 0) even under --enforce", () => {
  // inject an EMPTY target list → no named artifact at all → must NOT red.
  return runCat({ enforce: true }, { targets: [] }); // 0 — greenfield fail-open
});

h.test("AC-8.2 greenfield exit-0 is distinct from the AC-8.1 named-unreadable RED", () => {
  const green = runCat({ enforce: true }, { targets: [] });
  const named = runCat({ enforce: true }, { targets: [missingNamedTarget(null)] });
  assert.strictEqual(green, 0, "greenfield (no target) is fail-open exit 0 under --enforce");
  assert.strictEqual(named, 1, "a NAMED unreadable artifact is fail-CLOSED exit 1 under --enforce");
});

// ── AC-8.3: shared cutoff IMPORTED + scope-then-flip ───────────────────────────
h.test("AC-8.3 the cutoff is the SHARED helper (IMPORTED), not a re-defined literal", () => {
  // The source must require ../dispatch/legacy-cutoff and use cutoffFor — assert the
  // resolved cutoff equals the shared default and the consumer is declared on it.
  assert.ok(cutoffMod.CONSUMERS.includes("check-ac-coverage"),
    "check-ac-coverage must be a declared consumer of the shared cutoff");
  assert.strictEqual(CUTOFF, cutoffMod.LEGACY_CUTOFF,
    "check-ac-coverage resolves the shared LEGACY_CUTOFF (no independent literal)");
  // And the source genuinely IMPORTS it (not a forked copy).
  const src = fs.readFileSync(CHECK, "utf8");
  assert.ok(/require\(["']\.\.\/dispatch\/legacy-cutoff["']\)/.test(src),
    "check-ac-coverage.js imports ../dispatch/legacy-cutoff (shared helper, not forked)");
  assert.ok(!/LEGACY_CUTOFF\s*=\s*["']\d{4}-\d{2}-\d{2}["']/.test(src),
    "check-ac-coverage.js must NOT re-define a second cutoff literal");
});

h.violation("AC-8.3 a POST-cutoff named-unreadable artifact still REDS under --enforce (scope-then-flip)", () => {
  return runCat({ enforce: true }, { targets: [missingNamedTarget(POST)] }); // 1 → caught
});

h.pass("AC-8.3 a PRE-cutoff (historic) named-unreadable artifact is LEGACY-EXEMPT (exit 0)", () => {
  // A historic sprint predating the cutoff: its unreadable artifact does NOT red the
  // new enforce path — legacy scoping exempts only genuinely historic records.
  return runCat({ enforce: true }, { targets: [missingNamedTarget(PRE)] }); // 0
});

h.test("AC-8.3 sprintIsoDate parses the id date + legacy boundary holds", () => {
  assert.strictEqual(mod.sprintIsoDate("SP-20260101-001"), "2026-01-01");
  assert.strictEqual(mod.sprintIsoDate("SP-20271231-009"), "2027-12-31");
  assert.strictEqual(mod.sprintIsoDate("not-a-sprint"), null, "unparsable id ⇒ null (undatable ⇒ in scope)");
  // boundary: pre < cutoff is legacy; post >= cutoff is in scope.
  assert.strictEqual(cutoffMod.isLegacyDate("2026-01-01", CUTOFF), true);
  assert.strictEqual(cutoffMod.isLegacyDate("2027-12-31", CUTOFF), false);
  assert.strictEqual(cutoffMod.isLegacyDate(null, CUTOFF), false, "undatable ⇒ NOT legacy (fail-closed)");
});

// ── AC-8.4: DOCUMENTED RESIDUE (proof-syntax weakness carried, not fixed) ─────
h.test("AC-8.4 chunkHasProof STILL accepts 'proof: yes' (lenient, residue) — recorded not fixed", () => {
  // The weakness is INTENTIONALLY unfixed this sprint; assert it is still present so
  // the residue is observable (a future ticket tightens it). If this ever flips to
  // false, the residue was silently "fixed" without a ticket — which is exactly what
  // the documented-residue note guards against.
  assert.strictEqual(mod.chunkHasProof("proof: yes"), true,
    "proof-syntax residue: 'proof: yes' is still accepted (carried, not fixed this sprint)");
  // The carried-residue note must be present in the source so it is recorded.
  const src = fs.readFileSync(CHECK, "utf8");
  assert.ok(/AC-8\.4\s*—\s*DOCUMENTED RESIDUE/.test(src),
    "the AC-8.4 documented-residue note must be present in check-ac-coverage.js");
});

h.done();
