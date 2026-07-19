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

// ── QA-HG-001 (CRITICAL fail-closed) + QA-HG-002 (negative control): a DEFAULT/UNAUTHENTICATED/EVAL-MODE
//    signal in the output means the requested id was ECHOED but did NOT serve → attested:false even though
//    the requested id appears. The LIVE agy log is the fixture (unauthenticated → defaults the model). ──
test("QA-HG-001: requested id present BUT log shows default/unauth → FAIL (served-model unverifiable)", () => {
  const agyLog = [
    "Model ID gemini-3.1-pro-high not in local config, defaulting to CCPA",
    "Model resolved via default",
    "error getting token source: You are not logged into Antigravity.",
    "Entering local chrome mode! This is WRONG unless you are running tests or in eval mode",
  ].join("\n");
  const v = evaluateAttestation({ requestedModel: "gemini-3.1-pro-high", providerId: "antigravity", output: "PROBE OK\n" + agyLog, exitOk: true, catalog });
  assert.equal(v.attested, false, "a defaulted/unauthenticated serve must NOT attest even though the requested id is echoed");
  assert.ok(v.defaultSignal === true, "the default/unauth signal must be the fail-closed reason");
});
test("QA-HG-002 (negative control): requested echo + a resolved-via-default signal → FAIL", () => {
  const v = evaluateAttestation({ requestedModel: "gemini-3.1-pro-high", providerId: "antigravity", output: "requested gemini-3.1-pro-high; resolved via default; served a fallback model", exitOk: true, catalog });
  assert.equal(v.attested, false, "requested-echo + a default/fallback signal must fail-closed (no false-green on a conflicting serve)");
});
test("QA-HG-001 no over-block: a CLEAN authenticated serve (served self-id header) still ATTESTS", () => {
  const v = evaluateAttestation({ requestedModel: "gpt-5.6-sol", providerId: "openai", output: "model: gpt-5.6-sol\nserved ok\nPROBE OK", exitOk: true, catalog });
  assert.equal(v.attested, true, "a clean served self-id must still attest (fail-closed must not over-block)");
});
// ── β SHARP-1 (positive-proof, NOT blocklist): a NOVEL unauth variant that dodges every known bad string
//    but only ECHOES the request (no served self-id) must STILL fail-closed on GATE 2 — the positive-proof
//    gate, independent of the blocklist. This is what makes the fix robust to the next unauth phrasing. ──
test("SHARP-1: a novel unauth variant (echo only, no known bad string) FAILS on positive-proof", () => {
  const v = evaluateAttestation({ requestedModel: "gemini-3.1-pro-high", providerId: "antigravity", output: "Requested model gemini-3.1-pro-high. Backend engaged: house-model-x. PROBE OK", exitOk: true, catalog });
  assert.equal(v.attested, false, "a bare request echo with no served self-id must fail-closed (positive-proof, not blocklist)");
  assert.equal(v.servedSelfId, false, "GATE 2 must record the absence of a served self-id");
});
test("SHARP-1: a request ECHO ('Model ID <id> queued') is distinguished from a SERVE and FAILS", () => {
  const v = evaluateAttestation({ requestedModel: "gemini-3.1-pro-high", providerId: "antigravity", output: "Model ID gemini-3.1-pro-high queued. PROBE OK", exitOk: true, catalog });
  assert.equal(v.attested, false, "'Model ID <id>' (echo) is not a served self-id — the bare word 'model' must not attest");
});
test("positive-proof calibratable: an AUTHENTICATED agy serve ('Model resolved: <id>') ATTESTS", () => {
  const v = evaluateAttestation({ requestedModel: "gemini-3.1-pro-high", providerId: "antigravity", output: "Model resolved: gemini-3.1-pro-high\nauthenticated\nPROBE OK", exitOk: true, catalog });
  assert.equal(v.attested, true, "a genuine served self-id ('resolved: <id>') must attest — the fix is not an agy-hardcoded fail");
});

if (failures.length) {
  process.stderr.write(`FAIL [cert-attest.test] ${failures.length} failure(s):\n${failures.map((f) => `  - ${f}`).join("\n")}\n`);
  process.exit(1);
}
process.stdout.write(`OK   [cert-attest.test] ${passed} passed (incl. QA-HG-001/002 default/unauth fail-closed)\n`);
