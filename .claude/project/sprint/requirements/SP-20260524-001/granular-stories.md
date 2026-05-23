<!-- requirement-format-legacy -->
# Granular Stories — Install fixture CI matrix — 5-scenario regression test suite for /warp:setup + /warp:update

**Sprint:** `SP-20260524-001`
**High-level stories:** `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260524-001\high-level-stories.md`

> Granular stories use the `S-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`. Each granular story
> should produce roughly one ticket during `/sprint:design`.

## S-1 — Scaffold scripts/warpos/test-install-matrix.js with fixture lifecycle (create, run, assert, cleanup) primitives

**As** the user
**I want** Scaffold scripts/warpos/test-install-matrix.js with fixture lifecycle (create, run, assert, cleanup) primitives
**So that** Future install-reliability work — per-file status reporting (added/repaired/unchanged/conflict), versioned migrations with userModified tracking, release-build.js refusing stale manifests, .claude/manifest.json always-present + 4 hardcoded-caller cleanup — can land with confidence because the matrix catches regressions in <60 seconds. Maintainer stops having to mentally simulate 5 install scenarios for every framework-side change. Downstream products updating via capsule trust the install pipeline more.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-1`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-2 — Define scenario 1 (clean install): create empty fixture project, run /warp:setup, assert all framework files present + manifest honest + settings.json --check clean

**As** the user
**I want** Define scenario 1 (clean install): create empty fixture project, run /warp:setup, assert all framework files present + manifest honest + settings.json --check clean
**So that** Future install-reliability work — per-file status reporting (added/repaired/unchanged/conflict), versioned migrations with userModified tracking, release-build.js refusing stale manifests, .claude/manifest.json always-present + 4 hardcoded-caller cleanup — can land with confidence because the matrix catches regressions in <60 seconds. Maintainer stops having to mentally simulate 5 install scenarios for every framework-side change. Downstream products updating via capsule trust the install pipeline more.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-2`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-3 — Define scenario 2 (existing-install upgrade): seed fixture with prior-version install, run /warp:update --to <newer>, assert post-state matches new version

**As** the user
**I want** Define scenario 2 (existing-install upgrade): seed fixture with prior-version install, run /warp:update --to <newer>, assert post-state matches new version
**So that** Future install-reliability work — per-file status reporting (added/repaired/unchanged/conflict), versioned migrations with userModified tracking, release-build.js refusing stale manifests, .claude/manifest.json always-present + 4 hardcoded-caller cleanup — can land with confidence because the matrix catches regressions in <60 seconds. Maintainer stops having to mentally simulate 5 install scenarios for every framework-side change. Downstream products updating via capsule trust the install pipeline more.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-3`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-4 — Define scenario 3 (dirty-uncommitted preservation): seed fixture with install + operator edit to a framework file, run /warp:update, assert operator edit preserved (or properly conflicted)

**As** the user
**I want** Define scenario 3 (dirty-uncommitted preservation): seed fixture with install + operator edit to a framework file, run /warp:update, assert operator edit preserved (or properly conflicted)
**So that** Future install-reliability work — per-file status reporting (added/repaired/unchanged/conflict), versioned migrations with userModified tracking, release-build.js refusing stale manifests, .claude/manifest.json always-present + 4 hardcoded-caller cleanup — can land with confidence because the matrix catches regressions in <60 seconds. Maintainer stops having to mentally simulate 5 install scenarios for every framework-side change. Downstream products updating via capsule trust the install pipeline more.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-4`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-5 — Define scenario 4 (multi-version-upgrade): seed fixture with install at version N, run /warp:update --to N+3, assert all intermediate migrations ran in order

**As** the user
**I want** Define scenario 4 (multi-version-upgrade): seed fixture with install at version N, run /warp:update --to N+3, assert all intermediate migrations ran in order
**So that** Future install-reliability work — per-file status reporting (added/repaired/unchanged/conflict), versioned migrations with userModified tracking, release-build.js refusing stale manifests, .claude/manifest.json always-present + 4 hardcoded-caller cleanup — can land with confidence because the matrix catches regressions in <60 seconds. Maintainer stops having to mentally simulate 5 install scenarios for every framework-side change. Downstream products updating via capsule trust the install pipeline more.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-5`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-6 — Define scenario 5 (user-overrides preservation): seed fixture with install + operator settings.local.json overrides + permissions overrides, run /warp:update, assert overrides survive

**As** the user
**I want** Define scenario 5 (user-overrides preservation): seed fixture with install + operator settings.local.json overrides + permissions overrides, run /warp:update, assert overrides survive
**So that** Future install-reliability work — per-file status reporting (added/repaired/unchanged/conflict), versioned migrations with userModified tracking, release-build.js refusing stale manifests, .claude/manifest.json always-present + 4 hardcoded-caller cleanup — can land with confidence because the matrix catches regressions in <60 seconds. Maintainer stops having to mentally simulate 5 install scenarios for every framework-side change. Downstream products updating via capsule trust the install pipeline more.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-6`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-7 — Synthesize test-capsules helper OR document which framework/releases/ versions to chain for scenario 4

**As** the user
**I want** Synthesize test-capsules helper OR document which framework/releases/ versions to chain for scenario 4
**So that** Future install-reliability work — per-file status reporting (added/repaired/unchanged/conflict), versioned migrations with userModified tracking, release-build.js refusing stale manifests, .claude/manifest.json always-present + 4 hardcoded-caller cleanup — can land with confidence because the matrix catches regressions in <60 seconds. Maintainer stops having to mentally simulate 5 install scenarios for every framework-side change. Downstream products updating via capsule trust the install pipeline more.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-7`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-8 — JSON report mode for CI (--json flag emitting structured per-scenario result)

**As** the user
**I want** JSON report mode for CI (--json flag emitting structured per-scenario result)
**So that** Future install-reliability work — per-file status reporting (added/repaired/unchanged/conflict), versioned migrations with userModified tracking, release-build.js refusing stale manifests, .claude/manifest.json always-present + 4 hardcoded-caller cleanup — can land with confidence because the matrix catches regressions in <60 seconds. Maintainer stops having to mentally simulate 5 install scenarios for every framework-side change. Downstream products updating via capsule trust the install pipeline more.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-8`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-9 — Wire-in: npm script (npm run test:install-matrix) + gauntlet entry

**As** the user
**I want** Wire-in: npm script (npm run test:install-matrix) + gauntlet entry
**So that** Future install-reliability work — per-file status reporting (added/repaired/unchanged/conflict), versioned migrations with userModified tracking, release-build.js refusing stale manifests, .claude/manifest.json always-present + 4 hardcoded-caller cleanup — can land with confidence because the matrix catches regressions in <60 seconds. Maintainer stops having to mentally simulate 5 install scenarios for every framework-side change. Downstream products updating via capsule trust the install pipeline more.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-9`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-10 — Meta-tests: plant a regression (e.g., delete a hook from defaults.json mid-install) and confirm matrix catches it

**As** the user
**I want** Meta-tests: plant a regression (e.g., delete a hook from defaults.json mid-install) and confirm matrix catches it
**So that** Future install-reliability work — per-file status reporting (added/repaired/unchanged/conflict), versioned migrations with userModified tracking, release-build.js refusing stale manifests, .claude/manifest.json always-present + 4 hardcoded-caller cleanup — can land with confidence because the matrix catches regressions in <60 seconds. Maintainer stops having to mentally simulate 5 install scenarios for every framework-side change. Downstream products updating via capsule trust the install pipeline more.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-10`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

