# Google Gemini — Models, Thinking, CLI

**Sources** (re-fetch when models change):
- https://ai.google.dev/gemini-api/docs/models
- https://docs.cloud.google.com/gemini/docs/codeassist/gemini-cli
- https://geminicli.com/docs/get-started/installation/ (full CLI reference)

Last verified: 2026-04-28.

> **Note:** Both source pages were sparse on flag-level detail. CLI invocation pattern below is taken from `scripts/hooks/lib/providers.js:115-124` (the dispatcher's working syntax) and is the authoritative project reference until upstream docs improve.

## Current model families (April 2026)

### Gemini 3 (preview tier — recommended for adversarial/agentic)

| Model ID | Tier | Thinking |
|---|---|---|
| `gemini-3.1-pro-preview` | Pro | Always-on (no `thinking_budget` flag) |
| `gemini-3.1-flash` | Flash | Off |
| `gemini-3.1-flash-lite` | Flash-Lite | Off |
| `gemini-3-flash` | Flash | Off |

### Gemini 2.5 (stable + preview)

| Model ID | Tier | Thinking |
|---|---|---|
| `gemini-2.5-pro` | Pro | Configurable (project policy: **DO NOT USE** — see below) |
| `gemini-2.5-flash` | Flash | Off |
| `gemini-2.5-flash-lite` | Flash-Lite | Off |

### Specialized (not used by dispatch agents)

- Nano Banana 2 / Pro (vision/image)
- Veo 3.1 (video)
- Embedding 2 (embeddings)

### Deprecated

- `gemini-3-pro-preview` — sunset 2026-03-09. Migrate to `gemini-3.1-pro-preview`.

## Thinking mode

Gemini does NOT expose an explicit `effort` or `reasoning_effort` parameter via the CLI used by the dispatcher. For the pro-preview tier, thinking is always-on at the API level. For Flash tiers, thinking is off.

The `provider_reasoning_effort` frontmatter key is therefore a **no-op** when provider is `gemini`. Project convention: still set it (for documentation), default to `high`.

## Gemini CLI reference

**Install:** see https://geminicli.com/docs/get-started/installation/

**Headless flags (from providers.js DEFAULT_PROVIDERS.gemini.syntax):**

| Flag | Purpose |
|---|---|
| `-m <model>` | Model selection |
| `-p <prompt>` | Inline prompt; combine with stdin context |
| stdin | Pipe context (file content, etc.) before the `-p` instruction |

**Full invocation pattern:**

```bash
gemini -m gemini-3.1-pro-preview -p "<instruction>" < context.txt
```

**Authentication:** Gemini API key via `GEMINI_API_KEY` env or `gcloud auth` for Cloud Code paths.

## Project policy

> **DO NOT USE `gemini-2.5-pro`** — see user memory `feedback_no_gemini_25pro.md`.

The catalog (`scripts/dispatch/catalog.js`) deliberately excludes this model. CLI will not offer it.

## Project decisions

- **redteam:** `gemini-3.1-pro-preview` (always-on thinking provides cognitive diversity vs Claude/OpenAI). Fallback to `anthropic` when CLI unavailable.
