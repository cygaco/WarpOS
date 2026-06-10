#!/usr/bin/env node
"use strict";

// ─────────────────────────────────────────────────────────────────────────────
// parallelism.test.js — S-LC-06. The parallelism axis in dispatch-shape.js:
//   UNDER-dispatch — safe-parallel disjoint units run SERIALLY → flagged.
//   OVER-dispatch  — units targeting the SAME file/worktree run in PARALLEL → flagged.
// Findings are ADVISORY (report-only) this sprint (no block). FAIL-OPEN: a detector
// error / garbage input → [] (no finding), never throws.
// ─────────────────────────────────────────────────────────────────────────────

const assert = require("assert");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..", "..");
const { harness } = require(path.join(ROOT, "scripts", "checks", "lib", "fixture-harness"));
const { parallelismFindings } = require(path.join(ROOT, "scripts", "dispatch", "dispatch-shape"));

const h = harness("S-LC-06/parallelism");

// Wrap an array of findings so the harness interprets non-empty = "detected".
const wrap = (findings) => ({ findings });

// ── PLANTED: disjoint units dispatched serially → UNDER-dispatch finding ──
h.violation("planted serial + disjoint units → UNDER-dispatch finding detected", () =>
  wrap(parallelismFindings({
    arrangement: "serial",
    units: [{ id: "feat-a", files: ["src/a.ts"] }, { id: "feat-b", files: ["src/b.ts"] }],
  })));

// ── PLANTED: same-file units dispatched in parallel → OVER-dispatch finding ──
h.violation("planted parallel + same-file units → OVER-dispatch finding detected", () =>
  wrap(parallelismFindings({
    arrangement: "parallel",
    units: [{ id: "u1", files: ["src/shared.ts"] }, { id: "u2", files: ["src/shared.ts"] }],
  })));

// ── PLANTED: same-worktree units in parallel → OVER-dispatch (worktree collision) ──
h.violation("planted parallel + same-worktree units → OVER-dispatch finding detected", () =>
  wrap(parallelismFindings({
    arrangement: "parallel",
    units: [{ id: "u1", worktree: "wt-x" }, { id: "u2", worktree: "wt-x" }],
  })));

// ── precise shape assertions ──
h.test("UNDER-dispatch finding: kind/severity/advisory + lanes are correct", () => {
  const f = parallelismFindings({
    arrangement: "serial",
    units: [{ id: "a", files: ["x"] }, { id: "b", files: ["y"] }, { id: "c", files: ["x"] }],
  });
  assert.strictEqual(f.length, 1, JSON.stringify(f));
  assert.strictEqual(f[0].kind, "under-dispatch");
  assert.strictEqual(f[0].advisory, true, "must be advisory (report-only)");
  assert.strictEqual(f[0].severity, "low");
  // a & c share file "x" → one lane; b alone → another lane. 2 disjoint lanes.
  assert.strictEqual(f[0].lanes.length, 2, JSON.stringify(f[0].lanes));
});

h.test("OVER-dispatch finding: kind/severity/advisory + names the colliding resource", () => {
  const f = parallelismFindings({
    arrangement: "parallel",
    units: [{ id: "u1", files: ["src/shared.ts"] }, { id: "u2", files: ["src/shared.ts"] }],
  });
  assert.strictEqual(f.length, 1, JSON.stringify(f));
  assert.strictEqual(f[0].kind, "over-dispatch");
  assert.strictEqual(f[0].advisory, true);
  assert.strictEqual(f[0].severity, "high");
  assert.strictEqual(f[0].collisions[0].resource, "file:src/shared.ts");
});

// ── NO false positives ──
h.test("parallel + disjoint units → NO finding (correctly parallelized)", () => {
  const f = parallelismFindings({
    arrangement: "parallel",
    units: [{ id: "a", files: ["x"] }, { id: "b", files: ["y"] }],
  });
  assert.deepStrictEqual(f, [], JSON.stringify(f));
});

h.test("serial + colliding units → NO under-dispatch finding (serial is correct for them)", () => {
  const f = parallelismFindings({
    arrangement: "serial",
    units: [{ id: "a", files: ["x"] }, { id: "b", files: ["x"] }],
  });
  assert.deepStrictEqual(f, [], JSON.stringify(f));
});

h.test("a single unit → NO finding (parallelism needs ≥2 units)", () => {
  assert.deepStrictEqual(parallelismFindings({ arrangement: "serial", units: [{ id: "solo" }] }), []);
});

// ── advisory: findings never carry a `block`/`mismatch:false`-style hard gate ──
h.test("every parallelism finding is advisory (report-only this sprint — no block)", () => {
  const all = [
    ...parallelismFindings({ arrangement: "serial", units: [{ id: "a", files: ["x"] }, { id: "b", files: ["y"] }] }),
    ...parallelismFindings({ arrangement: "parallel", units: [{ id: "a", files: ["x"] }, { id: "b", files: ["x"] }] }),
  ];
  assert.ok(all.length >= 2);
  for (const f of all) assert.strictEqual(f.advisory, true, `finding not advisory: ${JSON.stringify(f)}`);
});

// ── FAIL-OPEN: garbage / malformed input → [] and never throws ──
h.test("fail-open: null / non-array units / missing fields → [] and never throws", () => {
  assert.deepStrictEqual(parallelismFindings(null), []);
  assert.deepStrictEqual(parallelismFindings(undefined), []);
  assert.deepStrictEqual(parallelismFindings({ units: "not-an-array" }), []);
  assert.deepStrictEqual(parallelismFindings({ units: [{}, {}] }), []); // no ids → filtered out
  assert.deepStrictEqual(parallelismFindings({ arrangement: "parallel", units: [{ id: "a" }, { id: "b" }] }), []); // no resources → no overlap, no lanes split... single component? see below
});

h.done();
