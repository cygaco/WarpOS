#!/usr/bin/env node
"use strict";

/**
 * window-clamp.test.js — regression for SP-20260611-001 Fix 4 (T-313, R-4):
 * spoofed-ts window clamp, TWO-SITE.
 *
 * Exploit (gemini crossfam finding §B.4): the sprint event window in both
 * sprint-hook-coverage.js and sprint-manager-consult.js derives min/max ts from
 * UNTRUSTED events.jsonl `f.ts`. A planted extreme ts (1970 or 2099) widens the
 * window to ~infinity, so any historic ok:true dispatch record lands "in-window"
 * and falsely greens a sprint whose real run never produced that record.
 *
 * Fix: clamp the window to the sprint's TRUSTED created_at ± WINDOW_HARD_CAP_MS
 * (14 days). Out-of-horizon ts are DISCARDED from window derivation; the historic
 * record then correctly falls outside the (clamped) window and does NOT correlate.
 *
 * AC-4.1 (hook-coverage) + AC-4.2 (manager-consult): the SAME exploit fixture is
 * tested against BOTH files (β design DIRECTIVE — R-4 is two-site). Plus redteam
 * boundary cases at exactly created_at ± cap ± 1ms.
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

// ── Shared exploit constants ──────────────────────────────────────────────────
// Anchor the sprint on a post-RECORD_BACKED_CUTOFF created_at so the record-backed
// predicate is active (telemetry alone is insufficient → a backing record is required).
const SPRINT_CREATED = RECORD_BACKED_CUTOFF; // "2026-06-10"
const REAL_EV_TS = "2026-06-10T12:00:00.000Z"; // a genuine in-horizon event timestamp
const SPOOF_LOW = "1970-01-01T00:00:00.000Z"; // planted extreme-low ts
const SPOOF_HIGH = "2099-12-31T23:59:59.000Z"; // planted extreme-high ts
// A historic ok:true record: inside the SPOOF-widened (1970..2099) window but well
// OUTSIDE the real created_at ± 14d horizon — the exploit's payload.
const HISTORIC_RECORD_TS = "2026-03-01T00:00:00.000Z";

// ── sprint-hook-coverage harness ──────────────────────────────────────────────
// gauntlet-only synthetic registry: one always-block role, deterministic forward logic.
const HOOK_REG = {
  rows: [
    { role: "qa-reviewer", step: "gauntlet", condition: "always", mode: "block", order: 10 },
  ],
};
const HOOK_COMP = { unit_types: [], max_risk: "high", domains: [] };

function hookEvents(sid, tsList) {
  // one run marker + one consult (qa-reviewer block has telemetry) + planted ts events
  const ev = [
    { cat: "audit", sprint_id: sid, ts: REAL_EV_TS, data: { kind: "sprint_full_phase_started", ts: REAL_EV_TS } },
    { cat: "manager_consult", sprint_id: sid, ts: REAL_EV_TS, data: { manager: "qa-reviewer", ts: REAL_EV_TS } },
  ];
  for (const ts of tsList) {
    ev.push({ cat: "manager_consult", sprint_id: sid, ts, data: { manager: "qa-reviewer", ts } });
  }
  return ev;
}
function dispatchRec(role, completedAt) {
  return { dispatch_id: "d-wc", role, provider: "openai", model: "gpt-5.5", ok: true, started_at: completedAt, completed_at: completedAt };
}

// ── sprint-manager-consult harness ────────────────────────────────────────────
function consultEvents(sid, tsList) {
  // design-touch (visual-review consult) + the required design-quality consult →
  // post-cutoff record-backed predicate active; needs a backing design-quality record.
  const ev = [
    { cat: "audit", sprint_id: sid, ts: REAL_EV_TS, data: { kind: "sprint_full_phase_started", ts: REAL_EV_TS } },
    { cat: "manager_consult", sprint_id: sid, ts: REAL_EV_TS, data: { manager: "visual-review", ts: REAL_EV_TS } },
    { cat: "manager_consult", sprint_id: sid, ts: REAL_EV_TS, data: { manager: "design-quality", ts: REAL_EV_TS } },
  ];
  for (const ts of tsList) {
    ev.push({ cat: "manager_consult", sprint_id: sid, ts, data: { manager: "design-quality", ts } });
  }
  return ev;
}

// ── AC-4.1 — hook-coverage clamp ──────────────────────────────────────────────

test("planted-extreme-ts-cannot-widen-hook-coverage-window", () => {
  const sid = "SP-WC-HOOK";
  // Spoof the window wide open with 1970 + 2099 ts; provide ONLY a historic record.
  const events = hookEvents(sid, [SPOOF_LOW, SPOOF_HIGH]);
  const dispatch = [dispatchRec("qa-reviewer", HISTORIC_RECORD_TS)];
  const r = computeHookFindings(events, HOOK_REG, { [sid]: HOOK_COMP }, { [sid]: SPRINT_CREATED }, "2026-06-05", dispatch);
  // With the clamp, the historic record is OUTSIDE the clamped window → NOT correlated
  // → the block-row is uncovered → a finding persists (exploit fails closed).
  assert.ok(
    r.findings.some((f) => f.role === "qa-reviewer"),
    `expected a missing-record finding (historic record must NOT green via spoofed window); got ${JSON.stringify(r.findings)}`,
  );
  // And the spoofed ts were discarded (C-4 note emitted).
  assert.ok(
    r.info.some((i) => i.finding_type === "window_ts_discarded"),
    `expected window_ts_discarded info note for the spoofed ts; got info=${JSON.stringify(r.info)}`,
  );

  // Control: a REAL in-horizon record DOES still correlate (the clamp doesn't break the happy path).
  const dispatchReal = [dispatchRec("qa-reviewer", REAL_EV_TS)];
  const r2 = computeHookFindings(events, HOOK_REG, { [sid]: HOOK_COMP }, { [sid]: SPRINT_CREATED }, "2026-06-05", dispatchReal);
  assert.strictEqual(
    r2.findings.length, 0,
    `a real in-window record should green the block-row even with spoofed ts present; got ${JSON.stringify(r2.findings)}`,
  );
});

// ── AC-4.2 — manager-consult clamp (SAME exploit, second site) ────────────────

test("planted-extreme-ts-cannot-widen-manager-consult-window", () => {
  const sid = "SP-WC-MGR";
  const events = consultEvents(sid, [SPOOF_LOW, SPOOF_HIGH]);
  const dispatch = [dispatchRec("design-quality", HISTORIC_RECORD_TS)];
  const r = computeConsultFindings(events, { [sid]: SPRINT_CREATED }, "2026-06-04", dispatch);
  // Historic record outside the clamped window → no backing record → finding persists.
  assert.ok(
    r.findings.some((f) => f.manager === "design-quality" && f.finding_type === "missing_design_consult"),
    `expected a missing-backing-record finding at the manager-consult site; got ${JSON.stringify(r.findings)}`,
  );
  // C-4 discard note surfaced via the returned windowDiscards array.
  assert.ok(
    Array.isArray(r.windowDiscards) && r.windowDiscards.length >= 1,
    `expected windowDiscards entries for the spoofed ts; got ${JSON.stringify(r.windowDiscards)}`,
  );

  // Control: a REAL in-horizon record correlates → clean.
  const dispatchReal = [dispatchRec("design-quality", REAL_EV_TS)];
  const r2 = computeConsultFindings(events, { [sid]: SPRINT_CREATED }, "2026-06-04", dispatchReal);
  assert.strictEqual(
    r2.findings.length, 0,
    `a real in-window record should satisfy the design-quality backing requirement; got ${JSON.stringify(r2.findings)}`,
  );
});

// ── Redteam boundary: ts at exactly created_at ± cap ± 1ms ─────────────────────
// WINDOW_HARD_CAP_MS = 14 days. Anchor = created_at at 00:00:00Z. A record at the
// inclusive edge (anchor + cap exactly) must correlate; one 1ms past must not.

test("boundary-ts-at-created_at-plus-cap-inside-kept-outside-discarded", () => {
  const sid = "SP-WC-EDGE";
  const CAP_MS = 14 * 24 * 60 * 60 * 1000;
  const anchorMs = Date.parse(SPRINT_CREATED + "T00:00:00Z");
  const insideTs = new Date(anchorMs + CAP_MS).toISOString();        // exactly anchor + cap (inclusive)
  const outsideTs = new Date(anchorMs + CAP_MS + 1).toISOString();   // 1ms past the cap

  // An event AT the edge is kept → window extends to it → a record AT the edge correlates.
  const eventsInside = hookEvents(sid, [insideTs]);
  const dispatchInside = [dispatchRec("qa-reviewer", insideTs)];
  const rInside = computeHookFindings(eventsInside, HOOK_REG, { [sid]: HOOK_COMP }, { [sid]: SPRINT_CREATED }, "2026-06-05", dispatchInside);
  assert.strictEqual(
    rInside.findings.length, 0,
    `ts at exactly created_at + cap should be KEPT (inclusive) and the record should correlate; got ${JSON.stringify(rInside.findings)}`,
  );

  // An event 1ms PAST the edge is discarded → does not widen the window → a record
  // only reachable via that widened window does NOT correlate → finding.
  const eventsOutside = hookEvents(sid, [outsideTs]);
  const dispatchOutside = [dispatchRec("qa-reviewer", outsideTs)];
  const rOutside = computeHookFindings(eventsOutside, HOOK_REG, { [sid]: HOOK_COMP }, { [sid]: SPRINT_CREATED }, "2026-06-05", dispatchOutside);
  // Note: the REAL_EV_TS event still anchors a valid window; the buffer (2h) does not
  // reach +cap+1ms, so the out-of-horizon record stays uncorrelated → finding persists.
  assert.ok(
    rOutside.findings.some((f) => f.role === "qa-reviewer"),
    `a record only reachable via a discarded (out-of-horizon) ts must NOT correlate; got ${JSON.stringify(rOutside.findings)}`,
  );
  assert.ok(
    rOutside.info.some((i) => i.finding_type === "window_ts_discarded"),
    `the 1ms-past-cap ts should be discarded with a C-4 note; got info=${JSON.stringify(rOutside.info)}`,
  );
});

// ── All-outlier fail-closed: every ts out of horizon → no window → not covered ─

test("all-outlier-event-set-fails-closed-no-window", () => {
  const sid = "SP-WC-ALLOUT";
  // ONLY spoofed ts (no real in-horizon event at all): build events directly so the
  // real event is also out of horizon. Use an anchor far from all event ts.
  const events = [
    { cat: "audit", sprint_id: sid, ts: SPOOF_LOW, data: { kind: "sprint_full_phase_started", ts: SPOOF_LOW } },
    { cat: "manager_consult", sprint_id: sid, ts: SPOOF_HIGH, data: { manager: "qa-reviewer", ts: SPOOF_HIGH } },
  ];
  const dispatch = [dispatchRec("qa-reviewer", HISTORIC_RECORD_TS)];
  const r = computeHookFindings(events, HOOK_REG, { [sid]: HOOK_COMP }, { [sid]: SPRINT_CREATED }, "2026-06-05", dispatch);
  // All ts discarded → no parseable window → hasBackingDispatchRecord fails closed →
  // the block-row is uncovered → finding (never fail-open on an all-outlier set).
  assert.ok(
    r.findings.some((f) => f.role === "qa-reviewer"),
    `all-outlier event set must FAIL CLOSED (no window → not covered); got ${JSON.stringify(r.findings)}`,
  );
});

// ── Result ─────────────────────────────────────────────────────────────────────
if (failures.length) {
  process.stderr.write(`\nwindow-clamp.test: ${passed} passed, ${failures.length} FAILED\n`);
  for (const f of failures) process.stderr.write(`  FAIL: ${f}\n`);
  process.exit(1);
}
process.stdout.write(
  `window-clamp.test: ${passed}/${passed} passed\n` +
  `  AC-4.1 hook-coverage clamp + AC-4.2 manager-consult clamp (two-site) + redteam boundary (cap±1ms) + all-outlier fail-closed\n`,
);
process.exit(0);
