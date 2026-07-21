"use strict";
// FALSIFIER: sol-A3 sol-a3-agy-route-not-served-proof — record-trust gate Surface 5 (SP-20260720-002 Phase
// 4, G4.5, AC-24). A bare agy `route`/default-provider STRING, with no `hasEvidence:true` dispatch
// control-plane proof, is NEVER treated as service. ZERO agy `attested:true` claims anywhere in this
// module: `collectLaneEvidence` never reads or forwards an `attested` field at all — a caller trying to
// smuggle `attested:true` into the runResult must have ZERO effect. MUST-BLOCK (route-label-only never
// counts as PASS-worthy evidence).
const test = require("node:test");
const assert = require("node:assert");
const path = require("path");
const fs = require("fs");

const HELM_RUNNER = path.join(__dirname, "..", "helm-runner.js");

test("sol-A3 sol-a3-agy-route-not-served-proof — a route/default string + attested:true with NO hasEvidence proves nothing", (t) => {
  if (!fs.existsSync(HELM_RUNNER)) return t.skip("pending backend-builder — helm-runner not yet built (falsifier RED)");
  const hr = require("../helm-runner");

  // ATTACK: an agy runResult carrying a plausible-looking route string AND a self-asserted attested:true —
  // but explicitly WITHOUT hasEvidence:true (the only field panel-lanes.js honors as proof).
  const agyAttack = {
    route: "agy:gemini-3.1-pro-high",
    attested: true, // must NEVER be read/forwarded by collectLaneEvidence
    observedProvider: "antigravity",
    fallback: false,
    alive: true,
    verdict: "pass",
    // hasEvidence deliberately OMITTED
  };
  const lane = hr.collectLaneEvidence({ laneId: "agy", provider: "antigravity" }, agyAttack);

  assert.strictEqual(lane.hasEvidence, false, "MUST-BLOCK: a route label + a self-asserted attested:true, with no hasEvidence, is NOT proof");
  assert.strictEqual(Object.prototype.hasOwnProperty.call(lane, "attested"), false, "collectLaneEvidence must NEVER surface an 'attested' field at all (zero agy attested:true anywhere)");

  // On panel-3lab (agy required), this lane resolves BLOCKED, never PASS.
  const lanes = [
    { laneId: "gpt", provider: "openai", runResult: { hasEvidence: true, alive: true, verdict: "pass", observedProvider: "openai", fallback: false } },
    { laneId: "claude", provider: "claude", runResult: { hasEvidence: true, alive: true, verdict: "pass", observedProvider: "claude", fallback: false } },
    { laneId: "agy", provider: "antigravity", runResult: agyAttack },
  ];
  const res = hr.runHelms({ profile: "panel-3lab", lanes }, {});
  assert.notStrictEqual(res.status, "PASS", "MUST-BLOCK: a route-label-only agy claim must never satisfy the required lane on panel-3lab");
  // agyOperatorOwned defaults true (β rider 5) — an unproven agy lane resolves the HONEST
  // operator-owned-absent exit (ED-060), never a silent pass, and never plain "missing-evidence" either
  // (that distinction is exactly what keeps this BLOCKED-ON-OPERATOR, not a masked generic failure).
  assert.strictEqual(res.panel.laneStatus.agy, "operator-owned-absent");
  assert.strictEqual(res.status, "BLOCKED-ON-OPERATOR");
});

test("sol-A3 — an agy lane resolved via 'fallback' (a Claude clone) is never counted as the agy lab either", (t) => {
  if (!fs.existsSync(HELM_RUNNER)) return t.skip("pending backend-builder — helm-runner not yet built (falsifier RED)");
  const hr = require("../helm-runner");

  const coercedAgy = {
    hasEvidence: true,
    alive: true,
    verdict: "pass",
    observedProvider: "openai", // fell back to a DIFFERENT provider than contracted
    fallback: true,
    attested: true,
  };
  const lanes = [
    { laneId: "gpt", provider: "openai", runResult: { hasEvidence: true, alive: true, verdict: "pass", observedProvider: "openai", fallback: false } },
    { laneId: "claude", provider: "claude", runResult: { hasEvidence: true, alive: true, verdict: "pass", observedProvider: "claude", fallback: false } },
    { laneId: "agy", provider: "antigravity", runResult: coercedAgy },
  ];
  const res = hr.runHelms({ profile: "panel-3lab", lanes }, {});
  assert.notStrictEqual(res.status, "PASS");
  assert.strictEqual(res.panel.laneStatus.agy, "coerced");
});
