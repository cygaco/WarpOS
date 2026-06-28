#!/usr/bin/env node
"use strict";

/**
 * SP-20260627-001 — W3 per-failure-class review-lane policy (β: report-only ramp,
 * consumer-fired not declarative; per-class green-fixture-OR-logged-debt).
 *   AC-3.1 lane_min_key_is_consumed · AC-3.2 per_class_fixture_or_debt
 *
 *   node tests/regression/SP-20260627-001/w3-lane-policy.test.js
 */

const assert = require("assert");
const { harness } = require("../../../scripts/checks/lib/fixture-harness");
const { reviewLanePolicy, W3_REVIEW_LANE_MIN } = require("../../../scripts/dispatch/coverage-gate");

const h = harness("SP-20260627-001-w3-lane-policy");

// ── AC-3.1 lane_min_key_is_consumed — the consumer READS the lane-min key and ACTS (warns) ──
h.test("AC-3.1 reviewLanePolicy READS+ACTS on the lane-min key (consumer-fired, not declarative)", () => {
  const missing = reviewLanePolicy(["enforcer_or_gate_change"], []);
  assert.ok(missing.warnings.length >= 1, "a missing required lane must produce a warning (the consumer ACTED on the key)");
  assert.ok(missing.warnings[0].includes("execution_access"), "the warning must name the lane it READ from the policy map");
  const satisfied = reviewLanePolicy(["enforcer_or_gate_change"], ["execution_access"]);
  assert.strictEqual(satisfied.warnings.length, 0, "running the required lane satisfies the minimum (no warning)");
  // Report-only ramp: ok stays true with a missing lane; the gated blocking ramp flips it.
  assert.strictEqual(missing.ok, true, "report-only ramp: ok stays true (warnings only)");
  assert.strictEqual(reviewLanePolicy(["enforcer_or_gate_change"], [], { enforce: true }).ok, false, "blocking ramp flips ok:false on a missing lane");
});

// ── AC-3.1 — the SECOND declared class also fires (the consumer is not hard-wired to one class) ──
h.violation("AC-3.1 distribution_sensitive missing cross_family_diff is flagged under enforce (consumer fires per declared class)", () => {
  const r = reviewLanePolicy(["distribution_sensitive"], [], { enforce: true });
  return { ok: r.ok, violations: r.warnings };
});

// ── AC-3.2 per_class_fixture_or_debt — every DECLARED class has a non-empty minimum AND is exercised here ──
h.test("AC-3.2 every declared W3 class has a non-empty minimum AND is exercised by this fixture (no aspirational rule)", () => {
  const declared = Object.keys(W3_REVIEW_LANE_MIN);
  assert.ok(declared.length >= 1, "at least one risk class must declare a minimum");
  for (const cls of declared) {
    assert.ok(Array.isArray(W3_REVIEW_LANE_MIN[cls]) && W3_REVIEW_LANE_MIN[cls].length >= 1, `class '${cls}' must declare >=1 minimum lane`);
    const r = reviewLanePolicy([cls], []);
    assert.ok(r.warnings.length >= 1, `class '${cls}' must be EXERCISED by reviewLanePolicy (the consumer fires for it)`);
  }
});

h.done();
