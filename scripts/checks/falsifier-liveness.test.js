"use strict";

/**
 * falsifier-liveness.test.js — teeth for the AC-18 gauntlet gate.
 *
 * Drives the PURE core (parseTapCounts / evaluateCounts / collectFixtures) and the injectable
 * evaluate() seams (runSuite / runBuilt) so every fail-open branch is exercised WITHOUT spawning a
 * real node:test run. The load-bearing assertions: a SKIPPED falsifier BLOCKS (the AC-18 loophole),
 * an un-parseable summary BLOCKS (fail-closed), and a red `--built` BLOCKS.
 */

const test = require("node:test");
const assert = require("node:assert");
const fl = require("./falsifier-liveness.js");

test("parseTapCounts reads a well-formed node:test TAP summary", () => {
  const tap = [
    "TAP version 13",
    "1..13",
    "# tests 13",
    "# suites 0",
    "# pass 13",
    "# fail 0",
    "# cancelled 0",
    "# skipped 0",
    "# todo 0",
    "# duration_ms 42",
  ].join("\n");
  assert.deepStrictEqual(fl.parseTapCounts(tap), { tests: 13, pass: 13, fail: 0, skipped: 0 });
});

test("parseTapCounts returns null when a required count line is absent (fail-closed)", () => {
  assert.strictEqual(fl.parseTapCounts("TAP version 13\n1..0\n"), null);
  assert.strictEqual(fl.parseTapCounts(""), null);
  assert.strictEqual(fl.parseTapCounts(undefined), null);
});

test("evaluateCounts BLOCKS on a skipped falsifier (the AC-18 fail-open loophole)", () => {
  const r = fl.evaluateCounts({ tests: 13, pass: 9, fail: 0, skipped: 4 }, 13);
  assert.strictEqual(r.ok, false);
  assert.ok(r.violations.some((v) => /skipped === 4/.test(v)), "must name the skip count");
});

test("evaluateCounts BLOCKS on a failed falsifier", () => {
  const r = fl.evaluateCounts({ tests: 13, pass: 12, fail: 1, skipped: 0 }, 13);
  assert.strictEqual(r.ok, false);
  assert.ok(r.violations.some((v) => /fail === 1/.test(v)));
});

test("evaluateCounts BLOCKS when fewer tests ran than fixtures enumerated", () => {
  const r = fl.evaluateCounts({ tests: 8, pass: 8, fail: 0, skipped: 0 }, 13);
  assert.strictEqual(r.ok, false);
  assert.ok(r.violations.some((v) => /only 8 tests executed but 13/.test(v)));
});

test("evaluateCounts BLOCKS (fail-closed) on null counts", () => {
  const r = fl.evaluateCounts(null, 13);
  assert.strictEqual(r.ok, false);
  assert.ok(r.violations.some((v) => /un-parseable/.test(v)));
});

test("evaluateCounts PASSES on a fully-live suite (skipped 0, all pass)", () => {
  const r = fl.evaluateCounts({ tests: 13, pass: 13, fail: 0, skipped: 0 }, 13);
  assert.strictEqual(r.ok, true);
  assert.deepStrictEqual(r.violations, []);
});

test("collectFixtures derives falsifiers + positive companions from manifest surfaces", () => {
  const manifest = {
    surfaces: [
      { id: "a", falsifier_fixtures: ["x/f1.js", "x/f2.js"] },
      { id: "b", falsifier_fixtures: ["x/f2.js"], positive_companions: ["x/pc.js"] }, // f2 dup
    ],
  };
  const { falsifiers, companions } = fl.collectFixtures(manifest);
  assert.deepStrictEqual(falsifiers, ["x/f1.js", "x/f2.js"], "de-duplicated, stable order");
  assert.deepStrictEqual(companions, ["x/pc.js"]);
});

// ── evaluate() end-to-end with injected seams (no real spawn) ────────────────
// Uses the REAL default manifest (its fixtures exist on disk post-build) so the presence check
// passes; only the suite-run + --built are stubbed to drive the verdict branches.

const okBuilt = () => ({ ok: true, detail: "record-trust-gate: PASS (built)" });
const tap = (o) =>
  `TAP version 13\n# tests ${o.tests}\n# pass ${o.pass}\n# fail ${o.fail}\n# skipped ${o.skipped}\n`;

test("evaluate PASSES when the suite is fully live and --built is green", () => {
  const res = fl.evaluate(fl.DEFAULT_MANIFEST, {
    runSuite: (files) => ({ stdout: tap({ tests: files.length, pass: files.length, fail: 0, skipped: 0 }) }),
    runBuilt: okBuilt,
  });
  assert.strictEqual(res.ok, true, JSON.stringify(res.violations));
  assert.strictEqual(res.code, 0);
});

test("evaluate BLOCKS when a real skip appears even though --built is green", () => {
  const res = fl.evaluate(fl.DEFAULT_MANIFEST, {
    runSuite: (files) => ({ stdout: tap({ tests: files.length, pass: files.length - 2, fail: 0, skipped: 2 }) }),
    runBuilt: okBuilt,
  });
  assert.strictEqual(res.ok, false);
  assert.strictEqual(res.code, 1);
  assert.ok(res.violations.some((v) => /skipped === 2/.test(v)));
});

test("evaluate BLOCKS when --built is red even though the suite is live", () => {
  const res = fl.evaluate(fl.DEFAULT_MANIFEST, {
    runSuite: (files) => ({ stdout: tap({ tests: files.length, pass: files.length, fail: 0, skipped: 0 }) }),
    runBuilt: () => ({ ok: false, detail: "record-trust-gate: BLOCK — choke_point module missing" }),
  });
  assert.strictEqual(res.ok, false);
  assert.ok(res.violations.some((v) => /--built/.test(v)));
});

test("evaluate is fail-closed (code 2) on an unreadable manifest", () => {
  const res = fl.evaluate(fl.DEFAULT_MANIFEST + ".nope", { runSuite: () => ({ stdout: "" }), runBuilt: okBuilt });
  assert.strictEqual(res.code, 2);
  assert.strictEqual(res.ok, false);
});
