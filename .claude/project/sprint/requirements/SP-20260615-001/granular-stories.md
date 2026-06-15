<!-- requirement-format-legacy -->
# Granular Stories — Panel namespace + roadmap panel (ROADMAP items 23+25)

**Sprint:** `SP-20260615-001`
**High-level stories:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260615-001\high-level-stories.md`

> Granular stories use the `S-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`. Each granular story
> should produce roughly one ticket during `/sprint:design`.

## S-1 — Define the panel registry (one row per panel: name, opener, description, run_context) as the single source.

**As** the user
**I want** Define the panel registry (one row per panel: name, opener, description, run_context) as the single source.
**So that** The operator opens any panel with one consistent verb and sees 'what's next' without asking; adding a panel is a single registry row; a registry row that points at a non-existent opener is caught by an enforcer instead of failing silently at open time.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-1`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-2 — Add the /panel:* thin forwarder skills that delegate to each canonical opener (no logic dup).

**As** the user
**I want** Add the /panel:* thin forwarder skills that delegate to each canonical opener (no logic dup).
**So that** The operator opens any panel with one consistent verb and sees 'what's next' without asking; adding a panel is a single registry row; a registry row that points at a non-existent opener is caught by an enforcer instead of failing silently at open time.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-2`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-3 — Add /panel:list that enumerates the registry.

**As** the user
**I want** Add /panel:list that enumerates the registry.
**So that** The operator opens any panel with one consistent verb and sees 'what's next' without asking; adding a panel is a single registry row; a registry row that points at a non-existent opener is caught by an enforcer instead of failing silently at open time.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-3`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-4 — Add scripts/panel/roadmap.js that renders the read-only 'what's next' board from the live sources, fail-soft.

**As** the user
**I want** Add scripts/panel/roadmap.js that renders the read-only 'what's next' board from the live sources, fail-soft.
**So that** The operator opens any panel with one consistent verb and sees 'what's next' without asking; adding a panel is a single registry row; a registry row that points at a non-existent opener is caught by an enforcer instead of failing silently at open time.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-4`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-5 — Add /panel:roadmap forwarder that opens the board.

**As** the user
**I want** Add /panel:roadmap forwarder that opens the board.
**So that** The operator opens any panel with one consistent verb and sees 'what's next' without asking; adding a panel is a single registry row; a registry row that points at a non-existent opener is caught by an enforcer instead of failing silently at open time.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-5`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-6 — Add scripts/checks/panel-registry-coverage.js (fail-closed) and wire it report-only into /scan:full; add path keys via the SOURCE registry; regen manifests+maps.

**As** the user
**I want** Add scripts/checks/panel-registry-coverage.js (fail-closed) and wire it report-only into /scan:full; add path keys via the SOURCE registry; regen manifests+maps.
**So that** The operator opens any panel with one consistent verb and sees 'what's next' without asking; adding a panel is a single registry row; a registry row that points at a non-existent opener is caught by an enforcer instead of failing silently at open time.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-1`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

