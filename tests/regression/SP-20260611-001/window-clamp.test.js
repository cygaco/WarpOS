#!/usr/bin/env node
"use strict";

/**
 * window-clamp.test.js — regression for SP-20260611-001 Fix 4 (T-313, R-4):
 * spoofed-ts window clamp, TWO-SITE — re-gauntlet hardening (FIX-B4a..c).
 *
 * Exploit (gemini crossfam finding §B.4): the sprint event window in both
 * sprint-hook-coverage.js and sprint-manager-consult.js derives min/max ts from
 * UNTRUSTED events.jsonl `f.ts`. A planted extreme ts (1970 or 2099) widens the
 * window to ~infinity, so any historic ok:true dispatch record lands "in-window"
 * and falsely greens a sprint whose real run never produced that record.
 *
 * THE MARQUEE BUG (FIX-B4a): the clamp predicate failed OPEN on a MISSING anchor —
 * `if (anchorMs === null) return true` KEPT the planted ts, so a sprint with no
 * trusted created_at had its window widened to infinity and the clamp was a no-op.
 * The fix fails CLOSED: no trusted anchor → DISCARD the ts → empty window → the
 * downstream null-window guard fires → no false-green. This is the path the prior
 * `all-outlier-event-set-fails-closed-no-window` test NEVER exercised (it supplied
 * a valid anchor, so the WITH-anchor branch did the discarding — a BC-16 hollow test
 * inside the very fix that fixes false-green). Rewritten below to plant outliers with
 * NO anchor and assert each site fails closed.
 *
 * AC-4.1 (hook-coverage) + AC-4.2 (manager-consult): the SAME exploit fixture is
 * tested against BOTH files (β design DIRECTIVE — R-4 is two-site). Plus redteam
 * boundary cases at exactly created_at ± cap ± 1ms, and FIX-B4c unparseable dates.
 */

const assert = require("assert");
const hookCoverage = require("../../../scripts/checks/sprint-hook-coverage");
const managerConsult = require("../../../scripts/checks/sprint-manager-consult");

const {
  computeFindings: computeHookFindings,
  tsWithinHorizon: hookTsWithinHorizon,
  sprintAnchorMs: hookSprintAnchorMs,
  extractYamlDate: hookExtractYamlDate,
  WINDOW_HARD_CAP_MS: HOOK_CAP_MS,
  RECORD_BACKED_CUTOFF,
} = hookCoverage;
const {
  computeFindings: computeConsultFindings,
  tsWithinHorizon: consultTsWithinHorizon,
  sprintAnchorMs: consultSprintAnchorMs,
  extractYamlDate: consultExtractYamlDate,
  WINDOW_HARD_CAP_MS: CONSULT_CAP_MS,
} = managerConsult;

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
// An UNPARSEABLE date that is structurally shaped (YYYY-MM-DD) but not a real calendar
// date — must resolve to NO anchor (null), never a NaN anchor (FIX-B4c). Kept >= cutoff
// as a STRING so the sprint stays in-scope for the audit (string compare: "9999.." >= cutoff).
const UNPARSEABLE_DATE = "9999-99-99";

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
// No-anchor variant: the audited sprint has NO genuine in-horizon event — ONLY the
// planted outliers carry a ts (the run/consult markers carry NONE), so with a null
// anchor every ts is unverifiable and must be discarded → empty window → fail closed.
function hookEventsNoRealTs(sid, tsList) {
  const ev = [
    { cat: "audit", sprint_id: sid, data: { kind: "sprint_full_phase_started" } },
    { cat: "manager_consult", sprint_id: sid, data: { manager: "qa-reviewer" } },
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
// No-anchor variant: the run/consult markers carry NO ts; only the planted outliers do.
function consultEventsNoRealTs(sid, tsList) {
  const ev = [
    { cat: "audit", sprint_id: sid, data: { kind: "sprint_full_phase_started" } },
    { cat: "manager_consult", sprint_id: sid, data: { manager: "visual-review" } },
    { cat: "manager_consult", sprint_id: sid, data: { manager: "design-quality" } },
  ];
  for (const ts of tsList) {
    ev.push({ cat: "manager_consult", sprint_id: sid, ts, data: { manager: "design-quality", ts } });
  }
  return ev;
}

// ── FIX-B4a (BLOCKER ×2) — predicate fails CLOSED on a MISSING anchor (both sites) ──
// The marquee bug: `tsWithinHorizon(ts, null)` must return FALSE (discard), not true (keep).

test("predicate-fails-closed-on-null-anchor-BOTH-sites", () => {
  for (const ts of [SPOOF_LOW, SPOOF_HIGH, REAL_EV_TS, HISTORIC_RECORD_TS]) {
    const ms = Date.parse(ts);
    assert.strictEqual(
      hookTsWithinHorizon(ms, null), false,
      `hook-coverage tsWithinHorizon(${ts}, null) must be FALSE (no anchor → discard); a true here is the fail-open marquee bug`,
    );
    assert.strictEqual(
      consultTsWithinHorizon(ms, null), false,
      `manager-consult tsWithinHorizon(${ts}, null) must be FALSE (no anchor → discard); a true here is the fail-open marquee bug`,
    );
  }
});

// ── AC-4.1 — hook-coverage clamp (WITH anchor: outliers outside anchor±cap discarded) ──

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

// ── AC-4.2 — manager-consult clamp (SAME exploit, second site, WITH anchor) ────

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

// ── FIX-B4b (MAJOR) — REAL no-anchor exploit (the rewritten hollow test) BOTH sites ──
// A sprint that is IN-SCOPE for the audit (a date present for the cutoff filter) but whose
// anchor resolves NULL (unparseable date) must DISCARD the planted outliers, derive an
// EMPTY window, and fail CLOSED — no historic ok:true record may green it. Under the old
// `return true` fail-open this false-greened: the outliers were kept, the window widened to
// 1970..2099, and HISTORIC_RECORD_TS (2026-03) landed in-window → no finding.

test("missing-anchor-discards-outlier-ts-fails-closed-hook-coverage", () => {
  const sid = "SP-WC-NOANCHOR-HOOK";
  // In-scope for the cutoff (UNPARSEABLE_DATE compares >= cutoff as a string) but the anchor
  // resolves null. Only the planted outliers carry a ts; no genuine in-horizon event.
  const events = hookEventsNoRealTs(sid, [SPOOF_LOW, SPOOF_HIGH]);
  const dispatch = [dispatchRec("qa-reviewer", HISTORIC_RECORD_TS)];
  const sprintDates = { [sid]: UNPARSEABLE_DATE };
  // Predicate-level: the anchor is null and the outliers are discarded.
  assert.strictEqual(hookSprintAnchorMs(sprintDates, sid), null, "anchor must resolve null for the unparseable date");
  assert.strictEqual(hookTsWithinHorizon(Date.parse(SPOOF_LOW), null), false, "1970 ts must be discarded under a null anchor");
  assert.strictEqual(hookTsWithinHorizon(Date.parse(SPOOF_HIGH), null), false, "2099 ts must be discarded under a null anchor");
  // End-to-end: empty window → historic record uncorrelated → fail closed (finding persists).
  const r = computeHookFindings(events, HOOK_REG, { [sid]: HOOK_COMP }, sprintDates, "2026-06-05", dispatch);
  assert.strictEqual(r.checked, 1, `the no-anchor sprint must still be IN-SCOPE (checked), not exempted; got checked=${r.checked}`);
  assert.ok(
    r.findings.some((f) => f.role === "qa-reviewer" && f.finding_type === "missing_block_agent"),
    `no-anchor + planted outliers must FAIL CLOSED (historic record must NOT green via a widened window); got ${JSON.stringify(r.findings)}`,
  );
  assert.ok(
    r.info.some((i) => i.finding_type === "window_ts_discarded"),
    `the discarded outliers should surface a C-4 note; got info=${JSON.stringify(r.info)}`,
  );
});

test("missing-anchor-discards-outlier-ts-fails-closed-manager-consult", () => {
  const sid = "SP-WC-NOANCHOR-MGR";
  const events = consultEventsNoRealTs(sid, [SPOOF_LOW, SPOOF_HIGH]);
  const dispatch = [dispatchRec("design-quality", HISTORIC_RECORD_TS)];
  const sprintDates = { [sid]: UNPARSEABLE_DATE };
  assert.strictEqual(consultSprintAnchorMs(sprintDates, sid), null, "anchor must resolve null for the unparseable date");
  assert.strictEqual(consultTsWithinHorizon(Date.parse(SPOOF_LOW), null), false, "1970 ts must be discarded under a null anchor");
  assert.strictEqual(consultTsWithinHorizon(Date.parse(SPOOF_HIGH), null), false, "2099 ts must be discarded under a null anchor");
  const r = computeConsultFindings(events, sprintDates, "2026-06-04", dispatch);
  assert.strictEqual(r.checked, 1, `the no-anchor sprint must still be IN-SCOPE (checked), not exempted; got checked=${r.checked}`);
  assert.ok(
    r.findings.some((f) => f.manager === "design-quality" && f.finding_type === "missing_design_consult"),
    `no-anchor + planted outliers must FAIL CLOSED at the manager-consult site; got ${JSON.stringify(r.findings)}`,
  );
  assert.ok(
    Array.isArray(r.windowDiscards) && r.windowDiscards.length >= 1,
    `the discarded outliers should surface windowDiscards entries; got ${JSON.stringify(r.windowDiscards)}`,
  );
});

// ── Redteam boundary: ts at exactly created_at ± cap ± 1ms ─────────────────────
// WINDOW_HARD_CAP_MS = 14 days. Anchor = created_at at 00:00:00Z. A record at the
// inclusive edge (anchor + cap exactly) must correlate; one 1ms past must not.

test("boundary-ts-at-created_at-plus-cap-inside-kept-outside-discarded", () => {
  const sid = "SP-WC-EDGE";
  assert.strictEqual(HOOK_CAP_MS, CONSULT_CAP_MS, "both sites must share the same hard cap");
  const CAP_MS = HOOK_CAP_MS;
  const anchorMs = Date.parse(SPRINT_CREATED + "T00:00:00Z");
  const insideTs = new Date(anchorMs + CAP_MS).toISOString();        // exactly anchor + cap (inclusive)
  const outsideTs = new Date(anchorMs + CAP_MS + 1).toISOString();   // 1ms past the cap

  // Predicate-level boundary cell: at the edge KEPT, 1ms past DISCARDED (both sites).
  assert.strictEqual(hookTsWithinHorizon(anchorMs + CAP_MS, anchorMs), true, "ts at exactly anchor + cap is inclusive (kept)");
  assert.strictEqual(hookTsWithinHorizon(anchorMs + CAP_MS + 1, anchorMs), false, "ts 1ms past cap is discarded");
  assert.strictEqual(consultTsWithinHorizon(anchorMs + CAP_MS, anchorMs), true, "ts at exactly anchor + cap is inclusive (kept) — manager-consult");
  assert.strictEqual(consultTsWithinHorizon(anchorMs + CAP_MS + 1, anchorMs), false, "ts 1ms past cap is discarded — manager-consult");
  // And symmetric on the low side.
  assert.strictEqual(hookTsWithinHorizon(anchorMs - CAP_MS, anchorMs), true, "ts at exactly anchor - cap is inclusive (kept)");
  assert.strictEqual(hookTsWithinHorizon(anchorMs - CAP_MS - 1, anchorMs), false, "ts 1ms before -cap is discarded");

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

// ── All-outlier WITH anchor: every ts out of horizon → empty window → fail closed ──
// Kept from the original (now genuinely exercising the WITH-anchor discard branch): a
// valid anchor is present but ALL event ts fall outside anchor±cap, so the derived window
// is empty and the historic record cannot correlate.

test("all-outlier-with-anchor-fails-closed-no-window", () => {
  const sid = "SP-WC-ALLOUT";
  // Valid anchor (SPRINT_CREATED) but every event ts is a far outlier (1970/2099) →
  // all discarded by the WITH-anchor branch → empty window.
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
    `all-outlier event set (with anchor) must FAIL CLOSED (no window → not covered); got ${JSON.stringify(r.findings)}`,
  );
  assert.ok(
    r.info.some((i) => i.finding_type === "window_ts_discarded"),
    `the discarded outliers should surface a C-4 note; got info=${JSON.stringify(r.info)}`,
  );
});

// ── FIX-B4c (MINOR) — unparseable date → null anchor (never a NaN anchor) ──────
// extractYamlDate must reject a structurally-shaped but invalid calendar date so it never
// becomes a candidate anchor; sprintAnchorMs must map any non-parseable string to null,
// and the resulting null-anchor path must fail closed.

test("unparseable-date-maps-to-null-anchor-not-NaN-BOTH-sites", () => {
  // extractYamlDate rejects the structurally-invalid date (it would otherwise feed a NaN anchor).
  assert.strictEqual(
    hookExtractYamlDate(`created_at: "${UNPARSEABLE_DATE}"`), null,
    `hook-coverage extractYamlDate must reject the unparseable date ${UNPARSEABLE_DATE} (→ null, no anchor)`,
  );
  assert.strictEqual(
    consultExtractYamlDate(`created_at: "${UNPARSEABLE_DATE}"`), null,
    `manager-consult extractYamlDate must reject the unparseable date ${UNPARSEABLE_DATE} (→ null, no anchor)`,
  );
  // And a real date still extracts.
  assert.strictEqual(hookExtractYamlDate(`created_at: "${SPRINT_CREATED}"`), SPRINT_CREATED, "a valid date must still extract");
  assert.strictEqual(consultExtractYamlDate(`created_at: "${SPRINT_CREATED}"`), SPRINT_CREATED, "a valid date must still extract");

  // sprintAnchorMs maps the unparseable date to null (NOT a NaN anchor that could slip the comparison).
  const sd = { "SP-X": UNPARSEABLE_DATE };
  assert.strictEqual(hookSprintAnchorMs(sd, "SP-X"), null, "unparseable date must resolve to a null anchor, never NaN");
  assert.strictEqual(consultSprintAnchorMs(sd, "SP-X"), null, "unparseable date must resolve to a null anchor, never NaN");
  // Guard against the NaN trap explicitly: a NaN anchor would make the comparison
  // `evTs >= NaN - cap` false for BOTH bounds and could mask intent — confirm it's null.
  assert.ok(!Number.isNaN(hookSprintAnchorMs(sd, "SP-X")), "anchor must be null, not NaN");
  assert.ok(!Number.isNaN(consultSprintAnchorMs(sd, "SP-X")), "anchor must be null, not NaN");
});

// ── Result ─────────────────────────────────────────────────────────────────────
if (failures.length) {
  process.stderr.write(`\nwindow-clamp.test: ${passed} passed, ${failures.length} FAILED\n`);
  for (const f of failures) process.stderr.write(`  FAIL: ${f}\n`);
  process.exit(1);
}
process.stdout.write(
  `window-clamp.test: ${passed}/${passed} passed\n` +
  `  B4a predicate-fails-closed-on-null-anchor (both sites) + AC-4.1/4.2 with-anchor clamp +\n` +
  `  B4b real no-anchor exploit fails-closed (both sites) + redteam boundary (cap±1ms, both sites) +\n` +
  `  all-outlier-with-anchor fail-closed + B4c unparseable-date → null anchor (both sites)\n`,
);
process.exit(0);
