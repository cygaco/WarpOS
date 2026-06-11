#!/usr/bin/env node
"use strict";

/**
 * sprint-id-correlation.test.js — regression for SP-20260611-001 Fix 5 (T-314, R-5):
 * sprint_id-preferring correlation in BOTH checkers.
 *
 * Exploit (gemini crossfam finding §B.5): hasBackingDispatchRecord correlated a backing
 * dispatch record to a sprint by TIME WINDOW only. A CONCURRENT sprint's ok:true record
 * (overlapping window, different sprint_id) therefore falsely GREENS this sprint — the
 * cross-sprint leakage bug. This is not hypothetical: on the live ledger the single
 * `product-lead` record stamped SP-20260611-001 was falsely satisfying SP-20260611-002.
 *
 * Fix: sprint_id NARROWS the match (never widens it):
 *   - a record STAMPED for a sprint (non-empty string id) must match — a record with a
 *     DIFFERENT stamped id never correlates (even inside the window);
 *   - a record with NO stamp (absent / null / empty — the unstamped sentinel) falls back
 *     to the R-4 CLAMPED time window (legacy compat, no re-opening of the spoof leak);
 *   - in BOTH cases the (clamped) time window still applies — a sprint_id match OUTSIDE
 *     the window does NOT correlate (defense-in-depth: sprint_id narrows, never widens).
 *
 * Tested against BOTH sprint-hook-coverage.js and sprint-manager-consult.js.
 */

const assert = require("assert");
const hookCoverage = require("../../../scripts/checks/sprint-hook-coverage");
const managerConsult = require("../../../scripts/checks/sprint-manager-consult");

const { computeFindings: computeHookFindings, RECORD_BACKED_CUTOFF } = hookCoverage;
const { computeFindings: computeConsultFindings } = managerConsult;

let passed = 0;
const failures = [];
function test(name, fn) {
  try {
    fn();
    passed++;
  } catch (e) {
    failures.push(`${name}: ${e && e.message ? e.message : e}`);
  }
}

const SPRINT_CREATED = RECORD_BACKED_CUTOFF; // "2026-06-10" — record-backed predicate active
const EV_TS = "2026-06-10T12:00:00.000Z";    // in-horizon event ts (window anchor)
const EDGE_TS = "2026-06-10T13:59:00.000Z";  // still inside the 2h record buffer of EV_TS

// ── hook-coverage harness ─────────────────────────────────────────────────────
const HOOK_REG = {
  rows: [{ role: "qa-reviewer", step: "gauntlet", condition: "always", mode: "block", order: 10 }],
};
const HOOK_COMP = { unit_types: [], max_risk: "high", domains: [] };
function hookEvents(sid) {
  return [
    { cat: "audit", sprint_id: sid, ts: EV_TS, data: { kind: "sprint_full_phase_started", ts: EV_TS } },
    { cat: "manager_consult", sprint_id: sid, ts: EV_TS, data: { manager: "qa-reviewer", ts: EV_TS } },
  ];
}
function rec(role, completedAt, sprintId) {
  const r = { dispatch_id: "d-sid", role, provider: "openai", model: "gpt-5.5", ok: true, started_at: completedAt, completed_at: completedAt };
  if (sprintId !== undefined) r.sprint_id = sprintId;
  return r;
}
function hookFindings(sid, dispatch) {
  return computeHookFindings(hookEvents(sid), HOOK_REG, { [sid]: HOOK_COMP }, { [sid]: SPRINT_CREATED }, "2026-06-05", dispatch);
}

// ── manager-consult harness ───────────────────────────────────────────────────
function consultEvents(sid) {
  return [
    { cat: "audit", sprint_id: sid, ts: EV_TS, data: { kind: "sprint_full_phase_started", ts: EV_TS } },
    { cat: "manager_consult", sprint_id: sid, ts: EV_TS, data: { manager: "visual-review", ts: EV_TS } },
    { cat: "manager_consult", sprint_id: sid, ts: EV_TS, data: { manager: "design-quality", ts: EV_TS } },
  ];
}
function consultFindings(sid, dispatch) {
  return computeConsultFindings(consultEvents(sid), { [sid]: SPRINT_CREATED }, "2026-06-04", dispatch);
}

// ── AC-5.1 — sprint_id match preferred, both checkers ─────────────────────────

test("sprint-id-match-preferred-both-checkers", () => {
  // hook-coverage: matching sprint_id correlates even at the window edge.
  const sidH = "SP-SID-HOOK";
  assert.strictEqual(
    hookFindings(sidH, [rec("qa-reviewer", EDGE_TS, sidH)]).findings.length, 0,
    "matching sprint_id (window-edge) must correlate in hook-coverage",
  );
  // hook-coverage: a DIFFERENT sprint_id inside the window does NOT correlate.
  assert.ok(
    hookFindings(sidH, [rec("qa-reviewer", EV_TS, "SP-OTHER")]).findings.some((f) => f.role === "qa-reviewer"),
    "a different sprint_id inside the window must NOT correlate in hook-coverage",
  );

  // manager-consult: same two assertions.
  const sidM = "SP-SID-MGR";
  assert.strictEqual(
    consultFindings(sidM, [rec("design-quality", EDGE_TS, sidM)]).findings.length, 0,
    "matching sprint_id (window-edge) must correlate in manager-consult",
  );
  assert.ok(
    consultFindings(sidM, [rec("design-quality", EV_TS, "SP-OTHER")]).findings.some((f) => f.manager === "design-quality"),
    "a different sprint_id inside the window must NOT correlate in manager-consult",
  );
});

// ── AC-5.2 — concurrent sprint record → no false green ────────────────────────

test("concurrent-sprint-record-no-false-green", () => {
  // Two overlapping sprints A and B (same window). The ONLY record is stamped for B.
  // Sprint A must show the missing-record finding (the live SP-001→SP-002 leak class).
  const sidA = "SP-CONC-A";
  const recordForB = rec("qa-reviewer", EV_TS, "SP-CONC-B");
  assert.ok(
    hookFindings(sidA, [recordForB]).findings.some((f) => f.role === "qa-reviewer"),
    "hook-coverage: a record stamped for sprint B must NOT green sprint A",
  );
  const mgrRecordForB = rec("design-quality", EV_TS, "SP-CONC-B");
  assert.ok(
    consultFindings(sidA, [mgrRecordForB]).findings.some((f) => f.manager === "design-quality"),
    "manager-consult: a record stamped for sprint B must NOT green sprint A",
  );
});

// ── AC-5.3 — legacy fallback keeps the clamped window ─────────────────────────

test("legacy-fallback-keeps-clamped-window", () => {
  const sid = "SP-LEGACY";
  // A sprint_id-LESS (legacy) record inside the clamped window correlates.
  assert.strictEqual(
    hookFindings(sid, [rec("qa-reviewer", EV_TS /* no sprintId */)]).findings.length, 0,
    "legacy (no sprint_id) record inside the clamped window must correlate",
  );
  // A sprint_id:null record is also treated as legacy/unstamped → window fallback.
  assert.strictEqual(
    hookFindings(sid, [rec("qa-reviewer", EV_TS, null)]).findings.length, 0,
    "a sprint_id:null record is unstamped (legacy) → window fallback must correlate it",
  );
  // A legacy record OUTSIDE the clamped window (only reachable via a spoof-widened
  // window) does NOT correlate — the fallback does not re-open the R-4 leak.
  const OUTSIDE_TS = "2026-03-01T00:00:00.000Z"; // far before created_at - 14d
  assert.ok(
    hookFindings(sid, [rec("qa-reviewer", OUTSIDE_TS /* no sprintId */)]).findings.some((f) => f.role === "qa-reviewer"),
    "legacy record outside the clamped window must NOT correlate (no re-opening the leak)",
  );
});

// ── Redteam — forged sprint_id correlates ONLY if also in the clamped window ──
// (sprint_id narrows, never widens: a matching id outside the window still fails.)

test("forged-sprint-id-still-needs-in-clamped-window", () => {
  const sid = "SP-FORGE";
  // A record FORGED with the matching sprint_id but timestamped OUTSIDE the window.
  const OUTSIDE_TS = "2026-03-01T00:00:00.000Z";
  assert.ok(
    hookFindings(sid, [rec("qa-reviewer", OUTSIDE_TS, sid)]).findings.some((f) => f.role === "qa-reviewer"),
    "hook-coverage: a forged matching sprint_id OUTSIDE the window must NOT correlate (narrows, never widens)",
  );
  assert.ok(
    consultFindings(sid, [rec("design-quality", OUTSIDE_TS, sid)]).findings.some((f) => f.manager === "design-quality"),
    "manager-consult: a forged matching sprint_id OUTSIDE the window must NOT correlate (narrows, never widens)",
  );
  // Control: same forged id, but IN the window → correlates (id match + window both hold).
  assert.strictEqual(
    hookFindings(sid, [rec("qa-reviewer", EV_TS, sid)]).findings.length, 0,
    "a matching sprint_id IN the window correlates (both conditions satisfied)",
  );
});

// ── Result ─────────────────────────────────────────────────────────────────────
if (failures.length) {
  process.stderr.write(`\nsprint-id-correlation.test: ${passed} passed, ${failures.length} FAILED\n`);
  for (const f of failures) process.stderr.write(`  FAIL: ${f}\n`);
  process.exit(1);
}
process.stdout.write(
  `sprint-id-correlation.test: ${passed}/${passed} passed\n` +
  `  AC-5.1 sprint-id-match-preferred (both checkers) + AC-5.2 concurrent-no-false-green + AC-5.3 legacy-fallback-clamped + redteam forged-id-needs-window\n`,
);
process.exit(0);
