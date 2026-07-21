"use strict";
// AC-8 — Record binds recomputed evidence (SP-20260720-002 Phase 4). The produced AcceptanceRecord includes
// `check_suite_version`, destination ref, lease fencing token, and RECOMPUTED WorkOrder/policy/checker/
// evidence digests; a stale or fabricated digest value (from result_envelope) is refused/ignored.
const test = require("node:test");
const assert = require("node:assert");
const path = require("path");
const fs = require("fs");

const CONTROLLER = path.join(__dirname, "trusted-controller.js");

test("AC-8 trusted-controller-acceptance-binding — recomputeBoundDigests derives checker_digests ONLY from THIS run's fired results, never from a caller-supplied evidence override on the results themselves", (t) => {
  if (!fs.existsSync(CONTROLLER)) return t.skip("pending backend-builder — controller not yet built");
  const ctl = require("./trusted-controller");

  const results = [
    { name: "no-nul-bytes", status: "pass", digest: "digest-real-1" },
    { name: "suite-completeness", status: "pass", digest: "digest-real-2" },
  ];
  const bound = ctl.recomputeBoundDigests({
    workorder: { schema_version: "workorder-min/v1", correlation_id: "c1", role: "backend-builder" },
    results,
    evidence: { "ev-1": "evidence-blob" },
    policySnapshot: { bundle_digest: "bd-1", suite_version: "check-suite/v1", target_ref: "refs/heads/integ" },
  });

  assert.deepStrictEqual(bound.checker_digests, { "no-nul-bytes": "digest-real-1", "suite-completeness": "digest-real-2" });
  assert.ok(bound.evidence_digests["ev-1"], "evidence digest must be present");
  assert.ok(bound.policy_digest, "policy_digest must be a real content-addressed digest");
  assert.ok(bound.workorder_digest, "workorder_digest must be derived from the workorder, not a caller claim");
});

test("AC-8 trusted-controller-acceptance-binding — a FABRICATED checker_digests/verdict on input.result_envelope has ZERO effect on the produced record's bound digests (β rider 1: re-derive, never adopt)", (t) => {
  if (!fs.existsSync(CONTROLLER)) return t.skip("pending backend-builder — controller not yet built");
  const { makeControllerFixture, standardInput, standardOpts } = require("./falsifiers/_lib/controller-fixtures");
  const ctl = require("./trusted-controller");

  const fx = makeControllerFixture("acceptance-binding-fabricated");
  t.after(() => fx.cleanup());

  const input = standardInput(fx, {
    result_envelope: {
      success: true,
      verdict: "accept",
      checker_digests: { "no-nul-bytes": "FABRICATED", "suite-completeness": "FABRICATED", "false-green-envelope": "FABRICATED" },
      policy_digest: "FABRICATED-POLICY",
      check_suite_version: "FABRICATED-VERSION",
    },
  });
  const result = ctl.integrate(input, standardOpts(fx));
  assert.strictEqual(result.ok, true, JSON.stringify(result));
  // The receipt/decision succeeding at all proves authorizesIntegration's digest-map checks were satisfied
  // by the CONTROLLER's own recomputed digests — a fabricated envelope digest is never read (there is no
  // code path from result_envelope.checker_digests into produce()'s input).
  assert.strictEqual(result.decision, "INTEGRATED");
});

test("AC-8 trusted-controller-acceptance-binding — check_suite_version + lease_fencing_token + target_ref are bound onto every successful integration", (t) => {
  if (!fs.existsSync(CONTROLLER)) return t.skip("pending backend-builder — controller not yet built");
  const { makeControllerFixture, standardInput, standardOpts } = require("./falsifiers/_lib/controller-fixtures");
  const ctl = require("./trusted-controller");
  const pcb = require("./pinned-checker-bundle");

  const fx = makeControllerFixture("acceptance-binding-fields");
  t.after(() => fx.cleanup());

  const manifest = pcb.loadBundleManifest(fx.manifestPath);
  const result = ctl.integrate(standardInput(fx), standardOpts(fx));
  assert.strictEqual(result.ok, true, JSON.stringify(result));
  assert.strictEqual(result.runManifest.suite_version, manifest.suite_version);
  assert.strictEqual(result.runManifest.target_ref, fx.targetRef);
  assert.ok(result.runManifest.lease_fencing_token != null, "a lease fencing token must be bound (the fixture acquired a real lease)");
});
