<!-- requirement-format-legacy -->
# Granular Stories — Framework Boundary &amp; Identity — _warpos/ zone, MANIFEST.json, full purge of /warp:promote suite

**Sprint:** `SP-20260522-001`
**High-level stories:** `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260522-001\high-level-stories.md`

> Granular stories use the `S-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`. Each granular story
> should produce roughly one ticket during `/sprint:design`.

## S-1 — Delete .claude/commands/warp/promote.md, promote-flags.md, flag.md

**As** the user
**I want** Delete .claude/commands/warp/promote.md, promote-flags.md, flag.md
**So that** Public canonical WarpOS (github.com/cygaco/WarpOS) becomes framework-source-only — zero product-titled files, zero promote-era artifacts. Installed products gain a clear ownership story (_warpos/MANIFEST.json) and predictable update semantics. The maintainer can confidently ship canonical updates without leaking product data, and Claude Code's tool-mandated path requirements are honored without forking the source-of-truth.

Acceptance criteria:
- AC-1: (set by design step)
- AC-2: (set by design step)

Linked: `H-1`, `R-1`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-2 — Delete scripts/warpos/promote.js (audit release-canonical.js — inline what it needs)

**As** the user
**I want** Delete scripts/warpos/promote.js (audit release-canonical.js — inline what it needs)
**So that** Public canonical WarpOS (github.com/cygaco/WarpOS) becomes framework-source-only — zero product-titled files, zero promote-era artifacts. Installed products gain a clear ownership story (_warpos/MANIFEST.json) and predictable update semantics. The maintainer can confidently ship canonical updates without leaking product data, and Claude Code's tool-mandated path requirements are honored without forking the source-of-truth.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-2`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.
