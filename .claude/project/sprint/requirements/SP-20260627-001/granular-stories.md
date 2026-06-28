<!-- requirement-format-legacy -->
# Granular Stories — E-DISPATCH-SHAPE-001 ADR-0013 enforce repair + W3 review-lane policy

**Sprint:** `SP-20260627-001`
**High-level stories:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260627-001\high-level-stories.md`

> Granular stories use the `S-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`. Each granular story
> should produce roughly one ticket during `/sprint:design`.

## S-1 — Honor worktree-pending semantics for -w in validateDispatch + regression-lock the false-refuse

**As** the user
**I want** Honor worktree-pending semantics for -w in validateDispatch + regression-lock the false-refuse
**So that** WarpOS's dispatch shape is enforced (not merely advisory) for the high-severity contract violations — api-when-CLI, build-chain-in-process, cwd/worktree, forbidden shapes — without breaking any legitimate builder/fixer dispatch, and every risk class provably gets the minimum review lanes it needs. This closes the last dispatch-shape reliability gap and unblocks moving doers to codex (E-DISPATCH-PERFECT W3).

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-1`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-2 — Add fixer to GENERIC_BUILD_IDS and normalize legacy role names before evaluation

**As** the user
**I want** Add fixer to GENERIC_BUILD_IDS and normalize legacy role names before evaluation
**So that** WarpOS's dispatch shape is enforced (not merely advisory) for the high-severity contract violations — api-when-CLI, build-chain-in-process, cwd/worktree, forbidden shapes — without breaking any legitimate builder/fixer dispatch, and every risk class provably gets the minimum review lanes it needs. This closes the last dispatch-shape reliability gap and unblocks moving doers to codex (E-DISPATCH-PERFECT W3).

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-2`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-3 — Flip contractEnforceMode default to enforce, preserving override + kill-switch, fail-closed on error

**As** the user
**I want** Flip contractEnforceMode default to enforce, preserving override + kill-switch, fail-closed on error
**So that** WarpOS's dispatch shape is enforced (not merely advisory) for the high-severity contract violations — api-when-CLI, build-chain-in-process, cwd/worktree, forbidden shapes — without breaking any legitimate builder/fixer dispatch, and every risk class provably gets the minimum review lanes it needs. This closes the last dispatch-shape reliability gap and unblocks moving doers to codex (E-DISPATCH-PERFECT W3).

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-3`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-4 — Declare per-risk-class minimum review lanes and wire them into sprint-hook-points + coverage-gate

**As** the user
**I want** Declare per-risk-class minimum review lanes and wire them into sprint-hook-points + coverage-gate
**So that** WarpOS's dispatch shape is enforced (not merely advisory) for the high-severity contract violations — api-when-CLI, build-chain-in-process, cwd/worktree, forbidden shapes — without breaking any legitimate builder/fixer dispatch, and every risk class provably gets the minimum review lanes it needs. This closes the last dispatch-shape reliability gap and unblocks moving doers to codex (E-DISPATCH-PERFECT W3).

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-4`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-5 — Add planted-violation fixtures (both modes) + one fixture per W3 risk class

**As** the user
**I want** Add planted-violation fixtures (both modes) + one fixture per W3 risk class
**So that** WarpOS's dispatch shape is enforced (not merely advisory) for the high-severity contract violations — api-when-CLI, build-chain-in-process, cwd/worktree, forbidden shapes — without breaking any legitimate builder/fixer dispatch, and every risk class provably gets the minimum review lanes it needs. This closes the last dispatch-shape reliability gap and unblocks moving doers to codex (E-DISPATCH-PERFECT W3).

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-5`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

