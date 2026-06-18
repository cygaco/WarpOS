#!/usr/bin/env node
"use strict";
// Bite-test for dispatch-review.js merge logic (E-DISPATCH-PERFECT-001 W1; W1+W2-review HIGH-1/2).
// Locks the two false-greens the cross-provider review caught:
//   HIGH-1: a FAIL (or dead) lane can NEVER read as an ok dispatch (the binding-verdict false-green).
//   HIGH-2: a lane that is alive but emits no parseable verdict is fail-closed ("error"), never PASS.
const assert = require("assert");
const { verdictOf, mergeLanes } = require("./dispatch-review");

let passed = 0;
const failures = [];
function test(n, fn) {
  try {
    fn();
    passed++;
  } catch (e) {
    failures.push(`${n}: ${e.message}`);
  }
}

// ── verdictOf (HIGH-2: fail-closed) ──
test("verdictOf: parsed.verdict wins", () => assert.equal(verdictOf({ ok: true, parsed: { verdict: "FAIL" } }), "fail"));
test("verdictOf: regex on dispatch-claude raw output (no parsed)", () =>
  assert.equal(verdictOf({ ok: true, output: 'noise {"verdict":"pass"} more' }), "pass"));
test("HIGH-2: alive but NO parseable verdict → error (NOT an implicit pass)", () =>
  assert.equal(verdictOf({ ok: true, output: "looks fine, no issues found" }), "error"));
test("verdictOf: null / dead → error", () => {
  assert.equal(verdictOf(null), "error");
  assert.equal(verdictOf({ ok: false }), "error");
});

// ── mergeLanes (HIGH-1: a FAIL/dead merged verdict is never ok) ──
const L = (provider, ok, verdict) => ({ pass: provider, provider, ok, verdict });
test("all 3 pass + alive → ok:true, verdict pass", () => {
  const m = mergeLanes("security-reviewer", [L("gemini", true, "pass"), L("openai", true, "pass"), L("claude", true, "pass")]);
  assert.equal(m.ok, true);
  assert.equal(m.mergedVerdict, "pass");
  assert.equal(m.verdict, "pass");
  assert.equal(m.parsed.verdict, "pass");
});
test("HIGH-1: one FAIL lane (all processes alive) → ok:FALSE, verdict fail", () => {
  const m = mergeLanes("security-reviewer", [L("gemini", true, "pass"), L("openai", true, "fail"), L("claude", true, "pass")]);
  assert.equal(m.ok, false, "a FAIL merged verdict must NOT read as an ok dispatch");
  assert.equal(m.mergedVerdict, "fail");
  assert.equal(m.parsed.verdict, "fail");
});
test("a dead lane (not ok) → ok:FALSE, verdict error", () => {
  const m = mergeLanes("security-reviewer", [L("gemini", true, "pass"), L("openai", false, "error"), L("claude", true, "pass")]);
  assert.equal(m.ok, false);
  assert.equal(m.mergedVerdict, "error");
});
test("warn (no fail, all alive) → ok:true, verdict warn", () => {
  const m = mergeLanes("security-reviewer", [L("gemini", true, "pass"), L("openai", true, "warn"), L("claude", true, "pass")]);
  assert.equal(m.ok, true);
  assert.equal(m.mergedVerdict, "warn");
});

if (failures.length) {
  process.stderr.write(`FAIL [dispatch-review.test] ${failures.length} failure(s):\n${failures.map((f) => `  - ${f}`).join("\n")}\n`);
  process.exit(1);
}
process.stdout.write(`OK   [dispatch-review.test] ${passed} passed\n`);
