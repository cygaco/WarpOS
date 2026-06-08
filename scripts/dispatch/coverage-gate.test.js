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
const { ARGV_SCHEMA_VERSION } = require("./dispatch-contract");

const h = harness("coverage-gate");

const RUN = "run-abc";
// A realistic post-§17.4 record: backed + at the current schema + carrying
// output_digest (proof-of-artifact). Override per case.
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

// ── PLANTED (§17.4): a current-schema backed ok:true record with NO artifact proof ──
h.violation("a record with no output_digest/artifact is blind coverage (rejected)", () =>
  evaluate({
    runId: RUN,
    records: [rec({ role: "security-reviewer", provider: "gemini", dispatch_id: "d-np", output_digest: null })],
    expected: [{ role: "security-reviewer" }],
  }));

// ── PLANTED (§17.4): a record stamped at a STALE/older schema version ──
h.violation("a record at a stale argv_schema_version does not satisfy coverage", () =>
  evaluate({
    runId: RUN,
    records: [rec({ role: "security-reviewer", provider: "gemini", dispatch_id: "d-sv", argv_schema_version: "0" })],
    expected: [{ role: "security-reviewer" }],
  }));

// ── PLANTED (§17.4): a record with NO argv_schema_version (pre-schema / backfill) ──
h.violation("a record with no argv_schema_version is stale/backfilled (rejected)", () => {
  const r = rec({ role: "security-reviewer", provider: "gemini", dispatch_id: "d-ns" });
  delete r.argv_schema_version;
  return evaluate({ runId: RUN, records: [r], expected: [{ role: "security-reviewer" }] });
});

// ── PLANTED (§17.4): an unauditable waiver (no reason) ──
h.violation("a waiver with no reason is rejected (unauditable)", () =>
  evaluate({ runId: RUN, records: [], expected: [{ role: "security-reviewer", waiver: {} }] }));

// ── PLANTED (§17.4): a named artifact the record does not carry ──
h.violation("a named artifact with no matching record digest is flagged", () =>
  evaluate({
    runId: RUN,
    records: [rec({ role: "frontend-builder", provider: "claude", dispatch_id: "d-art" })],
    expected: [{ role: "frontend-builder", artifact: "runtime/x/out.md" }],
  }));

// ── known-answer (§17.4): an AUDITABLE waiver (reason given) → waived, not missing ──
h.pass("a waiver WITH a reason covers the role as waived", () =>
  evaluate({
    runId: RUN,
    records: [],
    expected: [{ role: "security-reviewer", waiver: { reason: "no UI this sprint; design-quality N/A" } }],
  }));

// ── known-answer (§17.4): a named artifact whose digest is in the record → covered ──
h.pass("a named artifact whose digest is in the record => covered", () =>
  evaluate({
    runId: RUN,
    records: [
      rec({ role: "frontend-builder", provider: "claude", dispatch_id: "d-ok", artifacts: [{ path: "runtime/x/out.md", sha256: "sha256:abc" }] }),
    ],
    expected: [{ role: "frontend-builder", artifact: "runtime/x/out.md" }],
  }));

// ── parseExpect helper ──────────────────────────────────────
h.test("parseExpect parses role:shape pairs", () => {
  const e = parseExpect("frontend-builder:subprocess-claude,security-reviewer");
  if (e.length !== 2 || e[0].role !== "frontend-builder" || e[0].shape !== "subprocess-claude" || e[1].role !== "security-reviewer") {
    throw new Error(JSON.stringify(e));
  }
});

h.done();
