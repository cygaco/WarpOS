#!/usr/bin/env node
"use strict";

/**
 * SP-20260611-002 WS-G3a (R-5, T-318) — coverage-gate-scan EXTERNAL expected-source.
 * Surface: scripts/checks/coverage-gate-scan.js (per-surface isolation, Hard AC #4).
 *
 * AC-5.3 — `expected` must derive from an EXTERNAL source (registry / sprint
 *          composition), NOT only the roles that CLAIM ok:true in the run. So a
 *          role that produced NO record is still EXPECTED → still a gap (the
 *          "omitted-role slip" is closed).
 *
 * Records here are PLAIN OBJECTS namespaced to this test (Hard AC #9 / P-059).
 *
 *   node tests/regression/SP-20260611-002/coverage-gate-scan-source.test.js
 */

const path = require("path");
const assert = require("assert");
const ROOT = path.resolve(__dirname, "..", "..", "..");
const { harness } = require(path.join(ROOT, "scripts", "checks", "lib", "fixture-harness"));
const { auditLedger, resolveExpected } = require(path.join(ROOT, "scripts", "checks", "coverage-gate-scan"));
const { ARGV_SCHEMA_VERSION } = require(path.join(ROOT, "scripts", "dispatch", "dispatch-contract"));

const h = harness("SP-002-WS-G3a/coverage-gate-scan-source");
const RUN = "run-wsg3a-source";

// A realistic post-§17.4 BACKED record (so the present role legitimately covers).
function rec(over) {
  return {
    dispatch_id: "d-1",
    cmdline_checksum: "sha256:deadbeef",
    run_id: RUN,
    role: "x",
    provider: "openai",
    ok: true,
    argv_schema_version: ARGV_SCHEMA_VERSION,
    output_digest: "sha256:feedface00000000000000000000",
    ts: "2026-06-11T12:00:00Z", // post-cutoff so legacy scoping does not exempt it
    ...over,
  };
}

// ── AC-5.3: the OLD self-derive MISSES an omitted role (this is the bug) ──────
// A run where security-reviewer produced NO record. With the OLD expected =
// "distinct ok:true roles", security-reviewer was never expected, so its omission
// read clean. With the EXTERNAL source naming it, it is a GAP.
const recordsOmittingReviewer = [
  rec({ role: "frontend-builder", provider: "claude", dispatch_id: "d-fb" }),
  // (no security-reviewer record at all)
];

// The external source = a registry / sprint-composition derived set naming BOTH
// roles the run was COMPOSED to require, independent of what produced records.
const externalSource = { [RUN]: ["frontend-builder", "security-reviewer"] };

h.violation("AC-5.3 an omitted role (no record) is STILL expected from the external source → gap", () => {
  const audit = auditLedger(recordsOmittingReviewer, { expectedSource: externalSource });
  // security-reviewer is in the external set but produced no record → a violation.
  return { ok: audit.totalViolations === 0, violations: audit.runs.flatMap((r) => r.violations) };
});

// Prove the CLOSED hole concretely: the omitted role is named in the violation.
h.test("AC-5.3 the gap names the omitted (no-record) role", () => {
  const audit = auditLedger(recordsOmittingReviewer, { expectedSource: externalSource });
  const allV = audit.runs.flatMap((r) => r.violations).join(" | ");
  assert.ok(/security-reviewer/.test(allV), `expected a gap naming security-reviewer; got: ${allV}`);
});

// ── KNOWN-ANSWER: the SAME run with BOTH records present passes (no false-positive) ─
h.pass("AC-5.3 when every externally-expected role DID produce a record → no gap", () => {
  const records = [
    rec({ role: "frontend-builder", provider: "claude", dispatch_id: "d-fb" }),
    rec({ role: "security-reviewer", provider: "gemini", dispatch_id: "d-sr" }),
  ];
  const audit = auditLedger(records, { expectedSource: externalSource });
  return { ok: audit.totalViolations === 0, violations: audit.runs.flatMap((r) => r.violations) };
});

// ── DEMONSTRATE the OLD behavior was a false-green (regression guard) ──────────
// WITHOUT an external source, the legacy self-derive does NOT flag the omitted role
// (it only knows roles that produced records). This asserts the fix is load-bearing:
// the external source is what turns the omission into a gap.
h.test("AC-5.3 the self-derive fallback alone does NOT catch the omitted role (why external is needed)", () => {
  const audit = auditLedger(recordsOmittingReviewer); // no expectedSource → self-derive only
  const allV = audit.runs.flatMap((r) => r.violations).join(" | ");
  assert.ok(!/security-reviewer/.test(allV), "self-derive cannot know about a role that produced no record");
});

// ── unit: resolveExpected UNIONs external with claimed (never shrinks) ─────────
h.test("resolveExpected UNIONs the external set with claimed roles", () => {
  const runRecs = [{ ok: true, role: "frontend-builder" }];
  const out = resolveExpected({ [RUN]: ["security-reviewer"] }, RUN, runRecs).map((e) => e.role).sort();
  assert.deepStrictEqual(out, ["frontend-builder", "security-reviewer"]);
});

// ── FAIL-CLOSED: a throwing expectedSource function does not silently pass ─────
h.failClosed("AC-5.3 a throwing external source does not yield a silent green", () => {
  const audit = auditLedger(recordsOmittingReviewer, {
    expectedSource: () => {
      throw new Error("registry unreadable");
    },
  });
  // A throwing source must produce a per-run violation (fail-closed), never green.
  return { ok: audit.totalViolations === 0, violations: audit.runs.flatMap((r) => r.violations) };
});

h.done();
