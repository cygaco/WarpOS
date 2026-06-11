#!/usr/bin/env node
"use strict";

/**
 * SP-20260611-002 WS-G3a (R-5, T-318) — SHARED legacy-scoping cutoff.
 * Surface: scripts/dispatch/legacy-cutoff.js (the ONE shared cutoff) + its
 * consumption by coverage-gate-scan (R-5). check-ac-coverage (R-8/WS-G3c) consumes
 * the SAME helper — this test pins the shared-cutoff CONTRACT so R-8 cannot fork it.
 *
 * AC-5.4 (SHARED CUTOFF — Hard AC #3): ONE shared RECORD_BACKED_CUTOFF-style cutoff
 *        consumed by BOTH consumers; if their enforce-path wiring dates genuinely
 *        differ, the divergence is EXPLICIT per-ticket with a written rationale —
 *        never two independently-drifting cutoffs.
 * AC-5.5 (SCOPE-THEN-FLIP): a planted coverage violation dated AFTER the cutoff
 *        still REDS — legacy scoping exempts only genuinely historic records, never
 *        the new enforce path.
 *
 *   node tests/regression/SP-20260611-002/legacy-cutoff-shared.test.js
 */

const path = require("path");
const assert = require("assert");
const ROOT = path.resolve(__dirname, "..", "..", "..");
const { harness } = require(path.join(ROOT, "scripts", "checks", "lib", "fixture-harness"));
const cutoffMod = require(path.join(ROOT, "scripts", "dispatch", "legacy-cutoff"));
const { auditLedger } = require(path.join(ROOT, "scripts", "checks", "coverage-gate-scan"));
const { ARGV_SCHEMA_VERSION } = require(path.join(ROOT, "scripts", "dispatch", "dispatch-contract"));

const h = harness("SP-002-WS-G3a/legacy-cutoff-shared");
const { LEGACY_CUTOFF, cutoffFor, isLegacyDate, recordIsLegacy, CONSUMER_OVERRIDES, CONSUMERS } = cutoffMod;
const RUN = "run-wsg3a-legacy";

// ── AC-5.4: ONE shared cutoff, consumed identically by BOTH consumers ─────────
h.test("AC-5.4 there is a single shared cutoff constant", () => {
  assert.strictEqual(typeof LEGACY_CUTOFF, "string");
  assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(LEGACY_CUTOFF), `LEGACY_CUTOFF must be ISO YYYY-MM-DD, got ${LEGACY_CUTOFF}`);
});

h.test("AC-5.4 both named consumers resolve to the SAME cutoff (no independent drift)", () => {
  const a = cutoffFor("coverage-gate-scan"); // R-5 (this ticket)
  const b = cutoffFor("check-ac-coverage"); // R-8 (WS-G3c, consumes this helper)
  assert.ok(CONSUMERS.includes("coverage-gate-scan") && CONSUMERS.includes("check-ac-coverage"),
    "both consumers must be declared on the shared helper");
  assert.strictEqual(a, b, "the two consumers must share ONE cutoff");
  assert.strictEqual(a, LEGACY_CUTOFF, "with no declared override, both follow the shared default");
});

h.test("AC-5.4 ANY divergence must be EXPLICIT (override carries a written rationale)", () => {
  // The escape hatch is allowed ONLY when declared with a rationale. If a future
  // override ever appears, this guard forces it to be self-documenting — never a
  // second silent literal.
  for (const [name, ov] of Object.entries(CONSUMER_OVERRIDES)) {
    assert.ok(ov && typeof ov.cutoff === "string", `override '${name}' must name a cutoff`);
    assert.ok(ov.rationale && String(ov.rationale).trim().length > 0,
      `override '${name}' must carry a written rationale (no silent drift)`);
  }
});

// ── AC-5.5: SCOPE-THEN-FLIP — a post-cutoff violation still REDS ───────────────
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
    ...over,
  };
}

// PLANTED: a run dated AFTER the cutoff whose external-expected role produced NO
// record (a real coverage gap). Legacy scoping must NOT exempt it — it still REDS.
const POST = "2026-12-31T00:00:00Z"; // safely after the cutoff
h.violation("AC-5.5 a post-cutoff planted coverage violation still REDS", () => {
  const records = [rec({ role: "frontend-builder", provider: "claude", ts: POST })];
  const audit = auditLedger(records, {
    expectedSource: { [RUN]: ["frontend-builder", "security-reviewer"] }, // reviewer omitted
  });
  return { ok: audit.totalViolations === 0, violations: audit.runs.flatMap((r) => r.violations) };
});

// KNOWN-ANSWER: the SAME shape of gap, but dated BEFORE the cutoff, is EXEMPT
// (historic record) — its violation is moved to INFO, not counted as a gap.
const PRE = "2026-01-01T00:00:00Z"; // safely before the cutoff
h.pass("AC-5.5 a pre-cutoff (historic) record's gap is legacy-exempt (not a gap)", () => {
  const records = [rec({ role: "frontend-builder", provider: "claude", ts: PRE })];
  const audit = auditLedger(records, {
    expectedSource: { [RUN]: ["frontend-builder", "security-reviewer"] }, // reviewer omitted
  });
  return { ok: audit.totalViolations === 0, violations: audit.runs.flatMap((r) => r.violations) };
});

// Prove the legacy exemption did not SILENTLY DROP the finding — it is preserved as
// legacyViolations on the run (scope-then-flip keeps a record of the historic gap).
h.test("AC-5.5 a legacy-exempt run preserves its finding as legacyViolations (not silently dropped)", () => {
  const records = [rec({ role: "frontend-builder", provider: "claude", ts: PRE })];
  const audit = auditLedger(records, {
    expectedSource: { [RUN]: ["frontend-builder", "security-reviewer"] },
  });
  assert.strictEqual(audit.totalViolations, 0, "pre-cutoff gap is not counted");
  assert.strictEqual(audit.legacyExemptRuns, 1, "the run is recorded as legacy-exempt");
  const run = audit.runs.find((r) => r.legacyExempt);
  assert.ok(run && Array.isArray(run.legacyViolations) && run.legacyViolations.length > 0,
    "the historic finding is preserved (not silently dropped)");
});

// ── unit: the cutoff boundary + fail-closed on undated ────────────────────────
h.test("isLegacyDate boundary: < cutoff legacy, == cutoff in-scope, undated in-scope", () => {
  const cut = LEGACY_CUTOFF;
  const dayBefore = new Date(new Date(cut + "T00:00:00Z").getTime() - 86400000).toISOString().slice(0, 10);
  assert.strictEqual(isLegacyDate(dayBefore, cut), true, "day before the cutoff is legacy");
  assert.strictEqual(isLegacyDate(cut, cut), false, "the cutoff day itself is IN SCOPE (>=)");
  assert.strictEqual(isLegacyDate(null, cut), false, "undated is NOT legacy (fail-closed)");
  assert.strictEqual(isLegacyDate("not-a-date", cut), false, "unparseable is NOT legacy (fail-closed)");
  assert.strictEqual(recordIsLegacy({ ts: dayBefore }, { cutoff: cut }), true);
  assert.strictEqual(recordIsLegacy({}, { cutoff: cut }), false, "no extractable date ⇒ NOT legacy");
});

// ── FAIL-CLOSED: an undated post-everything record is never auto-exempted ──────
h.failClosed("AC-5.5 an UNDATED run is NOT auto-exempted (still in scope of the enforce path)", () => {
  // No ts on the record → run is undated → NOT legacy → the omitted role still REDS.
  const records = [rec({ role: "frontend-builder", provider: "claude" })]; // no ts
  const audit = auditLedger(records, {
    expectedSource: { [RUN]: ["frontend-builder", "security-reviewer"] },
  });
  return { ok: audit.totalViolations === 0, violations: audit.runs.flatMap((r) => r.violations) };
});

h.done();
