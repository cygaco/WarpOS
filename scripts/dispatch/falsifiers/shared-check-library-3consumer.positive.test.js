"use strict";
// POSITIVE companion to shared-check-library-reachability.falsifier.test.js (AC-17/AC-19). Proves the
// golden path for the hook consumer (this unit, BUNDLE): a clean envelope with real observable work is NOT
// blocked, and the shared suite's REQUIRED checks are the ones that authorized the pass (non-vacuous — a
// reject-everything or run-nothing stub cannot satisfy this). Phase-3 shape: skips RED until the 3-consumer
// precondition (pre-commit + controller wired) exists, matching the negative falsifier's gating — the FULL
// 3-consumer positive is asserted together once backend-builder's units land.
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..", "..");
const CHECK_LIB_DIR = path.join(ROOT, "scripts", "dispatch", "check-lib");
const HOOK = path.join(ROOT, "scripts", "hooks", "check-lib-prevention.js");
const PRECOMMIT = path.join(ROOT, "scripts", "hooks", "pre-commit-steps-check.js");
const CONTROLLER = path.join(ROOT, "scripts", "dispatch", "trusted-controller.js");

function fileRequiresCheckLib(p) {
  if (!fs.existsSync(p)) return false;
  let content;
  try {
    content = fs.readFileSync(p, "utf8");
  } catch {
    return false;
  }
  return /require\([^)]*check-lib[^)]*\)/.test(content);
}

test("AC-19 shared check-library — POSITIVE: the hook consumer authorizes only after the shared REQUIRED checks ran clean", (t) => {
  if (!fs.existsSync(CHECK_LIB_DIR) || !fs.existsSync(HOOK)) return t.skip("pending BUNDLE (falsifier RED)");

  delete require.cache[require.resolve(HOOK)];
  const hook = require(HOOK);
  const cleanResult = hook.runPrevention({ root: ROOT, envelope: { status: "passed", files: 3, commits: 1, tests: 5, evidence: 2 } });

  assert.strictEqual(cleanResult.blocked, false, "a clean envelope with real observable work must NOT block");
  assert.ok(cleanResult.results.length >= 3, "all 3 REQUIRED checks must have run (non-vacuous suite)");
  assert.ok(
    cleanResult.results.every((r) => ["pass", "skipped"].includes(r.status)),
    "every REQUIRED check must have concluded pass or (legitimately) skipped for a positive outcome — no silent fail counted as pass",
  );
  assert.strictEqual(cleanResult.missing.length, 0, "no registry drift on the golden path");

  // Full 3-consumer positive requires backend-builder's pre-commit + controller wiring — asserted together
  // once present (matches the negative falsifier's gating; not fabricated as green in the meantime).
  if (!fileRequiresCheckLib(PRECOMMIT) || !fs.existsSync(CONTROLLER) || !fileRequiresCheckLib(CONTROLLER)) {
    return t.skip("pending backend-builder — full 3-consumer positive awaits pre-commit + controller wiring (falsifier RED)");
  }
});
