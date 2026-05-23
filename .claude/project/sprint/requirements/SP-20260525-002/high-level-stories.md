<!-- requirement-format-legacy -->
# High-Level Stories — Post-scrub gate hardening — flip ROOT_LEAK_PENDING_SCRUB=false (milestone 0.10.0 sprint 2)

**Sprint:** `SP-20260525-002`
**PRD:** `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-002\prd.md`

> High-level stories use the `H-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`.

## H-1 — As the framework, I refuse to commit any file path matching the root_leak pattern, so product-data can never leak back into canonical.

**As** the user
**I want** As the framework, I refuse to commit any file path matching the root_leak pattern, so product-data can never leak back into canonical.
**So that** Milestone 0.10.0 Framework Boundary Closure is shipped. Canonical WarpOS publishes externally with a structural guarantee (not just an audit step) that no product-data can leak. Any future attempt to reintroduce product-titled content at canonical root fails at write-time with a clear error message. Fresh `/warp:setup` of canonical into a new product writes zero product-titled paths.

Linked granular stories: see `granular-stories.md`.
Linked requirements: `R-1`.

## H-2 — As the maintainer, I see the 0.10.0 milestone close cleanly in ROADMAP.md after the flag flip + tests pass.

**As** the user
**I want** As the maintainer, I see the 0.10.0 milestone close cleanly in ROADMAP.md after the flag flip + tests pass.
**So that** Milestone 0.10.0 Framework Boundary Closure is shipped. Canonical WarpOS publishes externally with a structural guarantee (not just an audit step) that no product-data can leak. Any future attempt to reintroduce product-titled content at canonical root fails at write-time with a clear error message. Fresh `/warp:setup` of canonical into a new product writes zero product-titled paths.

Linked granular stories: see `granular-stories.md`.
Linked requirements: `R-2`.
