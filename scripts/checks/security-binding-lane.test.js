#!/usr/bin/env node
"use strict";
// Bite-test for security-binding-lane (SP-20260720-003 D2). Injected deps + ledgerText + files —
// deterministic, no disk (the canonical ledger is absent in a worktree). Covers AC-5 (P1/P2/P3 negatives),
// AC-6 (current-head-green via stubs), AC-7 (ED-230 fail-open matrix 7a-7e), AC-8 (relax), AC-9/10
// (Tooth-B), AC-14 (creep-back), AC-16 (finding names reason + remediation).

const sbl = require("./security-binding-lane");

let passed = 0;
const fail = [];
function ok(cond, label) {
  if (cond) passed += 1;
  else fail.push(label);
}
const hasFinding = (errors, re) => errors.some((e) => re.test(e));

// ── base GOOD deps (all invariants hold) ──────────────────────────────────────────
const GOOD_DEPS = {
  servedModelUnverifiableFromRecord: (p) => p === "antigravity",
  passesOf: (r) => (r === "security-reviewer" ? [{ provider: "antigravity" }, { provider: "openai" }, { provider: "claude" }] : []),
  panel2family: () => ({ binding: false, min_families: 2, lanes: [{ laneId: "gpt", provider: "openai" }, { laneId: "claude", provider: "claude" }] }),
  getProviderForRole: (r) => (r === "redteam" || r === "security-reviewer" ? "antigravity" : "claude"),
  providersRaw: { redteam: "openai" },
  catalogRaw: { redteam: "openai" },
  enforcementDebtPath: "(test)",
};
const LEDGER_OPEN = JSON.stringify({ id: "ED-230", status: "open" });
const clone = (o) => JSON.parse(JSON.stringify(o));
function run(overrides = {}, ledgerText = LEDGER_OPEN, files = {}) {
  const deps = { ...GOOD_DEPS, ...overrides };
  return sbl.evaluateSecurityBindingLane({ deps, ledgerText, files });
}

// ── AC-6 current-head-green (stub) ─────────────────────────────────────────────────
{
  const { errors } = run();
  ok(errors.length === 0, `current-head-green: expected 0 findings, got ${errors.length}: ${errors.join(" | ")}`);
}

// ── AC-5 P1/P2/P3 negatives (ED-230 open) ──────────────────────────────────────────
{
  // P1: stub the choke-point → false (proves the scan CALLS it; injecting a "record" would exercise nothing)
  const { errors } = run({ servedModelUnverifiableFromRecord: () => false });
  ok(hasFinding(errors, /\(P1\)/) && hasFinding(errors, /un-attestable/), `p1-choke-point-stub: ${errors.join(" | ")}`);
  ok(hasFinding(errors, /FIX:/), `finding-names-reason-and-remediation (P1): ${errors.join(" | ")}`);
}
{
  // P2: floor with <2 verifiable families
  const { errors } = run({ panel2family: () => ({ binding: false, min_families: 1, lanes: [{ laneId: "gpt", provider: "openai" }] }) });
  ok(hasFinding(errors, /\(P2\)/), `p2-underfloor: ${errors.join(" | ")}`);
}
{
  // P2b: an agy lane in the required floor set
  const { errors } = run({ panel2family: () => ({ binding: false, min_families: 2, lanes: [{ laneId: "gpt", provider: "openai" }, { laneId: "agy", provider: "antigravity" }] }) });
  ok(hasFinding(errors, /\(P2\)/), `p2-agy-in-floor: ${errors.join(" | ")}`);
}
{
  // P2c: DUPLICATE openai → one distinct family, not two (gauntlet-caught)
  const { errors } = run({ panel2family: () => ({ binding: false, min_families: 2, lanes: [{ laneId: "gpt", provider: "openai" }, { laneId: "gpt2", provider: "openai" }] }) });
  ok(hasFinding(errors, /\(P2\)/), `p2-duplicate-openai: [openai,openai] is one family → RED: ${errors.join(" | ")}`);
}
{
  // P2d: a gemini (non-verifiable) lane in the floor → RED (non-agy but also NOT verifiable)
  const { errors } = run({ panel2family: () => ({ binding: false, min_families: 2, lanes: [{ laneId: "gpt", provider: "openai" }, { laneId: "gem", provider: "gemini" }] }) });
  ok(hasFinding(errors, /\(P2\)/), `p2-gemini-in-floor: a non-verifiable lane → RED: ${errors.join(" | ")}`);
}
{
  // P3: all passes non-verifiable
  const { errors } = run({ passesOf: () => [{ provider: "antigravity" }, { provider: "antigravity" }] });
  ok(hasFinding(errors, /\(P3\)/), `p3-no-verifiable-pass: ${errors.join(" | ")}`);
}

// ── AC-7 ED-230 fail-open matrix (each vector → OPEN/strict). Test ed230IsOpen directly. ──
{
  ok(sbl.ed230IsOpen(JSON.stringify({ id: "ED-230", status: "closed" })).open === true, "7a receiptless-closed → strict");
  ok(sbl.ed230IsOpen('{"id":"ED-230","status":"clos').open === true, "7a-malformed → strict (skip line, no record)");
  ok(
    sbl.ed230IsOpen([JSON.stringify({ id: "ED-230", status: "closed", closure_receipt: "AP-1" }), JSON.stringify({ id: "ED-230", status: "open" })].join("\n")).open === true,
    "7b last-write [closed,…,open] → strict",
  );
  ok(sbl.ed230IsOpen(JSON.stringify({ id: "ED-231", status: "closed", closure_receipt: "x" })).open === true, "7c wrong-id closed → strict");
  ok(sbl.ed230IsOpen(JSON.stringify({ id: "ED-230", status: "closed", closure_receipt: "" })).open === true, "7d empty receipt → strict");
  ok(sbl.ed230IsOpen(JSON.stringify({ id: "ED-230", status: "closed", closure_receipt: null })).open === true, "7d null receipt → strict");
  ok(sbl.ed230IsOpen(JSON.stringify({ id: "ED-999", status: "closed", closure_receipt: "x" })).open === true, "7e no-ED-230-in-nonempty → strict");
  ok(sbl.ed230IsOpen("").open === true, "7e empty file → strict");
  ok(sbl.ed230IsOpen(undefined).open === true, "7e missing/undefined → strict");
  // 7f spoofable receipt TYPES (non-string truthy must NOT relax): {}, [], true, 0
  ok(sbl.ed230IsOpen(JSON.stringify({ id: "ED-230", status: "closed", closure_receipt: {} })).open === true, "7f object receipt → strict");
  ok(sbl.ed230IsOpen(JSON.stringify({ id: "ED-230", status: "closed", closure_receipt: [] })).open === true, "7f array receipt → strict");
  ok(sbl.ed230IsOpen(JSON.stringify({ id: "ED-230", status: "closed", closure_receipt: true })).open === true, "7f boolean receipt → strict");
  ok(sbl.ed230IsOpen(JSON.stringify({ id: "ED-230", status: "closed", closed_ts: 0 })).open === true, "7f zero closed_ts → strict");
  // 7g a valid closed record FOLLOWED by a malformed line → the corruption forces strict (not left-effective)
  ok(sbl.ed230IsOpen([JSON.stringify({ id: "ED-230", status: "closed", closure_receipt: "AP-1" }), "{malformed"].join("\n")).open === true, "7g closed-then-malformed → strict (fail-closed on corruption)");
}

// ── AC-8 relax: valid closed + receipt → open:false, and Tooth-A NOT enforced ──────
{
  const LEDGER_CLOSED = JSON.stringify({ id: "ED-230", status: "closed", closure_receipt: "AP-230-2026-07" });
  ok(sbl.ed230IsOpen(LEDGER_CLOSED).open === false, "ed230-closed-with-receipt → relaxed");
  // Tooth-A skipped when relaxed: even a BAD P1 produces no P1 finding
  const { errors } = run({ servedModelUnverifiableFromRecord: () => false }, LEDGER_CLOSED);
  ok(!hasFinding(errors, /\(P1\)/), `relax skips Tooth-A: unexpected P1 finding: ${errors.join(" | ")}`);
}

// ── AC-9 Tooth-B raw-map disagreement (two independent maps) ───────────────────────
{
  const { errors } = run({ catalogRaw: { redteam: "openai" }, providersRaw: { redteam: "antigravity" } });
  ok(hasFinding(errors, /RI-008\.1/), `alias-raw-two-maps disagree → RED: ${errors.join(" | ")}`);
  const { errors: e2 } = run({ catalogRaw: { redteam: "openai" }, providersRaw: { redteam: "openai" } });
  ok(!hasFinding(e2, /RI-008\.1/), `alias-raw agree → no finding`);
}

// ── AC-10 Tooth-B normalization divergence (stubbed) ───────────────────────────────
{
  const { errors } = run({ getProviderForRole: (r) => (r === "redteam" ? "antigravity" : "openai") });
  ok(hasFinding(errors, /RI-008\.2/), `alias-normalization-stubbed-divergence → RED: ${errors.join(" | ")}`);
}

// ── AC-14 creep-back (injected files) — the DYNAMIC spawn-array pattern (gauntlet-caught) ───────────
{
  // A LITERAL single-pass call (the old form) — the spawn-array signal requires dispatch-agent.js inside
  // an array literal, so express the planted caller as delta does: a spawn args array + a ROLES list.
  const dynamicCaller =
    'const ROLES = ["qa-reviewer", "security-reviewer"];\n' +
    'for (const role of ROLES) spawn("node", [path.join(ROOT, "scripts", "dispatch-agent.js"), role, prompt]);';
  const { errors } = run({}, LEDGER_OPEN, { "scripts/evil.js": dynamicCaller });
  ok(hasFinding(errors, /SINGLE-PASS CREEP-BACK/) && hasFinding(errors, /scripts\/evil\.js/), `no-nontest-single-pass-binding-caller (dynamic spawn-array) → RED: ${errors.join(" | ")}`);
  // clean tree → no finding
  const { errors: clean } = run({}, LEDGER_OPEN, {});
  ok(!hasFinding(clean, /SINGLE-PASS CREEP-BACK/), `no caller → no creep-back finding`);
  // prose/require mention (NOT a spawn-array) must NOT flag (the co-occurrence over-flag qa caught)
  const prose = { "scripts/doc.js": '// dispatch-agent serves the "security-reviewer" default\nrequire("../dispatch-agent");' };
  const { errors: proseE } = run({}, LEDGER_OPEN, prose);
  ok(!hasFinding(proseE, /SINGLE-PASS CREEP-BACK/), `prose/require mention must NOT flag: ${proseE.join(" | ")}`);
  // an ALLOWLISTED caller (delta) is documented-safe → not flagged even with the pattern
  const allowKey = Object.keys(sbl.CREEP_BACK_ALLOWLIST)[0];
  const { errors: allowE } = run({}, LEDGER_OPEN, { [allowKey]: dynamicCaller });
  ok(!hasFinding(allowE, /SINGLE-PASS CREEP-BACK/), `allowlisted caller (${allowKey}) → not flagged (documented-safe)`);
}

// ── report ──────────────────────────────────────────────────────────────────────────
if (fail.length) {
  process.stderr.write(`security-binding-lane.test: ${passed} passed, ${fail.length} FAILED:\n${fail.map((f) => "  ✗ " + f).join("\n")}\n`);
  process.exit(1);
}
process.stdout.write(`security-binding-lane.test: ${passed}/${passed} passed\n`);
