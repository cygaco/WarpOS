"use strict";
// FALSIFIER: sol-A3 sol-a3-optional-lane-semantics — record-trust gate Surface 5 (SP-20260720-002 Phase 4,
// G4.5, AC-23). An OPTIONAL agy lane that RAN and FAILED binds a non-PASS result (`optional-lane-ran-and-
// failed` — it is bound, not silently dropped, because on panel-3lab agy is REQUIRED and its failure MUST
// bind). Positive companion: sol-a3-absent-optional-agy.positive.test.js (an ABSENT agy lane on
// panel-2family does NOT block — the degraded floor). MUST-BLOCK on the failed-and-ran case.
const test = require("node:test");
const assert = require("node:assert");
const path = require("path");
const fs = require("fs");

const HELM_RUNNER = path.join(__dirname, "..", "helm-runner.js");

test("sol-A3 sol-a3-optional-lane-semantics — an agy lane that RAN and FAILED binds (on panel-3lab, where agy is required)", (t) => {
  if (!fs.existsSync(HELM_RUNNER)) return t.skip("pending backend-builder — helm-runner not yet built (falsifier RED)");
  const hr = require("../helm-runner");

  const lanes = [
    { laneId: "gpt", provider: "openai", runResult: { hasEvidence: true, alive: true, verdict: "pass", observedProvider: "openai", fallback: false } },
    { laneId: "claude", provider: "claude", runResult: { hasEvidence: true, alive: true, verdict: "pass", observedProvider: "claude", fallback: false } },
    { laneId: "agy", provider: "antigravity", runResult: { hasEvidence: true, alive: true, verdict: "fail", observedProvider: "antigravity", fallback: false } },
  ];
  const res = hr.runHelms({ profile: "panel-3lab", lanes }, {});

  assert.notStrictEqual(res.status, "PASS", "MUST-BLOCK: an optional lane that RAN and FAILED must bind, never silently pass");
  assert.strictEqual(res.status, "FAIL");
  assert.strictEqual(res.panel.laneStatus.agy, "fail");
  assert.strictEqual(res.integration, undefined);
});
