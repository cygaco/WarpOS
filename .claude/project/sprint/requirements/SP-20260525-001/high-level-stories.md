<!-- requirement-format-legacy -->
# High-Level Stories — Maintainer canonical scrub orchestration (milestone 0.10.0 sprint 1)

**Sprint:** `SP-20260525-001`
**PRD:** `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-001\prd.md`

> High-level stories use the `H-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`.

## H-1 — As the maintainer, I want WarpOS-as-product specs to live in their own private sibling repo so canonical WarpOS publishes externally with zero product-data leak.

**As** the user
**I want** As the maintainer, I want WarpOS-as-product specs to live in their own private sibling repo so canonical WarpOS publishes externally with zero product-data leak.
**So that** After this sprint, `_requirements/00-canonical/*` and product-titled `_requirements/03-architecture/*` no longer exist in canonical WarpOS. The maintainer's product-thinking lives in a private sibling repo `warpos-as-product` (registered in the portfolio). Canonical WarpOS publishes externally with no product-data leak — passes `grep -rn '00-canonical\|jobzooka\|dreamteam\|aiweb\|companycam' .` cleanly (modulo ROADMAP archive references + version-history sections). The 0.10.0 milestone is one sprint away from done (sprint 2 flips the gate flag).

Linked granular stories: see `granular-stories.md`.
Linked requirements: `R-1`.

## H-2 — As the maintainer, I want borderline framework-vs-product classification decisions surfaced explicitly so I don't lose framework content to over-zealous moves.

**As** the user
**I want** As the maintainer, I want borderline framework-vs-product classification decisions surfaced explicitly so I don't lose framework content to over-zealous moves.
**So that** After this sprint, `_requirements/00-canonical/*` and product-titled `_requirements/03-architecture/*` no longer exist in canonical WarpOS. The maintainer's product-thinking lives in a private sibling repo `warpos-as-product` (registered in the portfolio). Canonical WarpOS publishes externally with no product-data leak — passes `grep -rn '00-canonical\|jobzooka\|dreamteam\|aiweb\|companycam' .` cleanly (modulo ROADMAP archive references + version-history sections). The 0.10.0 milestone is one sprint away from done (sprint 2 flips the gate flag).

Linked granular stories: see `granular-stories.md`.
Linked requirements: `R-2`.
