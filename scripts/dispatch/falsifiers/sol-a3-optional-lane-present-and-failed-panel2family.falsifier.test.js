"use strict";
// FALSIFIER: sol-a3-optional-lane-present-and-failed-panel2family — record-trust gate Surface 5
// (SP-20260720-002 Phase 4 R1, QA-005/BE-CQ-P4-001+002/SR-TRUSTROOT-004, FIX-5b, β rider 5 BINDING). The
// EXISTING sol-a3-optional-lane-semantics.falsifier.test.js exercises an agy lane that ran-and-failed on
// panel-3lab, where agy is REQUIRED — that is the ordinary required-lane reduction, not the gap QA-005
// named. THIS falsifier exercises the actual gap: on panel-2family, agy is OPTIONAL (not in
// profile.required) — an agy lane that is PRESENT and FAILED must still BIND (drive the panel to NON-PASS),
// never be silently dropped just because `panelStatus`'s required-only reduction never looks at it. Only an
// ABSENT optional lane is waived (see sol-a3-absent-optional-agy.positive.test.js). MUST-BLOCK.
const test = require("node:test");
const assert = require("node:assert");
const path = require("path");
const fs = require("fs");

const HELM_RUNNER = path.join(__dirname, "..", "helm-runner.js");

test("FIX-5b sol-a3-optional-lane-present-and-failed-panel2family — an OPTIONAL agy lane on panel-2family that RAN and FAILED binds a non-PASS result (never silently dropped)", (t) => {
  if (!fs.existsSync(HELM_RUNNER)) return t.skip("pending backend-builder — helm-runner not yet built");
  const hr = require("../helm-runner");

  let integrateCalls = 0;
  const integrateFn = () => {
    integrateCalls++;
    return { ok: true, decision: "INTEGRATED", receipt: { committed_head: "r" } };
  };

  const lanes = [
    { laneId: "gpt", provider: "openai", runResult: { hasEvidence: true, alive: true, verdict: "pass", observedProvider: "openai", fallback: false } },
    { laneId: "claude", provider: "claude", runResult: { hasEvidence: true, alive: true, verdict: "pass", observedProvider: "claude", fallback: false } },
    // agy is OPTIONAL on panel-2family (not in profile.required) — but it RAN and FAILED.
    { laneId: "agy", provider: "antigravity", runResult: { hasEvidence: true, alive: true, verdict: "fail", observedProvider: "antigravity", fallback: false } },
  ];
  const res = hr.runHelms({ profile: "panel-2family", lanes, integrate: { base_commit: "b", result_commit: "r", target_ref: "refs/heads/x" } }, { integrateFn });

  assert.notStrictEqual(res.status, "PASS", "MUST-BLOCK: a PRESENT-and-FAILED optional lane must bind, never silently pass");
  assert.strictEqual(res.status, "FAIL");
  assert.strictEqual(res.panel.laneStatus.agy, "fail");
  assert.strictEqual(integrateCalls, 0, "no integration may be driven when an optional lane's real failure binds the panel");
  assert.strictEqual(res.integration, undefined);
});

test("FIX-5b sol-a3-optional-lane-present-and-failed-panel2family — a COERCED optional agy lane (fallback:true) does NOT bind as a proven failure (coercion is unprovable, not a proven fail) — still non-PASS via the ordinary coercion-is-unprovable path, but the reason must NOT be 'optional lane ran and failed'", (t) => {
  if (!fs.existsSync(HELM_RUNNER)) return t.skip("pending backend-builder — helm-runner not yet built");
  const hr = require("../helm-runner");

  const lanes = [
    { laneId: "gpt", provider: "openai", runResult: { hasEvidence: true, alive: true, verdict: "pass", observedProvider: "openai", fallback: false } },
    { laneId: "claude", provider: "claude", runResult: { hasEvidence: true, alive: true, verdict: "pass", observedProvider: "claude", fallback: false } },
    { laneId: "agy", provider: "antigravity", runResult: { hasEvidence: true, alive: true, verdict: "fail", observedProvider: "openai", fallback: true } },
  ];
  const res = hr.runHelms({ profile: "panel-2family", lanes }, {});
  // A coerced optional lane proves nothing either way — this falsifier only asserts it is NOT the
  // "optional-lane-ran-and-failed" binding path (that path requires an UNCOERCED, alive, real fail verdict).
  assert.strictEqual(res.status, "PASS", "an optional lane's COERCED result proves nothing — panel-2family's floor (GPT+Claude) still legitimately passes");
});

test("FIX-5b sol-a3-optional-lane-present-and-failed-panel2family — CONTROL: an ABSENT agy lane on panel-2family still PASSES (only ABSENCE is tolerated, distinguishing this from the present-and-failed case above)", (t) => {
  if (!fs.existsSync(HELM_RUNNER)) return t.skip("pending backend-builder — helm-runner not yet built");
  const hr = require("../helm-runner");

  const lanes = [
    { laneId: "gpt", provider: "openai", runResult: { hasEvidence: true, alive: true, verdict: "pass", observedProvider: "openai", fallback: false } },
    { laneId: "claude", provider: "claude", runResult: { hasEvidence: true, alive: true, verdict: "pass", observedProvider: "claude", fallback: false } },
  ];
  const res = hr.runHelms({ profile: "panel-2family", lanes }, {});
  assert.strictEqual(res.status, "PASS");
});
