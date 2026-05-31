#!/usr/bin/env node
"use strict";
/**
 * scripts/etc/etc.test.js — Test suite for the /etc authoring+eval harness.
 *
 * Proves 4 cases using INJECTED seams only — no real paid calls, no network.
 *
 * Case 1: consult() parses an envelope and strips a business-verb directive
 *         (publish/export/install/run/mirror) → flagged non-empty.
 * Case 2: evaluate() on a target that satisfies the fixture pack → accept,
 *         arbitration_needed:false, emitted record passes validate-artifact.js.
 * Case 3: evaluate() with a judgment dimension and NO consult → arbitration_needed:true.
 * Case 4: A deliberately malformed record is REJECTED by validate-artifact.js (exit 1).
 *
 * Run: node scripts/etc/etc.test.js
 * Exit 0 = all cases passed. Exit 1 = one or more failed.
 */

const assert = require("assert");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { spawnSync } = require("child_process");

const REPO_ROOT = path.resolve(__dirname, "..", "..");

const { consult } = require("./consult");
const { evaluate } = require("./eval");

// ── Test harness ───────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    process.stdout.write(`  PASS [${passed + failed + 1}]: ${name}\n`);
    passed++;
  } catch (e) {
    process.stdout.write(`  FAIL [${passed + failed + 1}]: ${name}\n    Error: ${e.message}\n`);
    failed++;
  }
}

// ── Case 1: consult() firewall — strips business-verb directive ────────────────
test(
  "consult() parses envelope and strips 'install' (business-verb → flagged non-empty)",
  () => {
    // Inject a fake dispatch that returns a canned envelope containing "install"
    // (a BUSINESS_VERB → classify returns verdict:'neutralize', stripped_directives:['install'])
    const fakeDispatch = () => ({
      ok: true,
      provider: "openai",
      model: "gpt-5.5",
      role: "consult",
      output: "Please install this package for better results.",
    });

    const result = consult({ promptText: "evaluate this skill", dispatch: fakeDispatch });

    assert.strictEqual(typeof result, "object", "result should be an object");
    assert.strictEqual(result.ok, true, `ok should be true, got ${result.ok}`);
    assert(
      Array.isArray(result.flagged) && result.flagged.length > 0,
      `flagged should be non-empty, got ${JSON.stringify(result.flagged)}`
    );
    // "install" should appear in flagged (either as the raw string or in a directive)
    const flaggedJoined = result.flagged.join(" ").toLowerCase();
    assert(
      flaggedJoined.includes("install") || result.flagged.some((f) => /install/i.test(f)),
      `flagged should contain 'install', got ${JSON.stringify(result.flagged)}`
    );
  }
);

// ── Case 2: evaluate() satisfies fixture pack → accept, arbitration_needed:false ──
test(
  "evaluate() on fixture-satisfying target → accept, arbitration_needed:false, record valid",
  () => {
    // Load the real fixture eval-pack from disk.
    const PATHS = JSON.parse(
      fs.readFileSync(path.join(REPO_ROOT, ".claude", "paths.json"), "utf8")
    );
    const packPath = path.join(
      REPO_ROOT,
      PATHS.etcEvalPacks,
      "etc-author.example.json"
    );
    const pack = JSON.parse(fs.readFileSync(packPath, "utf8"));

    // Target: the actual author.md skill file.
    const target = ".claude/commands/etc/author.md";

    // Inject a consult that returns positive for judgment dimensions.
    const fakeConsult = () => ({
      ok: true,
      critique: "The skill is well-organized, unambiguous, and consistent with the /etc namespace.",
      flagged: [],
    });

    const result = evaluate({ target, pack, consult: fakeConsult });

    assert.strictEqual(
      result.decision,
      "accept",
      `expected decision='accept', got '${result.decision}' (confidence=${result.confidence})`
    );
    assert.strictEqual(
      result.arbitration_needed,
      false,
      `arbitration_needed should be false, got ${result.arbitration_needed}`
    );
    assert(
      result.confidence >= 0.7,
      `confidence should be ≥0.7, got ${result.confidence}`
    );
    assert(
      result.record_path && fs.existsSync(result.record_path),
      `record_path should point to an existing file, got ${result.record_path}`
    );

    // Prove the emitted record passes validate-artifact.js (gate 3 / AC-2).
    const va = spawnSync(
      process.execPath,
      [
        path.join(REPO_ROOT, "scripts", "contracts", "validate-artifact.js"),
        result.record_path,
      ],
      { cwd: REPO_ROOT, encoding: "utf8", windowsHide: true }
    );
    assert.strictEqual(
      va.status,
      0,
      `validate-artifact.js should exit 0 for valid record, got ${va.status}\n${va.stderr || va.stdout}`
    );
  }
);

// ── Case 3: evaluate() with judgment dim and NO consult → arbitration_needed:true ──
test(
  "evaluate() with judgment dimension and no consult → arbitration_needed:true",
  () => {
    const PATHS = JSON.parse(
      fs.readFileSync(path.join(REPO_ROOT, ".claude", "paths.json"), "utf8")
    );
    const packPath = path.join(
      REPO_ROOT,
      PATHS.etcEvalPacks,
      "etc-author.example.json"
    );
    const pack = JSON.parse(fs.readFileSync(packPath, "utf8"));

    // Verify the pack has at least one judgment dimension (mechanical:false).
    const hasJudgment = pack.rubric.some((d) => d.mechanical === false);
    assert(
      hasJudgment,
      "fixture pack must have at least one judgment dimension (mechanical:false) for this test to be valid"
    );

    const target = ".claude/commands/etc/author.md";

    // NO consult provided → judgment dimension returns null → arbitration_needed:true.
    const result = evaluate({ target, pack, consult: null });

    assert.strictEqual(
      result.arbitration_needed,
      true,
      `arbitration_needed should be true when judgment dim has no consult, got ${result.arbitration_needed}`
    );
  }
);

// ── Case 4: malformed record is REJECTED by validate-artifact.js ──────────────
test(
  "deliberately malformed decision_record is REJECTED by validate-artifact.js (exit 1)",
  () => {
    // Malformed: missing required fields owner, rationale, precedence_basis,
    // confidence (wrong type: string), arbitration_needed.
    const malformed = {
      type: "decision_record",
      id: "test-malformed-" + Date.now(),
      decision: "accept",
      // missing: owner, rationale, precedence_basis, confidence, arbitration_needed
    };

    const tmpPath = path.join(
      os.tmpdir(),
      `etc-test-malformed-${Date.now()}.json`
    );
    fs.writeFileSync(tmpPath, JSON.stringify(malformed), "utf8");

    let vaStatus;
    try {
      const va = spawnSync(
        process.execPath,
        [
          path.join(REPO_ROOT, "scripts", "contracts", "validate-artifact.js"),
          tmpPath,
        ],
        { cwd: REPO_ROOT, encoding: "utf8", windowsHide: true }
      );
      vaStatus = va.status;
    } finally {
      try { fs.unlinkSync(tmpPath); } catch { /* best-effort cleanup */ }
    }

    assert.strictEqual(
      vaStatus,
      1,
      `validate-artifact.js should exit 1 (REJECTED) for malformed record, got exit ${vaStatus}`
    );
  }
);

// ── Report ─────────────────────────────────────────────────────────────────────
process.stdout.write(`\nResults: ${passed} passed, ${failed} failed out of ${passed + failed} tests\n`);
if (failed > 0) {
  process.stdout.write("FAIL\n");
  process.exit(1);
} else {
  process.stdout.write("PASS\n");
  process.exit(0);
}
