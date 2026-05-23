<!-- requirement-format-legacy -->
# Granular Stories — Migration bootstrap script — convert existing WarpOS installs to _warpos/ architecture

**Sprint:** `SP-20260522-004`
**High-level stories:** `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260522-004\high-level-stories.md`

> Granular stories use the `S-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`. Each granular story
> should produce roughly one ticket during `/sprint:design`.

## S-1 — Detect canonical-vs-product mode from framework-installed.json + _warpos/ presence

**As** the user
**I want** Detect canonical-vs-product mode from framework-installed.json + _warpos/ presence
**So that** Rolling _warpos/ out to real products (Jobzooka, DreamTeam) becomes a single command instead of a multi-day manual migration. The new ownership/regeneration/validation system gets exercised under real load — which surfaces edge cases that canonical-only testing can't. Sprint 5 candidates after this (install/release reliability batch, Sprint 6 polish) all build on the assumption that _warpos/ exists in products.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-1`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-2 — Refuse without --force when _warpos/ exists

**As** the user
**I want** Refuse without --force when _warpos/ exists
**So that** Rolling _warpos/ out to real products (Jobzooka, DreamTeam) becomes a single command instead of a multi-day manual migration. The new ownership/regeneration/validation system gets exercised under real load — which surfaces edge cases that canonical-only testing can't. Sprint 5 candidates after this (install/release reliability batch, Sprint 6 polish) all build on the assumption that _warpos/ exists in products.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-2`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-3 — Copy framework-owned content from source canonical's framework/ into target _warpos/ (preserving structure)

**As** the user
**I want** Copy framework-owned content from source canonical's framework/ into target _warpos/ (preserving structure)
**So that** Rolling _warpos/ out to real products (Jobzooka, DreamTeam) becomes a single command instead of a multi-day manual migration. The new ownership/regeneration/validation system gets exercised under real load — which surfaces edge cases that canonical-only testing can't. Sprint 5 candidates after this (install/release reliability batch, Sprint 6 polish) all build on the assumption that _warpos/ exists in products.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-3`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-4 — Generate initial _warpos/MANIFEST.json via build.js with correct sourcePrefix

**As** the user
**I want** Generate initial _warpos/MANIFEST.json via build.js with correct sourcePrefix
**So that** Rolling _warpos/ out to real products (Jobzooka, DreamTeam) becomes a single command instead of a multi-day manual migration. The new ownership/regeneration/validation system gets exercised under real load — which surfaces edge cases that canonical-only testing can't. Sprint 5 candidates after this (install/release reliability batch, Sprint 6 polish) all build on the assumption that _warpos/ exists in products.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-4`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-5 — Rewrite .claude/settings.json hooks block — substitute scripts/hooks/ → _warpos/hooks/ in command strings

**As** the user
**I want** Rewrite .claude/settings.json hooks block — substitute scripts/hooks/ → _warpos/hooks/ in command strings
**So that** Rolling _warpos/ out to real products (Jobzooka, DreamTeam) becomes a single command instead of a multi-day manual migration. The new ownership/regeneration/validation system gets exercised under real load — which surfaces edge cases that canonical-only testing can't. Sprint 5 candidates after this (install/release reliability batch, Sprint 6 polish) all build on the assumption that _warpos/ exists in products.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-5`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-6 — Validate post-state with validate.js --strict and surface findings

**As** the user
**I want** Validate post-state with validate.js --strict and surface findings
**So that** Rolling _warpos/ out to real products (Jobzooka, DreamTeam) becomes a single command instead of a multi-day manual migration. The new ownership/regeneration/validation system gets exercised under real load — which surfaces edge cases that canonical-only testing can't. Sprint 5 candidates after this (install/release reliability batch, Sprint 6 polish) all build on the assumption that _warpos/ exists in products.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-6`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-7 — Emit bootstrap report (BOOTSTRAP_REPORT.md or stdout) + --json for machine-readable output

**As** the user
**I want** Emit bootstrap report (BOOTSTRAP_REPORT.md or stdout) + --json for machine-readable output
**So that** Rolling _warpos/ out to real products (Jobzooka, DreamTeam) becomes a single command instead of a multi-day manual migration. The new ownership/regeneration/validation system gets exercised under real load — which surfaces edge cases that canonical-only testing can't. Sprint 5 candidates after this (install/release reliability batch, Sprint 6 polish) all build on the assumption that _warpos/ exists in products.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-7`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-8 — Dry-run mode shows the full plan without writing

**As** the user
**I want** Dry-run mode shows the full plan without writing
**So that** Rolling _warpos/ out to real products (Jobzooka, DreamTeam) becomes a single command instead of a multi-day manual migration. The new ownership/regeneration/validation system gets exercised under real load — which surfaces edge cases that canonical-only testing can't. Sprint 5 candidates after this (install/release reliability batch, Sprint 6 polish) all build on the assumption that _warpos/ exists in products.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-8`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-9 — Idempotency test: running bootstrap twice on a clean install must refuse (or no-op)

**As** the user
**I want** Idempotency test: running bootstrap twice on a clean install must refuse (or no-op)
**So that** Rolling _warpos/ out to real products (Jobzooka, DreamTeam) becomes a single command instead of a multi-day manual migration. The new ownership/regeneration/validation system gets exercised under real load — which surfaces edge cases that canonical-only testing can't. Sprint 5 candidates after this (install/release reliability batch, Sprint 6 polish) all build on the assumption that _warpos/ exists in products.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-9`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-10 — /warp:setup discovery: call bootstrap when install detects upgrade path (recommended scope only)

**As** the user
**I want** /warp:setup discovery: call bootstrap when install detects upgrade path (recommended scope only)
**So that** Rolling _warpos/ out to real products (Jobzooka, DreamTeam) becomes a single command instead of a multi-day manual migration. The new ownership/regeneration/validation system gets exercised under real load — which surfaces edge cases that canonical-only testing can't. Sprint 5 candidates after this (install/release reliability batch, Sprint 6 polish) all build on the assumption that _warpos/ exists in products.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-10`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-11 — Source-canonical-clone discovery: --source explicit, sibling-clone heuristic, framework-installed.json#source field fallback

**As** the user
**I want** Source-canonical-clone discovery: --source explicit, sibling-clone heuristic, framework-installed.json#source field fallback
**So that** Rolling _warpos/ out to real products (Jobzooka, DreamTeam) becomes a single command instead of a multi-day manual migration. The new ownership/regeneration/validation system gets exercised under real load — which surfaces edge cases that canonical-only testing can't. Sprint 5 candidates after this (install/release reliability batch, Sprint 6 polish) all build on the assumption that _warpos/ exists in products.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-11`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

