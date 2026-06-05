#!/usr/bin/env node
"use strict";

/**
 * scripts/dispatch/registry-roles.js — the dispatch-side reader for the role-registry
 * keystone (.claude/agents/_org/role-registry.json), v0.2 consumer-rewire foundation.
 *
 * The dispatch consumers (catalog.js, state.js, providers.js, dispatch-route-guard.js,
 * adhoc-fail-override.js) each hardcode role lists/maps that ARE the registry's data
 * under another name — provider/effort per role, the build-chain set, the gemini /
 * flagship-openai sets, the binding-reviewer gate keys. This is the ONE place that
 * DERIVES those from the registry, so a role change is a registry edit, not N edits
 * (the dispatch-side analog of scripts/sprint/hook-points.js#loadRoles).
 *
 * PURE + side-effect-free (no stdin, no logger) so it is safe to require from hooks.
 *
 * MIGRATION SAFETY: deriving both providers.js AND catalog.js provider maps from one
 * source makes scan:dispatch-routing-parity's JS-map-vs-JS-map cross-check tautological.
 * So (a) the parity gate must check derived-vs-REGISTRY (+ the human-maintained doc
 * table), never derived-vs-derived, and (b) each consumer's rewire ships with a one-shot
 * test asserting the derived map deep-equals the literal it replaces (see
 * test-registry-roles.js) — proof the derivation is faithful before the literal is cut.
 */

const fs = require("fs");
const path = require("path");

let _PATHS = null;
function paths() {
  if (!_PATHS) {
    try { _PATHS = require("../hooks/lib/paths").PATHS; } catch { _PATHS = {}; }
  }
  return _PATHS;
}

function registryPath() {
  const P = paths();
  if (P && P.orgRoleRegistry) return P.orgRoleRegistry;
  const root = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..");
  return path.join(root, ".claude", "agents", "_org", "role-registry.json");
}

function loadRegistry(p = registryPath()) {
  return JSON.parse(fs.readFileSync(p, "utf8").replace(/^﻿/, ""));
}

/** The roles object (roles may be under .roles or be the top-level map). */
function loadRoles(p = registryPath()) {
  const raw = loadRegistry(p);
  return raw && raw.roles && typeof raw.roles === "object" ? raw.roles : raw;
}

/** Active role ids (real role rows — carry a tier/home/kind; wrapper keys dropped). */
function roleIds(roles = loadRoles()) {
  return Object.keys(roles).filter(
    (k) => roles[k] && typeof roles[k] === "object" && (roles[k].tier || roles[k].home || roles[k].kind),
  );
}

// ── Per-field maps + derived sets (the consumer rewire targets) ───────────────

/** role -> provider (catalog.DEFAULT_PROVIDER_PER_ROLE, providers.DEFAULT_AGENT_PROVIDERS). */
function providerMap(roles = loadRoles()) {
  const out = {};
  for (const r of roleIds(roles)) if (roles[r].provider) out[r] = roles[r].provider;
  return out;
}

/** role -> effort (catalog.DEFAULT_EFFORT_PER_ROLE, providers.DEFAULT_REASONING_EFFORT). */
function effortMap(roles = loadRoles()) {
  const out = {};
  for (const r of roleIds(roles)) if (roles[r].effort) out[r] = roles[r].effort;
  return out;
}

/** role -> model. */
function modelMap(roles = loadRoles()) {
  const out = {};
  for (const r of roleIds(roles)) if (roles[r].model) out[r] = roles[r].model;
  return out;
}

const providerOf = (role, roles = loadRoles()) => (roles[role] ? roles[role].provider : undefined);
const effortOf = (role, roles = loadRoles()) => (roles[role] ? roles[role].effort : undefined);
const modelOf = (role, roles = loadRoles()) => (roles[role] ? roles[role].model : undefined);

/** Build-chain roles (dispatch-route-guard.BUILD_CHAIN_ROLES) — build_chain:true. */
function buildChainRoles(roles = loadRoles()) {
  return roleIds(roles).filter((r) => roles[r].build_chain === true);
}

/** Gemini-provider roles (state.GEMINI_ROLES). */
function geminiRoles(roles = loadRoles()) {
  return roleIds(roles).filter((r) => roles[r].provider === "gemini");
}

/** Flagship-OpenAI roles (state.FLAGSHIP_OPENAI_ROLES) — provider:openai + model gpt-5.5. */
function flagshipOpenaiRoles(roles = loadRoles()) {
  return roleIds(roles).filter((r) => roles[r].provider === "openai" && roles[r].model === "gpt-5.5");
}

/** Fixer roles (org-roles.REMEDIATION_ROLES) — kind:fixer. */
function fixerRoles(roles = loadRoles()) {
  return roleIds(roles).filter((r) => roles[r].kind === "fixer");
}

/**
 * The binding-reviewer gate-check keys (adhoc-fail-override.REVIEWER_KEYS, ED-023):
 * binding-verdict reviewers that write code-quality/scope gate_checks — kind:reviewer +
 * binding_verdict, excluding the claude-pinned design judges (design-quality/visual-review,
 * which carry their own non-"reviewer" gate cells). Returned snake_cased (gate_check field
 * names are snake), sorted for stable comparison.
 */
function reviewerGateKeys(roles = loadRoles()) {
  return roleIds(roles)
    .filter((r) => roles[r].kind === "reviewer" && roles[r].binding_verdict === true && !roles[r].claude_pinned)
    .map((r) => r.replace(/-/g, "_"))
    .sort();
}

module.exports = {
  registryPath,
  loadRegistry,
  loadRoles,
  roleIds,
  providerMap,
  effortMap,
  modelMap,
  providerOf,
  effortOf,
  modelOf,
  buildChainRoles,
  geminiRoles,
  flagshipOpenaiRoles,
  fixerRoles,
  reviewerGateKeys,
};
