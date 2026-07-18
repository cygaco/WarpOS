#!/usr/bin/env node
"use strict";
/**
 * Bite-test for panel-lanes.js — the lane contract validator + CLI-only tooth (D5, SP-20260718-003).
 *
 * Teeth (qa-plan T1 · AC-7,8): the LIVE manifest validates against passesOf + support-matrix
 * (single-source, non-vacuous); a DRIFTED manifest fail-closes (phantom lane / tool-id mismatch /
 * wrong shape); the CLI-only tooth REFUSES an in-process cross-provider lane (T1-A) and — the real
 * false-green — a gpt/agy lane ASSERTING the sanctioned-hunter exemption is STILL refused (T1-B
 * negative, β rider #3), while the genuine claude hunter is accepted (T1-C, must PASS).
 *
 *   node scripts/dispatch/panel-lanes.test.js
 */
const assert = require("assert");
const {
  loadManifest,
  requiredLanes,
  isSanctionedInProcessLane,
  assertCliOnlyPanel,
  validatePanelManifest,
} = require("./panel-lanes");

let passed = 0;
const failures = [];
function test(name, fn) {
  try { fn(); passed++; } catch (e) { failures.push(`${name}: ${e.message}`); }
}

// A registry-passes stub matching the LIVE security-reviewer shape (antigravity/openai/claude).
const PASSES = [
  { provider: "antigravity", model: "gemini-3.1-pro-high", key: "primary" },
  { provider: "openai", model: "gpt-5.6-sol", key: "second_pass" },
  { provider: "claude", model: "claude-opus-4-8", key: "third_pass" },
];
const passesOf = () => PASSES;
const toolIdOf = (p) => ({ openai: "codex", gemini: "gemini", antigravity: "agy" }[p] ?? p);
const supportMatrix = { rows: { "agy-antigravity": { status: "down", proven: false, evidence_ref: "ED-060" } } };

// ── LIVE manifest validates against the LIVE sources (non-vacuous single-source). ──
test("LIVE manifest validates against live passesOf + support-matrix", () => {
  const out = validatePanelManifest();
  assert.ok(out.ok, `live manifest drift: ${(out.errors || []).join(" | ")}`);
});

test("panel-3lab requires [gpt,claude,agy]; panel-2family requires [gpt,claude], agy optional", () => {
  const m = loadManifest();
  assert.deepEqual(m.profiles["panel-3lab"].required, ["gpt", "claude", "agy"]);
  assert.equal(m.profiles["panel-3lab"].binding, true);
  assert.deepEqual(m.profiles["panel-2family"].required, ["gpt", "claude"]);
  assert.equal(m.profiles["panel-2family"].binding, false);
  assert.ok((m.profiles["panel-2family"].optional || []).includes("agy"));
  assert.equal(requiredLanes(m, "panel-3lab").length, 3);
});

// ── DRIFT fail-closed: phantom lane / tool-id mismatch / wrong shape. ──
test("phantom lane (provider not a pass) → fail-closed", () => {
  const manifest = {
    profiles: { "panel-3lab": { binding: true, required: ["gpt", "claude", "agy"] }, "panel-2family": { binding: false, required: ["gpt", "claude"], optional: ["agy"] } },
    sunset: { ref: "ED-060" },
    lanes: {
      gpt: { provider: "openai", tool_id: "codex", shape: "subprocess-cross-provider" },
      claude: { provider: "claude", tool_id: "claude", shape: "in-process-agent" },
      agy: { provider: "antigravity", tool_id: "agy", shape: "subprocess-cross-provider", sunset_ref: "ED-060" },
      phantom: { provider: "mistral", tool_id: "mi", shape: "subprocess-cross-provider" },
    },
  };
  const out = validatePanelManifest({ manifest, passesOf, toolIdOf, supportMatrix });
  assert.ok(!out.ok && out.errors.some((e) => /phantom/i.test(e)));
});
test("tool_id drift (agy lane mislabeled 'gemini') → fail-closed", () => {
  const manifest = {
    profiles: { "panel-3lab": { binding: true, required: ["gpt", "claude", "agy"] }, "panel-2family": { binding: false, required: ["gpt", "claude"], optional: ["agy"] } },
    sunset: { ref: "ED-060" },
    lanes: {
      gpt: { provider: "openai", tool_id: "codex", shape: "subprocess-cross-provider" },
      claude: { provider: "claude", tool_id: "claude", shape: "in-process-agent" },
      agy: { provider: "antigravity", tool_id: "gemini", shape: "subprocess-cross-provider", sunset_ref: "ED-060" },
    },
  };
  const out = validatePanelManifest({ manifest, passesOf, toolIdOf, supportMatrix });
  assert.ok(!out.ok && out.errors.some((e) => /tool_id/.test(e)));
});
test("wrong shape (cross-provider lane declared in-process) → fail-closed", () => {
  const manifest = {
    profiles: { "panel-3lab": { binding: true, required: ["gpt", "claude", "agy"] }, "panel-2family": { binding: false, required: ["gpt", "claude"], optional: ["agy"] } },
    sunset: { ref: "ED-060" },
    lanes: {
      gpt: { provider: "openai", tool_id: "codex", shape: "in-process-agent" }, // WRONG — gpt must be CLI
      claude: { provider: "claude", tool_id: "claude", shape: "in-process-agent" },
      agy: { provider: "antigravity", tool_id: "agy", shape: "subprocess-cross-provider", sunset_ref: "ED-060" },
    },
  };
  const out = validatePanelManifest({ manifest, passesOf, toolIdOf, supportMatrix });
  assert.ok(!out.ok && out.errors.some((e) => /shape/.test(e)));
});

// ── LOADER-fail-closed (distinct path): a broken registry read → loaderError, not a green. ──
test("registry loader throw → loaderError (fail-closed, not swallowed)", () => {
  const out = validatePanelManifest({
    manifest: loadManifest(),
    passesOf: () => { throw new Error("registry unreadable"); },
    toolIdOf,
    supportMatrix,
  });
  assert.ok(!out.ok && out.loaderError === true);
});

// ── CLI-only tooth: T1-A refuse in-process cross-provider; T1-B negative exemption; T1-C sanctioned OK. ──
test("T1-A: a gpt lane resolved in-process → REFUSED", () => {
  const out = assertCliOnlyPanel([{ laneId: "gpt", provider: "openai", shape: "in-process-agent" }]);
  assert.ok(!out.ok && out.violations.some((v) => /gpt/.test(v)));
});
test("T1-A: an agy lane resolved in-process → REFUSED", () => {
  const out = assertCliOnlyPanel([{ laneId: "agy", provider: "antigravity", shape: "in-process-agent" }]);
  assert.ok(!out.ok);
});
test("T1-B (negative, the false-green): a gpt lane ASSERTING lane id 'claude' but provider openai → REFUSED", () => {
  // The masquerade: a gpt lane tries to ride the claude-hunter exemption by claiming the lane name.
  // Positive identity scope (provider must be claude) refuses it — the exemption is not a settable label.
  assert.equal(isSanctionedInProcessLane("claude", { provider: "openai" }), false);
  const out = assertCliOnlyPanel([{ laneId: "claude", provider: "openai", shape: "in-process-agent" }]);
  assert.ok(!out.ok, "a non-claude-provider lane must NOT be exempted even if it labels itself 'claude'");
});
test("T1-C (sanctioned, must PASS): the genuine claude hunter in-process (structural: claude+claude+in-process) → accepted", () => {
  // SR-020 (ADR-0022 teeth-2): the exemption is DELEGATED to provenance-verifier.isSanctionedHunterLane and
  // keys on the STRUCTURAL contract — laneId "claude" AND provider "claude" AND the in-process shape — NOT a
  // settable label. (In production the observed claude lane is subprocess-claude; the in-process HUNTER is a
  // separate record whose writer-stamped role is still enforced at the RECORD level by pv.isHunterRecord.)
  assert.equal(isSanctionedInProcessLane("claude", { provider: "claude", shape: "in-process-agent" }), true);
  const out = assertCliOnlyPanel([
    { laneId: "gpt", provider: "openai", shape: "subprocess-cross-provider" },
    { laneId: "agy", provider: "antigravity", shape: "subprocess-cross-provider" },
    { laneId: "claude", provider: "claude", shape: "in-process-agent" },
  ]);
  assert.ok(out.ok, `sanctioned hunter over-rejected: ${out.violations.join(" | ")}`);
});
test("T1-D (SR-020): the settable sanctioned_lane_id/role LABEL does NOT grant the exemption — structure does", () => {
  // SR-020 close (the THIRD settable-identity consumer): the exemption no longer trusts a settable label. A
  // gpt lane setting sanctioned_lane_id='security_claude_hunter' gets NOTHING (positive scope: provider must be
  // claude); a claude lane's exemption keys on the in-process SHAPE, and the label is ignored entirely
  // (SR-016/SR-017 root: identity is never a settable field). The record-level role check (pv.isHunterRecord)
  // is where the writer-stamped security_claude_hunter identity is enforced for actual attestation — unchanged.
  assert.equal(isSanctionedInProcessLane("claude", { provider: "openai", sanctioned_lane_id: "security_claude_hunter", shape: "in-process-agent" }), false, "provider must be claude — a gpt lane can't ride the settable label");
  assert.equal(isSanctionedInProcessLane("gpt", { provider: "claude", shape: "in-process-agent" }), false, "only laneId 'claude' can be the sanctioned lane");
  assert.equal(isSanctionedInProcessLane("claude", { provider: "claude" }), false, "no in-process shape → not the sanctioned in-process lane");
  assert.equal(isSanctionedInProcessLane("claude", { provider: "claude", shape: "subprocess-claude" }), false, "a subprocess-claude lane is not the in-process hunter lane (it does not need the exemption)");
  // the masquerade STILL blocks: a gpt lane resolved in-process is refused even if it sets the sanctioned label.
  const out = assertCliOnlyPanel([{ laneId: "gpt", provider: "openai", shape: "in-process-agent", sanctioned_lane_id: "security_claude_hunter" }]);
  assert.ok(!out.ok, "a gpt lane resolved in-process must be refused even if it sets the sanctioned label");
});

// ── H2/SR-006: EXACT required-set validation. A mutated required set that DROPS a lane must FAIL. ──
test("SR-006: panel-3lab.required=[agy] (gpt,claude dropped) → validation FAILS", () => {
  const mutated = JSON.parse(JSON.stringify(loadManifest()));
  mutated.profiles["panel-3lab"].required = ["agy"];
  const out = validatePanelManifest({ manifest: mutated, passesOf, toolIdOf, supportMatrix });
  assert.ok(!out.ok, "a panel-3lab that silently drops gpt+claude must not validate");
  assert.ok(out.errors.some((e) => /EXACTLY the full lab set|SR-006/.test(e)), out.errors.join(" | "));
});
test("SR-006: panel-2family.required=[gpt] (claude dropped) → validation FAILS", () => {
  const mutated = JSON.parse(JSON.stringify(loadManifest()));
  mutated.profiles["panel-2family"].required = ["gpt"];
  const out = validatePanelManifest({ manifest: mutated, passesOf, toolIdOf, supportMatrix });
  assert.ok(!out.ok, "a panel-2family that silently drops claude must not validate");
});
test("SR-006 negative control: the REAL manifest (exact sets) still validates ok", () => {
  const out = validatePanelManifest({ manifest: loadManifest(), passesOf, toolIdOf, supportMatrix });
  assert.ok(out.ok, `real manifest must validate: ${(out.errors || []).join(" | ")}`);
});

if (failures.length) {
  process.stderr.write(`FAIL [panel-lanes.test] ${failures.length} failure(s):\n${failures.map((f) => `  - ${f}`).join("\n")}\n`);
  process.exit(1);
}
process.stdout.write(`OK   [panel-lanes.test] ${passed} passed (single-source drift + CLI-only tooth incl. T1-B masquerade)\n`);
