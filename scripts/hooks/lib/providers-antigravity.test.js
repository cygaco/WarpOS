#!/usr/bin/env node
"use strict";
/**
 * Bite-test for the D6 agy/antigravity migration seam (SP-20260718-003, ED-060).
 *
 * Proves providers.js supports agy invocation + headless dispatch (AC-9,10) AS A SEAM — liveness is
 * operator-owned (no live agy CLI), so this tests the CONTRACT shape + the fail-closed BLOCKED-ON-
 * OPERATOR behavior, NOT a green agy run. The agy `-p`-argv shape is asserted against safe-spawn's
 * agy ARG_POLICY so the two agree (the provider-id/tool-id single-source seam).
 *
 *   node scripts/hooks/lib/providers-antigravity.test.js
 */
const assert = require("assert");
const { buildProviderArgv, getProviderConfig, suggestFallbackProvider, PROVIDER_FAMILY, runProvider } = require("./providers");
const { assertArgs } = require("../../dispatch/safe-spawn");

let passed = 0;
const failures = [];
function test(name, fn) {
  try { fn(); passed++; } catch (e) { failures.push(`${name}: ${e.message}`); }
}

// ── DEFAULT_PROVIDERS.antigravity config ──
test("getProviderConfig(antigravity) → cli agy, gemini-3.1-pro-high, cross-family openai fallback", () => {
  const cfg = getProviderConfig("antigravity");
  assert.ok(cfg, "antigravity config missing");
  assert.equal(cfg.cli, "agy");
  assert.equal(cfg.default_model, "gemini-3.1-pro-high");
  assert.equal(cfg.fallback, "openai"); // cross-family (antigravity=google → openai)
  assert.ok(/agy/.test(cfg.syntax) && /-p/.test(cfg.syntax), "syntax must name agy + -p");
});

// ── family map: antigravity is google-family; fallback routes cross-family to openai. ──
test("antigravity is google-family + fallback is cross-family openai", () => {
  assert.equal(PROVIDER_FAMILY.antigravity, "google");
  assert.equal(suggestFallbackProvider("antigravity", getProviderConfig("antigravity")), "openai");
});

// ── the agy argv shape — the -p carries the prompt (usesStdin:false), passes safe-spawn's policy. ──
test("buildProviderArgv(antigravity) → agy -p prompt-in-argv, usesStdin false", () => {
  const built = buildProviderArgv("antigravity", "gemini-3.1-pro-high", [], { prompt: "review this diff\nfor OWASP issues" });
  assert.ok(!built.fail, "antigravity branch must exist (not fail-closed)");
  assert.equal(built.toolId, "agy");
  assert.equal(built.usesStdin, false);
  assert.ok(built.argv.includes("--model") && built.argv.includes("gemini-3.1-pro-high"));
  const pIdx = built.argv.indexOf("-p");
  assert.ok(pIdx >= 0 && built.argv[pIdx + 1].includes("OWASP"), "prompt must be the -p argv value");
  // The single-source seam: this argv must PASS safe-spawn's agy ARG_POLICY (multi-line -p carve-out).
  const check = assertArgs("agy", built.argv);
  assert.ok(check.ok, `agy argv rejected by safe-spawn policy: ${(check.violations || []).join("; ")}`);
});

// ── openai/gemini branches unchanged (behavior-neutral extraction). ──
test("buildProviderArgv(openai) unchanged — codex stdin", () => {
  const b = buildProviderArgv("openai", "gpt-5.6-sol", ["-c", "model_reasoning_effort=high"]);
  assert.equal(b.toolId, "codex");
  assert.equal(b.usesStdin, true);
  assert.ok(b.argv.includes("exec") && b.argv.includes("-m") && b.argv.includes("gpt-5.6-sol") && b.argv.includes("-"));
});
test("buildProviderArgv(gemini) unchanged — gemini stdin", () => {
  const b = buildProviderArgv("gemini", "gemini-3.1-pro-preview");
  assert.equal(b.toolId, "gemini");
  assert.equal(b.usesStdin, true);
  assert.ok(b.argv.includes("-o") && b.argv.includes("json"));
});
test("buildProviderArgv(unknown) → fail-closed (no unvetted spawn)", () => {
  const b = buildProviderArgv("mystery-provider", "x");
  assert.ok(b.fail === true && /not covered/.test(b.error));
});

// ── BLOCKED-ON-OPERATOR: agy absent → runProvider fail-closes to the fallback, NOT a crash and NOT
//    the "custom cfg.syntax not covered" error (which would mean the antigravity branch is missing). ──
test("runProvider(provider:antigravity) with agy absent → fail-closed fallback (branch wired)", () => {
  // strict:false to skip the model-availability pre-flight; agy CLI is not installed in CI, so this
  // exercises the cliAvailable('agy') fail-closed path (the operator-owned liveness gate).
  const r = runProvider("security-reviewer", "probe", { provider: "antigravity", strict: false, timeoutMs: 5000 });
  assert.equal(r.ok, false);
  assert.equal(r.fallback, true, "an absent agy must fall back (BLOCKED-ON-OPERATOR), not hard-fail");
  assert.ok(!/custom cfg\.syntax not covered/.test(r.error || ""), "antigravity must NOT hit the unknown-provider branch — its branch is wired");
});

if (failures.length) {
  process.stderr.write(`FAIL [providers-antigravity.test] ${failures.length} failure(s):\n${failures.map((f) => `  - ${f}`).join("\n")}\n`);
  process.exit(1);
}
process.stdout.write(`OK   [providers-antigravity.test] ${passed} passed (agy seam; liveness operator-owned ED-060)\n`);
