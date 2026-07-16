#!/usr/bin/env node
"use strict";
// Bite-test for dispatch-review.js merge logic (E-DISPATCH-PERFECT-001 W1; W1+W2-review HIGH-1/2).
// Locks the two false-greens the cross-provider review caught:
//   HIGH-1: a FAIL (or dead) lane can NEVER read as an ok dispatch (the binding-verdict false-green).
//   HIGH-2: a lane that is alive but emits no parseable verdict is fail-closed ("error"), never PASS.
const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { verdictOf, mergeLanes, persistLane, laneFileName } = require("./dispatch-review");

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

test("re-review NEW: an ALIVE lane with verdict:error (unparseable) → ok:FALSE, verdict error", () => {
  const m = mergeLanes("security-reviewer", [L("gemini", true, "pass"), L("openai", true, "error"), L("claude", true, "pass")]);
  assert.equal(m.ok, false, "an alive-but-no-parseable-verdict binding lane must HOLD the review (not merge to pass)");
  assert.equal(m.mergedVerdict, "error");
});
test("fail beats error (anyFail precedence)", () => {
  const m = mergeLanes("security-reviewer", [L("gemini", true, "error"), L("openai", true, "fail"), L("claude", true, "pass")]);
  assert.equal(m.ok, false);
  assert.equal(m.mergedVerdict, "fail");
});

// ── Lone-survivor merge honesty (verdict not buried; below-bar surfaced) ──
test("lone survivor: 2 lanes dead + 1 GPT alive PASS → below_bar, surviving_verdict surfaced, still fail-closed", () => {
  const m = mergeLanes("security-reviewer", [L("gemini", false, "error"), L("claude", false, "error"), L("openai", true, "pass")]);
  assert.equal(m.ok, false, "diversity loss holds — a 1-family security verdict is invalid (fail-closed)");
  assert.equal(m.below_bar, true, "a multi-lab review collapsed to <2 families is below-bar");
  assert.equal(m.live_families, 1);
  assert.equal(m.surviving_verdict, "pass", "the GPT survivor's real verdict is SURFACED, not buried under 'error'");
  assert.ok(m.surviving_lanes.length === 1 && m.surviving_lanes[0].provider === "openai");
});
test("full diversity (3 live families) → not below_bar", () => {
  const m = mergeLanes("security-reviewer", [L("gemini", true, "pass"), L("openai", true, "pass"), L("claude", true, "pass")]);
  assert.equal(m.below_bar, false);
  assert.equal(m.live_families, 3);
  assert.equal(m.ok, true);
});
test("single-pass role (1 lane) → not below_bar (1-family by design, not a collapse)", () => {
  const m = mergeLanes("qa-reviewer", [L("openai", true, "pass")]);
  assert.equal(m.below_bar, false, "a single-pass review is not a diversity COLLAPSE");
  assert.equal(m.multipass, false);
});

// ── Lane-persistence (the recoverable-per-lane-evidence gap) ──
test("persistLane writes the raw stdout to <dir>/<pass>.txt and returns the path", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lane-"));
  const p = persistLane(dir, "second_pass", "FULL GPT SECURITY FINDINGS\n- issue 1\n- issue 2", "");
  assert.ok(p && fs.existsSync(p), "lane file must exist");
  assert.ok(/second_pass\.txt$/.test(p), "filename derives from the pass key");
  assert.equal(fs.readFileSync(p, "utf8"), "FULL GPT SECURITY FINDINGS\n- issue 1\n- issue 2");
});
test("persistLane writes stderr sidecar when non-empty", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lane-"));
  const p = persistLane(dir, "primary", "", "reap: 0-byte");
  assert.ok(fs.existsSync(p) && fs.readFileSync(p, "utf8") === "", "empty stdout still persisted (dead-lane diagnostic)");
  assert.ok(fs.existsSync(p.replace(/\.txt$/, ".stderr.txt")), "stderr sidecar written");
});
test("persistLane: no dir → null (best-effort, never throws)", () => {
  assert.equal(persistLane(null, "x", "out", ""), null);
});
test("laneFileName sanitizes the pass key", () => {
  assert.equal(laneFileName("second_pass"), "second_pass.txt");
  assert.equal(laneFileName("a/b c"), "a_b_c.txt");
  assert.equal(laneFileName(""), "pass.txt");
});

if (failures.length) {
  process.stderr.write(`FAIL [dispatch-review.test] ${failures.length} failure(s):\n${failures.map((f) => `  - ${f}`).join("\n")}\n`);
  process.exit(1);
}
process.stdout.write(`OK   [dispatch-review.test] ${passed} passed\n`);
