#!/usr/bin/env node
"use strict";

/**
 * Bite-test for role-parity-scan.js — proves evaluate() REJECTS each drift class
 * (an enforcer with no negative test is a false-green waiting to happen).
 *
 *   node scripts/checks/role-parity.test.js
 */

const assert = require("assert");
const { execFileSync } = require("child_process");
const {
  evaluate,
  evaluateRegistry,
  evaluateReportingStructure,
  scanSpecTree,
  evaluateHooks,
  parseGammaOnlyTypes,
  collectOrgRoles,
  evaluateModelPins,
  evaluateShapeRouteConflicts,
} = require("./role-parity-scan");

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

// ── Registry keystone bite-tests (ADR-0007) — evaluateRegistry rejects each class ──
const catalogStub = { PROVIDER_LIST: [{ models: [{ id: "claude-opus-4-8", aliases: ["opus"] }, { id: "gpt-5.5" }] }] };
const coherentReg = { roles: {
  alpha: { model: "claude-opus-4-8", effort: "max", dispatchable_by: [] },
  beta: { model: "claude-opus-4-8", effort: "xhigh", dispatchable_by: [] },
  rev: { model: "gpt-5.5", effort: "xhigh", dispatchable_by: ["alpha"], dispatches: ["beta"] },
} };

test("registry: coherent → 0 errors", () => {
  assert.deepStrictEqual(evaluateRegistry(clone(coherentReg), catalogStub), []);
});
test("registry: model ∉ catalog → rejected", () => {
  const r = clone(coherentReg); r.roles.rev.model = "gpt-99";
  assert.ok(evaluateRegistry(r, catalogStub).some((e) => /model "gpt-99" is not in the catalog/.test(e)), "expected bad-model error");
});
test("registry: dispatch ref to unknown role → rejected", () => {
  const r = clone(coherentReg); r.roles.rev.dispatchable_by = ["ghost"];
  assert.ok(evaluateRegistry(r, catalogStub).some((e) => /names unknown role "ghost"/.test(e)), "expected unknown-dispatch-ref error");
});
test("registry: max on non-alpha → rejected", () => {
  const r = clone(coherentReg); r.roles.beta.effort = "max";
  assert.ok(evaluateRegistry(r, catalogStub).some((e) => /reserved for alpha/.test(e)), "expected max-policy error");
});
test("registry: gpt-5.5 + max → rejected (ceiling xhigh)", () => {
  const r = clone(coherentReg); r.roles.rev.effort = "max";
  assert.ok(evaluateRegistry(r, catalogStub).some((e) => /ceiling is xhigh/.test(e)), "expected gpt-5.5-ceiling error");
});

// ── Reporting-line invariant bite-tests (ADR-0007, operator 2026-06-04) ──────
// "reviewers CANNOT report to doers; doers CAN report to reviewers; both share a
// manager." Doer = kind∈{builder,fixer} OR build_chain:true. A reviewer whose
// dispatchable_by resolves to a doer must be REJECTED (severity critical).
// Fixture: a manager (lead), two doers (builder by kind, a build_chain:true tool),
// and reviewers — mirrors the real registry's frontend pod shape.
const reportingReg = { roles: {
  lead: { kind: "lead", model: "claude-opus-4-8", effort: "high", dispatchable_by: [] },
  bld: { kind: "builder", model: "claude-opus-4-8", effort: "high", build_chain: true, dispatchable_by: ["lead"] },
  scaffold: { kind: "tool", model: "claude-opus-4-8", effort: "high", build_chain: true, dispatchable_by: ["lead"] },
  rvw: { kind: "reviewer", model: "gpt-5.5", effort: "xhigh", dispatchable_by: ["lead"] },
} };

test("reporting-line: reviewer dispatchable_by a LEAD (manager) → clean", () => {
  assert.deepStrictEqual(evaluateRegistry(clone(reportingReg), catalogStub), [],
    "reviewer reporting to a non-doer manager must stay green");
});
test("reporting-line: doer dispatchable_by a reviewer → clean (allowed direction)", () => {
  const r = clone(reportingReg); r.roles.bld.dispatchable_by = ["lead", "rvw"];
  assert.deepStrictEqual(evaluateRegistry(r, catalogStub), [],
    "doers CAN report to reviewers — must not be flagged");
});
test("reporting-line: reviewer dispatchable_by a BUILDER (kind) → rejected (CRITICAL)", () => {
  const r = clone(reportingReg); r.roles.rvw.dispatchable_by = ["lead", "bld"];
  const errs = evaluateRegistry(r, catalogStub);
  assert.ok(errs.some((e) => /reviewer "rvw" is dispatchable_by doer "bld".*reporting-line/.test(e) && /CRITICAL/.test(e)),
    `expected critical reporting-line violation, got: ${errs.join("; ")}`);
});
test("reporting-line: reviewer dispatchable_by a build_chain TOOL → rejected (build_chain doer)", () => {
  const r = clone(reportingReg); r.roles.rvw.dispatchable_by = ["scaffold"];
  const errs = evaluateRegistry(r, catalogStub);
  assert.ok(errs.some((e) => /reviewer "rvw" is dispatchable_by doer "scaffold".*build_chain/.test(e)),
    `expected build_chain-doer violation, got: ${errs.join("; ")}`);
});

// ── ED-024 INDEPENDENT-WITNESS bite-tests — the Trap-A non-vacuity proof ─────
// Once the org-map reporting-line view collapses into the registry, role-parity
// reads the registry for the reporting structure. evaluateReportingStructure keeps
// the gate non-vacuous by checking that structure against the INDEPENDENT spec
// tree (scanSpecTree, file-authored, NOT registry-derived). These tests PROVE the
// witness BITES when the registry's reporting fields drift from the tree — exactly
// the property dispatch-routing-parity's bite-test proves for its registry anchor.
// A synthetic spec-tree witness (decoupled from disk so the bite is deterministic).
const witnessTree = { byName: {
  alpha:           { home: "president",   sub_home: null,      file: "president/alpha.md" },
  "product-lead":  { home: "product",     sub_home: null,      file: "product/product-lead.md" },
  "qa-reviewer":   { home: "product",     sub_home: "quality", file: "product/quality/qa-reviewer.md" },
  "frontend-builder": { home: "engineering", sub_home: "frontend", file: "engineering/frontend/builder.md" },
} };
const structReg = { roles: {
  alpha:              { home: "president",   tier: "face",   kind: "run" },
  "product-lead":     { home: "product",     tier: "lead",   kind: "lead" },
  "qa-reviewer":      { home: "product", sub_home: "quality", tier: "worker", kind: "reviewer" },
  "frontend-builder": { home: "engineering", sub_home: "frontend", tier: "worker", kind: "builder" },
} };

test("witness: registry ⇄ spec tree consistent → 0 errors", () => {
  const errs = evaluateReportingStructure({ reg: clone(structReg), specTree: witnessTree });
  assert.deepStrictEqual(errs, [], `expected clean, got: ${errs.join("; ")}`);
});

// BITE 1 (non-vacuity) — a registry HOME that drifts from the spec-tree department
// IS caught. This is the whole reason the witness exists: the structure lives in
// the registry, but a wrong reporting department is caught against the FILE TREE,
// not against the registry itself. A registry-vs-registry check would MISS this.
test("witness: registry home drifts from spec-tree department → rejected", () => {
  const r = clone(structReg);
  r.roles["product-lead"].home = "engineering"; // registry says eng; spec lives in product/
  const errs = evaluateReportingStructure({ reg: r, specTree: witnessTree });
  assert.ok(errs.some((e) => /home-drift: registry role "product-lead" home="engineering".*department "product"/.test(e)),
    `expected home-drift bite, got: ${errs.join("; ")}`);
});

// BITE 2 — a registry SUB_HOME (pod) that drifts from the spec-tree pod is caught.
test("witness: registry sub_home drifts from spec-tree pod → rejected", () => {
  const r = clone(structReg);
  r.roles["qa-reviewer"].sub_home = "frontend"; // spec lives in product/quality/
  const errs = evaluateReportingStructure({ reg: r, specTree: witnessTree });
  assert.ok(errs.some((e) => /sub_home-drift: registry role "qa-reviewer" sub_home="frontend".*pod "quality"/.test(e)),
    `expected sub_home-drift bite, got: ${errs.join("; ")}`);
});

// BITE 3 — a registry role with NO backing spec on disk is caught (the structure
// names a role the tree does not back — e.g. a role added to the registry whose
// spec was never filed, or a typo'd registry key).
test("witness: registry role absent from spec tree → rejected (no-spec-on-disk)", () => {
  const r = clone(structReg);
  r.roles["ghost-lead"] = { home: "product", tier: "lead", kind: "lead" };
  const errs = evaluateReportingStructure({ reg: r, specTree: witnessTree });
  assert.ok(errs.some((e) => /no-spec-on-disk: registry role "ghost-lead"/.test(e)),
    `expected no-spec-on-disk bite, got: ${errs.join("; ")}`);
});

// BITE 4 — sub_home present in registry but the spec is at department level (no pod)
// → drift (absent ≢ "quality"). Guards the absent≡null normalization both ways.
test("witness: registry sub_home set but spec at department level → rejected", () => {
  const r = clone(structReg);
  r.roles["product-lead"].sub_home = "quality"; // spec lives directly in product/, no pod
  const errs = evaluateReportingStructure({ reg: r, specTree: witnessTree });
  assert.ok(errs.some((e) => /sub_home-drift: registry role "product-lead" sub_home="quality".*pod \(none\)/.test(e)),
    `expected sub_home-vs-none bite, got: ${errs.join("; ")}`);
});

// NO FALSE POSITIVE — an exempt role skips the home/sub_home check but must still
// resolve to a spec (the exempt seam for faces/system roles, if ever needed).
test("witness: exempt role skips home check but still needs a spec", () => {
  const r = clone(structReg);
  r.roles.alpha.home = "somewhere-else"; // would drift, but alpha is exempt
  const errs = evaluateReportingStructure({ reg: r, specTree: witnessTree, exempt: new Set(["alpha"]) });
  assert.ok(!errs.some((e) => /alpha/.test(e)), `exempt role must not be flagged for home drift, got: ${errs.join("; ")}`);
});

// INTEGRATION (real disk) — scanSpecTree over the real .claude/agents/ tree backs
// EVERY real registry role, and the real registry's home/sub_home match the tree.
// This is the live, non-synthetic non-vacuity proof: it would FAIL the moment the
// real registry's reporting structure diverged from where the specs actually live.
test("witness: REAL registry ⇄ REAL spec tree (live, 0 drift)", () => {
  const fs = require("fs");
  const path = require("path");
  const root = path.join(__dirname, "..", "..");
  const reg = JSON.parse(fs.readFileSync(path.join(root, ".claude/agents/_org/role-registry.json"), "utf8").replace(/^﻿/, ""));
  const specTree = scanSpecTree(root);
  const errs = evaluateReportingStructure({ reg, specTree });
  assert.deepStrictEqual(errs, [], `real registry drifted from the spec tree: ${errs.join("; ")}`);
  // sanity: the witness actually SAW the roster (not an empty-tree vacuous pass)
  assert.ok(Object.keys(specTree.byName).length >= 30, `spec tree witness saw too few specs (${Object.keys(specTree.byName).length}) — would be a vacuous pass`);
});

// ── Hook scrapped-literal scan bite-tests (ADR-0007 R4) ─────────────────────
// evaluateHooks must REJECT a hook keying on a raw scrapped literal with no
// safety net, and ACCEPT one that normalizes / derives / carries the canonical.
test("hooks: raw 'redteam' literal, no safety net → rejected", () => {
  const errs = evaluateHooks({ hookSources: { "bad.js": `const X = ["redteam", "builder"]; if (X.includes(t)) block();` } });
  assert.ok(errs.some((e) => /bad\.js.*redteam/.test(e)), `expected redteam flag, got: ${errs.join("; ")}`);
});
test("hooks: 'req-reviewer' literal, no safety net → rejected", () => {
  const errs = evaluateHooks({ hookSources: { "bad2.js": `if (role === "req-reviewer") gate();` } });
  assert.ok(errs.some((e) => /bad2\.js.*req-reviewer/.test(e)), `expected req-reviewer flag, got: ${errs.join("; ")}`);
});
test("hooks: scrapped literal + normalizeRole → clean (has safety net)", () => {
  const errs = evaluateHooks({ hookSources: { "ok1.js": `const {normalizeRole}=require("./lib/role-aliases"); if (normalizeRole(r)==="x"||r==="redteam") {}` } });
  assert.deepStrictEqual(errs, [], `expected clean (normalizes), got: ${errs.join("; ")}`);
});
test("hooks: scrapped literal + canonical replacement present → clean (backward-compat)", () => {
  const errs = evaluateHooks({ hookSources: { "ok2.js": `const SKIP=["redteam","security-reviewer"]; // handles old+new` } });
  assert.deepStrictEqual(errs, [], `expected clean (canonical present), got: ${errs.join("; ")}`);
});
test("hooks: compound id 'security-reviewer' alone → NOT flagged for 'reviewer'", () => {
  const errs = evaluateHooks({ hookSources: { "ok3.js": `const r = ["security-reviewer","qa-reviewer"];` } });
  assert.deepStrictEqual(errs, [], `compound ids must not false-flag, got: ${errs.join("; ")}`);
});
test("hooks: 'compliance'/'qa' gate-DIMENSION literal → NOT flagged (carve-out)", () => {
  // compliance + qa are persistent GATE_CHECK dimensions / new-role substrings —
  // deliberately out of scope; a hook using them raw must NOT trip the scan.
  const errs = evaluateHooks({ hookSources: { "ok4.js": `if (gate.compliance && gate.qa) {}` } });
  assert.deepStrictEqual(errs, [], `gate dimensions must not be flagged, got: ${errs.join("; ")}`);
});

// ── T-288: model-pin check bite-tests ───────────────────────────────────────
// evaluateModelPins must REJECT inherit (always) and a wrong claude model, and
// ACCEPT correct model pins (claude matches, cross-provider with any concrete).
const mpReg = { roles: {
  "director-of-engineering": { provider: "claude", model: "claude-opus-4-8", spec: ".claude/agents/engineering/director-of-engineering.md" },
  "cabinet": { provider: "openai", model: "gpt-5.5", spec: ".claude/agents/president/cabinet.md" },
} };

test("model-pin: claude role spec matches registry model → clean", () => {
  const specFm = {
    ".claude/agents/engineering/director-of-engineering.md": "claude-opus-4-8",
    ".claude/agents/president/cabinet.md": "claude-opus-4-8", // fallback pin (cross-provider: OK)
  };
  const errs = evaluateModelPins({ reg: mpReg, specFm });
  assert.deepStrictEqual(errs, [], `expected clean, got: ${errs.join("; ")}`);
});

test("model-pin: spec has model:inherit → rejected (any provider)", () => {
  const specFm = {
    ".claude/agents/engineering/director-of-engineering.md": "inherit",
  };
  const errs = evaluateModelPins({ reg: mpReg, specFm });
  assert.ok(
    errs.some((e) => /model-pin.*director-of-engineering.*inherit.*FORBIDDEN/.test(e)),
    `expected inherit-forbidden error, got: ${errs.join("; ")}`
  );
});

test("model-pin: claude role spec pins wrong model → rejected", () => {
  const specFm = {
    ".claude/agents/engineering/director-of-engineering.md": "claude-sonnet-4-6", // wrong
  };
  const errs = evaluateModelPins({ reg: mpReg, specFm });
  assert.ok(
    errs.some((e) => /model-pin.*director-of-engineering.*claude-sonnet-4-6.*claude-opus-4-8/.test(e)),
    `expected wrong-model error, got: ${errs.join("; ")}`
  );
});

// ── T-289: shape-vs-route parity bite-tests ──────────────────────────────────
// evaluateShapeRouteConflicts must REJECT a cross-provider lead (design-lead
// analog) when the class_derivation has no specific rule and it falls through to
// the tier:lead catch-all (→ manager, in-process-only), and ACCEPT when the
// specific cross_provider_consult_lead rule is present.
const cpLeadReg = { roles: {
  "design-lead": { tier: "lead", kind: "lead", provider: "openai", model: "gpt-5.5" },
  "product-lead": { tier: "lead", kind: "lead", provider: "claude", model: "claude-opus-4-8" },
  "quality-lead": { tier: "lead", kind: "lead", provider: "claude", model: "claude-opus-4-8" },
} };

// Contract WITHOUT the cross-provider-lead rule (revert-style planted violation)
const contractWithoutCPL = {
  class_derivation: {
    rules: [
      { when: { tier: "face" }, class: "face" },
      { when: { build_chain: true }, class: "build_chain_worker" },
      { when: { kind: "reviewer", provider: "openai" }, class: "cross_provider_reviewer" },
      { when: { tier: "director" }, class: "manager" },
      { when: { tier: "lead" }, class: "manager" }, // missing cross-provider-lead rule!
      { when: { kind: "tool", provider: "openai" }, class: "tool_cross_provider" },
    ],
    fallback_class: "manager"
  },
  role_classes: {
    face: { allowed_shapes: ["inline"] },
    build_chain_worker: { allowed_shapes: ["subprocess-claude"] },
    cross_provider_reviewer: { allowed_shapes: ["subprocess-cross-provider"] },
    manager: { allowed_shapes: ["in-process-agent"] },
    tool_cross_provider: { allowed_shapes: ["subprocess-cross-provider"] },
  }
};

// Contract WITH the cross-provider-lead rule (the fix applied)
const contractWithCPL = {
  class_derivation: {
    rules: [
      { when: { tier: "face" }, class: "face" },
      { when: { build_chain: true }, class: "build_chain_worker" },
      { when: { kind: "reviewer", provider: "openai" }, class: "cross_provider_reviewer" },
      { when: { tier: "director" }, class: "manager" },
      { when: { tier: "lead", provider: "openai" }, class: "cross_provider_consult_lead" },
      { when: { tier: "lead" }, class: "manager" },
      { when: { kind: "tool", provider: "openai" }, class: "tool_cross_provider" },
    ],
    fallback_class: "manager"
  },
  role_classes: {
    face: { allowed_shapes: ["inline"] },
    build_chain_worker: { allowed_shapes: ["subprocess-claude"] },
    cross_provider_reviewer: { allowed_shapes: ["subprocess-cross-provider"] },
    cross_provider_consult_lead: { allowed_shapes: ["subprocess-cross-provider"] },
    manager: { allowed_shapes: ["in-process-agent"] },
    tool_cross_provider: { allowed_shapes: ["subprocess-cross-provider"] },
  }
};

test("shape-route-conflict: cross-provider lead without specific rule → rejected", () => {
  const errs = evaluateShapeRouteConflicts({ reg: cpLeadReg, contract: contractWithoutCPL });
  assert.ok(
    errs.some((e) => /shape-route-conflict.*design-lead/.test(e)),
    `expected shape-route-conflict for design-lead, got: ${errs.join("; ")}`
  );
});

test("shape-route-conflict: cross-provider lead WITH specific rule → clean", () => {
  const errs = evaluateShapeRouteConflicts({ reg: cpLeadReg, contract: contractWithCPL });
  assert.deepStrictEqual(errs, [], `expected clean with cross_provider_consult_lead rule, got: ${errs.join("; ")}`);
});

test("shape-route-conflict: claude leads (product-lead/quality-lead) not flagged", () => {
  // Claude-provider leads are not subject to the cross-provider shape check
  const errs = evaluateShapeRouteConflicts({ reg: cpLeadReg, contract: contractWithoutCPL });
  assert.ok(
    !errs.some((e) => /product-lead/.test(e) || /quality-lead/.test(e)),
    `claude leads must not be flagged for shape-route, got: ${errs.join("; ")}`
  );
});

if (failures.length) {
  process.stderr.write(`role-parity bite-test: ${passed} passed, ${failures.length} FAILED\n`);
  for (const f of failures) process.stderr.write(`  - ${f}\n`);
  process.exit(1);
}
process.stdout.write(`role-parity bite-test: ${passed}/${passed} passed (positive + 5 bite classes + 2 sanity + model-pin + shape-route)\n`);
process.exit(0);
