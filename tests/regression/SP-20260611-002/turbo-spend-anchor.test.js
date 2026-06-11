#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// turbo-spend-anchor.test.js — SP-20260611-002 WS-G2, R-3 / AC-3.3 + AC-3.4.
//
//   AC-3.3: the spend window anchors to a persisted SESSION START
//           (`session_started_at`), NOT granted_at (which a re-apply resets), so
//           prior same-session paid calls STAY counted across a mid-session
//           re-apply. Falls back to granted_at for legacy auth (back-compat).
//   AC-3.4: a NONFINITE/overflow byte count (1e400→Infinity, NaN) fails HIGH —
//           a suspect-record notice (event + stderr) — not a silent $0 skip. A
//           huge FINITE count still over-reports (the safe direction).
//
// All cases inject completions/auth via the test seam — no canonical reads,
// no live auth.json.
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
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sp002-anchor-"));
  const file = path.join(dir, "dispatch-completions.jsonl");
  fs.writeFileSync(
    file,
    records.map((r) => (typeof r === "string" ? r : JSON.stringify(r))).join("\n") + "\n",
  );
  return file;
}

function paidRecord({ provider = "openai", model = "gpt-5.5", promptBytes = 0, stdoutBytes = 0, exitCode = 0, completedAt } = {}) {
  return {
    dispatch_id: "d-" + Math.random().toString(36).slice(2),
    provider, model,
    prompt_bytes: promptBytes,
    stdout_bytes: stdoutBytes,
    exit_code: exitCode,
    completed_at: completedAt || new Date().toISOString(),
  };
}

// ── AC-3.3: session anchor survives a re-apply ───────────────────────────────
ok("AC-3.3: a paid call made AFTER session start but BEFORE a re-grant stays counted", () => {
  // Timeline: session starts 3h ago, a paid call lands 2h ago, then the operator
  // re-applies NOW (granted_at = now). Anchoring to granted_at would DROP the
  // 2h-ago call; anchoring to session_started_at keeps it.
  const sessionStart = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
  const paidCallAt = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
  const file = tmpCompletions([paidRecord({ stdoutBytes: 400000, completedAt: paidCallAt })]);

  const led = ledger.computeLedger({
    completionsFile: file,
    authOverride: {
      spend_ceiling_usd: 500,
      session_started_at: sessionStart,
      granted_at: new Date().toISOString(), // re-grant reset granted_at to now
    },
  });
  assert.strictEqual(led.calls, 1, "the prior same-session paid call STAYS counted");
  assert.ok(led.spentUsd > 0, "its spend is included");
  assert.strictEqual(led.sinceIso, sessionStart, "the window anchors to session_started_at, not granted_at");
});

ok("AC-3.3 (regression of the bug): the SAME call would be DROPPED if anchored to granted_at", () => {
  // Demonstrate the difference: with NO session anchor (legacy auth), the window
  // falls back to granted_at and the 2h-ago call is correctly counted only because
  // granted_at is old. With a fresh granted_at and a session anchor, it's counted
  // via the anchor — proving the anchor (not granted_at) is what saves it.
  const paidCallAt = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
  const file = tmpCompletions([paidRecord({ stdoutBytes: 400000, completedAt: paidCallAt })]);

  // Anchor preserved old + granted_at reset to now → counted (anchor wins).
  const withAnchor = ledger.computeLedger({
    completionsFile: file,
    authOverride: {
      spend_ceiling_usd: 500,
      session_started_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      granted_at: new Date().toISOString(),
    },
  });
  assert.strictEqual(withAnchor.calls, 1, "anchor preserves the prior call");

  // Legacy auth (no anchor) with a fresh granted_at → the call WOULD be dropped.
  // This is the exact pre-fix bug; the anchor is what closes it.
  const noAnchorFreshGrant = ledger.computeLedger({
    completionsFile: file,
    authOverride: {
      spend_ceiling_usd: 500,
      granted_at: new Date().toISOString(), // no session_started_at
    },
  });
  assert.strictEqual(noAnchorFreshGrant.calls, 0, "without an anchor + fresh granted_at the call is dropped — the bug the anchor fixes");
});

ok("AC-3.3 (back-compat): legacy auth lacking session_started_at falls back to granted_at", () => {
  const past = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
  const file = tmpCompletions([paidRecord({ stdoutBytes: 4000, completedAt: new Date().toISOString() })]);
  const led = ledger.computeLedger({
    completionsFile: file,
    authOverride: { spend_ceiling_usd: 100, granted_at: past }, // legacy: no anchor
  });
  // granted_at is the fallback window; the now-record is after it → counted.
  assert.strictEqual(led.calls, 1);
  assert.strictEqual(led.sinceIso, past, "legacy auth uses granted_at as the window (no crash, no lockout)");
});

// ── AC-3.4: nonfinite / overflow bytes fail HIGH ─────────────────────────────
ok("AC-3.4: an overflow byte count (1e400 → Infinity via JSON) is flagged SUSPECT, not silent $0", () => {
  // 1e400 in JSON parses to Infinity. Pre-fix it silently clamped to 0 (= $0
  // contribution, a silent under-report). Now it must surface as a suspect record.
  const file = tmpCompletions([
    '{"dispatch_id":"d-overflow","provider":"openai","model":"gpt-5.5","prompt_bytes":1e400,"stdout_bytes":1e400,"exit_code":0,"completed_at":"' + new Date().toISOString() + '"}',
  ]);
  const led = ledger.computeLedger({ completionsFile: file, authOverride: null });
  assert.ok(Array.isArray(led.suspectRecords) && led.suspectRecords.length === 1, "the overflow record is flagged suspect");
  assert.ok(led.warnings.some((w) => /SUSPECT RECORD/i.test(w)), "a fail-HIGH warning is emitted");
  assert.ok(/fail-high/i.test(led.warnings.join(" ")), "the warning is labeled fail-high, not a silent skip");
});

ok("AC-3.4: an explicit NaN byte count is flagged SUSPECT", () => {
  // NaN can't be JSON-literal'd, but a record can carry a non-numeric that coerces
  // to NaN (e.g. an object / garbage) — that present-but-nonfinite value is suspect.
  const cost = ledger.estimateRecordCost({
    provider: "openai", model: "gpt-5.5",
    prompt_bytes: {}, stdout_bytes: "not-a-number", exit_code: 0,
  });
  assert.ok(cost, "record still produces a cost object");
  assert.strictEqual(cost.suspect, true, "a present nonfinite byte count is suspect");
  assert.strictEqual(cost.inBytes, 0, "still clamps to 0 (cannot meter it)");
  assert.strictEqual(cost.outBytes, 0);
});

ok("AC-3.4: an ABSENT byte field is NOT suspect (normal $0, no false alarm)", () => {
  const cost = ledger.estimateRecordCost({
    provider: "openai", model: "gpt-5.5", exit_code: 0, // no prompt_bytes / stdout_bytes
  });
  assert.strictEqual(cost.suspect, false, "absent fields are normal, not suspect");
  assert.strictEqual(cost.inBytes, 0);
});

ok("AC-3.4: a huge FINITE byte count is NOT suspect — it over-reports (safe direction)", () => {
  const cost = ledger.estimateRecordCost({
    provider: "openai", model: "gpt-5.5",
    prompt_bytes: 1e12, stdout_bytes: 1e12, exit_code: 0,
  });
  assert.strictEqual(cost.suspect, false, "a huge but finite count is legitimate");
  assert.ok(cost.usd > 0 && Number.isFinite(cost.usd), "it over-reports a real, finite spend");
  assert.strictEqual(cost.inBytes, 1e12, "the finite count passes through unchanged");
});

ok("AC-3.4: a negative byte count is flagged SUSPECT (it would have subtracted spend)", () => {
  const cost = ledger.estimateRecordCost({
    provider: "openai", model: "gpt-5.5",
    prompt_bytes: -1000000, stdout_bytes: 4000, exit_code: 0,
  });
  assert.strictEqual(cost.suspect, true, "a negative count is suspect (under-report attempt)");
  assert.strictEqual(cost.inBytes, 0, "negative clamps to 0");
  assert.strictEqual(cost.outBytes, 4000, "the valid side still meters");
});

ok("AC-3.4: ledger total stays finite + a clean record alongside a suspect one still meters", () => {
  const file = tmpCompletions([
    paidRecord({ provider: "openai", model: "gpt-5.5", stdoutBytes: 4000 }),
    '{"dispatch_id":"d-bad","provider":"openai","model":"gpt-5.5","prompt_bytes":1e400,"stdout_bytes":1e400,"exit_code":0,"completed_at":"' + new Date().toISOString() + '"}',
  ]);
  const led = ledger.computeLedger({ completionsFile: file, authOverride: { spend_ceiling_usd: 500 } });
  assert.ok(Number.isFinite(led.spentUsd), "total stays finite despite the overflow record");
  assert.ok(led.spentUsd > 0, "the clean record still meters");
  assert.strictEqual(led.suspectRecords.length, 1, "the overflow record is flagged, not silently swallowed");
});

console.log(`\nSP-20260611-002 turbo-spend-anchor: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
