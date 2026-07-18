#!/usr/bin/env node
"use strict";
/**
 * C1 + R2-B/R2-C teeth (SP-20260718-003 · SR-001/SR-008/SR-009/QA-001-R2): the LIVE dispatch-review.js
 * runner gates the security panel on the D7 panelStatus reducer over LEDGER-bound OBSERVED evidence,
 * after VALIDATING the manifest. It no longer merges on declared labels or trusts a child envelope.
 *
 *   C1   — a gpt/agy lane observed-claude/fallback:true → panelStatus marks it COERCED → BLOCKED.
 *   R2-B — applyPanelGate calls validatePanelManifest() first; an INVALID manifest fails the gate CLOSED.
 *   R2-C — liveness/provider bind to a same-run LEDGER record; an envelope with NO durable record → blocked.
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

// A same-run LEDGER that CORROBORATES a clean gpt (CLI) + claude (subprocess) run.
const ledgerClean = [
  { role: "security-reviewer", provider: "openai", shape: "subprocess-cross-provider", ok: true, output_digest: "d-gpt", completed_at: new Date().toISOString() },
  { role: "security-reviewer", provider: "claude", shape: "subprocess-claude", ok: true, output_digest: "d-cl", completed_at: new Date().toISOString() },
];
const ctxClean = { readLedger: () => ledgerClean, sinceMs: 0 };

// ── role scoping ──
test("isSecurityPanelRole: only security-reviewer is the panel role", () => {
  assert.equal(isSecurityPanelRole("security-reviewer"), true);
  assert.equal(isSecurityPanelRole("frontend-reviewer"), false);
});

// ── NEGATIVE CONTROL: clean 2-family + corroborating ledger → floor PASS; panel-3lab BLOCKED-ON-OPERATOR. ──
test("clean 2-family + ledger corroboration → floor PASS, binding BLOCKED-ON-OPERATOR", () => {
  const g = applyPanelGate(panelLanes, [gptClean, claudeClean, agyDown], ctxClean);
  assert.equal(g.manifest_valid, true);
  assert.equal(g.floor_pass, true, `floor should pass on a clean, ledger-corroborated 2-family: ${g.floor.reason}`);
  assert.equal(g.floor.status, "PASS");
  assert.notEqual(g.binding.status, "PASS", "panel-3lab must NEVER be PASS while agy is down");
  assert.equal(g.binding.status, "BLOCKED-ON-OPERATOR", g.binding.reason);
});

// ── THE MASQUERADE (SR-001): a gpt lane that ran on Claude (fallback:true) → floor BLOCKS. ──
test("masquerade: gpt lane observed-claude/fallback:true → floor BLOCKED, not PASS", () => {
  const gptCoerced = lane({ laneId: "gpt", provider: "openai", observedProvider: "claude", fallback: true, ok: true, verdict: "pass" });
  const g = applyPanelGate(panelLanes, [gptCoerced, claudeClean, agyDown], ctxClean);
  assert.equal(g.floor_pass, false, "an all-Claude masquerade must NOT pass the floor");
});

// ── R2-C (SR-009): an envelope claims success but NO durable ledger record exists → floor BLOCKS. ──
test("R2-C: envelope ok but NO ledger record → hasEvidence:false → floor BLOCKED (envelope != attestation)", () => {
  const g = applyPanelGate(panelLanes, [gptClean, claudeClean, agyDown], { readLedger: () => [], sinceMs: 0 });
  assert.equal(g.floor_pass, false, "a lane with no durable ledger record must not count as attested");
  assert.equal(g.floor.laneStatus.gpt, "missing-evidence");
});
test("R2-C: a ledger record WITHOUT output_digest (config echo) → not evidence → floor BLOCKED", () => {
  const echoLedger = [
    { role: "security-reviewer", provider: "openai", shape: "subprocess-cross-provider", ok: true, completed_at: new Date().toISOString() }, // no output_digest
    ledgerClean[1],
  ];
  const g = applyPanelGate(panelLanes, [gptClean, claudeClean, agyDown], { readLedger: () => echoLedger, sinceMs: 0 });
  assert.equal(g.floor_pass, false, "a config-echo record (no output_digest) is not durable evidence");
});

// ── R2-B (SR-008): an INVALID manifest fails the gate CLOSED (no all-Claude drift slips through). ──
test("R2-B: validatePanelManifest not-ok → gate fail-closed (manifest_valid:false, floor_pass:false)", () => {
  const badPanelLanes = { ...panelLanes, validatePanelManifest: () => ({ ok: false, errors: ["mutated panel-2family.required=[claude]"] }) };
  const g = applyPanelGate(badPanelLanes, [gptClean, claudeClean], ctxClean);
  assert.equal(g.manifest_valid, false);
  assert.equal(g.floor_pass, false, "a runner must not certify against an invalid/drifted manifest");
});
test("R2-B: validatePanelManifest THROW → gate fail-closed", () => {
  const throwPanelLanes = { ...panelLanes, validatePanelManifest: () => { throw new Error("loader boom"); } };
  const g = applyPanelGate(throwPanelLanes, [gptClean, claudeClean], ctxClean);
  assert.equal(g.floor_pass, false);
  assert.ok(/fail-closed/.test(g.floor.reason));
});

// ── a real binding FAIL verdict on a corroborated lane → floor NOT pass (holds). ──
test("gpt lane binding FAIL (with ledger) → floor not PASS", () => {
  const gptFail = lane({ laneId: "gpt", provider: "openai", observedProvider: "openai", fallback: false, ok: true, verdict: "fail" });
  const g = applyPanelGate(panelLanes, [gptFail, claudeClean, agyDown], ctxClean);
  assert.equal(g.floor_pass, false);
});

if (failures.length) {
  process.stderr.write(`FAIL [dispatch-review-panel-gate.test] ${failures.length} failure(s):\n${failures.map((f) => `  - ${f}`).join("\n")}\n`);
  process.exit(1);
}
process.stdout.write(`OK   [dispatch-review-panel-gate.test] ${passed} passed (C1 masquerade blocks; R2-B validate-first fail-closed; R2-C ledger-bound, envelope != attestation)\n`);
