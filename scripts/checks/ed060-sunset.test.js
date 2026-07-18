#!/usr/bin/env node
"use strict";
/**
 * Two-sided bite-test for ed060-sunset.js (D9, AC-17). The falsifiability the sprint demands, applied
 * to its OWN tooling: a PAST-date fixture must be a FINDING (non-zero) AND a FUTURE-date fixture must
 * be clean (0). Without the past-date failing case the enforcer is unfalsifiable (always-green).
 *
 *   node scripts/checks/ed060-sunset.test.js
 */
const assert = require("assert");
const { evaluateSunset } = require("./ed060-sunset");

let passed = 0;
const failures = [];
function test(name, fn) {
  try { fn(); passed++; } catch (e) { failures.push(`${name}: ${e.message}`); }
}

const NOW = "2026-08-01T00:00:00Z";

// ── PAST-date + unresolved → FINDING (overdue, non-zero). ──
test("past sunset + unresolved → overdue finding", () => {
  const v = evaluateSunset({ sunsetDate: "2026-07-01", now: NOW, resolved: false });
  assert.equal(v.ok, false);
  assert.equal(v.overdue, true);
  assert.ok(/PASSED/.test(v.reason));
});

// ── FUTURE-date + unresolved → clean (not yet due). ──
test("future sunset + unresolved → clean (not yet due)", () => {
  const v = evaluateSunset({ sunsetDate: "2026-12-31", now: NOW, resolved: false });
  assert.equal(v.ok, true);
  assert.equal(v.overdue, false);
});

// ── RESOLVED short-circuits regardless of date (agy live → sunset moot). ──
test("resolved (agy live) → clean even with a past date", () => {
  const v = evaluateSunset({ sunsetDate: "2026-07-01", now: NOW, resolved: true });
  assert.equal(v.ok, true);
  assert.ok(/resolved/i.test(v.reason));
});

// ── boundary: now === sunset date → overdue (>= is the trigger). ──
test("now == sunset date → overdue (inclusive)", () => {
  const v = evaluateSunset({ sunsetDate: "2026-08-01", now: NOW, resolved: false });
  assert.equal(v.ok, false);
  assert.equal(v.overdue, true);
});

// ── fail-closed: an unparseable date → not-ok, not-overdue (exit 2 class). ──
test("unparseable date → fail-closed (ok:false, overdue:false)", () => {
  const v = evaluateSunset({ sunsetDate: "not-a-date", now: NOW, resolved: false });
  assert.equal(v.ok, false);
  assert.equal(v.overdue, false);
});

// ── LIVE manifest today → not overdue (the real 2026-10-16 date is in the future). ──
test("LIVE: today's real sunset is not yet overdue (exit 0 today)", () => {
  const { loadLive } = require("./ed060-sunset");
  const live = loadLive();
  const v = evaluateSunset({ sunsetDate: live.sunsetDate, now: new Date().toISOString(), resolved: live.resolved });
  assert.equal(v.ok, true, `live sunset should not be overdue today: ${v.reason}`);
});

if (failures.length) {
  process.stderr.write(`FAIL [ed060-sunset.test] ${failures.length} failure(s):\n${failures.map((f) => `  - ${f}`).join("\n")}\n`);
  process.exit(1);
}
process.stdout.write(`OK   [ed060-sunset.test] ${passed} passed (two-sided: past→finding, future→clean, resolved→moot)\n`);
