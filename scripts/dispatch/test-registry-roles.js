#!/usr/bin/env node
"use strict";

/**
 * test-registry-roles.js — bite-test for the dispatch-side role-registry reader
 * (scripts/dispatch/registry-roles.js, v0.2 foundation). Two layers:
 *   (1) targeted assertions that the derived maps/sets match KNOWN-GOOD registry values;
 *   (2) a best-effort PARITY cross-check that the derived sets deep-equal the literal
 *       tables they will replace (only for consumers that export their literal) — the
 *       proof the derivation is faithful before any literal is cut. Anything not yet
 *       exported is reported as "verify-at-rewire", not a failure.
 *
 *   node scripts/dispatch/test-registry-roles.js
 */

const R = require("./registry-roles");

let passes = 0, failures = 0;
function ok(name, cond, detail) {
  if (cond) { passes++; console.log(`  ok  ${name}`); }
  else { failures++; console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ""}`); }
}
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const sorted = (a) => [...a].sort();

// ── (1) targeted assertions vs known-good registry values ─────────────────────

console.log("derived maps/sets (vs known-good):");
{
  const ids = R.roleIds();
  ok("roleIds returns the roster (>=24, incl quality-lead)", ids.length >= 24 && ids.includes("quality-lead"), `n=${ids.length}`);
  ok("providerOf alpha = claude", R.providerOf("alpha") === "claude");
  ok("providerOf design-lead = openai", R.providerOf("design-lead") === "openai");
  ok("effortOf alpha = max", R.effortOf("alpha") === "max");
  ok("modelOf design-lead = gpt-5.5", R.modelOf("design-lead") === "gpt-5.5");
  ok("buildChainRoles includes FE/BE/security builders", ["frontend-builder", "backend-builder", "security-builder"].every((r) => R.buildChainRoles().includes(r)), R.buildChainRoles().join(","));
  ok("flagshipOpenaiRoles includes design-lead", R.flagshipOpenaiRoles().includes("design-lead"), R.flagshipOpenaiRoles().join(","));
  ok("geminiRoles includes security-reviewer", R.geminiRoles().includes("security-reviewer"), R.geminiRoles().join(","));
  ok("fixerRoles are the 3 pod fixers", eq(sorted(R.fixerRoles()), ["backend-fixer", "frontend-fixer", "security-fixer"]), R.fixerRoles().join(","));
  ok("reviewerGateKeys = the 4 binding pod reviewers (snake)", eq(R.reviewerGateKeys(), ["backend_reviewer", "frontend_reviewer", "qa_reviewer", "security_reviewer"]), R.reviewerGateKeys().join(","));
}

// ── (2) best-effort parity vs the literal tables (the cut-safety proof) ───────

console.log("\nparity vs literals (verify-at-rewire where not exported):");
function tryRequire(p) { try { return require(p); } catch { return null; } }

{
  // adhoc-fail-override.REVIEWER_KEYS IS exported → real cross-check.
  const afo = tryRequire("../checks/adhoc-fail-override");
  if (afo && afo.REVIEWER_KEYS) {
    ok("reviewerGateKeys deep-equals adhoc-fail-override.REVIEWER_KEYS (ED-023)", eq(sorted(afo.REVIEWER_KEYS), R.reviewerGateKeys()), `lit=${[...afo.REVIEWER_KEYS]} der=${R.reviewerGateKeys()}`);
  } else {
    console.log("  ..  adhoc-fail-override.REVIEWER_KEYS not importable — verify at rewire");
  }
}
{
  const catalog = tryRequire("./catalog");
  if (catalog && catalog.DEFAULT_PROVIDER_PER_ROLE) {
    const lit = catalog.DEFAULT_PROVIDER_PER_ROLE, der = R.providerMap();
    const mism = R.roleIds().filter((r) => lit[r] && der[r] && lit[r] !== der[r]);
    ok("providerMap agrees with catalog.DEFAULT_PROVIDER_PER_ROLE (shared roles)", mism.length === 0, "mismatch: " + mism.map((r) => `${r}:reg=${der[r]}/lit=${lit[r]}`).join(", "));
  } else {
    console.log("  ..  catalog.DEFAULT_PROVIDER_PER_ROLE not exported — verify at rewire");
  }
  if (catalog && catalog.DEFAULT_EFFORT_PER_ROLE) {
    const lit = catalog.DEFAULT_EFFORT_PER_ROLE, der = R.effortMap();
    const mism = R.roleIds().filter((r) => lit[r] && der[r] && lit[r] !== der[r]);
    ok("effortMap agrees with catalog.DEFAULT_EFFORT_PER_ROLE (shared roles)", mism.length === 0, "mismatch: " + mism.map((r) => `${r}:reg=${der[r]}/lit=${lit[r]}`).join(", "));
  }
}
{
  const state = tryRequire("./state");
  if (state && Array.isArray(state.GEMINI_ROLES)) {
    // the literal carries scrapped 'redteam'; the derived carries only active gemini roles.
    const activeLit = state.GEMINI_ROLES.filter((r) => R.roleIds().includes(r));
    ok("geminiRoles deep-equals state.GEMINI_ROLES (active roles only)", eq(sorted(activeLit), sorted(R.geminiRoles())), `lit(active)=${activeLit} der=${R.geminiRoles()}`);
  } else {
    console.log("  ..  state.GEMINI_ROLES not exported — verify at rewire");
  }
}

// ── (3) deriveOrFallback — the loud-fallback contract (β requirement) ─────────

console.log("\nderiveOrFallback (loud fallback):");
{
  ok("returns the derived value when non-empty", eq(R.deriveOrFallback(() => ["a", "b"], ["x"], "t"), ["a", "b"]));

  const orig = process.stderr.write.bind(process.stderr);
  let warned = "";
  process.stderr.write = (s) => { warned += s; return true; };
  const fb = R.deriveOrFallback(() => { throw new Error("boom"); }, ["lit"], "T-LABEL");
  process.stderr.write = orig;
  ok("falls back to the literal on throw", eq(fb, ["lit"]));
  ok("the fallback is LOUD (warns to stderr, names the label)", /WARN[\s\S]*T-LABEL/.test(warned), JSON.stringify(warned));

  let warned2 = "";
  process.stderr.write = (s) => { warned2 += s; return true; };
  const fb2 = R.deriveOrFallback(() => [], ["lit2"], "EMPTY-LABEL");
  process.stderr.write = orig;
  ok("empty derive → loud fallback too", eq(fb2, ["lit2"]) && /EMPTY-LABEL/.test(warned2));
}

console.log(`\nResults: ${passes} passed, ${failures} failed.`);
process.exit(failures === 0 ? 0 : 1);
