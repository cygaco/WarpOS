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
const S = "SP-TEST-001", R = "panel-run-abc";
const SHA = "abc1234";

// same-run REAL records: bound to the run IDENTITY (panel_run_id, SR-011) + the code_sha executed (SR-013).
const rec = (o) => ({ sprint_id: S, run_id: R, panel_run_id: R, code_sha: SHA, ok: true, fallback: false, ...o });
const gptOk = rec({ role: "security-reviewer", provider: "openai", tool_id: "codex", shape: "subprocess-cross-provider", output_digest: "d-gpt", cmdline_checksum: "c-gpt" });
const agyOk = rec({ role: "security-reviewer", provider: "antigravity", tool_id: "agy", shape: "subprocess-cross-provider", output_digest: "d-agy", cmdline_checksum: "c-agy" });
// The hunter record carries the sanctioned ROLE identity (β#3/SR-005) — not a bare security-reviewer.
const claudeHunterOk = rec({ role: "security_claude_hunter", provider: "claude", via: "epsilon-agent", shape: "in-process-agent", evidence_sha: "e-cl", cmdline_checksum: "c-cl" });

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
  const out = attestLane(LANES.claude, [notHunter], { runId: R, sprintId: S, codeSha: SHA });
  assert.equal(out.attested, false, "provider=claude alone must not attest the sanctioned hunter (β#3/SR-005)");
});

// ── SR-015 (option B, condition 2): a SUBPROCESS-claude record must NEVER satisfy the in-process hunter
//    lane — even if it CLAIMS the hunter role. Identity is shape + role, not a settable label. ──
test("SR-015 cond-2: subprocess-claude record claiming the hunter role → hunter (in-process) unattested", () => {
  const subprocessFakeHunter = rec({ role: "security_claude_hunter", provider: "claude", shape: "subprocess-claude", output_digest: "d", cmdline_checksum: "c" });
  const out = attestLane(LANES.claude, [subprocessFakeHunter], { runId: R, sprintId: S, codeSha: SHA });
  assert.equal(out.attested, false, "a subprocess-claude record must not satisfy the in-process hunter lane (shape mismatch)");
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
  const out = attestLane(LANES.gpt, [claudeHunterOk], { runId: R, codeSha: SHA });
  assert.equal(out.attested, false, "a claude in-process record satisfies only the claude hunter, not gpt");
});

// ── Liveness−: fallback:true → NOT attested (a Claude clone ran, not the contracted lab). ──
test("Liveness-: fallback:true record → NOT attested", () => {
  const fb = rec({ fallback: true, provider: "openai", tool_id: "codex", shape: "subprocess-cross-provider", output_digest: "d", cmdline_checksum: "c" });
  assert.equal(attestLane(LANES.gpt, [fb], { runId: R, codeSha: SHA }).attested, false);
});

// ── Liveness−: a config echo (no output_digest) → NOT attested (a declaration is not a run). ──
test("Liveness-: CLI record without output_digest → NOT attested (config echo insufficient)", () => {
  const echo = rec({ provider: "openai", tool_id: "codex", shape: "subprocess-cross-provider", cmdline_checksum: "c" });
  assert.equal(attestLane(LANES.gpt, [echo], { runId: R, codeSha: SHA }).attested, false);
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
  const out = attestPanelRun({ runId: R, sprintId: S, codeSha: SHA, profile: { name: "panel-2family" }, lanes: [LANES.gpt, LANES.claude], records: [gptOk /* claude hunter absent */] });
  assert.equal(out.ok, false);
});

// ── SR-012: an OMITTED runId → NOT ok, even with fully-attested records (certifying historical evidence). ──
test("SR-012: attestPanelRun with omitted runId → NOT ok (no historical certification)", () => {
  const out = attestPanelRun({ /* runId omitted */ sprintId: S, codeSha: SHA, profile: { name: "panel-2family" }, lanes: [LANES.gpt, LANES.claude], records: [gptOk, claudeHunterOk] });
  assert.equal(out.ok, false, "a binding attestation must certify a SPECIFIC run");
  assert.ok(/runId|SR-012|specific run/i.test(out.reason), out.reason);
});

// ── SR-011: a record from a DIFFERENT panel_run_id (stale run) → NOT correlated → panel FAILS. ──
test("SR-011: a record with a different panel_run_id → not same-run → gpt unattested", () => {
  const staleGpt = { ...gptOk, panel_run_id: "panel-OTHER", run_id: "panel-OTHER" };
  const out = attestPanelRun({ runId: R, sprintId: S, codeSha: SHA, profile: { name: "panel-2family" }, lanes: [LANES.gpt, LANES.claude], records: [staleGpt, claudeHunterOk] });
  assert.equal(out.ok, false, "a stale-run record must not attest this run's lane");
  assert.ok(out.lanes.find((l) => l.laneId === "gpt" && !l.attested));
});

// ── SR-014: THE reopened case — a DIFFERENT panel_run_id whose run_id happens to MATCH must NOT attest
//    (the dropped `|| r.run_id === runId` fallback). Correlation is by panel_run_id IDENTITY only. ──
test("SR-014: different panel_run_id but matching run_id → NOT attested (no run_id fallback)", () => {
  const otherPanelGpt = { ...gptOk, panel_run_id: "panel-OTHER", run_id: R /* run_id MATCHES the requested run */ };
  const out = attestPanelRun({ runId: R, sprintId: S, codeSha: SHA, profile: { name: "panel-2family" }, lanes: [LANES.gpt, LANES.claude], records: [otherPanelGpt, claudeHunterOk] });
  assert.equal(out.ok, false, "a record from a different panel must not certify this panel via a matching run_id");
  assert.ok(out.lanes.find((l) => l.laneId === "gpt" && !l.attested));
  // and the direct lane check
  assert.equal(attestLane(LANES.gpt, [otherPanelGpt], { runId: R, sprintId: S, codeSha: SHA }).attested, false);
});

// ── SR-013: a record whose code_sha MISMATCHES the attested HEAD → NOT attested. ──
test("SR-013: record code_sha != attested codeSha → gpt unattested → panel FAILS", () => {
  const staleShaGpt = { ...gptOk, code_sha: "old-commit-999" };
  const out = attestPanelRun({ runId: R, sprintId: S, codeSha: SHA, profile: { name: "panel-2family" }, lanes: [LANES.gpt, LANES.claude], records: [staleShaGpt, claudeHunterOk] });
  assert.equal(out.ok, false, "a record from a different build must not attest the current HEAD");
});
test("SR-013: a record with NO persisted code_sha → NOT attested (provenance required)", () => {
  const noShaGpt = { ...gptOk, code_sha: undefined };
  assert.equal(attestLane(LANES.gpt, [noShaGpt], { runId: R, codeSha: SHA }).attested, false);
});
test("SR-013: a record with NO cmdline_checksum (no invocation digest) → NOT attested", () => {
  const noInvGpt = { ...gptOk, cmdline_checksum: undefined };
  assert.equal(attestLane(LANES.gpt, [noInvGpt], { runId: R, codeSha: SHA }).attested, false);
});

if (failures.length) {
  process.stderr.write(`FAIL [cert-attest-panel.test] ${failures.length} failure(s):\n${failures.map((f) => `  - ${f}`).join("\n")}\n`);
  process.exit(1);
}
process.stdout.write(`OK   [cert-attest-panel.test] ${passed} passed (T5 claimed-agy/returned-claude FAILS; wrapper claim != proof)\n`);
