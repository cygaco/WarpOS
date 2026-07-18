#!/usr/bin/env node
"use strict";
/**
 * Bite-test for harness-spawn-model.js — the Agent-tool CHANNEL model resolver (D1, ED-208).
 *
 * The load-bearing assertion (AC-2, BOTH halves): a NON-Claude registry pin resolves to a Claude
 * model through the harness channel, WHILE the same role's CLI provider/model routing is unchanged.
 * A resolver that only did the first half would let the CLI path drift; one that only did the second
 * would re-open ED-208. Both are tested, on a stub AND against the live registry.
 *
 *   node scripts/dispatch/harness-spawn-model.test.js
 */
const assert = require("assert");
const { harnessSpawnModel, isClaudeModel, HARNESS_FACE_MODEL, HARNESS_WORKER_MODEL } = require("./harness-spawn-model");

let passed = 0;
const failures = [];
function test(name, fn) {
  try { fn(); passed++; } catch (e) { failures.push(`${name}: ${e.message}`); }
}

// A stub roster covering every branch — no disk read, deterministic.
const ROLES = {
  "security-reviewer": { provider: "antigravity", model: "gemini-3.1-pro-high", tier: "worker" },
  "product-lead": { provider: "openai", model: "gpt-5.6-terra", tier: "lead" },
  "director-of-engineering": { provider: "claude", model: "claude-fable-5", tier: "director" },
  "design-quality": { provider: "claude", model: "claude-opus-4-8", tier: "worker", claude_pinned: true },
  "some-face": { provider: "openai", model: "gpt-x", tier: "face" },
  "some-tool": { provider: "gemini", model: "gemini-x", tier: "tool" },
};

// ── HALF 1 — a NON-Claude pin coerces to a Claude model on the channel. ──
test("antigravity worker → a Claude model on the harness channel (ED-208 core)", () => {
  const out = harnessSpawnModel("security-reviewer", ROLES);
  assert.ok(isClaudeModel(out.model), `expected a claude- model, got ${out.model}`);
  assert.equal(out.model, HARNESS_WORKER_MODEL); // worker tier
  assert.equal(out.source, "tier-coerced");
  assert.equal(out.coerced_from, "antigravity");
});
test("openai lead → the face-tier Claude model (lead maps to the top brain)", () => {
  const out = harnessSpawnModel("product-lead", ROLES);
  assert.equal(out.model, HARNESS_FACE_MODEL); // lead → face model
  assert.ok(isClaudeModel(out.model));
  assert.equal(out.coerced_from, "openai");
});

// ── HALF 2 — the CLI routing (getProviderForRole) is UNCHANGED by D1. ──
test("D1 does NOT touch getProviderForRole — CLI path still routes to the native provider", () => {
  const { getProviderForRole } = require("../hooks/lib/providers");
  // security-reviewer is antigravity/gemini on the CLI path; product-lead is openai. D1 governs ONLY
  // the harness channel, so these must be their NON-Claude native providers (ED-208 invariant #2).
  assert.equal(getProviderForRole("security-reviewer"), "antigravity");
  assert.equal(getProviderForRole("product-lead"), "openai");
});

// ── native-Claude + claude_pinned keep their OWN model (channel unchanged). ──
test("native-Claude director keeps its own model", () => {
  const out = harnessSpawnModel("director-of-engineering", ROLES);
  assert.equal(out.model, "claude-fable-5");
  assert.equal(out.source, "claude-native");
  assert.equal(out.coerced_from, null);
});
test("claude_pinned visual judge keeps its own pinned model", () => {
  const out = harnessSpawnModel("design-quality", ROLES);
  assert.equal(out.model, "claude-opus-4-8");
  assert.equal(out.source, "claude-pinned");
});

// ── tier map: face → face model, tool → worker model (every tier resolves Claude). ──
test("non-Claude face → face model; non-Claude tool → worker model", () => {
  assert.equal(harnessSpawnModel("some-face", ROLES).model, HARNESS_FACE_MODEL);
  assert.equal(harnessSpawnModel("some-tool", ROLES).model, HARNESS_WORKER_MODEL);
});

// ── unknown role → FAIL-SAFE face model (never a non-Claude pin). ──
test("unknown role → face-tier Claude model (fail-safe, invariant holds)", () => {
  const out = harnessSpawnModel("no-such-role-xyz", ROLES);
  assert.ok(isClaudeModel(out.model));
  assert.equal(out.model, HARNESS_FACE_MODEL);
  assert.equal(out.source, "default-unknown-role");
});

// ── LIVE registry: every role resolves a Claude model on the channel (the invariant, non-vacuous). ──
test("live registry — EVERY role's harness model is a Claude model (channel invariant)", () => {
  const { loadRoles } = require("./registry-roles");
  const roles = loadRoles();
  const ids = Object.keys(roles);
  assert.ok(ids.length > 5, "expected a populated live registry");
  const offenders = [];
  for (const id of ids) {
    const out = harnessSpawnModel(id, roles);
    if (!isClaudeModel(out.model)) offenders.push(`${id}→${out.model}`);
  }
  assert.equal(offenders.length, 0, `non-Claude harness models: ${offenders.join(", ")}`);
});
test("live registry — a real non-Claude role coerces while its CLI provider stays native", () => {
  const { loadRoles } = require("./registry-roles");
  const { getProviderForRole } = require("../hooks/lib/providers");
  const roles = loadRoles();
  // security-reviewer is the canonical non-Claude role (antigravity). Both halves on live data.
  if (roles["security-reviewer"]) {
    assert.ok(isClaudeModel(harnessSpawnModel("security-reviewer", roles).model));
    assert.notEqual(getProviderForRole("security-reviewer"), "claude");
  }
});

if (failures.length) {
  process.stderr.write(`FAIL [harness-spawn-model.test] ${failures.length} failure(s):\n${failures.map((f) => `  - ${f}`).join("\n")}\n`);
  process.exit(1);
}
process.stdout.write(`OK   [harness-spawn-model.test] ${passed} passed\n`);
