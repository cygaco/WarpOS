#!/usr/bin/env node
"use strict";

/**
 * Isolated P5 test for coverage-gate.js (N-1, the "sprint theater" killer).
 * Proves a backed ok:true record is the precondition for "covered", and every
 * theater pattern is caught: unbacked claim, ok:false, a Claude clone satisfying a
 * cross-provider obligation, a hand-authored phantom row, and a wrong-run record.
 *
 *   node scripts/dispatch/coverage-gate.test.js
 */

const { harness } = require("../checks/lib/fixture-harness");
const { evaluate, parseExpect } = require("./coverage-gate");

const h = harness("coverage-gate");

const RUN = "run-abc";
function rec(over) {
  return {
    dispatch_id: "d-1",
    cmdline_checksum: "sha256:deadbeef",
    run_id: RUN,
    role: "x",
    provider: "openai",
    ok: true,
    ...over,
  };
}

// ── known-answer: complete, backed coverage passes ──────────
h.pass("all expected roles have ok:true backed records => covered", () =>
  evaluate({
    runId: RUN,
    records: [
      rec({ role: "frontend-builder", provider: "claude", dispatch_id: "d-b" }),
      rec({ role: "security-reviewer", provider: "gemini", dispatch_id: "d-r" }),
    ],
    expected: [{ role: "frontend-builder" }, { role: "security-reviewer" }],
  }));

// ── PLANTED: unbacked coverage claim (no record) ────────────
h.violation("expected role with NO record is flagged (sprint theater)", () =>
  evaluate({ runId: RUN, records: [], expected: [{ role: "security-reviewer" }] }));

// ── PLANTED: a record exists but ok:false ───────────────────
h.violation("expected role whose only record is ok:false is NOT covered", () =>
  evaluate({
    runId: RUN,
    records: [rec({ role: "security-reviewer", provider: "gemini", ok: false })],
    expected: [{ role: "security-reviewer" }],
  }));

// ── PLANTED: a Claude clone satisfies a cross-provider role ──
h.violation("cross-provider reviewer satisfied by provider=claude is flagged (diversity)", () =>
  evaluate({
    runId: RUN,
    records: [rec({ role: "security-reviewer", provider: "claude", dispatch_id: "d-c" })],
    expected: [{ role: "security-reviewer" }],
  }));

// ── PLANTED: hand-authored phantom row (ok:true, no dispatch_id) ──
h.violation("a phantom ok:true row with no dispatch_id/cmdline_checksum is rejected", () =>
  evaluate({
    runId: RUN,
    records: [{ run_id: RUN, role: "security-reviewer", provider: "gemini", ok: true }],
    expected: [{ role: "security-reviewer" }],
  }));

// ── PLANTED: a record from a DIFFERENT run cannot satisfy ───
h.violation("a record from another run_id does NOT satisfy this run's coverage", () =>
  evaluate({
    runId: RUN,
    records: [rec({ role: "security-reviewer", provider: "gemini", run_id: "OTHER-RUN", dispatch_id: "d-o" })],
    expected: [{ role: "security-reviewer" }],
  }));

// ── parseExpect helper ──────────────────────────────────────
h.test("parseExpect parses role:shape pairs", () => {
  const e = parseExpect("frontend-builder:subprocess-claude,security-reviewer");
  if (e.length !== 2 || e[0].role !== "frontend-builder" || e[0].shape !== "subprocess-claude" || e[1].role !== "security-reviewer") {
    throw new Error(JSON.stringify(e));
  }
});

h.done();
