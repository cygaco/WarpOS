<!-- requirement-format-legacy -->
# High-Level Stories — E-DISPATCH-SHAPE-001 ADR-0013 enforce repair + W3 review-lane policy

**Sprint:** `SP-20260627-001`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260627-001\prd.md`

> High-level stories use the `H-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`.

## H-1 — As the WarpOS dispatch layer, I refuse only genuinely-wrong dispatch shapes and never block a legitimate -w builder or fixer

**As** the user
**I want** As the WarpOS dispatch layer, I refuse only genuinely-wrong dispatch shapes and never block a legitimate -w builder or fixer
**So that** WarpOS's dispatch shape is enforced (not merely advisory) for the high-severity contract violations — api-when-CLI, build-chain-in-process, cwd/worktree, forbidden shapes — without breaking any legitimate builder/fixer dispatch, and every risk class provably gets the minimum review lanes it needs. This closes the last dispatch-shape reliability gap and unblocks moving doers to codex (E-DISPATCH-PERFECT W3).

Linked granular stories: see `granular-stories.md`.
Linked requirements: `R-1`.

## H-2 — As a sprint conductor, each risk class provably gets the minimum review lanes it requires before a change can land

**As** the user
**I want** As a sprint conductor, each risk class provably gets the minimum review lanes it requires before a change can land
**So that** WarpOS's dispatch shape is enforced (not merely advisory) for the high-severity contract violations — api-when-CLI, build-chain-in-process, cwd/worktree, forbidden shapes — without breaking any legitimate builder/fixer dispatch, and every risk class provably gets the minimum review lanes it needs. This closes the last dispatch-shape reliability gap and unblocks moving doers to codex (E-DISPATCH-PERFECT W3).

Linked granular stories: see `granular-stories.md`.
Linked requirements: `R-2`.
