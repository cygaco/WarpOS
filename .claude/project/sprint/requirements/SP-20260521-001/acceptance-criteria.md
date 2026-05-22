# Acceptance Criteria — Portfolio Console + /portfolio:* Unification

**Sprint:** `SP-20260521-001`
**PRD:** `prd.md`

> Plan Contract's `goal_verification` block is ABSENT — this sprint ships skills + registry + scaffolding, no executable regression fixture. QA coverage = sprint-scope smoke tests in `qa-plan.md`. All `verified_by:` use the `not_applicable` form per SP-20260518-007.

## S-1 — Portfolio paths keys

- **AC-1.1:** Given canonical WarpOS at HEAD, when `node -e "console.log(require('./.claude/paths.json').portfolioRegistry)"` runs, then output is non-empty and resolves to `~/.warpos/portfolio.json` (or `%USERPROFILE%\.warpos\portfolio.json` on Windows).
  verified_by: not_applicable — sprint-scope smoke (qa-plan.md §QA-1).
- **AC-1.2:** Given `framework/paths.registry.json`, when the 4 new keys are inspected, then each has a `desc` field, an `owner: framework` field, and a `kind: data` (or appropriate) field.
  verified_by: not_applicable — qa-plan.md §QA-1.
- **AC-1.3:** Given a fresh `/warp:update` apply against a sibling consumer project, when the apply completes, then the consumer's `.claude/paths.json` includes the 4 new keys.
  verified_by: not_applicable — qa-plan.md §QA-1.

## S-2 — Registry schema + library

- **AC-2.1:** Given `schemas/portfolio/registry.schema.json`, when validated against an empty registry document `{"schema": "warpos/portfolio-registry/v1", "products": []}`, then validation passes.
  verified_by: not_applicable — qa-plan.md §QA-2.
- **AC-2.2:** Given `scripts/portfolio/registry.js`, when `load()` is called and the registry does not exist, then it returns the empty-document shape (no error).
  verified_by: not_applicable — qa-plan.md §QA-2.
- **AC-2.3:** Given a registry with N products, when `save()` is called, then write is atomic (write-temp + rename) and a SIGKILL mid-write leaves the prior registry intact.
  verified_by: not_applicable — qa-plan.md §QA-2.

## S-3 — `/portfolio:list / :register / :open` (no --spawn yet)

- **AC-3.1:** Given an empty registry, when `/portfolio:list` runs, then output is C-3 ("No products registered yet…").
  verified_by: not_applicable — qa-plan.md §QA-3.
- **AC-3.2:** Given a valid `<slug> <path>`, when `/portfolio:register` is invoked, then registry has a new entry AND a `portfolio_register` event lands in `paths.eventsFile` (TR-4).
  verified_by: not_applicable — qa-plan.md §QA-3.
- **AC-3.3:** Given a registered slug, when `/portfolio:open <slug>` runs (no `--spawn`), then output is the absolute path + `cd <path>` hint.
  verified_by: not_applicable — qa-plan.md §QA-3.
- **AC-3.4:** Given an unregistered slug, when `/portfolio:open <slug>` runs, then output is C-16 ("No product registered as…").
  verified_by: not_applicable — qa-plan.md §QA-3.

## S-4 — `/portfolio:open --spawn` + `spawn.js`

- **AC-4.1:** Given a registered slug whose `repo_path != process.cwd()`, when `/portfolio:open <slug> --spawn` runs on Windows with `wt` on PATH, then `wt -d <path> claude` is invoked AND TR-6 fires with `terminal_used: "wt"`.
  verified_by: not_applicable — qa-plan.md §QA-4.
- **AC-4.2:** Given a registered slug whose `repo_path == process.cwd()`, when `/portfolio:open <slug> --spawn` runs, then C-6 (active-CWD warning) is printed AND `wt` is NOT invoked unless `--force` is also passed (Beta DEC-006 addendum).
  verified_by: not_applicable — qa-plan.md §QA-4.
- **AC-4.3:** Given no terminal binary on PATH, when `/portfolio:open <slug> --spawn` runs, then C-7 (copyable fallback) is printed AND exit code is 0 (graceful degradation per Beta DEC-006 addendum — NOT an error).
  verified_by: not_applicable — qa-plan.md §QA-4.

## S-5 — `/portfolio:new` + `/portfolio:adopt` + templates

- **AC-5.1:** Given an unused slug, when `/portfolio:new <slug>` runs, then sibling dir at `<workspace>/<slug>/` is created with the scaffold from `framework/templates/portfolio/`, `/warp:setup` runs successfully, and the slug is registered.
  verified_by: not_applicable — qa-plan.md §QA-5.
- **AC-5.2:** Given a completed `/portfolio:new`, when output is inspected, then C-9 (the `gh repo create` surface) appears verbatim and `gh repo create` is NOT executed by `/portfolio:new` itself (Beta DEC-003 / autonomy red line).
  verified_by: not_applicable — qa-plan.md §QA-5.
- **AC-5.3:** Given an existing `_docs/briefs/<slug>/` or `_docs/clones/<slug>/`, when `/portfolio:adopt <slug>` runs, then the brief files are moved (not copied) into the new sibling repo's working tree AND TR-8 fires with `files_moved_count > 0`.
  verified_by: not_applicable — qa-plan.md §QA-5.
- **AC-5.4:** Given a slug colliding with a reserved skill name (e.g. `list`, `register`, `open`), when `/portfolio:new <slug>` runs, then exit 2 with the reserved-name error (IN-1).
  verified_by: not_applicable — qa-plan.md §QA-5.

## S-6 — `/portfolio:status`

- **AC-6.1:** Given 3 registered products, when `/portfolio:status` runs, then output is a 3-row ASCII table matching the C-11 format.
  verified_by: not_applicable — qa-plan.md §QA-6.
- **AC-6.2:** Given a registered product whose `repo_path` no longer exists on disk, when `/portfolio:status` runs, then the product's row shows a stale indicator and `stale_count` in TR-9 is incremented.
  verified_by: not_applicable — qa-plan.md §QA-6.
- **AC-6.3:** Given `gh` is not on PATH, when `/portfolio:status` runs, then the REMOTE column shows "?" for every product (best-effort skip, not an error).
  verified_by: not_applicable — qa-plan.md §QA-6.

## S-7 — `/portfolio:dispatch`

- **AC-7.1:** Given a registered product, when `/portfolio:dispatch <slug> /check:requirements` runs from the WarpOS terminal, then the skill runs against `<slug>`'s working tree (`CLAUDE_PROJECT_DIR` = `<slug>.repo_path`), not against canonical WarpOS.
  verified_by: not_applicable — qa-plan.md §QA-7.
- **AC-7.2:** Given any dispatch invocation, when the subprocess exits, then TR-10 captures the exit code + duration AND the parent WarpOS Claude session retains its original `CLAUDE_PROJECT_DIR` (mid-session retarget non-goal honored).
  verified_by: not_applicable — qa-plan.md §QA-7.

## S-8 — `/portfolio:sync`

- **AC-8.1:** Given 2 registered products on WarpOS 0.8.1 with canonical at 0.8.2, when `/portfolio:sync` runs, then both products are updated to 0.8.2 in sequence AND a final summary table reports 2 successes.
  verified_by: not_applicable — qa-plan.md §QA-8.
- **AC-8.2:** Given a product whose `/warp:update` fails mid-sync, when sync continues, then the failure is captured in the summary and subsequent products are still synced (no fail-fast).
  verified_by: not_applicable — qa-plan.md §QA-8.

## S-9 — Rename `/product:*` → `/portfolio:*` + deprecation aliases

- **AC-9.1:** Given the pre-rename grep-sweep step, when `grep -r "/product:" --include="*.md" --include="*.json" --include="*.js" .` runs, then EVERY hit is either (a) in a file marked for rename, (b) in a documented deprecation context, or (c) explicitly allow-listed with `<!-- portfolio-rename-allowed -->` (Beta DEC-005 addendum mandate).
  verified_by: not_applicable — qa-plan.md §QA-9.
- **AC-9.2:** Given the rename is complete, when `/product:bootstrap` is invoked, then the alias prints C-14 (deprecation banner) once-per-session AND forwards to `/portfolio:bootstrap`.
  verified_by: not_applicable — qa-plan.md §QA-9.
- **AC-9.3:** Given the rename is complete, when `git log --diff-filter=D --name-only` is grepped, then every old `.claude/commands/product/<name>.md` deletion has a corresponding `.claude/commands/portfolio/<name>.md` addition.
  verified_by: not_applicable — qa-plan.md §QA-9.

## S-10 — Migrate `scripts/product/*` → `scripts/portfolio/`

- **AC-10.1:** Given the script migration is complete, when `node scripts/portfolio/bootstrap.js --help` runs, then it prints the bootstrap help.
  verified_by: not_applicable — qa-plan.md §QA-10.
- **AC-10.2:** Given the migration is complete, when `node scripts/product/bootstrap.js --help` runs, then it prints the same help (thin re-export works).
  verified_by: not_applicable — qa-plan.md §QA-10.

## S-11 — Gitignore + dogfooded migration

- **AC-11.1:** Given canonical WarpOS HEAD after this sprint, when `.gitignore` is inspected, then `_docs/briefs/` and `_docs/clones/` are present.
  verified_by: not_applicable — qa-plan.md §QA-11.
- **AC-11.2:** Given the dogfood migration ran, when `git status` is checked in canonical, then `_docs/briefs/dreamteams/` and `_docs/clones/companycam/` are no longer in the working tree.
  verified_by: not_applicable — qa-plan.md §QA-11.
- **AC-11.3:** Given the dogfood migration ran, when `~/.warpos/portfolio.json` is read, then `dreamteams` and `companycam` are both registered with valid `repo_path` entries pointing at their new sibling locations.
  verified_by: not_applicable — qa-plan.md §QA-11.

## S-12 — Documentation + cosmetic title updates

- **AC-12.1:** Given USER_GUIDE.md after this sprint, when grepped, then sections titled "Working a portfolio" and "Multi-terminal parallel products" both exist.
  verified_by: not_applicable — qa-plan.md §QA-12.
- **AC-12.2:** Given `.claude/commands/warp/tour.md` after this sprint, when grepped for `/portfolio:`, then at least one occurrence exists.
  verified_by: not_applicable — qa-plan.md §QA-12.
- **AC-12.3:** Given `active-sprints.yaml` after this sprint, when grepped, then SP-20260520-001 and SP-20260520-002 titles reference `/portfolio:clone` and `/portfolio:import` respectively.
  verified_by: not_applicable — qa-plan.md §QA-12.
- **AC-12.4:** Given RELEASES.md after this sprint, when tailed, then a SP-20260521-001 entry exists with the sprint summary.
  verified_by: not_applicable — qa-plan.md §QA-12.
