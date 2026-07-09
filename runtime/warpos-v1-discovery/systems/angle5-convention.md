# Angle 5 (CONVENTION) — /discover:systems (2026-07-09)

## Convention census

| slug | convention | count | deviations/notes |
|---|---|---|---|
| pretooluse-guards | `scripts/hooks/*-guard.js` | 27 | largest hook family; consistent |
| hook-gates | `scripts/hooks/*-gate.js` | 4 | gauntlet, tracker-completion, beta, authorization |
| hook-watchers/trackers | `*-watcher.js`(1)/`*-tracker.js`(2) | 3 | edit-watcher; session-tracker, skill-invocation-tracker |
| command-namespaces | `.claude/commands/<ns>/<verb>.md` | **47 ns / 229 verbs** | prior "50" count is STALE — 47 namespace dirs on disk |
| agent-specs | `.claude/agents/<dept>/**/*.md` | 73 | clean ADR-0007 dept tree |
| enforcers | `scripts/checks/*.js` (non-test) | 77 | see bite-test gap |
| enforcer bite-tests | `*.test.js`(29) + `test-*.js`(10) | 39 | TWO rival test conventions coexist in one dir |
| enforcers w/ NO bite-test | neither form present | **~43** | largest self-detecting gap: nearly all `warpos-*` checks (staleness, structure-parity, migration-*, layer-diff, version-quorum, install-baseline, path-resolution, roundtrip, promote-coverage), canon-*, mode-*, panel-registry-coverage, planning-principles, turbo-spend, design-system, version-coherence |
| test-naming split | `test-*.js`(69) vs `*.test.js`(61) across scripts/ | 130 | project-wide inconsistency; `test-*` dominates scripts/warpos, `*.test.js` dominates dispatch/checks/hooks |
| runtime one-offs | `runtime/_*.js` | 5 | _ed057/_ed058/_w5-close/_ed065-steer/_ed065-honestred append+note scratch scripts, all untracked (git ??), accreting |
| schema-contracts | `warpos/<name>/v<n>` ids | **53 distinct** | strong. Drift: paths/v4+v5 (migration in flight), framework-manifest/v1+v2; 11 `/v0` ids = never-frozen internal contracts (role-registry, org-map, mode-lifecycle*, *-hook-points, dispatch-contract, manager-principles) |

## Retired-marker files
**NONE.** Repo-wide globs for `*.backup.*`, `*DEPRECATED*`, `*-STALE*`, `*.bak`, `_archive/`, `99-archive/` all returned zero. Hygiene is clean. (Deprecated *skills* exist as in-place alias `.md` files — not marker-named.)

## Root dirs not in paths registry
6 of 17 root dirs have ZERO references anywhere in `framework/paths.registry.json` (source of truth):
- `WarpOS-v1/` — original pre-framework spec bundle; likely intentional archive
- `_guides/` — DEVIATION: /guides:* skills + guides-coverage enforcer are LIVE, literal absent
- `_knowledge/` — DEVIATION: /knowledge:* + knowledge-coverage LIVE, literal absent
- `_planning/` — off-registry
- `migrations/` — NOTABLE: load-bearing (warpos-migration-* enforcers read it), no registry key
- `trackers/` — NOTABLE: the enforced TRACKER system's home, no registry key

Present (sanity): _docs, _requirements, _warpos, framework, runtime, schemas, scripts, tests, _reports, fixtures, patterns.

**Top decay signals:** (1) ~43 enforcers with no bite-test; (2) two unreconciled test-naming conventions repo-wide; (3) migrations/ + trackers/ active but off the path registry despite the paths-token discipline.
