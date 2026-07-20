#!/usr/bin/env node
"use strict";
/**
 * meta-lockstep (SP-20260720-003 D1) — the change-time coupling enforcer between a scan's
 * cross-provider SCOPE FILTER and the class_derivation rule-table.
 *
 * THE GAP IT CLOSES (9db78fa3): the gemini deep-clean broadened role-parity-scan's shape-route scope
 * filter to include "antigravity" (now the shared CROSS_PROVIDER_SCOPE export) WITHOUT adding the paired
 * {tier:lead, provider:antigravity} class_derivation rule — so research-lead (the sole live antigravity
 * lead) fell to the Claude catch-all and tripped a role-parity RED. Only an independent GPT cross-check
 * caught it. Nothing STRUCTURALLY coupled the scope filter to the rule table.
 *
 * THE INVARIANT (DoE-validated): symmetry of CROSS-PROVIDER-ROUTING rules across the in-scope providers.
 * For each (dimension=value) key that ANY in-scope provider routes cross-provider via a provider-pinned
 * rule, EVERY in-scope provider must also route that key to a subprocess-cross-provider class — UNLESS
 *   (excused) no LIVE registry role of that (dimension=value, provider) exists, OR
 *   (waived)   the (dimension, value, provider) triple is on the frozen narrowest waiver baseline.
 * The check REUSES role-parity-scan's own deriveClass + the shared CROSS_PROVIDER_SCOPE (one source,
 * two consumers) so it can never reimplement or drift from the derivation it polices.
 *
 * Independent teeth vs role-parity: role-parity checks a LIVE role's actual derived class; meta-lockstep
 * checks the GENERIC {dimension:value, provider} synthetic derivation — so it flags a rule-table
 * asymmetry that a live role currently dodges via an extra attribute (a latent fall-through a future
 * generic role would hit), which role-parity is structurally green over.
 *
 * REPORT-ONLY in scan:full initially (DoE: the symmetry algorithm can over-fire; flips to blocking after
 * one clean cycle — tracked as an enforcement-debt entry, AC-17). Exit: 0 clean · 1 findings · 2
 * fail-closed (unreadable/unparseable registry or contract).
 */

const fs = require("fs");
const path = require("path");
const { deriveClass, CROSS_PROVIDER_SCOPE } = require("./role-parity-scan");

const NAME = "meta-lockstep";
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..");
const CONTRACT_PATH = path.join(ROOT, ".claude", "agents", "_org", "dispatch-contract.json");
const REGISTRY_PATH = path.join(ROOT, ".claude", "agents", "_org", "role-registry.json");
const ROLE_PARITY_SRC = path.join(__dirname, "role-parity-scan.js");

// The frozen NARROWEST waiver baseline (β riders AC-15). One triple per deliberate deferral, each with a
// WHY. The live waiver must EQUAL this baseline — a widened waiver (an entry not here) is flagged as a
// bypass, because a waiver that grows unobserved re-introduces the silent-absence it was built to cure.
const BASELINE_WAIVER = Object.freeze([
  Object.freeze({
    dimension: "tier",
    value: "director",
    provider: "antigravity",
    why: "ADR-0031 β-deferral (2026-07-20 DECIDE): no live antigravity director exists; role-parity self-detects the gap when one is introduced. Do NOT re-add the {tier:director,provider:antigravity} rule.",
  }),
]);

// ── pure helpers (injectable seams → bite-testable) ──────────────────────────────

function classRoutesCrossProvider(derivedClass, roleClasses) {
  const entry = roleClasses && roleClasses[derivedClass];
  const shapes = (entry && entry.allowed_shapes) || [];
  return shapes.includes("subprocess-cross-provider");
}

/** Does provider P route (dimension=value) to a subprocess-cross-provider class, per the rule table? */
function routesCrossProvider(dimension, value, provider, rules, fallbackClass, roleClasses) {
  const attrs = { [dimension]: value, provider };
  const cls = deriveClass(attrs, rules, fallbackClass);
  return classRoutesCrossProvider(cls, roleClasses);
}

/** Is there a LIVE registry role with this (dimension=value, provider)? */
function hasLiveRole(reg, dimension, value, provider) {
  const roles = (reg && reg.roles) || {};
  return Object.values(roles).some(
    (r) => r && typeof r === "object" && r[dimension] === value && (r.provider || "claude") === provider,
  );
}

const waiverKey = (w) => `${w.dimension}:${w.value}:${w.provider}`;

function isWaived(waiver, dimension, value, provider) {
  return (waiver || []).some(
    (w) => w && w.dimension === dimension && w.value === value && w.provider === provider,
  );
}

/**
 * The reference cross-provider (dimension,value) keys: those an IN-SCOPE provider routes cross-provider
 * via a PROVIDER-PINNED rule. These are the keys symmetry is expected to hold for.
 */
function crossProviderKeys(rules, roleClasses, scope) {
  const keys = new Map();
  for (const rule of rules || []) {
    const when = (rule && rule.when) || {};
    if (!when.provider || !scope.includes(when.provider)) continue; // only provider-pinned in-scope rules
    if (!classRoutesCrossProvider(rule.class, roleClasses)) continue; // only cross-provider-routing rules
    for (const dim of ["tier", "kind"]) {
      if (when[dim] == null) continue;
      keys.set(`${dim}:${when[dim]}`, { dimension: dim, value: when[dim] });
    }
  }
  return [...keys.values()];
}

/** AC-15 waiver integrity: narrowest-form + WHY-required + widen-detect vs the frozen baseline. */
function checkWaiverIntegrity(waiver, baseline = BASELINE_WAIVER) {
  const errors = [];
  const baseKeys = new Set(baseline.map(waiverKey));
  for (const w of waiver || []) {
    if (!w || typeof w !== "object") {
      errors.push(`${NAME}: waiver integrity — a waiver entry is not an object (${JSON.stringify(w)}). FIX: each waiver is a {dimension,value,provider,why} triple.`);
      continue;
    }
    // (a) narrowest form: must pin exactly dimension + value + provider (a single triple)
    if (!w.dimension || !w.value || !w.provider) {
      errors.push(`${NAME}: waiver integrity — entry ${JSON.stringify(w)} is NOT narrowest-form (a director-wide or provider-wide skip is forbidden). FIX: pin a single {dimension,value,provider} triple (e.g. {tier:"director",provider:"antigravity"}).`);
    }
    // (b) WHY required
    if (!w.why || String(w.why).trim() === "") {
      errors.push(`${NAME}: waiver integrity — entry {${w.dimension}:${w.value}, provider:${w.provider}} has NO 'why'. FIX: every waiver must document its rationale (point to ADR-0031 + the nonexistent-consumer reason).`);
    }
    // (c) widen-detect: not in the frozen baseline = an unobserved widening (a bypass)
    if (!baseKeys.has(waiverKey(w))) {
      errors.push(`${NAME}: waiver WIDENED beyond the frozen baseline — {${w.dimension}:${w.value}, provider:${w.provider}} is not in BASELINE_WAIVER. A waiver that grows unobserved re-introduces the silent-absence it cures (a bypass). FIX: remove it, or extend the baseline through waiver-review (ADR-0031).`);
    }
  }
  return errors;
}

/**
 * The registry-driven core. PURE given its seams { reg, contract, scope, waiver }.
 * @returns {{ errors: string[] }}
 */
function evaluateMetaLockstep({ reg, contract, scope = CROSS_PROVIDER_SCOPE, waiver = BASELINE_WAIVER } = {}) {
  const errors = [];
  const rules = (contract && contract.class_derivation && contract.class_derivation.rules) || [];
  const fallbackClass =
    (contract && contract.class_derivation && contract.class_derivation.fallback_class) || "manager";
  const roleClasses = (contract && contract.role_classes) || {};

  // AC-15: waiver integrity first (a malformed/widened waiver is itself a finding).
  errors.push(...checkWaiverIntegrity(waiver));

  const refKeys = crossProviderKeys(rules, roleClasses, scope);
  for (const { dimension, value } of refKeys) {
    for (const provider of scope) {
      if (routesCrossProvider(dimension, value, provider, rules, fallbackClass, roleClasses)) continue; // symmetric
      if (isWaived(waiver, dimension, value, provider)) continue; // deliberate deferral
      if (!hasLiveRole(reg, dimension, value, provider)) continue; // excused: no live role of that (dim,provider)
      // asymmetric ∧ not-waived ∧ a live role exists → RED. AC-16: name invariant + offending key + remediation.
      errors.push(
        `${NAME}: cross-provider routing ASYMMETRY — a LIVE ${dimension}="${value}" role exists for ` +
          `provider "${provider}", but no class_derivation rule routes {${dimension}:"${value}", provider:` +
          `"${provider}"} to a subprocess-cross-provider class (another in-scope provider in ` +
          `[${scope.join(", ")}] does). The scope filter includes "${provider}" without its paired rule. ` +
          `FIX: add the paired cross-provider class_derivation rule (mirror the other provider's ` +
          `{${dimension}:"${value}"} rule), OR add a narrowest-form documented waiver ` +
          `{dimension:"${dimension}",value:"${value}",provider:"${provider}",why:...} (ADR-0031 / waiver-review).`,
      );
    }
  }
  return { errors };
}

/** AC-4 source-coupling proof: role-parity-scan's shape-route filter must READ CROSS_PROVIDER_SCOPE (not a
 *  re-inlined provider literal). A re-hardcoded `provider !== "openai"` at that site fails this. */
function shapeFilterReadsScopeConstant(src) {
  if (typeof src !== "string") return false;
  const fnStart = src.indexOf("function evaluateShapeRouteConflicts");
  if (fnStart === -1) return false;
  const fnBody = src.slice(fnStart, fnStart + 2000);
  return /CROSS_PROVIDER_SCOPE\.includes\(\s*provider\s*\)/.test(fnBody);
}

// ── CLI ──────────────────────────────────────────────────────────────────────────

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function main(argv) {
  const json = argv.includes("--json");
  let reg, contract, roleParitySrc;
  try {
    reg = readJson(REGISTRY_PATH);
    contract = readJson(CONTRACT_PATH);
    roleParitySrc = fs.readFileSync(ROLE_PARITY_SRC, "utf8");
  } catch (e) {
    // fail-closed: a coverage/coupling check that cannot read its inputs must NOT report clean.
    process.stderr.write(`${NAME}: FAIL-CLOSED — could not read inputs: ${e.message}\n`);
    return 2;
  }

  const { errors } = evaluateMetaLockstep({ reg, contract });
  // AC-4: prove role-parity's filter still reads the shared constant (source-coupling teeth).
  if (!shapeFilterReadsScopeConstant(roleParitySrc)) {
    errors.push(
      `${NAME}: SCOPE-DRIFT — role-parity-scan.js#evaluateShapeRouteConflicts no longer reads the shared ` +
        `CROSS_PROVIDER_SCOPE export (a re-inlined provider literal at the filter). The scope filter and this ` +
        `enforcer must share ONE source. FIX: restore \`if (!CROSS_PROVIDER_SCOPE.includes(provider)) continue;\`.`,
    );
  }

  if (json) {
    process.stdout.write(JSON.stringify({ name: NAME, ok: errors.length === 0, errors }, null, 2) + "\n");
  } else if (errors.length === 0) {
    process.stdout.write(`${NAME}: OK — scope filter [${CROSS_PROVIDER_SCOPE.join(", ")}] is in lockstep with the class_derivation rule-table.\n`);
  } else {
    process.stdout.write(`${NAME}: ${errors.length} finding(s):\n${errors.map((e) => "  - " + e).join("\n")}\n`);
  }
  return errors.length === 0 ? 0 : 1;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = {
  NAME,
  BASELINE_WAIVER,
  classRoutesCrossProvider,
  routesCrossProvider,
  hasLiveRole,
  isWaived,
  crossProviderKeys,
  checkWaiverIntegrity,
  evaluateMetaLockstep,
  shapeFilterReadsScopeConstant,
};
