#!/usr/bin/env node
"use strict";
/**
 * Bite-test for provider-agent-tool-parity.js (DISPATCH.md §9 carve-out enforcer).
 * Proves it FIRES on a provider!=claude role carrying Agent-tool reachability (registry OR spec),
 * HONORS the Claude carve-out (quality-lead / design-quality / visual-review), and does NOT flag a
 * CLI-only GPT role. Plus: the live registry currently surfaces the known qa-reviewer contradiction
 * (report-only; resolved at the Bucket-D flip).
 *
 *   node scripts/checks/provider-agent-tool-parity.test.js
 */
const assert = require("assert");
const path = require("path");
const { execFileSync } = require("child_process");
const { evaluateProviderAgentToolParity } = require("./provider-agent-tool-parity");

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
// No spec on disk in the unit fixtures → specToolsFn returns { has:false } (registry-only cases).
const noSpec = () => ({ has: false });

// ── POSITIVE — the Claude carve-out is honored. ──
test("claude role with tools:[Agent] (quality-lead) → NOT flagged", () => {
  const reg = { roles: { "quality-lead": { provider: "claude", tools: ["Agent"] } } };
  const errs = evaluateProviderAgentToolParity({ reg, specToolsFn: noSpec });
  assert.deepStrictEqual(errs, [], errs.join(" | "));
});
test("claude_pinned visual judge (design-quality) → NOT flagged", () => {
  const reg = { roles: { "design-quality": { provider: "claude", claude_pinned: true, tools: ["Agent"] } } };
  const errs = evaluateProviderAgentToolParity({ reg, specToolsFn: noSpec });
  assert.deepStrictEqual(errs, [], errs.join(" | "));
});
test("gpt role WITHOUT Agent (CLI reviewer) → NOT flagged", () => {
  const reg = { roles: { "frontend-reviewer": { provider: "openai", tools: ["Read", "Grep"] } } };
  const errs = evaluateProviderAgentToolParity({ reg, specToolsFn: noSpec });
  assert.deepStrictEqual(errs, [], errs.join(" | "));
});

// ── NEGATIVE (planted) — the collision must FIRE. ──
test("openai role with tools:[Agent] (registry) → CRITICAL", () => {
  const reg = { roles: { "qa-reviewer": { provider: "openai", tools: ["Agent"] } } };
  const errs = evaluateProviderAgentToolParity({ reg, specToolsFn: noSpec });
  assert.ok(has(errs, "qa-reviewer") && has(errs, "Agent-tool reachability") && has(errs, "registry tools"), errs.join(" | "));
});
test("antigravity role with tools:[Agent] → CRITICAL", () => {
  const reg = { roles: { "some-agy-role": { provider: "antigravity", tools: ["Agent"] } } };
  const errs = evaluateProviderAgentToolParity({ reg, specToolsFn: noSpec });
  assert.ok(has(errs, "some-agy-role") && has(errs, 'provider="antigravity"'), errs.join(" | "));
});
test("gpt role with Agent in SPEC frontmatter only → CRITICAL (spec source)", () => {
  const reg = { roles: { "design-lead": { provider: "openai", spec: "x/design-lead.md" } } };
  const errs = evaluateProviderAgentToolParity({ reg, specToolsFn: () => ({ has: true }) });
  assert.ok(has(errs, "design-lead") && has(errs, "spec frontmatter tools"), errs.join(" | "));
});

// ── Integration — the live registry surfaces the KNOWN qa-reviewer contradiction (report-only). ──
test("live registry: qa-reviewer (openai+tools:Agent) is surfaced (report-only, resolved at Bucket D)", () => {
  let out = "";
  let code = 0;
  try {
    out = execFileSync("node", [path.join(__dirname, "provider-agent-tool-parity.js")], { encoding: "utf8" });
  } catch (e) {
    out = (e.stdout || "") + (e.stderr || "");
    code = e.status || 1;
  }
  // The current roster has qa-reviewer=openai+tools:Agent → the check reports it (exit 1 until Bucket D).
  assert.ok(code === 1 && /qa-reviewer/.test(out), `expected the live check to surface qa-reviewer; got code=${code}: ${out}`);
});

if (failures.length) {
  process.stderr.write(`FAIL [provider-agent-tool-parity.test] ${failures.length} failure(s):\n${failures.map((f) => `  - ${f}`).join("\n")}\n`);
  process.exit(1);
}
process.stdout.write(`OK   [provider-agent-tool-parity.test] ${passed} passed\n`);
