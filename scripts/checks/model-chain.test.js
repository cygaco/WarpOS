#!/usr/bin/env node
"use strict";
/**
 * Bite-test for model-chain.js (ED-058) — proves the pure evaluateModelChain() FIRES each finding
 * class (no-fable, alpha pin, top-model, completeness, effort validity, max-only-alpha, and the
 * registry↔consumer DRIFT detector) AND that the no-fable scan does NOT false-positive on a policy
 * note that merely MENTIONS fable to reject it (the false-positive guard is the whole point — a
 * model-chain gate that flagged its own "fable is rejected" doc would be un-shippable).
 *
 * Plus an integration check: the real enforcer runs on the live registry, exits 0, emits OK.
 *
 *   node scripts/checks/model-chain.test.js
 */
const assert = require("assert");
const path = require("path");
const { execFileSync } = require("child_process");
const { evaluateModelChain, collectModelRefs } = require("./model-chain");

let passed = 0;
const failures = [];
function test(name, fn) {
  try {
    fn();
    passed++;
  } catch (e) {
    failures.push(`${name}: ${e.message}`);
  }
}
const has = (errs, sub) => errs.some((e) => e.includes(sub));

// ── A clean, policy-correct registry + a consistent consumer snapshot. ──
function cleanReg() {
  return {
    model_policy: {
      _doc: "Opus-4.8 is the shipped top; `fable`/`claude-fable-5` is NOT the top default (rejected).",
      doers: { provider: "claude", model: "claude-opus-4-8", effort: "high" },
      review_flagship: { provider: "openai", model: "gpt-5.5", effort: "xhigh" },
    },
    roles: {
      alpha: { provider: "claude", model: "claude-opus-4-8", effort: "max" },
      beta: { provider: "claude", model: "claude-opus-4-8", effort: "xhigh" },
      "director-of-product": { provider: "claude", model: "claude-opus-4-8", effort: "xhigh" },
      "backend-builder": { provider: "claude", model: "claude-opus-4-8", effort: "high" },
      "qa-reviewer": { provider: "openai", model: "gpt-5.5", effort: "xhigh" },
      "security-reviewer": {
        provider: "gemini",
        model: "gemini-3.1-pro-preview",
        effort: "high",
        second_pass: { provider: "openai", model: "gpt-5.5", effort: "xhigh" },
      },
      "skeleton-builder": { provider: "claude", model: "claude-sonnet-4-6", effort: null },
      "test-runner": { provider: "claude", model: "claude-sonnet-4-6", effort: "medium" },
    },
  };
}
function cleanConsumers(reg) {
  return {
    catalogProvider: { alpha: "claude", "qa-reviewer": "openai", "director-of-product": "claude" },
    catalogEffort: { alpha: "max", "qa-reviewer": "xhigh", "director-of-product": "xhigh" },
    providerAgent: { "qa-reviewer": "openai" },
    providerEffortFn: (role) => (reg.roles[role] ? reg.roles[role].effort : undefined),
  };
}
const clone = (r) => JSON.parse(JSON.stringify(r));

// ── 0. POSITIVE — clean registry → 0 findings. ──
test("clean registry → 0 findings", () => {
  const reg = cleanReg();
  const errs = evaluateModelChain({ reg, consumers: cleanConsumers(reg) });
  assert.deepStrictEqual(errs, [], `expected clean, got: ${errs.join(" | ")}`);
});

// ── 1. FALSE-POSITIVE GUARD — a _doc mentioning fable (to reject it) must NOT flag. ──
test("no-fable does NOT false-positive on a policy note mentioning fable", () => {
  const reg = cleanReg();
  reg.roles.alpha._note = "fable was rejected as the top default; do not use claude-fable-5";
  const errs = evaluateModelChain({ reg, consumers: cleanConsumers(reg) });
  assert.ok(!has(errs, "fable"), `prose 'fable' must not flag; got: ${errs.join(" | ")}`);
  // and collectModelRefs must ignore the _note field entirely
  assert.ok(!collectModelRefs(reg).some((r) => /note/i.test(r.where)), "collectModelRefs must not scan _note");
});

// ── A. no-fable in actual model fields. ──
test("fable in a role model → CRITICAL", () => {
  const reg = cleanReg();
  reg.roles["backend-builder"].model = "claude-fable-5";
  const errs = evaluateModelChain({ reg, consumers: cleanConsumers(reg) });
  assert.ok(has(errs, "roles.backend-builder.model") && has(errs, "fable"), errs.join(" | "));
});
test("fable in second_pass.model → CRITICAL", () => {
  const reg = cleanReg();
  reg.roles["security-reviewer"].second_pass.model = "claude-fable-5";
  const errs = evaluateModelChain({ reg, consumers: cleanConsumers(reg) });
  assert.ok(has(errs, "second_pass.model") && has(errs, "fable"), errs.join(" | "));
});
test("fable in model_policy.doers.model → CRITICAL", () => {
  const reg = cleanReg();
  reg.model_policy.doers.model = "claude-fable-5";
  const errs = evaluateModelChain({ reg, consumers: cleanConsumers(reg) });
  assert.ok(has(errs, "model_policy.doers.model") && has(errs, "fable"), errs.join(" | "));
});

// ── B. alpha positive pin. ──
test("alpha.model not opus-4.8 → CRITICAL", () => {
  const reg = cleanReg();
  reg.roles.alpha.model = "gpt-5.5";
  const errs = evaluateModelChain({ reg, consumers: cleanConsumers(reg) });
  assert.ok(has(errs, "alpha.model") && has(errs, "shipped top model"), errs.join(" | "));
});
test("alpha.effort not max → CRITICAL", () => {
  const reg = cleanReg();
  reg.roles.alpha.effort = "xhigh";
  const errs = evaluateModelChain({ reg, consumers: cleanConsumers(reg) });
  assert.ok(has(errs, "alpha.effort") && has(errs, "max effort"), errs.join(" | "));
});

// ── C. top-model policy. ──
test("doers.model not opus-4.8 → flagged", () => {
  const reg = cleanReg();
  reg.model_policy.doers.model = "claude-sonnet-4-6";
  const errs = evaluateModelChain({ reg, consumers: cleanConsumers(reg) });
  assert.ok(has(errs, "model_policy.doers.model") && has(errs, "shipped top"), errs.join(" | "));
});

// ── D/E. completeness + effort validity. ──
test("role missing model → flagged", () => {
  const reg = cleanReg();
  delete reg.roles["backend-builder"].model;
  const errs = evaluateModelChain({ reg, consumers: cleanConsumers(reg) });
  assert.ok(has(errs, "backend-builder") && has(errs, "no model"), errs.join(" | "));
});
test("role missing effort key → flagged", () => {
  const reg = cleanReg();
  delete reg.roles["backend-builder"].effort;
  const errs = evaluateModelChain({ reg, consumers: cleanConsumers(reg) });
  assert.ok(has(errs, "backend-builder") && has(errs, "no effort key"), errs.join(" | "));
});
test("invalid effort level → flagged", () => {
  const reg = cleanReg();
  reg.roles["backend-builder"].effort = "ultra";
  const errs = evaluateModelChain({ reg, consumers: cleanConsumers(reg) });
  assert.ok(has(errs, "backend-builder") && has(errs, "not a valid level"), errs.join(" | "));
});
test("claude role effort null (non-skeleton) → flagged", () => {
  const reg = cleanReg();
  reg.roles["backend-builder"].effort = null;
  const errs = evaluateModelChain({ reg, consumers: cleanConsumers(reg) });
  assert.ok(has(errs, "backend-builder") && has(errs, "null effort needs"), errs.join(" | "));
});
test("gemini role effort null → NOT flagged (always-on thinking)", () => {
  const reg = cleanReg();
  reg.roles["security-reviewer"].effort = null;
  const errs = evaluateModelChain({ reg, consumers: cleanConsumers(reg) });
  assert.ok(!has(errs, "security-reviewer"), `gemini null effort must be allowed; got: ${errs.join(" | ")}`);
});

// ── F. max only alpha. ──
test("non-alpha effort=max → flagged", () => {
  const reg = cleanReg();
  reg.roles["director-of-product"].effort = "max";
  const errs = evaluateModelChain({ reg, consumers: cleanConsumers(reg) });
  assert.ok(has(errs, "director-of-product") && has(errs, "alpha-only"), errs.join(" | "));
});

// ── G. registry ↔ consumer DRIFT. ──
test("catalog provider drift → DRIFT", () => {
  const reg = cleanReg();
  const consumers = cleanConsumers(reg);
  consumers.catalogProvider["qa-reviewer"] = "claude"; // registry says openai
  const errs = evaluateModelChain({ reg, consumers });
  assert.ok(has(errs, "[DRIFT]") && has(errs, "DEFAULT_PROVIDER_PER_ROLE"), errs.join(" | "));
});
test("catalog effort drift → DRIFT", () => {
  const reg = cleanReg();
  const consumers = cleanConsumers(reg);
  consumers.catalogEffort["qa-reviewer"] = "high"; // registry says xhigh
  const errs = evaluateModelChain({ reg, consumers });
  assert.ok(has(errs, "[DRIFT]") && has(errs, "DEFAULT_EFFORT_PER_ROLE"), errs.join(" | "));
});
test("providers provider drift → DRIFT", () => {
  const reg = cleanReg();
  const consumers = cleanConsumers(reg);
  consumers.providerAgent["qa-reviewer"] = "gemini"; // registry says openai
  const errs = evaluateModelChain({ reg, consumers });
  assert.ok(has(errs, "[DRIFT]") && has(errs, "DEFAULT_AGENT_PROVIDERS"), errs.join(" | "));
});
test("providers reasoning-effort drift → DRIFT", () => {
  const reg = cleanReg();
  const consumers = cleanConsumers(reg);
  consumers.providerEffortFn = (role) => (role === "qa-reviewer" ? "medium" : reg.roles[role] && reg.roles[role].effort); // stale literal
  const errs = evaluateModelChain({ reg, consumers });
  assert.ok(has(errs, "[DRIFT]") && has(errs, "getReasoningEffort"), errs.join(" | "));
});

// ── Integration: the REAL enforcer runs on the live registry, exits 0, emits OK. ──
test("live registry → real enforcer exits 0 + OK", () => {
  const out = execFileSync("node", [path.join(__dirname, "model-chain.js")], { encoding: "utf8" });
  assert.ok(/OK\s+\[model-chain\]/.test(out), `expected OK on live registry, got: ${out}`);
});

if (failures.length) {
  process.stderr.write(`FAIL [model-chain.test] ${failures.length} failure(s):\n${failures.map((f) => `  - ${f}`).join("\n")}\n`);
  process.exit(1);
}
process.stdout.write(`OK   [model-chain.test] ${passed} passed\n`);
