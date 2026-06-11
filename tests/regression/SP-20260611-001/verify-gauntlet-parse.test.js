#!/usr/bin/env node
"use strict";

/**
 * verify-gauntlet-parse.test.js — regression for SP-20260611-001 Fix 6 (T-315, R-6):
 * verifyGauntlet programmatic parse refusal.
 *
 * Exploit (gemini crossfam finding §B.6): the unparseable-window guard lived ONLY in
 * the CLI. A PROGRAMMATIC caller of verifyGauntlet({ since: "garbage" }) had its bound
 * silently degrade to null inside toMs() → no window → the forbidden whole-ledger scan
 * (a historic ok:true record can then green a never-ran lane).
 *
 * Fix: move the parse-validity refusal INTO verifyGauntlet — a PROVIDED but unparseable
 * since/until THROWS a self-identifying error (names the offending value, the reason
 * "whole-ledger scan is forbidden", and the recovery). Absent/undefined bounds keep the
 * existing whole-ledger semantics. The CLI keeps its own existing message (it pre-checks
 * and exits 2 before ever calling the library).
 */

const assert = require("assert");
const cp = require("child_process");
const path = require("path");
const { verifyGauntlet } = require("../../../scripts/dispatch/gauntlet-verify");

const CLI = path.join(__dirname, "..", "..", "..", "scripts", "dispatch", "gauntlet-verify.js");

let passed = 0;
const failures = [];
function test(name, fn) {
  try {
    fn();
    passed++;
  } catch (e) {
    failures.push(`${name}: ${e && e.message ? e.message : e}`);
  }
}

// ── AC-6.1 — garbage window throws, never whole-ledger scans ──────────────────

test("garbage-window-throws-not-whole-ledger", () => {
  // since garbage → throws (and the message names the offending input + the reason).
  assert.throws(
    () => verifyGauntlet({ runId: "R", roles: ["reviewer"], since: "garbage", records: [] }),
    (err) => {
      assert.ok(/unparseable window/i.test(err.message), `message must name the failure mode: ${err.message}`);
      assert.ok(/since/.test(err.message), `message must name the offending bound (since): ${err.message}`);
      assert.ok(/whole-ledger scan is forbidden/i.test(err.message), `message must state the reason: ${err.message}`);
      assert.ok(/ISO|epoch/i.test(err.message), `message must state the recovery: ${err.message}`);
      return true;
    },
    "verifyGauntlet must THROW on a provided-but-unparseable since (not silently whole-ledger scan)",
  );

  // until garbage → throws too.
  assert.throws(
    () => verifyGauntlet({ runId: "R", roles: ["reviewer"], until: "definitely!!unparseable", records: [] }),
    (err) => /unparseable window/i.test(err.message) && /until/.test(err.message),
    "verifyGauntlet must THROW on a provided-but-unparseable until",
  );

  // Defense-in-depth: a garbage since must NOT silently fall through to a whole-ledger
  // scan that greens a role from a historic record. The throw is the only acceptable
  // outcome — assert it does NOT return an ok result.
  let returnedOk = false;
  try {
    const r = verifyGauntlet({
      runId: "R",
      roles: ["reviewer"],
      since: "garbage",
      // a historic ok:true record that WOULD green via a whole-ledger scan:
      records: [{ role: "reviewer", ok: true, provider: "openai", completed_at: "2020-01-01T00:00:00.000Z" }],
    });
    returnedOk = r.ok === true;
  } catch {
    // expected
  }
  assert.strictEqual(returnedOk, false, "garbage since must never green a role via a silent whole-ledger scan");
});

// ── AC-6.2 — CLI behavior preserved (existing message, no regression) ─────────

test("cli-behavior-preserved", () => {
  // Bad --since via the CLI: exits non-zero with the EXISTING CLI message (the CLI
  // pre-checks and refuses before calling the library, so its message is unchanged).
  const r = cp.spawnSync(process.execPath, [CLI, "--roles", "reviewer", "--since", "not-a-date"], { encoding: "utf8" });
  assert.strictEqual(r.status, 2, `CLI bad --since should exit 2 (existing behavior), got ${r.status}; stderr=${r.stderr}`);
  assert.ok(
    /not a parseable timestamp/i.test(r.stderr),
    `CLI must keep its existing parseability-refusal message, got: ${r.stderr}`,
  );

  // Bad --until likewise exits 2.
  const r2 = cp.spawnSync(process.execPath, [CLI, "--roles", "reviewer", "--until", "definitely!!unparseable"], { encoding: "utf8" });
  assert.strictEqual(r2.status, 2, `CLI bad --until should exit 2, got ${r2.status}; stderr=${r2.stderr}`);
});

// ── Valid + omitted windows behave exactly as before (no over-refusal) ────────

test("valid-and-omitted-windows-unaffected", () => {
  // A valid ISO since does NOT throw.
  assert.doesNotThrow(
    () => verifyGauntlet({ runId: "R", roles: ["reviewer"], since: "2026-06-10T00:00:00.000Z", records: [] }),
    "a valid ISO since must NOT throw",
  );
  // A valid epoch-ms since (string of digits) does NOT throw.
  assert.doesNotThrow(
    () => verifyGauntlet({ runId: "R", roles: ["reviewer"], since: String(Date.now()), records: [] }),
    "a valid epoch-ms since must NOT throw",
  );
  // Omitted window (no since/until) keeps the whole-ledger semantics — no throw, runs.
  assert.doesNotThrow(
    () => verifyGauntlet({ runId: "R", roles: ["reviewer"], records: [] }),
    "an omitted window must keep existing whole-ledger semantics (no throw)",
  );
  // Explicit null / empty-string bounds are treated as ABSENT (no bound) — no throw.
  assert.doesNotThrow(
    () => verifyGauntlet({ runId: "R", roles: ["reviewer"], since: null, until: "", records: [] }),
    "null/empty bounds are absent (no window) — must NOT throw",
  );
  // A correlation-by-sprint call (sprintId, no window) is unaffected by the parse guard.
  assert.doesNotThrow(
    () => verifyGauntlet({ runId: "R", roles: ["reviewer"], sprintId: "SP-TEST-001", records: [] }),
    "sprint-only correlation (no window) must not be affected by the parse guard",
  );
});

// ── Result ─────────────────────────────────────────────────────────────────────
if (failures.length) {
  process.stderr.write(`\nverify-gauntlet-parse.test: ${passed} passed, ${failures.length} FAILED\n`);
  for (const f of failures) process.stderr.write(`  FAIL: ${f}\n`);
  process.exit(1);
}
process.stdout.write(
  `verify-gauntlet-parse.test: ${passed}/${passed} passed\n` +
  `  AC-6.1 garbage-window-throws (library refusal) + AC-6.2 cli-behavior-preserved + valid/omitted/null windows unaffected\n`,
);
process.exit(0);
