<!-- requirement-format-legacy -->
# High-Level Stories — Sealed-capsule executable consumer-contract gate (keystone)

**Sprint:** `SP-20260602-001`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260602-001\prd.md`

> High-level stories use the `H-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`.

## H-1 — As the release pipeline, I materialize a sealed self-contained payload from a built capsule so install needs nothing from canonical.

**As** the user
**I want** As the release pipeline, I materialize a sealed self-contained payload from a built capsule so install needs nothing from canonical.
**So that** Releases can no longer ship code that secretly reaches back into canonical-only state (the #1 recurring 'downstream always missing' disease, e.g. the 100 dangling seeded_from pointers). A failing gate blocks promotion before a broken release reaches a real product install.

Linked granular stories: see `granular-stories.md`.
Linked requirements: `R-1`.

## H-2 — As the gate, I install the sealed payload into a disposable out-of-tree repo where canonical is unreachable, so reach-back breaks loudly.

**As** the user
**I want** As the gate, I install the sealed payload into a disposable out-of-tree repo where canonical is unreachable, so reach-back breaks loudly.
**So that** Releases can no longer ship code that secretly reaches back into canonical-only state (the #1 recurring 'downstream always missing' disease, e.g. the 100 dangling seeded_from pointers). A failing gate blocks promotion before a broken release reaches a real product install.

Linked granular stories: see `granular-stories.md`.
Linked requirements: `R-2`.
