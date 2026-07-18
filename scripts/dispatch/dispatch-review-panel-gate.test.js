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
const { isSecurityPanelRole, applyPanelGate, panelLoaderFailClosed } = require("../dispatch-review");
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

// A same-run LEDGER that CORROBORATES a clean gpt (CLI) + claude (subprocess) run. Each record carries
// the contracted tool_id, explicit fallback:false, an invocation digest (cmdline_checksum), and the
// minted panel_run_id — the full SR-010/SR-011 provenance the tightened corroboration requires.
const PRID = "panel-test-run-1";
const now = () => new Date().toISOString();
// The FLOOR's claude lane is a subprocess-claude review (option B, α-ruled); the gpt lane is a CLI lab.
const ledgerClean = [
  { role: "security-reviewer", provider: "openai", tool_id: "codex", shape: "subprocess-cross-provider", ok: true, fallback: false, output_digest: "d-gpt", cmdline_checksum: "c-gpt", panel_run_id: PRID, completed_at: now() },
  { role: "security-reviewer", provider: "claude", tool_id: "claude", shape: "subprocess-claude", ok: true, fallback: false, output_digest: "d-cl", cmdline_checksum: "c-cl", panel_run_id: PRID, completed_at: now() },
];
const ctxClean = { readLedger: () => ledgerClean, sinceMs: 0, panelRunId: PRID };
// The BINDING panel-3lab claude lane is the in-process hunter — a distinct record the runner never fires.
// SR-019 (ADR-0022): the hunter record now carries the REVIEW `verdict` (pass/fail/warn); the binding claude
// lane binds to IT, never the floor subprocess pass. A passing hunter must stamp verdict:"pass".
const hunterRec = { role: "security_claude_hunter", provider: "claude", shape: "in-process-agent", ok: true, fallback: false, verdict: "pass", output_digest: "d-hunter", panel_run_id: PRID, completed_at: now() };

// ── role scoping ──
test("isSecurityPanelRole: only security-reviewer is the panel role", () => {
  assert.equal(isSecurityPanelRole("security-reviewer"), true);
  assert.equal(isSecurityPanelRole("frontend-reviewer"), false);
});

// ── NEGATIVE CONTROL: clean 2-family FLOOR PASS on subprocess-claude (option B); binding NOT PASS (hunter
//    absent in the runner + agy down). Condition 3: the result records WHICH contract gated. ──
test("clean 2-family + subprocess-claude ledger → floor PASS (option B), binding NOT PASS", () => {
  const g = applyPanelGate(panelLanes, [gptClean, claudeClean, agyDown], ctxClean);
  assert.equal(g.manifest_valid, true);
  assert.equal(g.contract_evaluated, "panel-2family-floor", "the gate must record WHICH contract it evaluated");
  assert.equal(g.floor.claude_channel, "subprocess", "the floor's claude lane is honestly the subprocess channel");
  assert.equal(g.binding.claude_channel, "in-process-hunter");
  assert.notEqual(g.binding.status, "PASS", "panel-3lab must never PASS without the hunter + agy");
  assert.equal(g.floor_pass, true, `floor should pass on a clean, ledger-corroborated 2-family: ${g.floor.reason}`);
  assert.equal(g.floor.status, "PASS");
});

// ── SR-015 (option B, condition 2): a subprocess-claude record must NEVER satisfy the BINDING hunter lane;
//    WITH a hunter record present, the binding claude lane is alive and 3lab blocks ONLY on agy. ──
test("SR-015: binding requires the in-process hunter — subprocess-claude alone → binding claude UNSATISFIED", () => {
  // ledgerClean has the subprocess-claude floor lane but NO hunter → the binding's claude lane is absent.
  const g = applyPanelGate(panelLanes, [gptClean, claudeClean, agyDown], ctxClean);
  assert.notEqual(g.binding.status, "PASS");
  // the binding claude lane is missing-evidence (the subprocess record is the FLOOR's, not the hunter's)
  assert.equal(g.binding.status.startsWith("BLOCKED"), true, g.binding.reason);
});
test("SR-015: WITH a hunter record, the binding claude lane is alive → 3lab BLOCKED-ON-OPERATOR (only agy)", () => {
  const g = applyPanelGate(panelLanes, [gptClean, claudeClean, agyDown], { readLedger: () => [...ledgerClean, hunterRec], sinceMs: 0, panelRunId: PRID });
  assert.equal(g.floor_pass, true, "floor still passes on the subprocess-claude lane");
  assert.equal(g.binding.status, "BLOCKED-ON-OPERATOR", `with the hunter present, only agy blocks 3lab: ${g.binding.reason}`);
});
// ── SR-019 (ADR-0022) TEETH: the binding claude lane binds to the HUNTER's verdict, fail-closed. ──
test("SR-019: a hunter record with NO verdict → binding claude BLOCKS (not only-agy) — missing verdict is not a pass", () => {
  const noVerdictHunter = { ...hunterRec }; delete noVerdictHunter.verdict;
  const g = applyPanelGate(panelLanes, [gptClean, claudeClean, agyDown], { readLedger: () => [...ledgerClean, noVerdictHunter], sinceMs: 0, panelRunId: PRID });
  assert.notEqual(g.binding.status, "PASS");
  // claude is now ALSO blocked (verdict→error), so it is not the only-agy BLOCKED-ON-OPERATOR case
  assert.ok(/claude/.test(g.binding.reason), `a verdict-less hunter must BLOCK the binding claude lane, not read as pass: ${g.binding.reason}`);
});
test("SR-019: a hunter record with verdict:'fail' → binding claude BLOCKS (a hunter FAIL binds)", () => {
  const failHunter = { ...hunterRec, verdict: "fail" };
  const g = applyPanelGate(panelLanes, [gptClean, claudeClean, agyDown], { readLedger: () => [...ledgerClean, failHunter], sinceMs: 0, panelRunId: PRID });
  assert.notEqual(g.binding.status, "PASS", "a hunter FAIL can never let the binding claude lane pass");
  assert.ok(/claude/.test(g.binding.reason), `hunter-fail must bind to the claude lane: ${g.binding.reason}`);
});
test("SR-015 (condition 2): a subprocess-claude record LABELED as the hunter role does NOT satisfy the binding (shape mismatch)", () => {
  // even if a subprocess record CLAIMS role security_claude_hunter, its shape is subprocess-claude, not
  // in-process-agent → the binding hunter match rejects it (identity is shape + role, not a settable label).
  const fakeHunter = { ...ledgerClean[1], role: "security_claude_hunter" /* still shape:subprocess-claude */ };
  const g = applyPanelGate(panelLanes, [gptClean, claudeClean, agyDown], { readLedger: () => [ledgerClean[0], fakeHunter], sinceMs: 0, panelRunId: PRID });
  assert.notEqual(g.binding.status, "PASS", "a subprocess record claiming the hunter role must not satisfy the binding");
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

// ── R3-3 (SR-010/QA-008): a record with OMITTED fallback is not coerced to live → floor BLOCKS. ──
test("SR-010: gpt record with OMITTED fallback → not corroborated (not coerced live) → floor BLOCKED", () => {
  const omitFallback = [{ ...ledgerClean[0], fallback: undefined }, ledgerClean[1]];
  const g = applyPanelGate(panelLanes, [gptClean, claudeClean, agyDown], { readLedger: () => omitFallback, sinceMs: 0, panelRunId: PRID });
  assert.equal(g.floor_pass, false, "an omitted fallback must not be coerced to fallback:false");
});
test("SR-010: gpt record with WRONG tool_id → not corroborated → floor BLOCKED", () => {
  const wrongTool = [{ ...ledgerClean[0], tool_id: "gemini" }, ledgerClean[1]];
  const g = applyPanelGate(panelLanes, [gptClean, claudeClean, agyDown], { readLedger: () => wrongTool, sinceMs: 0, panelRunId: PRID });
  assert.equal(g.floor_pass, false, "a record on the wrong executable must not corroborate the lane");
});
test("SR-010: gpt record with NO cmdline_checksum (no invocation) → floor BLOCKED", () => {
  const noInv = [{ ...ledgerClean[0], cmdline_checksum: undefined }, ledgerClean[1]];
  const g = applyPanelGate(panelLanes, [gptClean, claudeClean, agyDown], { readLedger: () => noInv, sinceMs: 0, panelRunId: PRID });
  assert.equal(g.floor_pass, false);
});

// ── R3-1 (SR-011): a record from a DIFFERENT panel_run_id is not same-run → floor BLOCKS. ──
test("SR-011: records with a different panel_run_id → not same-run identity → floor BLOCKED", () => {
  const staleRun = ledgerClean.map((r) => ({ ...r, panel_run_id: "panel-OTHER-run" }));
  const g = applyPanelGate(panelLanes, [gptClean, claudeClean, agyDown], { readLedger: () => staleRun, sinceMs: 0, panelRunId: PRID });
  assert.equal(g.floor_pass, false, "a concurrent/other-run record must not satisfy this run's gate");
});

// ── R3-5 (QA-010): panel-lanes LOADER failure fail-closed for security-reviewer (distinct loader tooth). ──
test("QA-010: security-reviewer + MODULE_NOT_FOUND (panel-lanes) → fail-closed", () => {
  const err = Object.assign(new Error("Cannot find module './dispatch/panel-lanes'"), { code: "MODULE_NOT_FOUND" });
  assert.equal(panelLoaderFailClosed("security-reviewer", err), true, "a missing panel gate must fail the SECURITY review closed");
});
test("QA-010: non-security role + MODULE_NOT_FOUND → fail-open (additive contract)", () => {
  const err = Object.assign(new Error("Cannot find module './dispatch/panel-lanes'"), { code: "MODULE_NOT_FOUND" });
  assert.equal(panelLoaderFailClosed("frontend-reviewer", err), false, "the panel gate is optional for a non-security role");
});
test("QA-010: ANY non-module-absent loader error (syntax/parse) → fail-closed, even non-security", () => {
  const parseErr = new SyntaxError("Unexpected token in panel-lanes.js");
  assert.equal(panelLoaderFailClosed("security-reviewer", parseErr), true);
  assert.equal(panelLoaderFailClosed("frontend-reviewer", parseErr), true, "a real loader error is not the additive-absent case");
});

if (failures.length) {
  process.stderr.write(`FAIL [dispatch-review-panel-gate.test] ${failures.length} failure(s):\n${failures.map((f) => `  - ${f}`).join("\n")}\n`);
  process.exit(1);
}
process.stdout.write(`OK   [dispatch-review-panel-gate.test] ${passed} passed (C1 masquerade blocks; R2-B validate-first fail-closed; R2-C ledger-bound, envelope != attestation)\n`);
