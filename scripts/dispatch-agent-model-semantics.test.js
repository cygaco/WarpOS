#!/usr/bin/env node
"use strict";
/**
 * Regression guard for ED-205 — dispatch-agent run-opts model/provider semantics (D4, SP-20260718-003).
 *
 * ED-205 is RESOLVED / correct-by-design. This test LOCKS the resolved semantics so a future edit
 * that "fixes" the non-bug (a phantom regression) fails loudly. It exercises the REAL exported
 * resolveModelRunOpts (not a copy), so the lock is over the shipping code path (AC-6).
 *
 *   node scripts/dispatch-agent-model-semantics.test.js
 */
const assert = require("assert");
const { resolveModelRunOpts } = require("./dispatch-agent");

let passed = 0;
const failures = [];
function test(name, fn) {
  try { fn(); passed++; } catch (e) { failures.push(`${name}: ${e.message}`); }
}

// ── CASE 1 — native provider_model: no override → the role's registry model applies. ──
test("no override → native provider_model (roleModel) applies", () => {
  const o = resolveModelRunOpts({ providerOverride: null, modelOverride: null, roleModel: "gpt-5.6-terra" });
  assert.deepEqual(o, { model: "gpt-5.6-terra" });
  assert.equal(o.provider, undefined); // native provider — no forced override
});

// ── CASE 2 — explicit --provider X --model Y: both forced. ──
test("--provider X --model Y → both forced (override wins over roleModel)", () => {
  const o = resolveModelRunOpts({ providerOverride: "openai", modelOverride: "gpt-5.6-sol", roleModel: "gemini-3.1-pro-high" });
  assert.deepEqual(o, { provider: "openai", model: "gpt-5.6-sol" });
});

// ── CASE 3 — --provider X only: the spec model belongs to the WRONG provider → DROPPED. ──
test("--provider X (no --model) → spec model DROPPED (belongs to wrong provider)", () => {
  const o = resolveModelRunOpts({ providerOverride: "openai", modelOverride: null, roleModel: "gemini-3.1-pro-high" });
  assert.equal(o.provider, "openai");
  assert.equal(o.model, undefined, "the native-provider spec model must NOT ride an explicit provider override");
});

// ── (bonus lock) — --model Y only: force the model on the native provider. ──
test("--model Y only → force model, native provider", () => {
  const o = resolveModelRunOpts({ providerOverride: null, modelOverride: "gpt-5.6-sol", roleModel: "gpt-5.6-terra" });
  assert.deepEqual(o, { model: "gpt-5.6-sol" });
});

if (failures.length) {
  process.stderr.write(`FAIL [dispatch-agent-model-semantics.test] ${failures.length} failure(s):\n${failures.map((f) => `  - ${f}`).join("\n")}\n`);
  process.exit(1);
}
process.stdout.write(`OK   [dispatch-agent-model-semantics.test] ${passed} passed (ED-205 semantics locked)\n`);
