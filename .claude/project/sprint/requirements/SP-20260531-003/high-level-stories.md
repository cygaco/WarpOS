<!-- requirement-format-legacy -->
# High-Level Stories — scan:warpos-layer-diff — product-vs-dev-tooling layer diff report

**Sprint:** `SP-20260531-003`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260531-003\prd.md`

> High-level stories use the `H-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`.

## H-1 — As the WarpOS maintainer, I run one command and see exactly which framework paths ship to products (product layer) vs which are dev-tooling-only (never shipped).

**As** the user
**I want** As the WarpOS maintainer, I run one command and see exactly which framework paths ship to products (product layer) vs which are dev-tooling-only (never shipped).
**So that** Maintainers can see the product-vs-dev-tooling split in one command instead of manually diffing _warpos/MANIFEST.json against .claude/framework-manifest.json. Complements SP-20260531-002's fail-closed ship boundary with a read-only observability view of the same boundary.

Linked granular stories: see `granular-stories.md`.
Linked requirements: `R-1`.

## H-2 — As the maintainer, the layer split is observable without manually diffing two manifests.

**As** the user
**I want** As the maintainer, the layer split is observable without manually diffing two manifests.
**So that** Maintainers can see the product-vs-dev-tooling split in one command instead of manually diffing _warpos/MANIFEST.json against .claude/framework-manifest.json. Complements SP-20260531-002's fail-closed ship boundary with a read-only observability view of the same boundary.

Linked granular stories: see `granular-stories.md`.
Linked requirements: `R-2`.
