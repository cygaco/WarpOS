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
test("agy §7 HONEST-CEILING: even a clean-looking agy log ('Model resolved: <id>') does NOT attest (client-echo, never trusted)", () => {
  const v = evaluateAttestation({ requestedModel: "gemini-3.1-pro-high", providerId: "antigravity", output: "Model resolved: gemini-3.1-pro-high\nauthenticated\nPROBE OK", exitOk: true, catalog });
  assert.equal(v.attested, false, "cert-attest refuses to attest agy from its log — no client line is trusted (§7 honest-ceiling)");
  assert.equal(v.honestCeiling, true, "the reason is the §7 honest-ceiling");
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
test("agy §7 HONEST-CEILING: even a CLEAN log with a backend-label serve does NOT attest (the label is a client echo)", () => {
  const v = evaluateAttestation({
    requestedModel: "Gemini 3.1 Pro (High)", providerId: "antigravity",
    output: 'ChainedAuth: authenticated via keyring\nOAuth: authenticated successfully as user@x\nPropagating selected model override to backend: label="Gemini 3.1 Pro (High)"\nSERVING-CHECK-OK',
    exitOk: true, catalog,
  });
  assert.equal(v.attested, false, "agy's backend-label is a client-side echo (emitted even unauthenticated) → never trusted; §7 fail-closed by construction");
  assert.equal(v.honestCeiling, true, "the §7 honest-ceiling is the reason (no client line is served-model proof)");
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

// ── ED-060 LAYER-3 mapping (dispatch-side) STAYS — the canonical slug must translate to agy's display name
//    at the --model boundary (asserted at the argv level in providers-antigravity.test.js) so a FUTURE
//    authenticated dispatch serves the contracted model. But the ATTESTATION-side comparison is MOOT under
//    the §7 honest-ceiling: agy NEVER attests from its log, so NEITHER slug nor display attests here. ──
test("layer-3 mapping stays (slug→display) but agy §7 honest-ceiling means neither slug nor display attests via the log", () => {
  const serve = 'ChainedAuth: authenticated via keyring\nOAuth: authenticated successfully\nPropagating selected model override to backend: label="Gemini 3.1 Pro (High)"\nPROBE OK';
  const real = require("../dispatch/catalog.js");
  assert.equal(real.agyModelName("gemini-3.1-pro-high"), "Gemini 3.1 Pro (High)", "resolver still maps slug→display for the dispatch --model boundary");
  const bySlug = evaluateAttestation({ requestedModel: "gemini-3.1-pro-high", providerId: "antigravity", output: serve, exitOk: true, catalog });
  const byDisplay = evaluateAttestation({ requestedModel: "Gemini 3.1 Pro (High)", providerId: "antigravity", output: serve, exitOk: true, catalog });
  assert.equal(bySlug.attested, false, "agy never attests from its log (§7 honest-ceiling)");
  assert.equal(byDisplay.attested, false, "agy never attests even with the display name — the backend-label is a client echo, not trusted");
  assert.equal(byDisplay.honestCeiling, true, "the §7 honest-ceiling is the reason");
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

// ── ATTRIBUTION (α/β ruling directive #3): the folded agy log is bound to the run's time WINDOW —
//    cross-run stale lines (a prior run's auth / serve-label / unauth signals) are dropped so they cannot
//    bleed into the attestation (the contamination that helped produce the 19-11 false-green). ──
test("filterAgyLogToRunWindow: drops cross-run stale + untimestamped lines, keeps in-window (directive #3)", () => {
  const { filterAgyLogToRunWindow } = require("./cert-attest");
  const now = new Date();
  const fmt = (d) => `I${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}.100000 38760 x.go:1]`;
  const started = now.getTime();
  const inWindow = `${fmt(now)} in-window serve line`;
  const stale = `${fmt(new Date(started - 3600000))} STALE cross-run serve line`; // 1h ago → out of window
  const kept = filterAgyLogToRunWindow(`${stale}\n${inWindow}\nuntimestamped continuation`, started);
  assert.ok(kept.includes("in-window serve line"), "in-window line kept");
  assert.ok(!kept.includes("STALE"), "1h-stale cross-run line DROPPED (no serve-marker bleed)");
  assert.ok(!kept.includes("continuation"), "untimestamped continuation DROPPED");
});

// ── FULL-TRANSCRIPT NEGATIVE FIXTURE (gauntlet R1 INT-002/Axis-4): the committed 19-11 ARTIFACT stores only
//    the 2KB cli_output_head, which lacks the deceptive auth line + backend-label — so a regression to the
//    old label-trusting logic would NOT be caught by the head-only fixture. This SHA-pinned FULL redacted
//    transcript carries the whole false-green scenario (unauth tells + keyring expired=true + deceptive
//    ChainedAuth/OAuth + fake backend-label serve of the display name), so ANY regression that re-trusted a
//    client line would flip this to attested:true and the test would catch it. Evaluate the exact bytes. ──
test("FULL-transcript false-green fixture (deceptive auth + fake backend-label + unauth tells) → attested:false, SHA-pinned", () => {
  const fs = require("fs");
  const path = require("path");
  const crypto = require("crypto");
  const fixturePath = path.join(__dirname, "..", "..", "runtime", "cert-attest", "fixtures", "agy-full-transcript-false-green.txt");
  const bytes = fs.readFileSync(fixturePath);
  const sha = crypto.createHash("sha256").update(bytes).digest("hex");
  assert.equal(sha, "c7333f4e9e884bde782add82d2fbe8a447b6a35a20bc7c7bc4a209a318ae66b9", "fixture SHA-256 pinned — the transcript must not drift (it is the full false-green exemplar)");
  const out = bytes.toString("utf8");
  // Sanity: the fixture really does carry BOTH the deceptive positive markers a regression would trust.
  assert.ok(/ChainedAuth: authenticated/.test(out) && /Propagating selected model override to backend: label="Gemini 3\.1 Pro \(High\)"/.test(out), "fixture carries the deceptive auth line + fake backend-label (else it can't catch a label-trust regression)");
  const v = evaluateAttestation({ requestedModel: "Gemini 3.1 Pro (High)", providerId: "antigravity", output: out, exitOk: true, catalog });
  assert.equal(v.attested, false, "the FULL false-green transcript must fail-closed — restoring any client-line trust (old slice / GATE-2 label-trust) would flip this to true: " + v.reason);
});

// ── ADR-0027 RIDER-2 TEETH-CHECK (task #18 convergent CRITICAL — backend-label is NOT proof): the 22:16Z
//    same-user safe-spawn SPIKE produced a GENUINE authenticated round-trip (keyring auto-refreshed the
//    expired token, ChainedAuth+OAuth succeeded, the CORRECT display label bound to the backend, 2 real
//    streamGenerateContent calls to daily-cloudcode-pa.googleapis.com). The CANONICAL cert-attest returned
//    attested:true for this exact run (artifact gemini-3.1-pro-(high)-2026-07-19T22-16-11-295Z.json). The
//    HARDENED gate must REJECT it — proof the gate is not a rubber-stamp (ADR-0027 rider 2). Two teeth:
//    (1) the FULL spike log fails (GATE-1 catches the coexisting pre-auth default/eval/expired tells); and
//    (2) the POST-AUTH-ONLY slice — the genuine-looking serve evidence with NO terminal tells, the CORRECT
//    backend-label, and the real round-trip — STILL fails via §7 honest-ceiling, because agy's backend-label
//    is a REQUEST-SIDE bind / client echo, never a response-side served-model receipt (the standing R6-BE-002
//    / ED-215 ceiling). ED-060 closes ONLY via a real authenticated dispatch-agent record + account-config
//    served-model identity — never this log. ──
test("ADR-0027 rider-2 teeth-check: the REAL 22:16 spike log (canonical=attested:true) → FAILS the hardened gate, SHA-pinned", () => {
  const fs = require("fs");
  const path = require("path");
  const crypto = require("crypto");
  const fixturePath = path.join(__dirname, "..", "..", "runtime", "cert-attest", "fixtures", "agy-spike-22-16-false-green.txt");
  const bytes = fs.readFileSync(fixturePath);
  const sha = crypto.createHash("sha256").update(bytes).digest("hex");
  assert.equal(sha, "1c5136bb60d00a5b55ba9ffb0cbb935a53e83b6c45e3f55e6fa0a6f5931e2726", "spike fixture SHA-256 pinned — it must not drift (the real 22:16 authenticated-round-trip log)");
  const full = bytes.toString("utf8");
  // Sanity: the fixture really carries the GENUINE-serve markers a naive gate would trust as proof.
  assert.ok(/OAuth: authenticated successfully/.test(full) && /Propagating selected model override to backend: label="Gemini 3\.1 Pro \(High\)"/.test(full) && /streamGenerateContent/.test(full), "fixture carries auth-success + correct backend-label + real round-trip (else it can't be a teeth-check)");
  // (1) The FULL spike log → attested:false (GATE-1 catches the coexisting pre-auth default/eval/expired tells).
  const vFull = evaluateAttestation({ requestedModel: "Gemini 3.1 Pro (High)", providerId: "antigravity", output: full, exitOk: true, catalog });
  assert.equal(vFull.attested, false, "the real 22:16 spike log must fail-closed on the hardened gate (canonical returned attested:true — that is the false-green this closes): " + vFull.reason);
  // R3-MEDIUM-02: PIN the rejection to GATE-1 (not just attested:false) — the full log carries the terminal
  // default/eval/expired tells, so GATE-1 (defaultSignal) MUST be what rejects it. A future change that
  // bypasses GATE-1 and leans only on §7 would silently pass a bare attested:false check; asserting
  // defaultSignal:true keeps this a real GATE-1 teeth-check.
  assert.equal(vFull.defaultSignal, true, "the full spike log must reject via GATE-1 (the terminal default/eval/expired tells), not only via §7 — pin the gate so a GATE-1 regression is caught: " + vFull.reason);
  // (2) POST-AUTH-ONLY slice — genuine-looking serve evidence, NO terminal tells → STILL fails via §7 honest-
  //     ceiling (backend-label / request-side-bind is not served-model proof; task #18).
  const postAuth = full.slice(full.indexOf("OAuth: authenticated successfully"));
  assert.ok(!/resolved via default|expired=true|eval mode|local chrome|not logged in/i.test(postAuth), "the post-auth slice must carry NO terminal tells (else it is a GATE-1 test, not a §7 test)");
  const vPost = evaluateAttestation({ requestedModel: "Gemini 3.1 Pro (High)", providerId: "antigravity", output: postAuth, exitOk: true, catalog });
  assert.equal(vPost.attested, false, "the genuine-looking post-auth serve evidence (correct backend-label + real round-trip) must STILL not attest — agy's backend-label is a request-side bind, never served-model proof: " + vPost.reason);
  assert.equal(vPost.honestCeiling, true, "the reason must be the §7 honest-ceiling (no agy log line is served-model proof), not a GATE-1 terminal tell");
});

// ── R3-MEDIUM-03 (provenance VERIFICATION, not just a fixture assertion): the prior test's "canonical returned
//    attested:true" claim was a COMMENT, unverified in-worktree. Commit the REAL 22:16 canonical verdict
//    artifact and PROVE the claim from it: (a) the artifact itself recorded attested:true (the frozen canonical
//    false-green exemplar — never mutate it), AND (b) the hardened gate re-evaluates the artifact's OWN
//    recorded cli_output_head → attested:false via GATE-1. So the historical-provenance claim is machine-checked
//    against the committed artifact, not merely asserted in prose (mirrors the 19-11 negative-fixture test). ──
test("R3-MEDIUM-03: the committed 22:16 CANONICAL artifact recorded attested:true, but the hardened gate rejects its recorded output", () => {
  const fs = require("fs");
  const path = require("path");
  const artifactPath = path.join(__dirname, "..", "..", "runtime", "cert-attest", "fixtures", "agy-spike-22-16-canonical-artifact.json");
  const art = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  // (a) provenance VERIFIED: the canonical run DID green this exact serve (the false-green this sprint closes).
  assert.equal(art.attested, true, "the committed 22:16 artifact is the frozen canonical false-green exemplar (attested:true as recorded) — the historical-provenance claim, now machine-checked not just commented");
  assert.equal(art.provider, "antigravity", "the artifact is an antigravity verdict");
  // (b) the HARDENED gate rejects the artifact's OWN recorded cli_output_head (the exact bytes canonical greened).
  const v = evaluateAttestation({ requestedModel: art.requested_model || "Gemini 3.1 Pro (High)", providerId: "antigravity", output: art.cli_output_head, exitOk: true, catalog });
  assert.equal(v.attested, false, "the hardened gate must reject the EXACT recorded output that canonical attested:true'd: " + v.reason);
  assert.equal(v.defaultSignal, true, "the recorded head carries the terminal default/eval tells → GATE-1 rejects it (pin the gate)");
});

if (failures.length) {
  process.stderr.write(`FAIL [cert-attest.test] ${failures.length} failure(s):\n${failures.map((f) => `  - ${f}`).join("\n")}\n`);
  process.exit(1);
}
process.stdout.write(`OK   [cert-attest.test] ${passed} passed (incl. QA-HG-001/002 + 19-11 negative fixture + run-window attribution + ADR-0027 rider-2 spike teeth-check)\n`);
