#!/usr/bin/env node
"use strict";

/**
 * Isolated P5 test for log-sink-caps.js. Proves a sink at exactly 2x cap is
 * GREEN, 2x cap + 1 is RED, and a malformed/unreadable sink descriptor fails
 * CLOSED (never silently skipped).
 *
 *   node scripts/checks/log-sink-caps.test.js
 */

const path = require("path");
const { harness } = require("./lib/fixture-harness");
const { evaluate } = require("./log-sink-caps");

const h = harness("log-sink-caps");

// ── Known-answer: a healthy sink well under cap ──────────────────────────
h.pass("a lines sink well under cap passes", () =>
  evaluate({ sinks: [{ path: "events.jsonl", kind: "lines", cap: 20000, actual: 100 }] }));

h.pass("a bytes sink well under cap passes", () =>
  evaluate({ sinks: [{ path: "team-guard-debug.log", kind: "bytes", cap: 2097152, actual: 1024 }] }));

// ── Boundary: exactly 2x cap = GREEN ─────────────────────────────────────
h.pass("a lines sink at EXACTLY 2x cap is GREEN", () =>
  evaluate({ sinks: [{ path: "events.jsonl", kind: "lines", cap: 20000, actual: 40000 }] }));

h.pass("a bytes sink at EXACTLY 2x cap is GREEN", () =>
  evaluate({ sinks: [{ path: "team-guard-debug.log", kind: "bytes", cap: 1000, actual: 2000 }] }));

// ── Boundary: 2x cap + 1 = RED ────────────────────────────────────────────
h.violation("a lines sink at 2x cap + 1 is RED", () =>
  evaluate({ sinks: [{ path: "events.jsonl", kind: "lines", cap: 20000, actual: 40001 }] }));

h.violation("a bytes sink at 2x cap + 1 is RED", () =>
  evaluate({ sinks: [{ path: "team-guard-debug.log", kind: "bytes", cap: 1000, actual: 2001 }] }));

// ── PLANTED VIOLATION: malformed sink descriptor fails CLOSED, not skipped ──
h.violation("a malformed sink descriptor (no cap) fails closed", () =>
  evaluate({ sinks: [{ path: "mystery.jsonl", kind: "lines" }] }));

h.violation("a malformed sink descriptor (bad kind) fails closed", () =>
  evaluate({ sinks: [{ path: "mystery.jsonl", kind: "elephants", cap: 100, actual: 1 }] }));

// ── PLANTED VIOLATION: unreadable (missing mid-check) sink fails CLOSED ────
h.violation("an unreadable sink is NOT silently skipped — fails closed", () =>
  evaluate({ sinks: [{ path: "raced-away.jsonl", kind: "lines", cap: 20000, unreadable: true }] }));

// ── Multiple sinks: a clean one alongside a breaching one still flags ONLY the breach ──
h.violation("one breaching sink among several clean ones is still caught", () =>
  evaluate({
    sinks: [
      { path: "clean.jsonl", kind: "lines", cap: 20000, actual: 10 },
      { path: "over.jsonl", kind: "lines", cap: 20000, actual: 99999 },
    ],
  }));

// ── F-ENF-2: a NON-FINITE actual fails CLOSED (never slides under the `>` test) ──
h.violation("a NaN actual fails closed (not a silent pass)", () =>
  evaluate({ sinks: [{ path: "nan.jsonl", kind: "lines", cap: 20000, actual: NaN }] }));

h.violation("an Infinity actual fails closed", () =>
  evaluate({ sinks: [{ path: "inf.jsonl", kind: "lines", cap: 20000, actual: Infinity }] }));

// ── F-ENF-3: the INVENTORY descriptor is validated even when the file is absent ──
// A well-formed descriptor with NO actual (file didn't exist) is GREEN — the
// inventory entry is valid; there is just nothing to measure.
h.pass("a well-formed sink with an absent actual (file not written yet) passes", () =>
  evaluate({ sinks: [{ path: "fresh.jsonl", kind: "lines", cap: 20000 }] }));

// A MALFORMED descriptor is flagged EVEN when the file is absent (inventory check).
h.violation("a malformed inventory descriptor is flagged even with no actual (F-ENF-3)", () =>
  evaluate({ sinks: [{ path: "bad.jsonl", kind: "elephants", cap: 20000 }] }));

// ── F-BETA-1 coverage: every logger CATEGORY_FILES fan-out target is a registered sink ──
// An unregistered fan-out target makes rotateSink() a silent no-op (rotation is
// closed over SINK_CAPS), so the sink grows unbounded — the F-BETA-1 class.
h.test("every logger CATEGORY_FILES fan-out target is a registered SINK_CAPS sink", () => {
  const assert = require("assert");
  const { SINK_CAPS } = require("../hooks/lib/rotate");
  const logger = require("../hooks/lib/logger");
  const reg = new Set(Object.keys(SINK_CAPS));
  const missing = [];
  for (const [cat, files] of Object.entries(logger.CATEGORY_FILES || {})) {
    for (const f of files || []) {
      if (!reg.has(path.resolve(f))) missing.push(`${cat} -> ${f}`);
    }
  }
  assert.strictEqual(
    missing.length,
    0,
    `unregistered fan-out targets (would never rotate — F-BETA-1 class): ${missing.join(", ")}`,
  );
});

h.done();
