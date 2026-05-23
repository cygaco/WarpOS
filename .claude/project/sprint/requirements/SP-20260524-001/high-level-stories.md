<!-- requirement-format-legacy -->
# High-Level Stories — Install fixture CI matrix — 5-scenario regression test suite for /warp:setup + /warp:update

**Sprint:** `SP-20260524-001`
**PRD:** `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260524-001\prd.md`

> High-level stories use the `H-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`.

## H-1 — As a maintainer landing install-reliability changes, I run a single command and know within 60s whether my change broke any of 5 representative install scenarios.

**As** the user
**I want** As a maintainer landing install-reliability changes, I run a single command and know within 60s whether my change broke any of 5 representative install scenarios.
**So that** Future install-reliability work — per-file status reporting (added/repaired/unchanged/conflict), versioned migrations with userModified tracking, release-build.js refusing stale manifests, .claude/manifest.json always-present + 4 hardcoded-caller cleanup — can land with confidence because the matrix catches regressions in <60 seconds. Maintainer stops having to mentally simulate 5 install scenarios for every framework-side change. Downstream products updating via capsule trust the install pipeline more.

Linked granular stories: see `granular-stories.md`.
Linked requirements: `R-1`.

## H-2 — As a CI gate, the matrix runs on every commit touching scripts/warpos/* or scripts/warp-setup.js, fails the build on regression with structured per-scenario failure detail.

**As** the user
**I want** As a CI gate, the matrix runs on every commit touching scripts/warpos/* or scripts/warp-setup.js, fails the build on regression with structured per-scenario failure detail.
**So that** Future install-reliability work — per-file status reporting (added/repaired/unchanged/conflict), versioned migrations with userModified tracking, release-build.js refusing stale manifests, .claude/manifest.json always-present + 4 hardcoded-caller cleanup — can land with confidence because the matrix catches regressions in <60 seconds. Maintainer stops having to mentally simulate 5 install scenarios for every framework-side change. Downstream products updating via capsule trust the install pipeline more.

Linked granular stories: see `granular-stories.md`.
Linked requirements: `R-2`.
