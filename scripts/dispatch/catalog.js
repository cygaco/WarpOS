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
  defaultModel: "gpt-5.5",
  models: [
    {
      id: "gpt-5.5",
      label: "GPT-5.5 (flagship)",
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
  ],
};

// ── Gemini ─────────────────────────────────────────────────────
// gemini-2.5-pro deliberately excluded per project policy
// (see _requirements/09-integrations/PROVIDER/03-google-gemini.md)
//
// MODEL IDS: `gemini-3.1-pro-preview` is the DEFAULT (operator directive
// 2026-06-01, confirmed real at ai.google.dev/gemini-api/docs/models/
// gemini-3.1-pro-preview — 1M in / 64K out, thinking always-on). It 404'd on
// 2026-05-30 (hence the old "ghost" note) but has since shipped. Other real ids:
//   - `gemini-3-pro-preview`  (Gemini 3 Pro)
//   - `gemini-flash-latest`   (documented rolling alias for current flash)
//   - `gemini-2.5-flash`      (concrete pinned flash — the reliable fallback)
// Auth: GEMINI_API_KEY in ~/.gemini/.env (global) OR `gemini auth login` (OAuth)
// — one of the two is REQUIRED once per fresh install / new machine / update.
// `-p`/`--prompt` is being soft-deprecated upstream in favor of a positional
// prompt, but still works in 0.44.x; revisit when the CLI hard-removes it.
// NOTE: preview tier CAN quota-fail / silently downgrade under load — fall back
// to the pinned flash with GEMINI_MODEL=gemini-2.5-flash.
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
      maxOutputTokens: 64_000,
      thinkingAlwaysOn: true,
    },
    {
      id: "gemini-3-pro-preview",
      label: "Gemini 3 Pro (preview, thinking always-on)",
      effortLevels: [],
      contextTokens: 1_000_000,
      maxOutputTokens: 64_000,
      thinkingAlwaysOn: true,
    },
    {
      id: "gemini-flash-latest",
      label: "Gemini Flash (latest alias)",
      effortLevels: [],
      contextTokens: 1_000_000,
      maxOutputTokens: 64_000,
    },
    {
      id: "gemini-2.5-flash",
      label: "Gemini 2.5 Flash",
      effortLevels: [],
      contextTokens: 1_000_000,
      maxOutputTokens: 64_000,
    },
  ],
};

const PROVIDERS = { claude: ANTHROPIC, openai: OPENAI, gemini: GEMINI };
const PROVIDER_LIST = [ANTHROPIC, OPENAI, GEMINI];

// Accepted aliases the user might type — normalize to canonical id.
const PROVIDER_ALIASES = {
  anthropic: "claude",
  claude: "claude",
  openai: "openai",
  gpt: "openai",
  gemini: "gemini",
  google: "gemini",
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
  "learner",
  "qa",
  "redteam",
  "stub-scaffold",
];

const DEFAULT_PROVIDER_PER_ROLE = {
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
  learner: "openai",
  qa: "openai",
  redteam: "gemini",
  "stub-scaffold": "claude",
};

const DEFAULT_EFFORT_PER_ROLE = {
  alpha: null,
  beta: "high",
  gamma: null,
  delta: null,
  builder: "max",
  "frontend-builder": "max",
  "backend-builder": "max",
  "design-quality": "high",
  fixer: "max",
  reviewer: "xhigh",
  compliance: "xhigh",
  learner: "xhigh",
  qa: "medium",
  redteam: "high",
  "stub-scaffold": null,
};

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
