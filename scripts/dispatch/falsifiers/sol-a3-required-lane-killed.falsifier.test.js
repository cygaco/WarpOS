"use strict";
// FALSIFIER: sol-A3 sol-a3-required-lane-killed — record-trust gate Surface 5 (SP-20260720-002 Phase 4,
// G4.5, AC-22). Killing EITHER required lane (GPT or Claude) yields BLOCKED, never PASS — and, on
// panel-2family, a helm-runner PASS would otherwise drive exactly ONE integration through the controller;
// this falsifier also proves that integration is NEVER attempted when the panel itself is not PASS.
// MUST-BLOCK.
const test = require("node:test");
const assert = require("node:assert");
const path = require("path");
const fs = require("fs");

const HELM_RUNNER = path.join(__dirname, "..", "helm-runner.js");

test("sol-A3 sol-a3-required-lane-killed — killing the GPT required lane MUST-BLOCK (never PASS), and no integration is attempted", (t) => {
  if (!fs.existsSync(HELM_RUNNER)) return t.skip("pending backend-builder — helm-runner not yet built (falsifier RED)");
  const hr = require("../helm-runner");

  let integrateCalls = 0;
  const integrateFn = () => {
    integrateCalls++;
    return { ok: true, decision: "INTEGRATED" };
  };

  const lanes = [
    { laneId: "gpt", provider: "openai", runResult: { hasEvidence: true, alive: true, verdict: "fail", observedProvider: "openai", fallback: false } },
    { laneId: "claude", provider: "claude", runResult: { hasEvidence: true, alive: true, verdict: "pass", observedProvider: "claude", fallback: false } },
  ];
  const res = hr.runHelms({ profile: "panel-2family", lanes, integrate: { base_commit: "x", result_commit: "y", target_ref: "refs/heads/integ" } }, { integrateFn });

  assert.notStrictEqual(res.status, "PASS", "MUST-BLOCK: a required lane FAILED, the panel must never read PASS");
  assert.strictEqual(res.status, "FAIL");
  assert.strictEqual(res.integration, undefined, "no integration may be driven when the panel is not PASS");
  assert.strictEqual(integrateCalls, 0, "trusted-controller.integrate() must NEVER be reached when a required lane failed");
});

test("sol-A3 sol-a3-required-lane-killed — killing the Claude required lane MUST-BLOCK (never PASS)", (t) => {
  if (!fs.existsSync(HELM_RUNNER)) return t.skip("pending backend-builder — helm-runner not yet built (falsifier RED)");
  const hr = require("../helm-runner");

  let integrateCalls = 0;
  const integrateFn = () => {
    integrateCalls++;
    return { ok: true, decision: "INTEGRATED" };
  };

  const lanes = [
    { laneId: "gpt", provider: "openai", runResult: { hasEvidence: true, alive: true, verdict: "pass", observedProvider: "openai", fallback: false } },
    { laneId: "claude", provider: "claude", runResult: { hasEvidence: true, alive: false, verdict: "", observedProvider: "claude", fallback: false } }, // dead
  ];
  const res = hr.runHelms({ profile: "panel-2family", lanes, integrate: { base_commit: "x", result_commit: "y", target_ref: "refs/heads/integ" } }, { integrateFn });

  assert.notStrictEqual(res.status, "PASS");
  assert.strictEqual(res.integration, undefined);
  assert.strictEqual(integrateCalls, 0);
});
