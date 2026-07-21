"use strict";
// FALSIFIER: G4.2 head-advanced-after-check — record-trust gate Surface 1 (SP-20260720-002 Phase 4, AC-5).
// Adversarial: the destination ref's LIVE head advances BETWEEN the controller's check/authorize step and
// its atomic ref update — the CAS must refuse rather than merge against a different head than it validated.
// This falsifier drives the SAME scenario acceptance-record.js's own retained `validation-to-merge-race`
// falsifier proves at the primitive layer, but REACHED THROUGH the controller's integrate() entrypoint
// (build_spec: "delegates to primitive validation-to-merge-race") — proving the controller's own CAS call
// genuinely surfaces that primitive's refusal, not a bypassed/short-circuited path. MUST-BLOCK.
const test = require("node:test");
const assert = require("node:assert");
const path = require("path");
const fs = require("fs");

const CONTROLLER = path.join(__dirname, "..", "trusted-controller.js");

test("G4.2 head-advanced-after-check — a live head that moved between check and commit REFUSES via the controller (delegates to validation-to-merge-race)", (t) => {
  if (!fs.existsSync(CONTROLLER)) return t.skip("pending backend-builder — controller not yet built (falsifier RED)");

  const { makeControllerFixture, standardInput, standardOpts } = require("./_lib/controller-fixtures");
  const { headSha } = require("./_lib/git-scratch");
  const ctl = require("../trusted-controller");

  const fx = makeControllerFixture("head-advanced");
  t.after(() => fx.cleanup());

  // ATTACK: opts.liveHead simulates the destination ref's REAL head having moved to some other commit
  // between the controller's validation step and its CAS write — a hermetic TOCTOU seam forwarded straight
  // to acceptance-record.js#commitIntegration's own `opts.liveHead` (never used by production callers, who
  // let commitIntegration resolve the real live head fresh).
  const movedHead = "d".repeat(40); // any commit that is NOT fx.base — simulates a race
  // S2 (R2): `liveHead` is no longer a caller-suppliable `opts` key — the production `integrate()` cannot
  // reach it at all. It is driven through the SANCTIONED test-producer export `integrateForTest(input,
  // opts, seams)` (same pattern as acceptance-record.js#produceForTest).
  const result = ctl.integrateForTest(standardInput(fx), standardOpts(fx), { liveHead: movedHead });

  assert.strictEqual(result.ok, false, "MUST-BLOCK: a moved live head must refuse the CAS");
  assert.strictEqual(result.decision, "BLOCKED");
  // Reachability: the EXACT delegated primitive reason (acceptance-record.js#commitIntegration's own
  // vocabulary) — proving the controller's own CAS call reached and surfaced the primitive's refusal.
  assert.strictEqual(result.reason, "validation-to-merge-race");
  assert.ok(result.runManifest && result.runManifest.nonce, "reconcile + authorize must have been reached before the CAS refusal");

  // The ref must be untouched — commitIntegration's own atomic update never fired.
  const head = headSha(fx.dir, fx.targetRef);
  assert.strictEqual(head, fx.base);
});

test("CONTROL: an UNMOVED live head (the default — no liveHead override) integrates cleanly", (t) => {
  if (!fs.existsSync(CONTROLLER)) return t.skip("pending backend-builder — controller not yet built (falsifier RED)");

  const { makeControllerFixture, standardInput, standardOpts } = require("./_lib/controller-fixtures");
  const { headSha } = require("./_lib/git-scratch");
  const ctl = require("../trusted-controller");

  const fx = makeControllerFixture("head-unmoved");
  t.after(() => fx.cleanup());

  const result = ctl.integrate(standardInput(fx), standardOpts(fx));
  assert.strictEqual(result.ok, true, JSON.stringify(result));
  assert.strictEqual(headSha(fx.dir, fx.targetRef), fx.result);
});
