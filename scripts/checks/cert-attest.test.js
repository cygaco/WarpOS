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
test("probeShape: openai=codex stdin, antigravity=agy prompt-arg + slug→display (AC-4, ED-060)", () => {
  const o = probeShape("openai", "gpt-5.6-sol", "low");
  assert.ok(o.toolId === "codex" && o.argv.includes("-m") && o.argv.includes("gpt-5.6-sol") && o.stdin === true);
  const a = probeShape("antigravity", "gemini-3.1-pro-high", null);
  assert.ok(a.toolId === "agy" && a.stdin === false);
  // AC-4: the probe MUST translate the canonical slug → agy's display name via the SAME catalog
  // resolver buildProviderArgv uses — a raw slug makes agy silently default (defeating the very
  // attestation this probe performs).
  const mIdx = a.argv.indexOf("--model");
  assert.ok(mIdx >= 0, "--model present");
  assert.equal(a.argv[mIdx + 1], "Gemini 3.1 Pro (High)", "cert-attest probe must send agy the DISPLAY name");
  assert.ok(!a.argv.includes("gemini-3.1-pro-high"), "the raw slug must NEVER reach agy --model (ED-060)");
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

// ── 2026-07-19 α/β RULING (the false-green fix): the "order-aware slice" was UNSOUND. agy emits a
//    DECEPTIVE "ChainedAuth: authenticated" line + a backend-label echo EVEN WHEN UNAUTHENTICATED, so
//    unauth signals ("not logged into Antigravity" / "defaulting to CCPA" / eval-mode) are NON-SLICEABLE:
//    their presence ANYWHERE = attested:false, regardless of any later auth-shaped line. ──
const AGY_UNAUTH_WITH_FAKE_AUTH = 'error getting token source: You are not logged into Antigravity.\nModel ID Gemini 3.1 Pro (High) not in local config, defaulting to CCPA\nModel resolved via default';
test("agy unauth signals + a DECEPTIVE auth line + backend-label echo → FAIL non-sliceable (the 19-11 false-green class)", () => {
  const v = evaluateAttestation({
    requestedModel: "Gemini 3.1 Pro (High)", providerId: "antigravity",
    output: AGY_UNAUTH_WITH_FAKE_AUTH + '\nChainedAuth: authenticated via keyring\nOAuth: authenticated successfully as user@x\nPropagating selected model override to backend: label="Gemini 3.1 Pro (High)"\nSERVING-CHECK-OK',
    exitOk: true, catalog,
  });
  assert.equal(v.attested, false, "unauth signals present → fail-closed even with a later auth line + backend-label (agy emits BOTH while unauthenticated): " + v.reason);
  assert.equal(v.defaultSignal, true, "GATE 1 must fire NON-sliceable on the terminal unauth signal");
});
test("GENUINE authenticated run — CLEAN log (auth + backend-label serve, NO unauth signal) → ATTESTS (no over-block)", () => {
  const v = evaluateAttestation({
    requestedModel: "Gemini 3.1 Pro (High)", providerId: "antigravity",
    output: 'ChainedAuth: authenticated via keyring\nOAuth: authenticated successfully as user@x\nPropagating selected model override to backend: label="Gemini 3.1 Pro (High)"\nSERVING-CHECK-OK',
    exitOk: true, catalog,
  });
  assert.equal(v.attested, true, "a clean authenticated run (no unauth tell) with a genuine backend-label serve must still attest: " + v.reason);
});
test("unauth signal AFTER the last auth line → still FAILS (order-awareness cuts one way only)", () => {
  const v = evaluateAttestation({
    requestedModel: "Gemini 3.1 Pro (High)", providerId: "antigravity",
    output: 'ChainedAuth: authenticated via keyring\nsession expired\nerror getting token source: You are not logged into Antigravity.\nModel resolved via default\nPROBE OK',
    exitOk: true, catalog,
  });
  assert.equal(v.attested, false, "a post-auth unauth/default signal is REAL and must fail closed");
});
test("authenticated but a DIFFERENT display-name label served → FAILS (GATE 2 positive-proof backstop)", () => {
  const v = evaluateAttestation({
    requestedModel: "Gemini 3.1 Pro (High)", providerId: "antigravity",
    output: 'ChainedAuth: authenticated via keyring\nPropagating selected model override to backend: label="Gemini 3.5 Flash (Medium)"\nPROBE OK',
    exitOk: true, catalog,
  });
  assert.equal(v.attested, false, "a different served label must never attest the requested model");
});

// ── ED-060 LAYER-3 (the attestation-side id-mapping): agy self-identifies the SERVED model by DISPLAY
//    name ("backend: label=…"), so attesting the canonical SLUG FALSE-REDs a genuine authenticated serve.
//    cert-attest#main maps slug→display (catalog.agyModelName) so the served-model comparison runs against
//    the display name. This is the exact false-RED observed live 2026-07-19 (a real serve read as failure). ──
test("layer-3: agy backend-label serve FALSE-REDs vs the SLUG, ATTESTS vs the display name (agyModelName)", () => {
  const serve = 'ChainedAuth: authenticated via keyring\nOAuth: authenticated successfully\nPropagating selected model override to backend: label="Gemini 3.1 Pro (High)"\nPROBE OK';
  // THE DEFECT cert-attest#main must avoid: comparing agy's display-name serve label to the SLUG.
  const bySlug = evaluateAttestation({ requestedModel: "gemini-3.1-pro-high", providerId: "antigravity", output: serve, exitOk: true, catalog });
  assert.equal(bySlug.attested, false, "the slug never appears in agy's display-name serve label → false-RED (the layer-3 defect)");
  // THE FIX: cert-attest#main resolves the slug→display via catalog.agyModelName before evaluateAttestation.
  const real = require("../dispatch/catalog.js");
  const display = real.agyModelName("gemini-3.1-pro-high");
  assert.equal(display, "Gemini 3.1 Pro (High)", "resolver gives the display name");
  const byDisplay = evaluateAttestation({ requestedModel: display, providerId: "antigravity", output: serve, exitOk: true, catalog });
  assert.equal(byDisplay.attested, true, "the display name attests the genuine authenticated serve — layer-3 mapping closes ED-060");
});

// ── CANONICAL NEGATIVE FIXTURE (α/β ruling directive #1): the committed 19-11-56Z artifact is a REAL
//    live false-green (attested:true on an UNAUTHENTICATED agy run). cert-attest MUST now fail-closed on
//    its exact output. This is the third-recurrence regression exemplar — the "18/18 green" that lacked
//    exactly this negative fixture. Never delete the artifact; this test binds to it. ──
test("NEGATIVE FIXTURE: the committed 19-11-56Z false-green output now FAILS closed (GATE 1 non-sliceable)", () => {
  const fs = require("fs");
  const path = require("path");
  const artifactPath = path.join(__dirname, "..", "..", "runtime", "cert-attest", "gemini-3.1-pro-high-2026-07-19T19-11-56-343Z.json");
  const art = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  // Re-evaluate the SAME cli_output the artifact recorded (head carries the terminal unauth signals).
  const v = evaluateAttestation({
    requestedModel: art.attested_model_id || "Gemini 3.1 Pro (High)",
    providerId: "antigravity",
    output: art.cli_output_head,
    exitOk: true,
    catalog,
  });
  assert.equal(v.attested, false, "the recorded false-green output MUST now fail-closed (it carries 'not logged into Antigravity' + 'defaulting to CCPA' + eval-mode): " + v.reason);
  assert.equal(v.defaultSignal, true, "GATE 1 must be the fail reason on the real unauth artifact");
  // Guard the exemplar: the artifact itself is the frozen record of the DEFECT (attested:true) — never mutate it.
  assert.equal(art.attested, true, "the 19-11 artifact stays the frozen false-green exemplar (attested:true as recorded); the FIX is that evaluateAttestation now refuses this output");
});

if (failures.length) {
  process.stderr.write(`FAIL [cert-attest.test] ${failures.length} failure(s):\n${failures.map((f) => `  - ${f}`).join("\n")}\n`);
  process.exit(1);
}
process.stdout.write(`OK   [cert-attest.test] ${passed} passed (incl. QA-HG-001/002 + the 19-11 non-sliceable negative fixture)\n`);
