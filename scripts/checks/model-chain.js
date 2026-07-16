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
// (=opus-4.8/max, not merely "max only on alpha"), model+effort completeness, the live
// registry↔catalog↔providers parity (the drift detector), the spec-frontmatter EFFORT parity
// (ED-058 blind-spot — the registry↔spec effort drift that role-parity's model-pin check does NOT
// cover, the exact gap that let beta/gamma/delta drift), and scrapped-role detection (ADR-0007).
// Report-only in /scan:full.
//
// Exit: 0 clean · 1 findings · 2 fail-closed (unreadable/unparseable registry or internal error).
const fs = require("fs");
const path = require("path");

const NAME = "model-chain";
const ROOT = path.resolve(__dirname, "..", "..");
const REGISTRY = ".claude/agents/_org/role-registry.json";

// ── SUPERSET policy (Bucket A WIDEN — DISPATCH.md 2026-07-12 supersedes the 2026-06-16 directive) ──
// TWO-STAGE (β-ruled): Bucket A widens to the old∪new SUPERSET so the CURRENT opus roster AND a
// future fable-top roster BOTH pass; Bucket D NARROWS to the new positive-pins ATOMIC with the
// provider-by-department flip (behind β-gate + gauntlet GREEN + kill-switch). This is
// migrate-first(widen)/remove-last(narrow) applied to the enforcer itself. Every non-superseded
// tooth is KEPT (drift-detector G, scrapped-role I, completeness D/E, spec-effort H, fail-closed);
// the superset boundary is proven by NEGATIVE fixtures per refused class in model-chain.test.js.
// The supersession + its reversal of the emphatic 2026-06-16 directive is recorded in the sprint ADR.
const TOP_MODEL = "claude-opus-4-8"; // THE fallback target; retained for block C + back-compat export
// alpha (President): NARROWED to the single new tuple (fable-5 @ high) — Bucket D, atomic with the
// provider flip (DISPATCH.md §8). The old opus-4-8@max President tuple is retired.
const ALPHA_ALLOWED = [
  { model: "claude-fable-5", effort: "high" },
];
// doer model: NARROWED to sonnet-5 [§8 — builders/fixers]. opus-4-8 retired as THE doer model.
const DOER_MODELS = new Set(["claude-sonnet-5"]);
// max effort: NARROWED to the security-hunter Claude lane [§8 — opus@max]. President dropped to
// fable@high, so max's home is the security panel; alpha may no longer carry max.
const MAX_ALLOWED_ROLES = new Set(["security-reviewer"]);
// ultra effort: only the GPT-5.6 sol/terra flagship+mid tiers (§4 — luna/claude have no ultra).
const ULTRA_MODELS = new Set(["gpt-5.6-sol", "gpt-5.6-terra"]);
const VALID_EFFORTS = new Set(["low", "medium", "high", "xhigh", "max", "ultra", null]);
// effort:null is legitimate ONLY here (documented): skeleton-builder (matches the live catalog
// DEFAULT_EFFORT_PER_ROLE default for that role) and any gemini-provider role (gemini has no
// effort flag — thinking is always-on for the pro-preview tier).
const NULL_EFFORT_ALLOW = new Set(["skeleton-builder"]);
// Roles collapsed by ADR-0007 (builder→{frontend,backend,security}-builder; reviewer→pod reviewers;
// qa→qa-reviewer; redteam→security-reviewer; fixer→pod fixers; compliance→qa-reviewer integrity scope).
// They must never reappear as a registry role or a live-consumer route key.
const SCRAPPED_ROLES = new Set(["builder", "reviewer", "compliance", "qa", "redteam", "fixer"]);
const fmtEffort = (x) => (x === null || x === undefined ? "null" : `"${x}"`);

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
    if (r.third_pass && r.third_pass.model != null)
      refs.push({ where: `roles.${name}.third_pass.model`, model: r.third_pass.model });
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
function evaluateModelChain({ reg, consumers, specs }) {
  const errors = [];
  const roles = (reg && reg.roles) || {};
  const policy = (reg && reg.model_policy) || {};

  // ── A. (RETIRED by DISPATCH.md §8 supersession) The old no-fable rejection is GONE — fable-5 is
  //       now the sanctioned top brain (President/DoE/security planner+judge). fable is a normal
  //       valid model; the positive pins below constrain WHERE the sanctioned models may sit. ──

  // ── B. Alpha POSITIVE pin (SUPERSET): the top face must BE one of the sanctioned (model,effort)
  //       tuples — (opus-4-8 @ max) [old] OR (fable-5 @ high) [new §8]. role-parity only checks the
  //       negative "max only on alpha"; a downgraded/mis-paired alpha would otherwise pass silently.
  //       Bucket D narrows this to the single new tuple (fable-5 @ high) atomic with the flip. ──
  const alpha = roles.alpha;
  if (!alpha) {
    const allowed = ALPHA_ALLOWED.map((t) => `${t.model}@${t.effort}`).join(" OR ");
    errors.push(`[CRITICAL] no "alpha" role — the top face must exist, pinned to one of: ${allowed}`);
  } else {
    const match = ALPHA_ALLOWED.some((t) => t.model === alpha.model && t.effort === alpha.effort);
    if (!match) {
      const allowed = ALPHA_ALLOWED.map((t) => `${t.model}@${t.effort}`).join(" OR ");
      errors.push(
        `[CRITICAL] alpha.model="${alpha.model}"/effort="${alpha.effort}" — the top face must be one of the sanctioned top tuples: ${allowed} (Bucket-A superset; Bucket-D narrows to claude-fable-5@high)`,
      );
    }
  }

  // ── C. Doer-model policy (SUPERSET): the doer model must be a sanctioned doer — opus-4-8 [old] OR
  //       sonnet-5 [new §8]. Bucket D narrows to sonnet-5 atomic with the builder flip. ──
  if (policy.doers && policy.doers.model && !DOER_MODELS.has(policy.doers.model))
    errors.push(
      `model_policy.doers.model="${policy.doers.model}" — the doer model must be a sanctioned doer (${[...DOER_MODELS].join(" OR ")})`,
    );

  // ── D/E. Completeness + effort validity for every role ──
  for (const [name, r] of Object.entries(roles)) {
    if (!r.model || typeof r.model !== "string")
      errors.push(
        `role "${name}" has no model — every role must carry an explicit model (no inherit/blank; ADR-0008 routing SoT)`,
      );
    if (!("effort" in r)) {
      errors.push(
        `role "${name}" has no effort key — every role must declare effort (null only for skeleton-builder / gemini / antigravity)`,
      );
    } else if (!VALID_EFFORTS.has(r.effort)) {
      errors.push(`role "${name}" effort="${r.effort}" is not a valid level (low|medium|high|xhigh|max|ultra|null)`);
    } else if (
      r.effort === null &&
      !NULL_EFFORT_ALLOW.has(name) &&
      r.provider !== "gemini" &&
      r.provider !== "antigravity"
    ) {
      // gemini AND antigravity (agy) have no effort flag — thinking is always-on for the pro-preview tier.
      errors.push(
        `role "${name}" effort=null but is not skeleton-builder or a gemini/antigravity role — null effort needs documented justification`,
      );
    }
  }

  // ── F. Effort CEILINGS (SUPERSET). max: alpha [old] OR the security-hunter Claude lane [new §8].
  //       ultra: only the GPT-5.6 sol/terra tiers (§4). Bucket D narrows max's home to the security
  //       panel once President→fable@high. Belt+suspenders with role-parity + the catalog per-model
  //       effortLevels (catalog.validateTuple). ──
  for (const [name, r] of Object.entries(roles)) {
    if (r.effort === "max" && !MAX_ALLOWED_ROLES.has(name))
      errors.push(
        `role "${name}" effort=max — max is reserved for ${[...MAX_ALLOWED_ROLES].join(" / ")} (${name} caps at xhigh)`,
      );
    if (r.effort === "ultra" && !ULTRA_MODELS.has(r.model))
      errors.push(
        `role "${name}" effort=ultra on model "${r.model}" — ultra is only valid on ${[...ULTRA_MODELS].join(" / ")} (§4; luna/claude have no ultra)`,
      );
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

  // ── H. Spec-frontmatter EFFORT parity (ED-058 blind-spot). The registry is the routing SoT; if a
  //       role's agent-spec frontmatter declares a DIFFERENT effort, an in-process Agent-tool spawn
  //       runs it at the wrong effort. Active-contradiction only — a spec that omits effort is not
  //       flagged (mirrors the consumer-drift philosophy at G). This is the gap that let beta/gamma/
  //       delta drift (model-chain validated registry↔catalog↔providers but never the spec pin). ──
  if (specs) {
    for (const [name, r] of Object.entries(roles)) {
      const s = specs[name];
      if (!s || !s.exists) continue; // missing spec = role-parity's scope
      const regEffort = r.effort === undefined ? null : r.effort;
      // A spec declares effort via `effort:` (in-process key) OR `provider_reasoning_effort:`
      // (cross-provider dispatch key). Each, WHEN PRESENT, must match the registry SoT; omission
      // is not drift (mirrors check G). Empty `effort:`/`null` IS present (value null) and is checked.
      for (const [label, has, val] of [
        ["effort", s.hasEffortKey, s.effort],
        ["provider_reasoning_effort", s.hasProviderEffortKey, s.providerEffort],
      ]) {
        if (!has) continue;
        const specEffort = val === undefined ? null : val;
        if (specEffort !== regEffort)
          errors.push(
            `[DRIFT] spec "${name}" (${s.path}) frontmatter ${label}=${fmtEffort(specEffort)} ≠ registry effort=${fmtEffort(regEffort)} — the registry is the routing SoT; the spec pin must match`,
          );
      }
    }
  }

  // ── I. Scrapped-role REINTRODUCTION guard (ADR-0007). The collapsed names (builder/reviewer/
  //       compliance/qa/redteam/fixer) must never reappear as a REAL registry role — the registry is
  //       the 34-role SoT, so a scrapped key in roles{} is genuine drift. They DO legitimately appear
  //       in the live consumer maps via the NAMED, parity-checked `registry-roles.SCRAPPED_*_ALIASES`
  //       back-compat shim (+ role-aliases.js); that shim is intentional and is NOT flagged here (the
  //       panel drops them via registry-derived rows; dispatch-routing-parity asserts its cross-consumer
  //       agreement). So this guard scans the registry roles ONLY — a zero-false-positive invariant. ──
  for (const name of Object.keys(roles))
    if (SCRAPPED_ROLES.has(name))
      errors.push(`[SCRAPPED] registry role "${name}" was collapsed by ADR-0007 — it must not be a real registry role (use the pod-specific role)`);

  return errors;
}

// Extract a frontmatter scalar by key (top-level, col-0) from the frontmatter block. Handles
// quotes, an unquoted inline `# comment`, and YAML null (`key:` empty / `null` / `~` → null).
// Returns { has } or { has:true, value } where value===null means an explicit/empty null.
function fmScalar(fmBlock, key) {
  const m = new RegExp(`^${key}:[ \\t]*(.*)$`, "m").exec(fmBlock);
  if (!m) return { has: false };
  let raw = m[1].trim();
  const q = raw[0];
  if ((q === '"' || q === "'") && raw.indexOf(q, 1) > 0) {
    return { has: true, value: raw.slice(1, raw.indexOf(q, 1)) }; // quoted — inline-# inside is literal
  }
  const hash = raw.indexOf("#"); // unquoted inline comment
  if (hash >= 0) raw = raw.slice(0, hash).trim();
  if (raw === "" || raw === "null" || raw === "~") return { has: true, value: null };
  return { has: true, value: raw };
}

// Parse BOTH effort keys a spec may carry from its YAML frontmatter (first --- … --- block):
// `effort:` (the in-process / Anthropic Agent-tool key the α-faces use) AND
// `provider_reasoning_effort:` (the CROSS-PROVIDER dispatch key the reviewer/lead/cabinet specs
// use). Either, when present, must match the registry effort SoT. (GPT-5.5 W0 review HIGH-1:
// provider_reasoning_effort was the blind spot — cross-provider specs don't carry `effort:`.)
function parseFrontmatterEffort(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(String(text || ""));
  if (!m) return { hasFrontmatter: false, hasEffortKey: false, hasProviderEffortKey: false };
  const eff = fmScalar(m[1], "effort");
  const pre = fmScalar(m[1], "provider_reasoning_effort");
  return {
    hasFrontmatter: true,
    hasEffortKey: eff.has,
    effort: eff.has ? eff.value : undefined,
    hasProviderEffortKey: pre.has,
    providerEffort: pre.has ? pre.value : undefined,
  };
}

// For every registry role with a `spec` path, read its frontmatter effort. A role whose spec is
// missing/unreadable is recorded exists:false (NOT an effort-drift finding — that is role-parity's scope).
function loadSpecEfforts(reg, root) {
  const out = {};
  const roles = (reg && reg.roles) || {};
  for (const [name, r] of Object.entries(roles)) {
    if (!r.spec) {
      out[name] = { exists: false, reason: "no spec field in registry" };
      continue;
    }
    let text;
    try {
      text = fs.readFileSync(path.join(root, r.spec), "utf8");
    } catch {
      out[name] = { exists: false, reason: "spec file unreadable", path: r.spec };
      continue;
    }
    out[name] = { exists: true, path: r.spec, ...parseFrontmatterEffort(text) };
  }
  return out;
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
    const specs = loadSpecEfforts(reg, ROOT);
    errors.push(...evaluateModelChain({ reg, consumers, specs }));
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
      `OK   [${NAME}] model/effort chain intentional (Bucket-D narrow) — alpha = fable@high, doers = sonnet-5, max = security-reviewer, ultra ∈ {sol, terra}, registry↔catalog↔providers agree\n`,
    );
    return 0;
  }
  process.stderr.write(
    `FAIL [${NAME}] model-chain drift (${errors.length}):\n${errors.map((e) => `  - ${e}`).join("\n")}\n`,
  );
  return 1;
}

if (require.main === module) process.exit(main(process.argv));
module.exports = {
  evaluateModelChain,
  collectModelRefs,
  loadConsumers,
  loadSpecEfforts,
  parseFrontmatterEffort,
  main,
  NAME,
  TOP_MODEL,
  VALID_EFFORTS,
  SCRAPPED_ROLES,
  ALPHA_ALLOWED,
  DOER_MODELS,
  MAX_ALLOWED_ROLES,
  ULTRA_MODELS,
};
