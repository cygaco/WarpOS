#!/usr/bin/env node
"use strict";

/**
 * /scan:role-parity (S1.1) — the ONE check that owns role parity across the
 * org map and the dispatch registries, so repartitioning agents by domain can't
 * silently drift the registry (the named risk in MODES-RECONCILE §"Concrete
 * reconciliation work" + FINAL-PLAN §3/§6). This is the enforcer-first guard
 * built BEFORE the Wave-2 repartition it protects.
 *
 * Sources (read live, never hardcoded copies):
 *   - org map         .claude/agents/03-managers/_org/org-map.json (role universe)
 *   - dispatch roles  scripts/dispatch/catalog.js#ROLES            (required)
 *   - gamma-only set  scripts/dispatch/org-roles.js gammaOnlyTypes() — the SAME
 *                     config-driven derivation team-guard now consumes (the org
 *                     map is the single source of truth), NOT a regex parse of
 *                     team-guard. PLUS a wiring check that team-guard still
 *                     delegates its GAMMA_ONLY_TYPES gate to org-roles (so the
 *                     config-driven gate can't be silently re-hardcoded).
 *
 * REJECTS (exit 1), never lints, when ANY:
 *   1. an org-map domain role marked BUILT (`agent` != null) names an agent that
 *      does NOT resolve to a real spec under .claude/agents/;
 *   2. a gauntlet member (gauntlets.*.members[]) is not a real dispatch role
 *      (∉ catalog ROLES);
 *   3. a routing.*.owner_role is not defined anywhere in the org map
 *      (∉ domain roles ∪ gauntlet authorities ∪ {enforcer});
 *   4. a DOER role in the dispatch catalog (not orchestrator/system) is ungoverned
 *      — neither a gauntlet member, an org-map domain role, nor on the explicit
 *      TRANSITIONAL allowlist (the drift the check exists to catch);
 *   5. an org-map BUILT build-chain doer role is absent from team-guard's
 *      GAMMA_ONLY_TYPES (α could dispatch it directly — a gate hole).
 * Internal error => exit 2 (fail-closed: a scan that errors must never read green).
 *
 * Core is `evaluate({org, ROLES, gammaOnly, agentResolves})` (pure given injected
 * seams) so the negative bite-test can prove it rejects each class — an enforcer
 * without a bite-test is a false-green waiting to happen.
 *
 *   node scripts/checks/role-parity-scan.js [--json]
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..");
const NAME = "role-parity";

// Framework orchestrator + system roles — NOT domain doers, so they need no
// domain/gauntlet home. (alpha/beta = org-map orchestrator/referee; gamma/delta =
// orchestrators; learner/stub-scaffold = system.)
const ORCHESTRATOR_SYSTEM = new Set([
  "alpha", "beta", "gamma", "delta", "learner", "stub-scaffold",
]);

// Catalog doer roles mid-migration to the domain org — governed but not yet
// repartitioned. DOCUMENTED, not hidden: each retires as Wave 2 lands.
const TRANSITIONAL = new Map([
  ["builder", "splits into frontend-builder/backend-builder in Wave 2 (S2.3); org-map declares both (agent:null, pending)"],
  ["qa", "the QA failure-mode scanner directed by qa-lead (org-map product domain); retires when qa-lead is built (Wave 2 S2.1)"],
]);

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, "utf8").replace(/^﻿/, ""));
}

// Statically extract the members of `GAMMA_ONLY_TYPES = new Set([ ... ])` from
// team-guard's source (we must NOT require it — it runs on load + reads stdin).
function parseGammaOnlyTypes(src) {
  const m = src.match(/GAMMA_ONLY_TYPES\s*=\s*new\s+Set\(\s*\[([\s\S]*?)\]\s*\)/);
  if (!m) return null;
  return new Set([...m[1].matchAll(/["']([^"']+)["']/g)].map((x) => x[1]));
}

// Collect roles the org map defines, by section.
function collectOrgRoles(org) {
  const domainRoles = new Set();
  const builtAgents = []; // { role, agent } (agent != null)
  const buildChainBuilt = []; // built "builders[]" doer roles
  const addRole = (r, agent, isBuilder) => {
    if (r) domainRoles.add(r);
    if (agent) {
      builtAgents.push({ role: r, agent });
      if (isBuilder) buildChainBuilt.push(r);
    }
  };
  for (const [, d] of Object.entries(org.domains || {})) {
    if (d.director) addRole(d.director.role, d.director.agent, false);
    for (const lead of d.leads || []) {
      addRole(lead.role, lead.agent, false);
      for (const sp of lead.specialists || []) addRole(sp.role, sp.agent, false);
    }
    for (const sp of d.specialists || []) addRole(sp.role, sp.agent, false);
    for (const b of d.builders || []) addRole(b.role, b.agent, true);
  }
  return { domainRoles, builtAgents, buildChainBuilt };
}

// A declared agent "resolves" if a dir named <agent> or a <agent>.md exists under
// .claude/agents/. Injectable so the bite-test controls it.
function makeRealAgentResolver(root) {
  const agentsRoot = path.join(root, ".claude", "agents");
  return function agentResolves(agent) {
    let found = false;
    const walk = (dir, depth) => {
      if (found || depth > 5) return;
      let ents;
      try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
      for (const e of ents) {
        if (found) return;
        if (e.isDirectory()) {
          if (e.name === agent) { found = true; return; }
          if (!e.name.startsWith(".")) walk(path.join(dir, e.name), depth + 1);
        } else if (e.isFile() && e.name === `${agent}.md`) { found = true; return; }
      }
    };
    walk(agentsRoot, 0);
    return found;
  };
}

/**
 * Pure assertion core. Returns errors[] (empty = parity holds).
 * @param org           parsed org-map.json
 * @param ROLES         catalog ROLES array
 * @param gammaOnly     Set of team-guard GAMMA_ONLY_TYPES
 * @param agentResolves (agent) => bool
 */
function evaluate({ org, ROLES, gammaOnly, agentResolves }) {
  const errors = [];
  const { domainRoles, builtAgents, buildChainBuilt } = collectOrgRoles(org);

  const gauntletNames = new Set();
  const gauntletMembers = new Set();
  for (const [gname, g] of Object.entries(org.gauntlets || {})) {
    gauntletNames.add(`${gname}-gauntlet`);
    gauntletNames.add(gname);
    for (const mem of g.members || []) gauntletMembers.add(mem);
  }

  // 1. built domain agents resolve
  for (const { role, agent } of builtAgents) {
    if (!agentResolves(agent)) {
      errors.push(`org-map role "${role}" claims built agent "${agent}" but no spec resolves under .claude/agents/`);
    }
  }
  // 2. gauntlet members are real dispatch roles
  for (const mem of gauntletMembers) {
    if (!ROLES.includes(mem)) {
      errors.push(`gauntlet member "${mem}" is not a dispatch role (absent from catalog.js ROLES)`);
    }
  }
  // 3. routing owner_roles defined in the org map
  const knownRoles = new Set([...domainRoles, ...gauntletNames, "enforcer"]);
  for (const [key, r] of Object.entries(org.routing || {})) {
    if (key.startsWith("_")) continue;
    const owner = r && r.owner_role;
    if (owner && !knownRoles.has(owner)) {
      errors.push(`routing["${key}"].owner_role "${owner}" is not defined in the org map (domains/gauntlets/enforcer)`);
    }
  }
  // 4. every catalog DOER role is governed
  for (const role of ROLES) {
    if (ORCHESTRATOR_SYSTEM.has(role)) continue;
    if (!(gauntletMembers.has(role) || domainRoles.has(role) || TRANSITIONAL.has(role))) {
      errors.push(`dispatch role "${role}" is ungoverned — not a gauntlet member, org-map domain role, or transitional (repartition drift)`);
    }
  }
  // 5. built build-chain doers are gated by team-guard
  for (const role of buildChainBuilt) {
    if (!gammaOnly.has(role)) {
      errors.push(`built build-chain role "${role}" is NOT in team-guard GAMMA_ONLY_TYPES — α could dispatch it directly (gate hole)`);
    }
  }
  return errors;
}

function main(argv) {
  const json = argv.includes("--json");
  let errors;
  try {
    const org = readJSON(path.join(ROOT, ".claude/agents/03-managers/_org/org-map.json"));
    const catalog = require(path.join(ROOT, "scripts/dispatch/catalog.js"));
    if (!Array.isArray(catalog.ROLES)) { process.stderr.write("role-parity: catalog.js does not export ROLES\n"); return 2; }
    // gammaOnly comes from the SAME config-driven derivation team-guard now
    // consumes (org-roles, S1.1 chassis) — the org map is the source of truth.
    const { gammaOnlyTypes } = require(path.join(ROOT, "scripts/dispatch/org-roles.js"));
    const gammaOnly = gammaOnlyTypes(org);
    if (!(gammaOnly instanceof Set) || gammaOnly.size === 0) { process.stderr.write("role-parity: org-roles.gammaOnlyTypes() returned empty\n"); return 2; }
    errors = evaluate({ org, ROLES: catalog.ROLES, gammaOnly, agentResolves: makeRealAgentResolver(ROOT) });
    // Wiring invariant: team-guard MUST delegate its gate to org-roles, else a
    // hand-edited static GAMMA_ONLY_TYPES could silently drift from the org map.
    const tgSrc = fs.readFileSync(path.join(ROOT, "scripts/hooks/team-guard.js"), "utf8");
    if (!/require\(\s*["'][^"']*dispatch\/org-roles["']\s*\)/.test(tgSrc)) {
      errors.push("team-guard.js no longer delegates its GAMMA_ONLY_TYPES gate to scripts/dispatch/org-roles (config-driven role gate bypassed — re-hardcoded?)");
    }
  } catch (e) {
    process.stderr.write(`role-parity-scan error: ${e.message}\n`);
    return 2; // fail-closed
  }
  if (json) {
    process.stdout.write(JSON.stringify({ ok: errors.length === 0, check: NAME, errors }, null, 2) + "\n");
    return errors.length ? 1 : 0;
  }
  if (errors.length === 0) {
    process.stdout.write(`OK   [${NAME}] org map ↔ dispatch catalog ↔ team-guard agree (role universe coherent)\n`);
    return 0;
  }
  process.stderr.write(`FAIL [${NAME}] role parity drift (${errors.length}):\n${errors.map((e) => `  - ${e}`).join("\n")}\n`);
  return 1;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { evaluate, parseGammaOnlyTypes, collectOrgRoles, makeRealAgentResolver };
