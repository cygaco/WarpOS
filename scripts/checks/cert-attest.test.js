#!/usr/bin/env node
"use strict";
/**
 * Bite-test for cert-attest.js — the §7 attestation pure core (no live dispatch). Proves the
 * effective-model verdict: ATTESTS when the CLI output self-identifies the requested model, and
 * FAILS on the opts.model||default trap (a DIFFERENT model named), non-zero exit, empty output, and
 * the inconclusive case (fail-closed — never a false green). These ARE the §7 negative tests.
 *
 *   node scripts/checks/cert-attest.test.js
 */
const assert = require("assert");
const { evaluateAttestation, providerForModel, probeShape, norm } = require("./cert-attest");

let passed = 0;
const failures = [];
function test(name, fn) {
  try { fn(); passed++; } catch (e) { failures.push(`${name}: ${e.message}`); }
}

// Minimal catalog stub: openai serves sol + the (default) gpt-5.5; used for the "other model" tell.
const catalog = {
  getProvider: (id) => (id === "openai" ? { models: [{ id: "gpt-5.6-sol" }, { id: "gpt-5.5" }] } : null),
  PROVIDER_LIST: [{ id: "openai", models: [{ id: "gpt-5.6-sol" }, { id: "gpt-5.5" }] }],
  normalizeProviderId: (x) => x,
};

// ── ATTESTED — the CLI header self-identifies the requested model. ──
test("requested model in output + exit ok → ATTESTED", () => {
  const v = evaluateAttestation({
    requestedModel: "gpt-5.6-sol",
    providerId: "openai",
    output: "model: gpt-5.6-sol\nreasoning effort: low\nPROBE OK",
    exitOk: true,
    catalog,
  });
  assert.ok(v.attested === true, v.reason);
});

// ── FAIL — the opts.model||default trap: a DIFFERENT (default) model served. ──
test("output names the DEFAULT model, not the requested → FAIL (trap caught)", () => {
  const v = evaluateAttestation({
    requestedModel: "gpt-5.6-sol",
    providerId: "openai",
    output: "model: gpt-5.5\nreasoning effort: low\nPROBE OK", // dispatch ignored -m, served default
    exitOk: true,
    catalog,
  });
  assert.ok(v.attested === false && /different model/i.test(v.reason) && v.effective === "gpt-5.5", v.reason);
});

// ── FAIL — dispatch did not exit cleanly. ──
test("non-zero exit → FAIL", () => {
  const v = evaluateAttestation({ requestedModel: "gpt-5.6-sol", providerId: "openai", output: "boom", exitOk: false, catalog });
  assert.ok(v.attested === false && /exit/i.test(v.reason), v.reason);
});

// ── FAIL — empty output. ──
test("empty output → FAIL", () => {
  const v = evaluateAttestation({ requestedModel: "gpt-5.6-sol", providerId: "openai", output: "", exitOk: true, catalog });
  assert.ok(v.attested === false && /empty/i.test(v.reason), v.reason);
});

// ── FAIL-CLOSED — inconclusive (no known model id in output) is NOT a green. ──
test("no model id in output → inconclusive FAIL-CLOSED", () => {
  const v = evaluateAttestation({ requestedModel: "gpt-5.6-sol", providerId: "openai", output: "PROBE OK", exitOk: true, catalog });
  assert.ok(v.attested === false && /inconclusive/i.test(v.reason), v.reason);
});

// ── tolerant normalization (case / underscore / space). ──
test("case/format-insensitive model match → ATTESTED", () => {
  const v = evaluateAttestation({ requestedModel: "gpt-5.6-sol", providerId: "openai", output: "Model: GPT-5.6-SOL", exitOk: true, catalog });
  assert.ok(v.attested === true, v.reason);
});

// ── providerForModel + probeShape. ──
test("providerForModel resolves from the real catalog", () => {
  const real = require("../dispatch/catalog.js");
  assert.equal(providerForModel(real, "gpt-5.6-sol"), "openai");
  assert.equal(providerForModel(real, "gemini-3.1-pro-high"), "antigravity");
  assert.equal(providerForModel(real, "claude-fable-5"), "claude");
  assert.equal(providerForModel(real, "no-such-model-xyz"), null);
});
test("probeShape: openai=codex stdin, antigravity=agy prompt-arg", () => {
  const o = probeShape("openai", "gpt-5.6-sol", "low");
  assert.ok(o.toolId === "codex" && o.argv.includes("-m") && o.argv.includes("gpt-5.6-sol") && o.stdin === true);
  const a = probeShape("antigravity", "gemini-3.1-pro-high", null);
  assert.ok(a.toolId === "agy" && a.argv.includes("--model") && a.stdin === false);
});

if (failures.length) {
  process.stderr.write(`FAIL [cert-attest.test] ${failures.length} failure(s):\n${failures.map((f) => `  - ${f}`).join("\n")}\n`);
  process.exit(1);
}
process.stdout.write(`OK   [cert-attest.test] ${passed} passed\n`);
