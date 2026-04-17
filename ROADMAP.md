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
