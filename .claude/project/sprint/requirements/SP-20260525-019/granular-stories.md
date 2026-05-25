<!-- requirement-format-legacy -->
# Granular Stories — Install completeness: unify install.ps1 + warp-setup paths, scaffold PROJECT.md + product maps

**Sprint:** `SP-20260525-019`
**High-level stories:** `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-019\high-level-stories.md`

> Granular stories use the `S-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`. Each granular story
> should produce roughly one ticket during `/sprint:design`.

## S-1 — Extract warp-setup.js scaffold logic into a shared scripts/warpos/scaffold-core module.

**As** the user
**I want** Extract warp-setup.js scaffold logic into a shared scripts/warpos/scaffold-core module.
**So that** Any WarpOS install — consumer (install.ps1) or portfolio scaffold (warp-setup.js) — yields a complete, sprint-capable product with no silent gaps, a PROJECT.md to fill, and product maps. Stops the recurring 'fresh install is hollow' bug class at its structural root (two installers drifting apart).

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-1`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-2 — warp-setup.js calls the shared core (no behavior change; matrix stays 6/6).

**As** the user
**I want** warp-setup.js calls the shared core (no behavior change; matrix stays 6/6).
**So that** Any WarpOS install — consumer (install.ps1) or portfolio scaffold (warp-setup.js) — yields a complete, sprint-capable product with no silent gaps, a PROJECT.md to fill, and product maps. Stops the recurring 'fresh install is hollow' bug class at its structural root (two installers drifting apart).

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-2`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-3 — install.ps1 invokes the shared core (node) so consumer installs are complete.

**As** the user
**I want** install.ps1 invokes the shared core (node) so consumer installs are complete.
**So that** Any WarpOS install — consumer (install.ps1) or portfolio scaffold (warp-setup.js) — yields a complete, sprint-capable product with no silent gaps, a PROJECT.md to fill, and product maps. Stops the recurring 'fresh install is hollow' bug class at its structural root (two installers drifting apart).

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-3`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-4 — Add a PROJECT.md scaffold template + wire into the core (skip-if-present).

**As** the user
**I want** Add a PROJECT.md scaffold template + wire into the core (skip-if-present).
**So that** Any WarpOS install — consumer (install.ps1) or portfolio scaffold (warp-setup.js) — yields a complete, sprint-capable product with no silent gaps, a PROJECT.md to fill, and product maps. Stops the recurring 'fresh install is hollow' bug class at its structural root (two installers drifting apart).

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-4`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-5 — Generate product maps at install (regen-maps) or wire the /maps:all step.

**As** the user
**I want** Generate product maps at install (regen-maps) or wire the /maps:all step.
**So that** Any WarpOS install — consumer (install.ps1) or portfolio scaffold (warp-setup.js) — yields a complete, sprint-capable product with no silent gaps, a PROJECT.md to fill, and product maps. Stops the recurring 'fresh install is hollow' bug class at its structural root (two installers drifting apart).

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-5`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-6 — Install matrix: add install.ps1-path scenario + assert PROJECT.md + product maps + both-path parity.

**As** the user
**I want** Install matrix: add install.ps1-path scenario + assert PROJECT.md + product maps + both-path parity.
**So that** Any WarpOS install — consumer (install.ps1) or portfolio scaffold (warp-setup.js) — yields a complete, sprint-capable product with no silent gaps, a PROJECT.md to fill, and product maps. Stops the recurring 'fresh install is hollow' bug class at its structural root (two installers drifting apart).

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-6`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

