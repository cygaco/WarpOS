<!-- requirement-format-legacy -->
# Granular Stories — Post-scrub gate hardening — flip ROOT_LEAK_PENDING_SCRUB=false (milestone 0.10.0 sprint 2)

**Sprint:** `SP-20260525-002`
**High-level stories:** `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-002\high-level-stories.md`

> Granular stories use the `S-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`. Each granular story
> should produce roughly one ticket during `/sprint:design`.

## S-1 — Pre-flight: verify SP-20260525-001 is shipped — `/check:framework-purity --diff` exits 0; otherwise halt with `human_setup_required`

**As** the user
**I want** Pre-flight: verify SP-20260525-001 is shipped — `/check:framework-purity --diff` exits 0; otherwise halt with `human_setup_required`
**So that** Milestone 0.10.0 Framework Boundary Closure is shipped. Canonical WarpOS publishes externally with a structural guarantee (not just an audit step) that no product-data can leak. Any future attempt to reintroduce product-titled content at canonical root fails at write-time with a clear error message. Fresh `/warp:setup` of canonical into a new product writes zero product-titled paths.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-1`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-2 — Edit `scripts/checks/framework-purity.js` — flip `ROOT_LEAK_PENDING_SCRUB` constant from `true` to `false`

**As** the user
**I want** Edit `scripts/checks/framework-purity.js` — flip `ROOT_LEAK_PENDING_SCRUB` constant from `true` to `false`
**So that** Milestone 0.10.0 Framework Boundary Closure is shipped. Canonical WarpOS publishes externally with a structural guarantee (not just an audit step) that no product-data can leak. Any future attempt to reintroduce product-titled content at canonical root fails at write-time with a clear error message. Fresh `/warp:setup` of canonical into a new product writes zero product-titled paths.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-2`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-3 — Add synthetic write-attempt test fixture in `scripts/checks/test-framework-purity.js` (or sibling) — write `_requirements/00-canonical/foo.md` in a temp dir, expect purity check exit 1, cleanup

**As** the user
**I want** Add synthetic write-attempt test fixture in `scripts/checks/test-framework-purity.js` (or sibling) — write `_requirements/00-canonical/foo.md` in a temp dir, expect purity check exit 1, cleanup
**So that** Milestone 0.10.0 Framework Boundary Closure is shipped. Canonical WarpOS publishes externally with a structural guarantee (not just an audit step) that no product-data can leak. Any future attempt to reintroduce product-titled content at canonical root fails at write-time with a clear error message. Fresh `/warp:setup` of canonical into a new product writes zero product-titled paths.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-3`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-4 — Add clean-canonical regression test — run purity check on post-scrub canonical state, expect exit 0

**As** the user
**I want** Add clean-canonical regression test — run purity check on post-scrub canonical state, expect exit 0
**So that** Milestone 0.10.0 Framework Boundary Closure is shipped. Canonical WarpOS publishes externally with a structural guarantee (not just an audit step) that no product-data can leak. Any future attempt to reintroduce product-titled content at canonical root fails at write-time with a clear error message. Fresh `/warp:setup` of canonical into a new product writes zero product-titled paths.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-4`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-5 — Run `/check:framework-purity --full` against current canonical; expect exit 0; capture output as evidence

**As** the user
**I want** Run `/check:framework-purity --full` against current canonical; expect exit 0; capture output as evidence
**So that** Milestone 0.10.0 Framework Boundary Closure is shipped. Canonical WarpOS publishes externally with a structural guarantee (not just an audit step) that no product-data can leak. Any future attempt to reintroduce product-titled content at canonical root fails at write-time with a clear error message. Fresh `/warp:setup` of canonical into a new product writes zero product-titled paths.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-5`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-6 — Update ROADMAP.md: move milestone 0.10.0 entry from Upcoming section to Shipped section with date stamp + per-sprint receipts (SP-20260525-001 + SP-20260525-002)

**As** the user
**I want** Update ROADMAP.md: move milestone 0.10.0 entry from Upcoming section to Shipped section with date stamp + per-sprint receipts (SP-20260525-001 + SP-20260525-002)
**So that** Milestone 0.10.0 Framework Boundary Closure is shipped. Canonical WarpOS publishes externally with a structural guarantee (not just an audit step) that no product-data can leak. Any future attempt to reintroduce product-titled content at canonical root fails at write-time with a clear error message. Fresh `/warp:setup` of canonical into a new product writes zero product-titled paths.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-6`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-7 — Regenerate `_warpos/MANIFEST.json` after ROADMAP edit (manifest changes when ROADMAP changes)

**As** the user
**I want** Regenerate `_warpos/MANIFEST.json` after ROADMAP edit (manifest changes when ROADMAP changes)
**So that** Milestone 0.10.0 Framework Boundary Closure is shipped. Canonical WarpOS publishes externally with a structural guarantee (not just an audit step) that no product-data can leak. Any future attempt to reintroduce product-titled content at canonical root fails at write-time with a clear error message. Fresh `/warp:setup` of canonical into a new product writes zero product-titled paths.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-7`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-8 — Local commit on `sprint/SP-20260525-002` branch capturing all changes

**As** the user
**I want** Local commit on `sprint/SP-20260525-002` branch capturing all changes
**So that** Milestone 0.10.0 Framework Boundary Closure is shipped. Canonical WarpOS publishes externally with a structural guarantee (not just an audit step) that no product-data can leak. Any future attempt to reintroduce product-titled content at canonical root fails at write-time with a clear error message. Fresh `/warp:setup` of canonical into a new product writes zero product-titled paths.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-8`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-9 — HALT before git push — operator-scoped

**As** the user
**I want** HALT before git push — operator-scoped
**So that** Milestone 0.10.0 Framework Boundary Closure is shipped. Canonical WarpOS publishes externally with a structural guarantee (not just an audit step) that no product-data can leak. Any future attempt to reintroduce product-titled content at canonical root fails at write-time with a clear error message. Fresh `/warp:setup` of canonical into a new product writes zero product-titled paths.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-9`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

