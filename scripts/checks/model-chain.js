#!/usr/bin/env node
"use strict";
// model-chain (ED-058) — the named enforcer for the role-registry model/effort CHAIN.
//
// Operator policy (2026-06-16, memory feedback_model_opus48max_not_fable): Claude Opus 4.8 is the
// shipped TOP model; `max` effort is alpha-ONLY; `fable`/`claude-fable-5` is explicitly NOT the top
// default (rejected); every role carries a model + an effort scaled to its job; and the live
// dispatch consumers (catalog.js / providers.js) must RESOLVE to the same provider+effort the
// registry declares — a silent registry↔consumer drift would run a role on the wrong model.
//
// This is the model-chain HOME. It is intentionally NOT a duplicate of scan:role-parity, which
// owns registry-INTERNAL consistency (model-in-catalog, dispatch-graph, reporting-line, spec model-
// pin). model-chain adds what role-parity does NOT cover: the no-fable rule, the alpha POSITIVE pin
// (=opus-4.8/max, not merely "max only on alpha"), model+effort completeness, and the live
// registry↔catalog↔providers parity (the drift detector). Report-only in /scan:full.
//
// Exit: 0 clean · 1 findings · 2 fail-closed (unreadable/unparseable registry or internal error).
const fs = require("fs");
const path = require("path");

const NAME = "model-chain";
const ROOT = path.resolve(__dirname, "..", "..");
const REGISTRY = ".claude/agents/_org/role-registry.json";

const TOP_MODEL = "claude-opus-4-8";
const FABLE_RE = /fable/i;
const VALID_EFFORTS = new Set(["low", "medium", "high", "xhigh", "max", null]);
// effort:null is legitimate ONLY here (documented): skeleton-builder (matches the live catalog
// DEFAULT_EFFORT_PER_ROLE default for that role) and any gemini-provider role (gemini has no
// effort flag — thinking is always-on for the pro-preview tier).
const NULL_EFFORT_ALLOW = new Set(["skeleton-builder"]);

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

// Gather only the MODEL-bearing fields (never prose/_doc/_note) so the no-fable scan cannot
// false-positive on a policy note that *mentions* fable to reject it.
function collectModelRefs(reg) {
  const refs = [];
  const roles = (reg && reg.roles) || {};
  for (const [name, r] of Object.entries(roles)) {
    if (r.model != null) refs.push({ where: `roles.${name}.model`, model: r.model });
    if (r.second_pass && r.second_pass.model != null)
      refs.push({ where: `roles.${name}.second_pass.model`, model: r.second_pass.model });
  }
  const policy = (reg && reg.model_policy) || {};
  for (const k of ["doers", "review_flagship", "security_2nd_pass"]) {
    if (policy[k] && policy[k].model != null)
      refs.push({ where: `model_policy.${k}.model`, model: policy[k].model });
  }
  return refs;
}

// Pure, injectable core. `consumers` is the resolved-map snapshot (or null when a consumer could
// not be loaded — the caller surfaces that as a separate finding). Returns a flat error list.
function evaluateModelChain({ reg, consumers }) {
  const errors = [];
  const roles = (reg && reg.roles) || {};
  const policy = (reg && reg.model_policy) || {};

  // ── A. No `fable` in any MODEL field (operator 2026-06-16 — fable is NOT the top default) ──
  for (const ref of collectModelRefs(reg)) {
    if (FABLE_RE.test(String(ref.model)))
      errors.push(
        `[CRITICAL] ${ref.where}="${ref.model}" references a fable model — fable is explicitly NOT the top default (operator 2026-06-16); use ${TOP_MODEL}`,
      );
  }

  // ── B. Alpha POSITIVE pin: the top face must BE opus-4.8 at max (role-parity only checks the
  //       negative "max only on alpha"; a downgraded alpha would otherwise pass silently) ──
  const alpha = roles.alpha;
  if (!alpha) {
    errors.push(`[CRITICAL] no "alpha" role — the top face must exist, pinned to ${TOP_MODEL}/max`);
  } else {
    if (alpha.model !== TOP_MODEL)
      errors.push(
        `[CRITICAL] alpha.model="${alpha.model}" — alpha MUST be the shipped top model ${TOP_MODEL} (operator 2026-06-16)`,
      );
    if (alpha.effort !== "max")
      errors.push(
        `[CRITICAL] alpha.effort="${alpha.effort}" — alpha is the SOLE role that runs at max effort (operator 2026-06-16)`,
      );
  }

  // ── C. Top-model policy: the doer model must be the shipped top ──
  if (policy.doers && policy.doers.model && policy.doers.model !== TOP_MODEL)
    errors.push(
      `model_policy.doers.model="${policy.doers.model}" — the doer model must be the shipped top ${TOP_MODEL}`,
    );

  // ── D/E. Completeness + effort validity for every role ──
  for (const [name, r] of Object.entries(roles)) {
    if (!r.model || typeof r.model !== "string")
      errors.push(
        `role "${name}" has no model — every role must carry an explicit model (no inherit/blank; ADR-0008 routing SoT)`,
      );
    if (!("effort" in r)) {
      errors.push(
        `role "${name}" has no effort key — every role must declare effort (null only for skeleton-builder / gemini)`,
      );
    } else if (!VALID_EFFORTS.has(r.effort)) {
      errors.push(`role "${name}" effort="${r.effort}" is not a valid level (low|medium|high|xhigh|max|null)`);
    } else if (r.effort === null && !NULL_EFFORT_ALLOW.has(name) && r.provider !== "gemini") {
      errors.push(
        `role "${name}" effort=null but is not skeleton-builder or a gemini role — null effort needs documented justification`,
      );
    }
  }

  // ── F. max is alpha-only (the positive policy home; deliberately mirrors role-parity for a
  //       CRITICAL invariant — belt + suspenders) ──
  for (const [name, r] of Object.entries(roles)) {
    if (r.effort === "max" && name !== "alpha")
      errors.push(`role "${name}" effort=max — max is alpha-only (operator 2026-06-16; ${name} caps at xhigh)`);
  }

  // ── G. Live consumer parity — the drift detector. The registry is the SoT; if catalog.js or
  //       providers.js resolves a role to a DIFFERENT provider/effort, a real dispatch silently
  //       runs that role on the wrong model. Flag active contradictions only (absence ≠ drift). ──
  if (consumers) {
    for (const [name, r] of Object.entries(roles)) {
      const cp = consumers.catalogProvider;
      const ce = consumers.catalogEffort;
      const pa = consumers.providerAgent;
      if (cp && name in cp && cp[name] !== r.provider)
        errors.push(`[DRIFT] catalog DEFAULT_PROVIDER_PER_ROLE["${name}"]="${cp[name]}" ≠ registry provider "${r.provider}"`);
      if (r.effort != null && ce && name in ce && ce[name] !== r.effort)
        errors.push(`[DRIFT] catalog DEFAULT_EFFORT_PER_ROLE["${name}"]="${ce[name]}" ≠ registry effort "${r.effort}"`);
      if (pa && name in pa && pa[name] !== r.provider)
        errors.push(`[DRIFT] providers DEFAULT_AGENT_PROVIDERS["${name}"]="${pa[name]}" ≠ registry provider "${r.provider}"`);
      if (r.effort != null && typeof consumers.providerEffortFn === "function") {
        let pe;
        try {
          pe = consumers.providerEffortFn(name);
        } catch {
          pe = undefined;
        }
        if (pe !== undefined && pe !== r.effort)
          errors.push(
            `[DRIFT] providers.getReasoningEffort("${name}")="${pe}" ≠ registry effort "${r.effort}" (stale DEFAULT_REASONING_EFFORT literal?)`,
          );
      }
    }
  }

  return errors;
}

// Load the real consumer maps via require() (uses the REAL resolution path, not regex). A consumer
// that fails to load is itself a finding (we cannot verify parity) — surfaced by main, not here.
function loadConsumers(root) {
  const out = { catalogProvider: null, catalogEffort: null, providerAgent: null, providerEffortFn: null, loadErrors: [] };
  try {
    const catalog = require(path.join(root, "scripts/dispatch/catalog.js"));
    out.catalogProvider = catalog.DEFAULT_PROVIDER_PER_ROLE || null;
    out.catalogEffort = catalog.DEFAULT_EFFORT_PER_ROLE || null;
  } catch (e) {
    out.loadErrors.push(`catalog.js unloadable: ${e.message}`);
  }
  try {
    const providers = require(path.join(root, "scripts/hooks/lib/providers.js"));
    out.providerAgent = providers.DEFAULT_AGENT_PROVIDERS || null;
    out.providerEffortFn = typeof providers.getReasoningEffort === "function" ? providers.getReasoningEffort : null;
  } catch (e) {
    out.loadErrors.push(`providers.js unloadable: ${e.message}`);
  }
  return out;
}

function main(argv) {
  const json = (argv || []).includes("--json");
  let reg;
  try {
    reg = readJSON(path.join(ROOT, REGISTRY));
  } catch (e) {
    process.stderr.write(`${NAME}: role-registry.json unreadable/unparseable: ${e.message}\n`);
    return 2; // fail-closed
  }
  let errors = [];
  try {
    const consumers = loadConsumers(ROOT);
    for (const le of consumers.loadErrors)
      errors.push(`[DRIFT] ${le} — cannot verify registry↔consumer parity`);
    errors.push(...evaluateModelChain({ reg, consumers }));
  } catch (e) {
    process.stderr.write(`${NAME} error: ${e.message}\n`);
    return 2; // fail-closed
  }
  if (json) {
    process.stdout.write(JSON.stringify({ ok: errors.length === 0, check: NAME, errors }, null, 2) + "\n");
    return errors.length ? 1 : 0;
  }
  if (errors.length === 0) {
    process.stdout.write(
      `OK   [${NAME}] model/effort chain intentional — opus-4.8 top, alpha sole max, no fable, registry↔catalog↔providers agree\n`,
    );
    return 0;
  }
  process.stderr.write(
    `FAIL [${NAME}] model-chain drift (${errors.length}):\n${errors.map((e) => `  - ${e}`).join("\n")}\n`,
  );
  return 1;
}

if (require.main === module) process.exit(main(process.argv));
module.exports = { evaluateModelChain, collectModelRefs, loadConsumers, main, NAME, TOP_MODEL, VALID_EFFORTS };
