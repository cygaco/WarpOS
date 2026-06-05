#!/usr/bin/env node
"use strict";

/**
 * Bite-test for dispatch-routing-parity.js#compareRouting — proves the gate's
 * registry ANCHOR is non-vacuous (the Trap-A property): a consumer map that drifts
 * from the canonical registry IS caught, while the registry's claude-default
 * superset and the consumers' scrapped back-compat aliases are NOT false-flagged.
 *
 * WHY THIS TEST EXISTS (DUMP 2026-06-05, Trap-A): once providers.js + catalog.js
 * both DERIVE from the registry, a providers-vs-catalog cross-check is tautological
 * — a vacuous green. The gate was repointed to anchor on the registry so it stays
 * meaningful (it still catches a consumer whose loud-fallback returned a STALE
 * literal, a missed rewire, or doc drift). An enforcer with no negative test is
 * itself a false-green, so we prove the bite here.
 *
 *   node scripts/checks/dispatch-routing-parity.test.js
 */

const assert = require("assert");
const { execFileSync } = require("child_process");
const path = require("path");
const { compareRouting } = require("./dispatch-routing-parity");

let passed = 0;
const failures = [];
function test(name, fn) {
  try {
    fn();
    passed++;
  } catch (e) {
    failures.push(`${name}: ${e.message}`);
  }
}

// 0. POSITIVE — registry == providers == catalog, doc covers the non-claude roles → clean.
test("coherent: registry==consumers, doc covers non-claude → 0 findings", () => {
  const reg = { alpha: "claude", rev: "openai", sec: "gemini" };
  const r = compareRouting({
    registryMap: reg,
    providersMap: { ...reg },
    catalogMap: { ...reg },
    docTable: { rev: "openai", sec: "gemini" },
  });
  assert.deepStrictEqual(r.disagreements, [], `unexpected disagreements: ${JSON.stringify(r.disagreements)}`);
  assert.deepStrictEqual(r.undocumented, [], `unexpected undocumented: ${JSON.stringify(r.undocumented)}`);
});

// 1. BITE (non-vacuousness) — a CONSUMER that drifts from the registry IS caught.
//    This is exactly the stale-loud-fallback / missed-rewire failure mode. A
//    derived-vs-derived gate would MISS it; the registry anchor catches it.
test("providers.js disagrees with registry → disagreement flagged", () => {
  const r = compareRouting({
    registryMap: { rev: "openai" },
    providersMap: { rev: "gemini" }, // drifted (e.g. fell back to a stale literal)
    catalogMap: { rev: "openai" },
    docTable: { rev: "openai" },
  });
  const d = r.disagreements.find((x) => x.role === "rev");
  assert.ok(d, `expected 'rev' disagreement, got: ${JSON.stringify(r.disagreements)}`);
  assert.strictEqual(d.providers.registry, "openai");
  assert.strictEqual(d.providers.providersJs, "gemini");
});

// 2. BITE — catalog drift from the registry is caught too.
test("catalog.js disagrees with registry → disagreement flagged", () => {
  const r = compareRouting({
    registryMap: { rev: "openai" },
    providersMap: { rev: "openai" },
    catalogMap: { rev: "claude" },
    docTable: { rev: "openai" },
  });
  assert.ok(r.disagreements.some((d) => d.role === "rev"), `expected 'rev' disagreement, got: ${JSON.stringify(r.disagreements)}`);
});

// 3. BITE — the human doc drifting from the registry is caught (independent witness).
test("doc disagrees with registry → disagreement flagged", () => {
  const r = compareRouting({
    registryMap: { rev: "openai" },
    providersMap: { rev: "openai" },
    catalogMap: { rev: "openai" },
    docTable: { rev: "gemini" },
  });
  assert.ok(r.disagreements.some((d) => d.role === "rev"), `expected doc-drift disagreement, got: ${JSON.stringify(r.disagreements)}`);
});

// 4. NO FALSE POSITIVE — a role only the registry names (the claude-default manager
//    superset) is NOT a disagreement. Consumers omit it because claude is the default.
test("registry-only claude default (manager) → not flagged", () => {
  const r = compareRouting({
    registryMap: { "director-of-product": "claude", rev: "openai" },
    providersMap: { rev: "openai" },
    catalogMap: { rev: "openai" },
    docTable: { rev: "openai" },
  });
  assert.ok(!r.disagreements.some((d) => d.role === "director-of-product"), "registry-only claude default must not be a disagreement");
  assert.ok(!r.undocumented.some((u) => u.role === "director-of-product"), "claude default must not be undocumented");
});

// 5. NO FALSE POSITIVE — a scrapped back-compat alias only the consumers name
//    (absent from the registry) is NOT a disagreement (TRAP-B coexistence).
test("consumer-only scrapped alias (not in registry) → not flagged", () => {
  const r = compareRouting({
    registryMap: { rev: "openai" },
    providersMap: { reviewer: "openai", rev: "openai" }, // 'reviewer' = scrapped alias
    catalogMap: { reviewer: "openai", rev: "openai" },
    docTable: { rev: "openai", reviewer: "openai" },
  });
  assert.ok(!r.disagreements.some((d) => d.role === "reviewer"), "scrapped alias agreed across consumers must not be a disagreement");
});

// 6. BITE — a non-claude role routed by the registry but ABSENT from the doc → undocumented.
test("non-claude registry role missing from doc → undocumented", () => {
  const r = compareRouting({
    registryMap: { rev: "openai" },
    providersMap: { rev: "openai" },
    catalogMap: { rev: "openai" },
    docTable: {}, // doc omits it
  });
  assert.ok(r.undocumented.some((u) => u.role === "rev" && u.codeProvider === "openai"), `expected 'rev' undocumented, got: ${JSON.stringify(r.undocumented)}`);
});

// 7. NO FALSE POSITIVE — a claude-by-definition role absent from doc → not undocumented.
test("claude-by-definition role absent from doc → not undocumented", () => {
  const r = compareRouting({
    registryMap: { alpha: "claude" },
    providersMap: { alpha: "claude" },
    catalogMap: { alpha: "claude" },
    docTable: {},
  });
  assert.deepStrictEqual(r.undocumented, [], `claude role must never be undocumented, got: ${JSON.stringify(r.undocumented)}`);
});

// 8. INTEGRATION — the real gate passes on the real repo (end-to-end, real files).
test("real repo: dispatch-routing-parity exits 0", () => {
  const script = path.join(__dirname, "dispatch-routing-parity.js");
  const repoRoot = path.join(__dirname, "..", "..");
  execFileSync(process.execPath, [script], { stdio: "pipe", cwd: repoRoot }); // throws on non-zero exit
});

if (failures.length) {
  process.stderr.write(`dispatch-routing-parity bite-test: ${passed} passed, ${failures.length} FAILED\n`);
  for (const f of failures) process.stderr.write(`  - ${f}\n`);
  process.exit(1);
}
process.stdout.write(`dispatch-routing-parity bite-test: ${passed}/${passed} passed (positive + 4 bite + 3 no-false-positive + integration)\n`);
process.exit(0);
