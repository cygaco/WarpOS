#!/usr/bin/env node
"use strict";

/**
 * test-hook-points.js — bite-test for the sprint hook-point registry reader + router
 * (scripts/sprint/hook-points.js, Phase D F1+F2).
 *
 * The load-bearing test is the INTEGRATION one: the SHIPPED sprint-hook-points.json
 * must validate against the REAL role-registry.json (every row's role exists, every
 * step canonical, no orphan step) — so a roster rename that breaks a row fails here.
 * Plus pure-unit coverage of condition matching, the composition->agent-set router,
 * and the validator's negative cases.
 *
 *   node scripts/sprint/test-hook-points.js
 */

const {
  STEPS,
  load,
  loadRoleIds,
  normalizeComposition,
  matchCondition,
  agentsForStep,
  validate,
} = require("./hook-points");

let passes = 0;
let failures = 0;
function ok(name, cond, detail) {
  if (cond) {
    passes++;
    console.log(`  ok  ${name}`);
  } else {
    failures++;
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

// ── INTEGRATION: the shipped registry validates against the real roster ───────

console.log("Integration (shipped registry ↔ real role-registry):");
let REG;
{
  let roleIds;
  try {
    REG = load();
    roleIds = loadRoleIds();
  } catch (e) {
    ok("load() + loadRoleIds() read the real files", false, e.message);
    console.log(`\nResults: ${passes} passed, ${failures} failed.`);
    process.exit(1);
  }
  ok("loadRoleIds() returns a non-trivial roster", Array.isArray(roleIds) && roleIds.length >= 15, `got ${roleIds && roleIds.length}`);
  const res = validate(REG, roleIds);
  ok("shipped sprint-hook-points.json VALIDATES against role-registry", res.ok, (res.errors || []).join(" | "));
  ok("every shipped row's role is a real role id", res.ok || !res.errors.some((e) => /not in role-registry/.test(e)), (res.errors || []).join(" | "));
}

// ── matchCondition (pure) ─────────────────────────────────────────────────────

console.log("\nmatchCondition:");
const fe = normalizeComposition({ unit_types: ["frontend"], max_risk: "high", domains: [] });
const be = normalizeComposition({ unit_types: ["backend"], max_risk: "low", domains: [] });
const mk = normalizeComposition({ unit_types: ["backend"], max_risk: "low", domains: ["marketing"] });
ok("'always' → true", matchCondition("always", fe) === true);
ok("unit_type match → true", matchCondition({ unit_type: ["frontend", "ui"] }, fe) === true);
ok("unit_type miss → false", matchCondition({ unit_type: ["backend"] }, fe) === false);
ok("risk_min met (high ≥ medium) → true", matchCondition({ risk_min: "medium" }, fe) === true);
ok("risk_min unmet (low < medium) → false", matchCondition({ risk_min: "medium" }, be) === false);
ok("risk_min with unknown composition risk → false (must declare)", matchCondition({ risk_min: "medium" }, normalizeComposition({})) === false);
ok("domain match → true", matchCondition({ domain: ["marketing", "copy"] }, mk) === true);
ok("domain miss → false", matchCondition({ domain: ["marketing"] }, be) === false);

// ── agentsForStep (the router) against the real registry ──────────────────────

console.log("\nagentsForStep (router, real registry):");
{
  const plan = agentsForStep("plan", {}, REG).map((r) => r.role);
  ok("plan (any comp) → director-of-product + product-lead", plan.includes("director-of-product") && plan.includes("product-lead"), plan.join(","));
  ok("plan rows are order-sorted", plan[0] === "director-of-product", plan.join(","));

  const designFE = agentsForStep("design", { unit_types: ["frontend"], max_risk: "high" }, REG).map((r) => r.role);
  ok("design(FE,high) includes product-lead (always)", designFE.includes("product-lead"), designFE.join(","));
  ok("design(FE,high) includes director-of-engineering (code)", designFE.includes("director-of-engineering"), designFE.join(","));
  ok("design(FE,high) includes design-lead (UI)", designFE.includes("design-lead"), designFE.join(","));
  ok("design(FE,high) includes quality-lead (risk≥med)", designFE.includes("quality-lead"), designFE.join(","));
  ok("design(FE,high) EXCLUDES copy-lead (no marketing domain)", !designFE.includes("copy-lead"), designFE.join(","));

  const designLowNoUI = agentsForStep("design", { unit_types: ["backend"], max_risk: "low" }, REG).map((r) => r.role);
  ok("design(BE,low) EXCLUDES design-lead + quality-lead", !designLowNoUI.includes("design-lead") && !designLowNoUI.includes("quality-lead"), designLowNoUI.join(","));

  const buildBE = agentsForStep("build", { unit_types: ["backend"] }, REG).map((r) => r.role);
  ok("build(BE) → backend-builder only", buildBE.length === 1 && buildBE[0] === "backend-builder", buildBE.join(","));

  const gauntletFE = agentsForStep("gauntlet", { unit_types: ["frontend"] }, REG).map((r) => r.role);
  ok("gauntlet(FE) includes qa-reviewer + security-reviewer (always)", gauntletFE.includes("qa-reviewer") && gauntletFE.includes("security-reviewer"), gauntletFE.join(","));
  ok("gauntlet(FE) includes frontend-reviewer + visual-review + design-quality (UI)", ["frontend-reviewer", "visual-review", "design-quality"].every((x) => gauntletFE.includes(x)), gauntletFE.join(","));
  ok("gauntlet(FE) EXCLUDES backend-reviewer", !gauntletFE.includes("backend-reviewer"), gauntletFE.join(","));
}

// ── validate negative cases (synthetic) ───────────────────────────────────────

console.log("\nvalidate negative cases:");
const REAL_IDS = ["product-lead", "qa-reviewer", "frontend-builder", "director-of-product", "director-of-engineering", "design-lead", "quality-lead", "copy-lead", "backend-builder", "security-builder", "frontend-reviewer", "backend-reviewer", "security-reviewer", "visual-review", "design-quality", "learner"];
// A complete, valid baseline covering all 6 steps, then we corrupt copies of it.
function baselineRows() {
  return [
    { role: "product-lead", step: "plan", condition: "always", mode: "advisory", order: 10 },
    { role: "product-lead", step: "design", condition: "always", mode: "block", order: 10 },
    { role: "frontend-builder", step: "build", condition: { unit_type: ["frontend"] }, mode: "block", order: 10 },
    { role: "qa-reviewer", step: "gauntlet", condition: "always", mode: "block", order: 10 },
    { role: "qa-reviewer", step: "release", condition: "always", mode: "block", order: 10 },
    { role: "learner", step: "retro", condition: "always", mode: "advisory", order: 10 },
  ];
}
{
  ok("baseline (all 6 steps) is valid", validate({ rows: baselineRows() }, REAL_IDS).ok);

  const unknownRole = baselineRows();
  unknownRole.push({ role: "ghost-agent", step: "plan", condition: "always", mode: "advisory", order: 99 });
  const r1 = validate({ rows: unknownRole }, REAL_IDS);
  ok("unknown role → FAIL", !r1.ok && r1.errors.some((e) => /not in role-registry/.test(e)));

  const badStep = baselineRows();
  badStep[0] = { ...badStep[0], step: "deploy" };
  ok("non-canonical step → FAIL", !validate({ rows: badStep }, REAL_IDS).ok);

  const badMode = baselineRows();
  badMode[0] = { ...badMode[0], mode: "maybe" };
  ok("bad mode → FAIL", validate({ rows: badMode }, REAL_IDS).errors.some((e) => /mode/.test(e)));

  const badCond = baselineRows();
  badCond[0] = { ...badCond[0], condition: { nonsense: true } };
  ok("malformed condition → FAIL", validate({ rows: badCond }, REAL_IDS).errors.some((e) => /malformed condition/.test(e)));

  const badRisk = baselineRows();
  badRisk[0] = { ...badRisk[0], condition: { risk_min: "extreme" } };
  ok("unknown risk_min → FAIL", validate({ rows: badRisk }, REAL_IDS).errors.some((e) => /unknown risk_min/.test(e)));

  const orphan = baselineRows().filter((r) => r.step !== "retro"); // drop retro
  ok("orphan step (retro missing) → FAIL", validate({ rows: orphan }, REAL_IDS).errors.some((e) => /orphan step/.test(e)));

  ok("rows not an array → FAIL", !validate({ rows: "nope" }, REAL_IDS).ok);
}

console.log(`\nResults: ${passes} passed, ${failures} failed.`);
process.exit(failures === 0 ? 0 : 1);
