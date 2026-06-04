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
 *   - org map         .claude/agents/_org/org-map.json (role universe)
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
//
// ADR-0007 cutover: the SCRAPPED legacy review roles (reviewer/compliance/qa/
// redteam) were removed from the code-qc gauntlet (now the new roster), so they
// are no longer governed as gauntlet members. They REMAIN in the dispatch catalog
// during coexistence (normalizeRole aliases compliance→qa-reviewer, redteam→
// security-reviewer, qa→qa-reviewer; `reviewer` splits into the per-pod reviewers)
// and are kept here as DEPRECATED-transitional so parity stays honest until the
// catalog roster is trimmed in a follow-on cleanup. They are NOT dispatched live
// any more (gamma/delta rewired to the derived roster) — these entries only keep
// the legacy catalog ids governed, not endorsed.
const TRANSITIONAL = new Map([
  ["builder", "splits into frontend-builder/backend-builder in Wave 2 (S2.3); org-map declares both (agent:null, pending)"],
  ["qa", "DEPRECATED (ADR-0007): absorbed into qa-reviewer (alias qa→qa-reviewer). Legacy catalog id, not dispatched live; trims in the catalog-roster cleanup."],
  ["reviewer", "DEPRECATED (ADR-0007): split into frontend-reviewer/backend-reviewer (code-quality only). Legacy catalog id, not dispatched live; trims in the catalog-roster cleanup."],
  ["compliance", "DEPRECATED (ADR-0007): absorbed into qa-reviewer integrity scope (alias compliance→qa-reviewer). Legacy catalog id, not dispatched live; trims in the catalog-roster cleanup."],
  ["redteam", "DEPRECATED (ADR-0007): replaced by security-reviewer (alias redteam→security-reviewer). Legacy catalog id, not dispatched live; trims in the catalog-roster cleanup."],
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

// A declared agent "resolves" if, under .claude/agents/, there is a dir named
// <agent>, a <agent>.md file, OR (ADR-0007) a .md file whose frontmatter `name:`
// equals <agent>. The frontmatter case is REQUIRED post-cutover: the pod specs
// are file-named by stem at the pod level (engineering/frontend/builder.md whose
// `name: frontend-builder`), so a filename-only match would miss them and falsely
// report frontend-builder/backend-builder as "no spec resolves". Injectable so the
// bite-test controls it.
function fmName(file) {
  try {
    const body = fs.readFileSync(file, "utf8");
    const fm = body.match(/^---\n([\s\S]*?)\n---/);
    if (!fm) return null;
    const m = fm[1].match(/^name:\s*(\S+)/m);
    return m ? m[1] : null;
  } catch { return null; }
}
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
        } else if (e.isFile() && e.name.endsWith(".md")) {
          if (e.name === `${agent}.md`) { found = true; return; }
          if (fmName(path.join(dir, e.name)) === agent) { found = true; return; }
        }
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
function evaluate({ org, ROLES, gammaOnly, agentResolves, registryRoles = new Set() }) {
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
    if (!(gauntletMembers.has(role) || domainRoles.has(role) || TRANSITIONAL.has(role) || registryRoles.has(role))) {
      errors.push(`dispatch role "${role}" is ungoverned — not a gauntlet member, org-map domain role, role-registry role, or transitional (repartition drift)`);
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

// Registry keystone validation (ADR-0007): role-registry.json is the single
// source of role identity + the model map + dispatch authority. Assert INTERNAL
// consistency — every model exists in the catalog, every dispatch-authority ref
// resolves to a registry role, and the effort policy holds (max only on alpha;
// gpt-5.5 caps at xhigh). Spec-resolution for new roles is NOT asserted here (the
// department tree is built in a later wave); catalog↔registry roster agreement is
// a post-migration gate. Fail-closed (fatal) on an unreadable/unparseable registry.
function validateRegistry(root, catalog) {
  const regPath = path.join(
    root,
    ".claude/agents/_org/role-registry.json",
  );
  let reg;
  try {
    reg = readJSON(regPath);
  } catch (e) {
    return {
      errors: [`role-registry.json unreadable/unparseable: ${e.message}`],
      fatal: true,
    };
  }
  return { errors: evaluateRegistry(reg, catalog), fatal: false };
}

// Pure registry-consistency core (injectable seams → bite-testable).
function evaluateRegistry(reg, catalog) {
  const errors = [];
  const roles = reg.roles || {};
  const roleNames = new Set(Object.keys(roles));
  const models = new Set();
  for (const p of catalog.PROVIDER_LIST || []) {
    for (const m of p.models || []) {
      models.add(m.id);
      for (const a of m.aliases || []) models.add(a);
    }
  }
  for (const [name, r] of Object.entries(roles)) {
    if (r.model && !models.has(r.model)) {
      errors.push(`registry role "${name}" model "${r.model}" is not in the catalog`);
    }
    if (r.second_pass && r.second_pass.model && !models.has(r.second_pass.model)) {
      errors.push(`registry role "${name}" second_pass.model "${r.second_pass.model}" is not in the catalog`);
    }
    for (const d of r.dispatchable_by || []) {
      if (!roleNames.has(d)) errors.push(`registry role "${name}".dispatchable_by names unknown role "${d}"`);
    }
    for (const d of r.dispatches || []) {
      if (!roleNames.has(d)) errors.push(`registry role "${name}".dispatches names unknown role "${d}"`);
    }
    if (r.effort === "max" && name !== "alpha") {
      errors.push(`registry role "${name}" effort=max — max is reserved for alpha (ADR-0007 effort policy)`);
    }
    if (r.model === "gpt-5.5" && r.effort === "max") {
      errors.push(`registry role "${name}" gpt-5.5 cannot use effort=max (ceiling is xhigh)`);
    }
  }
  return errors;
}

// ── ADR-0007 R4: hook hardcoded-role-literal scan ───────────────────────────
// A fail-open / advisory hook that GATES on a hardcoded SCRAPPED ROLE literal
// silently NO-OPS after the rename — the #1 false-green class (R1/R4). This scan
// flags a hook that references a SCRAPPED role literal that has NO safe handling:
// it is clean iff it does AT LEAST ONE of —
//   (a) normalize through role-aliases (normalizeRole), OR
//   (b) derive its role set from the registry (dispatch/org-roles), OR
//   (c) ALSO reference the canonical replacement (so it handles new + old —
//       legitimate backward-compat, e.g. a skip-list carrying both names).
// A hook that mentions ONLY the dead literal, raw, is the break.
//
// Scope: the UNAMBIGUOUSLY-scrapped ROLE names. `redteam` → security-reviewer and
// `req-reviewer` → qa-reviewer are distinct role tokens with a 1:1 canonical
// replacement, so they're checkable without false-positives. `compliance`/`qa`/
// `reviewer` are DELIBERATELY EXCLUDED: `compliance` + `reviewer` + `security` are
// the PERSISTENT gate-check DIMENSIONS (ADR-0007 carve-out — store-validator etc.
// key GATE_CHECK records on them, NOT role-routing), and `qa`/`reviewer` are
// substrings of the new roles (qa-reviewer/*-reviewer) → unflaggable cleanly.
const HOOK_SCRAPPED_LITERALS = ["redteam", "req-reviewer"];
// Canonical replacement per scrapped literal — presence = backward-compat, clean.
const SCRAPPED_CANONICAL = { redteam: "security-reviewer", "req-reviewer": "qa-reviewer" };

// Token-boundary literal match that does NOT match a longer hyphenated compound.
// `req-reviewer` is matched whole; `redteam` only as a standalone token.
function referencesScrappedLiteral(src, literal) {
  const q = new RegExp(`["'\`]${literal}["'\`]`);
  const k = new RegExp(`(^|[^\\w-])${literal}([^\\w-]|$)`, "m");
  return q.test(src) || k.test(src);
}

function normalizesOrDerives(src) {
  return (
    /role-aliases/.test(src) ||
    /normalizeRole\b/.test(src) ||
    /dispatch\/org-roles/.test(src)
  );
}

/**
 * Pure hook-scan core (injectable seam → bite-testable).
 * @param hookSources  { [filename]: sourceText } for the hooks to scan
 * @param scrappedRoles literals to flag (default HOOK_SCRAPPED_LITERALS)
 * @returns errors[]  (empty = no unguarded scrapped-literal gate)
 */
function evaluateHooks({ hookSources, scrappedRoles = HOOK_SCRAPPED_LITERALS }) {
  const errors = [];
  for (const [name, src] of Object.entries(hookSources || {})) {
    if (typeof src !== "string") continue;
    if (normalizesOrDerives(src)) continue; // (a)/(b) safety net covers the whole file
    const hits = [];
    for (const lit of scrappedRoles) {
      if (!referencesScrappedLiteral(src, lit)) continue;
      const canon = SCRAPPED_CANONICAL[lit];
      // (c) canonical replacement also present → handles new+old → clean.
      if (canon && referencesScrappedLiteral(src, canon)) continue;
      hits.push(lit);
    }
    if (hits.length === 0) continue;
    errors.push(
      `hook "${name}" gates on scrapped role literal(s) [${hits.join(", ")}] with no normalizeRole/role-aliases/org-roles safety net and no canonical replacement present — a rename silently no-ops it (ADR-0007 R4 false-green class)`,
    );
  }
  return errors;
}

// Read every hook .js source under scripts/hooks/ (top level only — lib/ is
// helpers, not gate hooks). Returns { filename: source }.
function readHookSources(root) {
  const dir = path.join(root, "scripts", "hooks");
  const out = {};
  let ents;
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of ents) {
    if (!e.isFile() || !e.name.endsWith(".js")) continue;
    try { out[e.name] = fs.readFileSync(path.join(dir, e.name), "utf8"); } catch { /* skip */ }
  }
  return out;
}

function main(argv) {
  const json = argv.includes("--json");
  let errors;
  try {
    const org = readJSON(path.join(ROOT, ".claude/agents/_org/org-map.json"));
    const catalog = require(path.join(ROOT, "scripts/dispatch/catalog.js"));
    if (!Array.isArray(catalog.ROLES)) { process.stderr.write("role-parity: catalog.js does not export ROLES\n"); return 2; }
    // gammaOnly comes from the SAME config-driven derivation team-guard now
    // consumes (org-roles, S1.1 chassis) — the org map is the source of truth.
    const { gammaOnlyTypes } = require(path.join(ROOT, "scripts/dispatch/org-roles.js"));
    const gammaOnly = gammaOnlyTypes(org);
    if (!(gammaOnly instanceof Set) || gammaOnly.size === 0) { process.stderr.write("role-parity: org-roles.gammaOnlyTypes() returned empty\n"); return 2; }
    // Registry roles are a GOVERNANCE source (ADR-0007 keystone): a dispatch role
    // declared in role-registry.json is governed even before the org-map structural
    // migration folds it into domains/gauntlets — so the new roster can be wired
    // into catalog/dispatch behind the gate without a big-bang org-map rewrite.
    let registryRoles = new Set();
    try {
      const reg = readJSON(path.join(ROOT, ".claude/agents/_org/role-registry.json"));
      registryRoles = new Set(Object.keys(reg.roles || {}));
    } catch { /* validateRegistry below fails-closed if unreadable */ }
    errors = evaluate({ org, ROLES: catalog.ROLES, gammaOnly, agentResolves: makeRealAgentResolver(ROOT), registryRoles });
    // Wiring invariant: team-guard MUST delegate its gate to org-roles, else a
    // hand-edited static GAMMA_ONLY_TYPES could silently drift from the org map.
    const tgSrc = fs.readFileSync(path.join(ROOT, "scripts/hooks/team-guard.js"), "utf8");
    if (!/require\(\s*["'][^"']*dispatch\/org-roles["']\s*\)/.test(tgSrc)) {
      errors.push("team-guard.js no longer delegates its GAMMA_ONLY_TYPES gate to scripts/dispatch/org-roles (config-driven role gate bypassed — re-hardcoded?)");
    }
    // ADR-0007 keystone: validate role-registry.json internal consistency.
    const regResult = validateRegistry(ROOT, catalog);
    if (regResult.fatal) {
      process.stderr.write(`role-parity: ${regResult.errors[0]}\n`);
      return 2;
    }
    errors.push(...regResult.errors);
    // ADR-0007 R4: scan the gate hooks for unguarded scrapped-role literals
    // (the silent-no-op-on-rename false-green class).
    errors.push(...evaluateHooks({ hookSources: readHookSources(ROOT) }));
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

module.exports = { evaluate, evaluateRegistry, validateRegistry, evaluateHooks, readHookSources, referencesScrappedLiteral, HOOK_SCRAPPED_LITERALS, parseGammaOnlyTypes, collectOrgRoles, makeRealAgentResolver };
