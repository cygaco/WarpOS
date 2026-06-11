<!-- requirement-format-legacy -->
# High-Level Stories — Dreamteam verified-open guard batch — W-26 + W-14 (3 closed already-fixed)

**Sprint:** `SP-20260610-008`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-008\prd.md`

> High-level stories use the `H-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`.

## H-1 — As a builder dispatched with an empty allowedFiles:[], I get a LOUD actionable error at dispatch instead of silently failing every write.

**As** the user
**I want** As a builder dispatched with an empty allowedFiles:[], I get a LOUD actionable error at dispatch instead of silently failing every write.
**So that** A builder dispatched with an empty allowedFiles:[] gets a LOUD, actionable error at dispatch time instead of silently failing every write; and /portfolio:* skills read the REAL registry at ~/.warpos/portfolio.json instead of a dead project-local path. Each guarded by a planted-violation test; the every-turn guards stay green (golden-first).

Linked granular stories: see `granular-stories.md`.
Linked requirements: `R-1`.

## H-2 — As a /portfolio:* skill, portfolioRegistry (removed paths key) resolves to the REAL registry at ~/.warpos/portfolio.json, not a dead project-local path.

**As** the user
**I want** As a /portfolio:* skill, portfolioRegistry (removed paths key) resolves to the REAL registry at ~/.warpos/portfolio.json, not a dead project-local path.
**So that** A builder dispatched with an empty allowedFiles:[] gets a LOUD, actionable error at dispatch time instead of silently failing every write; and /portfolio:* skills read the REAL registry at ~/.warpos/portfolio.json instead of a dead project-local path. Each guarded by a planted-violation test; the every-turn guards stay green (golden-first).

Linked granular stories: see `granular-stories.md`.
Linked requirements: `R-2`.
