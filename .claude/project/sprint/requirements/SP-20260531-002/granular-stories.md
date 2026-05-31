<!-- requirement-format-legacy -->
# Granular Stories — _guides product-layer shipping + _planning reorg + ship-boundary enforcer

**Sprint:** `SP-20260531-002`
**High-level stories:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260531-002\high-level-stories.md`

> Granular stories use the `S-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`. Each granular story
> should produce roughly one ticket during `/sprint:design`.

## S-1 — Create _guides/ and move DEV_SETUP_GUIDE.md into it (grep + fix all references first).

**As** the user
**I want** Create _guides/ and move DEV_SETUP_GUIDE.md into it (grep + fix all references first).
**So that** Vibecoders who scaffold/install a WarpOS product receive the launch guides (like DEV_SETUP_GUIDE.md) with them, while WarpOS internal planning docs never leak into product repos. Closes part of the framework/product boundary gap (ED-012; ownership taxonomy SP-20260522-001).

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-1`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-2 — Register _guides/ in the shipping manifest (framework-manifest.json / _warpos/MANIFEST.json).

**As** the user
**I want** Register _guides/ in the shipping manifest (framework-manifest.json / _warpos/MANIFEST.json).
**So that** Vibecoders who scaffold/install a WarpOS product receive the launch guides (like DEV_SETUP_GUIDE.md) with them, while WarpOS internal planning docs never leak into product repos. Closes part of the framework/product boundary gap (ED-012; ownership taxonomy SP-20260522-001).

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-2`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-3 — Mark _planning/ as canonical-only / excluded from shipping.

**As** the user
**I want** Mark _planning/ as canonical-only / excluded from shipping.
**So that** Vibecoders who scaffold/install a WarpOS product receive the launch guides (like DEV_SETUP_GUIDE.md) with them, while WarpOS internal planning docs never leak into product repos. Closes part of the framework/product boundary gap (ED-012; ownership taxonomy SP-20260522-001).

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-3`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-4 — Reorganize _planning/ (plans / reviews / ingest / sources).

**As** the user
**I want** Reorganize _planning/ (plans / reviews / ingest / sources).
**So that** Vibecoders who scaffold/install a WarpOS product receive the launch guides (like DEV_SETUP_GUIDE.md) with them, while WarpOS internal planning docs never leak into product repos. Closes part of the framework/product boundary gap (ED-012; ownership taxonomy SP-20260522-001).

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-4`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-5 — Add a fail-closed scan asserting plan-files-never-ship + guides-ship; wire into scan:full.

**As** the user
**I want** Add a fail-closed scan asserting plan-files-never-ship + guides-ship; wire into scan:full.
**So that** Vibecoders who scaffold/install a WarpOS product receive the launch guides (like DEV_SETUP_GUIDE.md) with them, while WarpOS internal planning docs never leak into product repos. Closes part of the framework/product boundary gap (ED-012; ownership taxonomy SP-20260522-001).

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-5`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-6 — Regenerate BOTH manifests; verify ship-coverage + framework-purity are green.

**As** the user
**I want** Regenerate BOTH manifests; verify ship-coverage + framework-purity are green.
**So that** Vibecoders who scaffold/install a WarpOS product receive the launch guides (like DEV_SETUP_GUIDE.md) with them, while WarpOS internal planning docs never leak into product repos. Closes part of the framework/product boundary gap (ED-012; ownership taxonomy SP-20260522-001).

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-6`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

