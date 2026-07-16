/**
 * catalog.js — provider/model/effort source of truth for the dispatch CLI.
 *
 * Mirrors _requirements/09-integrations/PROVIDER/. When models change, update this file
 * AND the corresponding markdown doc together.
 */

"use strict";

// ── Anthropic / Claude ─────────────────────────────────────────
// Internal id is "claude" to match existing manifest.agentProviders + providers.js
// DEFAULT_AGENT_PROVIDERS convention. User-facing label is "Anthropic".
const ANTHROPIC = {
  id: "claude",
  label: "Anthropic (Claude)",
  cli: "claude",
  cliEffortFlagTemplate: "--effort {effort}",
  syntaxTemplate: "claude -p {reasoning} --agent {role}",
  requiresFallback: false,
  defaultModel: "claude-opus-4-8",
  models: [
    // ── Claude-5 family (DISPATCH.md 2026-07-12, verified via `claude` CLI) ──
    // fable-5 = top brain (President, Dir-Eng, security planner+judge); sonnet-5 =
    // builders/fixers/legwork/tools. Added ADDITIVELY — opus-4-8 stays THE fallback
    // target; the legacy claude-sonnet-4-6 stays until the §6 sweep + parity are green
    // (remove-last, DISPATCH.md §9).
    {
      id: "claude-fable-5",
      label: "Claude Fable 5 (top brain; Claude-5 family, adaptive thinking)",
      effortLevels: ["low", "medium", "high", "xhigh", "max"],
      contextTokens: 1_000_000,
      maxOutputTokens: 128_000,
      // Pricing NOT specified in DISPATCH.md §4; placeholder at opus-4-8 parity pending
      // operator confirmation (flagged as enforcement debt — do not treat as authoritative).
      pricing: { inPerMTok: 5, outPerMTok: 25 },
      pricingEstimate: true,
      aliases: ["fable", "claude-fable-5"],
    },
    {
      id: "claude-sonnet-5",
      label: "Claude Sonnet 5 (builders/fixers/legwork; ~30% more tokens, new tokenizer)",
      effortLevels: ["low", "medium", "high", "xhigh", "max"],
      contextTokens: 1_000_000,
      maxOutputTokens: 64_000,
      // §4: $3/$15 (intro $2/$10 → 2026-08-31). Steady-state rate recorded.
      pricing: { inPerMTok: 3, outPerMTok: 15 },
      aliases: ["sonnet-5", "claude-sonnet-5"],
    },
    {
      id: "claude-opus-4-8",
      label: "Claude Opus 4.8",
      effortLevels: ["low", "medium", "high", "xhigh", "max"],
      contextTokens: 1_000_000,
      maxOutputTokens: 128_000,
      pricing: { inPerMTok: 5, outPerMTok: 25 },
      aliases: ["opus", "claude-opus-4-8"],
    },
    {
      id: "claude-sonnet-4-6",
      label: "Claude Sonnet 4.6",
      effortLevels: ["low", "medium", "high", "max"],
      contextTokens: 1_000_000,
      maxOutputTokens: 64_000,
      pricing: { inPerMTok: 3, outPerMTok: 15 },
      aliases: ["sonnet", "claude-sonnet-4-6"],
    },
    {
      id: "claude-haiku-4-5-20251001",
      label: "Claude Haiku 4.5",
      effortLevels: [],
      contextTokens: 200_000,
      maxOutputTokens: 64_000,
      pricing: { inPerMTok: 1, outPerMTok: 5 },
      aliases: ["haiku", "claude-haiku-4-5"],
    },
  ],
};

// ── OpenAI ─────────────────────────────────────────────────────
const OPENAI = {
  id: "openai",
  label: "OpenAI",
  cli: "codex",
  cliEffortFlagTemplate: "-c model_reasoning_effort={effort}",
  // `--full-auto` is DEPRECATED in Codex CLI ≥0.135 (prints a warning that leaks
  // into the JSON envelope). `codex exec` is inherently non-interactive, and
  // `--ask-for-approval` is interactive-only — NOT a valid exec flag. The headless
  // replacement is just `--sandbox workspace-write` (parity with old --full-auto's
  // write scope; our codex roles are read-only analysis anyway).
  // Ref: developers.openai.com/codex/cli/reference
  syntaxTemplate: "codex exec --sandbox workspace-write {reasoning} -m {model} -",
  requiresFallback: true,
  // defaultModel stays gpt-5.5 through Bucket A (additive). The flip to gpt-5.6-sol is
  // a live-default change → Bucket D, gated behind the certification gate + gauntlet GREEN
  // + kill-switch (DISPATCH.md §10; ADR-0013 lesson).
  defaultModel: "gpt-5.5",
  models: [
    // ── GPT-5.6 family (DISPATCH.md 2026-07-12, PROBE-OK via `codex exec`) ──
    // NEVER the bare `gpt-5.6` alias (400s "Model metadata not found" → silently degrades
    // to fallback metadata; a prior session lost a sprint to this). Always the canonical
    // -sol/-terra/-luna. Effort: sol/terra add `max` + `ultra`; luna caps at `high`+`max`
    // (no xhigh/ultra). `ultra` fans out parallel subagents (heavy/agentic — budget 10-15min;
    // for a bounded verdict use sol@xhigh instead or it times out before emitting).
    {
      id: "gpt-5.6-sol",
      label: "GPT-5.6 Sol (flagship)",
      effortLevels: ["low", "medium", "high", "xhigh", "max", "ultra"],
      contextTokens: 1_050_000,
      maxOutputTokens: 128_000,
      pricing: { inPerMTok: 5, outPerMTok: 30 },
    },
    {
      id: "gpt-5.6-terra",
      label: "GPT-5.6 Terra (mid)",
      effortLevels: ["low", "medium", "high", "xhigh", "max", "ultra"],
      contextTokens: 1_050_000,
      maxOutputTokens: 128_000,
      pricing: { inPerMTok: 2.5, outPerMTok: 15 },
    },
    {
      id: "gpt-5.6-luna",
      label: "GPT-5.6 Luna (cheap)",
      effortLevels: ["low", "medium", "high", "max"],
      contextTokens: 1_050_000,
      maxOutputTokens: 128_000,
      pricing: { inPerMTok: 1, outPerMTok: 6 },
    },
    {
      id: "gpt-5.5",
      label: "GPT-5.5 (flagship — legacy, retiring after §6 sweep + parity green)",
      effortLevels: ["low", "medium", "high", "xhigh"],
      contextTokens: 1_000_000,
      maxOutputTokens: 128_000,
      pricing: { inPerMTok: 5, outPerMTok: 30 },
    },
    {
      id: "gpt-5.4",
      label: "GPT-5.4",
      effortLevels: ["low", "medium", "high", "xhigh"],
      contextTokens: 1_000_000,
      maxOutputTokens: 128_000,
      pricing: { inPerMTok: 2.5, outPerMTok: 15 },
    },
    {
      id: "gpt-5.4-mini",
      label: "GPT-5.4 Mini",
      effortLevels: ["low", "medium", "high", "xhigh"],
      contextTokens: 400_000,
      maxOutputTokens: 128_000,
      pricing: { inPerMTok: 0.75, outPerMTok: 4.5 },
    },
    // Added 2026-06-01 (audit vs developers.openai.com/api/docs/models/all):
    // gpt-5.4-nano is the cheapest 5.4-class for high-volume/sub-agent use.
    // NOT added: gpt-5.5-pro / gpt-5.4-pro — Responses-API-only (no streaming),
    // not cleanly dispatchable via `codex exec`; selecting them would fail.
    // REMOVED 2026-06-17 (E-DISPATCH-PERFECT-001 W0): gpt-5.3-codex — superseded in
    // the live OpenAI docs (5.4/5.5 class); doers floor at gpt-5.4/5.4-mini (operator).
    {
      id: "gpt-5.4-nano",
      label: "GPT-5.4 Nano (cheapest 5.4-class)",
      effortLevels: ["low", "medium", "high", "xhigh"],
      contextTokens: 400_000,
      maxOutputTokens: 128_000,
      pricing: { inPerMTok: 0.2, outPerMTok: 1.25 },
    },
  ],
};

// ── Gemini ─────────────────────────────────────────────────────
// gemini-2.5-pro deliberately excluded per project policy
// (see _requirements/09-integrations/PROVIDER/03-google-gemini.md)
//
// MODEL IDS (audited 2026-06-01 vs ai.google.dev/gemini-api/docs/models):
// DEFAULT = `gemini-3.1-pro-preview` (operator directive 2026-06-01) — 1M in /
// 65K out, thinking ALWAYS-ON (thinking_level minimal|low|medium|high, default
// high; cannot be disabled). It is a PREVIEW id (v1beta, tighter quota, may be
// paid-API-only) — it 404'd on 2026-05-30 then shipped. Current real ids:
//   - `gemini-3.1-pro-preview`  reasoning flagship (preview / v1beta)
//   - `gemini-3.5-flash`        GA flash, thinking always-on (the new fast pick)
//   - `gemini-3.1-flash-lite`   GA, cheapest Gemini-3
//   - `gemini-2.5-flash`        GA, thinking TOGGLEABLE — safest non-preview fallback
// REMOVED 2026-06-01: `gemini-3-pro-preview` (SHUT DOWN 2026-03-09 → 3.1) and the
// `gemini-flash-latest` rolling alias (pin concrete ids so the strict downgrade
// check can verify which model actually served).
// THINKING PARAM GOTCHA: Gemini 3 uses thinking_level (string); Gemini 2.5 uses
// thinkingBudget (int) — crossing them is a silent dispatch failure. The gemini
// CLI exposes no effort flag, so effortLevels:[] for all (thinking is implicit).
// Auth: GEMINI_API_KEY in ~/.gemini/.env OR `gemini auth login` (OAuth) — one is
// REQUIRED once per fresh install / new machine / update.
// `-p`/`--prompt` is soft-deprecated upstream (positional prompt); works in 0.44.x.
// NOTE: preview tier CAN quota-fail / silently downgrade — fall back to GA flash
// with GEMINI_MODEL=gemini-2.5-flash (or gemini-3.5-flash).
const GEMINI = {
  id: "gemini",
  label: "Google Gemini",
  cli: "gemini",
  cliEffortFlagTemplate: "",
  syntaxTemplate: "gemini -m {model} -p",
  requiresFallback: true,
  defaultModel: "gemini-3.1-pro-preview",
  models: [
    {
      id: "gemini-3.1-pro-preview",
      label: "Gemini 3.1 Pro (preview, thinking always-on)",
      effortLevels: [],
      contextTokens: 1_000_000,
      maxOutputTokens: 65_536,
      thinkingAlwaysOn: true,
      pricing: { inPerMTok: 2, outPerMTok: 12 },
    },
    {
      id: "gemini-3.5-flash",
      label: "Gemini 3.5 Flash (GA, thinking always-on)",
      effortLevels: [],
      contextTokens: 1_000_000,
      maxOutputTokens: 65_536,
      thinkingAlwaysOn: true,
      pricing: { inPerMTok: 1.5, outPerMTok: 9 },
    },
    {
      id: "gemini-3.1-flash-lite",
      label: "Gemini 3.1 Flash-Lite (GA, thinking always-on)",
      effortLevels: [],
      contextTokens: 1_000_000,
      maxOutputTokens: 65_536,
      thinkingAlwaysOn: true,
      pricing: { inPerMTok: 0.25, outPerMTok: 1.5 },
    },
    {
      id: "gemini-2.5-flash",
      label: "Gemini 2.5 Flash (GA, safe non-preview fallback)",
      effortLevels: [],
      contextTokens: 1_000_000,
      maxOutputTokens: 65_536,
      pricing: { inPerMTok: 0.3, outPerMTok: 2.5 },
    },
  ],
};

// ── Antigravity (Gemini via `agy`) ─────────────────────────────
// DISPATCH.md 2026-07-12: the individual-tier `gemini` CLI is SUNSET — route ALL Gemini
// through Antigravity's `agy` CLI. `gemini-3.1-pro-preview` is the ONLY Gemini (Flash
// REMOVED). Thinking is always-on (no effort flag). PROBE-OK via `agy` v1.1.x. Self-auth
// at ~/.gemini/antigravity-cli. Added as a NEW provider id `antigravity` alongside the
// legacy `gemini` provider (which is removed LAST, after the §6 sweep + parity green).
// GOTCHA: `agy` probabilistically declines "security review" framing (~2/3 on toy prompts)
// — the provider runner keeps a refusal-retry loop (re-sample ≤4×).
const ANTIGRAVITY = {
  id: "antigravity",
  label: "Antigravity (Gemini)",
  cli: "agy",
  cliEffortFlagTemplate: "",
  syntaxTemplate: "agy --model {model}",
  requiresFallback: true,
  defaultModel: "gemini-3.1-pro-preview",
  models: [
    {
      id: "gemini-3.1-pro-preview",
      label: "Gemini 3.1 Pro (preview, thinking always-on) — via agy",
      effortLevels: [],
      contextTokens: 1_000_000,
      maxOutputTokens: 65_536,
      thinkingAlwaysOn: true,
      pricing: { inPerMTok: 2, outPerMTok: 12 },
    },
  ],
};

const PROVIDERS = { claude: ANTHROPIC, openai: OPENAI, gemini: GEMINI, antigravity: ANTIGRAVITY };
const PROVIDER_LIST = [ANTHROPIC, OPENAI, GEMINI, ANTIGRAVITY];

// Accepted aliases the user might type — normalize to canonical id.
const PROVIDER_ALIASES = {
  anthropic: "claude",
  claude: "claude",
  openai: "openai",
  gpt: "openai",
  gemini: "gemini",
  google: "gemini",
  antigravity: "antigravity",
  agy: "antigravity",
};

function normalizeProviderId(id) {
  if (!id) return id;
  return PROVIDER_ALIASES[id.toLowerCase()] || id;
}

const ROLES = [
  "alpha",
  "beta",
  "gamma",
  "delta",
  "builder",
  "frontend-builder",
  "backend-builder",
  "design-quality",
  "fixer",
  "reviewer",
  "compliance",
  "ops-analyst", // S-7: was `learner`
  "qa",
  "redteam",
  "skeleton-builder", // S-7: was `stub-scaffold`
  // ADR-0007 new roster (coexists with the above; cutover deletes the old once green):
  "epsilon",
  "design-lead",
  "frontend-reviewer",
  "frontend-fixer",
  "backend-reviewer",
  "backend-fixer",
  "security-builder",
  "security-reviewer",
  "security-fixer",
  "qa-reviewer",
  "visual-review",
  "test-runner",
  "cabinet", // S-7: the registered freeform consult role (was advisor/consult pseudo-roles)
];

// v0.2 consumer-rewire foundation: the per-role maps DERIVE from the role-registry
// keystone (the single source). The literals below are RETAINED as the loud-fallback
// recovery net — deriveOrFallback warns to stderr if the registry read fails; a
// silent fallback would mask a broken derivation (β).
const registryRoles = require("./registry-roles");

const LITERAL_DEFAULT_PROVIDER_PER_ROLE = {
  alpha: "claude",
  beta: "claude",
  gamma: "claude",
  delta: "claude",
  builder: "claude",
  "frontend-builder": "claude",
  "backend-builder": "claude",
  "design-quality": "claude",
  fixer: "claude",
  reviewer: "openai",
  compliance: "openai",
  "ops-analyst": "openai", // S-7: was `learner`
  qa: "openai",
  redteam: "gemini",
  "skeleton-builder": "claude", // S-7: was `stub-scaffold`
  cabinet: "openai", // S-7: registered freeform consult role
  // ADR-0007 new roster (must match providers.js DEFAULT_AGENT_PROVIDERS):
  epsilon: "claude",
  "design-lead": "openai",
  "frontend-reviewer": "openai",
  "frontend-fixer": "claude",
  "backend-reviewer": "openai",
  "backend-fixer": "claude",
  "security-builder": "claude",
  "security-reviewer": "gemini",
  "security-fixer": "claude",
  "qa-reviewer": "openai",
  "visual-review": "claude",
  "test-runner": "claude",
};

// Effort policy (ADR-0007, operator override 2026-06-04): `max` is reserved for
// VERY BIG projects AND only the TOP face (alpha) — everything else caps at the
// model's high-water mark. Doers (builders + fixer) run `high`, NOT max; the
// cross-provider gpt-5.5 review roles run `xhigh` (their ceiling). (qa stays
// medium + stub-scaffold null until the Wave-2 restructure carries them to the
// QA-Reviewer / _system entries.)
const LITERAL_DEFAULT_EFFORT_PER_ROLE = {
  alpha: "max", // the sole `max` — top face + big-project exception
  beta: "xhigh",
  gamma: "high",
  delta: "high",
  builder: "high",
  "frontend-builder": "high",
  "backend-builder": "high",
  "design-quality": "high",
  fixer: "high",
  reviewer: "xhigh",
  compliance: "xhigh",
  "ops-analyst": "xhigh", // S-7: was `learner`
  qa: "medium",
  redteam: "high",
  "skeleton-builder": null, // S-7: was `stub-scaffold`
  cabinet: "xhigh", // S-7: registered freeform consult role
  // ADR-0007 new roster (max stays alpha-only; gpt-5.5 caps at xhigh):
  epsilon: "high",
  "design-lead": "xhigh",
  "frontend-reviewer": "xhigh",
  "frontend-fixer": "high",
  "backend-reviewer": "xhigh",
  "backend-fixer": "high",
  "security-builder": "high",
  "security-reviewer": "high",
  "security-fixer": "high",
  "qa-reviewer": "xhigh",
  "visual-review": "high",
  "test-runner": "medium",
};

// Derived (registry ∪ back-compat shim). CUT-SAFETY: for every role the prior
// literal named, the derived map yields the same value (verified before the cut);
// the registry additionally carries the ADR-0007 manager/director roles — claude
// providers (behavior-neutral: unlisted defaults to claude) and `high` efforts
// (new keys, regressing no existing route; managers dispatch in-process where the
// reasoning-effort flag is not consulted). LOUD FALLBACK to the literals above.
const DEFAULT_PROVIDER_PER_ROLE = registryRoles.deriveOrFallback(
  () => ({
    ...registryRoles.providerMap(),
    ...registryRoles.SCRAPPED_PROVIDER_ALIASES,
  }),
  LITERAL_DEFAULT_PROVIDER_PER_ROLE,
  "catalog.DEFAULT_PROVIDER_PER_ROLE",
);
const DEFAULT_EFFORT_PER_ROLE = registryRoles.deriveOrFallback(
  () => ({
    ...registryRoles.effortMap(),
    ...registryRoles.SCRAPPED_EFFORT_ALIASES,
  }),
  LITERAL_DEFAULT_EFFORT_PER_ROLE,
  "catalog.DEFAULT_EFFORT_PER_ROLE",
);

function getProvider(id) {
  const normalized = normalizeProviderId(id);
  return PROVIDERS[normalized] || null;
}

function getModel(providerId, modelId) {
  const p = PROVIDERS[providerId];
  if (!p) return null;
  return (
    p.models.find(
      (m) => m.id === modelId || (m.aliases || []).includes(modelId),
    ) || null
  );
}

function resolveModelAlias(modelOrAlias) {
  for (const p of PROVIDER_LIST) {
    for (const m of p.models) {
      if ((m.aliases || []).includes(modelOrAlias)) return m.id;
    }
  }
  return modelOrAlias;
}

/** Validate a (provider, model, effort) tuple. Returns null if valid, else an error string. */
function validateTuple(provider, model, effort) {
  const p = getProvider(provider);
  if (!p) return `Unknown provider: ${provider}`;
  const m = getModel(p.id, model);
  if (!m) return `Model "${model}" not available on provider "${provider}"`;
  if (m.deprecated) return `Model "${model}" is deprecated`;
  if (effort) {
    if (m.effortLevels.length === 0) {
      // No-op for this model; allow but caller may warn
      return null;
    }
    if (!m.effortLevels.includes(effort)) {
      return `Effort "${effort}" not supported by model "${model}". Allowed: ${m.effortLevels.join(", ")}`;
    }
  }
  return null;
}

module.exports = {
  PROVIDERS,
  PROVIDER_LIST,
  PROVIDER_ALIASES,
  ROLES,
  DEFAULT_PROVIDER_PER_ROLE,
  DEFAULT_EFFORT_PER_ROLE,
  getProvider,
  getModel,
  resolveModelAlias,
  normalizeProviderId,
  validateTuple,
};
