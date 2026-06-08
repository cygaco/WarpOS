#!/usr/bin/env node
"use strict";

/**
 * dispatch-contract.js — reader + validator for the dispatch-shape keystone
 * (.claude/agents/_org/dispatch-contract.json, PLAN §17.1).
 *
 * role-registry.json owns role IDENTITY; this resolves the dispatch SHAPE contract
 * for a role by DERIVING its class from registry attributes (single source — no
 * duplicated role list), then merging defaults <- class <- role_override.
 *
 * The consumer API `validateDispatch({role, shape, toolId, cwd})` encodes the three
 * operator-named dispatch failures as contract violations:
 *   (ii)  API-when-CLI            => shape 'api' for a role whose allowed_shapes lacks it.
 *   (iii) in-process-when-subproc => shape 'in-process-agent' on a forbidden role (build-chain).
 *   (i)   skipped coverage        => surfaced by the coverage gate using `coverage` here.
 *
 * `validateContractFile()` is the keystone integrity check (every registry role
 * resolves; classes reference real shapes; the build-chain<->in-process invariant
 * holds). Pure functions; CLI: `node scripts/dispatch/dispatch-contract.js validate`.
 *
 * Zero runtime deps.
 */

const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..");

// PLAN §17.4: the coverage-record argv/stamp schema version. Bumped whenever the
// set of §17.4 fields a wrapper stamps (or their meaning) changes, so the coverage
// gate can REJECT a record written under an older/unknown schema as stale or
// backfilled (a record's mere existence is not coverage). Both wrappers stamp it;
// the coverage gate requires the CURRENT value. One source of truth here in the
// dispatch keystone — both wrappers + the gate already read this module.
const ARGV_SCHEMA_VERSION = "1";
// Path-override seam (downstream products + tests): point at an alternate contract
// or registry without code change. Defaults to the canonical _org/ keystones.
const CONTRACT_PATH = process.env.WARPOS_DISPATCH_CONTRACT_PATH || path.join(PROJECT_ROOT, ".claude", "agents", "_org", "dispatch-contract.json");
// GPT-5.5 review R2 HIGH: role IDENTITY (the basis of the build_chain hard
// invariant) must NOT be env-overridable — a hostile env could redefine which
// roles are build_chain and bypass the in-process rejection. The registry path is
// FIXED to canonical (resolved per-install from this file's location). The CONTRACT
// path stays overridable (downstream products + tests supply their own contract),
// but never their own role identity.
const REGISTRY_PATH = path.join(PROJECT_ROOT, ".claude", "agents", "_org", "role-registry.json");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

let _contract = null;
let _registry = null;
function loadContract(force) {
  if (!_contract || force) _contract = readJson(CONTRACT_PATH);
  return _contract;
}
function loadRegistry(force) {
  if (!_registry || force) _registry = readJson(REGISTRY_PATH);
  return _registry;
}

/** Registry attributes for a role (or null if unknown). */
function registryAttrs(role) {
  const reg = loadRegistry();
  const r = reg.roles && reg.roles[role];
  if (!r) return null;
  return {
    tier: r.tier || null,
    kind: r.kind || null,
    provider: r.provider || null,
    build_chain: r.build_chain === true,
    claude_pinned: r.claude_pinned === true,
  };
}

/** Apply class_derivation rules (first match) to a role's registry attributes. */
function classForRole(role) {
  const contract = loadContract();
  const attrs = registryAttrs(role);
  if (!attrs) return null; // unknown role — caller decides (validateDispatch flags it)
  const rules = (contract.class_derivation && contract.class_derivation.rules) || [];
  for (const rule of rules) {
    const w = rule.when || {};
    let match = true;
    for (const k of Object.keys(w)) {
      if (attrs[k] !== w[k]) { match = false; break; }
    }
    if (match) return rule.class;
  }
  return (contract.class_derivation && contract.class_derivation.fallback_class) || null;
}

function mergeContract(base, over) {
  if (!over) return base;
  const out = { ...base, ...over };
  // one-level-deep merge for the nested policy objects.
  for (const key of ["coverage", "budget"]) {
    if (base[key] || over[key]) out[key] = { ...(base[key] || {}), ...(over[key] || {}) };
  }
  // strip _doc/_note noise from a resolved contract.
  delete out._doc;
  delete out._note;
  return out;
}

/**
 * The resolved dispatch contract for a role: defaults <- class <- role_override.
 * Returns { role, class, ...contract } or { role, class:null, unknown:true }.
 */
function contractForRole(role) {
  const contract = loadContract();
  const cls = classForRole(role);
  if (!cls) return { role, class: null, unknown: true };
  const classContract = (contract.role_classes && contract.role_classes[cls]) || {};
  const override = (contract.role_overrides && contract.role_overrides[role]) || null;
  const resolved = mergeContract(mergeContract(contract.defaults || {}, classContract), override);
  return { role, class: cls, ...resolved };
}

function toolMatches(allowed, toolId) {
  if (allowed == null) return toolId == null || toolId === null;
  if (Array.isArray(allowed)) return allowed.includes(toolId);
  return allowed === toolId;
}

/**
 * Validate a proposed dispatch against the role's contract.
 *   { role, shape, toolId?, cwd? } -> { ok, violations[], contract }
 * Encodes failures (ii) + (iii); (i) is the coverage gate's job (it reads `coverage`).
 */
function validateDispatch(req) {
  const violations = [];
  const role = req && req.role;
  const shape = req && req.shape;
  if (!role) return { ok: false, violations: ["no role supplied"], contract: null };
  const c = contractForRole(role);
  if (c.unknown) {
    return { ok: false, violations: [`role '${role}' is not in role-registry.json — cannot resolve a dispatch contract (fail-closed)`], contract: c };
  }
  if (!shape) {
    violations.push("no shape supplied");
  } else {
    // DEFENSE-IN-DEPTH (GPT-5.5 review MEDIUM fix): enforce the build_chain ->
    // NOT-in-process invariant DIRECTLY against role-registry, independent of the
    // merged contract. A misconfigured class/override that accidentally re-allowed
    // in-process-agent for a build-chain role would otherwise pass; this hard check
    // can't be bypassed by editing dispatch-contract.json. (validateContractFile
    // remains the integrity gate; this is the runtime backstop.)
    const attrs = registryAttrs(role);
    if (attrs && attrs.build_chain && shape === "in-process-agent") {
      violations.push(`role '${role}' is build_chain (role-registry) and MUST NOT be dispatched in-process-agent — hard invariant, independent of the contract file.`);
    }
    const allowed = c.allowed_shapes || [];
    const forbidden = c.forbidden_shapes || [];
    if (forbidden.includes(shape)) {
      // (iii) in-process-when-subprocess for build-chain is the canonical case.
      violations.push(`shape '${shape}' is FORBIDDEN for role '${role}' (class ${c.class}). Allowed: ${allowed.join(", ")}.`);
    } else if (!allowed.includes(shape)) {
      // (ii) api-when-CLI lands here: 'api' not in a CLI role's allowed_shapes.
      const hint = shape === "api" ? " — API availability never implies API dispatch (PLAN §3/N-2)." : "";
      violations.push(`shape '${shape}' is not allowed for role '${role}' (class ${c.class}). Allowed: ${allowed.join(", ")}.${hint}`);
    }
  }
  if (req && "toolId" in req && shape && !violations.length) {
    if (!toolMatches(c.tool_id, req.toolId)) {
      violations.push(`tool '${req.toolId}' does not match the contract tool_id (${JSON.stringify(c.tool_id)}) for role '${role}'.`);
    }
  }
  if (c.cwd_policy === "worktree-required") {
    // GPT-5.5 review R2 MEDIUM: omitting cwd is NOT a bypass — a worktree-required
    // dispatch MUST name its isolated worktree. Absent OR canonical-root => violation.
    if (!req.cwd) {
      violations.push(`role '${role}' has cwd_policy 'worktree-required' but NO cwd was supplied — a build-chain dispatch must name its isolated worktree (omitting cwd is not a bypass).`);
    } else if (path.resolve(req.cwd) === PROJECT_ROOT) {
      violations.push(`role '${role}' has cwd_policy 'worktree-required' but cwd is the canonical root — a build-chain role must run in an isolated worktree.`);
    }
  }
  return { ok: violations.length === 0, violations, contract: c };
}

/**
 * Resolve a skill's execution shape (PLAN §13). Fail-closed: an unverified
 * `subprocess` candidate is treated as `inline` (never trust an unverified
 * subprocess classification). Returns { skill, execution, verified, source }.
 */
function skillExecution(skill) {
  const contract = loadContract();
  const cand = contract.skills && contract.skills.candidates && contract.skills.candidates[skill];
  if (!cand) return { skill, execution: "inline", verified: false, source: "default" };
  if (cand.execution === "subprocess" && cand.subprocess_verified !== true) {
    return { skill, execution: "inline", verified: false, source: "unverified-subprocess-falls-back-to-inline" };
  }
  return { skill, execution: cand.execution, verified: cand.subprocess_verified === true, source: "candidate" };
}

/**
 * Keystone integrity check. Returns { ok, violations[] }.
 * - every role-registry role resolves to a known class,
 * - every class's allowed_shapes/forbidden_shapes reference real shapes,
 * - the build-chain <-> in-process invariant holds for every build-chain role,
 * - role_overrides reference real roles.
 */
function validateContractFile() {
  const violations = [];
  let contract, reg;
  try {
    contract = loadContract(true);
    reg = loadRegistry(true);
  } catch (e) {
    return { ok: false, violations: [`cannot load contract/registry: ${e && e.message ? e.message : e}`] };
  }
  const shapeNames = new Set(Object.keys(contract.shapes || {}));
  const classNames = new Set(Object.keys(contract.role_classes || {}));

  // classes reference real shapes
  for (const [cls, def] of Object.entries(contract.role_classes || {})) {
    for (const s of def.allowed_shapes || []) if (!shapeNames.has(s)) violations.push(`class ${cls} allows unknown shape '${s}'`);
    for (const s of def.forbidden_shapes || []) if (!shapeNames.has(s)) violations.push(`class ${cls} forbids unknown shape '${s}'`);
    // a class may not both allow and forbid the same shape
    for (const s of def.allowed_shapes || []) if ((def.forbidden_shapes || []).includes(s)) violations.push(`class ${cls} both allows AND forbids '${s}'`);
  }
  // derivation rules reference real classes
  for (const rule of (contract.class_derivation && contract.class_derivation.rules) || []) {
    if (!classNames.has(rule.class)) violations.push(`class_derivation rule -> unknown class '${rule.class}'`);
  }
  const fb = contract.class_derivation && contract.class_derivation.fallback_class;
  if (fb && !classNames.has(fb)) violations.push(`fallback_class '${fb}' is not a defined class`);

  // every registry role classifies, and build-chain invariant holds
  const scrapped = new Set(Object.keys(reg.scrapped || {}));
  for (const role of Object.keys(reg.roles || {})) {
    const cls = classForRole(role);
    if (!cls || !classNames.has(cls)) {
      violations.push(`registry role '${role}' does not resolve to a defined class (got ${JSON.stringify(cls)})`);
      continue;
    }
    const c = contractForRole(role);
    const attrs = registryAttrs(role);
    if (attrs && attrs.build_chain) {
      if ((c.allowed_shapes || []).includes("in-process-agent")) violations.push(`build-chain role '${role}' must NOT allow in-process-agent`);
      if (!(c.forbidden_shapes || []).includes("in-process-agent")) violations.push(`build-chain role '${role}' must FORBID in-process-agent`);
      if (!(c.allowed_shapes || []).includes("subprocess-claude")) violations.push(`build-chain role '${role}' must allow subprocess-claude`);
    }
    // a cross-provider reviewer must not be in-process (kills diversity)
    if (attrs && attrs.kind === "reviewer" && attrs.provider && attrs.provider !== "claude") {
      if (!(c.forbidden_shapes || []).includes("in-process-agent")) violations.push(`cross-provider reviewer '${role}' must FORBID in-process-agent (provider diversity)`);
    }
  }
  // role_overrides reference real, non-scrapped roles
  for (const role of Object.keys(contract.role_overrides || {})) {
    if (role.startsWith("_")) continue;
    if (!reg.roles || !reg.roles[role]) {
      if (scrapped.has(role)) violations.push(`role_override '${role}' targets a SCRAPPED role`);
      else violations.push(`role_override '${role}' is not a role in role-registry.json`);
    }
  }
  return { ok: violations.length === 0, violations };
}

module.exports = {
  loadContract, loadRegistry, classForRole, contractForRole, validateDispatch,
  skillExecution, validateContractFile, registryAttrs, CONTRACT_PATH, REGISTRY_PATH,
  ARGV_SCHEMA_VERSION,
};

// ── CLI ─────────────────────────────────────────────────────
if (require.main === module) {
  const [, , cmd, ...rest] = process.argv;
  if (cmd === "validate") {
    const res = validateContractFile();
    process.stdout.write(JSON.stringify(res, null, 2) + "\n");
    process.exit(res.ok ? 0 : 1);
  }
  if (cmd === "role" && rest[0]) {
    process.stdout.write(JSON.stringify(contractForRole(rest[0]), null, 2) + "\n");
    process.exit(0);
  }
  if (cmd === "check" && rest[0]) {
    // check <role> <shape> [toolId]
    const res = validateDispatch({ role: rest[0], shape: rest[1], toolId: rest[2] });
    process.stdout.write(JSON.stringify(res, null, 2) + "\n");
    process.exit(res.ok ? 0 : 1);
  }
  process.stderr.write("usage: dispatch-contract.js validate | role <role> | check <role> <shape> [toolId]\n");
  process.exit(2);
}
