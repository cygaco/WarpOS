# Models Sprint — plan & directives (2026-06-01)

Mode: adhoc (team warpos-adhoc: α lead + β + γ). Turbo on (90m).

## Operator directives (verbatim intent)
1. Check all models, ensure we are on LATEST across all 3 providers.
2. Build a `models:` skill suite:
   - `models:check` — check configured/installed models vs latest.
   - `models:update` — update model config to latest.
   - `models:route` — **route a specific command/role to a specific model** (operator add).
   - `models:router` — ensure all latest options are in the model router panel + **open** the panel.
   - Deep-ingest capability baked in (click each model page for caps + dispatch settings like effort/thinking). If a single skill can't, that's fine — suite covers it.
3. Deep-ingest 3 vendor docs (running now, background agents):
   - OpenAI: developers.openai.com/api/docs/models/all
   - Gemini: ai.google.dev/gemini-api/docs/models
   - Claude: platform.claude.com/docs/en/about-claude/models/overview
   - Dig deep: follow safe in-domain links to EACH model page; gather caps, effort/thinking, context, modalities, deprecations.
4. **Gemini key precedence**: the injected GEMINI_API_KEY should win **only for tasks that require the API** (e.g. deep research / HTTP API). For CLI/gauntlet dispatch, prefer the OAuth/CLI session. → providers.js change.

## Current model config (pre-audit)
- catalog.js: Claude opus-4-8(def)/sonnet-4-6/haiku-4-5-20251001; OpenAI gpt-5.5(def)/5.4/5.4-mini; Gemini 3.1-pro-preview(def, just set)/3-pro-preview/flash-latest/2.5-flash.
- Routing infra: catalog.js (source of truth) → state.js (resolver: manifest+frontmatter+env) → bump-model.js (safe id rewrite, **Claude-only regex today** — generalize for the suite) → agents/cli.js (list/test only; NO panel yet).
- Policies: provider-fallback.json, sprint-routing.json. Manifest: .claude/manifest.json.

## Dependency order
research (bg) → reconcile config to latest (β-gate choices) → gemini key-precedence fix → /sprint:full build models: suite → gauntlet → land.

## Research outputs land at
runtime/models-research/{openai,gemini,claude}.json

## DISCOVERY: the panel already exists (do NOT rebuild)
- **`scripts/dispatch.js`** = "Dispatch Console CLI" — the only way to view+edit provider/model/effort/fallback. Subcommands:
  - `show` (default) → resolved routing table (the text panel)
  - `set <role> <provider> <model> [effort] [fb]` → **non-interactive route = basically models:route already**
  - `edit <role>` → interactive cascade wizard; `backups`; `revert <id>`; `help`
  - Writes manifest.json + agent frontmatter atomically with a backup ring.
- **`scripts/dispatch/gui.js`** = browser GUI panel (127.0.0.1, token-gated, auto-opens). Imports catalog + state + save + backup + active-run. THIS is "the model router panel" to open.
- No skill currently launches the panel → real gap the suite fills.

## REVISED build scope (thin wrappers over existing console + new audit)
- `models:check` — NEW: audit catalog.js + agent specs vs vendor-docs-latest (research JSON) + live CLI probes (`agents/cli.js test`). Reports drift/deprecations/new-flagships.
- `models:update` — NEW: apply latest to catalog.js + ids (generalize bump-model.js beyond Claude) + specs + policies + manifest. Re-uses save.js/backup.js.
- `models:route <role|command> <provider> <model> [effort]` — thin wrapper over `dispatch.js set` (operator add). Clarify: dispatch routes by ROLE; "command" → role mapping (or per-skill if feasible).
- `models:router` (panel) — ensure catalog has all latest options THEN launch `dispatch/gui.js` (open browser panel). Could be `models:panel` alias.

## Research results
- **CLAUDE (done): already current.** opus-4-8 (newest GA opus, = this session), sonnet-4-6, haiku-4-5-20251001 all latest. Effort levels accurate in catalog (sonnet no xhigh, haiku none). Deprecations claude-opus-4-20250514 / sonnet-4-20250514 retire 2026-06-15 — NOT used by us. NO Claude changes needed.
- OPENAI (done): gpt-5.5 flagship + gpt-5.4-mini current. Added options gpt-5.3-codex + gpt-5.4-nano. Excluded *-pro (Responses-API-only).
- GEMINI (done): removed dead gemini-3-pro-preview + flash-latest alias; added GA gemini-3.5-flash + gemini-3.1-flash-lite; default stays gemini-3.1-pro-preview (preview).

## STATUS: DONE (build complete, in review)
Commits on main: ce832f7 (dispatch default→3.1-pro-preview) · c6380bd (audit reconciliation + key-precedence) · models: suite commit.
- providers.js key-precedence: file key wins only when NO OAuth (CLI prefers OAuth); API script unaffected. ✓
- catalog reconciled + agreement enforcer (test-dispatch-config.js) green. ✓
- models: suite built: scripts/models/check.js + .claude/commands/models/{check,update,route,router}.md. Registered. check.js verified happy+negative path. ✓
- Panel = existing scripts/dispatch.js (show/set/edit) + scripts/dispatch/gui.js (browser). models:router opens it.
- NOT pushed (ask-first). Gamma running focused review. Beta consult sent (no blocking reply; proceeded on reversible/operator-directed calls).
TODO maybe: regen maps:skills (new namespace); push/land when operator confirms.
