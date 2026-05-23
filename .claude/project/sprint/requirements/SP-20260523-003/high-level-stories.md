<!-- requirement-format-legacy -->
# High-Level Stories — Installer ownership manifest hook into /warp:setup — refuse writes to paths not in _warpos/MANIFEST.json

**Sprint:** `SP-20260523-003`
**PRD:** `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260523-003\prd.md`

> High-level stories use the `H-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`.

## H-1 — As a maintainer running /warp:setup against a new product, I get a summary of manifest coverage at the end (paths total, owner breakdown, unmanifested/drift/missing counts).

**As** the user
**I want** As a maintainer running /warp:setup against a new product, I get a summary of manifest coverage at the end (paths total, owner breakdown, unmanifested/drift/missing counts).
**So that** Every /warp:setup leaves the target in a state where _warpos/MANIFEST.json is honest about on-disk content. Maintainers using /warp:setup against new products immediately know if anything slipped through the cracks. Subsequent /warp:update + /warp:check skills get correct data.

Linked granular stories: see `granular-stories.md`.
Linked requirements: `R-1`.

## H-2 — As a CI gate, I run /warp:setup --strict-manifest to refuse install completion when manifest is dishonest.

**As** the user
**I want** As a CI gate, I run /warp:setup --strict-manifest to refuse install completion when manifest is dishonest.
**So that** Every /warp:setup leaves the target in a state where _warpos/MANIFEST.json is honest about on-disk content. Maintainers using /warp:setup against new products immediately know if anything slipped through the cracks. Subsequent /warp:update + /warp:check skills get correct data.

Linked granular stories: see `granular-stories.md`.
Linked requirements: `R-2`.
