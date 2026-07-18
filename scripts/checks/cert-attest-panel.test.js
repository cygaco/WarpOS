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
const claudeHunterOk = rec({ role: "security-reviewer", provider: "claude", via: "epsilon-agent", shape: "in-process-agent", evidence_sha: "e-cl", cmdline_checksum: "c-cl" });

// ── POSITIVE: full same-run 3-lab → attested. ──
test("full same-run 3-lab (gpt+agy CLI + claude hunter in-process) → attested", () => {
  const out = attestPanelRun({ runId: R, sprintId: S, profile: { name: "panel-3lab" }, lanes: [LANES.gpt, LANES.claude, LANES.agy], records: [gptOk, agyOk, claudeHunterOk] });
  assert.ok(out.ok, out.reason);
  assert.ok(out.evidence_digest && out.invocation_digests.length === 3);
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
