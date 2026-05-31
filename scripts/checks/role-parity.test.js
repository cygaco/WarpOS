#!/usr/bin/env node
"use strict";

/**
 * Bite-test for role-parity-scan.js — proves evaluate() REJECTS each drift class
 * (an enforcer with no negative test is a false-green waiting to happen).
 *
 *   node scripts/checks/role-parity.test.js
 */

const assert = require("assert");
const { evaluate, parseGammaOnlyTypes, collectOrgRoles } = require("./role-parity-scan");

let passed = 0;
const failures = [];
function test(name, fn) {
  try { fn(); passed++; } catch (e) { failures.push(`${name}: ${e.message}`); }
}

// A minimal coherent org + registries. agentResolves stubbed to accept the built agents.
const coherentOrg = {
  orchestrator: { role: "alpha", agent: "alpha" },
  referee: { role: "beta", agent: "beta" },
  domains: {
    product: {
      director: { role: "director-of-product-management", agent: "director-of-product" },
      leads: [
        { role: "product-lead", agent: null, specialists: [{ role: "product-designer", agent: null }] },
        { role: "qa-lead", agent: "director-of-qa" },
      ],
    },
    engineering: {
      director: { role: "director-of-engineering", agent: null },
      builders: [
        { role: "frontend-builder", agent: null },
        { role: "backend-builder", agent: null },
      ],
    },
  },
  gauntlets: {
    "code-qc": { members: ["reviewer", "compliance", "redteam", "fixer"] },
    "design-quality": { members: [] },
  },
  routing: {
    _doc: "ignored",
    product: { owner_role: "product-lead" },
    engineering: { owner_role: "director-of-engineering" },
    design_quality: { owner_role: "design-quality-gauntlet" },
    enforcer_emitted: { owner_role: "enforcer" },
  },
};
const ROLES = ["alpha", "beta", "gamma", "delta", "builder", "fixer", "reviewer", "compliance", "learner", "qa", "redteam", "stub-scaffold"];
const gammaOnly = new Set(["builder", "fixer", "reviewer", "compliance", "learner", "qa", "redteam", "delta"]);
const resolveAll = () => true; // every declared built agent resolves

const clone = (o) => JSON.parse(JSON.stringify(o));

// 0. POSITIVE — the coherent fixture passes
test("coherent org → 0 errors", () => {
  const errs = evaluate({ org: clone(coherentOrg), ROLES, gammaOnly, agentResolves: resolveAll });
  assert.deepStrictEqual(errs, [], `expected clean, got: ${errs.join("; ")}`);
});

// 1. BITE — a built agent that does not resolve
test("built agent that does not resolve → rejected", () => {
  const errs = evaluate({ org: clone(coherentOrg), ROLES, gammaOnly, agentResolves: () => false });
  assert.ok(errs.some((e) => /claims built agent .* but no spec resolves/.test(e)), `expected unresolved-agent error, got: ${errs.join("; ")}`);
});

// 2. BITE — gauntlet member not a real dispatch role
test("gauntlet member ∉ catalog ROLES → rejected", () => {
  const org = clone(coherentOrg);
  org.gauntlets["code-qc"].members.push("ghost-reviewer");
  const errs = evaluate({ org, ROLES, gammaOnly, agentResolves: resolveAll });
  assert.ok(errs.some((e) => /gauntlet member "ghost-reviewer" is not a dispatch role/.test(e)), `expected ghost-member error, got: ${errs.join("; ")}`);
});

// 3. BITE — routing owner_role undefined in the org map
test("routing owner_role undefined → rejected", () => {
  const org = clone(coherentOrg);
  org.routing.product.owner_role = "nonexistent-lead";
  const errs = evaluate({ org, ROLES, gammaOnly, agentResolves: resolveAll });
  assert.ok(errs.some((e) => /owner_role "nonexistent-lead" is not defined/.test(e)), `expected undefined-owner_role error, got: ${errs.join("; ")}`);
});

// 4. BITE — an ungoverned catalog doer role
test("ungoverned catalog doer role → rejected", () => {
  const errs = evaluate({ org: clone(coherentOrg), ROLES: [...ROLES, "rogue-doer"], gammaOnly, agentResolves: resolveAll });
  assert.ok(errs.some((e) => /dispatch role "rogue-doer" is ungoverned/.test(e)), `expected ungoverned-role error, got: ${errs.join("; ")}`);
});

// 5. BITE — a built build-chain role not gated by team-guard
test("built build-chain role ∉ GAMMA_ONLY_TYPES → rejected (gate hole)", () => {
  const org = clone(coherentOrg);
  org.domains.engineering.builders[0].agent = "frontend-builder"; // mark BUILT
  // gammaOnly does NOT include frontend-builder → gate hole
  const errs = evaluate({ org, ROLES, gammaOnly, agentResolves: resolveAll });
  assert.ok(errs.some((e) => /built build-chain role "frontend-builder" is NOT in team-guard/.test(e)), `expected gate-hole error, got: ${errs.join("; ")}`);
});

// sanity: parseGammaOnlyTypes extracts a Set literal
test("parseGammaOnlyTypes extracts members", () => {
  const set = parseGammaOnlyTypes('const GAMMA_ONLY_TYPES = new Set([\n  "builder",\n  "qa",\n]);');
  assert.ok(set && set.has("builder") && set.has("qa"), "expected parsed set with builder+qa");
});

// sanity: collectOrgRoles separates built vs pending
test("collectOrgRoles tracks built agents + build-chain", () => {
  const { domainRoles, builtAgents } = collectOrgRoles(clone(coherentOrg));
  assert.ok(domainRoles.has("frontend-builder") && domainRoles.has("product-lead"), "domain roles collected");
  assert.ok(builtAgents.some((b) => b.agent === "director-of-qa"), "built agents collected");
});

if (failures.length) {
  process.stderr.write(`role-parity bite-test: ${passed} passed, ${failures.length} FAILED\n`);
  for (const f of failures) process.stderr.write(`  - ${f}\n`);
  process.exit(1);
}
process.stdout.write(`role-parity bite-test: ${passed}/${passed} passed (positive + 5 bite classes + 2 sanity)\n`);
process.exit(0);
