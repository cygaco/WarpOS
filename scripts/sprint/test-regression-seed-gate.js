#!/usr/bin/env node
/**
 * scripts/sprint/test-regression-seed-gate.js
 *
 * SP-20260528-001 / 0.17.0 per-sprint enforcer. Verifies the sprint-close
 * regression-seed gate (release.js#regressionSeedGate) maps the enforcer's
 * verdict to the correct exit code, and that the contract is bypass-proof and
 * fails CLOSED (a NEW regression OR a runner error both block; a broken suite
 * is never a clean pass).
 *
 * Closes the BC-15 aspirational-vs-enforced gap captured in commit 5870a0c:
 * the regression-seed enforcer existed only at /warp:release (release-gates.js)
 * and not at sprint close. The gate now lives in release.js cmdPrepare — the
 * single chokepoint both /sprint:full (phase 4 calls `release.js prepare`) and
 * standalone /sprint:release pass through.
 *
 * Tests (verdict → exit code):
 *   A. enforced clean (exit 0)          → gate 0  (proceed)
 *   B. product opt-in no-op (exit 0)    → gate 0  (proceed; downstream safe)
 *   C. NEW regression (exit 1)          → gate 3  (block; sentinel for phase 4)
 *   D. runner error (exit 2)            → gate 3  (block; fail closed)
 *   E. enforcer throws                  → gate 3  (block; fail closed)
 *   F. live enforcer in clean canonical → gate 0  (real wiring, no injection)
 *   G. full.js phase 4 maps exit 3 → regression_seed_failed halt (source check)
 */

"use strict";

const fs = require("fs");
const path = require("path");

const release = require("./release");

let pass = 0;
let fail = 0;

function ok(name, cond, detail) {
  if (cond) {
    process.stdout.write(`  ok  ${name}\n`);
    pass++;
  } else {
    process.stderr.write(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}\n`);
    fail++;
  }
}

// Silence the gate's own stdout/stderr chatter during the verdict-mapping tests
// so the test output stays readable. Restored after each call.
function quiet(fn) {
  const so = process.stdout.write.bind(process.stdout);
  const se = process.stderr.write.bind(process.stderr);
  process.stdout.write = () => true;
  process.stderr.write = () => true;
  try {
    return fn();
  } finally {
    process.stdout.write = so;
    process.stderr.write = se;
  }
}

const stub = (verdict) => () => verdict;

// A. enforced clean → 0
{
  const ex = quiet(() =>
    release.regressionSeedGate(stub({ enforced: true, role: "canonical", exit: 0, summary: { passing: 14, runnable: 16 } })),
  );
  ok("A: enforced clean verdict → gate exit 0", ex === 0, `got ${ex}`);
}

// B. product opt-in no-op → 0 (enforced:false; downstream repos must not block)
{
  const ex = quiet(() =>
    release.regressionSeedGate(stub({ enforced: false, role: "product", exit: 0, mode: "opt-in" })),
  );
  ok("B: product opt-in no-op → gate exit 0", ex === 0, `got ${ex}`);
}

// C. NEW regression → 3 (block; the sentinel /sprint:full phase 4 maps)
{
  const ex = quiet(() =>
    release.regressionSeedGate(
      stub({ enforced: true, role: "canonical", exit: 1, regressions: 2, offending: [{ id: "BC-02", name: "x", exit: 1 }] }),
    ),
  );
  ok("C: NEW regression (exit 1) → gate exit 3 (block)", ex === 3, `got ${ex}`);
}

// D. runner error → 3 (fail closed — a broken suite is not a clean pass)
{
  const ex = quiet(() =>
    release.regressionSeedGate(stub({ enforced: true, role: "canonical", exit: 2, error: "run.js produced no parseable JSON" })),
  );
  ok("D: runner error (exit 2) → gate exit 3 (fail closed)", ex === 3, `got ${ex}`);
}

// E. enforcer throws → 3 (fail closed)
{
  const ex = quiet(() =>
    release.regressionSeedGate(() => {
      throw new Error("module blew up");
    }),
  );
  ok("E: enforcer throws → gate exit 3 (fail closed)", ex === 3, `got ${ex}`);
}

// F. live enforcer, no injection — exercises the real require("../testsuite/enforce")
//    wiring. In a clean canonical checkout this must be 0; if the suite is
//    legitimately red, this is allowed to be 3 (still a correct gate result) —
//    so accept {0,3} but never anything else, and never a throw.
{
  let ex;
  let threw = false;
  try {
    ex = quiet(() => release.regressionSeedGate());
  } catch (e) {
    threw = true;
  }
  ok("F: live enforcer wires through (no throw)", !threw);
  ok("F: live enforcer returns a valid gate code (0 or 3)", ex === 0 || ex === 3, `got ${ex}`);
}

// G. full.js phase 4 maps the exit-3 sentinel to a dedicated halt. Source-level
//    check (running phase 4 needs a full sprint fixture): the mapping must exist.
{
  const fullSrc = fs.readFileSync(path.join(__dirname, "full.js"), "utf8");
  const mapsSentinel = /prepRes\.code === 3/.test(fullSrc);
  const namesHalt = /halt_reason:\s*["']regression_seed_failed["']/.test(fullSrc);
  ok("G: full.js phase 4 recognizes the exit-3 sentinel", mapsSentinel);
  ok("G: full.js phase 4 emits a regression_seed_failed halt_reason", namesHalt);
}

// H. product repo (no injection) no-ops BEFORE require → gate 0
//    Exercises the new product-repo guard: when WARPOS_REPO_ROLE=consumer the gate
//    must return 0 WITHOUT requiring ../testsuite/enforce (which is absent in
//    product repos). Uses the env override that resolveRepoRole() honors.
//    Saves/restores the env var so it cannot leak into F (which already ran) or
//    any downstream test.
{
  const prev = process.env.WARPOS_REPO_ROLE;
  let ex;
  let threw = false;
  try {
    process.env.WARPOS_REPO_ROLE = "consumer";
    ex = quiet(() => release.regressionSeedGate()); // NO injection — production path
  } catch (e) {
    threw = true;
  } finally {
    if (prev === undefined) {
      delete process.env.WARPOS_REPO_ROLE;
    } else {
      process.env.WARPOS_REPO_ROLE = prev;
    }
  }
  ok("H: product repo (no injection) no-ops before require → gate 0", !threw && ex === 0, `threw=${threw} exit=${ex}`);
}

// ── Summary ─────────────────────────────────────────────────────────

process.stdout.write(`\n${pass} pass / ${fail} fail\n`);
process.exit(fail === 0 ? 0 : 1);
