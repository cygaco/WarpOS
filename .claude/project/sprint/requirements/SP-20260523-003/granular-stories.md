<!-- requirement-format-legacy -->
# Granular Stories — Installer ownership manifest hook into /warp:setup — refuse writes to paths not in _warpos/MANIFEST.json

**Sprint:** `SP-20260523-003`
**High-level stories:** `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260523-003\high-level-stories.md`

> Granular stories use the `S-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`. Each granular story
> should produce roughly one ticket during `/sprint:design`.

## S-1 — Add post-install step to warp-setup.js: invoke build.js --root TARGET if _warpos/ exists

**As** the user
**I want** Add post-install step to warp-setup.js: invoke build.js --root TARGET if _warpos/ exists
**So that** Every /warp:setup leaves the target in a state where _warpos/MANIFEST.json is honest about on-disk content. Maintainers using /warp:setup against new products immediately know if anything slipped through the cracks. Subsequent /warp:update + /warp:check skills get correct data.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-1`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-2 — Invoke validate.js --root TARGET --json after build

**As** the user
**I want** Invoke validate.js --root TARGET --json after build
**So that** Every /warp:setup leaves the target in a state where _warpos/MANIFEST.json is honest about on-disk content. Maintainers using /warp:setup against new products immediately know if anything slipped through the cracks. Subsequent /warp:update + /warp:check skills get correct data.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-2`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-3 — Parse findings, print summary

**As** the user
**I want** Parse findings, print summary
**So that** Every /warp:setup leaves the target in a state where _warpos/MANIFEST.json is honest about on-disk content. Maintainers using /warp:setup against new products immediately know if anything slipped through the cracks. Subsequent /warp:update + /warp:check skills get correct data.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-3`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-4 — Add --strict-manifest flag that refuses install on non-zero exit

**As** the user
**I want** Add --strict-manifest flag that refuses install on non-zero exit
**So that** Every /warp:setup leaves the target in a state where _warpos/MANIFEST.json is honest about on-disk content. Maintainers using /warp:setup against new products immediately know if anything slipped through the cracks. Subsequent /warp:update + /warp:check skills get correct data.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-4`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-5 — Test fixture: install into fresh fixture, hook fires, reports summary, --strict-manifest enforces

**As** the user
**I want** Test fixture: install into fresh fixture, hook fires, reports summary, --strict-manifest enforces
**So that** Every /warp:setup leaves the target in a state where _warpos/MANIFEST.json is honest about on-disk content. Maintainers using /warp:setup against new products immediately know if anything slipped through the cracks. Subsequent /warp:update + /warp:check skills get correct data.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-5`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

