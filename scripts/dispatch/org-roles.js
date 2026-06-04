#!/usr/bin/env node
"use strict";

/**
 * org-roles.js — config-driven role + gauntlet classification derived from the
 * machine-readable org map (.claude/agents/03-managers/_org/org-map.json).
 *
 * S1.1 work-modes chassis — the CORE domain-aware-dispatch refactor. This is the
 * SINGLE source that turns the org map into the role sets that team-guard, the
 * gauntlet launchers, and the role-parity enforcer all consume, so adding a
 * domain agent in Wave 2 = editing org-map.json, NOT editing N hardcoded lists.
 *
 * PURE + side-effect-free: it only READS org-map.json (no stdin, no writes, no
 * process exit). Safe to require() from the team-guard hook — unlike team-guard
 * itself, which reads stdin on load and must never be require()'d.
 *
 * org-map is the source of truth; a small DOCUMENTED static augmentation covers
 * roles that are gamma-only but not org-map domain builders / gauntlet members
 * (the 2026-04-29 rename aliases + transitional/system roles).
 */

const fs = require("fs");
const path = require("path");

const ROOT =
  process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..");
const ORG_MAP_PATH = path.join(
  ROOT,
  ".claude",
  "agents",
  "03-managers",
  "_org",
  "org-map.json",
);

// Gamma-only roles that are NOT derivable from the org map: legacy rename
// aliases + transitional/system roles. DOCUMENTED here, not hidden. Each
// transitional entry retires as Wave 2 lands (mirrors role-parity TRANSITIONAL).
const STATIC_GAMMA_ONLY_AUGMENT = [
  "builder", // transitional → frontend-builder/backend-builder (Wave 2 S2.3)
  "qa", // DEPRECATED (ADR-0007): absorbed into qa-reviewer; legacy catalog id kept gamma-gated
  "learner", // system: build-chain analysis, gamma/delta-dispatched
  "delta", // oneshot orchestrator — only the gamma tier dispatches it in adhoc
  "fix-agent", // legacy alias (2026-04-29 rename)
  "evaluator", // legacy alias → reviewer
  "auditor", // legacy alias → learner
  // ADR-0007 cutover: SCRAPPED legacy review roles removed from the code-qc
  // gauntlet membership but still present in the dispatch catalog during
  // coexistence — keep them gamma-gated so team-guard can't be bypassed via a
  // legacy id. Not dispatched live (gamma/delta use the derived roster); these
  // trim out with the catalog-roster cleanup.
  "reviewer", // DEPRECATED → frontend-reviewer/backend-reviewer
  "compliance", // DEPRECATED → qa-reviewer (alias)
  "redteam", // DEPRECATED → security-reviewer (alias)
];

// Gauntlet members that REMEDIATE (apply fixes) rather than review in parallel —
// excluded from reviewGauntletRoles() so a fixer is never launched as a reviewer.
const REMEDIATION_ROLES = new Set(["fixer", "fix-agent"]);

function readOrgMap() {
  return JSON.parse(fs.readFileSync(ORG_MAP_PATH, "utf8").replace(/^﻿/, ""));
}

/**
 * Build-chain DOER roles declared in org-map: every domain `builders[].role`
 * plus every gauntlet member. These are the roles only Gamma/Delta may dispatch.
 */
function buildChainDoerRoles(org = readOrgMap()) {
  const set = new Set();
  for (const d of Object.values(org.domains || {})) {
    for (const b of d.builders || []) if (b.role) set.add(b.role);
  }
  for (const g of Object.values(org.gauntlets || {})) {
    for (const m of g.members || []) set.add(m);
  }
  return set;
}

/**
 * The full set of agent types only Gamma (γ)/Delta (δ) may dispatch:
 * org-map-derived build-chain doers ∪ the static augment.
 */
function gammaOnlyTypes(org = readOrgMap()) {
  return new Set([...STATIC_GAMMA_ONLY_AUGMENT, ...buildChainDoerRoles(org)]);
}

/** All gauntlets from org-map (name -> { domain, members, ... }). */
function gauntlets(org = readOrgMap()) {
  return org.gauntlets || {};
}

/**
 * Gauntlet(s) applicable to a domain: an exact `domain` match plus any
 * `cross-domain` gauntlet (e.g. design-quality approves across Product + Marketing).
 */
function gauntletForDomain(domain, org = readOrgMap()) {
  const out = {};
  for (const [name, g] of Object.entries(org.gauntlets || {})) {
    if (g.domain === domain || g.domain === "cross-domain") out[name] = g;
  }
  return out;
}

/**
 * Review personas for a domain's gauntlet(s): the members minus remediation
 * roles (fixer). This is what the parallel review launchers should run.
 */
function reviewGauntletRoles(domain, org = readOrgMap()) {
  const roles = [];
  for (const g of Object.values(gauntletForDomain(domain, org))) {
    for (const m of g.members || []) {
      if (!REMEDIATION_ROLES.has(m) && !roles.includes(m)) roles.push(m);
    }
  }
  return roles;
}

// ── ADR-0007 cutover (step 2): the gauntlet roster, DERIVED, never hardcoded ──
// The old gauntlet `--roles reviewer,compliance,qa,redteam` was hardcoded in
// gamma.md/delta.md and the delta-* launchers. After the role-rewrite, qa +
// compliance + req-reviewer ABSORB into ONE qa-reviewer and redteam → ONE
// security-reviewer, so a per-token substitution would produce a DUPLICATE
// qa-reviewer and a collapsed expected-record count (gauntlet-verify checks for
// one ok:true record PER listed role → it would pass on fewer real reviewers
// than intended). So the roster is derived from org-map.json's code-qc gauntlet,
// de-duplicated, with the pod code-reviewers (frontend-reviewer/backend-reviewer)
// gated to the pods that ACTUALLY built (a FE-only build must not expect a
// backend-reviewer record → false RED).

// Pod code-reviewers — the per-pod split of the old generic `reviewer`. The
// member→pod map is intrinsic to the reviewer's name (`<pod>-reviewer`).
const POD_REVIEWER_PODS = { "frontend-reviewer": "frontend", "backend-reviewer": "backend" };

// Reviewers that are NOT Bash-dispatched code-qc gauntlet lanes: the Claude-pinned
// visual reviewers (design-quality, visual-review) are dispatched SEPARATELY via
// the Agent tool (they need Playwright-MCP) by gamma/delta's design-authority +
// visual-review steps. They do NOT write a code-qc dispatch-completion record, so
// they must be excluded from the gauntlet-verify --roles roster or every verify
// false-REDs on a missing design-quality record.
const NON_GAUNTLET_REVIEWERS = new Set(["design-quality", "visual-review", "test-runner"]);

/**
 * The engineering CODE-QC review roster from the org map (pod code-reviewers +
 * qa-reviewer + security-reviewer), de-duplicated, with remediation (fixer) AND
 * the separately-dispatched visual reviewers filtered out. This is the roster the
 * Bash-dispatched gauntlet runs + that gauntlet-verify checks for completion
 * records. The UNCONDITIONAL membership; callers that know which pods built should
 * narrow it via `expectedGauntletRoles(pods)`.
 */
function gauntletReviewRoles(org = readOrgMap()) {
  const codeQc = (org.gauntlets || {})["code-qc"];
  const members = (codeQc && codeQc.members) || [];
  const roles = [];
  for (const m of members) {
    if (REMEDIATION_ROLES.has(m)) continue;
    if (NON_GAUNTLET_REVIEWERS.has(m)) continue;
    if (!roles.includes(m)) roles.push(m);
  }
  return roles;
}

/**
 * The expected reviewer roster for a gauntlet run given the pods that built.
 *
 * @param {string[]|null} pods  the engineering pods whose builders ran
 *   (subset of "frontend"|"backend"|"security"). null/empty/undefined = "all
 *   pods" (no pod info → expect every pod reviewer, the safe non-narrowing
 *   default — better a strict over-expectation than a silent under-check).
 * @returns string[] de-duplicated expected review roles, in roster order.
 *
 * Non-pod reviewers (qa-reviewer, security-reviewer) ALWAYS run — qa-reviewer
 * covers traceability+integrity+functional for every feature, security-reviewer
 * is the standing security lane. Pod code-reviewers run only for their pod.
 */
function expectedGauntletRoles(pods, org = readOrgMap()) {
  const all = gauntletReviewRoles(org);
  const podSet = Array.isArray(pods) && pods.length ? new Set(pods) : null;
  const out = [];
  for (const r of all) {
    const pod = POD_REVIEWER_PODS[r];
    if (pod && podSet && !podSet.has(pod)) continue; // pod reviewer for a pod that didn't build
    if (!out.includes(r)) out.push(r);
  }
  return out;
}

/** Every domain role: directors + leads + specialists + builders. */
function domainRoles(org = readOrgMap()) {
  const set = new Set();
  const add = (r) => {
    if (r) set.add(r);
  };
  for (const d of Object.values(org.domains || {})) {
    if (d.director) add(d.director.role);
    for (const lead of d.leads || []) {
      add(lead.role);
      for (const sp of lead.specialists || []) add(sp.role);
    }
    for (const sp of d.specialists || []) add(sp.role);
    for (const b of d.builders || []) add(b.role);
  }
  return set;
}

module.exports = {
  ORG_MAP_PATH,
  STATIC_GAMMA_ONLY_AUGMENT,
  REMEDIATION_ROLES,
  POD_REVIEWER_PODS,
  readOrgMap,
  buildChainDoerRoles,
  gammaOnlyTypes,
  gauntlets,
  gauntletForDomain,
  reviewGauntletRoles,
  gauntletReviewRoles,
  expectedGauntletRoles,
  domainRoles,
};

// CLI: print the derived sets for inspection / debugging.
if (require.main === module) {
  const org = readOrgMap();
  const out = {
    gammaOnlyTypes: [...gammaOnlyTypes(org)].sort(),
    buildChainDoerRoles: [...buildChainDoerRoles(org)].sort(),
    domainRoles: [...domainRoles(org)].sort(),
    gauntlets: Object.keys(gauntlets(org)),
    reviewGauntletRoles_engineering: reviewGauntletRoles("engineering", org),
    gauntletReviewRoles: gauntletReviewRoles(org),
    expectedGauntletRoles_all: expectedGauntletRoles(null, org),
    expectedGauntletRoles_frontendOnly: expectedGauntletRoles(["frontend"], org),
  };
  process.stdout.write(JSON.stringify(out, null, 2) + "\n");
}
