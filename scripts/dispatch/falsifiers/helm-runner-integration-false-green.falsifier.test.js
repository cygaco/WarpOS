"use strict";
// FALSIFIER: helm-runner-integration-false-green — record-trust gate Surface 5 (SP-20260720-002 Phase 4 R1,
// QA-005/BE-CQ-P4-001+002/SR-TRUSTROOT-004, FIX-5a). A PASS panel whose downstream controller-integration
// is refused/blocked/didn't actually mutate the ref must NEVER let the overall helm status read PASS — and
// `performRefUpdate` must be FORCED true, never forwarded verbatim (an absent/false value would let the
// controller return INTEGRATED without ever writing the ref). MUST-BLOCK.
const test = require("node:test");
const assert = require("node:assert");
const path = require("path");
const fs = require("fs");

const HELM_RUNNER = path.join(__dirname, "..", "helm-runner.js");

function passingLanes() {
  return [
    { laneId: "gpt", provider: "openai", runResult: { hasEvidence: true, alive: true, verdict: "pass", observedProvider: "openai", fallback: false } },
    { laneId: "claude", provider: "claude", runResult: { hasEvidence: true, alive: true, verdict: "pass", observedProvider: "claude", fallback: false } },
  ];
}

test("FIX-5a helm-runner-integration-false-green — (i) a PASS panel whose controller REFUSES integration reads a distinct NON-PASS status, never PASS", (t) => {
  if (!fs.existsSync(HELM_RUNNER)) return t.skip("pending backend-builder — helm-runner not yet built");
  const hr = require("../helm-runner");

  const integrateFn = () => ({ ok: false, decision: "BLOCKED", reason: "check-failed" });
  const res = hr.runHelms(
    { profile: "panel-2family", lanes: passingLanes(), integrate: { base_commit: "b", result_commit: "r", target_ref: "refs/heads/x" } },
    { integrateFn },
  );

  assert.notStrictEqual(res.status, "PASS", "MUST-BLOCK: a controller refusal must never let the overall helm status stay PASS");
  assert.strictEqual(res.status, hr.INTEGRATION_BLOCKED);
  assert.strictEqual(res.panel.status, "PASS", "the PANEL's own reduction is correctly PASS — this is specifically about the top-level status not collapsing the distinction");
  assert.strictEqual(res.integration.ok, false);
});

test("FIX-5a helm-runner-integration-false-green — (i-b) an integrateFn that THROWS is caught, never a silent pass", (t) => {
  if (!fs.existsSync(HELM_RUNNER)) return t.skip("pending backend-builder — helm-runner not yet built");
  const hr = require("../helm-runner");

  const integrateFn = () => {
    throw new Error("simulated controller crash");
  };
  const res = hr.runHelms(
    { profile: "panel-2family", lanes: passingLanes(), integrate: { base_commit: "b", result_commit: "r", target_ref: "refs/heads/x" } },
    { integrateFn },
  );
  assert.notStrictEqual(res.status, "PASS");
  assert.strictEqual(res.integration.ok, false);
  assert.strictEqual(res.integration.reason, "integrate-threw");
});

test("FIX-5a helm-runner-integration-false-green — (ii) an integrateFn that returns ok:true/INTEGRATED but with performRefUpdate OMITTED from controllerOpts still gets performRefUpdate:true FORCED — never a false INTEGRATED with no real write", (t) => {
  if (!fs.existsSync(HELM_RUNNER)) return t.skip("pending backend-builder — helm-runner not yet built");
  const hr = require("../helm-runner");

  let seenOpts;
  const integrateFn = (input, opts) => {
    seenOpts = opts;
    return { ok: true, decision: "INTEGRATED", receipt: { committed_head: input.result_commit } };
  };
  // Deliberately OMIT performRefUpdate from controllerOpts (as a naive/buggy caller might).
  const res = hr.runHelms(
    { profile: "panel-2family", lanes: passingLanes(), integrate: { base_commit: "b", result_commit: "r", target_ref: "refs/heads/x" } },
    { integrateFn, controllerOpts: {} },
  );
  assert.strictEqual(seenOpts.performRefUpdate, true, "MUST-FORCE: helm-runner must force performRefUpdate:true regardless of what the caller's controllerOpts said");
  assert.strictEqual(res.status, "PASS");
});

test("FIX-5a helm-runner-integration-false-green — (ii-b) a controller response claiming INTEGRATED but whose receipt.committed_head does NOT match the accepted result_commit is REFUSED at the helm-runner level too", (t) => {
  if (!fs.existsSync(HELM_RUNNER)) return t.skip("pending backend-builder — helm-runner not yet built");
  const hr = require("../helm-runner");

  const integrateFn = () => ({ ok: true, decision: "INTEGRATED", receipt: { committed_head: "SOME-OTHER-COMMIT" } });
  const res = hr.runHelms(
    { profile: "panel-2family", lanes: passingLanes(), integrate: { base_commit: "b", result_commit: "the-real-accepted-commit", target_ref: "refs/heads/x" } },
    { integrateFn },
  );
  assert.notStrictEqual(res.status, "PASS", "MUST-BLOCK: a mismatched committed_head must never read as an overall PASS");
  assert.strictEqual(res.status, hr.INTEGRATION_BLOCKED);
});

test("FIX-5a helm-runner-integration-false-green — CONTROL: a genuinely correct INTEGRATED receipt (committed_head === result_commit, performRefUpdate forced true) reads PASS", (t) => {
  if (!fs.existsSync(HELM_RUNNER)) return t.skip("pending backend-builder — helm-runner not yet built");
  const hr = require("../helm-runner");

  const integrateFn = (input) => ({ ok: true, decision: "INTEGRATED", receipt: { committed_head: input.result_commit } });
  const res = hr.runHelms(
    { profile: "panel-2family", lanes: passingLanes(), integrate: { base_commit: "b", result_commit: "r", target_ref: "refs/heads/x" } },
    { integrateFn },
  );
  assert.strictEqual(res.status, "PASS", JSON.stringify(res));
});
