<!-- requirement-format-legacy -->
# Granular Stories — Maintainer canonical scrub orchestration (milestone 0.10.0 sprint 1)

**Sprint:** `SP-20260525-001`
**High-level stories:** `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-001\high-level-stories.md`

> Granular stories use the `S-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`. Each granular story
> should produce roughly one ticket during `/sprint:design`.

## S-1 — Verify `/portfolio:new` is functional and `gh` CLI is authenticated before kickoff.

**As** the user
**I want** Verify `/portfolio:new` is functional and `gh` CLI is authenticated before kickoff.
**So that** After this sprint, `_requirements/00-canonical/*` and product-titled `_requirements/03-architecture/*` no longer exist in canonical WarpOS. The maintainer's product-thinking lives in a private sibling repo `warpos-as-product` (registered in the portfolio). Canonical WarpOS publishes externally with no product-data leak — passes `grep -rn '00-canonical\|jobzooka\|dreamteam\|aiweb\|companycam' .` cleanly (modulo ROADMAP archive references + version-history sections). The 0.10.0 milestone is one sprint away from done (sprint 2 flips the gate flag).

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-1`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-2 — Run `/portfolio:new --slug warpos-as-product` to scaffold sibling repo + register in portfolio.json + create PRIVATE GitHub repo (escalate if gh CLI auth missing).

**As** the user
**I want** Run `/portfolio:new --slug warpos-as-product` to scaffold sibling repo + register in portfolio.json + create PRIVATE GitHub repo (escalate if gh CLI auth missing).
**So that** After this sprint, `_requirements/00-canonical/*` and product-titled `_requirements/03-architecture/*` no longer exist in canonical WarpOS. The maintainer's product-thinking lives in a private sibling repo `warpos-as-product` (registered in the portfolio). Canonical WarpOS publishes externally with no product-data leak — passes `grep -rn '00-canonical\|jobzooka\|dreamteam\|aiweb\|companycam' .` cleanly (modulo ROADMAP archive references + version-history sections). The 0.10.0 milestone is one sprint away from done (sprint 2 flips the gate flag).

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-2`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-3 — Enumerate `_requirements/00-canonical/*` (12 files known) — bulk-move via `git mv` into warpos-as-product/_requirements/00-canonical/.

**As** the user
**I want** Enumerate `_requirements/00-canonical/*` (12 files known) — bulk-move via `git mv` into warpos-as-product/_requirements/00-canonical/.
**So that** After this sprint, `_requirements/00-canonical/*` and product-titled `_requirements/03-architecture/*` no longer exist in canonical WarpOS. The maintainer's product-thinking lives in a private sibling repo `warpos-as-product` (registered in the portfolio). Canonical WarpOS publishes externally with no product-data leak — passes `grep -rn '00-canonical\|jobzooka\|dreamteam\|aiweb\|companycam' .` cleanly (modulo ROADMAP archive references + version-history sections). The 0.10.0 milestone is one sprint away from done (sprint 2 flips the gate flag).

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-3`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-4 — Enumerate `_requirements/03-architecture/*` — classify each entry as framework-generic-template (stay) or product-titled (move). Borderline cases escalate to operator.

**As** the user
**I want** Enumerate `_requirements/03-architecture/*` — classify each entry as framework-generic-template (stay) or product-titled (move). Borderline cases escalate to operator.
**So that** After this sprint, `_requirements/00-canonical/*` and product-titled `_requirements/03-architecture/*` no longer exist in canonical WarpOS. The maintainer's product-thinking lives in a private sibling repo `warpos-as-product` (registered in the portfolio). Canonical WarpOS publishes externally with no product-data leak — passes `grep -rn '00-canonical\|jobzooka\|dreamteam\|aiweb\|companycam' .` cleanly (modulo ROADMAP archive references + version-history sections). The 0.10.0 milestone is one sprint away from done (sprint 2 flips the gate flag).

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-4`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-5 — Enumerate `_docs/research/`, `_docs/briefs/`, `_docs/clones/`, `_docs/imports/` — bulk-move into warpos-as-product/_docs/.

**As** the user
**I want** Enumerate `_docs/research/`, `_docs/briefs/`, `_docs/clones/`, `_docs/imports/` — bulk-move into warpos-as-product/_docs/.
**So that** After this sprint, `_requirements/00-canonical/*` and product-titled `_requirements/03-architecture/*` no longer exist in canonical WarpOS. The maintainer's product-thinking lives in a private sibling repo `warpos-as-product` (registered in the portfolio). Canonical WarpOS publishes externally with no product-data leak — passes `grep -rn '00-canonical\|jobzooka\|dreamteam\|aiweb\|companycam' .` cleanly (modulo ROADMAP archive references + version-history sections). The 0.10.0 milestone is one sprint away from done (sprint 2 flips the gate flag).

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-5`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-6 — Check ROADMAP archive references to moved _docs/research/ files; either update refs OR retain as pointer-only stubs (operator chooses).

**As** the user
**I want** Check ROADMAP archive references to moved _docs/research/ files; either update refs OR retain as pointer-only stubs (operator chooses).
**So that** After this sprint, `_requirements/00-canonical/*` and product-titled `_requirements/03-architecture/*` no longer exist in canonical WarpOS. The maintainer's product-thinking lives in a private sibling repo `warpos-as-product` (registered in the portfolio). Canonical WarpOS publishes externally with no product-data leak — passes `grep -rn '00-canonical\|jobzooka\|dreamteam\|aiweb\|companycam' .` cleanly (modulo ROADMAP archive references + version-history sections). The 0.10.0 milestone is one sprint away from done (sprint 2 flips the gate flag).

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-6`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-7 — Regenerate `_warpos/MANIFEST.json` via `scripts/warpos/manifest/build.js` and verify path count drops by expected ~20-30 files.

**As** the user
**I want** Regenerate `_warpos/MANIFEST.json` via `scripts/warpos/manifest/build.js` and verify path count drops by expected ~20-30 files.
**So that** After this sprint, `_requirements/00-canonical/*` and product-titled `_requirements/03-architecture/*` no longer exist in canonical WarpOS. The maintainer's product-thinking lives in a private sibling repo `warpos-as-product` (registered in the portfolio). Canonical WarpOS publishes externally with no product-data leak — passes `grep -rn '00-canonical\|jobzooka\|dreamteam\|aiweb\|companycam' .` cleanly (modulo ROADMAP archive references + version-history sections). The 0.10.0 milestone is one sprint away from done (sprint 2 flips the gate flag).

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-7`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-8 — Run `/check:framework-purity --full` and confirm zero root_leak findings on canonical.

**As** the user
**I want** Run `/check:framework-purity --full` and confirm zero root_leak findings on canonical.
**So that** After this sprint, `_requirements/00-canonical/*` and product-titled `_requirements/03-architecture/*` no longer exist in canonical WarpOS. The maintainer's product-thinking lives in a private sibling repo `warpos-as-product` (registered in the portfolio). Canonical WarpOS publishes externally with no product-data leak — passes `grep -rn '00-canonical\|jobzooka\|dreamteam\|aiweb\|companycam' .` cleanly (modulo ROADMAP archive references + version-history sections). The 0.10.0 milestone is one sprint away from done (sprint 2 flips the gate flag).

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-8`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-9 — Local commit on `sprint/SP-20260525-001` branch capturing the canonical-side deletions.

**As** the user
**I want** Local commit on `sprint/SP-20260525-001` branch capturing the canonical-side deletions.
**So that** After this sprint, `_requirements/00-canonical/*` and product-titled `_requirements/03-architecture/*` no longer exist in canonical WarpOS. The maintainer's product-thinking lives in a private sibling repo `warpos-as-product` (registered in the portfolio). Canonical WarpOS publishes externally with no product-data leak — passes `grep -rn '00-canonical\|jobzooka\|dreamteam\|aiweb\|companycam' .` cleanly (modulo ROADMAP archive references + version-history sections). The 0.10.0 milestone is one sprint away from done (sprint 2 flips the gate flag).

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-9`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-10 — Local commit on warpos-as-product main branch capturing the initial moved content + scaffolded README/ROADMAP/.gitignore.

**As** the user
**I want** Local commit on warpos-as-product main branch capturing the initial moved content + scaffolded README/ROADMAP/.gitignore.
**So that** After this sprint, `_requirements/00-canonical/*` and product-titled `_requirements/03-architecture/*` no longer exist in canonical WarpOS. The maintainer's product-thinking lives in a private sibling repo `warpos-as-product` (registered in the portfolio). Canonical WarpOS publishes externally with no product-data leak — passes `grep -rn '00-canonical\|jobzooka\|dreamteam\|aiweb\|companycam' .` cleanly (modulo ROADMAP archive references + version-history sections). The 0.10.0 milestone is one sprint away from done (sprint 2 flips the gate flag).

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-10`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-11 — HALT before any `git push` — operator-scoped escalation point.

**As** the user
**I want** HALT before any `git push` — operator-scoped escalation point.
**So that** After this sprint, `_requirements/00-canonical/*` and product-titled `_requirements/03-architecture/*` no longer exist in canonical WarpOS. The maintainer's product-thinking lives in a private sibling repo `warpos-as-product` (registered in the portfolio). Canonical WarpOS publishes externally with no product-data leak — passes `grep -rn '00-canonical\|jobzooka\|dreamteam\|aiweb\|companycam' .` cleanly (modulo ROADMAP archive references + version-history sections). The 0.10.0 milestone is one sprint away from done (sprint 2 flips the gate flag).

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-11`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

