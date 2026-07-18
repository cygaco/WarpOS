#!/usr/bin/env node
"use strict";
/**
 * Bite-test for cert-attest.js attestPanelRun — same-run panel attestation (D8, AC-14,15 · qa-plan T5).
 *
 * THE FALSIFIABILITY FIXTURE (T5, load-bearing): a wrapper that CLAIMS agy but whose ledger record is
 * provider:claude/absent does NOT attest the agy lane → the panel attestation FAILS. Without this the
 * attestation surface is unfalsifiable = ship-blocker. Every positive has its negative control.
 *
 *   node scripts/checks/cert-attest-panel.test.js
 */
const assert = require("assert");
const { attestLane, attestPanelRun } = require("./cert-attest");

let passed = 0;
const failures = [];
function test(name, fn) {
  try { fn(); passed++; } catch (e) { failures.push(`${name}: ${e.message}`); }
}

const LANES = {
  gpt: { laneId: "gpt", provider: "openai", tool_id: "codex", shape: "subprocess-cross-provider" },
  claude: { laneId: "claude", provider: "claude", tool_id: "claude", shape: "in-process-agent" },
  agy: { laneId: "agy", provider: "antigravity", tool_id: "agy", shape: "subprocess-cross-provider" },
};
const S = "SP-TEST-001", R = "run-abc";

// same-run REAL records (the contracted-provider observed returns).
const rec = (o) => ({ sprint_id: S, run_id: R, ok: true, fallback: false, ...o });
const gptOk = rec({ role: "security-reviewer", provider: "openai", tool_id: "codex", shape: "subprocess-cross-provider", output_digest: "d-gpt", cmdline_checksum: "c-gpt" });
const agyOk = rec({ role: "security-reviewer", provider: "antigravity", tool_id: "agy", shape: "subprocess-cross-provider", output_digest: "d-agy", cmdline_checksum: "c-agy" });
// The hunter record carries the sanctioned ROLE identity (β#3/SR-005) — not a bare security-reviewer.
const claudeHunterOk = rec({ role: "security_claude_hunter", provider: "claude", via: "epsilon-agent", shape: "in-process-agent", evidence_sha: "e-cl", cmdline_checksum: "c-cl" });
const SHA = "abc1234";

// ── POSITIVE: full same-run 3-lab WITH code_sha → attested. ──
test("full same-run 3-lab (gpt+agy CLI + claude hunter in-process) + code_sha → attested", () => {
  const out = attestPanelRun({ runId: R, sprintId: S, codeSha: SHA, profile: { name: "panel-3lab" }, lanes: [LANES.gpt, LANES.claude, LANES.agy], records: [gptOk, agyOk, claudeHunterOk] });
  assert.ok(out.ok, out.reason);
  assert.ok(out.evidence_digest && out.invocation_digests.length === 3);
  assert.equal(out.code_sha, SHA);
});

// ── SR-004/QA-003: code_sha ABSENT → NOT ok even when every lane attests (AC-14 binding). ──
test("SR-004: every lane attested but code_sha absent → NOT ok", () => {
  const out = attestPanelRun({ runId: R, sprintId: S, /* codeSha omitted */ profile: { name: "panel-3lab" }, lanes: [LANES.gpt, LANES.claude, LANES.agy], records: [gptOk, agyOk, claudeHunterOk] });
  assert.equal(out.ok, false, "a binding attestation must bind to a code SHA");
  assert.ok(/code_sha/.test(out.reason), out.reason);
});

// ── SR-004: a record from a DIFFERENT sprint must NOT attest (same-run correlation). ──
test("SR-004: cross-sprint record for gpt → gpt unattested → panel FAILS", () => {
  const otherSprintGpt = { sprint_id: "SP-OTHER-999", run_id: R, ok: true, fallback: false, role: "security-reviewer", provider: "openai", tool_id: "codex", shape: "subprocess-cross-provider", output_digest: "d-x" };
  const out = attestPanelRun({ runId: R, sprintId: S, codeSha: SHA, profile: { name: "panel-2family" }, lanes: [LANES.gpt, LANES.claude], records: [otherSprintGpt, claudeHunterOk] });
  assert.equal(out.ok, false, "a cross-sprint record must not attest a lane in this run");
  assert.ok(out.lanes.find((l) => l.laneId === "gpt" && !l.attested));
});

// ── SR-004: a record from a DIFFERENT run (same sprint) must NOT attest. ──
test("SR-004: cross-run record (same sprint) for gpt → gpt unattested", () => {
  const otherRunGpt = { sprint_id: S, run_id: "run-OTHER", ok: true, fallback: false, role: "security-reviewer", provider: "openai", tool_id: "codex", shape: "subprocess-cross-provider", output_digest: "d-x" };
  const out = attestLane(LANES.gpt, [otherRunGpt], { runId: R, sprintId: S });
  assert.equal(out.attested, false, "a different-run record must not attest this run's lane");
});

// ── R2-A (SR-004-REOPEN/QA-003-R2): a NULL-run_id record must NOT attest when a runId is required. ──
test("R2-A: null-run_id record does NOT attest a required-runId lane (no null bypass)", () => {
  const nullRunGpt = { sprint_id: S, run_id: null, ok: true, fallback: false, role: "security-reviewer", provider: "openai", tool_id: "codex", shape: "subprocess-cross-provider", output_digest: "d-x" };
  const out = attestLane(LANES.gpt, [nullRunGpt], { runId: R, sprintId: S });
  assert.equal(out.attested, false, "a null-run_id record must not attest when a specific runId is required");
});
test("R2-A: null-run_id via attestPanelRun → panel FAILS (the reproduced bypass is closed)", () => {
  const nullRunGpt = { sprint_id: S, run_id: null, ok: true, fallback: false, role: "security-reviewer", provider: "openai", tool_id: "codex", shape: "subprocess-cross-provider", output_digest: "d-x" };
  const out = attestPanelRun({ runId: R, sprintId: S, codeSha: SHA, profile: { name: "panel-2family" }, lanes: [LANES.gpt, LANES.claude], records: [nullRunGpt, claudeHunterOk] });
  assert.equal(out.ok, false, "a null-run_id GPT record must not attest a required run");
});

// ── SR-005: an arbitrary claude in-process security-reviewer record (NO hunter role) → does NOT attest. ──
test("SR-005: claude in-process record without security_claude_hunter role → hunter unattested", () => {
  const notHunter = rec({ role: "security-reviewer", provider: "claude", via: "epsilon-agent", shape: "in-process-agent", evidence_sha: "e-x" });
  const out = attestLane(LANES.claude, [notHunter], { runId: R, sprintId: S });
  assert.equal(out.attested, false, "provider=claude alone must not attest the sanctioned hunter (β#3/SR-005)");
});

// ── T5a (THE fixture): wrapper CLAIMS agy but the record is provider:claude → agy NOT attested. ──
test("T5a: agy claimed but record is provider:claude → agy unattested → panel FAILS", () => {
  const fakeAgy = rec({ role: "security-reviewer", provider: "claude", tool_id: "claude", shape: "in-process-agent", evidence_sha: "e-fake" });
  const out = attestPanelRun({ runId: R, sprintId: S, profile: { name: "panel-3lab" }, lanes: [LANES.gpt, LANES.claude, LANES.agy], records: [gptOk, claudeHunterOk, fakeAgy] });
  assert.equal(out.ok, false, "a Claude record must NOT attest the agy lane (the masquerade)");
  assert.ok(out.lanes.find((l) => l.laneId === "agy" && !l.attested));
});

// ── T5b: a record-inprocess/provider:claude record offered for the gpt lane → satisfies only claude. ──
test("T5b: provider:claude in-process record does NOT attest the gpt CLI lane", () => {
  const out = attestLane(LANES.gpt, [claudeHunterOk]);
  assert.equal(out.attested, false, "a claude in-process record satisfies only the claude hunter, not gpt");
});

// ── Liveness−: fallback:true → NOT attested (a Claude clone ran, not the contracted lab). ──
test("Liveness-: fallback:true record → NOT attested", () => {
  const fb = { sprint_id: S, run_id: R, ok: true, fallback: true, provider: "openai", tool_id: "codex", shape: "subprocess-cross-provider", output_digest: "d" };
  assert.equal(attestLane(LANES.gpt, [fb]).attested, false);
});

// ── Liveness−: a config echo (no output_digest) → NOT attested (a declaration is not a run). ──
test("Liveness-: CLI record without output_digest → NOT attested (config echo insufficient)", () => {
  const echo = { sprint_id: S, run_id: R, ok: true, fallback: false, provider: "openai", tool_id: "codex", shape: "subprocess-cross-provider" };
  assert.equal(attestLane(LANES.gpt, [echo]).attested, false);
});

// ── Liveness−: wrong-run record → NOT correlated (same-run binding). ──
test("Liveness-: a record from a DIFFERENT run is not same-run correlated", () => {
  const other = { sprint_id: S, run_id: "run-OTHER", ok: true, fallback: false, provider: "openai", tool_id: "codex", shape: "subprocess-cross-provider", output_digest: "d" };
  // readLedgerRecords does the run filter; here we prove attestLane won't match if the caller passed
  // only cross-run records (it received an empty same-run set).
  const out = attestPanelRun({ runId: R, sprintId: S, profile: { name: "panel-2family" }, lanes: [LANES.gpt, LANES.claude], records: [claudeHunterOk /* only claude; gpt absent this run */] });
  assert.equal(out.ok, false);
  assert.ok(out.lanes.find((l) => l.laneId === "gpt" && !l.attested));
});

// ── missing required lane → panel FAILS (never a green with a lane absent). ──
test("missing required lane record → panel FAILS", () => {
  const out = attestPanelRun({ runId: R, sprintId: S, profile: { name: "panel-2family" }, lanes: [LANES.gpt, LANES.claude], records: [gptOk /* claude hunter absent */] });
  assert.equal(out.ok, false);
});

if (failures.length) {
  process.stderr.write(`FAIL [cert-attest-panel.test] ${failures.length} failure(s):\n${failures.map((f) => `  - ${f}`).join("\n")}\n`);
  process.exit(1);
}
process.stdout.write(`OK   [cert-attest-panel.test] ${passed} passed (T5 claimed-agy/returned-claude FAILS; wrapper claim != proof)\n`);
