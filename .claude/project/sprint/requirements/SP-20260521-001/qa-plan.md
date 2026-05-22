# QA Plan — Portfolio Console + /portfolio:* Unification

**Sprint:** `SP-20260521-001`

Sprint-scope QA gate. Every ticket's QA section references one or more of these.

## QA-1 — Paths registry expansion (S-1)
- `node -e "console.log(require('./.claude/paths.json').portfolioRegistry)"` returns non-empty path.
- `framework/paths.registry.json` validates against the registry schema.
- Fresh `/warp:update` against a tmp consumer adds the 4 new keys.

## QA-2 — Registry schema + library (S-2)
- Schema validates empty + 3-product fixtures.
- `registry.js` `load()` returns empty-doc on missing file (no throw).
- Atomic save: induce SIGKILL during `save()`, verify prior content intact.
- `findBySlug` returns null for unknown slug.

## QA-3 — `/portfolio:list / :register / :open` (S-3)
- Empty `/portfolio:list` prints C-3.
- `/portfolio:register testprod ./testprod-dir` then `/portfolio:list` shows the entry.
- `/portfolio:register testprod ./testprod-dir` twice → second is no-op (idempotent).
- `/portfolio:register badname-WITH-CAPS .` → exit 2 with normalized suggestion.
- `/portfolio:open testprod` prints `cd <path>` hint; `/portfolio:open nosuch` prints C-16.

## QA-4 — `/portfolio:open --spawn` (S-4)
- Spawn from WarpOS terminal into a registered sibling: a new Windows Terminal tab opens with `claude` running there (manual visual check).
- Spawn where `repo_path == process.cwd()`: C-6 warning printed, no spawn.
- Spawn with `--force` after the warning: spawn proceeds despite same-CWD.
- Mock-empty PATH: C-7 fallback printed, exit 0.
- TR-6 fires with correct `terminal_used` value for each path.

## QA-5 — `/portfolio:new + :adopt + templates` (S-5)
- `/portfolio:new newproduct` from canonical WarpOS: sibling dir created, scaffold copied, `/warp:setup` runs, slug registered.
- After scaffold completes, C-9 (gh repo create surface) is printed verbatim.
- `which gh` is monitored: no `gh repo create` subprocess fires.
- `/portfolio:adopt dreamteams` against the in-place `_docs/briefs/dreamteams/`: brief files move to new sibling, registered.
- Reserved-name collision: `/portfolio:new list` → exit 2.

## QA-6 — `/portfolio:status` (S-6)
- 3-product registry → 3-row table matching C-11.
- One product's `repo_path` deleted → row shows stale; `stale_count` in TR-9 = 1.
- `which gh` returns empty → REMOTE column shows "?" for all products, exit 0.
- One product is dirty → DIRTY column non-zero.

## QA-7 — `/portfolio:dispatch` (S-7)
- Register a sibling. `/portfolio:dispatch testprod /check:requirements` → child process runs in `<testprod>.repo_path`, not canonical.
- Verify parent's `CLAUDE_PROJECT_DIR` unchanged after dispatch returns.
- TR-10 captures exit code + duration.
- Skill that doesn't exist in target: child prints its own not-found, parent exits with child's code.

## QA-8 — `/portfolio:sync` (S-8)
- 2 registered products, both at warpos 0.8.x with canonical at 0.8.x: sync runs sequentially, both updated.
- Induce a mid-sync failure: subsequent products still attempted, summary captures the failure.

## QA-9 — Namespace rename + aliases (S-9)
- Pre-rename grep-sweep: run `grep -r "/product:" --include="*.md" --include="*.json" --include="*.js" .` and verify every hit is in the rename set, in a documented deprecation block, OR allow-listed (Beta DEC-005 addendum).
- After rename: `/product:bootstrap` prints C-14 once-per-session, then forwards.
- Second invocation of `/product:bootstrap` in same session does NOT re-print C-14.
- New session re-prints C-14 once.
- `git log --diff-filter=D --name-only` paired against additions confirms every old skill file has a new home.

## QA-10 — Scripts migration (S-10)
- `node scripts/portfolio/bootstrap.js --help` prints bootstrap help.
- `node scripts/product/bootstrap.js --help` prints the same help (thin re-export).
- `require.cache` inspection: re-export resolves to the new file.

## QA-11 — Gitignore + dogfooded migration (S-11)
- `.gitignore` contains `_docs/briefs/` and `_docs/clones/` after sprint.
- `git status` shows neither `_docs/briefs/dreamteams/` nor `_docs/clones/companycam/` after migration.
- Registry contains both slugs with valid `repo_path`.
- The dogfood migration produced a status report file under `paths.sprintRalph/SP-20260521-001/` (or equivalent runtime location).

## QA-12 — Documentation + cosmetic updates (S-12)
- `grep -n "Working a portfolio" USER_GUIDE.md` returns ≥1.
- `grep -n "Multi-terminal parallel products" USER_GUIDE.md` returns ≥1.
- `grep -n "/portfolio:" .claude/commands/warp/tour.md` returns ≥1.
- `grep -n "/portfolio:clone" .claude/project/sprint/active-sprints.yaml` returns ≥1.
- `grep -n "/portfolio:import" .claude/project/sprint/active-sprints.yaml` returns ≥1.
- `tail -50 RELEASES.md | grep -c "SP-20260521-001"` ≥ 1.

## Cross-cutting

- `/check:all` runs green after sprint completion.
- `node scripts/sprint/check-ac-coverage.js --sprint SP-20260521-001` reports 100% AC coverage (each AC links to a verified_by line, even if `not_applicable`).
- No new entries in `/check:warpos-tracked-transients` (no transient state accidentally committed).
- `node scripts/sprint/routing.js coverage --sprint SP-20260521-001` reports green across plan/design/execute phases.
