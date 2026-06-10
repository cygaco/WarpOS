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
  const led = ledger.computeLedger({ completionsFile: file, authOverride: null });
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

console.log(`\nS-LC-07 spend-ledger: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
