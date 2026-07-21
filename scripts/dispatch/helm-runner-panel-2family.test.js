"use strict";
// AC-20 — Two-family profile floor (SP-20260720-002 Phase 4). HELM-RUNNER obtains profile semantics
// THROUGH `panel-lanes` (never a bespoke re-implementation); GPT and Claude are required for
// `panel-2family`, with >=2 OBSERVED provider families required for PASS.
const test = require("node:test");
const assert = require("node:assert");
const path = require("path");
const fs = require("fs");

const HELM_RUNNER = path.join(__dirname, "helm-runner.js");

test("AC-20 helm-runner-panel-2family — the profile is obtained via panel-lanes.getProfile (structural: helm-runner.js requires panel-lanes, never re-declares required/min_families locally)", (t) => {
  if (!fs.existsSync(HELM_RUNNER)) return t.skip("pending backend-builder — helm-runner not yet built");
  const src = fs.readFileSync(HELM_RUNNER, "utf8");
  assert.ok(/require\(["']\.\/panel-lanes["']\)/.test(src), "helm-runner.js must require('./panel-lanes') — the single lane-reduction authority");
  assert.ok(!/required\s*:\s*\[["']gpt["']/.test(src), "helm-runner.js must not hand-declare a bespoke required-lane list — that authority lives in panel-lanes.js's manifest");
});

test("AC-20 helm-runner-panel-2family — GPT+Claude both alive+clean+attested -> PASS with exactly 2 observed families", (t) => {
  if (!fs.existsSync(HELM_RUNNER)) return t.skip("pending backend-builder — helm-runner not yet built");
  const hr = require("./helm-runner");

  const lanes = [
    { laneId: "gpt", provider: "openai", runResult: { hasEvidence: true, alive: true, verdict: "pass", observedProvider: "openai", fallback: false } },
    { laneId: "claude", provider: "claude", runResult: { hasEvidence: true, alive: true, verdict: "pass", observedProvider: "claude", fallback: false } },
  ];
  const res = hr.runHelms({ profile: "panel-2family", lanes }, {});
  assert.strictEqual(res.status, "PASS", JSON.stringify(res.panel));
  assert.strictEqual(res.panel.families, 2);
  assert.strictEqual(res.panel.binding, false, "panel-2family is the non-binding degraded floor per the manifest");
});

test("AC-20 helm-runner-panel-2family — GPT missing entirely -> BLOCKED (never PASS on a single family)", (t) => {
  if (!fs.existsSync(HELM_RUNNER)) return t.skip("pending backend-builder — helm-runner not yet built");
  const hr = require("./helm-runner");

  const lanes = [{ laneId: "claude", provider: "claude", runResult: { hasEvidence: true, alive: true, verdict: "pass", observedProvider: "claude", fallback: false } }];
  const res = hr.runHelms({ profile: "panel-2family", lanes }, {});
  assert.notStrictEqual(res.status, "PASS");
});

test("AC-20 helm-runner-panel-2family — an UNKNOWN profile name throws/blocks rather than silently falling back to a default that could mask a required lane", (t) => {
  if (!fs.existsSync(HELM_RUNNER)) return t.skip("pending backend-builder — helm-runner not yet built");
  const hr = require("./helm-runner");

  const res = hr.runHelms({ profile: "panel-does-not-exist", lanes: [] }, {});
  assert.notStrictEqual(res.status, "PASS");
  assert.strictEqual(res.integration, undefined);
});
