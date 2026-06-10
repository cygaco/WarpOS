#!/usr/bin/env node
"use strict";

// ─────────────────────────────────────────────────────────────────────────────
// coverage-gate-caller.test.js — S-LC-06. The LIVE CALLER for coverage-gate.js
// evaluate() (which was built+tested but had NO live caller — PLAN §2.6).
//   - auditLedger() runs evaluate() over the ledger run-by-run and surfaces the
//     sprint-theater class (phantom row, blind/unbacked claim, cross-provider
//     satisfied by claude) with NO per-run --expect.
//   - the CLI (coverage-gate-scan.js) is REPORT-ONLY (exit 0 even with gaps) and
//     FAIL-OPEN (a malformed/unreadable ledger → exit 0), with an --enforce ramp
//     tail (exit 1 on a gap).
// ─────────────────────────────────────────────────────────────────────────────

const assert = require("assert");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..", "..", "..");
const { harness, sealedDir } = require(path.join(ROOT, "scripts", "checks", "lib", "fixture-harness"));
const { auditLedger } = require(path.join(ROOT, "scripts", "checks", "coverage-gate-scan"));
const { ARGV_SCHEMA_VERSION } = require(path.join(ROOT, "scripts", "dispatch", "dispatch-contract"));
const SCAN = path.join(ROOT, "scripts", "checks", "coverage-gate-scan.js");

const h = harness("S-LC-06/coverage-gate-caller");

// A realistic backed + current-schema + artifact-proof record (overridable).
function rec(over) {
  return {
    dispatch_id: "d-1",
    cmdline_checksum: "sha256:deadbeef",
    run_id: "run-1",
    role: "frontend-builder",
    provider: "claude",
    ok: true,
    argv_schema_version: ARGV_SCHEMA_VERSION,
    output_digest: "sha256:feedface00000000000000000000",
    ...over,
  };
}

function runScan(records, extraArgs) {
  // Write the records as JSONL into a sealed ledger; point the scan at it.
  const lines = (records || []).map((r) => (typeof r === "string" ? r : JSON.stringify(r))).join("\n");
  const fx = sealedDir({ "ledger.jsonl": lines }, "covledger");
  try {
    const args = [SCAN, "--ledger", fx.file("ledger.jsonl"), ...(extraArgs || [])];
    const r = spawnSync(process.execPath, args, { encoding: "utf8" });
    return { exitCode: r.status, stdout: r.stdout || "", stderr: r.stderr || "" };
  } finally {
    fx.cleanup();
  }
}

// ── auditLedger: clean ledger → 0 gaps ──────────────────────
h.pass("auditLedger: a clean backed+proof ledger has 0 gaps", () => {
  const a = auditLedger([
    rec({ role: "frontend-builder", provider: "claude", dispatch_id: "d-b" }),
    rec({ role: "security-reviewer", provider: "gemini", dispatch_id: "d-r" }),
  ]);
  return { ok: a.totalViolations === 0 && a.totalCovered === 2 };
});

// ── auditLedger PLANTED: a phantom ok:true row is a gap ──────
h.violation("auditLedger: a phantom ok:true row (no dispatch_id) is surfaced as a gap", () => {
  const a = auditLedger([{ run_id: "run-1", role: "security-reviewer", provider: "gemini", ok: true }]);
  return { violations: a.runs.flatMap((r) => r.violations) };
});

// ── auditLedger PLANTED: a cross-provider role satisfied by claude is a gap ──
h.violation("auditLedger: a cross-provider role satisfied by provider=claude is surfaced", () => {
  const a = auditLedger([rec({ role: "security-reviewer", provider: "claude", dispatch_id: "d-c" })]);
  return { violations: a.runs.flatMap((r) => r.violations) };
});

// ── CLI: clean ledger → exit 0, reports OK ──────────────────
h.pass("CLI: clean ledger → exit 0 (report-only)", () => {
  const r = runScan([rec({ role: "frontend-builder", provider: "claude", dispatch_id: "d-b" })]);
  return { exitCode: r.exitCode };
});

// ── CLI: a gappy ledger → exit 0 (REPORT-ONLY) but the gap IS reported ──
h.test("CLI: a gappy ledger reports the gap but still EXITS 0 (report-only — does not block /scan:full)", () => {
  const r = runScan([{ run_id: "run-1", role: "security-reviewer", provider: "gemini", ok: true }]);
  assert.strictEqual(r.exitCode, 0, `report-only must exit 0, got ${r.exitCode}: ${r.stderr}`);
  assert.match(r.stdout, /gap|WARN|phantom/i, `the gap should be reported in stdout: ${r.stdout}`);
});

// ── CLI: --enforce on a gappy ledger → exit 1 (the ramp tail proof) ──
h.violation("CLI: --enforce on a gappy ledger → exit 1 (ramp tail)", () => {
  const r = runScan([{ run_id: "run-1", role: "security-reviewer", provider: "gemini", ok: true }], ["--enforce"]);
  return { exitCode: r.exitCode }; // exitCode 1 → isPass false → violation correctly caught
});

// ── CLI: FAIL-OPEN on a malformed ledger → exit 0 ───────────
h.test("CLI: a malformed (non-JSON) ledger → exit 0 (FAIL-OPEN, never breaks the scan)", () => {
  const r = runScan(["{ this is not json", "garbage!!!", "}{"], []);
  assert.strictEqual(r.exitCode, 0, `malformed ledger must fail-open to exit 0, got ${r.exitCode}: ${r.stderr}`);
});

// ── CLI: an absent ledger → exit 0 (fail-open) ──────────────
h.test("CLI: an absent ledger path → exit 0 (fail-open)", () => {
  const r = spawnSync(process.execPath, [SCAN, "--ledger", path.join(ROOT, "no-such-ledger-xyz.jsonl")], { encoding: "utf8" });
  assert.strictEqual(r.status, 0, `absent ledger must fail-open, got ${r.status}: ${r.stderr}`);
});

h.done();
