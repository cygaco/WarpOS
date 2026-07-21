"use strict";
// AC-28 — Non-vacuous positive path (SP-20260720-002 Phase 4). A valid, current bundle run with ALL
// required checks, correct hashes, a current lease, and clean required lanes produces a successful
// integration — preventing a reject-everything `integrate()`/`reconcileRunManifest`/`authorizesIntegration`
// stub from vacuously satisfying the whole falsifier corpus.
const test = require("node:test");
const assert = require("node:assert");
const path = require("path");
const fs = require("fs");

const CONTROLLER = path.join(__dirname, "trusted-controller.js");

test("AC-28 trusted-controller-positive-companion — reconcileRunManifest POSITIVE: every expected check present, correctly-nonced, and passing -> ok:true", (t) => {
  if (!fs.existsSync(CONTROLLER)) return t.skip("pending backend-builder — controller not yet built");
  const ctl = require("./trusted-controller");

  const runManifest = {
    schema_version: "run-manifest/v1",
    nonce: "nonce-positive-1",
    minted_at: Date.now(),
    expected_checks: ["false-green-envelope", "no-nul-bytes", "suite-completeness"],
    required_checks: ["false-green-envelope", "no-nul-bytes", "suite-completeness"],
  };
  const results = runManifest.expected_checks.map((name) => ({
    name,
    status: "pass",
    digest: `digest-${name}`,
    nonce: runManifest.nonce,
  }));
  const out = ctl.reconcileRunManifest(runManifest, results);
  assert.deepStrictEqual(out, { ok: true });
});

test("AC-28 trusted-controller-positive-companion — a FULL real end-to-end run (real bundle, real lease, real git) DOES integrate — a reject-everything integrate() stub is defeated by this control", (t) => {
  if (!fs.existsSync(CONTROLLER)) return t.skip("pending backend-builder — controller not yet built");
  const { makeControllerFixture, standardInput, standardOpts } = require("./falsifiers/_lib/controller-fixtures");
  const { headSha } = require("./falsifiers/_lib/git-scratch");
  const ctl = require("./trusted-controller");

  const fx = makeControllerFixture("positive-companion-e2e");
  t.after(() => fx.cleanup());

  const result = ctl.integrate(standardInput(fx), standardOpts(fx));
  assert.strictEqual(result.ok, true, JSON.stringify(result));
  assert.strictEqual(result.decision, "INTEGRATED");
  assert.strictEqual(headSha(fx.dir, fx.targetRef), fx.result);

  // Defeats a constant-false authorizesIntegration/integrate() stub: a REAL, valid record over a REAL clean
  // tree, with a REAL current lease, must authorize — this is not decidable by any reject-everything stub.
  assert.notStrictEqual(result.ok, false);
});

test("AC-28 trusted-controller-positive-companion — helm-runner's own PASS path (a real controller call through runHelms) also integrates — proves the positive path holds through the aggregate entrypoint too", (t) => {
  const HELM_RUNNER = path.join(__dirname, "helm-runner.js");
  if (!fs.existsSync(CONTROLLER) || !fs.existsSync(HELM_RUNNER)) return t.skip("pending backend-builder — controller/helm-runner not yet built");
  const { makeControllerFixture, standardInput } = require("./falsifiers/_lib/controller-fixtures");
  const hr = require("./helm-runner");

  const fx = makeControllerFixture("positive-companion-helm");
  t.after(() => fx.cleanup());

  const lanes = [
    { laneId: "gpt", provider: "openai", runResult: { hasEvidence: true, alive: true, verdict: "pass", observedProvider: "openai", fallback: false } },
    { laneId: "claude", provider: "claude", runResult: { hasEvidence: true, alive: true, verdict: "pass", observedProvider: "claude", fallback: false } },
  ];
  const controllerOpts = {
    bundleManifestPath: fx.manifestPath,
    bundleRoot: fx.bundleRoot,
    candidateRoot: fx.dir,
    gitRoot: fx.dir,
    spId: fx.spId,
    leaseRoot: fx.leaseRoot,
  };
  const integrateInput = standardInput(fx);
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
});
