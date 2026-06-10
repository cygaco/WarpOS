<!-- requirement-format-legacy -->
# High-Level Stories — Lanes C+D — sprint-pipeline truth + research:deep runnability (WARPOS.md sweep 2026-06-10)

**Sprint:** `SP-20260610-003`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-003\prd.md`

> High-level stories use the `H-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`.

## H-1 — Sprint mode runs the company org by default

**As** the operator
**I want** sprint-mode /sprint:full to default to ε-dispatch (registry-derived `isSprint()`, not a new literal), the skill body to route Phase 2/3 through ε's hook-point roster, and the design→designed transition to require matching roster completion records
**So that** α stops ghost-writing the roster's design work and sprint mode stops silently bypassing the company org — the org roster becomes enforced policy on the default path, not aspiration (observed live: α authored design artifacts itself).

Linked granular stories: see `granular-stories.md`.
Linked requirements: `R-1`, `R-2`.

## H-2 — Every scaffolded sprint's R-ids are consistent from birth and enforced

**As** an auditor
**I want** the design scaffold to derive the PRD R-list and the stories/trace R-references from the same source (plan contract `requirement_areas`, sized dynamically), a trace-integrity check that FAILS on any cited-but-undefined R-id (no legacy-waive for new scaffolds), and status/checkpoint reading the real current.yaml schema
**So that** scaffolded sprints are born with consistent traceability instead of needing a repair sub-agent (reproduced TODAY in SP-20260610-002), and pipeline status/checkpoint reports tell the truth (AL-W-006).

Linked granular stories: see `granular-stories.md`.
Linked requirements: `R-3`, `R-4`.

## H-3 — /research:deep runs to completion and flags depleted keys up front

**As** the operator
**I want** deep research to run as a standalone node script (`scripts/research/deep-run.js`) with internal async polling and in-script fs-writes — launched by a thin skill wrapper — plus a Phase 0 billable quota probe (≤5 tokens per provider)
**So that** /research:deep works instead of dying on classifier-blocked primitives (foreground sleeps, `node -e` fs-writes), and a key with no credit is an up-front actionable skip instead of a failure after async submission.

Linked granular stories: see `granular-stories.md`.
Linked requirements: `R-5`, `R-6`.
