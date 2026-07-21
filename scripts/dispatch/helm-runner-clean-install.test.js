"use strict";
// AC-21 — Aggregate entrypoint has no parallel trust path (SP-20260720-002 Phase 4). A clean-install flow
// for every Phase-4-contracted helm/profile reaches integration ONLY through the controller and pinned
// bundle — helm-runner.js NEVER calls produce()/authorizesIntegration()/commitIntegration() directly.
const test = require("node:test");
const assert = require("node:assert");
const path = require("path");
const fs = require("fs");

const HELM_RUNNER = path.join(__dirname, "helm-runner.js");

test("AC-21 helm-runner-clean-install — STRUCTURAL: helm-runner.js requires ONLY trusted-controller.js as its integration route, never acceptance-record.js directly", (t) => {
  if (!fs.existsSync(HELM_RUNNER)) return t.skip("pending backend-builder — helm-runner not yet built");
  const src = fs.readFileSync(HELM_RUNNER, "utf8");
  assert.ok(/require\(["']\.\/trusted-controller["']\)/.test(src), "helm-runner.js must require('./trusted-controller')");
  assert.ok(!/require\(["']\.\/acceptance-record["']\)/.test(src), "helm-runner.js must NEVER require('./acceptance-record') directly — that would be a second, parallel trust path");
  assert.ok(!/\.produce\(|\.authorizesIntegration\(|\.commitIntegration\(/.test(src), "helm-runner.js must never call produce()/authorizesIntegration()/commitIntegration() itself");
});

test("AC-21 helm-runner-clean-install — a PASS panel calls the injected integrateFn EXACTLY ONCE, with the caller's exact integration coordinates", (t) => {
  if (!fs.existsSync(HELM_RUNNER)) return t.skip("pending backend-builder — helm-runner not yet built");
  const hr = require("./helm-runner");

  let calls = 0;
  let seenInput, seenOpts;
  const integrateFn = (input, opts) => {
    calls++;
    seenInput = input;
    seenOpts = opts;
    return { ok: true, decision: "INTEGRATED", receipt: { committed_head: input.result_commit } };
  };

  const lanes = [
    { laneId: "gpt", provider: "openai", runResult: { hasEvidence: true, alive: true, verdict: "pass", observedProvider: "openai", fallback: false } },
    { laneId: "claude", provider: "claude", runResult: { hasEvidence: true, alive: true, verdict: "pass", observedProvider: "claude", fallback: false } },
  ];
  const res = hr.runHelms(
    { profile: "panel-2family", lanes, integrate: { base_commit: "base-x", result_commit: "y-result", target_ref: "refs/heads/main" } },
    // S2 (R2): `controllerOpts` is no longer spread VERBATIM — it is filtered to CONTROLLER_OPT_ALLOWLIST.
    // An allowlisted coordinate (`bundleRoot`) must transit; an arbitrary key (`foo`) — and, critically, any
    // trust-predicate seam — must NOT (see controller-di-seam-creep.falsifier.test.js for the full set).
    { integrateFn, controllerOpts: { bundleRoot: "/b", foo: "bar", hookLivenessCheckFn: () => ({ ok: true }) } },
  );

  assert.strictEqual(calls, 1, "exactly ONE integration must be driven on a PASS — never zero, never more than one");
  assert.strictEqual(seenInput.result_commit, "y-result");
  assert.strictEqual(seenOpts.bundleRoot, "/b", "an ALLOWLISTED controllerOpts coordinate must still reach the controller");
  assert.ok(!("foo" in seenOpts), "a non-allowlisted controllerOpts key must be DROPPED, never forwarded verbatim");
  assert.ok(!("hookLivenessCheckFn" in seenOpts), "MUST-BLOCK: a trust-predicate seam must never transit helm-runner into the controller");
  assert.strictEqual(seenOpts.performRefUpdate, true, "AC-21/FIX-5a: the runner must FORCE performRefUpdate:true — never forward an absent/false value verbatim");
  assert.strictEqual(res.status, "PASS");
});

test("AC-21 helm-runner-clean-install — a NON-PASS panel NEVER calls integrateFn, even when input.integrate is present", (t) => {
  if (!fs.existsSync(HELM_RUNNER)) return t.skip("pending backend-builder — helm-runner not yet built");
  const hr = require("./helm-runner");

  let calls = 0;
  const integrateFn = () => {
    calls++;
    return { ok: true, decision: "INTEGRATED" };
  };
  const lanes = [{ laneId: "gpt", provider: "openai", runResult: { hasEvidence: true, alive: true, verdict: "fail", observedProvider: "openai", fallback: false } }];
  const res = hr.runHelms({ profile: "panel-2family", lanes, integrate: { base_commit: "b", result_commit: "r", target_ref: "refs/heads/x" } }, { integrateFn });

  assert.strictEqual(calls, 0);
  assert.strictEqual(res.integration, undefined);
});
