<!-- requirement-format-legacy -->
# Granular Stories — Dreamteam verified-open guard batch — W-26 + W-14 (3 closed already-fixed)

**Sprint:** `SP-20260610-008`
**High-level stories:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-008\high-level-stories.md`

> Granular stories use the `S-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`. Each granular story
> should produce roughly one ticket during `/sprint:design`.

## S-1 — TICKET-1 (BACKEND, W-26): scope-contract-guard parses the scopeContract — an empty allowedFiles:[] (no forbiddenFiles) → LOUD block with an actionable reason; present-but-unparseable → fail-closed block; normal non-empty → passes (golden). Planted test: empty-array loud-blocked, unparseable fail-closed, normal passes; golden the existing cases before/after.

**As** the user
**I want** TICKET-1 (BACKEND, W-26): scope-contract-guard parses the scopeContract — an empty allowedFiles:[] (no forbiddenFiles) → LOUD block with an actionable reason; present-but-unparseable → fail-closed block; normal non-empty → passes (golden). Planted test: empty-array loud-blocked, unparseable fail-closed, normal passes; golden the existing cases before/after.
**So that** A builder dispatched with an empty allowedFiles:[] gets a LOUD, actionable error at dispatch time instead of silently failing every write; and /portfolio:* skills read the REAL registry at ~/.warpos/portfolio.json instead of a dead project-local path. Each guarded by a planted-violation test; the every-turn guards stay green (golden-first).

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-1`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-2 — TICKET-2 (BACKEND, W-14): repoint framework/paths.registry.json portfolioRegistry to the HOME-anchored ~/.warpos/portfolio.json; run scripts/paths/build.js; VERIFY the key survived in .claude/paths.json + lib/paths.generated.js (P-058); grep + fix every portfolioRegistry consumer to resolve the home path. Planted test: resolved key → ~/.warpos/portfolio.json; a consumer reads the real registry.

**As** the user
**I want** TICKET-2 (BACKEND, W-14): repoint framework/paths.registry.json portfolioRegistry to the HOME-anchored ~/.warpos/portfolio.json; run scripts/paths/build.js; VERIFY the key survived in .claude/paths.json + lib/paths.generated.js (P-058); grep + fix every portfolioRegistry consumer to resolve the home path. Planted test: resolved key → ~/.warpos/portfolio.json; a consumer reads the real registry.
**So that** A builder dispatched with an empty allowedFiles:[] gets a LOUD, actionable error at dispatch time instead of silently failing every write; and /portfolio:* skills read the REAL registry at ~/.warpos/portfolio.json instead of a dead project-local path. Each guarded by a planted-violation test; the every-turn guards stay green (golden-first).

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-2`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-3 — TICKET-3 (close-out, no build): record W-5/W-13/W-28 as already-fixed-in-canonical with the cited lines in the sprint record.

**As** the user
**I want** TICKET-3 (close-out, no build): record W-5/W-13/W-28 as already-fixed-in-canonical with the cited lines in the sprint record.
**So that** A builder dispatched with an empty allowedFiles:[] gets a LOUD, actionable error at dispatch time instead of silently failing every write; and /portfolio:* skills read the REAL registry at ~/.warpos/portfolio.json instead of a dead project-local path. Each guarded by a planted-violation test; the every-turn guards stay green (golden-first).

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-3`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

