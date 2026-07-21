"use strict";
// AC-25 — Portable non-Claude proof (SP-20260720-002 Phase 4, R-10). The exit proof records ONE codex
// (non-Claude) WorkOrder -> ResultEnvelope -> controller-checked integration pass, PLUS the dispatch
// control-plane lifecycle invariants (started/completed/died/timedOut/quota/approval/resume) — sourced
// verbatim from the SAME real control-plane record, never fabricated/self-claimed by helm-runner itself.
const test = require("node:test");
const assert = require("node:assert");
const path = require("path");
const fs = require("fs");

const HELM_RUNNER = path.join(__dirname, "helm-runner.js");

test("AC-25 helm-runner-codex-exit-proof — collectLaneEvidence forwards the codex lane's controlPlane portable-exit-proof fields VERBATIM", (t) => {
  if (!fs.existsSync(HELM_RUNNER)) return t.skip("pending backend-builder — helm-runner not yet built");
  const hr = require("./helm-runner");

  const codexControlPlane = {
    started: true,
    completed: true,
    died: false,
    timedOut: false,
    quota: { exceeded: false },
    approval: { required: false },
    resume: { attempted: false },
  };
  const lane = hr.collectLaneEvidence(
    { laneId: "gpt", provider: "openai" },
    { hasEvidence: true, alive: true, verdict: "pass", observedProvider: "openai", fallback: false, controlPlane: codexControlPlane },
  );
  assert.deepStrictEqual(lane.controlPlane, codexControlPlane, "the portable exit-proof fields must be forwarded VERBATIM from the real control-plane record");
});

test("AC-25 helm-runner-codex-exit-proof — a MISSING controlPlane on the record yields controlPlane:null (never a fabricated default shape)", (t) => {
  if (!fs.existsSync(HELM_RUNNER)) return t.skip("pending backend-builder — helm-runner not yet built");
  const hr = require("./helm-runner");

  const lane = hr.collectLaneEvidence({ laneId: "gpt", provider: "openai" }, { hasEvidence: true, alive: true, verdict: "pass", observedProvider: "openai" });
  assert.strictEqual(lane.controlPlane, null);
});

test("AC-25 helm-runner-codex-exit-proof — a REAL end-to-end GPT(codex)+Claude PASS drives exactly one controller-checked integration, and the GPT lane's control-plane evidence survives into perHelm unmodified", (t) => {
  if (!fs.existsSync(HELM_RUNNER)) return t.skip("pending backend-builder — helm-runner not yet built");
  const { makeControllerFixture, standardInput } = require("./falsifiers/_lib/controller-fixtures");
  const hr = require("./helm-runner");

  const fx = makeControllerFixture("codex-exit-proof-e2e");
  t.after(() => fx.cleanup());

  const codexControlPlane = { started: true, completed: true, died: false, timedOut: false, quota: { exceeded: false }, approval: { required: false }, resume: { attempted: false } };
  const lanes = [
    { laneId: "gpt", provider: "openai", runResult: { hasEvidence: true, alive: true, verdict: "pass", observedProvider: "openai", fallback: false, controlPlane: codexControlPlane } },
    { laneId: "claude", provider: "claude", runResult: { hasEvidence: true, alive: true, verdict: "pass", observedProvider: "claude", fallback: false } },
  ];
  const integrateInput = standardInput(fx);
  const controllerOpts = { bundleManifestPath: fx.manifestPath, bundleRoot: fx.bundleRoot, candidateRoot: fx.dir, gitRoot: fx.dir, spId: fx.spId, leaseRoot: fx.leaseRoot };

  const res = hr.runHelms(
    {
      profile: "panel-2family",
      lanes,
      integrate: {
        base_commit: integrateInput.base_commit,
        result_commit: integrateInput.result_commit,
        target_ref: integrateInput.target_ref,
        workorder: integrateInput.workorder,
        result_envelope: integrateInput.result_envelope,
      },
    },
    { controllerOpts },
  );

  assert.strictEqual(res.status, "PASS", JSON.stringify(res.panel));
  assert.ok(res.integration && res.integration.ok === true);
  const gptLane = res.perHelm.find((l) => l.laneId === "gpt");
  assert.deepStrictEqual(gptLane.controlPlane, codexControlPlane);
  // R-10: never probes agy, never counts an agy route/default as served-model proof — no agy lane appears
  // anywhere in this proof at all (panel-2family doesn't require it, and none was supplied).
  assert.strictEqual(res.perHelm.find((l) => l.laneId === "agy"), undefined);
});
