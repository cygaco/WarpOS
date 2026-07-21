"use strict";
// FALSIFIER: sol-a3-optional-lane-present-and-failed-panel2family — record-trust gate Surface 5
// (SP-20260720-002 Phase 4 R1, QA-005/BE-CQ-P4-001+002/SR-TRUSTROOT-004, FIX-5b, β rider 5 BINDING). The
// EXISTING sol-a3-optional-lane-semantics.falsifier.test.js exercises an agy lane that ran-and-failed on
// panel-3lab, where agy is REQUIRED — that is the ordinary required-lane reduction, not the gap QA-005
// named. THIS falsifier exercises the actual gap: on panel-2family, agy is OPTIONAL (not in
// profile.required) — an agy lane that is PRESENT and FAILED must still BIND (drive the panel to NON-PASS),
// never be silently dropped just because `panelStatus`'s required-only reduction never looks at it. Only an
// ABSENT optional lane is waived (see sol-a3-absent-optional-agy.positive.test.js). MUST-BLOCK.
const test = require("node:test");
const assert = require("node:assert");
const path = require("path");
const fs = require("fs");

const HELM_RUNNER = path.join(__dirname, "..", "helm-runner.js");

test("FIX-5b sol-a3-optional-lane-present-and-failed-panel2family — an OPTIONAL agy lane on panel-2family that RAN and FAILED binds a non-PASS result (never silently dropped)", (t) => {
  if (!fs.existsSync(HELM_RUNNER)) return t.skip("pending backend-builder — helm-runner not yet built");
  const hr = require("../helm-runner");

  let integrateCalls = 0;
  const integrateFn = () => {
    integrateCalls++;
    return { ok: true, decision: "INTEGRATED", receipt: { committed_head: "r" } };
  };

  const lanes = [
    { laneId: "gpt", provider: "openai", runResult: { hasEvidence: true, alive: true, verdict: "pass", observedProvider: "openai", fallback: false } },
    { laneId: "claude", provider: "claude", runResult: { hasEvidence: true, alive: true, verdict: "pass", observedProvider: "claude", fallback: false } },
    // agy is OPTIONAL on panel-2family (not in profile.required) — but it RAN and FAILED.
    { laneId: "agy", provider: "antigravity", runResult: { hasEvidence: true, alive: true, verdict: "fail", observedProvider: "antigravity", fallback: false } },
  ];
  const res = hr.runHelms({ profile: "panel-2family", lanes, integrate: { base_commit: "b", result_commit: "r", target_ref: "refs/heads/x" } }, { integrateFn });

  assert.notStrictEqual(res.status, "PASS", "MUST-BLOCK: a PRESENT-and-FAILED optional lane must bind, never silently pass");
  assert.strictEqual(res.status, "FAIL");
  assert.strictEqual(res.panel.laneStatus.agy, "fail");
  assert.strictEqual(integrateCalls, 0, "no integration may be driven when an optional lane's real failure binds the panel");
  assert.strictEqual(res.integration, undefined);
});

test("FIX-5b sol-a3-optional-lane-present-and-failed-panel2family — a COERCED optional agy lane (fallback:true) is BLOCKED (present-is-not-proof), NOT 'ran and failed' — the two reasons stay distinct", (t) => {
  if (!fs.existsSync(HELM_RUNNER)) return t.skip("pending backend-builder — helm-runner not yet built");
  const hr = require("../helm-runner");

  const lanes = [
    { laneId: "gpt", provider: "openai", runResult: { hasEvidence: true, alive: true, verdict: "pass", observedProvider: "openai", fallback: false } },
    { laneId: "claude", provider: "claude", runResult: { hasEvidence: true, alive: true, verdict: "pass", observedProvider: "claude", fallback: false } },
    { laneId: "agy", provider: "antigravity", runResult: { hasEvidence: true, alive: true, verdict: "fail", observedProvider: "openai", fallback: true } },
  ];
  const res = hr.runHelms({ profile: "panel-2family", lanes }, {});

  // R2 (S1, BE-CQ-P4-001 x SR-R2 reconciled): a PRESENT optional lane that is COERCED is NOT a proven
  // failure — but it is also NOT nothing. It is an unprovable lane the panel actually OBSERVED, so it
  // BLOCKS. R1 dropped it entirely and read PASS (a false-green); the binding reason distinction this
  // sub-case exists to protect is preserved: BLOCKED, never "ran and failed".
  assert.notStrictEqual(res.status, "PASS", "MUST-BLOCK: a PRESENT-but-coerced optional lane is unprovable — present is not proof, and it must never be silently dropped into a PASS");
  assert.strictEqual(res.status, "BLOCKED-INCONCLUSIVE");
  assert.strictEqual(res.panel.laneStatus.agy, "coerced", "the lane's own status must record COERCION, not a proven failure");
  assert.ok(
    !/ran and failed/i.test(res.panel.reason),
    `the coerced reason must NOT be the 'ran and failed' path (coercion is non-proof, not a proven failure); got: ${res.panel.reason}`,
  );
  assert.ok(/coerced/i.test(res.panel.reason), `the reason must name the coercion; got: ${res.panel.reason}`);
});

test("FIX-5b R2 sol-a3-optional-lane-present-and-failed-panel2family — a DEAD and a MALFORMED-verdict optional lane are EACH BLOCKED (non-PASS), never 'ran and failed', never dropped", (t) => {
  if (!fs.existsSync(HELM_RUNNER)) return t.skip("pending backend-builder — helm-runner not yet built");
  const hr = require("../helm-runner");

  const floor = [
    { laneId: "gpt", provider: "openai", runResult: { hasEvidence: true, alive: true, verdict: "pass", observedProvider: "openai", fallback: false } },
    { laneId: "claude", provider: "claude", runResult: { hasEvidence: true, alive: true, verdict: "pass", observedProvider: "claude", fallback: false } },
  ];

  for (const [label, runResult, expectedLaneStatus] of [
    ["DEAD (a record exists but the dispatch was reaped)", { hasEvidence: true, alive: false, verdict: "pass", observedProvider: "antigravity", fallback: false }, "dead"],
    ["MALFORMED verdict ('banana')", { hasEvidence: true, alive: true, verdict: "banana", observedProvider: "antigravity", fallback: false }, "refused-or-malformed"],
    ["ERROR/refused verdict ('error')", { hasEvidence: true, alive: true, verdict: "error", observedProvider: "antigravity", fallback: false }, "refused-or-malformed"],
    ["EMPTY verdict ('')", { hasEvidence: true, alive: true, verdict: "", observedProvider: "antigravity", fallback: false }, "refused-or-malformed"],
  ]) {
    let integrateCalls = 0;
    const integrateFn = () => {
      integrateCalls++;
      return { ok: true, decision: "INTEGRATED", receipt: { committed_head: "r" } };
    };
    const res = hr.runHelms(
      {
        profile: "panel-2family",
        lanes: [...floor, { laneId: "agy", provider: "antigravity", runResult }],
        integrate: { base_commit: "b", result_commit: "r", target_ref: "refs/heads/x" },
      },
      { integrateFn },
    );
    assert.notStrictEqual(res.status, "PASS", `MUST-BLOCK: a PRESENT optional lane that is ${label} must never be silently dropped into a PASS`);
    assert.strictEqual(res.status, "BLOCKED-INCONCLUSIVE", `${label} -> BLOCKED (unprovable), not FAIL`);
    assert.strictEqual(res.panel.laneStatus.agy, expectedLaneStatus, `${label} -> laneStatus.agy`);
    assert.ok(!/ran and failed/i.test(res.panel.reason), `${label}: the reason must NOT be the 'ran and failed' path; got: ${res.panel.reason}`);
    assert.strictEqual(integrateCalls, 0, `${label}: no integration may be driven from a non-PASS panel`);
  }
});

test("FIX-5b R2 sol-a3-optional-lane-present-and-failed-panel2family — panel-lanes.js#panelStatus is the SINGLE reduction authority: helm-runner holds NO bolt-on optional reducer of its own", (t) => {
  if (!fs.existsSync(HELM_RUNNER)) return t.skip("pending backend-builder — helm-runner not yet built");
  const pl = require("../panel-lanes");
  const hr = require("../helm-runner");

  // The reduction must be reproducible from panelStatus ALONE (same profile + same lane evidence), with no
  // helm-runner-local re-derivation — a second authority is how the coerced/dead/malformed cases were lost.
  const profile = pl.getProfile(pl.loadManifest(), "panel-2family");
  const lanes = [
    { laneId: "gpt", contractedProvider: "openai", observedProvider: "openai", fallback: false, alive: true, verdict: "pass", hasEvidence: true },
    { laneId: "claude", contractedProvider: "claude", observedProvider: "claude", fallback: false, alive: true, verdict: "pass", hasEvidence: true },
    { laneId: "agy", contractedProvider: "antigravity", observedProvider: "antigravity", fallback: false, alive: true, verdict: "fail", hasEvidence: true },
  ];
  const direct = pl.panelStatus(profile, lanes, { agyOperatorOwned: true });
  assert.strictEqual(direct.status, "FAIL", "panelStatus ALONE must already bind the present-and-failed optional lane");
  assert.strictEqual(direct.laneStatus.agy, "fail");

  const viaRunner = hr.runHelms({
    profile: "panel-2family",
    lanes: lanes.map((l) => ({ laneId: l.laneId, provider: l.contractedProvider, runResult: { hasEvidence: l.hasEvidence, alive: l.alive, verdict: l.verdict, observedProvider: l.observedProvider, fallback: l.fallback } })),
  }, {});
  assert.strictEqual(viaRunner.status, direct.status, "the runner must consume panelStatus's verdict verbatim");
  assert.strictEqual(viaRunner.panel.reason, direct.reason, "the runner must not author a reason of its own");
});

test("FIX-5b sol-a3-optional-lane-present-and-failed-panel2family — CONTROL: an ABSENT agy lane on panel-2family still PASSES (only ABSENCE is tolerated, distinguishing this from the present-and-failed case above)", (t) => {
  if (!fs.existsSync(HELM_RUNNER)) return t.skip("pending backend-builder — helm-runner not yet built");
  const hr = require("../helm-runner");

  const lanes = [
    { laneId: "gpt", provider: "openai", runResult: { hasEvidence: true, alive: true, verdict: "pass", observedProvider: "openai", fallback: false } },
    { laneId: "claude", provider: "claude", runResult: { hasEvidence: true, alive: true, verdict: "pass", observedProvider: "claude", fallback: false } },
  ];
  const res = hr.runHelms({ profile: "panel-2family", lanes }, {});
  assert.strictEqual(res.status, "PASS");
});
