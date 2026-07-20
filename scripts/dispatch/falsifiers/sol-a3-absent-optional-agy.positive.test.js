"use strict";
// POSITIVE COMPANION: sol-a3-optional-lane-semantics.falsifier.test.js (SP-20260720-002 Phase 4, AC-23). An
// ABSENT agy lane on the panel-2family degraded floor does NOT block a passing GPT+Claude run — panel-2family
// simply does not REQUIRE agy (ED-060) — and a PASS drives exactly ONE integration through the controller.
const test = require("node:test");
const assert = require("node:assert");
const path = require("path");
const fs = require("fs");

const HELM_RUNNER = path.join(__dirname, "..", "helm-runner.js");

test("sol-a3-absent-optional-agy POSITIVE — no agy lane at all on panel-2family still PASSES and drives exactly one integration", (t) => {
  if (!fs.existsSync(HELM_RUNNER)) return t.skip("pending backend-builder — helm-runner not yet built (falsifier RED)");
  const hr = require("../helm-runner");

  const lanes = [
    { laneId: "gpt", provider: "openai", runResult: { hasEvidence: true, alive: true, verdict: "pass", observedProvider: "openai", fallback: false } },
    { laneId: "claude", provider: "claude", runResult: { hasEvidence: true, alive: true, verdict: "pass", observedProvider: "claude", fallback: false } },
    // no agy entry at all
  ];

  let integrateCalls = 0;
  const integrateFn = (input, opts) => {
    integrateCalls++;
    assert.strictEqual(input.base_commit, "base-x");
    void opts;
    return { ok: true, decision: "INTEGRATED", receipt: { committed_head: "result-y" } };
  };

  const res = hr.runHelms(
    { profile: "panel-2family", lanes, integrate: { base_commit: "base-x", result_commit: "result-y", target_ref: "refs/heads/main" } },
    { integrateFn },
  );

  assert.strictEqual(res.status, "PASS", JSON.stringify(res.panel));
  assert.strictEqual(integrateCalls, 1, "exactly ONE integration must be driven on a PASS");
  assert.ok(res.integration && res.integration.ok === true);
});
