#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// mode-getmode.test.js — S-LC-01 / S-1. Regression coverage for the getMode
// sprint-case fix + the isSprint export + the higgsfield-spend-gate audit.
//
// getMode()/isSprint() read .claude/runtime/mode.json under PROJECT
// (= CLAUDE_PROJECT_DIR). PROJECT is captured at module load, so each case runs
// in a SEALED subprocess with its own CLAUDE_PROJECT_DIR temp dir (the same
// isolation the team-guard suites use). The gate audit runs in-process via the
// exported evaluate() with injected deps.
//   AC-1.1 getMode-sprint-case   AC-1.2 isSprint-export   AC-1.3 higgsfield-sprint-safe
// ─────────────────────────────────────────────────────────────────────────────
"use strict";

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..", "..", "..");
const MODE_JS = path.join(ROOT, "scripts", "hooks", "lib", "mode.js");
const GATE_JS = path.join(ROOT, "scripts", "checks", "higgsfield-spend-gate.js");

let pass = 0;
let fail = 0;
function ok(name, fn) {
  try {
    fn();
    pass++;
    console.log(`  ok  ${name}`);
  } catch (e) {
    fail++;
    console.log(`FAIL  ${name}\n      ${e.message}`);
  }
}

// Resolve mode.js in a sealed PROJECT whose mode.json carries `modeValue`
// (or none if null). Returns { mode, isAdhoc, isOneshot, isSprint, isSolo }.
function resolveModeWith(modeValue) {
  const proj = fs.mkdtempSync(path.join(os.tmpdir(), "mgm-"));
  fs.mkdirSync(path.join(proj, ".claude", "runtime"), { recursive: true });
  if (modeValue !== null) {
    fs.writeFileSync(
      path.join(proj, ".claude", "runtime", "mode.json"),
      JSON.stringify({ mode: modeValue }),
    );
  }
  const code =
    `const m = require(${JSON.stringify(MODE_JS)});` +
    `process.stdout.write(JSON.stringify({` +
    `mode: m.getMode(), isAdhoc: m.isAdhoc(), isOneshot: m.isOneshot(),` +
    `isSprint: m.isSprint(), isSolo: m.isSolo(),` +
    `hasIsSprint: typeof m.isSprint === "function"}));`;
  const r = spawnSync("node", ["-e", code], {
    env: { ...process.env, CLAUDE_PROJECT_DIR: proj },
    encoding: "utf8",
  });
  if (r.status !== 0) {
    throw new Error(`subprocess failed (${r.status}): ${r.stderr || r.stdout}`);
  }
  return JSON.parse(r.stdout);
}

// AC-1.1 — the core fix: mode.json:{mode:"sprint"} resolves to "sprint",
// not the old "solo" fallthrough.
ok("getMode-sprint-case", () => {
  const r = resolveModeWith("sprint");
  assert.strictEqual(r.mode, "sprint", 'getMode() must return "sprint"');
});

// AC-1.2 — isSprint export: true under sprint, false elsewhere; the other
// predicates are unchanged (exactly one is true per mode).
ok("isSprint-export", () => {
  const sprint = resolveModeWith("sprint");
  assert.strictEqual(sprint.hasIsSprint, true, "isSprint must be exported");
  assert.strictEqual(sprint.isSprint, true, "isSprint() true under sprint");
  assert.strictEqual(sprint.isAdhoc, false);
  assert.strictEqual(sprint.isOneshot, false);
  assert.strictEqual(sprint.isSolo, false);

  for (const m of ["adhoc", "oneshot", "solo"]) {
    const r = resolveModeWith(m);
    assert.strictEqual(r.isSprint, false, `isSprint() false under ${m}`);
    assert.strictEqual(r.mode, m, `getMode() unchanged for ${m}`);
  }
  // missing marker still defaults to solo (legacy behavior preserved)
  const none = resolveModeWith(null);
  assert.strictEqual(none.mode, "solo", "missing marker => solo (unchanged)");
  assert.strictEqual(none.isSprint, false);
});

// AC-1.3 — higgsfield audit: with getMode()=="sprint" now resolvable, the gate
// must NOT regress. The gate branches ONLY on mode==="oneshot"
// (higgsfield-spend-gate.js:138); every other mode (incl. "sprint") falls to the
// conservative cap-and-defer path — identical to the pre-fix "solo" fallthrough.
ok("higgsfield-sprint-safe", () => {
  const { evaluate } = require(GATE_JS);
  const cost = () => ({ usd: 3, credits: 1 }); // two ops => $6 total
  const ops = [{ jst: "a" }, { jst: "b" }];

  // sprint (via the injected modeFn — the production getMode() path): cap-and-
  // defer admits the leading prefix < $5 and parks the rest. NO oneshot
  // arbitration, NO whole-set block.
  const sprint = evaluate({ ops }, { mode: () => "sprint", cost });
  assert.strictEqual(sprint.mode, "sprint", "mode label flows through");
  assert.strictEqual(sprint.decision, "allow", "sprint clears the < $5 prefix");
  assert.strictEqual(sprint.allowed.length, 1, "first $3 op admitted");
  assert.strictEqual(sprint.deferred.length, 1, "second $3 op parked (>= $5 cap)");

  // Contrast: oneshot judges the whole fan-out as a unit — $6 total => BLOCK
  // (needs approval/arbitration). Proves "sprint" took the SAFE non-oneshot
  // branch (same as solo/adhoc), not the relaxed oneshot path.
  const oneshot = evaluate(
    { ops, mode: "oneshot" },
    { cost, approvalPresent: () => false, emit: () => true },
  );
  assert.strictEqual(oneshot.decision, "block", "oneshot blocks the >= $5 set");
  assert.notStrictEqual(
    sprint.decision,
    oneshot.decision,
    "sprint must not inherit oneshot's whole-set semantics",
  );
});

console.log(`\nmode-getmode: ${pass}/${pass + fail} pass`);
process.exit(fail ? 1 : 0);
