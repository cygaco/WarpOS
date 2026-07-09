# Skills Library — Discovery Report (disc-skills, 2026-07-09)

## Census (real counts)

- **231** skill `.md` files under `.claude/commands/`. **50 namespaces** + **2 top-level** (`turbo.md`, `report.md`).
- Largest: **scan 53**, warp 14, session 11, maps 10, epic 10, sprint 8, portfolio 8, growth 8, roadmap 6, paths 6.
- **Deprecated aliases: 7** — `check/all`, `check/framework-purity`, `check/framework-views-fresh`, `check/install` (check:→scan: rename SP-20260528-001), `commit/both`→`commit:land`, `turbo.md`→`session:turbo`, `warp/sync`→`warp:update`. All still live files.
- **164/231 (71%)** reference a `node scripts/*.js` (thin-wrapper candidates). **67** are procedure-in-prose.
- Frontmatter (`scripts/dispatch/frontmatter.js`, hand-rolled YAML): `description` on **all 231** (only universal field); `user-invocable` 100, `namespace`/`reads` 30, `writes` 24, `tags` 18. Catalog: `scripts/generate-skill-catalog.js` (excludes `user-invocable:false`).

## Critical-15 logic location

| Skill | Real logic in | Verdict |
|---|---|---|
| sprint:full | `scripts/sprint/full.js` (1987 ln, `#HARD_CEILINGS`, Ralph loop) | **Script** — portable engine; md = contract |
| sprint:execute/plan/design | `scripts/sprint/*` + `epsilon-runtime.js` | **Script** |
| mode:sprint / mode:adhoc | `scripts/mode-set.js`, `epsilon-runtime.js`, `turbo/apply.js` | **Script** state; **prose** team-doctrine |
| session:end | `trackers/validate.js`, `generate-framework-manifest.js`, `warpos/manifest/build.js` | **Mostly script** |
| session:resume | `trackers/validate.js`, `turbo/apply.js` | Thin; **prose** re-establishes mode/team |
| session:checkpoint | none (35 ln) | **Prose** (harness-locked) |
| scan:full | **NO node entrypoint** — md fans 53 checks via Agent tool (`scan/full.md:25`) | **Prose orchestration; harness-locked** |
| warp:release | `warpos/release-gates.js`, `release-build.js`, `release-canonical.js` | **Script** |
| commit:land | **none** | **Pure prose** git flow — helm-locked |
| scan:references | `scripts/hooks/ref-checker.js` | **Script** |
| scan:skill-hook-coverage | `scripts/checks/skill-hook-coverage.js` | **Script** |
| skills:cleanup | `scripts/hooks/skill-counter.js` (partial) | **Prose-heavy** audit |
| skills:create | `scripts/path-lint.js` (validation only) | **Prose** authoring |

## Rot findings

- **8 apparent broken script refs — all false positives** (verified): `scripts/foo.js`, `hook-manifest.js`, `hook-name.js`, `package.js` are illustrative placeholders in prose; karpathy's `prepare.js`/`score.js` are per-run generated into `$KARPATHY_BASE`, not committed. **No skill references a missing committed script** (433 refs checked).
- **`epic/*` is 80% vaporware**: 8 of 10 (`acceptance, close, link, repair, review, split, start, status`) carry "Designed; build deferred" — cataloged, no impl. Only `epic:plan`/`epic:fold` are real. Dead weight.
- **`scan/system.md`** is the only scan skill with no backing check (1 of 53) — prose inventory.
- **Namespace overlap**: `check:*` (4, all deprecated) fully duplicates `scan:*`; `panel:*`/`admin:*`/`cockpit:*` are thin forwarders to the same GUI servers; `turbo`≡`session:turbo`; `warp:sync`≡`warp:update`.

## Skills-as-enforcers

- **The scan namespace IS the enforcement suite**: **52 of 53** scan skills are one-line wrappers over standalone `scripts/checks/*.js` that exit 0/1/2 and **run headless today** (`node scripts/checks/X.js`). These are **MECH-NEUTRAL / helm-portable** — a GPT helm shells out to them unchanged.
- **The harness-locked layer is `scan:full` orchestration itself**: `scan/full.md:25` fans out via the Agent tool (or `claude -p`) and merges sub-reports in prose. There is **no `run-all-scans.js` entrypoint** — `scripts/checks/scan-coverage.js` only audits *delegation coverage* (UNCOVERED/DANGLING), it does not run the suite. So **checks survive a non-Claude helm; the parallel fan-out + merge does not.**
- Enforcement fraction: the gates are **MECH-NEUTRAL**; their *dispatch* is **MECH-CLAUDE**. Nearly the whole scan suite's value is recoverable with one runner script.

## Rebuild needs (prioritized)

1. **Build `scripts/scan/run-all.js`** — node runner that executes the 52 backed checks (honoring `scan-coverage.allowlist.json` + tier list) and merges to one report. Converts the entire scan suite MECH-CLAUDE→MECH-NEUTRAL. Highest leverage; `scan:full.md` becomes a thin wrapper. **(a) node CLI + thin skill.**
2. **Promote to node CLIs (skill=thin wrapper):** `commit:land`, `session:checkpoint`, `session:resume` — currently prose git/state flows a GPT helm can't run reliably. **(a).**
3. **Delete/collapse:** the 4 deprecated `check:*` aliases, `turbo.md`, `warp:sync`, and the 8 deferred `epic/*` vaporware skills. **(c) delete.**
4. **Pack candidates** (procedure-in-prose, keep as helm-readable docs): `skills:create/cleanup/edit`, `sprint:*`/`mode:*` doctrine bodies, `bootstrap:*`, `qa:audit`, `redteam:*`. Engines are scripts; the prose is genuine procedure. **(b) pack contents.**
5. **Frontmatter debt:** only `description` is universal (`reads`/`writes` on 24-30). A machine-routable rebuild should make `namespace`/`reads`/`writes`/`user-invocable` mandatory — parser already supports it; enforcement absent.

Load-bearing to carry: **sprint:full + epsilon-runtime, warp:release, the 52 scan checks, trackers/validate, session:end manifest chain**. Dead weight: **deferred epic/*, deprecated aliases, prose-only GUI forwarders.**
