#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// scan-turbo-spend.test.js — S-LC-07 WORK §4. The NEW /scan:turbo-spend check
// (scripts/checks/turbo-spend.js) — NOT /scan:full (S-LC-06 owns full.md).
//
//   - reports spend state (report-only; exit 0 on the normal path).
//   - fail-open on a malformed ledger (exit 0, no crash).
//   - profile honesty HAS teeth: a planted auto-push profile → exit 1 finding.
//   - preflight consistency: push classified gated → profile must be confirm.
// ─────────────────────────────────────────────────────────────────────────────
"use strict";

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..", "..", "..");
const SCAN = path.join(ROOT, "scripts", "checks", "turbo-spend.js");
const check = require(SCAN);

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

function tmpFile(name, contents) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "slc07-scan-"));
  const file = path.join(dir, name);
  fs.writeFileSync(file, contents);
  return file;
}

// ── reports spend, exit 0 on the normal path ─────────────────────────────────
ok("run() reports spend state and the profile, exit 0 normally", () => {
  const r = check.run({});
  assert.strictEqual(r.scan, "turbo-spend");
  assert.strictEqual(r.reportOnly, true);
  assert.ok(r.spend, "spend section present");
  assert.ok(r.profile, "profile section present");
  assert.strictEqual(r.profile.ok, true, "canonical profile is honest");
  assert.strictEqual(r.profile.pushLevel, "confirm");
  assert.strictEqual(r.exitCode, 0);
});

ok("run() preflight consistency: push gated → profile confirm → consistent", () => {
  const r = check.run({});
  assert.ok(r.preflightConsistency);
  assert.strictEqual(r.preflightConsistency.pushClassifiedAs, "gated");
  assert.strictEqual(r.preflightConsistency.pushProfileLevel, "confirm");
  assert.strictEqual(r.preflightConsistency.consistent, true);
});

// ── fail-open on a malformed ledger ──────────────────────────────────────────
ok("fail-open: a malformed ledger file → exit 0, spend still reported", () => {
  const bad = tmpFile("dispatch-completions.jsonl", "<<<not json>>>\n{broken\n");
  const r = check.run({ ledgerOpts: { completionsFile: bad, authOverride: null } });
  assert.strictEqual(r.exitCode, 0, "malformed ledger must not fail the scan");
  assert.ok(r.spend, "spend reported despite the malformed ledger");
  assert.strictEqual(r.findings.length, 0, "no hard findings from a malformed ledger");
});

ok("fail-open: a missing ledger file → exit 0", () => {
  const missing = path.join(os.tmpdir(), "missing-" + Date.now() + ".jsonl");
  const r = check.run({ ledgerOpts: { completionsFile: missing, authOverride: null } });
  assert.strictEqual(r.exitCode, 0);
});

// ── the ledger reads the $500 override when present (via the scan) ────────────
ok("scan surfaces the $500 runtime override (not a hardcoded ceiling)", () => {
  const r = check.run({ ledgerOpts: { authOverride: { spend_ceiling_usd: 500 } } });
  assert.strictEqual(r.spend.ceilingUsd, 500);
  assert.strictEqual(r.spend.ceilingSource, "runtime-override");
});

// ── profile honesty HAS teeth ────────────────────────────────────────────────
ok("a planted auto-push profile file → exit 1 finding (honesty has teeth)", () => {
  const planted = require(path.join(ROOT, "scripts", "turbo", "permission-profile.js")).getProfile();
  planted["push-to-main"].level = "auto";
  const file = tmpFile("planted-profile.json", JSON.stringify(planted, null, 2));
  const r = check.run({ profileFile: file });
  assert.strictEqual(r.exitCode, 1, "a dishonest profile must fail the scan");
  assert.strictEqual(r.profile.ok, false);
  assert.ok(
    r.findings.some((f) => /HONESTY VIOLATION/i.test(f) && /push-to-main/i.test(f)),
    "the finding must name the push-to-main honesty breach",
  );
});

// ── CLI surface (subprocess) ─────────────────────────────────────────────────
ok("CLI: default run exits 0 and prints a report", () => {
  const res = spawnSync("node", [SCAN], { cwd: ROOT, encoding: "utf8" });
  assert.strictEqual(res.status, 0, `CLI should exit 0, got ${res.status}; stderr=${res.stderr}`);
  assert.ok(/turbo-spend/i.test(res.stdout), "report mentions the scan name");
});

ok("CLI: --profile <planted auto-push> exits 1", () => {
  const planted = require(path.join(ROOT, "scripts", "turbo", "permission-profile.js")).getProfile();
  planted["push-to-main"].level = "auto";
  const file = tmpFile("planted-cli.json", JSON.stringify(planted));
  const res = spawnSync("node", [SCAN, "--profile", file], { cwd: ROOT, encoding: "utf8" });
  assert.strictEqual(res.status, 1, `dishonest profile via CLI should exit 1, got ${res.status}`);
});

ok("CLI: --json emits a parseable envelope", () => {
  const res = spawnSync("node", [SCAN, "--json"], { cwd: ROOT, encoding: "utf8" });
  const parsed = JSON.parse(res.stdout);
  assert.strictEqual(parsed.scan, "turbo-spend");
  assert.strictEqual(parsed.reportOnly, true);
});

console.log(`\nS-LC-07 scan-turbo-spend: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
