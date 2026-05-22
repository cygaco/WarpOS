# Granular Stories — Portfolio Console + /portfolio:* Unification

**Sprint:** `SP-20260521-001`
**High-level stories:** `high-level-stories.md`

> `S-N` ids enforced by `requirement-format-guard.js`. Each granular maps to ~1 ticket.

## S-1 — Add portfolio paths keys + propagate

Add `paths.portfolioRegistry`, `paths.portfolioHome`, `paths.briefsRoot`, `paths.clonesRoot` to `framework/paths.registry.json` and propagate to canonical `.claude/paths.json`. Bump path schema version if needed.

Linked: H-1, R-1
COPY: C-1
INPUTS: IN-1
TRACE: TR-1

## S-2 — Registry schema + library

Define `warpos/portfolio-registry/v1` at `schemas/portfolio/registry.schema.json`. Build `scripts/portfolio/registry.js` exposing `load`, `save` (atomic write to `paths.portfolioRegistry`), `list`, `findBySlug`, `validate`.

Linked: H-1, R-2
COPY: C-2
INPUTS: IN-2
TRACE: TR-2

## S-3 — `/portfolio:list`, `/portfolio:register`, `/portfolio:open` (no --spawn yet)

Implement the registry-touching skills: `list` prints the registry pretty; `register <slug> <path> [<github_url>]` appends idempotent; `open <slug>` without `--spawn` prints the absolute path + a `cd` hint.

Linked: H-1, H-5, R-3
COPY: C-3, C-4, C-5
INPUTS: IN-1, IN-3, IN-4
TRACE: TR-3, TR-4, TR-5

## S-4 — `/portfolio:open --spawn` + `scripts/portfolio/spawn.js`

Implement the multi-terminal launcher. Detect Windows Terminal first (`where wt`), fall back to `start cmd` / `start powershell` on Windows; iTerm or Terminal.app on macOS; gnome-terminal or xterm on Linux. **Beta DEC-006 addendum requirements:** print active-CWD warning if `<slug>.repo_path == process.cwd()`; on any binary missing from PATH, print `cd <path> && claude` as a copyable fallback.

Linked: H-2, R-5
COPY: C-6, C-7
INPUTS: IN-3
TRACE: TR-6

## S-5 — `/portfolio:new` + `/portfolio:adopt` + scaffold templates

Build `framework/templates/portfolio/{README.md.tmpl, .gitignore.tmpl, .claude/paths.json.tmpl}`. Implement `/portfolio:new <slug> [--from-brief <existing-slug>]` — scaffold local sibling repo, copy templates, run `/warp:setup`, optionally consume an existing brief. **Beta DEC-003 requirement:** surface `gh repo create <slug> --private --source=. --remote=origin --push` and halt. Never execute. Implement `/portfolio:adopt <slug>` as a thin wrapper that calls `/portfolio:new --from-brief <slug>`.

Linked: H-3, H-4, H-8, R-8, R-9, R-10
COPY: C-8, C-9, C-10
INPUTS: IN-3, IN-4, IN-5
TRACE: TR-7, TR-8

## S-6 — `/portfolio:status`

Implement the portfolio dashboard. For each registered product: read `framework-installed.json` for WarpOS version; `git log -1 --format='%h %ad'` for last commit; `git status --porcelain | wc -l` for dirty-file count; read `paths.sprintCurrent` if present; `gh repo view --json url` for GitHub remote reachability (best-effort, skip if `gh` absent). Output a single ASCII table.

Linked: H-6, R-11
COPY: C-11
INPUTS: IN-3
TRACE: TR-9

## S-7 — `/portfolio:dispatch`

Implement cross-repo skill dispatch. Resolve `<slug>` from registry, spawn a subprocess with `CLAUDE_PROJECT_DIR=<repo_path>`, invoke `claude -p '/<skill> <args>'` (or the equivalent). Capture stdout/stderr, surface to the WarpOS terminal. Hard non-goal: never retarget the current Claude session — always a new subprocess.

Linked: H-5, R-6
COPY: C-12
INPUTS: IN-3, IN-6
TRACE: TR-10

## S-8 — `/portfolio:sync`

Implement portfolio-wide `/warp:update`. Iterate the registry, for each product run `node ../WarpOS/scripts/warpos/update.js --target <repo_path>` sequentially. Aggregate status into a final summary table. Sequential (not parallel) per Plan Contract non-blocking-question — avoids gh rate-limit risk.

Linked: H-1, R-3
COPY: C-13
INPUTS: (none beyond registry)
TRACE: TR-11

## S-9 — Rename `/product:*` → `/portfolio:*` + deprecation aliases

**Beta DEC-005 requires:** before rename ticket commits, grep-sweep `/product:` literal across all `.md/.json/.js` in the repo per CLAUDE.md §Refactor & Rename Hygiene. Then move `.claude/commands/product/{bootstrap,clone,ponder,import}.md` → `.claude/commands/portfolio/`. Leave thin deprecation aliases at the old paths that print a one-time-per-session banner and forward to the new skill. Aliases live 2 releases (until v0.10) per Beta directive.

Linked: H-1, R-4
COPY: C-14
INPUTS: (none)
TRACE: TR-12

## S-10 — Migrate `scripts/product/{bootstrap,clone}.js` → `scripts/portfolio/`

Move the underlying scripts to the new directory. Leave thin re-exports in `scripts/product/` for one release (`module.exports = require('../portfolio/bootstrap')`) so any external consumer doesn't break.

Linked: H-1, R-4
COPY: (none)
INPUTS: (none)
TRACE: TR-13

## S-11 — Gitignore + dogfooded migration of dreamteams + companycam

Add `_docs/briefs/` and `_docs/clones/` to canonical `.gitignore`. Run `/portfolio:adopt dreamteams` against the existing brief; run `/portfolio:adopt companycam` against the existing clone. These are the first real-world dogfood runs. Each produces a status report showing what was migrated and what remained in place.

Linked: H-4, H-7, R-7, R-9
COPY: C-15
INPUTS: IN-3
TRACE: TR-14

## S-12 — Documentation + cosmetic title updates

Write two new `USER_GUIDE.md` sections: "Working a portfolio" + "Multi-terminal parallel products". Update `/warp:tour` skill body to mention `/portfolio:*`. Update SP-20260520-001 + SP-20260520-002 titles in `active-sprints.yaml` (cosmetic: `/product:clone` → `/portfolio:clone`, `/product:import` → `/portfolio:import`). Append a RELEASES.md entry for this sprint.

Linked: H-1, R-12
COPY: (none)
INPUTS: (none)
TRACE: (none)
