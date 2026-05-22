<!-- requirement-format-legacy -->
# High-Level Stories — Framework Boundary &amp; Identity — _warpos/ zone, MANIFEST.json, full purge of /warp:promote suite

**Sprint:** `SP-20260522-001`
**PRD:** `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260522-001\prd.md`

> High-level stories use the `H-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`.

## H-1 — As the maintainer, I want the canonical WarpOS repo to contain zero product-titled files and zero promote-era artifacts so the public repo is framework-only.

**As** the user
**I want** As the maintainer, I want the canonical WarpOS repo to contain zero product-titled files and zero promote-era artifacts so the public repo is framework-only.
**So that** Public canonical WarpOS (github.com/cygaco/WarpOS) becomes framework-source-only — zero product-titled files, zero promote-era artifacts. Installed products gain a clear ownership story (_warpos/MANIFEST.json) and predictable update semantics. The maintainer can confidently ship canonical updates without leaking product data, and Claude Code's tool-mandated path requirements are honored without forking the source-of-truth.

Linked granular stories: see `granular-stories.md`.
Linked requirements: `R-1`.

## H-2 — As Claude Code, I want .claude/commands and .claude/agents to be byte-identical to their _warpos/ sources so the runtime interface is predictable.

**As** the user
**I want** As Claude Code, I want .claude/commands and .claude/agents to be byte-identical to their _warpos/ sources so the runtime interface is predictable.
**So that** Public canonical WarpOS (github.com/cygaco/WarpOS) becomes framework-source-only — zero product-titled files, zero promote-era artifacts. Installed products gain a clear ownership story (_warpos/MANIFEST.json) and predictable update semantics. The maintainer can confidently ship canonical updates without leaking product data, and Claude Code's tool-mandated path requirements are honored without forking the source-of-truth.

Linked granular stories: see `granular-stories.md`.
Linked requirements: `R-2`.
