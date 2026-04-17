# WarpOS Roadmap

Post-MVP work. Items grouped by phase.

---

## Phase 1 — Ship-week hardening (2026-04-17 target)

### Path System (Command 1 from session 2026-04-16)
The paths.json registry is the single source of truth for dir/file locations. Current state: 37 keys. Goal: every `.claude/*`, `scripts/hooks/*`, and shared file referenced by skills/hooks/agents resolves via `paths.json`, never hardcoded.

- [x] Expand `paths.json` from 20 → 37 keys (add eventsFile, learningsFile, tracesFile, systemsFile, judgmentModel, judgmentRecommendations, betaEvents, lexicon, pathsLib, loggerLib, betaSourceData, toolsFile, requirementsFile, requirementsStagedFile, hookLib, patterns, requirements)
- [x] Update `lib/paths.js` fallback to match
- [x] Update `warp-setup.js` to emit the expanded paths.json at install time
- [x] Install `path-guard.js` hook — warns (optionally blocks with `PATH_GUARD_STRICT=1`) when stale paths are written to skills/agents/hooks
- [ ] **Follow-up:** migrate the remaining ~80 skill references that write paths as prose literals (e.g. "Write to `.claude/project/memory/learnings.jsonl`") to reference `PATHS.learningsFile` semantically
- [ ] **Follow-up:** `/paths:validate` skill — verify every key resolves on disk + flag hardcoded paths + suggest consolidations
- [ ] **Follow-up:** `/paths:add` skill — interactive helper to add a new path key (updates paths.json + lib/paths.js fallback + warp-setup.js in one go)

### Events & Logging
Current: `logger.js` abstracts appends to `events.jsonl`; `memory-guard.js` blocks direct writes. Smart-context reads events for context injection.

- [x] memory-guard fixed to not block `2>&1` fd redirects (false positive blocked read commands)
- [ ] **Follow-up:** dedicated `/events:tail`, `/events:query` skills (currently done via ad-hoc node oneliners)
- [ ] **Follow-up:** events retention policy — events.jsonl at 6.7MB in consumer-project. Compress / roll when crosses threshold (sleep:deep handles this manually today)
- [ ] **Follow-up:** structured query language for events.jsonl (current: grep + filter)

### Installer — Created vs Assumed model
Current: 13-step install. 8 items are CREATED (paths, manifest, store, memory, settings, dirs), 5 items are ASSUMED (agents, skills, hooks, reference, CLAUDE.md copied verbatim).

- [x] `warp-setup.js` generates paths.json v3 with all keys (CREATED)
- [x] Registers the 31 real hooks (not phantom ones)
- [x] WarpOS repo no longer ships a committed `paths.json` — clients get one built by the installer
- [ ] **Phase 1 ship blocker:** `.gitignore` mutation — append WarpOS runtime exclusion block to target's `.gitignore` to prevent session-data leaks
- [ ] **Interview phase** — warp-setup asks 5–10 questions before acting:
  - project name (override basename detection)
  - one-line pitch
  - primary user
  - main branch (detected via `git symbolic-ref refs/remotes/origin/HEAD`, confirm)
  - WarpOS repo URL (default `cygaco/WarpOS`, support forks)
  - ANTHROPIC_API_KEY location
  - Result written to `manifest.git.mainBranch`, `manifest.warpos.source`, `manifest.project.*`
- [ ] **Tool-detected hook bundles** — check for prettier/tsc/eslint/python/etc. present, only register hooks whose tooling exists. Surface skipped hooks with "install X then run `/hooks:enable <name>`"
- [ ] **Requirements pre-fill** — `/warp:init` runs after install, interviews the user, writes filled `CORE_BRIEF.md`, `PRODUCT_MODEL.md`, `GLOSSARY.md`, `USER_COHORTS.md` (not skeleton + guidance comments)
- [ ] **Parameterize `/warp:*` repo URLs** — `/warp:sync`, `/warp:check`, `/warp:init` read `manifest.warpos.source`, not hardcoded
- [ ] **Parameterize project name** — all skills/docs that mention project name read from `manifest.project.name`
- [ ] **Install-test harness** — `warp-setup.js --dry-run` on a fresh tmp dir, verify every claim in the setup output
- [ ] **`/warp:update` skill** — pull latest WarpOS, compare, apply diff (analog to `/warp:sync`)
- [ ] **`/warp:uninstall` skill** — clean removal

### Gaps from the Created vs Assumed audit

Items that are currently NEITHER created NOR assumed (just missing):
- `.gitignore` runtime exclusions — **leak risk**
- Main branch name — assumed "main" everywhere
- Project name — used basename, no override
- Git remote URL — hardcoded in `/warp:sync`
- `.env.example` template
- Environment flavor selection (minimal / full / security-heavy bundles)

---

## Phase 2 — Skills & systems

### Cross-provider agent diversity (high priority)

**Problem:** all review and security agents currently run on Claude (same model that generates the code under review). Same-model review is blind to shared failure modes. Per Alex β decision 2026-04-16: "having the same model review its own work is not good."

**Solution:** route review-layer agents through OpenAI CLI (`codex`), security orchestration through Gemini CLI. Uses the existing `store.compliance` CLI-bridge pattern, generalized.

Target model mapping:

| Agent | Provider | Model | Rationale |
|---|---|---|---|
| alpha, beta, gamma, delta | Claude | sonnet (or inherit) | Orchestration, judgment continuity — keep Claude |
| builder (×2), fixer (×2) | Claude | sonnet | Code generation — Claude is tuned here |
| **evaluator (×2)** | **OpenAI** | **gpt-5.4** | Deep review with different lens; 1M context fits spec+code+fixtures |
| **compliance (×2)** | **OpenAI** | **gpt-5.4** | Adversarial integrity — flagship, not mini |
| **auditor (oneshot)** | **OpenAI** | **gpt-5.4-mini** | Cross-cycle pattern synthesis; many small inputs |
| **qa (×2)** | **OpenAI** | **gpt-5.4-mini** | 13 failure-mode personas × volume |
| **redteam (×2)** | **Gemini** | **gemini-3.1-pro-preview** | 11 attack-chain personas — different adversarial training corpus |

Implementation:
- [ ] Extend `manifest.providers` with `claude`, `openai`, `gemini` entries (cli, default_model, fallback)
- [ ] Add `manifest.agentProviders` mapping role → provider
- [ ] New lib module: `scripts/hooks/lib/providers.js` — wraps `execSync` calls to `codex` / `gemini` CLIs
- [ ] Update γ/δ dispatch to read `agentProviders[<role>]` and route accordingly (Claude sub-agent vs CLI call)
- [ ] `/check:environment` verifies `codex` and `gemini` CLIs present if configured
- [ ] Fallback: CLI missing → use `fallback` model (always Claude)
- [ ] Per-agent prompts stay in the .md files (agent gets the same prompt regardless of provider)
- [ ] Response parsing adapter — normalize GPT/Gemini output to match Claude sub-agent JSON shape

Effort: ~6 hours. First post-ship week.

### Token usage optimization (deferred per user directive)

Not a ship blocker. Once cross-provider is live:
- [ ] Track per-agent token usage in events log — category `provider-call`
- [ ] Per-provider cost dashboard (estimate from token counts)
- [ ] Prompt compression for GPT/Gemini — the Claude-tuned prompts are often verbose; condense for cross-provider
- [ ] Cache the "system/identity" portion of review prompts where provider supports it (OpenAI prompt caching, Gemini context caching)
- [ ] Tiered fallback: gpt-5.4 → gpt-5.4-mini → claude if primary times out or rate-limits
- [ ] Per-agent model override via env var (`WARPOS_EVALUATOR_MODEL=gpt-5.4-mini`) for cost-sensitive users

### Missing skills identified in audit
- [ ] `/check:system` — systems audit (scans for every system, diffs manifest)
- [ ] `/check:privacy` — pre-publish scan for personal data (names, session artifacts, learnings, credentials)
- [ ] `/check:install` — verify a fresh install is complete end-to-end
- [ ] `/check:hooks` — hook test harness via synthetic payloads (extends `/hooks:test`)
- [ ] `/warp:doctor` — single-command full diagnostic (runs `health` + `check:*` suite)
- [ ] `/warp:update` — see Installer section above
- [ ] `/warp:uninstall` — clean removal
- [ ] `/agents:list` + `/agents:test` — first-class observability for the agent system
- [ ] `/paths:validate` + `/paths:add` — see Path System above
- [ ] `/linters:run` — unified lint runner (linters are a system per feedback)
- [ ] `/manifest:show`, `/manifest:validate`, `/manifest:migrate`
- [ ] `/docs:catalog` — enumerate reference docs with status

### Existing skill follow-ups
- [ ] `/research:deep` — 728 lines, likely untested, model versions stale. Either validate end-to-end OR deprecate in favor of `/research:simple`
- [ ] `/research:simple` — add synthesis phase (merge reports → SYNTHESIS.md)
- [ ] `/sleep:deep` — operationalize vague phases (1c dedup algorithm, 1e pattern threshold, 4 REM dream templates)
- [ ] `/ui:review` — genericized (no longer hardcodes "consumer product"); add parameterized design-system path support
- [ ] `/retro:code`, `/retro:full` — remove stale "retro directory" manifest.json references; either hard-code `.claude/project/retros/` or make optional
- [ ] `/warp:sync` — add fallback if `../WarpOS/version.json` doesn't exist (git tags / commit hash)
- [ ] `/warp:init` — parameterize GitHub URL (hardcodes `cygaco/WarpOS.git`)

### Namespace reorganization
- [ ] Merge `/retro:context` + `/retro:code` into `/retro:full` as modes (not separate skills)
- [ ] Merge `/fav:list` + `/fav:search` into `/fav` with args
- [ ] Consider moving `/hooks:friction` analysis into `/check:patterns propose`

---

## Phase 3 — Product-as-product

Treat WarpOS itself as a product-in-WarpOS with its own `requirements/05-features/`:
- [ ] Write PRDs for installer, session-lifecycle, paths-resolution, hook-pipeline
- [ ] Spec the Alex agent team as a feature with stories
- [ ] Run `/preflight:run` against WarpOS itself before every push
- [ ] Run `/qa:audit` and `/redteam:full` on WarpOS — catch the hook bugs, privacy leaks, stale refs we currently hunt manually

---

## Phase 4 — Observability & UX

- [ ] `agent-dashboard.js` turned into a real browser UI (currently CLI-style)
- [ ] Skills get a usage counter (how often each is invoked) — informs pruning
- [ ] `/warp:tour` version 2 — interactive walkthrough, not one-shot explainer
- [ ] `USER_GUIDE.md` → split into tutorial + reference

---

## Notes

- All changes must ship to both `consumer-project` and `WarpOS` during co-development. Use `/hooks:sync` pattern (extended to skills too).
- Privacy audit required before every public push. `/check:privacy` should be the gate.
- Main branch must stay shippable at all times. Exploratory work happens on feature branches. (This is §2 of `USER_GUIDE.md` — the #1 newbie trap.)
