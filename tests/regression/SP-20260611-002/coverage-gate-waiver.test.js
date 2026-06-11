#!/usr/bin/env node
"use strict";

/**
 * SP-20260611-002 WS-G3a (R-5, T-318) — coverage-gate waiver PROVENANCE.
 * Surface: scripts/dispatch/coverage-gate.js (per-surface isolation, Hard AC #4).
 *
 * AC-5.1 — a free-text-reason-only waiver (no provenance) is REJECTED the same way
 *          an unbacked record is. Provenance (operator/source + ts + auditable
 *          trail) is now REQUIRED.
 * AC-5.2 — a waiver WITH full provenance is honored AND surfaced (the provenance is
 *          carried on the waived[] entry so a silenced role is visible at /scan).
 *
 * Exploit fixtures here are PLAIN OBJECTS (not files) — namespaced to this test, so
 * /scan never reads them as a real waiver (Hard AC #9 / P-059).
 *
 *   node tests/regression/SP-20260611-002/coverage-gate-waiver.test.js
 */

const path = require("path");
const ROOT = path.resolve(__dirname, "..", "..", "..");
const { harness } = require(path.join(ROOT, "scripts", "checks", "lib", "fixture-harness"));
const { evaluate, waiverProvenance } = require(path.join(ROOT, "scripts", "dispatch", "coverage-gate"));

const h = harness("SP-002-WS-G3a/coverage-gate-waiver");
const RUN = "run-wsg3a-waiver";

// ── AC-5.1: a reason-only waiver (the OLD attack) now REDS ────────────────────
// PLANTED: a provenance-less waiver carrying ONLY a free-text reason. The pre-fix
// gate `waived`+`continue`d this silently — the exact loophole AC-5.1 closes.
h.violation("AC-5.1 free-text-reason-only waiver is rejected (no provenance)", () =>
  evaluate({
    runId: RUN,
    records: [],
    expected: [{ role: "security-reviewer", waiver: { reason: "skip this sprint, trust me" } }],
  }));

// PLANTED variants: each partial-provenance waiver still REDS (all four fields req'd).
h.violation("AC-5.1 waiver with reason+operator but no ts/trail is rejected", () =>
  evaluate({
    runId: RUN,
    records: [],
    expected: [{ role: "security-reviewer", waiver: { reason: "x", operator: "alex" } }],
  }));

h.violation("AC-5.1 waiver with reason+operator+ts but no auditable trail is rejected", () =>
  evaluate({
    runId: RUN,
    records: [],
    expected: [{ role: "security-reviewer", waiver: { reason: "x", operator: "alex", ts: "2026-06-11T00:00:00Z" } }],
  }));

// ── AC-5.2: a fully provenanced waiver is HONORED and SURFACED ────────────────
// KNOWN-ANSWER: full provenance (operator + ts + reason + trail) → legitimately
// waived, NOT a violation, and the provenance is carried on the waived[] entry.
h.pass("AC-5.2 provenance-backed waiver is honored (no violation)", () =>
  evaluate({
    runId: RUN,
    records: [],
    expected: [
      {
        role: "security-reviewer",
        waiver: {
          reason: "no UI surface this sprint; design-quality N/A",
          operator: "alex",
          ts: "2026-06-11T12:00:00Z",
          ticket: "T-20260611-318",
        },
      },
    ],
  }));

// The provenance must be SURFACED on the waived[] entry (a silenced role is visible,
// not hidden — AC-5.2). Assert the shape explicitly.
h.test("AC-5.2 waived[] entry carries the full provenance (surfaced, not hidden)", () => {
  const res = evaluate({
    runId: RUN,
    records: [],
    expected: [
      {
        role: "security-reviewer",
        waiver: {
          reason: "design-quality N/A",
          source: "operator-cli",
          ts: "2026-06-11T12:00:00Z",
          audit_ref: "audit/2026-06-11/waiver-42",
        },
      },
    ],
  });
  const assert = require("assert");
  assert.strictEqual(res.ok, true, "provenanced waiver must not produce a violation");
  assert.strictEqual(res.waived.length, 1, "exactly one waived role expected");
  const w = res.waived[0];
  assert.strictEqual(w.role, "security-reviewer");
  assert.ok(w.provenance, "waived entry must carry provenance (surfaced for /scan)");
  assert.strictEqual(w.provenance.operator, "operator-cli", "operator/source surfaced");
  assert.strictEqual(w.provenance.ts, "2026-06-11T12:00:00Z", "ts surfaced");
  assert.strictEqual(w.provenance.trail, "audit/2026-06-11/waiver-42", "auditable trail surfaced");
});

// ── unit: waiverProvenance() classifier ───────────────────────────────────────
h.test("waiverProvenance() flags exactly the missing fields", () => {
  const assert = require("assert");
  const r1 = waiverProvenance({ reason: "x" });
  assert.strictEqual(r1.ok, false);
  assert.deepStrictEqual(
    r1.missing.sort(),
    ["operator/source", "record/dispatch_id/ticket/audit_ref", "ts"].sort(),
  );
  const r2 = waiverProvenance({ reason: "x", operator: "a", ts: "2026-06-11", record: "r" });
  assert.strictEqual(r2.ok, true);
  assert.deepStrictEqual(r2.provenance, { reason: "x", operator: "a", ts: "2026-06-11", trail: "r" });
});

// ── FAIL-CLOSED: a malformed waiver value does not silently pass ──────────────
h.failClosed("AC-5.1 a non-object waiver value does not silently pass", () =>
  evaluate({ runId: RUN, records: [], expected: [{ role: "security-reviewer", waiver: "just a string" }] }));

h.done();
