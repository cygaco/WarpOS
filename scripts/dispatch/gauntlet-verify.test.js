#!/usr/bin/env node
"use strict";

/**
 * gauntlet-verify.test.js — exhaustive bite-test for BC-16 typed-success
 * semantics + AC2 dispatch-telemetry path fix.
 *
 * Covers ALL required AC3 cases:
 *   1. suppressed-record   — run completes but record suppressed → verifier FAILS
 *   2. valid               — well-formed record → verifier PASSES (no false-negative)
 *   3. malformed           — malformed line in run window → fail-CLOSED
 *   4. ill-typed           — ok:true but missing required fields → fail-closed
 *   5. stale               — only pre-since records → no-record → fail
 *   6. cwd-regression      — canonicalFile() returns AGENT_ROOT-anchored path
 *                            regardless of what PATHS resolves to (worktree vs canonical)
 *
 *   node scripts/dispatch/gauntlet-verify.test.js
 */

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const {
  verifyGauntlet,
  readCompletions,
  isWellFormedOkRecord,
} = require("./gauntlet-verify");

const {
  canonicalFile,
  AGENT_ROOT,
} = require("../dispatch-agent");

// ── Test harness ───────────────────────────────────────────
let passed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
  } catch (e) {
    failures.push(`${name}: ${e.message}`);
  }
}

// ── Temp file helpers ──────────────────────────────────────
const tmpFiles = [];

function writeTempFile(content) {
  const f = path.join(os.tmpdir(), `gv-test-${Date.now()}-${Math.random().toString(36).slice(2)}.jsonl`);
  fs.writeFileSync(f, content, "utf8");
  tmpFiles.push(f);
  return f;
}

function cleanupTempFiles() {
  for (const f of tmpFiles) {
    try { fs.unlinkSync(f); } catch { /* ignore */ }
  }
}

// ── Fixtures ───────────────────────────────────────────────
function makeRecord(overrides = {}) {
  return {
    role: "reviewer",
    ok: true,
    provider: "openai",
    model: "gpt-5.5",
    completed_at: new Date().toISOString(),
    ...overrides,
  };
}

// ── Test: 1. SUPPRESSED RECORD ─────────────────────────────
// Core BC-16 case: run happened but record write was suppressed (empty records
// injected). Verifier must fail, not report green.
test("suppressed-record: no records written → verifier fails (BC-16 core case)", () => {
  const sinceMs = Date.now() - 60_000;
  const res = verifyGauntlet({
    runId: "test-suppressed",
    roles: ["reviewer"],
    since: sinceMs,
    records: [], // simulates suppressed write
  });

  assert.strictEqual(res.ok, false, "ok should be false when record was suppressed");
  assert.ok(res.missingRoles.includes("reviewer"), "reviewer should be in missingRoles");
  assert.strictEqual(res.roles[0].status, "no-record", `expected no-record, got ${res.roles[0].status}`);
  assert.strictEqual(res.roles[0].satisfied, false, "should not be satisfied");
});

// Also test multi-role suppression: even one suppressed role fails the gauntlet.
test("suppressed-record: one role missing → whole gauntlet fails", () => {
  const now = Date.now();
  const res = verifyGauntlet({
    roles: ["reviewer", "qa"],
    since: now - 60_000,
    records: [
      makeRecord({ role: "reviewer", completed_at: new Date(now).toISOString() }),
      // qa is missing
    ],
  });

  assert.strictEqual(res.ok, false, "ok should be false when qa is missing");
  assert.ok(!res.missingRoles.includes("reviewer"), "reviewer should NOT be in missingRoles");
  assert.ok(res.missingRoles.includes("qa"), "qa should be in missingRoles");
});

// ── Test: 2. VALID WELL-FORMED RECORD ─────────────────────
// Happy path: every required role has a well-formed ok:true record → PASS.
test("valid: well-formed record → verifier passes (no false-negative)", () => {
  const now = Date.now();
  const res = verifyGauntlet({
    runId: "test-valid",
    roles: ["reviewer"],
    since: now - 60_000,
    records: [makeRecord({ completed_at: new Date(now).toISOString() })],
  });

  assert.strictEqual(res.ok, true, `expected ok:true, got: ${JSON.stringify(res)}`);
  assert.strictEqual(res.malformedTainted, false, "should not be malformedTainted");
  assert.strictEqual(res.roles[0].status, "ran");
  assert.strictEqual(res.roles[0].satisfied, true);
  assert.strictEqual(res.roles[0].wellFormed, true);
});

// Multi-role happy path.
test("valid: all roles well-formed → passes", () => {
  const now = Date.now();
  const res = verifyGauntlet({
    roles: ["reviewer", "qa", "redteam"],
    since: now - 60_000,
    records: [
      makeRecord({ role: "reviewer", completed_at: new Date(now).toISOString() }),
      makeRecord({ role: "qa",       completed_at: new Date(now).toISOString() }),
      makeRecord({ role: "redteam",  completed_at: new Date(now).toISOString() }),
    ],
  });

  assert.strictEqual(res.ok, true);
  assert.strictEqual(res.malformedTainted, false);
  assert.ok(res.roles.every((r) => r.satisfied && r.wellFormed === true));
});

// ── Test: 3. MALFORMED RECORD IN WINDOW ────────────────────
// When a run window is active and the ledger contains an unparseable line,
// the verifier must fail-CLOSED (malformedTainted=true, ok=false), even when
// other records for the role exist and are satisfied. The corrupt line COULD
// be the missing record for another role.
test("malformed: malformed line in window → fail-CLOSED (ok=false, malformedTainted=true)", () => {
  const now = Date.now();
  const validRecord = makeRecord({ completed_at: new Date(now).toISOString() });
  const tmpFile = writeTempFile(
    `{NOT VALID JSON — corrupt line}\n${JSON.stringify(validRecord)}\n`,
  );

  const res = verifyGauntlet({
    roles: ["reviewer"],
    since: now - 60_000,
    completionsFile: tmpFile,
  });

  assert.strictEqual(res.ok, false, "ok should be false with malformed line + window active");
  assert.strictEqual(res.malformedTainted, true, "malformedTainted should be true");
  assert.ok(res.malformedLines >= 1, `expected >=1 malformed lines, got ${res.malformedLines}`);
});

// FIX2 (c): No window + malformed line → now fails-CLOSED (was lenient — that was Bug (b)).
// BC-16: a no-window verify cannot silently ignore corruption. malformed>0 always taints.
test("malformed: no window + malformed line → fail-closed (FIX2: malformed always taints)", () => {
  const now = Date.now();
  const validRecord = makeRecord({ completed_at: new Date(now).toISOString() });
  const tmpFile = writeTempFile(
    `{NOT VALID JSON}\n${JSON.stringify(validRecord)}\n`,
  );

  const res = verifyGauntlet({
    roles: ["reviewer"],
    // No since/until — whole-ledger view
    completionsFile: tmpFile,
  });

  // FIX2: malformed lines taint even without a window (fail-closed, BC-16).
  assert.strictEqual(res.malformedTainted, true, "malformed without window should taint (FIX2)");
  assert.ok(res.malformedLines >= 1, "malformed lines should still be counted/surfaced");
  assert.strictEqual(res.ok, false, "ok should be false due to malformed taint (FIX2)");
});

// readCompletions unit test: counts malformed lines correctly.
test("readCompletions: counts malformed lines and returns them separately", () => {
  const tmpFile = writeTempFile(
    `{"role":"reviewer","ok":true,"provider":"openai","completed_at":"2026-01-01T00:00:00Z"}\n` +
    `{BROKEN\n` +
    `another broken line\n` +
    `{"role":"qa","ok":true,"provider":"gemini","completed_at":"2026-01-01T00:00:01Z"}\n`,
  );

  const { records, malformed, missing } = readCompletions(tmpFile);
  assert.strictEqual(missing, false);
  assert.strictEqual(records.length, 2, "should parse 2 valid records");
  assert.strictEqual(malformed, 2, "should count 2 malformed lines");
});

// ── Test: 4. ILL-TYPED RECORD (ok:true but missing required fields) ────────
// BC-16: an ok:true record missing provider or timestamp is NOT a valid success.
// It must be classified as "ill-typed" → ok:false, malformedTainted:true.
test("ill-typed: ok:true missing provider → not counted as ran → fail-closed", () => {
  const now = Date.now();
  const res = verifyGauntlet({
    roles: ["reviewer"],
    since: now - 60_000,
    records: [
      {
        role: "reviewer",
        ok: true,
        // provider intentionally missing
        completed_at: new Date(now).toISOString(),
      },
    ],
  });

  assert.strictEqual(res.ok, false, "ok should be false for ill-typed record");
  assert.strictEqual(res.malformedTainted, true, "malformedTainted should be true for ill-typed");
  assert.strictEqual(res.roles[0].status, "ill-typed", `expected ill-typed, got ${res.roles[0].status}`);
  assert.strictEqual(res.roles[0].wellFormed, false);
  assert.strictEqual(res.roles[0].satisfied, false);
});

test("ill-typed: ok:true missing timestamp → not counted as ran", () => {
  const now = Date.now();
  const res = verifyGauntlet({
    roles: ["reviewer"],
    since: now - 60_000,
    records: [
      {
        role: "reviewer",
        ok: true,
        provider: "openai",
        // completed_at AND started_at both missing
      },
    ],
  });

  // Note: without a timestamp, this record also fails inWindow() when a window
  // is specified — so it won't even be in `considered`. But the ill-typed check
  // for the isWellFormedOkRecord fn itself should still reject it.
  // The role will be "no-record" (filtered out by inWindow) → still fails.
  assert.strictEqual(res.ok, false, "ok should be false when timestamp is missing");
  // Either ill-typed or no-record (both are fail-closed)
  const status = res.roles[0].status;
  assert.ok(
    status === "ill-typed" || status === "no-record",
    `expected ill-typed or no-record, got ${status}`,
  );
});

test("ill-typed: ok:true garbage provider → not counted as ran", () => {
  const now = Date.now();
  const res = verifyGauntlet({
    roles: ["reviewer"],
    since: now - 60_000,
    records: [
      {
        role: "reviewer",
        ok: true,
        provider: "",  // empty string — invalid
        completed_at: new Date(now).toISOString(),
      },
    ],
  });

  assert.strictEqual(res.ok, false);
  assert.strictEqual(res.roles[0].status, "ill-typed");
  assert.strictEqual(res.roles[0].wellFormed, false);
});

// isWellFormedOkRecord unit tests
test("isWellFormedOkRecord: accepts fully-formed record", () => {
  assert.strictEqual(
    isWellFormedOkRecord({
      role: "reviewer",
      ok: true,
      provider: "openai",
      completed_at: "2026-01-01T00:00:00Z",
    }),
    true,
  );
});

test("isWellFormedOkRecord: rejects ok:false", () => {
  assert.strictEqual(
    isWellFormedOkRecord({ role: "reviewer", ok: false, provider: "openai", completed_at: "2026-01-01T00:00:00Z" }),
    false,
  );
});

test("isWellFormedOkRecord: rejects missing provider", () => {
  assert.strictEqual(
    isWellFormedOkRecord({ role: "reviewer", ok: true, completed_at: "2026-01-01T00:00:00Z" }),
    false,
  );
});

test("isWellFormedOkRecord: rejects missing timestamp", () => {
  assert.strictEqual(
    isWellFormedOkRecord({ role: "reviewer", ok: true, provider: "openai" }),
    false,
  );
});

test("isWellFormedOkRecord: accepts started_at as timestamp fallback", () => {
  assert.strictEqual(
    isWellFormedOkRecord({ role: "reviewer", ok: true, provider: "openai", started_at: "2026-01-01T00:00:00Z" }),
    true,
  );
});

test("isWellFormedOkRecord: rejects null", () => {
  assert.strictEqual(isWellFormedOkRecord(null), false);
});

// ── Test: 5. STALE RECORD ──────────────────────────────────
// A role whose only records predate `since` is filtered by inWindow() →
// the role bucket is empty → status "no-record" → ok:false.
// This verifies the stale-handling invariant from AC1 section (4).
test("stale: only pre-since records → window filter drops them → no-record → fail", () => {
  const sinceMs = Date.now();
  const staleMs = sinceMs - 120_000; // 2 minutes before since

  const res = verifyGauntlet({
    runId: "test-stale",
    roles: ["reviewer"],
    since: sinceMs,
    records: [
      makeRecord({ completed_at: new Date(staleMs).toISOString() }),
    ],
  });

  assert.strictEqual(res.ok, false, "stale record should not satisfy");
  assert.strictEqual(
    res.roles[0].status,
    "no-record",
    `expected no-record for stale record, got ${res.roles[0].status}`,
  );
  assert.strictEqual(res.considered, 0, "stale record should not be in considered");
});

// Verify `until` bound also filters out future records.
test("stale: record after `until` → filtered out → no-record → fail", () => {
  const untilMs = Date.now() - 10_000;
  const futureMs = untilMs + 60_000;

  const res = verifyGauntlet({
    roles: ["reviewer"],
    until: untilMs,
    records: [
      makeRecord({ completed_at: new Date(futureMs).toISOString() }),
    ],
  });

  assert.strictEqual(res.ok, false);
  assert.strictEqual(res.roles[0].status, "no-record");
  assert.strictEqual(res.considered, 0);
});

// In-window record IS included.
test("stale: record inside window is considered → ran → ok", () => {
  const sinceMs = Date.now() - 60_000;
  const untilMs = Date.now() + 10_000;
  const inWindowMs = Date.now() - 5_000;

  const res = verifyGauntlet({
    roles: ["reviewer"],
    since: sinceMs,
    until: untilMs,
    records: [
      makeRecord({ completed_at: new Date(inWindowMs).toISOString() }),
    ],
  });

  assert.strictEqual(res.ok, true);
  assert.strictEqual(res.roles[0].status, "ran");
  assert.strictEqual(res.considered, 1);
});

// ── Test: 6. CWD-REGRESSION (AC2) ─────────────────────────
// The dispatch-telemetry bug (ED-016/class-#20): when CLAUDE_PROJECT_DIR is
// unset and cwd=worktree, PATHS resolves to worktree/.claude/runtime — wrong.
// The fix: canonicalFile() uses AGENT_ROOT (__dirname-anchored) as primary
// anchor and only accepts a PATHS value when it resolves UNDER AGENT_ROOT.
//
// We test canonicalFile() directly by passing fake path values and asserting
// the output. No process.cwd() tricks needed — the function is pure.
test("cwd-regression: canonicalFile returns AGENT_ROOT-anchored path when PATHS points to a different root (worktree)", () => {
  // Simulate PATHS.dispatchCompletionsFile pointing to a DIFFERENT root
  // (the worktree cwd-bend scenario).
  const fakeWorktreePath = path.join(
    os.tmpdir(),
    "fake-worktree",
    ".claude",
    "runtime",
    "dispatch-completions.jsonl",
  );

  const result = canonicalFile(fakeWorktreePath, path.join(".claude", "runtime", "dispatch-completions.jsonl"));

  const expectedPath = path.join(AGENT_ROOT, ".claude", "runtime", "dispatch-completions.jsonl");

  assert.strictEqual(
    path.normalize(result).toLowerCase(),
    path.normalize(expectedPath).toLowerCase(),
    `Expected AGENT_ROOT-anchored path:\n  ${expectedPath}\nGot:\n  ${result}`,
  );
});

test("cwd-regression: canonicalFile accepts PATHS value when it IS under AGENT_ROOT (CLAUDE_PROJECT_DIR set correctly)", () => {
  // Simulate PATHS correctly pointing under AGENT_ROOT.
  const correctPath = path.join(
    AGENT_ROOT,
    ".claude",
    "runtime",
    "dispatch-completions.jsonl",
  );

  const result = canonicalFile(correctPath, path.join(".claude", "runtime", "dispatch-completions.jsonl"));

  assert.strictEqual(
    path.normalize(result).toLowerCase(),
    path.normalize(correctPath).toLowerCase(),
    `Expected correct PATHS value to be preserved:\n  ${correctPath}\nGot:\n  ${result}`,
  );
});

test("cwd-regression: canonicalFile falls back when pathsValue is undefined/null", () => {
  const expectedPath = path.join(AGENT_ROOT, ".claude", "runtime", "dispatch-deaths.jsonl");

  const result1 = canonicalFile(undefined, path.join(".claude", "runtime", "dispatch-deaths.jsonl"));
  const result2 = canonicalFile(null, path.join(".claude", "runtime", "dispatch-deaths.jsonl"));

  assert.strictEqual(
    path.normalize(result1).toLowerCase(),
    path.normalize(expectedPath).toLowerCase(),
    "undefined pathsValue should use AGENT_ROOT fallback",
  );
  assert.strictEqual(
    path.normalize(result2).toLowerCase(),
    path.normalize(expectedPath).toLowerCase(),
    "null pathsValue should use AGENT_ROOT fallback",
  );
});

test("cwd-regression: canonicalFile falls back when pathsValue is a relative string", () => {
  // The original bug had a literal ".claude/runtime" string as fallback.
  // canonicalFile should never return a relative path.
  const result = canonicalFile(
    ".claude/runtime/dispatch-completions.jsonl",
    path.join(".claude", "runtime", "dispatch-completions.jsonl"),
  );

  assert.ok(
    path.isAbsolute(result),
    `canonicalFile must return an absolute path, got: ${result}`,
  );

  // Should be the AGENT_ROOT-anchored path (the relative value is not under AGENT_ROOT)
  const expectedPath = path.join(AGENT_ROOT, ".claude", "runtime", "dispatch-completions.jsonl");
  assert.strictEqual(
    path.normalize(result).toLowerCase(),
    path.normalize(expectedPath).toLowerCase(),
  );
});

// ── Test: Backward compat ──────────────────────────────────
// Existing callers that only check res.ok still work; new fields are additive.
test("backward-compat: result shape is a superset of the original shape", () => {
  const now = Date.now();
  const res = verifyGauntlet({
    roles: ["reviewer"],
    since: now - 60_000,
    records: [makeRecord({ completed_at: new Date(now).toISOString() })],
  });

  // Original fields still present
  assert.ok("ok" in res);
  assert.ok("runId" in res);
  assert.ok("window" in res);
  assert.ok("completionsFile" in res);
  assert.ok("ledgerMissing" in res);
  assert.ok("malformedLines" in res);
  assert.ok("considered" in res);
  assert.ok("roles" in res);
  assert.ok("missingRoles" in res);

  // New fields added (BC-16)
  assert.ok("malformedTainted" in res, "malformedTainted should be present");

  // Per-role: wellFormed field
  assert.ok("wellFormed" in res.roles[0], "wellFormed should be present per-role");
});

// ── Test: fell-back + strict-fallback ─────────────────────
test("fell-back: satisfies gauntlet by default, fails with --strict-fallback", () => {
  const now = Date.now();
  const fbRecord = makeRecord({
    completed_at: new Date(now).toISOString(),
    fallback: true,
  });

  const res = verifyGauntlet({
    roles: ["reviewer"],
    since: now - 60_000,
    records: [fbRecord],
  });

  assert.strictEqual(res.ok, true, "fell-back should satisfy by default");
  assert.strictEqual(res.roles[0].status, "fell-back");
  assert.strictEqual(res.roles[0].wellFormed, true, "fell-back well-formed record is wellFormed:true");

  const resStrict = verifyGauntlet({
    roles: ["reviewer"],
    since: now - 60_000,
    records: [fbRecord],
    strictFallback: true,
  });

  assert.strictEqual(resStrict.ok, false, "fell-back should fail with strictFallback:true");
});

// ── FIX1 Tests: Future-timestamp clamp (Golden Ticket prevention) ────────────
// A far-future completed_at with only `since` (no explicit `until`) must be
// excluded — the effective upper bound defaults to now.
test("FIX1: far-future completed_at + only `since` → excluded → no-record → ok:false", () => {
  const now = Date.now();
  const futureMs = now + 365 * 24 * 60 * 60 * 1000; // 1 year in the future
  const res = verifyGauntlet({
    roles: ["reviewer"],
    since: now - 60_000, // window starts 1 min ago, no explicit until
    records: [
      makeRecord({
        role: "reviewer",
        completed_at: new Date(futureMs).toISOString(),
      }),
    ],
  });

  assert.strictEqual(res.ok, false, "far-future record must be excluded (no Golden Ticket)");
  assert.strictEqual(res.roles[0].status, "no-record", "future record should be filtered out by FIX1");
  assert.strictEqual(res.considered, 0, "future record must not appear in considered");
});

// A record at exactly "now" with `since` in the past must still count — not wrongly excluded.
test("FIX1: record at 'now' with since in the past → still in-window → ok:true", () => {
  const now = Date.now();
  const res = verifyGauntlet({
    roles: ["reviewer"],
    since: now - 60_000, // 1 min ago, no explicit until
    records: [
      makeRecord({
        role: "reviewer",
        completed_at: new Date(now).toISOString(), // exactly at capture-time
      }),
    ],
  });

  // verifyGauntlet's internal nowMs >= now (time only moves forward), so t <= nowMs → passes.
  assert.strictEqual(res.ok, true, "record at now must NOT be wrongly excluded (FIX1)");
  assert.strictEqual(res.roles[0].status, "ran");
  assert.strictEqual(res.considered, 1);
});

// ── FIX1 Regression: clock-skew false-RED ─────────────────────────────────────
// A real completion record whose completed_at is a few minutes AHEAD of the
// verifier's clock (small positive skew, common across distributed machines)
// must NOT be excluded. Prior code defaulted effectiveUntilMs = nowMs (bare),
// so even a 1-second skew caused t > nowMs → excluded → false-RED.
// Fix: default effectiveUntilMs = nowMs + FUTURE_SKEW_ALLOWANCE_MS (24h).
test("FIX1 (skew-false-red regression): record 5 min ahead of verifier + --since only → accepted → ok:true", () => {
  const now = Date.now();
  const skewedMs = now + 5 * 60 * 1000; // 5 minutes ahead (normal clock skew)
  const res = verifyGauntlet({
    roles: ["reviewer"],
    since: now - 60_000, // window starts 1 min ago, NO explicit until
    records: [
      makeRecord({
        role: "reviewer",
        completed_at: new Date(skewedMs).toISOString(),
      }),
    ],
  });

  assert.strictEqual(res.ok, true, "5-min skewed record must NOT be false-red'd — legit clock skew within 24h allowance");
  assert.strictEqual(res.roles[0].status, "ran", "role must be satisfied");
  assert.strictEqual(res.considered, 1, "skewed record must appear in considered");
});

// Confirm far-future injection (year 9999) is STILL blocked even after the skew fix.
// The skew allowance is only 24h; a record timestamped centuries ahead is beyond both
// the effectiveUntilMs default AND the hardCeilingMs → must still be excluded.
test("FIX1 (golden-ticket still blocked after skew fix): year-9999 completed_at → excluded → ok:false", () => {
  const now = Date.now();
  const yearNineNineNineMs = new Date("9999-01-01T00:00:00Z").getTime();
  const res = verifyGauntlet({
    roles: ["reviewer"],
    since: now - 60_000, // window starts 1 min ago, no explicit until
    records: [
      makeRecord({
        role: "reviewer",
        completed_at: new Date(yearNineNineNineMs).toISOString(),
      }),
    ],
  });

  assert.strictEqual(res.ok, false, "year-9999 record must still be excluded — Golden Ticket blocked");
  assert.strictEqual(res.roles[0].status, "no-record", "year-9999 record must be filtered (FIX1 still active)");
  assert.strictEqual(res.considered, 0, "year-9999 record must not appear in considered");
});

// ── FIX2 Tests: Positional malformed-taint scoping ────────────────────────────
// (a) A malformed line that appears CLEARLY BEFORE the first in-window valid
//     record (separated by 2+ out-of-window records) is historic → must NOT
//     taint a windowed verify (prevents DoS blast-radius).
//
//     NOTE on fixture: the leading-edge adjacency rule (FIX2 span = firstInWindowIdx-1)
//     means a malformed line at (firstInWindowIdx - 1) → i.e. immediately before the
//     first in-window record → DOES taint (it could be a half-written record for this
//     run). To test the "clearly historic / no-taint" case we must separate the
//     malformed line by ≥2 out-of-window valid records so it falls outside the taint
//     span. Fixture layout:
//       Line 0: malformed  (idx=0, historic — 3 lines before first in-window)
//       Line 1: out-of-window valid record (idx=1)
//       Line 2: out-of-window valid record (idx=2)
//       Line 3: in-window valid record     (idx=3) ← firstInWindowIdx
//     Taint check: 0 >= (3 - 1) = 0 >= 2 → false → no taint ✓
test("FIX2a: malformed line BEFORE in-window records → historic → no taint → ok:true", () => {
  const now = Date.now();
  const validRecord = makeRecord({
    role: "reviewer",
    completed_at: new Date(now).toISOString(),
  });
  // Out-of-window records: completed_at older than `since` (now - 60_000).
  const oldRecord1 = makeRecord({
    role: "reviewer",
    completed_at: new Date(now - 120_000).toISOString(), // 2 min ago — outside window
  });
  const oldRecord2 = makeRecord({
    role: "reviewer",
    completed_at: new Date(now - 90_000).toISOString(), // 1.5 min ago — outside window
  });
  // Line 0: malformed (historic — clearly separated by 2 out-of-window records)
  // Line 1: out-of-window valid record
  // Line 2: out-of-window valid record
  // Line 3: in-window valid record  ← firstInWindowIdx = 3, taint span starts at 2
  const tmpFile = writeTempFile(
    `{NOT VALID JSON — historic corruption, clearly separated}\n` +
    `${JSON.stringify(oldRecord1)}\n` +
    `${JSON.stringify(oldRecord2)}\n` +
    `${JSON.stringify(validRecord)}\n`,
  );

  const res = verifyGauntlet({
    roles: ["reviewer"],
    since: now - 60_000,
    completionsFile: tmpFile,
  });

  assert.strictEqual(res.ok, true, "historic malformed line (clearly separated before window records) must NOT taint (FIX2a)");
  assert.strictEqual(res.malformedTainted, false, "malformedTainted must be false for clearly-pre-window corruption");
  assert.ok(res.malformedLines >= 1, "malformed count must still be surfaced for observability");
  assert.strictEqual(res.roles[0].status, "ran");
});

// (b) A malformed line that appears AFTER the first in-window valid record is
//     in-scope → MUST taint (a crash mid-write during this run bricks the gate).
test("FIX2b: malformed line AFTER in-window records → in-scope → tainted → ok:false", () => {
  const now = Date.now();
  const validRecord = makeRecord({
    role: "reviewer",
    completed_at: new Date(now).toISOString(),
  });
  // Line 0: valid in-window record
  // Line 1: malformed (after in-window records → in-scope for this run)
  const tmpFile = writeTempFile(
    `${JSON.stringify(validRecord)}\n{NOT VALID JSON — crash mid-write}\n`,
  );

  const res = verifyGauntlet({
    roles: ["reviewer"],
    since: now - 60_000,
    completionsFile: tmpFile,
  });

  assert.strictEqual(res.ok, false, "malformed line after in-window records must taint (FIX2b)");
  assert.strictEqual(res.malformedTainted, true, "malformedTainted must be true for in-scope corruption");
  assert.ok(res.malformedLines >= 1);
});

// ── FIX3 Tests: --allow-failed no longer manufactures green from pure-failed ─
// A role with ONLY a failed record + allowFailed:true must NOT be satisfied.
test("FIX3: role with only failed record + allowFailed:true → NOT satisfied → ok:false", () => {
  const now = Date.now();
  const res = verifyGauntlet({
    roles: ["reviewer"],
    since: now - 60_000,
    allowFailed: true, // deprecated flag — must not green a pure-failed role
    records: [
      {
        role: "reviewer",
        ok: false, // only record is a failure — no well-formed success exists
        provider: "openai",
        completed_at: new Date(now).toISOString(),
      },
    ],
  });

  assert.strictEqual(res.ok, false, "--allow-failed must not green a pure-failed role (FIX3)");
  assert.strictEqual(res.roles[0].status, "failed");
  assert.strictEqual(res.roles[0].satisfied, false, "satisfied must be false for pure-failed (FIX3)");
  assert.ok(res.missingRoles.includes("reviewer"), "reviewer must be in missingRoles");
});

// A role with a failed attempt AND a later well-formed success still satisfies
// (best-outcome-wins: "ran" beats "failed"; allowFailed not needed for this).
test("FIX3: failed attempt then well-formed ran record → satisfied (best-outcome-wins unaffected)", () => {
  const now = Date.now();
  const res = verifyGauntlet({
    roles: ["reviewer"],
    since: now - 60_000,
    records: [
      {
        role: "reviewer",
        ok: false, // earlier failure
        provider: "openai",
        completed_at: new Date(now - 30_000).toISOString(),
      },
      makeRecord({ // later well-formed success — best outcome wins
        role: "reviewer",
        completed_at: new Date(now).toISOString(),
      }),
    ],
  });

  assert.strictEqual(res.ok, true, "well-formed success after a failure must still satisfy (FIX3)");
  assert.strictEqual(res.roles[0].status, "ran", "best-outcome-wins: ran beats failed");
  assert.strictEqual(res.roles[0].satisfied, true);
});

// ── FIX4 Test: Empty roles list is never vacuously green ─────────────────────
test("FIX4: verifyGauntlet({roles:[]}) → ok:false with noRolesRequested:true (no vacuous green)", () => {
  const res = verifyGauntlet({ roles: [] });
  assert.strictEqual(res.ok, false, "empty roles must yield ok:false — no vacuous green (FIX4)");
  assert.strictEqual(res.noRolesRequested, true, "noRolesRequested flag must be set");
  assert.strictEqual(res.roles.length, 0, "roles array must be empty");
  assert.strictEqual(res.missingRoles.length, 0, "missingRoles must be empty (not applicable)");
});

// ── FIX5 Test: Real cwd/env-change regression (ED-016 reproduction) ──────────
// The HOLLOW regression in the previous commit only called canonicalFile(fakePath)
// without actually changing process.cwd() or deleting CLAUDE_PROJECT_DIR — it
// couldn't catch a cwd-dependent regression. This test actually triggers the bug
// scenario: chdir to a temp (worktree-like) dir AND delete the env anchor.
test("FIX5 (cwd-regression real): canonicalFile is cwd-independent after chdir + CLAUDE_PROJECT_DIR deleted", () => {
  const originalCwd = process.cwd();
  const originalEnvValue = process.env.CLAUDE_PROJECT_DIR;
  let tmpDir;

  try {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "gv-wt-cwd-"));

    // Simulate the ED-016 worktree scenario:
    //   1. cwd changes to a non-canonical location (worktree dir)
    //   2. CLAUDE_PROJECT_DIR is unset (not passed by the dispatcher)
    process.chdir(tmpDir);
    delete process.env.CLAUDE_PROJECT_DIR;

    // Pass a pathsValue that looks like it's under the worktree (the "bent" PATHS value).
    const fakeWorktreePath = path.join(
      tmpDir,
      ".claude",
      "runtime",
      "dispatch-completions.jsonl",
    );
    const result = canonicalFile(
      fakeWorktreePath,
      path.join(".claude", "runtime", "dispatch-completions.jsonl"),
    );

    const expectedPath = path.join(AGENT_ROOT, ".claude", "runtime", "dispatch-completions.jsonl");

    // Must return an absolute path anchored to AGENT_ROOT — never the worktree path.
    assert.ok(
      path.isAbsolute(result),
      `canonicalFile must return an absolute path, got: ${result}`,
    );
    assert.notStrictEqual(
      path.normalize(result).toLowerCase(),
      path.normalize(fakeWorktreePath).toLowerCase(),
      "result must NOT be the worktree-cwd-derived path (ED-016 regression)",
    );
    assert.strictEqual(
      path.normalize(result).toLowerCase(),
      path.normalize(expectedPath).toLowerCase(),
      `Expected AGENT_ROOT-anchored path regardless of cwd:\n  ${expectedPath}\nGot:\n  ${result}`,
    );
  } finally {
    // Always restore — test isolation is mandatory.
    process.chdir(originalCwd);
    if (originalEnvValue !== undefined) {
      process.env.CLAUDE_PROJECT_DIR = originalEnvValue;
    } else {
      delete process.env.CLAUDE_PROJECT_DIR;
    }
    if (tmpDir) {
      try { fs.rmdirSync(tmpDir); } catch { /* ignore */ }
    }
  }
});

// ── Result ─────────────────────────────────────────────────
cleanupTempFiles();

if (failures.length) {
  process.stderr.write(
    `\nganutlet-verify bite-test: ${passed} passed, ${failures.length} FAILED\n`,
  );
  for (const f of failures) {
    process.stderr.write(`  FAIL: ${f}\n`);
  }
  process.exit(1);
}

process.stdout.write(
  `gauntlet-verify bite-test: ${passed}/${passed} passed\n` +
  `  covers: suppressed-record, valid, malformed, ill-typed, stale, cwd-regression, backward-compat\n` +
  `  FIX1: future-clamp + skew-false-red-regression + golden-ticket-still-blocked; FIX2: positional-taint(a,b,c); FIX3: no-green-from-pure-failed; FIX4: empty-roles; FIX5: real-cwd-regression\n`,
);
process.exit(0);
