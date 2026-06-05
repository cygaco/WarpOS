#!/usr/bin/env node
"use strict";

/**
 * scripts/sprint/epsilon-wiring.test.js — proves the full.js ↔ ε-runtime wiring is
 * ADDITIVE: the ε-conducted path emits the SAME manager_consult coverage the script-driven
 * path does (so every existing enforcer keeps seeing the records), and only ADDS real
 * dispatch records on top. The default (script) path stays unchanged.
 *
 * In-memory only — the conductStep/emitStepConsults logFn seam captures emissions; no disk,
 * no canonical-ledger write. (ADR-0009.)
 *
 *   node scripts/sprint/epsilon-wiring.test.js
 */

const hookConsult = require("./hook-consult");
const epsilonRuntime = require("./epsilon-runtime");

let passed = 0;
let failed = 0;
function ok(name, cond, detail) {
  if (cond) { passed++; console.log(`  ok  ${name}`); }
  else { failed++; console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ""}`); }
}

// A representative UI+backend composition (the case ED-022 cares about — design authority).
const COMP = { unit_types: ["ui", "backend"], max_risk: "high", domains: [] };
const SPRINT_ID = "SP-TEST-E7-WIRING";

// Capture what the SCRIPT path (hookConsult directly) emits for the execute phase steps
// (build + gauntlet), the same steps full.js#emitPhaseConsults drives for 'execute'.
function scriptPathEmissions() {
  const got = [];
  const logFn = (cat, data) => got.push({ cat, ...data });
  for (const step of ["build", "gauntlet"]) hookConsult.emitStepConsults(step, COMP, SPRINT_ID, logFn);
  hookConsult.emitDesignTouch(COMP, SPRINT_ID, logFn);
  return got;
}

// Capture what the ε path (conductStep) emits for the same steps.
function epsilonPathEmissions(dispatch) {
  const got = [];
  const logFn = (cat, data) => got.push({ cat, ...data });
  const dispatched = [];
  for (const step of ["build", "gauntlet"]) {
    const out = epsilonRuntime.conductStep(step, COMP, SPRINT_ID, { logFn, dispatch });
    dispatched.push(...out.dispatched);
  }
  return { got, dispatched };
}

const managers = (emissions) =>
  emissions.filter((e) => e.cat === "manager_consult").map((e) => e.manager).sort();
const hasDesignTouch = (emissions) =>
  emissions.some((e) => e.kind === "sprint_full_design_touch" && e.ui_touched === true);

console.log("(1) the ε path emits the SAME manager_consult coverage as the script path:");
{
  const script = scriptPathEmissions();
  const eps = epsilonPathEmissions(false).got;
  ok("manager sets are identical", JSON.stringify(managers(script)) === JSON.stringify(managers(eps)),
    `script=${managers(script).join(",")} | eps=${managers(eps).join(",")}`);
  ok("both emit the design-quality consult (ED-022 design authority)", managers(eps).includes("design-quality"));
  ok("both emit the ui_touched design-touch (ED-022 signal)", hasDesignTouch(script) && hasDesignTouch(eps));
}

console.log("\n(2) plan-only ε conduct adds NO dispatch records (coverage only):");
{
  const { dispatched } = epsilonPathEmissions(false);
  ok("no completion records written in plan-only mode", dispatched.length === 0);
}

console.log("\n(3) the design-touch loop is non-circular: a backend-only sprint emits none:");
{
  const got = [];
  const logFn = (cat, data) => got.push({ cat, ...data });
  for (const step of ["build", "gauntlet"]) epsilonRuntime.conductStep(step, { unit_types: ["backend"], max_risk: "low", domains: [] }, SPRINT_ID, { logFn, dispatch: false });
  ok("backend-only ε conduct emits NO design-touch", !hasDesignTouch(got));
  ok("backend-only ε conduct still emits the qa/security consults", managers(got).includes("qa-reviewer") && managers(got).includes("security-reviewer"));
}

console.log(`\nResults: ${passed} passed, ${failed} failed.`);
process.exit(failed === 0 ? 0 : 1);
