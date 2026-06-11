<!-- requirement-format-legacy -->
# High-Level Stories — Cross-family findings fix sprint — 6 gemini re-review findings (epsilon-runtime spawn race, fallback ENFORCE brick, hardcoded BUILD_CHAIN_ROLES, spoofed-ts window, sprint_id correlation, verifyGauntlet parse refusal)

**Sprint:** `SP-20260611-001`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260611-001\prd.md`

> High-level stories use the `H-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`.

## H-1 — As the dispatch layer, parent and child timeout bounds are coordinated so graceful death records always win the race

**As** the user
**I want** As the dispatch layer, parent and child timeout bounds are coordinated so graceful death records always win the race
**So that** The dispatch/enforcement layer stops lying: the epsilon spawn timeout headroom actually works, the sanctioned review-fallback lane survives the W2 ENFORCE flip, build-chain role gating derives from the registry (no unregistered-role bypass), and the F-1/F-3 coverage predicates cannot be spoofed by planted timestamps, concurrent sprints, or garbage windows.

Linked granular stories: see `granular-stories.md`.
Linked requirements: `R-1`.

## H-2 — As the W2 ENFORCE flip, I can flip blocking knowing the sanctioned fallback lane is shape-registered

**As** the user
**I want** As the W2 ENFORCE flip, I can flip blocking knowing the sanctioned fallback lane is shape-registered
**So that** The dispatch/enforcement layer stops lying: the epsilon spawn timeout headroom actually works, the sanctioned review-fallback lane survives the W2 ENFORCE flip, build-chain role gating derives from the registry (no unregistered-role bypass), and the F-1/F-3 coverage predicates cannot be spoofed by planted timestamps, concurrent sprints, or garbage windows.

Linked granular stories: see `granular-stories.md`.
Linked requirements: `R-2`.

## H-3 — As the coverage enforcers, I correlate records by sprint_id and clamped windows so planted or concurrent records cannot false-green a sprint

**As** the coverage-enforcement layer (sprint-hook-coverage, sprint-manager-consult, gauntlet-verify)
**I want** record correlation to prefer sprint_id, clamp window bounds to sane horizons, and refuse unparseable windows inside the library
**So that** planted extreme timestamps, concurrent sprints, and garbage windows cannot produce a false-green coverage verdict (BC-16 false-green class).

Linked granular stories: see `granular-stories.md` (S-4, S-5, S-6).
Linked requirements: `R-4`, `R-5`, `R-6`.
