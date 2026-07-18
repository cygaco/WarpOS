#!/usr/bin/env node
"use strict";
/**
 * Canary corpus + fail-closed teeth for panelStatus (D7, SP-20260718-003 · qa-plan T2/T3/T4 · AC-1,9,11,12,13).
 *
 * THE ANTI-FALSE-GREEN BACKBONE: the test FAILS if panelStatus EVER returns PASS/GREEN with any
 * contracted lane absent, coerced, refused, malformed, or below the OBSERVED-family diversity bar.
 * Every case has a negative control; a clean all-lanes-attested run is the ONE that PASSes (so the
 * reducer is not vacuously always-BLOCKED).
 *
 *   node scripts/dispatch/panel-status.test.js
 */
const assert = require("assert");
const { panelStatus, STATUS } = require("./panel-lanes");

let passed = 0;
const failures = [];
function test(name, fn) {
  try { fn(); passed++; } catch (e) { failures.push(`${name}: ${e.message}`); }
}

const PANEL_3LAB = { name: "panel-3lab", required: ["gpt", "claude", "agy"], min_families: 2, binding: true };
const PANEL_2FAM = { name: "panel-2family", required: ["gpt", "claude"], min_families: 2, binding: false };

// A helper: an alive+clean+attested lane on its contracted provider.
const clean = (laneId, provider) => ({ laneId, contractedProvider: provider, observedProvider: provider, fallback: false, alive: true, verdict: "pass", hasEvidence: true });

// ── NEGATIVE CONTROL — a clean 2-family panel PASSes (reducer isn't vacuously blocked). ──
test("CONTROL: all required lanes alive+clean+attested, 2 families → PASS", () => {
  const r = panelStatus(PANEL_2FAM, [clean("gpt", "openai"), clean("claude", "claude")]);
  assert.equal(r.status, STATUS.PASS, r.reason);
  assert.equal(r.families, 2);
});
test("CONTROL: full 3-lab all-attested → PASS", () => {
  const r = panelStatus(PANEL_3LAB, [clean("gpt", "openai"), clean("claude", "claude"), clean("agy", "antigravity")]);
  assert.equal(r.status, STATUS.PASS, r.reason);
});

// ── CANARY 1 — kill-one-lane: a required lane dead → BLOCKED-INCONCLUSIVE (never PASS). ──
test("CANARY kill-one-lane: gpt dead → BLOCKED-INCONCLUSIVE", () => {
  const r = panelStatus(PANEL_2FAM, [
    { laneId: "gpt", contractedProvider: "openai", observedProvider: "openai", fallback: false, alive: false, verdict: "error", hasEvidence: true },
    clean("claude", "claude"),
  ]);
  assert.equal(r.status, STATUS.BLOCKED_INCONCLUSIVE, r.reason);
});

// ── CANARY 2 — contracted-but-DOWN agy + ZERO record → BLOCKED-ON-OPERATOR (never GREEN). ──
test("CANARY contracted-but-down agy (zero record) → panel-3lab BLOCKED-ON-OPERATOR", () => {
  const r = panelStatus(
    PANEL_3LAB,
    [clean("gpt", "openai"), clean("claude", "claude") /* agy has NO evidence */],
    { agyOperatorOwned: true },
  );
  assert.equal(r.status, STATUS.BLOCKED_ON_OPERATOR, r.reason);
  assert.notEqual(r.status, STATUS.PASS);
});
test("CANARY agy absent + gpt ALSO dead → BLOCKED-INCONCLUSIVE (not merely operator)", () => {
  const r = panelStatus(
    PANEL_3LAB,
    [{ laneId: "gpt", contractedProvider: "openai", observedProvider: "openai", fallback: false, alive: false, verdict: "error", hasEvidence: true }, clean("claude", "claude")],
    { agyOperatorOwned: true },
  );
  assert.equal(r.status, STATUS.BLOCKED_INCONCLUSIVE, r.reason);
});

// ── CANARY 3 — the β#1 masquerade: both cross-provider lanes COERCED to Claude → NOT PASS. ──
test("CANARY masquerade: gpt+agy coerced to claude (fallback:true) labeled 3-lab → NOT PASS (β#1)", () => {
  const r = panelStatus(PANEL_3LAB, [
    { laneId: "gpt", contractedProvider: "openai", observedProvider: "claude", fallback: true, alive: true, verdict: "pass", hasEvidence: true },
    clean("claude", "claude"),
    { laneId: "agy", contractedProvider: "antigravity", observedProvider: "claude", fallback: true, alive: true, verdict: "pass", hasEvidence: true },
  ]);
  assert.notEqual(r.status, STATUS.PASS, "an all-Claude set must NEVER pass as cross-provider");
  assert.equal(r.status, STATUS.BLOCKED_INCONCLUSIVE, r.reason);
  assert.equal(r.laneStatus.gpt, "coerced");
  assert.equal(r.laneStatus.agy, "coerced");
});
test("CANARY diversity: all lanes observed-claude (1 family) → BLOCKED (observed count, not label)", () => {
  // Even if the LABELS said 3 providers, observed families = 1 → diversity loss.
  const r = panelStatus(PANEL_2FAM, [
    { laneId: "gpt", contractedProvider: "claude", observedProvider: "claude", fallback: false, alive: true, verdict: "pass", hasEvidence: true },
    clean("claude", "claude"),
  ]);
  assert.equal(r.status, STATUS.BLOCKED_INCONCLUSIVE, r.reason);
  assert.equal(r.families, 1);
});

// ── CANARY 4 — judge-refusal (verdict "error") → BLOCKED (T3 vector 1). ──
test("CANARY judge-refusal: a required lane verdict 'error' → BLOCKED-INCONCLUSIVE", () => {
  const r = panelStatus(PANEL_2FAM, [
    { laneId: "gpt", contractedProvider: "openai", observedProvider: "openai", fallback: false, alive: true, verdict: "error", hasEvidence: true },
    clean("claude", "claude"),
  ]);
  assert.equal(r.status, STATUS.BLOCKED_INCONCLUSIVE, r.reason);
  assert.equal(r.laneStatus.gpt, "refused-or-malformed");
});
// ── CANARY 5 — malformed verdict (empty) → BLOCKED (T3 vector 2). ──
test("CANARY malformed: a required lane verdict '' → BLOCKED-INCONCLUSIVE", () => {
  const r = panelStatus(PANEL_2FAM, [
    { laneId: "gpt", contractedProvider: "openai", observedProvider: "openai", fallback: false, alive: true, verdict: "", hasEvidence: true },
    clean("claude", "claude"),
  ]);
  assert.equal(r.status, STATUS.BLOCKED_INCONCLUSIVE, r.reason);
});
// ── CANARY 6 — missing-evidence (no ledger record) → BLOCKED (T3 vector 3). ──
test("CANARY missing-evidence: a required lane hasEvidence:false → BLOCKED-INCONCLUSIVE", () => {
  const r = panelStatus(PANEL_2FAM, [
    { laneId: "gpt", contractedProvider: "openai", hasEvidence: false },
    clean("claude", "claude"),
  ]);
  assert.equal(r.status, STATUS.BLOCKED_INCONCLUSIVE, r.reason);
  assert.equal(r.laneStatus.gpt, "missing-evidence");
});
// ── CANARY 7 — loader-failure (T4, DISTINCT path) → BLOCKED at the loader boundary. ──
test("CANARY loader-failure: opts.loaderError → BLOCKED-INCONCLUSIVE (loader path, distinct)", () => {
  const r = panelStatus(PANEL_2FAM, [], { loaderError: true });
  assert.equal(r.status, STATUS.BLOCKED_INCONCLUSIVE, r.reason);
  assert.equal(r.loader, true, "loader path must be flagged distinctly from an evaluator block");
});

// ── a real binding FAIL → FAIL (not blocked — a concrete defect). ──
test("a required lane binding FAIL → FAIL", () => {
  const r = panelStatus(PANEL_2FAM, [
    { laneId: "gpt", contractedProvider: "openai", observedProvider: "openai", fallback: false, alive: true, verdict: "fail", hasEvidence: true },
    clean("claude", "claude"),
  ]);
  assert.equal(r.status, STATUS.FAIL, r.reason);
});

// ── invariant sweep: NO case above ever returned PASS except the two controls. ──
test("INVARIANT: PASS only when every required lane is attested + diverse", () => {
  // A lane on its contracted provider but fallback:true must not pass.
  const r = panelStatus(PANEL_2FAM, [
    { laneId: "gpt", contractedProvider: "openai", observedProvider: "openai", fallback: true, alive: true, verdict: "pass", hasEvidence: true },
    clean("claude", "claude"),
  ]);
  assert.notEqual(r.status, STATUS.PASS, "fallback:true must never count as an attested lane");
});

// ── FAIL-CLOSED on OMISSION (SR-002): a labels-only lane (observedProvider+verdict:pass set, but
//    hasEvidence/alive OMITTED) must BLOCK, not fall through to PASS. This is the exact fail-open the
//    security lane reproduced: undefined liveness/evidence fields were treated as "present". ──
test("SR-002 omitted hasEvidence: a labels-only lane (no hasEvidence) → BLOCKED, not PASS", () => {
  const r = panelStatus(PANEL_2FAM, [
    { laneId: "gpt", contractedProvider: "openai", observedProvider: "openai", fallback: false, alive: true, verdict: "pass" /* hasEvidence OMITTED */ },
    clean("claude", "claude"),
  ]);
  assert.notEqual(r.status, STATUS.PASS, "omitted hasEvidence must never be treated as proof");
  assert.equal(r.status, STATUS.BLOCKED_INCONCLUSIVE, r.reason);
  assert.equal(r.laneStatus.gpt, "missing-evidence");
});
test("SR-002 omitted alive: a lane with evidence but no liveness (alive omitted) → BLOCKED, not PASS", () => {
  const r = panelStatus(PANEL_2FAM, [
    { laneId: "gpt", contractedProvider: "openai", observedProvider: "openai", fallback: false, verdict: "pass", hasEvidence: true /* alive OMITTED */ },
    clean("claude", "claude"),
  ]);
  assert.notEqual(r.status, STATUS.PASS, "omitted alive must never be treated as liveness");
  assert.equal(r.laneStatus.gpt, "dead");
});
test("SR-002 omitted observedProvider: no proof of the contracted lab → coerced/BLOCKED, not PASS", () => {
  const r = panelStatus(PANEL_2FAM, [
    { laneId: "gpt", contractedProvider: "openai", fallback: false, alive: true, verdict: "pass", hasEvidence: true /* observedProvider OMITTED */ },
    clean("claude", "claude"),
  ]);
  assert.notEqual(r.status, STATUS.PASS, "no observed provider = no proof of the contracted lab");
  assert.equal(r.laneStatus.gpt, "coerced");
});

if (failures.length) {
  process.stderr.write(`FAIL [panel-status.test] ${failures.length} failure(s):\n${failures.map((f) => `  - ${f}`).join("\n")}\n`);
  process.exit(1);
}
process.stdout.write(`OK   [panel-status.test] ${passed} passed (canary corpus: kill-lane/agy-down/masquerade/refusal/malformed/missing/loader; never PASS with a lane absent)\n`);
