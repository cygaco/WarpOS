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
test("buildProviderArgv(antigravity) → agy --model translates slug→display (ED-060), -p prompt-in-argv, usesStdin false", () => {
  const built = buildProviderArgv("antigravity", "gemini-3.1-pro-high", [], { prompt: "review this diff\nfor OWASP issues" });
  assert.ok(!built.fail, "antigravity branch must exist (not fail-closed)");
  assert.equal(built.toolId, "agy");
  assert.equal(built.usesStdin, false);
  // ED-060 slug→display: the canonical slug MUST be translated to agy's DISPLAY name at this boundary
  // — a raw slug makes agy silently default to CCPA ("not in local config, defaulting"), serving the
  // WRONG model. This is the exact defect the sprint closes.
  const mIdx = built.argv.indexOf("--model");
  assert.ok(mIdx >= 0, "--model flag present");
  assert.equal(built.argv[mIdx + 1], "Gemini 3.1 Pro (High)", "agy --model must carry the DISPLAY name, not the slug");
  assert.ok(!built.argv.includes("gemini-3.1-pro-high"), "the raw slug must NEVER reach agy --model (ED-060)");
  const pIdx = built.argv.indexOf("-p");
  assert.ok(pIdx >= 0 && built.argv[pIdx + 1].includes("OWASP"), "prompt must be the -p argv value");
  // The single-source seam: this argv must PASS safe-spawn's agy ARG_POLICY (display-name --model via
  // AGY_MODEL_DISPLAY + the multi-line -p carve-out).
  const check = assertArgs("agy", built.argv);
  assert.ok(check.ok, `agy argv rejected by safe-spawn policy: ${(check.violations || []).join("; ")}`);
});

// ── ED-060 slug→display resolver (catalog single-source; AC-1,2) ──
test("catalog.agyModelName: slug→display for antigravity, UNCHANGED otherwise", () => {
  const catalog = require("../../dispatch/catalog");
  // AC-1: the agy display name is single-sourced on the antigravity model entry.
  const m = catalog.getModel("antigravity", "gemini-3.1-pro-high");
  assert.ok(m, "antigravity model entry present");
  assert.equal(m.agyModelName, "Gemini 3.1 Pro (High)", "agyModelName field present + exact display name");
  // AC-2: resolver maps the canonical slug → display, leaves non-antigravity / unmapped ids UNCHANGED.
  assert.equal(catalog.agyModelName("gemini-3.1-pro-high"), "Gemini 3.1 Pro (High)");
  assert.equal(catalog.agyModelName("gpt-5.6-sol"), "gpt-5.6-sol", "non-antigravity id unchanged (zero blast radius)");
  assert.equal(catalog.agyModelName("some-unmapped-id"), "some-unmapped-id", "unmapped id unchanged");
});

// ── openai branch unchanged (behavior-neutral extraction); the individual gemini CLI is RETIRED (ADR-0031). ──
test("buildProviderArgv(openai) unchanged — codex stdin", () => {
  const b = buildProviderArgv("openai", "gpt-5.6-sol", ["-c", "model_reasoning_effort=high"]);
  assert.equal(b.toolId, "codex");
  assert.equal(b.usesStdin, true);
  assert.ok(b.argv.includes("exec") && b.argv.includes("-m") && b.argv.includes("gpt-5.6-sol") && b.argv.includes("-"));
});
test("buildProviderArgv(gemini) → FAIL-CLOSED (the individual gemini CLI is retired, ADR-0031)", () => {
  // The sunset `gemini` provider-id has no ARG_POLICY carve-out; buildProviderArgv must refuse the
  // unvetted spawn rather than emit a live gemini invocation (the Gemini family routes via antigravity/agy).
  const b = buildProviderArgv("gemini", "gemini-3.1-pro-preview");
  assert.equal(b.fail, true);
  assert.match(b.error, /gemini|ARG_POLICY|safety kernel/i);
});
test("buildProviderArgv(unknown) → fail-closed (no unvetted spawn)", () => {
  const b = buildProviderArgv("mystery-provider", "x");
  assert.ok(b.fail === true && /not covered/.test(b.error));
});

// ── BLOCKED-ON-OPERATOR: agy absent → runProvider fail-closes to the fallback, NOT a crash and NOT
//    the "custom cfg.syntax not covered" error (which would mean the antigravity branch is missing). ──
test("runProvider(provider:antigravity) with agy absent → fail-closed fallback (branch wired)", () => {
  // HERMETIC (D6-TEST-002 fix): force agy-unavailable via the opts.cliAvailable seam instead of ASSUMING
  // the CLI is absent — agy 1.1.4 may be installed, and a real spawn would be non-deterministic (depends
  // on ambient auth/account). strict:false skips the model pre-flight; the injected probe deterministically
  // exercises the cliAvailable('agy') fail-closed path (the operator-owned liveness gate).
  const r = runProvider("security-reviewer", "probe", { provider: "antigravity", strict: false, timeoutMs: 5000, cliAvailable: () => false });
  assert.equal(r.ok, false);
  assert.equal(r.fallback, true, "an absent agy must fall back (BLOCKED-ON-OPERATOR), not hard-fail");
  assert.ok(!/custom cfg\.syntax not covered/.test(r.error || ""), "antigravity must NOT hit the unknown-provider branch — its branch is wired");
  assert.ok(/not found/.test(r.error || ""), "the forced-unavailable seam drives the CLI-absent fail-closed reason (seam is load-bearing)");
});

if (failures.length) {
  process.stderr.write(`FAIL [providers-antigravity.test] ${failures.length} failure(s):\n${failures.map((f) => `  - ${f}`).join("\n")}\n`);
  process.exit(1);
}
process.stdout.write(`OK   [providers-antigravity.test] ${passed} passed (agy seam; liveness operator-owned ED-060)\n`);
