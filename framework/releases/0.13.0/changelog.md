# WarpOS 0.13.0 — 2026-06-01

## What's new since 0.12.1

- **`models:` skill suite** — manage dispatch models end-to-end over the existing Dispatch Console:
  - `/models:check` — audit `scripts/dispatch/catalog.js` against the latest vendor catalogs; flags deprecated/shut-down ("ghost") ids, missing options, and newer-flagship drift. `--refresh` deep-ingests each vendor's docs (per-model pages, incl. dispatch settings like effort/thinking) into `runtime/models-research/`. Engine: `scripts/models/check.js` (deterministic + offline; exit 0 clean / 1 drift / 2 usage).
  - `/models:update` — migrate dead ids, add new options, sync routing, regenerate manifests (Beta-gated for default-model changes).
  - `/models:route <role> <provider> <model> [effort]` — route a command/role to a specific model; thin validated wrapper over `dispatch.js set` (atomic backup ring).
  - `/models:router` — ensure the catalog carries all latest options, then open the model router panel (`dispatch.js gui`).

- **Model catalog audited to latest (2026-06-01)** across all three providers:
  - Default gauntlet/redteam model is now **`gemini-3.1-pro-preview`** (shipped since the 2026-05-30 "ghost" finding; confirmed via official docs).
  - Removed the shut-down `gemini-3-pro-preview` (EOL 2026-03-09) and the `gemini-flash-latest` rolling alias; added GA `gemini-3.5-flash` + `gemini-3.1-flash-lite`. Gemini fallback rung is now GA `gemini-3.5-flash` (with `gemini-2.5-flash` as deep fallback).
  - Added OpenAI options `gpt-5.3-codex` + `gpt-5.4-nano`. Claude (`opus-4-8`/`sonnet-4-6`/`haiku-4-5`) confirmed current.

- **Gemini key-precedence fix** — `providers.js` now injects the `~/.gemini/.env` `GEMINI_API_KEY` for CLI/gauntlet dispatch **only when no live OAuth session exists**, so an interactive `gemini` login wins for CLI; the API key still wins for API-requiring tasks (e.g. deep research) and as a no-OAuth fallback. Fixes the "stale/quota'd key beats a working login" symptom.

- **Gemini auth-prerequisite surfaced** — `provider-failure-modes.json` remediation now names the one-time interactive `gemini` trust+login as a day-zero step on fresh installs, new machines, AND after a WarpOS/CLI update.

- **New enforcer** — `test-dispatch-config.js` now asserts the primary gemini model agrees across all dispatch pin-points (providers.js, catalog.js, both redteam specs, scaffold, manifest, provider-fallback), killing the rename-hygiene drift class. GHOST regex updated to flag confirmed-dead ids only.

## Breaking changes

- None. (Default gemini model changed to a preview tier; the fallback chain + GPT second security pass preserve coverage. Override with `GEMINI_MODEL=gemini-3.5-flash` or `gemini-2.5-flash`.)

## Schema changes

- None.

## Migrations

- None.

## Pinned commit

Captured at release-build time (recorded in release.json#commit after scripts/warpos/release-build.js runs).
