/**
 * role-aliases.js — canonical-vs-legacy role-name mapping.
 *
 * The 2026-04-29 rename moved `evaluator` → `reviewer` and `auditor` → `learner`.
 * Historical event logs, retros, and old config snapshots still reference the
 * old names — we don't rewrite history. Anywhere we READ role names from data
 * we don't own (events.jsonl, retros, dispatch backups), pass through
 * `normalizeRole(name)` so historical and current data group together.
 *
 * Hooks must NEVER use substring matching to gate roles (`name.includes('eval')`
 * matches `evaluator`, `eval-utils`, anything containing `eval`). The bug class
 * is documented in RT-010. Always: `normalizeRole(role) === "reviewer"`.
 */

"use strict";

/** Map from legacy role name → canonical role name. */
const ROLE_ALIASES = Object.freeze({
  evaluator: "reviewer",
  // S-7 (PLAN §9.4): learner → ops-analyst. `auditor` collapses straight to the
  // new canonical (aliases are 1-hop — never auditor→learner→ops-analyst).
  auditor: "ops-analyst",
  learner: "ops-analyst",
  // ADR-0007 org-rewrite renames (old → new). 1:1 only — the splits
  // (reviewer/builder/fixer → per-pod FE/BE/Security) are NOT aliased (the
  // conducting face passes pod context); compliance + req-reviewer ABSORB into
  // qa-reviewer. Targets exist in catalog/registry, so normalizeRole resolves.
  "product-designer": "design-lead",
  "director-of-qa": "quality-lead",
  "research-insight-lead": "research-lead",
  "director-of-marketing": "director-of-growth",
  "growth-lead": "marketing-lead",
  "web-conversion-designer": "conversion-lead",
  redteam: "security-reviewer",
  qa: "qa-reviewer",
  compliance: "qa-reviewer",
  "req-reviewer": "qa-reviewer",
  // S-7 (PLAN §9.4): stub-scaffold → skeleton-builder (re-homed to engineering).
  "stub-scaffold": "skeleton-builder",
  // S-7 (PLAN §9.4): the W-4 freeform consult pseudo-roles advisor + consult
  // collapse into the ONE registered freeform role `cabinet` (President's office).
  advisor: "cabinet",
  consult: "cabinet",
});

/** Reverse map: canonical → legacy (for env-var / store-key compatibility). */
const LEGACY_ROLE_NAMES = Object.freeze({
  reviewer: "evaluator",
  // S-7: ops-analyst's legacy env/store key is the learner one (REASONING_LEARNER,
  // which itself legacy-chains to REASONING_AUDITOR via readReasoningEnv).
  "ops-analyst": "learner",
  "skeleton-builder": "stub-scaffold",
  cabinet: "advisor",
});

/**
 * Map any role name (legacy or canonical) to its canonical form. Unknown
 * names pass through unchanged so this is safe to apply universally.
 */
function normalizeRole(name) {
  if (!name || typeof name !== "string") return name;
  return ROLE_ALIASES[name] || name;
}

/**
 * Returns the legacy name for a canonical role, or null. Used when we need
 * to read backward-compat env vars (e.g. REASONING_EVALUATOR for `reviewer`).
 */
function legacyRoleFor(canonical) {
  return LEGACY_ROLE_NAMES[canonical] || null;
}

/**
 * True when `name` (in any form) refers to `expected` (in canonical form).
 * Use this in hook gates instead of `.includes()` substring checks.
 */
function isRole(name, expected) {
  return normalizeRole(name) === expected;
}

module.exports = {
  ROLE_ALIASES,
  LEGACY_ROLE_NAMES,
  normalizeRole,
  legacyRoleFor,
  isRole,
};
