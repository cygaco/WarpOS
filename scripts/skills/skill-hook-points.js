#!/usr/bin/env node
"use strict";

/**
 * scripts/skills/skill-hook-points.js — the skill→manager hook-in REGISTRY reader +
 * call-time agent resolver (M1 §8). The sibling of scripts/sprint/hook-points.js, for
 * SKILLS instead of the sprint lifecycle.
 *
 * Reads .claude/agents/_org/skill-hook-points.json (paths.skillHookPoints) — the
 * declarative { skill -> { domain, hooks:[{hook_point, role, condition?, default?}] } }
 * map — and answers the question every agent-calling skill asks at dispatch time:
 * "which agent role do I dispatch for <hook_point>?". The answer is resolved AT CALL
 * TIME from the role-registry keystone (NEVER a hardcoded name in skill prose), so a
 * role rename/swap is ONE registry edit, not N edits across skill bodies.
 *
 * `role` references .claude/agents/_org/role-registry.json (paths.orgRoleRegistry) by
 * id; validate() asserts every row's role exists there — the tripwire that catches the
 * stale-name rename-break class (e.g. a skill still naming director-of-marketing after
 * the ADR-0007 rename to director-of-growth). Paired with the bidirectional
 * scan:skill-hook-coverage enforcer.
 *
 * PURE + side-effect-free (safe to require from hooks/checks).
 *
 *   node scripts/skills/skill-hook-points.js validate
 *   node scripts/skills/skill-hook-points.js resolve growth:message-brief distill-message
 *   node scripts/skills/skill-hook-points.js resolve roadmap:next            # all hooks
 */

const fs = require("fs");
const path = require("path");

let _PATHS = null;
function paths() {
  if (!_PATHS) {
    try {
      _PATHS = require("../hooks/lib/paths").PATHS;
    } catch {
      _PATHS = {};
    }
  }
  return _PATHS;
}
function projectRoot() {
  return process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..");
}
function skillHookPointsPath() {
  const P = paths();
  if (P && P.skillHookPoints) return P.skillHookPoints;
  return path.join(projectRoot(), ".claude", "agents", "_org", "skill-hook-points.json");
}
function roleRegistryPath() {
  const P = paths();
  if (P && P.orgRoleRegistry) return P.orgRoleRegistry;
  return path.join(projectRoot(), ".claude", "agents", "_org", "role-registry.json");
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8").replace(/^﻿/, ""));
}

function load(p = skillHookPointsPath()) {
  return readJson(p);
}

/** The roles object from the role-registry keystone (roles may be under .roles). */
function loadRoles(p = roleRegistryPath()) {
  const raw = readJson(p);
  return raw && raw.roles && typeof raw.roles === "object" ? raw.roles : raw;
}

/** The set of real role ids from the role-registry keystone (the parity source). */
function loadRoleIds(p = roleRegistryPath()) {
  const roles = loadRoles(p);
  return Object.keys(roles).filter(
    (k) => roles[k] && typeof roles[k] === "object" && (roles[k].tier || roles[k].home || roles[k].kind),
  );
}

/** The skill ids that carry hook-in rows (e.g. "roadmap:next"). */
function skillIds(registry = load()) {
  const s = registry && registry.skills;
  return s && typeof s === "object" ? Object.keys(s) : [];
}

/**
 * Flatten every hook row to { skill, hook_point, role, condition, default }.
 * The enforcer + validator iterate this; the resolver filters it.
 */
function hookRows(registry = load()) {
  const out = [];
  const skills = (registry && registry.skills) || {};
  for (const skill of Object.keys(skills)) {
    const hooks = (skills[skill] && skills[skill].hooks) || [];
    for (const h of hooks) {
      out.push({
        skill,
        hook_point: h.hook_point,
        role: h.role,
        condition: h.condition || "always",
        default: h.default === true,
        note: h.note,
      });
    }
  }
  return out;
}

/**
 * Resolve the candidate agent role(s) for a skill (+ optional hook_point). Returns the
 * matching rows; for a conditional hook (multiple rows on one hook_point) the caller
 * picks by `condition`, defaulting to the row marked `default:true` (the no-regression
 * fallback). Returns [] if the skill/hook is not registered.
 */
function resolveAgent(skill, hookPoint, registry = load()) {
  return hookRows(registry).filter(
    (r) => r.skill === skill && (hookPoint == null || r.hook_point === hookPoint),
  );
}

/** The single no-regression default role for a (skill, hook_point): the `default` row, or the sole row. */
function defaultRoleFor(skill, hookPoint, registry = load()) {
  const rows = resolveAgent(skill, hookPoint, registry);
  if (rows.length === 0) return null;
  if (rows.length === 1) return rows[0].role;
  const def = rows.find((r) => r.default);
  return def ? def.role : null;
}

/**
 * Validate the registry against the real role roster + structural rules.
 * @returns {{ ok:boolean, errors:string[] }}
 */
function validate(registry, roleIds) {
  const errors = [];
  if (!registry || typeof registry !== "object") return { ok: false, errors: ["registry is not an object"] };
  if (!registry.skills || typeof registry.skills !== "object")
    return { ok: false, errors: ["registry.skills missing or not an object"] };
  const ids = new Set(roleIds);

  for (const skill of Object.keys(registry.skills)) {
    const entry = registry.skills[skill];
    const at = `skills["${skill}"]`;
    if (!entry || typeof entry !== "object") { errors.push(`${at}: not an object`); continue; }
    if (!Array.isArray(entry.hooks) || entry.hooks.length === 0) {
      errors.push(`${at}: hooks missing or empty`);
      continue;
    }
    // group rows by hook_point to check the default invariant
    const byHook = {};
    entry.hooks.forEach((h, i) => {
      const hat = `${at}.hooks[${i}] (${h && h.hook_point}→${h && h.role})`;
      if (!h || typeof h !== "object") { errors.push(`${hat}: not an object`); return; }
      if (!h.hook_point || typeof h.hook_point !== "string") errors.push(`${hat}: hook_point missing`);
      if (!h.role || !ids.has(h.role)) errors.push(`${hat}: role '${h.role}' is not in role-registry (stale/renamed?)`);
      if (h.condition != null && typeof h.condition !== "string") errors.push(`${hat}: condition must be a string`);
      if (h.default != null && typeof h.default !== "boolean") errors.push(`${hat}: default must be a boolean`);
      (byHook[h.hook_point] = byHook[h.hook_point] || []).push(h);
    });
    // exactly one default per multi-row hook_point (the no-regression fallback)
    for (const hp of Object.keys(byHook)) {
      const rows = byHook[hp];
      if (rows.length > 1) {
        const defs = rows.filter((r) => r.default === true).length;
        if (defs !== 1)
          errors.push(`${at} hook_point '${hp}': conditional hook has ${rows.length} rows but ${defs} default:true (need exactly 1)`);
      }
    }
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
      process.stderr.write(`skill-hook-points error: ${e.message}\n`);
      return 2; // fail-closed on unreadable registry/roster
    }
    const res = validate(registry, roleIds);
    if (res.ok) {
      process.stdout.write(
        `OK   [skill-hook-points] ${skillIds(registry).length} skills / ${hookRows(registry).length} hook rows valid\n`,
      );
      return 0;
    }
    process.stderr.write(
      `FAIL [skill-hook-points] ${res.errors.length} error(s):\n${res.errors.map((e) => "  - " + e).join("\n")}\n`,
    );
    return 1;
  }

  if (cmd === "resolve") {
    const skill = argv[3];
    const hookPoint = argv[4] || null;
    if (!skill) {
      process.stderr.write("usage: skill-hook-points.js resolve <skill> [hook_point]\n");
      return 2;
    }
    let registry;
    try {
      registry = load();
    } catch (e) {
      process.stderr.write(`skill-hook-points error: ${e.message}\n`);
      return 2;
    }
    const rows = resolveAgent(skill, hookPoint, registry);
    if (rows.length === 0) {
      process.stderr.write(`no hook-in entry for skill '${skill}'${hookPoint ? ` hook_point '${hookPoint}'` : ""}\n`);
      return 1;
    }
    process.stdout.write(
      JSON.stringify(
        {
          skill,
          hooks: rows.map((r) => ({
            hook_point: r.hook_point,
            role: r.role,
            condition: r.condition,
            default: r.default,
          })),
        },
        null,
        2,
      ) + "\n",
    );
    return 0;
  }

  process.stderr.write("usage: skill-hook-points.js <validate | resolve <skill> [hook_point]>\n");
  return 2;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = {
  load,
  loadRoles,
  loadRoleIds,
  skillIds,
  hookRows,
  resolveAgent,
  defaultRoleFor,
  validate,
  skillHookPointsPath,
  roleRegistryPath,
};
