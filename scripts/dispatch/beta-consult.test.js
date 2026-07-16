#!/usr/bin/env node
"use strict";
/**
 * Bite-test for the β-consult plumbing (SP-20260716-001, β item-1) + the WG-11(b) family-fallback rule.
 * Covers the backend-reviewer gauntlet findings COR-001 (never same-family), SEC-001 (strict verdict
 * parse — no bare-token fail-open), COR-003 (whitespace-only inputs refused). The live CLI round-trip is
 * proven separately (a real GPT-β dispatch, effective_model attestation); this asserts the PURE seams.
 *
 *   node scripts/dispatch/beta-consult.test.js
 */
const assert = require("assert");
const { parseVerdict, buildContext, attestRanOnGpt } = require("./beta-consult");
const { suggestFallbackProvider, PROVIDER_FAMILY } = require("../hooks/lib/providers");

let passed = 0;
const failures = [];
function test(name, fn) {
  try { fn(); passed++; } catch (e) { failures.push(`${name}: ${e.message}`); }
}

// ── COR-001: family-aware fallback NEVER returns the same (or an unknown) family ──
test("COR-001: openai + {fallback:openai} → claude (never same-family)", () => {
  assert.equal(suggestFallbackProvider("openai", { fallback: "openai" }), "claude");
});
test("COR-001: antigravity + {fallback:antigravity} → openai (never same google family)", () => {
  assert.equal(suggestFallbackProvider("antigravity", { fallback: "antigravity" }), "openai");
});
test("COR-001: openai + {fallback:gemini} → gemini (a DIFFERENT-family configured fallback is honored)", () => {
  assert.equal(suggestFallbackProvider("openai", { fallback: "gemini" }), "gemini");
});
test("COR-001: every provider's suggested fallback is a DIFFERENT known family (exhaustive)", () => {
  for (const failed of Object.keys(PROVIDER_FAMILY)) {
    for (const cfg of [null, { fallback: failed }, { fallback: "openai" }, { fallback: "claude" }, { fallback: "bogus" }]) {
      const t = suggestFallbackProvider(failed, cfg);
      assert.ok(PROVIDER_FAMILY[t], `${failed}/${JSON.stringify(cfg)} → ${t} is not a known provider`);
      assert.notEqual(PROVIDER_FAMILY[t], PROVIDER_FAMILY[failed], `${failed}/${JSON.stringify(cfg)} → ${t} is SAME family`);
    }
  }
});

// ── SEC-001: strict verdict parse — a bare token in prose is NOT a verdict ──
test("SEC-001: a prose mention ('whether to DECIDE later') → null (no fail-open bare-token)", () => {
  assert.equal(parseVerdict("No required verdict line. I am discussing whether to DECIDE later."), null);
});
test("SEC-001: a real 'VERDICT: DECIDE' line → DECIDE", () => {
  assert.equal(parseVerdict("reasoning...\nVERDICT: DECIDE\ntrailing"), "DECIDE");
});
test("SEC-001: a quoted/markdown 'VERDICT: ESCALATE' (leading > * -) → ESCALATE", () => {
  assert.equal(parseVerdict("> VERDICT: ESCALATE"), "ESCALATE");
});
test("SEC-001: conflicting VERDICT lines → null (reject ambiguity)", () => {
  assert.equal(parseVerdict("VERDICT: DECIDE\n...\nVERDICT: ESCALATE"), null);
});
test("SEC-001: duplicate SAME verdict lines → the verdict (not a conflict)", () => {
  assert.equal(parseVerdict("VERDICT: DIRECTIVE\nVERDICT: DIRECTIVE"), "DIRECTIVE");
});
test("SEC-001: no verdict line at all → null", () => {
  assert.equal(parseVerdict("a long β analysis with no verdict token"), null);
});
// R2 SEC-001: an END-OF-LINE anchor — ambiguous trailing text on the verdict line is NOT a verdict.
test("SEC-001 R2: 'VERDICT: DECIDE or ESCALATE' → null (trailing text, not a dedicated verdict)", () => {
  assert.equal(parseVerdict("VERDICT: DECIDE or ESCALATE"), null);
});
test("SEC-001 R2: two verdicts on one line 'VERDICT: DECIDE / VERDICT: ESCALATE' → null", () => {
  assert.equal(parseVerdict("VERDICT: DECIDE / VERDICT: ESCALATE"), null);
});
test("SEC-001 R2: trailing whitespace after the token is still accepted", () => {
  assert.equal(parseVerdict("VERDICT: ESCALATE   "), "ESCALATE");
});

// ── COR-003: whitespace-only boundary/claims are NOT provided (fail-closed before dispatch) ──
test("COR-003: whitespace-only boundary → buildContext !ok", () => {
  assert.equal(buildContext({ boundary: "   ", claims: "real claim", precedentLines: 5 }).ok, false);
});
test("COR-003: whitespace-only claims → buildContext !ok", () => {
  assert.equal(buildContext({ boundary: "B-1", claims: "\n\t ", precedentLines: 5 }).ok, false);
});
test("COR-003: missing boundary → buildContext !ok", () => {
  assert.equal(buildContext({ boundary: null, claims: "c", precedentLines: 5 }).ok, false);
});

// ── β RIDER (DECIDE 0.90): ran_on_gpt rests on the OBSERVED codex-exec + executed command, not config ──
const CODEX_CMD = "codex exec --sandbox workspace-write -c model_reasoning_effort=high -m gpt-5.6-sol -";
test("β-rider: real codex return (ok + openai + codex cmd + no fallback) → ran_on_gpt true", () => {
  assert.equal(attestRanOnGpt({ ok: true, provider: "openai", cmd: CODEX_CMD }).ranOnGpt, true);
});
test("β-rider: provider openai but NO codex cmd (config-inferred) → ran_on_gpt false", () => {
  assert.equal(attestRanOnGpt({ ok: true, provider: "openai", cmd: "" }).ranOnGpt, false);
});
test("β-rider: result.ok false (a reap/stub, not a real return) → ran_on_gpt false", () => {
  assert.equal(attestRanOnGpt({ ok: false, provider: "openai", cmd: CODEX_CMD }).ranOnGpt, false);
});
test("β-rider: a claude fallback (fallback:true) → ran_on_gpt false", () => {
  assert.equal(attestRanOnGpt({ ok: true, provider: "openai", cmd: CODEX_CMD, fallback: true }).ranOnGpt, false);
});
test("β-rider: a quotaFallbackFrom retry → ran_on_gpt false", () => {
  assert.equal(attestRanOnGpt({ ok: true, provider: "openai", cmd: CODEX_CMD, quotaFallbackFrom: { provider: "gemini" } }).ranOnGpt, false);
});
test("β-rider: provider claude → ran_on_gpt false", () => {
  assert.equal(attestRanOnGpt({ ok: true, provider: "claude", cmd: "claude -p" }).ranOnGpt, false);
});

if (failures.length) {
  process.stderr.write(`FAIL [beta-consult.test] ${failures.length} failure(s):\n${failures.map((f) => `  - ${f}`).join("\n")}\n`);
  process.exit(1);
}
process.stdout.write(`OK   [beta-consult.test] ${passed} passed\n`);
