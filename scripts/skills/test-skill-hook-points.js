#!/usr/bin/env node
"use strict";

/**
 * Bite-test for scripts/skills/skill-hook-points.js (M1 §8 skill-hook registry reader +
 * resolver). Proves validate() REJECTS each drift class — most importantly the
 * STALE-ROLE class (a skill row naming a role the role-registry has renamed away), the
 * exact rename-break §8 exists to kill. An enforcer with no negative test is a
 * false-green waiting to happen.
 *
 *   node scripts/skills/test-skill-hook-points.js
 */

const assert = require("assert");
const SHP = require("./skill-hook-points");

let passed = 0;
const failures = [];
function test(name, fn) {
  try { fn(); passed++; } catch (e) { failures.push(`${name}: ${e.message}`); }
}
const clone = (o) => JSON.parse(JSON.stringify(o));

// A minimal coherent registry + role roster.
const ROLE_IDS = ["director-of-product", "product-lead", "director-of-growth", "copy-lead", "conversion-lead", "marketing-lead"];
const coherent = {
  skills: {
    "roadmap:next": {
      domain: "product",
      hooks: [
        { hook_point: "pick", role: "product-lead", condition: "single-product" },
        { hook_point: "pick", role: "director-of-product", condition: "strategic", default: true },
      ],
    },
    "growth:message-brief": {
      domain: "growth",
      hooks: [
        { hook_point: "distill-message", role: "director-of-growth" },
        { hook_point: "shape-copy", role: "copy-lead" },
      ],
    },
  },
};

// 0. POSITIVE — coherent registry validates
test("coherent registry → 0 errors", () => {
  const r = SHP.validate(clone(coherent), ROLE_IDS);
  assert.ok(r.ok, `expected clean, got: ${r.errors.join("; ")}`);
});

// 1. BITE (the rename-break class) — a role not in the role-registry → rejected
test("stale/renamed role not in registry → rejected", () => {
  const reg = clone(coherent);
  reg.skills["growth:message-brief"].hooks[0].role = "director-of-marketing"; // the pre-ADR-0007 name
  const r = SHP.validate(reg, ROLE_IDS);
  assert.ok(!r.ok && r.errors.some((e) => /director-of-marketing.*not in role-registry/.test(e)),
    `expected stale-role error, got: ${r.errors.join("; ")}`);
});

// 2. BITE — a conditional hook_point with no default → rejected
test("conditional hook with 0 defaults → rejected", () => {
  const reg = clone(coherent);
  reg.skills["roadmap:next"].hooks[1].default = false; // now 2 rows, 0 defaults
  const r = SHP.validate(reg, ROLE_IDS);
  assert.ok(!r.ok && r.errors.some((e) => /hook_point 'pick'.*0 default/.test(e)),
    `expected no-default error, got: ${r.errors.join("; ")}`);
});

// 3. BITE — a conditional hook_point with two defaults → rejected
test("conditional hook with 2 defaults → rejected", () => {
  const reg = clone(coherent);
  reg.skills["roadmap:next"].hooks[0].default = true; // now both default:true
  const r = SHP.validate(reg, ROLE_IDS);
  assert.ok(!r.ok && r.errors.some((e) => /2 default/.test(e)),
    `expected 2-default error, got: ${r.errors.join("; ")}`);
});

// 4. BITE — empty hooks → rejected
test("skill with empty hooks → rejected", () => {
  const reg = clone(coherent);
  reg.skills["roadmap:next"].hooks = [];
  const r = SHP.validate(reg, ROLE_IDS);
  assert.ok(!r.ok && r.errors.some((e) => /hooks missing or empty/.test(e)),
    `expected empty-hooks error, got: ${r.errors.join("; ")}`);
});

// 5. resolveAgent returns the rows for a skill+hook
test("resolveAgent filters by skill + hook_point", () => {
  const rows = SHP.resolveAgent("growth:message-brief", "shape-copy", clone(coherent));
  assert.strictEqual(rows.length, 1);
  assert.strictEqual(rows[0].role, "copy-lead");
});

// 6. defaultRoleFor returns the default for a conditional hook, the sole role otherwise
test("defaultRoleFor: conditional → default row; single → sole role", () => {
  assert.strictEqual(SHP.defaultRoleFor("roadmap:next", "pick", clone(coherent)), "director-of-product");
  assert.strictEqual(SHP.defaultRoleFor("growth:message-brief", "distill-message", clone(coherent)), "director-of-growth");
});

// 7. INTEGRATION — the REAL registry validates against the REAL role roster.
//    This is the live guarantee that no shipped skill row names a renamed role.
test("real skill-hook-points.json validates vs real role-registry", () => {
  const reg = SHP.load();
  const ids = SHP.loadRoleIds();
  const r = SHP.validate(reg, ids);
  assert.ok(r.ok, `real registry has errors: ${r.errors.join("; ")}`);
});

if (failures.length) {
  process.stderr.write(`skill-hook-points bite-test: ${passed} passed, ${failures.length} FAILED\n`);
  for (const f of failures) process.stderr.write(`  - ${f}\n`);
  process.exit(1);
}
process.stdout.write(`skill-hook-points bite-test: ${passed}/${passed} passed (positive + 4 bite + 3 resolver/integration)\n`);
process.exit(0);
