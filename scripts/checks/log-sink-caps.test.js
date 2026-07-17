#!/usr/bin/env node
"use strict";

/**
 * Isolated P5 test for log-sink-caps.js. Proves a sink at exactly 2x cap is
 * GREEN, 2x cap + 1 is RED, and a malformed/unreadable sink descriptor fails
 * CLOSED (never silently skipped).
 *
 *   node scripts/checks/log-sink-caps.test.js
 */

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

h.done();
