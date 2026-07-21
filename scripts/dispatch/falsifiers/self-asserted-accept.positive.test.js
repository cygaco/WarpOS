"use strict";
// POSITIVE COMPANION: self-asserted-accept-over-failing-tree.falsifier.test.js (SP-20260720-002 Phase 4,
// AC-4). Defeats a reject-everything `integrate()` stub: the SAME shape of self-asserting envelope, over a
// tree the pinned run genuinely PASSES, DOES authorize + integrate — proving the refusal above is about the
// TREE, not a constant-false decision that would reject any envelope regardless of the real check outcome.
const test = require("node:test");
const assert = require("node:assert");
const path = require("path");
const fs = require("fs");

const CONTROLLER = path.join(__dirname, "..", "trusted-controller.js");

test("self-asserted-accept POSITIVE — the same self-asserting envelope over a CLEAN tree authorizes + integrates", (t) => {
  if (!fs.existsSync(CONTROLLER)) return t.skip("pending backend-builder — controller not yet built (falsifier RED)");

  const { makeControllerFixture, standardInput, standardOpts } = require("./_lib/controller-fixtures");
  const { headSha } = require("./_lib/git-scratch");
  const ctl = require("../trusted-controller");

  const fx = makeControllerFixture("self-asserted-pos");
  t.after(() => fx.cleanup());

  const input = standardInput(fx, {
    // "success"/"verdict"/"checks_passed" are the self-asserted fields the controller NEVER reads
    // (β rider 1). Deliberately omit `status:"passed"` with zero files/commits/tests/evidence here — that
    // exact shape is the false-green-envelope check's OWN (correct, independent) tripwire, a DIFFERENT
    // mechanism than what this companion is proving (see self-asserted-accept-over-failing-tree's
    // deliberately non-empty `files` field for the same reason).
    result_envelope: { success: true, verdict: "accept", checks_passed: true },
  });
  const result = ctl.integrate(input, standardOpts(fx));

  assert.strictEqual(result.ok, true, JSON.stringify(result));
  assert.strictEqual(result.decision, "INTEGRATED");
  assert.ok(result.receipt && result.receipt.committed_head === fx.result);

  const head = headSha(fx.dir, fx.targetRef);
  assert.strictEqual(head, fx.result, "refs/heads/integ must have advanced to the accepted result commit");
});
