#!/usr/bin/env node
"use strict";

/**
 * scripts/sprint/hook-points.js — the sprint hook-point REGISTRY reader + the
 * composition->agent-set router (Phase D foundation, F1+F2).
 *
 * Reads .claude/agents/_org/sprint-hook-points.json (paths.sprintHookPoints) — the
 * declarative { role, step, condition, mode, order } attachment rows — and answers the
 * one question the sprint orchestrator (epsilon) asks at every lifecycle step:
 * "which agents fire at <step> given THIS sprint's composition?". Adding/swapping an
 * agent is a registry ROW edit, never an orchestrator edit (the design's keystone:
 * switching an agent = a registry edit, never a spec/skill edit).
 *
 * `role` references .claude/agents/_org/role-registry.json (paths.orgRoleRegistry) by
 * id; validate() asserts every row's role exists there, every step is a canonical
 * lifecycle step, and no step is orphaned — the tripwire that keeps the registry
 * honest, paired with the bidirectional scan:sprint-hook-coverage enforcer.
 *
 *   node scripts/sprint/hook-points.js validate
 *   node scripts/sprint/hook-points.js for-step design \
 *        --composition '{"unit_types":["frontend"],"max_risk":"high","domains":[]}'
 */

const fs = require("fs");
const path = require("path");
const SPRINT = require("./paths"); // require first: runs the worktree CLAUDE_PROJECT_DIR rescue
const { PATHS } = require("../hooks/lib/paths");

// The canonical sprint lifecycle hook-points (finer-grained than full.js PHASES:
// build+gauntlet both land in full.js 'execute'; release in 'release-prep').
const STEPS = Object.freeze(["plan", "design", "build", "gauntlet", "release", "retro"]);
const RISK_ORDER = Object.freeze({ low: 1, medium: 2, high: 3, critical: 4 });
const MODES = Object.freeze(["block", "advisory"]);

function hookPointsPath() {
  return (
    PATHS.sprintHookPoints ||
    path.join(SPRINT.PROJECT, ".claude", "agents", "_org", "sprint-hook-points.json")
  );
}
function roleRegistryPath() {
  return (
    PATHS.orgRoleRegistry ||
    path.join(SPRINT.PROJECT, ".claude", "agents", "_org", "role-registry.json")
  );
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8").replace(/^﻿/, ""));
}

function load(p = hookPointsPath()) {
  return readJson(p);
}

/** The set of real role ids from the role-registry keystone (the parity source). */
function loadRoleIds(p = roleRegistryPath()) {
  const raw = readJson(p);
  // roles may live under .roles or be the top-level map; keep only objects that look
  // like role rows (carry a tier/home/kind) so wrapper keys (schema/scrapped/…) drop.
  const roles = raw && raw.roles && typeof raw.roles === "object" ? raw.roles : raw;
  return Object.keys(roles).filter(
    (k) => roles[k] && typeof roles[k] === "object" && (roles[k].tier || roles[k].home || roles[k].kind),
  );
}

/** Normalize a sprint composition to { unit_types:Set, max_risk:string, domains:Set }. */
function normalizeComposition(comp = {}) {
  const lc = (a) => new Set((a || []).map((s) => String(s).toLowerCase()));
  return {
    unit_types: lc(comp.unit_types || comp.unitTypes),
    max_risk: String(comp.max_risk || comp.maxRisk || "").toLowerCase(),
    domains: lc(comp.domains),
  };
}

/** Evaluate ONE registry condition against a normalized composition. Pure. */
function matchCondition(condition, comp) {
  if (condition === "always" || condition == null) return true;
  if (typeof condition !== "object") return false;
  if (Array.isArray(condition.unit_type)) {
    return condition.unit_type.some((t) => comp.unit_types.has(String(t).toLowerCase()));
  }
  if (condition.risk_min) {
    const need = RISK_ORDER[String(condition.risk_min).toLowerCase()] || 0;
    const have = RISK_ORDER[comp.max_risk] || 0;
    return have > 0 && have >= need;
  }
  if (Array.isArray(condition.domain)) {
    return condition.domain.some((d) => comp.domains.has(String(d).toLowerCase()));
  }
  return false;
}

/**
 * The agent-set for a step under a composition: matched rows, sorted by `order`.
 * This is the composition->manager-set router (always-on rows + conditional rows).
 */
function agentsForStep(step, composition, registry = load()) {
  const comp = normalizeComposition(composition);
  return (registry.rows || [])
    .filter((r) => r.step === step && matchCondition(r.condition, comp))
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

/**
 * Validate the registry against the canonical steps + the real role roster.
 * @param {object} registry  the parsed sprint-hook-points.json
 * @param {string[]} roleIds the real role ids (from role-registry.json)
 * @returns {{ ok:boolean, errors:string[] }}
 */
function validate(registry, roleIds) {
  const errors = [];
  if (!registry || typeof registry !== "object") return { ok: false, errors: ["registry is not an object"] };
  if (!Array.isArray(registry.rows)) return { ok: false, errors: ["registry.rows missing or not an array"] };
  const ids = new Set(roleIds);
  const stepsSeen = new Set();
  registry.rows.forEach((r, i) => {
    const at = `rows[${i}] (${r && r.role}@${r && r.step})`;
    if (!r || typeof r !== "object") { errors.push(`${at}: not an object`); return; }
    if (!r.role || !ids.has(r.role)) errors.push(`${at}: role '${r.role}' is not in role-registry`);
    if (!STEPS.includes(r.step)) errors.push(`${at}: step '${r.step}' is not a canonical lifecycle step`);
    if (!MODES.includes(r.mode)) errors.push(`${at}: mode '${r.mode}' not one of ${MODES.join("|")}`);
    if (typeof r.order !== "number") errors.push(`${at}: order must be a number`);
    const c = r.condition;
    const wellFormed =
      c === "always" ||
      (c && typeof c === "object" && (Array.isArray(c.unit_type) || c.risk_min || Array.isArray(c.domain)));
    if (!wellFormed) errors.push(`${at}: malformed condition ${JSON.stringify(c)}`);
    if (c && c.risk_min && !RISK_ORDER[String(c.risk_min).toLowerCase()]) {
      errors.push(`${at}: unknown risk_min '${c.risk_min}'`);
    }
    if (STEPS.includes(r.step)) stepsSeen.add(r.step);
  });
  // reverse coverage (lite): no canonical step left without a registered agent.
  for (const s of STEPS) {
    if (!stepsSeen.has(s)) errors.push(`step '${s}' has NO registered agent row (orphan step)`);
  }
  return { ok: errors.length === 0, errors };
}

// ── CLI ───────────────────────────────────────────────────────────────────────

function main(argv) {
  const cmd = argv[2] || "validate";

  if (cmd === "validate") {
    let registry, roleIds;
    try {
      registry = load();
      roleIds = loadRoleIds();
    } catch (e) {
      process.stderr.write(`hook-points error: ${e.message}\n`);
      return 2; // fail-closed on unreadable registry/roster
    }
    const res = validate(registry, roleIds);
    if (res.ok) {
      process.stdout.write(
        `OK   [sprint-hook-points] ${registry.rows.length} rows valid across ${STEPS.length} steps\n`,
      );
      return 0;
    }
    process.stderr.write(
      `FAIL [sprint-hook-points] ${res.errors.length} error(s):\n${res.errors.map((e) => "  - " + e).join("\n")}\n`,
    );
    return 1;
  }

  if (cmd === "for-step") {
    const step = argv[3];
    if (!STEPS.includes(step)) {
      process.stderr.write(`unknown step '${step}'. one of: ${STEPS.join(" | ")}\n`);
      return 2;
    }
    const ci = argv.indexOf("--composition");
    let comp = {};
    if (ci !== -1 && argv[ci + 1]) {
      try {
        comp = JSON.parse(argv[ci + 1]);
      } catch (e) {
        process.stderr.write(`bad --composition JSON: ${e.message}\n`);
        return 2;
      }
    }
    const rows = agentsForStep(step, comp);
    process.stdout.write(
      JSON.stringify(
        { step, agents: rows.map((r) => ({ role: r.role, mode: r.mode, order: r.order })) },
        null,
        2,
      ) + "\n",
    );
    return 0;
  }

  process.stderr.write(
    "usage: hook-points.js <validate | for-step <step> [--composition <json>]>\n",
  );
  return 2;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = {
  STEPS,
  RISK_ORDER,
  MODES,
  load,
  loadRoleIds,
  normalizeComposition,
  matchCondition,
  agentsForStep,
  validate,
  hookPointsPath,
  roleRegistryPath,
};
