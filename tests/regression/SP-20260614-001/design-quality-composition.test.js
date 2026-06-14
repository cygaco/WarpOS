#!/usr/bin/env node
"use strict";

/**
 * tests/regression/SP-20260614-001/design-quality-composition.test.js
 *
 * AC-design (SP-20260614-001 / S-5 R-6): the design-quality-gate is wired into
 * sprint-composition in REPORT-ONLY mode. Proves the resolver (epsilon-runtime#planStep)
 * composes design-quality into the GAUNTLET step whenever the sprint's unit_types include
 * frontend (or ui), as REPORT-ONLY (advisory; present + runs, does NOT gate) — and does
 * NOT compose it for a pure-backend sprint.
 *
 * Drives the resolver against BOTH the real on-disk registry (load()) AND a synthetic
 * registry (the declarative seam), so the test fails loudly if either the registry row or
 * the resolver wiring regresses. Pure — no spawn, no disk write.
 *
 *   node tests/regression/SP-20260614-001/design-quality-composition.test.js
 */

const path = require("path");
const rt = require("../../../scripts/sprint/epsilon-runtime");
const hookPoints = require("../../../scripts/sprint/hook-points");

// Resolve the registry RELATIVE TO THIS REPO ROOT (the file under change), not via the
// runtime's SPRINT.PROJECT cwd-rescue — which, when running inside an isolation worktree,
// points hookPoints.load() at the CANONICAL copy, not the worktree edit (the documented
// stale-worktree-cwd hazard). The repo root is four levels up from this test file
// (tests/regression/SP-20260614-001/ -> repo root). Post-merge this resolves to the same
// canonical path, so the test is correct in both locations.
const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");
const REGISTRY_PATH = path.join(REPO_ROOT, ".claude", "agents", "_org", "sprint-hook-points.json");
const REGISTRY = hookPoints.load(REGISTRY_PATH);

let passed = 0;
let failed = 0;
function ok(name, cond, detail) {
  if (cond) {
    passed++;
    console.log(`  ok  ${name}`);
  } else {
    failed++;
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

const FRONTEND = { unit_types: ["frontend", "backend"], max_risk: "medium", domains: ["product"] };
const UI_ONLY = { unit_types: ["ui"], max_risk: "low", domains: [] };
const BACKEND_ONLY = { unit_types: ["backend"], max_risk: "medium", domains: [] };

// Inject the worktree registry (REGISTRY) so planStep resolves against the file under
// change, not the cwd-rescued canonical copy. roles still come from the runtime default
// (role-registry membership is not what this ticket changes).
function gauntletFor(comp) {
  return rt.planStep("gauntlet", comp, { registry: REGISTRY });
}
function agent(step, role) {
  return step.agents.find((a) => a.role === role);
}

console.log("design-quality-composition (SP-20260614-001 AC-design) — REPORT-ONLY wiring");

// ── 1. A frontend sprint's resolved gauntlet INCLUDES design-quality in report-only/advisory ──
{
  const g = gauntletFor(FRONTEND);
  const dq = agent(g, "design-quality");
  ok("frontend-gauntlet-includes-design-quality", !!dq, "design-quality absent from frontend gauntlet roster");
  ok("design-quality-is-report-only", !!dq && dq.report_only === true, dq && `report_only=${dq.report_only}`);
  ok("design-quality-mode-advisory", !!dq && dq.mode === "advisory", dq && `mode=${dq.mode}`);
  // REPORT-ONLY contract: present + runs, but does NOT gate (not in block_roles).
  ok(
    "design-quality-does-not-gate",
    !g.block_roles.includes("design-quality"),
    `block_roles=[${g.block_roles.join(", ")}]`,
  );
  ok(
    "design-quality-in-report-only-roster",
    g.report_only_roles.includes("design-quality"),
    `report_only_roles=[${g.report_only_roles.join(", ")}]`,
  );
}

// ── 2. A UI-only sprint ALSO composes design-quality report-only (unit_type:["ui","frontend"]) ──
{
  const g = gauntletFor(UI_ONLY);
  const dq = agent(g, "design-quality");
  ok("ui-only-gauntlet-includes-design-quality", !!dq, "design-quality absent for ui-only sprint");
  ok("ui-only-design-quality-report-only", !!dq && dq.report_only === true && dq.mode === "advisory");
}

// ── 3. A pure-backend sprint's gauntlet does NOT include design-quality ──
{
  const g = gauntletFor(BACKEND_ONLY);
  const dq = agent(g, "design-quality");
  ok("backend-only-gauntlet-excludes-design-quality", !dq, dq && "design-quality wrongly composed for pure-backend");
  ok(
    "backend-only-report-only-roster-empty-of-design-quality",
    !g.report_only_roles.includes("design-quality"),
    `report_only_roles=[${g.report_only_roles.join(", ")}]`,
  );
}

// ── 4. The on-disk registry actually carries the report_only declaration (declarative source) ──
{
  const row = (REGISTRY.rows || []).find((r) => r.role === "design-quality" && r.step === "gauntlet");
  ok("registry-has-design-quality-gauntlet-row", !!row, "no design-quality@gauntlet row in registry");
  ok("registry-row-report-only-true", !!row && row.report_only === true, row && `report_only=${row.report_only}`);
  // Belt-and-braces: report-only is ALSO advisory so it cannot gate even if mode were flipped.
  ok("registry-row-mode-advisory", !!row && row.mode === "advisory", row && `mode=${row.mode}`);
}

// ── 5. Belt-and-braces: a report_only row is excluded from block_roles even if mode=block ──
{
  const synthetic = {
    rows: [
      { role: "design-quality", step: "gauntlet", condition: { unit_type: ["frontend"] }, mode: "block", report_only: true, order: 60 },
      { role: "qa-reviewer", step: "gauntlet", condition: "always", mode: "block", order: 30 },
    ],
  };
  const roles = {
    "design-quality": { provider: "claude", model: "claude-opus-4-8", kind: "reviewer", claude_pinned: true, home: "product" },
    "qa-reviewer": { provider: "openai", model: "gpt-5.5", kind: "reviewer", home: "product" },
  };
  const g = rt.planStep("gauntlet", FRONTEND, { registry: synthetic, roles });
  ok(
    "report-only-row-never-gates-even-if-mode-block",
    !g.block_roles.includes("design-quality") && g.report_only_roles.includes("design-quality"),
    `block_roles=[${g.block_roles.join(", ")}] report_only_roles=[${g.report_only_roles.join(", ")}]`,
  );
}

console.log(`\n${failed === 0 ? "PASS" : "FAIL"} — ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
