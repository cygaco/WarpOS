#!/usr/bin/env node
"use strict";
/**
 * C1 teeth (SP-20260718-003 · SR-001/QA-001): the LIVE dispatch-review.js runner gates the security
 * panel on the D7 panelStatus reducer over OBSERVED evidence — it no longer merges on declared labels.
 *
 * THE FALSE-GREEN this kills: a gpt/agy lane that silently ran on Claude (observedProvider=claude /
 * fallback:true) merged to ok:true/pass via mergeLanes (which checks only verdict/liveness). applyPanelGate
 * runs panelStatus over the observed provider/fallback → the coerced lane BLOCKS. The gate can only HOLD.
 *
 *   node scripts/dispatch/dispatch-review-panel-gate.test.js
 */
const assert = require("assert");
const { isSecurityPanelRole, applyPanelGate } = require("../dispatch-review");
const panelLanes = require("./panel-lanes");

let passed = 0;
const failures = [];
function test(name, fn) {
  try { fn(); passed++; } catch (e) { failures.push(`${name}: ${e.message}`); }
}

// A runner-shape lane (as dispatch-review.js builds it from a settled pass).
const lane = (o) => ({ pass: o.laneId, model: null, hasEvidence: true, lane_out: null, ...o });
const gptClean = lane({ laneId: "gpt", provider: "openai", observedProvider: "openai", fallback: false, ok: true, verdict: "pass" });
const claudeClean = lane({ laneId: "claude", provider: "claude", observedProvider: "claude", fallback: false, ok: true, verdict: "pass" });
const agyDown = lane({ laneId: "agy", provider: "antigravity", observedProvider: null, fallback: false, ok: false, verdict: "error", hasEvidence: false });

// ── role scoping ──
test("isSecurityPanelRole: only security-reviewer is the panel role", () => {
  assert.equal(isSecurityPanelRole("security-reviewer"), true);
  assert.equal(isSecurityPanelRole("frontend-reviewer"), false);
});

// ── NEGATIVE CONTROL: a clean 2-family run PASSes the floor; panel-3lab honestly BLOCKED-ON-OPERATOR. ──
test("clean 2-family (gpt openai + claude claude, agy down) → floor PASS, binding BLOCKED-ON-OPERATOR", () => {
  const g = applyPanelGate(panelLanes, [gptClean, claudeClean, agyDown]);
  assert.equal(g.floor_pass, true, `floor should pass on a clean 2-family: ${g.floor.reason}`);
  assert.equal(g.floor.status, "PASS");
  assert.notEqual(g.binding.status, "PASS", "panel-3lab must NEVER be PASS while agy is down");
  assert.equal(g.binding.status, "BLOCKED-ON-OPERATOR", g.binding.reason);
});

// ── THE MASQUERADE (SR-001): a gpt lane that ran on Claude (fallback:true) → floor BLOCKS. ──
test("masquerade: gpt lane observed-claude/fallback:true → floor BLOCKED, not PASS", () => {
  const gptCoerced = lane({ laneId: "gpt", provider: "openai", observedProvider: "claude", fallback: true, ok: true, verdict: "pass" });
  const g = applyPanelGate(panelLanes, [gptCoerced, claudeClean, agyDown]);
  assert.equal(g.floor_pass, false, "an all-Claude masquerade must NOT pass the floor");
  assert.equal(g.floor.laneStatus.gpt, "coerced");
});

// ── observed-provider omitted (a labels-only lane) → floor BLOCKS (no proof of the contracted lab). ──
test("labels-only gpt lane (observedProvider omitted) → floor BLOCKED", () => {
  const gptNoObs = lane({ laneId: "gpt", provider: "openai", observedProvider: null, fallback: false, ok: true, verdict: "pass" });
  const g = applyPanelGate(panelLanes, [gptNoObs, claudeClean, agyDown]);
  assert.equal(g.floor_pass, false, "no observed provider = no proof of the contracted lab");
});

// ── a dead cross-provider lane → floor BLOCKS. ──
test("dead gpt lane (ok:false) → floor BLOCKED", () => {
  const gptDead = lane({ laneId: "gpt", provider: "openai", observedProvider: "openai", fallback: false, ok: false, verdict: "error" });
  const g = applyPanelGate(panelLanes, [gptDead, claudeClean, agyDown]);
  assert.equal(g.floor_pass, false);
});

// ── a real binding FAIL verdict on a live lane → floor NOT pass (holds). ──
test("gpt lane binding FAIL → floor not PASS", () => {
  const gptFail = lane({ laneId: "gpt", provider: "openai", observedProvider: "openai", fallback: false, ok: true, verdict: "fail" });
  const g = applyPanelGate(panelLanes, [gptFail, claudeClean, agyDown]);
  assert.equal(g.floor_pass, false);
});

if (failures.length) {
  process.stderr.write(`FAIL [dispatch-review-panel-gate.test] ${failures.length} failure(s):\n${failures.map((f) => `  - ${f}`).join("\n")}\n`);
  process.exit(1);
}
process.stdout.write(`OK   [dispatch-review-panel-gate.test] ${passed} passed (C1: live runner gates on panelStatus over OBSERVED evidence; masquerade blocks)\n`);
