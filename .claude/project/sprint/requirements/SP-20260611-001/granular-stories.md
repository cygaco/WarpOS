<!-- requirement-format-legacy -->
# Granular Stories — Cross-family findings fix sprint — 6 gemini re-review findings (epsilon-runtime spawn race, fallback ENFORCE brick, hardcoded BUILD_CHAIN_ROLES, spoofed-ts window, sprint_id correlation, verifyGauntlet parse refusal)

**Sprint:** `SP-20260611-001`
**High-level stories:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260611-001\high-level-stories.md`

> Granular stories use the `S-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`. Each granular story
> should produce roughly one ticket during `/sprint:design`.

## S-1 — epsilon-runtime spawnAgent passes child-bound+grace to spawnSync at line ~476 (epsilon-agent) and ~500 (epsilon-claude)

**As** the user
**I want** epsilon-runtime spawnAgent passes child-bound+grace to spawnSync at line ~476 (epsilon-agent) and ~500 (epsilon-claude)
**So that** The dispatch/enforcement layer stops lying: the epsilon spawn timeout headroom actually works, the sanctioned review-fallback lane survives the W2 ENFORCE flip, build-chain role gating derives from the registry (no unregistered-role bypass), and the F-1/F-3 coverage predicates cannot be spoofed by planted timestamps, concurrent sprints, or garbage windows.

Acceptance criteria:
- AC-1.1, AC-1.2 (see acceptance-criteria.md — parent bound = child + 30-60s grace at BOTH sites; graceful death-record wins the race)

Linked: `H-1`, `R-1`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-2 — dispatch-shape resolver (or dispatch-contract) carries a sanctioned-lane registration for review-fallback; dispatch-claude.js consults it instead of the !blocking suppression

**As** the user
**I want** dispatch-shape resolver (or dispatch-contract) carries a sanctioned-lane registration for review-fallback; dispatch-claude.js consults it instead of the !blocking suppression
**So that** The dispatch/enforcement layer stops lying: the epsilon spawn timeout headroom actually works, the sanctioned review-fallback lane survives the W2 ENFORCE flip, build-chain role gating derives from the registry (no unregistered-role bypass), and the F-1/F-3 coverage predicates cannot be spoofed by planted timestamps, concurrent sprints, or garbage windows.

Acceptance criteria:
- AC-2.1, AC-2.2, AC-2.3 (see acceptance-criteria.md — sanctioned-shape registration; ENFORCE-flip no-brick; §12.2 entry-gate text co-authored)

Linked: `H-2`, `R-2`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-3 — dispatch-claude.js derives build-chain membership via validateDispatchForClass

**As** the user
**I want** dispatch-claude.js derives build-chain membership via validateDispatchForClass
**So that** The dispatch/enforcement layer stops lying: the epsilon spawn timeout headroom actually works, the sanctioned review-fallback lane survives the W2 ENFORCE flip, build-chain role gating derives from the registry (no unregistered-role bypass), and the F-1/F-3 coverage predicates cannot be spoofed by planted timestamps, concurrent sprints, or garbage windows.

Acceptance criteria:
- AC-3.1, AC-3.2, AC-3.3 (see acceptance-criteria.md — registry-class derivation; byte-identical membership parity for existing roles; new-role bypass closed)

Linked: `H-1`, `R-3`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-4 — BOTH sprint-hook-coverage.js AND sprint-manager-consult.js clamp minTsMs/maxTsMs to sprint created_at ± cap (two-site, β design directive)

**As** the user
**I want** sprint-hook-coverage.js clamps minTsMs/maxTsMs to sprint created_at ± cap
**So that** The dispatch/enforcement layer stops lying: the epsilon spawn timeout headroom actually works, the sanctioned review-fallback lane survives the W2 ENFORCE flip, build-chain role gating derives from the registry (no unregistered-role bypass), and the F-1/F-3 coverage predicates cannot be spoofed by planted timestamps, concurrent sprints, or garbage windows.

Acceptance criteria:
- AC-4.1, AC-4.2 (see acceptance-criteria.md — planted-1970/2099 exploit fails closed in BOTH checkers; two-site per β directive)

Linked: `H-3`, `R-4`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-5 — hasBackingDispatchRecord signature gains the sprint id; both checkers pass it

**As** the user
**I want** hasBackingDispatchRecord signature gains the sprint id; both checkers pass it
**So that** The dispatch/enforcement layer stops lying: the epsilon spawn timeout headroom actually works, the sanctioned review-fallback lane survives the W2 ENFORCE flip, build-chain role gating derives from the registry (no unregistered-role bypass), and the F-1/F-3 coverage predicates cannot be spoofed by planted timestamps, concurrent sprints, or garbage windows.

Acceptance criteria:
- AC-5.1, AC-5.2, AC-5.3 (see acceptance-criteria.md — sprint_id preferred; concurrent-sprint no-false-green; legacy fallback keeps clamped window)

Linked: `H-3`, `R-5`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-6 — verifyGauntlet throws on unparseable since/until; new unit cases in the gauntlet-verify test

**As** the user
**I want** verifyGauntlet throws on unparseable since/until; new unit cases in the gauntlet-verify test
**So that** The dispatch/enforcement layer stops lying: the epsilon spawn timeout headroom actually works, the sanctioned review-fallback lane survives the W2 ENFORCE flip, build-chain role gating derives from the registry (no unregistered-role bypass), and the F-1/F-3 coverage predicates cannot be spoofed by planted timestamps, concurrent sprints, or garbage windows.

Acceptance criteria:
- AC-6.1, AC-6.2 (see acceptance-criteria.md — programmatic garbage-window refusal; CLI behavior preserved)

Linked: `H-3`, `R-6`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

