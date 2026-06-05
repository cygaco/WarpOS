#!/usr/bin/env node
"use strict";

/**
 * test-sprint-hook-coverage.js — bite-test for scan:sprint-hook-coverage (Phase D F3c).
 * Proves: FORWARD coverage flags a matched block-row with no consult record, passes when
 * all block agents ran, treats advisory-not-run as info (not a finding), and exempts
 * pre-cutoff / synthetic / undated / no-run sprints. REVERSE delegates to
 * hook-points.validate (real registry coherent; a broken registry fails).
 *
 *   node scripts/checks/test-sprint-hook-coverage.js
 */

const { computeFindings, reverseCoverage } = require("./sprint-hook-coverage");
const hookPoints = require("../sprint/hook-points");

let passes = 0, failures = 0;
function ok(name, cond, detail) {
  if (cond) { passes++; console.log(`  ok  ${name}`); }
  else { failures++; console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ""}`); }
}

// gauntlet-only synthetic registry → controls the forward logic deterministically.
const REG = {
  rows: [
    { role: "qa-reviewer", step: "gauntlet", condition: "always", mode: "block", order: 10 },
    { role: "frontend-reviewer", step: "gauntlet", condition: { unit_type: ["frontend"] }, mode: "block", order: 20 },
    { role: "design-quality", step: "gauntlet", condition: { unit_type: ["frontend"] }, mode: "advisory", order: 30 },
  ],
};
const FE = { unit_types: ["frontend"], max_risk: "high", domains: [] };
const run = (sid) => ({ cat: "audit", sprint_id: sid, data: { kind: "sprint_full_phase_started" } });
const consult = (sid, mgr) => ({ cat: "manager_consult", sprint_id: sid, data: { manager: mgr, verdict: "consulted" } });

// ── FORWARD ───────────────────────────────────────────────────────────────────

console.log("FORWARD coverage:");
{
  // all block agents ran (qa-reviewer + frontend-reviewer); design-quality advisory absent
  const events = [run("SP-A"), consult("SP-A", "qa-reviewer"), consult("SP-A", "frontend-reviewer")];
  const r = computeFindings(events, REG, { "SP-A": FE }, { "SP-A": "2026-06-06" }, "2026-06-05");
  ok("all block agents ran → 0 findings", r.findings.length === 0, JSON.stringify(r.findings));
  ok("advisory-not-run (design-quality) → info, not a finding", r.info.some((i) => i.role === "design-quality"));
  ok("sprint counted applicable+checked", r.applicable === 1 && r.checked === 1);
}
{
  // qa-reviewer (block, always) NEVER consulted → forward gap
  const events = [run("SP-B"), consult("SP-B", "frontend-reviewer")];
  const r = computeFindings(events, REG, { "SP-B": FE }, { "SP-B": "2026-06-06" }, "2026-06-05");
  ok("missing block agent → finding", r.findings.length === 1 && r.findings[0].role === "qa-reviewer", JSON.stringify(r.findings));
  ok("finding_type missing_block_agent", r.findings[0].finding_type === "missing_block_agent");
}

// ── EXEMPTIONS ──────────────────────────────────────────────────────────────

console.log("\nexemptions:");
{
  // pre-cutoff
  const r = computeFindings([run("SP-C"), consult("SP-C", "frontend-reviewer")], REG, { "SP-C": FE }, { "SP-C": "2026-06-01" }, "2026-06-05");
  ok("pre-cutoff sprint exempt (not applicable)", r.applicable === 0 && r.findings.length === 0);
}
{
  // synthetic
  const r = computeFindings([run("SP-J1"), consult("SP-J1", "frontend-reviewer")], REG, { "SP-J1": FE }, { "SP-J1": "2026-06-06" }, "2026-06-05");
  ok("synthetic sprint (SP-J*) exempt", r.applicable === 0);
}
{
  // undated
  const r = computeFindings([run("SP-D"), consult("SP-D", "frontend-reviewer")], REG, { "SP-D": FE }, {}, "2026-06-05");
  ok("undated sprint exempt (undatedExempt)", r.applicable === 0 && r.undatedExempt === 1);
}
{
  // no run marker (consult only) → not an attributed /sprint:full run
  const r = computeFindings([consult("SP-E", "frontend-reviewer")], REG, { "SP-E": FE }, { "SP-E": "2026-06-06" }, "2026-06-05");
  ok("consult without a run marker → not applicable", r.applicable === 0);
}

// ── REVERSE (registry coherence) ──────────────────────────────────────────────

console.log("\nREVERSE coverage:");
{
  const realReg = hookPoints.load();
  const realIds = hookPoints.loadRoleIds();
  ok("shipped registry is structurally coherent", reverseCoverage(realReg, realIds).ok);
  const broken = { rows: [{ role: "ghost", step: "plan", condition: "always", mode: "block", order: 1 }] };
  ok("broken registry (unknown role + orphan steps) → FAIL", !reverseCoverage(broken, realIds).ok);
}

console.log(`\nResults: ${passes} passed, ${failures} failed.`);
process.exit(failures === 0 ? 0 : 1);
