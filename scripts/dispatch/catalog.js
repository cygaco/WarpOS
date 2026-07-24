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
      // claude-opus-5 — the opus WORKHORSE-tier successor to opus-4-8 (operator-directed
      // cutover 2026-07-24). ADDED as an available member; opus-4-8 STAYS served (never
      // deleted). Same price/ctx as 4.8 ($5/$25, 1M/128K); full effort ladder incl. max.
      // CLI serve VERIFIED live 2026-07-24: `claude -p --output-format json --model claude-opus-5
      // --effort max` → exit 0, envelope modelUsage.canonicalModel="claude-opus-5", provider
      // "firstParty", contextWindow 1_000_000 (no 400, no fallback). Thinking is ON by DEFAULT
      // on opus-5 (opus-4-8 ran without thinking unless adaptive was set); `thinking:{type:
      // "disabled"}` at effort xhigh/max → 400 (breaking), so any claude role at xhigh/max MUST
      // keep thinking ON (standing invariant, ADR-0016 amendment 2026-07-24; enforced by
      // scripts/checks/model-chain.js block J). NOT harness Agent-tool-spawnable yet (α probe
      // 2026-07-24: the in-process "opus" alias still serves opus-4-8), so the "opus" ALIAS +
      // provider defaultModel stay on opus-4-8 below until the harness serves opus-5 (ADR-0016
      // amendment follow-up). Bedrock form: anthropic.claude-opus-5.
      id: "claude-opus-5",
      label: "Claude Opus 5 (opus workhorse tier; thinking-on by default)",
      effortLevels: ["low", "medium", "high", "xhigh", "max"],
      contextTokens: 1_000_000,
      maxOutputTokens: 128_000,
      pricing: { inPerMTok: 5, outPerMTok: 25 },
      aliases: ["claude-opus-5"],
    },
    {
      id: "claude-opus-4-8",
      label: "Claude Opus 4.8",
      effortLevels: ["low", "medium", "high", "xhigh", "max"],
      contextTokens: 1_000_000,
      maxOutputTokens: 128_000,
      pricing: { inPerMTok: 5, outPerMTok: 25 },
      // NOTE: the "opus" alias + the provider defaultModel (above) INTENTIONALLY stay on 4.8 —
      // the in-process Agent-tool channel still serves 4.8 (α probe 2026-07-24). They flip to
      // opus-5 only once the harness serves it (ADR-0016 amendment 2026-07-24 follow-up).
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
  defaultModel: "gpt-5.6-sol",
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

// ── Antigravity (Gemini via `agy`) ─────────────────────────────
// DISPATCH.md 2026-07-12: the individual-tier `gemini` CLI is SUNSET — route ALL Gemini through
// Antigravity's `agy` CLI. Self-auth at ~/.gemini/antigravity-cli. `antigravity` is now the SOLE
// google-family provider (the legacy `gemini` CLI provider was removed in the 2026-07-20 deep-clean).
//
// EMPIRICAL INVOCATION CONTRACT (2026-07-16 top-level probe, CORRECTED by the 2026-07-19 ED-060
// calibration — the 2026-07-16 note was WRONG that the kebab slug is the working `--model` id):
//   WORKING: `agy --model "Gemini 3.1 Pro (High)" --print-timeout 90s -p '<prompt>'` → exit 0, authed serve.
//   1. agy's `--model` takes the DISPLAY NAME `Gemini 3.1 Pro (High)`, NOT the catalog slug
//      `gemini-3.1-pro-high`. Passing the slug makes agy SILENTLY DEFAULT ("Model ID
//      gemini-3.1-pro-high not in local config, defaulting to CCPA" → serves the WRONG model;
//      verified live 2026-07-19, ED-060). The canonical slug stays the catalog `id` (source of
//      truth); the `agyModelName` field below single-sources the display name, and the two agy
//      dispatch boundaries (providers.js#buildProviderArgv + cert-attest#probeShape) translate
//      slug→display via agyModelName(). NOT `gemini-3.1-pro-preview` (INVALID on agy, exit 1) and
//      NOT bare `gemini-3.1-pro`.
//   2. The prompt is the ARGUMENT to `-p` (`-p '<prompt>'`); bare `-p` with stdin errors "flag needs
//      an argument". NO stdin delivery (unlike codex/claude).
//   3. `--print-timeout` needs an EXPLICIT bound (default 5m > a teammate's ~2-min Bash cap → long
//      agy runs belong to the top-level orchestrator).
//   4. NEVER call `agy models` from a script/probe — it HANGS headless (>10min, zero output). To
//      enumerate, use the fail-fast path: an invalid --model exits 1 immediately + lists ids on stderr.
//   5. `agy` also exposes NON-Google models (Claude Sonnet/Opus, GPT-OSS) — potentially useful for
//      Bucket-E lab-diversity math, but verify their kebab ids before relying on them.
// GOTCHA: `agy` probabilistically declines "security review" framing (~2/3 on toy prompts) — the
// provider runner keeps a refusal-retry loop (re-sample ≤4×).
const ANTIGRAVITY = {
  id: "antigravity",
  label: "Antigravity (Gemini)",
  cli: "agy",
  cliEffortFlagTemplate: "",
  syntaxTemplate: "agy --model {model} --print-timeout 90s -p '{prompt}'",
  requiresFallback: true,
  defaultModel: "gemini-3.1-pro-high",
  models: [
    {
      id: "gemini-3.1-pro-high",
      label: "Gemini 3.1 Pro (high thinking) — via agy",
      // The string agy's `--model` flag actually RESOLVES (a display name, NOT the slug id). Passing
      // the slug silently defaults to CCPA on agy (ED-060); agyModelName() single-sources this and
      // both agy dispatch boundaries translate slug→display. Must satisfy safe-spawn's
      // AGY_MODEL_DISPLAY shape (alnum-start, then letters/digits/space/dot/paren/hyphen, ≤64).
      agyModelName: "Gemini 3.1 Pro (High)",
      effortLevels: [],
      contextTokens: 1_000_000,
      maxOutputTokens: 65_536,
      thinkingAlwaysOn: true,
      pricing: { inPerMTok: 2, outPerMTok: 12 },
    },
  ],
};

const PROVIDERS = { claude: ANTHROPIC, openai: OPENAI, antigravity: ANTIGRAVITY };
const PROVIDER_LIST = [ANTHROPIC, OPENAI, ANTIGRAVITY];

// Accepted aliases the user might type — normalize to canonical id.
// D2 (deep-clean 2026-07-20): the SUNSET individual `gemini` CLI provider is removed;
// `google` now resolves to the supported `antigravity` (agy) lane that serves Gemini
// MODELS, and the bare `gemini` alias is dropped (it pointed at the dead provider).
const PROVIDER_ALIASES = {
  anthropic: "claude",
  claude: "claude",
  openai: "openai",
  gpt: "openai",
  google: "antigravity",
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
  // Security literal FLOOR = the VERIFIABLE GPT lane (β DECIDE B/0.90, 2026-07-20): a registry-read
  // failure falls to openai, NEVER the SUNSET gemini CLI. LIVE default = antigravity via role-registry.
  redteam: "openai",
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
  "security-reviewer": "openai", // literal FLOOR only — LIVE default = antigravity via role-registry (β DECIDE B/0.90)
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

/**
 * Resolve a canonical model slug to the string the agy (Antigravity) CLI's `--model` flag RESOLVES.
 * agy takes DISPLAY NAMES ("Gemini 3.1 Pro (High)"), NOT the kebab catalog slug ("gemini-3.1-pro-high")
 * — passing the slug makes agy silently default ("Model ID … not in local config, defaulting to CCPA"),
 * serving the WRONG model (verified live 2026-07-19; ED-060). The display name is single-sourced on the
 * antigravity model entry's `agyModelName` field. A non-antigravity or unmapped id returns UNCHANGED —
 * the translation is antigravity-only, zero blast radius. This is the ONE mapping source both agy
 * dispatch boundaries (providers.js#buildProviderArgv, cert-attest#probeShape) call — never a second copy.
 */
function agyModelName(canonicalId) {
  const m = getModel("antigravity", canonicalId);
  return (m && m.agyModelName) || canonicalId;
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
  // Additive export (SP-20260720-003, α-approved): the raw LITERAL map, INDEPENDENT of providers' literal
  // (this one hardcodes redteam=openai; providers' spreads SCRAPPED_PROVIDER_ALIASES). security-binding-lane
  // Tooth-B(1) compares the two literals so the redteam alias floor can't silently fork. No behavior change.
  LITERAL_DEFAULT_PROVIDER_PER_ROLE,
  DEFAULT_EFFORT_PER_ROLE,
  getProvider,
  getModel,
  resolveModelAlias,
  agyModelName,
  normalizeProviderId,
  validateTuple,
};
