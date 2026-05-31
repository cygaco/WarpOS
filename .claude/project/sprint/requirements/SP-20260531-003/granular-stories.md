<!-- requirement-format-legacy -->
# Granular Stories — scan:warpos-layer-diff — product-vs-dev-tooling layer diff report

**Sprint:** `SP-20260531-003`
**High-level stories:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260531-003\high-level-stories.md`

> Granular stories use the `S-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`. Each granular story
> should produce roughly one ticket during `/sprint:design`.

## S-1 — Build scripts/checks/warpos-layer-diff.js: cross-reference _warpos/MANIFEST.json x .claude/framework-manifest.json; emit 3 sections (product layer / dev-tooling layer / summary counts); --json; exit 0.

**As** the user
**I want** Build scripts/checks/warpos-layer-diff.js: cross-reference _warpos/MANIFEST.json x .claude/framework-manifest.json; emit 3 sections (product layer / dev-tooling layer / summary counts); --json; exit 0.
**So that** Maintainers can see the product-vs-dev-tooling split in one command instead of manually diffing _warpos/MANIFEST.json against .claude/framework-manifest.json. Complements SP-20260531-002's fail-closed ship boundary with a read-only observability view of the same boundary.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-1`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-2 — Register the scan:warpos-layer-diff skill (.claude/commands/scan/warpos-layer-diff.md).

**As** the user
**I want** Register the scan:warpos-layer-diff skill (.claude/commands/scan/warpos-layer-diff.md).
**So that** Maintainers can see the product-vs-dev-tooling split in one command instead of manually diffing _warpos/MANIFEST.json against .claude/framework-manifest.json. Complements SP-20260531-002's fail-closed ship boundary with a read-only observability view of the same boundary.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-2`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-3 — Regenerate BOTH manifests so the new script + skill ship; verify scan:full stays green.

**As** the user
**I want** Regenerate BOTH manifests so the new script + skill ship; verify scan:full stays green.
**So that** Maintainers can see the product-vs-dev-tooling split in one command instead of manually diffing _warpos/MANIFEST.json against .claude/framework-manifest.json. Complements SP-20260531-002's fail-closed ship boundary with a read-only observability view of the same boundary.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-3`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

