#!/usr/bin/env node
"use strict";
/**
 * Bite-test for model-chain.js (ED-058) — proves the pure evaluateModelChain() FIRES each finding
 * class (no-fable, alpha pin, top-model, completeness, effort validity, max-only-alpha, the
 * registry↔consumer DRIFT detector, the spec-frontmatter EFFORT-drift check H, and the scrapped-role
 * reintroduction guard I) AND that the no-fable scan does NOT false-positive on a policy
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

// ── The NEW (DISPATCH.md §8) roster — proves the Bucket-A SUPERSET accepts fable-top / sonnet-5
// doers / opus@max security-hunter / sol@ultra. Bucket D will NARROW the enforcer so ONLY this side
// passes; here (widen) BOTH cleanReg (opus) and fableReg (fable) must be clean. ──
function fableReg() {
  return {
    model_policy: {
      _doc: "DISPATCH.md §8: fable-5 top brain; sonnet-5 doers; gpt-5.6 Product/Growth.",
      doers: { provider: "claude", model: "claude-sonnet-5", effort: "high" },
      review_flagship: { provider: "openai", model: "gpt-5.6-sol", effort: "high" },
    },
    roles: {
      alpha: { provider: "claude", model: "claude-fable-5", effort: "high" },
      beta: { provider: "openai", model: "gpt-5.6-sol", effort: "high" },
      "director-of-engineering": { provider: "claude", model: "claude-fable-5", effort: "high" },
      "backend-builder": { provider: "claude", model: "claude-sonnet-5", effort: "high" },
      "qa-reviewer": { provider: "openai", model: "gpt-5.6-terra", effort: "xhigh" },
      cabinet: { provider: "openai", model: "gpt-5.6-sol", effort: "ultra" }, // ultra on sol → allowed
      "security-reviewer": {
        provider: "antigravity",
        model: "gemini-3.1-pro-preview",
        effort: null, // agy has no effort flag — thinking always-on
        second_pass: { provider: "openai", model: "gpt-5.6-sol", effort: "xhigh" },
        third_pass: { provider: "claude", model: "claude-opus-4-8", effort: "max" }, // opus@max hunter
      },
      "skeleton-builder": { provider: "claude", model: "claude-sonnet-5", effort: null },
    },
  };
}

// ── 0. POSITIVE — clean registry → 0 findings. ──
test("clean registry → 0 findings", () => {
  const reg = cleanReg();
  const errs = evaluateModelChain({ reg, consumers: cleanConsumers(reg) });
  assert.deepStrictEqual(errs, [], `expected clean, got: ${errs.join(" | ")}`);
});

// ── 1. SUPERSESSION (DISPATCH.md §8) — fable is now a SANCTIONED model, NOT rejected. ──
test("fable in a role model → NO fable-rejection (2026-06-16 no-fable rule superseded)", () => {
  const reg = cleanReg();
  reg.roles["director-of-product"].model = "claude-fable-5"; // an advisory role, not a doer
  const errs = evaluateModelChain({ reg, consumers: cleanConsumers(reg) });
  assert.ok(!has(errs, "fable"), `fable must be allowed post-supersession; got: ${errs.join(" | ")}`);
});
test("collectModelRefs still ignores prose (_note/_doc) fields", () => {
  const reg = cleanReg();
  reg.roles.alpha._note = "fable notes here";
  assert.ok(!collectModelRefs(reg).some((r) => /note/i.test(r.where)), "collectModelRefs must not scan _note");
});

// ── A(new). POSITIVE — the WIDEN accepts BOTH rosters: the new fable-top roster passes clean. ──
test("SUPERSET: new fable-top roster (fable alpha, sonnet-5 doers, sol@ultra, opus@max hunter) → 0 findings", () => {
  const errs = evaluateModelChain({ reg: fableReg() });
  assert.deepStrictEqual(errs, [], `new roster must pass the superset; got: ${errs.join(" | ")}`);
});
// A doer model OUTSIDE the sanctioned set is still rejected (superset is bounded, not "anything goes").
test("doers.model = a non-sanctioned model → still flagged (superset is bounded)", () => {
  const reg = cleanReg();
  reg.model_policy.doers.model = "claude-fable-5"; // fable is a valid MODEL but not a sanctioned DOER
  const errs = evaluateModelChain({ reg, consumers: cleanConsumers(reg) });
  assert.ok(has(errs, "model_policy.doers.model") && has(errs, "sanctioned doer"), errs.join(" | "));
});

// ── B. alpha positive pin (SUPERSET: opus-4-8@max OR fable-5@high). ──
test("alpha = gpt-5.5 (neither sanctioned top) → CRITICAL", () => {
  const reg = cleanReg();
  reg.roles.alpha.model = "gpt-5.5";
  const errs = evaluateModelChain({ reg, consumers: cleanConsumers(reg) });
  assert.ok(has(errs, "alpha.model") && has(errs, "sanctioned top tuples"), errs.join(" | "));
});
test("alpha = opus@xhigh (wrong effort pairing) → CRITICAL", () => {
  const reg = cleanReg();
  reg.roles.alpha.effort = "xhigh"; // opus pairs with max, not xhigh
  const errs = evaluateModelChain({ reg, consumers: cleanConsumers(reg) });
  assert.ok(has(errs, "sanctioned top tuples"), errs.join(" | "));
});
test("alpha = fable@max (fable pairs with high, not max) → CRITICAL", () => {
  const reg = cleanReg();
  reg.roles.alpha.model = "claude-fable-5";
  reg.roles.alpha.effort = "max";
  const errs = evaluateModelChain({ reg, consumers: cleanConsumers(reg) });
  assert.ok(has(errs, "sanctioned top tuples"), errs.join(" | "));
});

// ── C. doer-model policy (SUPERSET: opus-4-8 OR sonnet-5). ──
test("doers.model = legacy sonnet-4-6 (not a sanctioned doer) → flagged", () => {
  const reg = cleanReg();
  reg.model_policy.doers.model = "claude-sonnet-4-6";
  const errs = evaluateModelChain({ reg, consumers: cleanConsumers(reg) });
  assert.ok(has(errs, "model_policy.doers.model") && has(errs, "sanctioned doer"), errs.join(" | "));
});
test("doers.model = sonnet-5 (new sanctioned doer) → NOT flagged", () => {
  const reg = cleanReg();
  reg.model_policy.doers.model = "claude-sonnet-5";
  const errs = evaluateModelChain({ reg, consumers: cleanConsumers(reg) });
  assert.ok(!has(errs, "sanctioned doer"), errs.join(" | "));
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
test("invalid effort level (turbo) → flagged", () => {
  const reg = cleanReg();
  reg.roles["backend-builder"].effort = "turbo"; // ultra is now VALID; use a truly bogus level
  const errs = evaluateModelChain({ reg, consumers: cleanConsumers(reg) });
  assert.ok(has(errs, "backend-builder") && has(errs, "not a valid level"), errs.join(" | "));
});
// ── F(new). ultra CEILING — valid ONLY on gpt-5.6 sol/terra (§4). ──
test("ultra on a claude role → CEILING flagged", () => {
  const reg = cleanReg();
  reg.roles["backend-builder"].effort = "ultra"; // backend-builder is claude/opus — no ultra
  const errs = evaluateModelChain({ reg });
  assert.ok(has(errs, "backend-builder") && has(errs, "ultra is only valid on"), errs.join(" | "));
});
test("ultra on gpt-5.6-sol → allowed (no ceiling finding)", () => {
  const reg = cleanReg();
  reg.roles["qa-reviewer"].model = "gpt-5.6-sol";
  reg.roles["qa-reviewer"].effort = "ultra";
  const errs = evaluateModelChain({ reg });
  assert.ok(!has(errs, "ultra is only valid on"), errs.join(" | "));
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

// ── F. max ceiling (SUPERSET: alpha OR security-reviewer). ──
test("max on a non-sanctioned role (director-of-product) → flagged", () => {
  const reg = cleanReg();
  reg.roles["director-of-product"].effort = "max";
  const errs = evaluateModelChain({ reg, consumers: cleanConsumers(reg) });
  assert.ok(has(errs, "director-of-product") && has(errs, "reserved for"), errs.join(" | "));
});
test("max on security-reviewer (the §8 opus@max hunter home) → allowed", () => {
  const reg = cleanReg();
  reg.roles["security-reviewer"].effort = "max";
  const errs = evaluateModelChain({ reg });
  assert.ok(!has(errs, "reserved for"), errs.join(" | "));
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

// ── H. Spec-frontmatter EFFORT parity (ED-058 blind-spot — the gap that let beta/gamma/delta drift). ──
test("spec effort drift (spec high vs registry max) → DRIFT", () => {
  const reg = cleanReg();
  const specs = { alpha: { exists: true, hasEffortKey: true, effort: "high", path: "x/alpha.md" } };
  const errs = evaluateModelChain({ reg, specs });
  assert.ok(has(errs, "[DRIFT]") && has(errs, "frontmatter effort"), errs.join(" | "));
});
test("spec effort matches registry → no spec-drift finding", () => {
  const reg = cleanReg();
  const specs = { alpha: { exists: true, hasEffortKey: true, effort: "max", path: "x/alpha.md" } };
  const errs = evaluateModelChain({ reg, specs });
  assert.ok(!has(errs, "frontmatter effort"), errs.join(" | "));
});
test("spec omits effort key → not flagged (omission ≠ drift, mirrors check G)", () => {
  const reg = cleanReg();
  const specs = { alpha: { exists: true, hasEffortKey: false, path: "x/alpha.md" } };
  const errs = evaluateModelChain({ reg, specs });
  assert.ok(!has(errs, "frontmatter effort"), errs.join(" | "));
});
test("spec missing on disk → not a spec-drift finding (role-parity's scope)", () => {
  const reg = cleanReg();
  const specs = { alpha: { exists: false, reason: "unreadable" } };
  const errs = evaluateModelChain({ reg, specs });
  assert.ok(!has(errs, "frontmatter effort"), errs.join(" | "));
});

test("H/HIGH-1: provider_reasoning_effort drift (the cross-provider key) → DRIFT", () => {
  const reg = cleanReg(); // alpha effort = max
  const specs = { alpha: { exists: true, hasProviderEffortKey: true, providerEffort: "high", path: "x/alpha.md" } };
  const errs = evaluateModelChain({ reg, specs });
  assert.ok(has(errs, "[DRIFT]") && has(errs, "provider_reasoning_effort"), errs.join(" | "));
});
test("H: provider_reasoning_effort matching registry → no finding", () => {
  const reg = cleanReg();
  const specs = { alpha: { exists: true, hasProviderEffortKey: true, providerEffort: "max", path: "x/alpha.md" } };
  const errs = evaluateModelChain({ reg, specs });
  assert.ok(!has(errs, "frontmatter"), errs.join(" | "));
});
test("H/HIGH-2: empty (YAML null) spec effort vs non-null registry → DRIFT", () => {
  const reg = cleanReg(); // alpha effort = max
  const specs = { alpha: { exists: true, hasEffortKey: true, effort: null, path: "x/alpha.md" } };
  const errs = evaluateModelChain({ reg, specs });
  assert.ok(has(errs, "[DRIFT]") && has(errs, "frontmatter effort"), errs.join(" | "));
});

// ── I. Scrapped-role reintroduction guard (ADR-0007): registry-only, the back-compat shim is exempt. ──
test("scrapped name as a REAL registry role → SCRAPPED", () => {
  const reg = cleanReg();
  reg.roles.reviewer = { provider: "openai", model: "gpt-5.5", effort: "xhigh" };
  const errs = evaluateModelChain({ reg });
  assert.ok(has(errs, "[SCRAPPED]") && has(errs, "reviewer"), errs.join(" | "));
});
test("scrapped names in consumer maps (the SCRAPPED_*_ALIASES shim) → NOT flagged", () => {
  const reg = cleanReg();
  const consumers = cleanConsumers(reg);
  consumers.catalogProvider.reviewer = "openai"; // the intentional back-compat shim alias
  consumers.catalogProvider.qa = "openai";
  const errs = evaluateModelChain({ reg, consumers });
  assert.ok(!has(errs, "[SCRAPPED]"), "shim aliases in consumer maps must not be flagged: " + errs.join(" | "));
});

// ── parseFrontmatterEffort unit (the parser behind check H) ──
test("parseFrontmatterEffort: both keys + null/empty/comment/quotes (W0 review HIGH-1/2, MED-3)", () => {
  const P = require("./model-chain").parseFrontmatterEffort;
  assert.equal(P("---\nname: x\neffort: xhigh\n---\nbody").effort, "xhigh");
  assert.equal(P('---\neffort: "high"\n---').effort, "high");
  assert.equal(P("---\neffort: null\n---").effort, null);
  assert.equal(P("---\neffort: ~\n---").effort, null);
  // HIGH-2: an empty `effort:` line is YAML null and MUST count as present (was treated as absent).
  const empty = P("---\nname: x\neffort:\n---");
  assert.equal(empty.hasEffortKey, true);
  assert.equal(empty.effort, null);
  // MED-3: an inline `# comment` is not part of the value (was a false-positive source).
  assert.equal(P("---\neffort: high # intentional\n---").effort, "high");
  // HIGH-1: provider_reasoning_effort (the cross-provider dispatch key) is parsed independently.
  const pre = P("---\nprovider: gemini\nprovider_reasoning_effort: high\n---");
  assert.equal(pre.hasProviderEffortKey, true);
  assert.equal(pre.providerEffort, "high");
  assert.equal(pre.hasEffortKey, false);
  assert.equal(P("---\nname: x\n---").hasEffortKey, false);
  assert.equal(P("no frontmatter here").hasFrontmatter, false);
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
