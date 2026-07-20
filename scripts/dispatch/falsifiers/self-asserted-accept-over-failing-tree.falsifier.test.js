"use strict";
// FALSIFIER: rider-1 self-asserted-accept-over-failing-tree — record-trust gate Surface 1 (SP-20260720-002
// Phase 4, AC-4). Adversarial: `input.result_envelope` SELF-ASSERTS `checks_passed:true` /
// `verdict:"accept"` over a tree the FRESH pinned-bundle run actually FAILS a required check on. β rider 1
// (CONTROLLER re-derives, never adopts): `integrate()` must NEVER consult the envelope's verdict fields —
// only its own re-derived, nonce-bound reconcile decides. MUST-BLOCK.
const test = require("node:test");
const assert = require("node:assert");
const path = require("path");

const CONTROLLER = path.join(__dirname, "..", "trusted-controller.js");
const fs = require("fs");

test("rider-1 self-asserted-accept-over-failing-tree — an envelope claiming accept over a FAILING tree is REFUSED (reachability: bundle ran + check-failed FIRED)", (t) => {
  if (!fs.existsSync(CONTROLLER)) return t.skip("pending backend-builder — controller not yet built (falsifier RED)");

  const { makeControllerFixture, standardInput, standardOpts, POISONED_CHECK_CONTEXT } = require("./_lib/controller-fixtures");
  const ctl = require("../trusted-controller");

  const fx = makeControllerFixture("self-asserted");
  t.after(() => fx.cleanup());

  // ATTACK: the envelope SELF-ASSERTS success/accept over a tree the pinned run WILL fail (poisoned files
  // context forces the REQUIRED no-nul-bytes check to fail) — the controller must never read this claim.
  const input = standardInput(fx, {
    result_envelope: {
      success: true,
      verdict: "accept",
      checks_passed: true,
      status: "passed",
      files: ["fake-evidence.txt"], // even a shaped, non-hollow self-claim must not matter
    },
  });
  const opts = standardOpts(fx, { checkContext: POISONED_CHECK_CONTEXT });

  const result = ctl.integrate(input, opts);

  // MUST-BLOCK: the self-asserted accept is REFUSED.
  assert.strictEqual(result.ok, false, "MUST-BLOCK: a self-asserted accept over a failing tree must be refused");
  assert.strictEqual(result.decision, "BLOCKED");
  // Reachability (not a bare false): the bundle genuinely RAN and a check-failed FIRED against the
  // REQUIRED no-nul-bytes check — this is not a short-circuit before the pinned suite ever executed.
  assert.strictEqual(result.reason, "check-failed", "the fresh pinned run's REQUIRED check must have genuinely FAILED and been the refusal reason");
  assert.strictEqual(result.offending, "no-nul-bytes", "the offending check must be the one the poisoned ctx actually failed");
  assert.ok(result.runManifest && result.runManifest.nonce, "a nonce-bound run manifest must have been minted (the reconcile gate was reached)");

  // commitIntegration was NEVER reached: the target ref must be untouched (still at base, not at result).
  const { git, headSha } = require("./_lib/git-scratch");
  const head = headSha(fx.dir, fx.targetRef);
  assert.strictEqual(head, fx.base, "MUST-BLOCK: refs/heads/integ must NOT have advanced — commitIntegration was never reached");
  void git;
});
