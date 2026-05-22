# PRD — Portfolio Console + /portfolio:* Unification

**Sprint:** `SP-20260521-001`
**Plan Contract:** `PC-20260521-0021`
**Status:** designed
**Documentation scale:** `l`

## Outcome

WarpOS becomes the home-base command console for the user's entire product portfolio. A single unified `/portfolio:*` skill family (10 skills) replaces the awkward `/product:*` vs `/products:*` split. The HOME-dir registry (`~/.warpos/portfolio.json`) lists every product the user manages. Each product lives in its own private GitHub repo as a sibling directory on disk, isolated by `.claude/` per `FRAMEWORK_VS_DOWNSTREAM.md`. The user can `/portfolio:open <slug> --spawn` to launch a fresh Claude Code session in a new terminal window per product, running them in parallel without state collision.

## Context

### Original Request

> "Look at this companycam project, look at this dream teams project, and create a way for these product to basically exist 'inside' warpos, but not be publicly available on our github, but still backed up and version controlled. basically, i want warpos to be the command console from which I build all of my products. btw, dreamteam and the others still need to be accessible to my team, so perhaps side-by-side repos would be good?"

In-conversation directives:
- Unify `/product:*` + `/products:*` into `/portfolio:*`.
- Multi-terminal "port" model — open one product per terminal, run in parallel.

### Current Behavior

- WarpOS canonical 0.8.2, public on `cygaco/WarpOS`.
- 8+ sibling project dirs on disk (aiweb, jobhunter-app, JobHunter, Dashboard, Nexus, Keyword Intelligence, a2a-inspector).
- `/product:*` family today: bootstrap, clone, ponder, import — CWD-bound.
- No portfolio registry. No portfolio skills. No multi-terminal launcher.
- `_docs/briefs/dreamteams/` and `_docs/clones/companycam/` exist on disk, **untracked** (verified via `git ls-files`).

### Desired Behavior

Per the Plan Contract `desired_behavior` field. Summarized: 10 skills under `/portfolio:*`, HOME-dir registry, multi-terminal launcher, gitignored briefs/clones in canonical, dogfooded migration of dreamteams + companycam.

### Beta Directives (durable in `paths.betaEvents`)

- **DEC-001 (privacy):** Gitignore-only fix; no history rewrite (briefs untracked).
- **DEC-002 (registry):** HOME-dir `~/.warpos/portfolio.json`.
- **DEC-003 (gh repo create):** SURFACE the command, never execute it. No `--create-remote` flag.
- **DEC-004 (scope):** Variant B. OPEN_ADR true.
- **DEC-005 (namespace unification):** Approved. Deprecation window = 2 releases. Pre-rename grep-sweep `/product:` literal across all `.md/.json/.js` mandatory per CLAUDE.md §Refactor & Rename Hygiene. Ref-checker wired at delete time.
- **DEC-006 (spawn):** Approved. Active-CWD warning required. Graceful PATH-fallback to `cd <path> && claude` mandatory.

## Requirements

> `R-N` ids; format enforced by `requirement-format-guard.js`.

- `R-1` — **Paths registry expansion.** Add `paths.portfolioRegistry` (→ `~/.warpos/portfolio.json`), `paths.portfolioHome` (→ `~/.warpos`), `paths.briefsRoot` (→ `_docs/briefs/`), `paths.clonesRoot` (→ `_docs/clones/`) to `framework/paths.registry.json`. Propagate to canonical `.claude/paths.json`. Schema bump to `v5` if needed (currently v4).
- `R-2` — **Registry schema + library.** Define `warpos/portfolio-registry/v1` at `schemas/portfolio/registry.schema.json`. Fields per product: `slug` (regex `^[a-z0-9][a-z0-9-]{0,63}$`), `repo_path` (absolute, must exist), `github_url` (optional, https or git://), `warpos_version` (from `framework-installed.json`), `last_synced` (ISO-8601), `role` (enum: `framework|product|fork`), `remote_type` (enum: `github|gitlab|bitbucket`, only `github` implemented). `scripts/portfolio/registry.js` exposes: `load()`, `save()` (atomic), `list()`, `findBySlug(slug)`, `validate(entry)`.
- `R-3` — **`/portfolio:*` skill family (10 skills).** `list`, `register`, `open` (with `--spawn` flag), `new`, `adopt`, `status`, `dispatch`, `sync`, plus the renamed `bootstrap`, `clone`, `ponder`, `import` (which were `/product:*`).
- `R-4` — **Namespace unification.** Rename `.claude/commands/product/{bootstrap,clone,ponder,import}.md` → `.claude/commands/portfolio/`. Migrate `scripts/product/{bootstrap,clone}.js` → `scripts/portfolio/`. Keep thin deprecation aliases at the old paths for **2 releases** (per Beta DEC-005). Aliases print a one-time-per-session banner: `"⚠ /product:<name> is deprecated. Use /portfolio:<name> instead. Aliases removed in v0.10."` Pre-rename grep-sweep mandatory.
- `R-5` — **Multi-terminal launcher.** `scripts/portfolio/spawn.js` detects available terminal: Windows Terminal (`wt -d <path> claude`) preferred; fall back to `start cmd /k 'cd /d <path> && claude'` on Windows; iTerm or Terminal.app on macOS; gnome-terminal or xterm on Linux. **Graceful degradation mandatory** (Beta DEC-006): if no terminal binary on PATH, print `cd <path> && claude` as a copyable command. **Active-CWD warning required:** if `<slug>.repo_path` equals `process.cwd()`, print warning before spawning.
- `R-6` — **Cross-repo dispatch.** `/portfolio:dispatch <slug> <skill> [args]` spawns a subprocess with `CLAUDE_PROJECT_DIR` set to the target's `repo_path`, invokes the skill via the target's `claude` binary. **Hard non-goal:** never retarget `CLAUDE_PROJECT_DIR` mid-session inside an existing Claude Code instance.
- `R-7` — **Privacy boundary.** Add `_docs/briefs/` and `_docs/clones/` to canonical `.gitignore`. Verify no commits exist for these paths (pre-merge guard).
- `R-8` — **Scaffolding templates.** `framework/templates/portfolio/{README.md.tmpl, .gitignore.tmpl, .claude/paths.json.tmpl}` — minimal scaffold for new private products. Used by `/portfolio:new`.
- `R-9` — **Dogfooded migration.** `_docs/briefs/dreamteams/` and `_docs/clones/companycam/` migrate to private sibling repos via `/portfolio:adopt` as the first real runs. Migration produces a status report listing what was moved and what remains.
- `R-10` — **`/portfolio:new` execution boundary** *(REVISED 2026-05-21T21:18Z per DEC-008 user override of Beta DEC-003)*. Scaffolds local sibling repo + runs `/warp:setup` against it + **executes** `gh repo create <slug> --private --source=. --remote=origin --push` to create the private GitHub repo and push initial commits. No interactive confirm (user chose option B over option C). Always `--private`; never `--public` under any flag. Slug regex IN-1 is enforced before the gh invocation as defense-in-depth against shell-metacharacter injection. Failure modes: (a) gh not authenticated → surface clear error + leave local repo intact (don't rollback the local scaffold); (b) repo name already exists on user's account → check via `gh repo view <slug>` first; if private + owned by user, treat as success (idempotent reuse); if public OR owned by another user, halt with explicit error.
- `R-11` — **Status dashboard.** `/portfolio:status` reports per registered product: WarpOS version (from `framework-installed.json`), last git commit (short SHA + date), dirty-file count, current sprint (from `paths.sprintCurrent` if present), GitHub remote reachability (via `gh repo view --json` if `github_url` set). Output as a single ASCII table.
- `R-12` — **Documentation.** Add `USER_GUIDE.md` sections: "Working a portfolio" + "Multi-terminal parallel products". Update `/warp:tour` to mention `/portfolio:*`. Append RELEASES.md entry. Cosmetic title updates for in-flight sprints SP-20260520-001 (`/product:clone` → `/portfolio:clone`) and SP-20260520-002 (`/product:import` → `/portfolio:import`).

## Non-Goals

- Public WarpOS does NOT learn about specific private products.
- No hosted dashboard or web UI.
- No new external service dependency beyond `gh`, `wt`, `git`, `node`, `claude`.
- Not building dreamteams or any product feature — infra layer only.
- Not changing the WarpOS canonical release pipeline. `/portfolio:sync` wraps `/warp:update`.
- Not formalizing team-collaborator management (auth, roles, permissions).
- Not migrating other sibling repos (aiweb, jobhunter-app, etc.) automatically. They opt in via `/portfolio:register`.
- Not retargeting `CLAUDE_PROJECT_DIR` mid-session inside a single Claude Code instance.
- Not deleting `/product:*` skills immediately — 2-release deprecation window.
- Not creating `--public` GitHub repos under any flag (R-10 hardcodes `--private`).
- Not creating GitHub repos under organizations other than the authenticated user's account in v1.

## Affected Surfaces

| Surface | Evidence Level | Notes |
|---|---|---|
| `.claude/paths.json` | verified_from_repo | 4 new keys: portfolioRegistry, portfolioHome, briefsRoot, clonesRoot |
| `framework/paths.registry.json` | verified_from_repo | Same 4 keys propagated |
| `~/.warpos/portfolio.json` | assumed_from_request | Net-new HOME-dir registry; created lazily |
| `.claude/commands/portfolio/` | verified_from_repo | 10 new skill files |
| `.claude/commands/product/` | verified_from_repo | 4 files become thin deprecation aliases |
| `scripts/portfolio/` | verified_from_repo | registry.js, spawn.js, dispatch.js, status.js, sync.js, new.js, adopt.js, from-brief.js |
| `scripts/product/` | verified_from_repo | bootstrap.js + clone.js migrate; thin re-exports stay |
| `schemas/portfolio/registry.schema.json` | verified_from_repo | net-new |
| `framework/templates/portfolio/` | verified_from_repo | net-new scaffold |
| `.gitignore` (canonical) | verified_from_repo | add `_docs/briefs/`, `_docs/clones/` |
| `USER_GUIDE.md` | verified_from_repo | 2 new sections |
| `.claude/commands/warp/tour.md` | verified_from_repo | mention `/portfolio:*` |
| `RELEASES.md` | verified_from_repo | sprint entry |
| Active sprints SP-20260520-001 + SP-20260520-002 | verified_from_repo | cosmetic title updates |

## External Service Dependencies

- **gh CLI** — user-executed only (per Beta DEC-003). `/portfolio:new` surfaces the command; user runs.
- **Windows Terminal (`wt`)** — optional. `/portfolio:open --spawn` preferred target on Windows.
- **iTerm / Terminal.app** — optional. macOS `--spawn` target.
- **gnome-terminal / xterm** — optional. Linux `--spawn` target.

All optional. Graceful degradation to copyable `cd <path> && claude` command if none available.

See `paths.sprintExternalServices/` for full ESD records.

## Approval Boundaries

Per Plan Contract `approval_boundaries`:
- `git push origin main` — Ask first.
- Rename of `/product:*` skill files — confirm before commit.
- Move of `_docs/briefs/dreamteams/` + `_docs/clones/companycam/` — confirm before move.
- New paths keys — schema-level, propagates via `/warp:update`.

## Sprint Goal Verification

`goal_verification` block: absent. This sprint is architecture/skills work; no executable regression fixture required. QA coverage is the sprint-scope smoke tests in `qa-plan.md`. ACs use `verified_by: not_applicable — <justification>` form per SP-20260518-007.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260521-0021.yaml`
- Decision ledger: `.claude/project/decisions/decision-ledger.jsonl` (DEC-sp-20260521-001-001..006 + 2 addenda)
- Beta events: `.claude/agents/00-alex/.system/beta/events.jsonl` (EVT-sp-20260521-001-beta-001..006)
- High-level stories: `high-level-stories.md`
- Granular stories: `granular-stories.md`
- COPY: `copy.md`
- INPUTS: `inputs.md`
- TRACE: `trace.md`
- Acceptance criteria: `acceptance-criteria.md`
- QA plan: `qa-plan.md`
- Redteam plan: `redteam-plan.md`
- Release plan: `release-plan.md`
