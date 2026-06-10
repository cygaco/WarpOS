#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// spend-ledger.test.js — S-LC-07 WORK §1. The spend ledger + ceiling layering.
//
//   The CEILING is source-vs-instance (P-058):
//     - runtime override present (this session $500) → use it.
//     - absent / invalid → framework DEFAULT $100 (NOT a hardcoded $500).
//   The ledger is REPORT-ONLY: budget-approach warnings never block.
//   Fail-open: a malformed/absent completions file → $0 spend, no crash.
//
// All cases inject completions/auth via the test seam (no canonical reads).
// ─────────────────────────────────────────────────────────────────────────────
"use strict";

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..", "..");
const ledger = require(path.join(ROOT, "scripts", "turbo", "spend-ledger.js"));

let pass = 0;
let fail = 0;
function ok(name, fn) {
  try {
    fn();
    pass++;
    console.log(`  ok  ${name}`);
  } catch (e) {
    fail++;
    console.log(`FAIL  ${name}\n      ${e.stack || e.message}`);
  }
}

function tmpCompletions(records) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "slc07-ledger-"));
  const file = path.join(dir, "dispatch-completions.jsonl");
  fs.writeFileSync(file, records.map((r) => (typeof r === "string" ? r : JSON.stringify(r))).join("\n") + "\n");
  return file;
}

// A metered (paid) cross-provider completion record with controllable bytes.
function paidRecord({ provider = "openai", model = "gpt-5.5", promptBytes = 0, stdoutBytes = 0, exitCode = 0, completedAt } = {}) {
  return {
    dispatch_id: "d-" + Math.random().toString(36).slice(2),
    role: "reviewer",
    provider,
    model,
    prompt_bytes: promptBytes,
    stdout_bytes: stdoutBytes,
    exit_code: exitCode,
    ok: exitCode === 0,
    completed_at: completedAt || new Date().toISOString(),
  };
}

// ── resolveCeiling: the source-vs-instance core ──────────────────────────────
ok("resolveCeiling reads the runtime override ($500) when present", () => {
  const r = ledger.resolveCeiling({ spend_ceiling_usd: 500 });
  assert.strictEqual(r.ceilingUsd, 500);
  assert.strictEqual(r.source, "runtime-override");
});

ok("resolveCeiling falls back to the framework default ($100) when no auth", () => {
  const r = ledger.resolveCeiling(null);
  assert.strictEqual(r.ceilingUsd, 100);
  assert.strictEqual(r.source, "framework-default");
  // Belt: the framework default constant is $100, NOT a hardcoded $500.
  assert.strictEqual(ledger.FRAMEWORK_DEFAULT_CEILING_USD, 100);
});

ok("resolveCeiling ignores an invalid/zero/negative override → framework default", () => {
  for (const bad of [{ spend_ceiling_usd: 0 }, { spend_ceiling_usd: -5 }, { spend_ceiling_usd: "500" }, { spend_ceiling_usd: NaN }, {}]) {
    const r = ledger.resolveCeiling(bad);
    assert.strictEqual(r.ceilingUsd, 100, `bad override ${JSON.stringify(bad)} should fall back to $100`);
    assert.strictEqual(r.source, "framework-default");
  }
});

// ── computeLedger: ceiling reads override else default ───────────────────────
ok("computeLedger uses the $500 runtime override (NOT hardcoded)", () => {
  const file = tmpCompletions([paidRecord({ stdoutBytes: 4000 })]);
  const led = ledger.computeLedger({ completionsFile: file, authOverride: { spend_ceiling_usd: 500 } });
  assert.strictEqual(led.ceilingUsd, 500);
  assert.strictEqual(led.ceilingSource, "runtime-override");
  assert.strictEqual(led.reportOnly, true);
});

ok("computeLedger uses the $100 framework default when no override granted", () => {
  const file = tmpCompletions([paidRecord({ stdoutBytes: 4000 })]);
  // HERMETIC (claude 2nd-pass 2026-06-10, MAJOR): authOverride:null falls through
  // to reading the LIVE authorization.json — the test flapped whenever a turbo
  // session raised the ceiling. Point authFile at a non-existent path so the
  // framework default is exercised regardless of live session state.
  const led = ledger.computeLedger({
    completionsFile: file,
    authFile: file + ".no-such-auth.json",
    authOverride: null,
  });
  assert.strictEqual(led.ceilingUsd, 100);
  assert.strictEqual(led.ceilingSource, "framework-default");
});

// ── budget-approach warning is REPORT-ONLY ───────────────────────────────────
ok("budget-approach warning fires ≥80% and is report-only (no blocking)", () => {
  // gpt-5.5 output @ $10/M tokens, 4 bytes/token → 340000 bytes ≈ 85000 tok ≈ $0.85.
  const file = tmpCompletions([paidRecord({ promptBytes: 4000, stdoutBytes: 340000 })]);
  const led = ledger.computeLedger({ completionsFile: file, authOverride: { spend_ceiling_usd: 1 } });
  assert.ok(led.pct >= 0.8 && led.pct < 1.0, `pct should be ~0.85, got ${led.pct}`);
  assert.ok(led.warnings.length >= 1, "a budget-approach warning is present");
  assert.ok(/report-only/i.test(led.warnings[0]), "warning is labeled report-only");
  assert.strictEqual(led.reportOnly, true);
  assert.strictEqual(led.overCeiling, false);
  // Report-only contract: the ledger object exposes NO blocking exit signal.
  assert.ok(!("exitCode" in led), "ledger must not carry a blocking exit code");
});

ok("over-ceiling is reported (report-only) — still does not block", () => {
  const file = tmpCompletions([paidRecord({ stdoutBytes: 500000 })]); // ~$1.25 > $1
  const led = ledger.computeLedger({ completionsFile: file, authOverride: { spend_ceiling_usd: 1 } });
  assert.strictEqual(led.overCeiling, true);
  assert.ok(/OVER CEILING \(report-only\)/i.test(led.warnings.join(" ")));
  assert.strictEqual(led.reportOnly, true);
});

ok("under-budget emits a notice, no warning", () => {
  const file = tmpCompletions([paidRecord({ stdoutBytes: 4000 })]); // ~$0.01 of $100
  const led = ledger.computeLedger({ completionsFile: file, authOverride: null });
  assert.strictEqual(led.warnings.length, 0);
  assert.ok(led.notices.some((n) => /under budget/i.test(n)));
});

// ── only PAID cross-provider calls count ─────────────────────────────────────
ok("claude (subscription) records are NOT metered", () => {
  const file = tmpCompletions([
    paidRecord({ provider: "claude", model: "sonnet", stdoutBytes: 1000000 }),
    paidRecord({ provider: "openai", stdoutBytes: 4000 }),
  ]);
  const led = ledger.computeLedger({ completionsFile: file, authOverride: null });
  assert.strictEqual(led.calls, 1, "only the openai call is metered");
  assert.ok(!led.byProvider.claude, "claude must not appear in the ledger");
});

ok("failed (non-zero exit) paid calls are not charged", () => {
  const file = tmpCompletions([paidRecord({ provider: "gemini", stdoutBytes: 4000, exitCode: 1 })]);
  const led = ledger.computeLedger({ completionsFile: file, authOverride: null });
  assert.strictEqual(led.calls, 0);
  assert.strictEqual(led.spentUsd, 0);
});

// ── session scoping by granted_at ────────────────────────────────────────────
ok("records before granted_at are excluded from the session ledger", () => {
  const past = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
  const file = tmpCompletions([
    paidRecord({ provider: "openai", stdoutBytes: 400000, completedAt: past }),
  ]);
  const led = ledger.computeLedger({
    completionsFile: file,
    authOverride: { spend_ceiling_usd: 500, granted_at: new Date().toISOString() },
  });
  assert.strictEqual(led.calls, 0, "the pre-session call is excluded");
  assert.strictEqual(led.spentUsd, 0);
});

// ── FAIL-OPEN ────────────────────────────────────────────────────────────────
ok("fail-open: a malformed completions line is skipped, never crashes", () => {
  const file = tmpCompletions([
    "{ this is not json",
    paidRecord({ provider: "openai", stdoutBytes: 4000 }),
    "}{",
  ]);
  const led = ledger.computeLedger({ completionsFile: file, authOverride: null });
  assert.strictEqual(led.calls, 1, "the one valid record still counts; junk skipped");
  assert.ok(!led.error, "valid-with-junk is not an error");
});

ok("fail-open: a missing completions file → $0 spend, no warnings, no crash", () => {
  const led = ledger.computeLedger({
    completionsFile: path.join(os.tmpdir(), "does-not-exist-" + Date.now() + ".jsonl"),
    authOverride: null,
  });
  assert.strictEqual(led.spentUsd, 0);
  assert.strictEqual(led.calls, 0);
  assert.strictEqual(led.reportOnly, true);
});

// ── SPOOF RESISTANCE (S-LC-07 BLOCKERS 1 & 2 — qa-reviewer integrity scope) ───
// The ledger is the enforcement mechanism for the spend ceiling. If a crafted
// completion record can drive the running total to NaN (B1) or push it DOWN
// (B2), `spent >= ceiling` silently never trips and the limit is meaningless.

ok("BLOCKER 1: prototype-key models price via _default — usd FINITE, not NaN", () => {
  // Baseline: a genuinely-unknown model resolves to _default pricing.
  const baseline = ledger.estimateRecordCost({
    provider: "gemini", model: "totally-unknown-model-xyz",
    prompt_bytes: 1000, stdout_bytes: 1000, exit_code: 0,
  });
  assert.ok(baseline && Number.isFinite(baseline.usd), "baseline _default cost is finite");
  // Each of these would resolve to a truthy native member of the prototype chain
  // (Object.constructor, .hasOwnProperty, .toString, .valueOf, the [[Prototype]]),
  // skip the `|| _default` fallback, and read undefined.inUsdPerM → NaN pre-fix.
  for (const model of ["constructor", "hasOwnProperty", "__proto__", "toString", "valueOf"]) {
    const cost = ledger.estimateRecordCost({
      provider: "gemini", model, prompt_bytes: 1000, stdout_bytes: 1000, exit_code: 0,
    });
    assert.ok(cost, `model:${model} still produces a record`);
    assert.ok(Number.isFinite(cost.usd), `model:${model} → usd must be finite, got ${cost.usd}`);
    assert.ok(!Number.isNaN(cost.usd), `model:${model} → usd must not be NaN`);
    assert.strictEqual(cost.usd, baseline.usd, `model:${model} must use _default pricing`);
  }
});

ok("BLOCKER 2: negative byte counts clamp to 0 — usd >= 0, never subtracts", () => {
  const cost = ledger.estimateRecordCost({
    provider: "gemini", model: "gpt-5",
    prompt_bytes: -1000000, stdout_bytes: -1000000, exit_code: 0,
  });
  assert.ok(cost, "record still produced");
  assert.strictEqual(cost.inBytes, 0, "negative prompt_bytes clamps to 0");
  assert.strictEqual(cost.outBytes, 0, "negative stdout_bytes clamps to 0");
  assert.ok(cost.usd >= 0, `usd must be >= 0, got ${cost.usd}`);
  assert.ok(Number.isFinite(cost.usd), "usd is finite");
  // Mixed: a negative side clamps while the valid side still prices normally.
  const half = ledger.estimateRecordCost({
    provider: "gemini", model: "gpt-5",
    prompt_bytes: -5, stdout_bytes: 4000, exit_code: 0,
  });
  assert.strictEqual(half.inBytes, 0, "negative prompt clamps even when stdout is valid");
  assert.ok(half.outBytes === 4000 && half.usd > 0, "the valid side still prices normally");
});

ok("BLOCKER 2: NaN / Infinity / non-numeric bytes clamp to 0 (no Infinity, no NaN)", () => {
  for (const bad of [Infinity, -Infinity, NaN, "abc", null, undefined]) {
    const cost = ledger.estimateRecordCost({
      provider: "gemini", model: "gpt-5",
      prompt_bytes: bad, stdout_bytes: bad, exit_code: 0,
    });
    assert.strictEqual(cost.inBytes, 0, `prompt_bytes=${String(bad)} → 0`);
    assert.strictEqual(cost.outBytes, 0, `stdout_bytes=${String(bad)} → 0`);
    assert.ok(Number.isFinite(cost.usd) && cost.usd === 0, `usd finite 0 for ${String(bad)}`);
  }
});

// ── BLOCKER 3: exit_code type-spoof → unmetered → under-report ────────────────
// `"0" !== 0` is true, so a strict `!== 0` skip lets a crafted STRING "0" spoof a
// real success into an UNMETERED skip → spend under-reported → ceiling silently
// exceeded. A naive `Number(ec) !== 0` fixes the string-0 case but re-opens it for
// garbage (`Number("abc")` → NaN, `NaN !== 0` true). A spend ledger must NEVER
// UNDER-report: meter unless the exit_code parses to a finite, non-zero number.

ok('BLOCKER 3: exit_code:"0" (STRING success) is METERED — not spoofed into a skip', () => {
  const cost = ledger.estimateRecordCost({
    provider: "gemini", model: "gemini-3.1-pro-preview",
    prompt_bytes: 1000, stdout_bytes: 1000, exit_code: "0",
  });
  assert.ok(cost, 'exit_code:"0" (string success) must produce a metered record, not null');
  assert.ok(cost.usd > 0, `metered usd must be > 0, got ${cost && cost.usd}`);
});

ok('BLOCKER 3: a garbage exit_code ("abc", unparseable) is METERED — no under-report', () => {
  const cost = ledger.estimateRecordCost({
    provider: "gemini", model: "gemini-3.1-pro-preview",
    prompt_bytes: 1000, stdout_bytes: 1000, exit_code: "abc",
  });
  assert.ok(cost, 'a present-but-unparseable exit_code (Number("abc")=NaN) must NOT skip metering');
  assert.ok(cost.usd > 0, `garbage-exit_code spend must still be counted, got ${cost && cost.usd}`);
});

ok("BLOCKER 3: a real numeric non-zero exit_code (1) stays NO-CHARGE (failure preserved)", () => {
  const cost = ledger.estimateRecordCost({
    provider: "gemini", model: "gemini-3.1-pro-preview",
    prompt_bytes: 1000, stdout_bytes: 1000, exit_code: 1,
  });
  assert.strictEqual(cost, null, "a genuine non-zero exit_code is still treated as a failed, no-charge call");
});

ok("BLOCKER 3: an absent exit_code is METERED (preserved)", () => {
  const cost = ledger.estimateRecordCost({
    provider: "gemini", model: "gemini-3.1-pro-preview",
    prompt_bytes: 1000, stdout_bytes: 1000, // no exit_code field at all
  });
  assert.ok(cost && cost.usd > 0, "an absent exit_code must be metered exactly as before");
});

ok('BLOCKER 3 (ledger level): a crafted exit_code:"0" record does NOT under-report the total', () => {
  const numeric = tmpCompletions([paidRecord({ provider: "gemini", model: "gpt-5", stdoutBytes: 4000, exitCode: 0 })]);
  const spoofed = tmpCompletions([paidRecord({ provider: "gemini", model: "gpt-5", stdoutBytes: 4000, exitCode: "0" })]);
  const numLed = ledger.computeLedger({ completionsFile: numeric, authOverride: { spend_ceiling_usd: 500 } });
  const spoofLed = ledger.computeLedger({ completionsFile: spoofed, authOverride: { spend_ceiling_usd: 500 } });
  assert.strictEqual(spoofLed.calls, 1, 'the "0"-string record is counted as a real metered call');
  assert.strictEqual(spoofLed.spentUsd, numLed.spentUsd, "the string-0 total must EQUAL the numeric-0 total — no under-report");
  assert.ok(spoofLed.spentUsd > 0, "spend is actually metered");
});

ok("happy path intact: a real model with positive bytes prices exactly as before", () => {
  const price = ledger.PRICE_TABLE["gemini-3.1-pro-preview"];
  const inTok = 4000 / 4, outTok = 4000 / 4; // BYTES_PER_TOKEN = 4
  const expectedRaw = (inTok / 1e6) * price.inUsdPerM + (outTok / 1e6) * price.outUsdPerM;
  const expected = Math.round(expectedRaw * 10000) / 10000; // matches internal round4
  const cost = ledger.estimateRecordCost({
    provider: "gemini", model: "gemini-3.1-pro-preview",
    prompt_bytes: 4000, stdout_bytes: 4000, exit_code: 0,
  });
  assert.strictEqual(cost.inBytes, 4000);
  assert.strictEqual(cost.outBytes, 4000);
  assert.strictEqual(cost.usd, expected, `usd must equal the documented price ${expected}`);
  assert.ok(cost.usd > 0);
});

ok("LEDGER total stays finite + monotonic + ceiling trips with a poisoned record", () => {
  const clean = tmpCompletions([paidRecord({ provider: "gemini", model: "gpt-5", stdoutBytes: 4000 })]);
  const cleanLed = ledger.computeLedger({ completionsFile: clean, authOverride: { spend_ceiling_usd: 500 } });
  assert.ok(Number.isFinite(cleanLed.spentUsd), "clean total is finite");

  const poisoned = tmpCompletions([
    paidRecord({ provider: "gemini", model: "gpt-5", stdoutBytes: 4000 }),
    paidRecord({ provider: "gemini", model: "constructor", promptBytes: 1000, stdoutBytes: 1000 }), // B1 NaN attempt
    paidRecord({ provider: "gemini", model: "gpt-5", promptBytes: -1000000, stdoutBytes: -1000000 }), // B2 subtract attempt
  ]);
  const poisonedLed = ledger.computeLedger({ completionsFile: poisoned, authOverride: { spend_ceiling_usd: 500 } });
  assert.ok(Number.isFinite(poisonedLed.spentUsd), `total must stay finite, got ${poisonedLed.spentUsd}`);
  assert.ok(!Number.isNaN(poisonedLed.spentUsd), "total must not be NaN");
  // Monotonic: poisoned records add a non-negative amount; they never push the
  // total BELOW the clean baseline (which would silently defeat `spent >= ceiling`).
  assert.ok(poisonedLed.spentUsd >= cleanLed.spentUsd, `poisoned ${poisonedLed.spentUsd} must be >= clean ${cleanLed.spentUsd}`);
  // The ceiling comparison still functions — over a tiny ceiling, overCeiling trips
  // (a NaN total would make `>=` return false, the exact bypass we are closing).
  const overLed = ledger.computeLedger({ completionsFile: poisoned, authOverride: { spend_ceiling_usd: 0.0001 } });
  assert.strictEqual(overLed.overCeiling, true, "a finite total still trips the ceiling — bypass closed");
});

console.log(`\nS-LC-07 spend-ledger: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
