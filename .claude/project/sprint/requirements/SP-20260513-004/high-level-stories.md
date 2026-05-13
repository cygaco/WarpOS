# High-Level Stories — /sprint:retrospective skill — close-of-sprint reflection

**Sprint:** `SP-20260513-004`
**PRD:** `prd.md`

> High-level stories use the `H-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`.

## H-1 — Operator runs a one-command retro at sprint close

**As** an operator who just finished a sprint
**I want** to run `/sprint:retrospective` after `/sprint:release`
**So that** I get a durable, structured retro covering what shipped,
what slipped, plan-quality reality, friction, and action items —
without having to write it from scratch.

Linked granular stories: `S-1`, `S-2`, `S-3`, `S-5`, `S-7`.
Linked requirements: `R-1`, `R-2`, `R-3`, `R-7`.

## H-2 — Strategist sees retros accumulating across sprints

**As** a strategist (Alex α or the operator)
**I want** every closed sprint to have a `retro.yaml` + `retro.md` in
`paths.sprintHistory/<sprint-id>/`
**So that** I can spot recurring friction, plan-quality drift, and
scope-variant adherence patterns across sprints over time. (Trend
analysis itself lives in `/check:patterns`; this story only requires
the durable data to exist.)

Linked granular stories: `S-2`, `S-4`.
Linked requirements: `R-1`, `R-2`, `R-4`, `R-5`.

## H-3 — Alex α consumes retros as judgment input

**As** Alex α planning the next sprint
**I want** previous retros to be machine-readable (validating against
`sprint-retrospective.schema.json`) and discoverable under
`paths.sprintHistory/`
**So that** I can incorporate "what we said we'd change" and "what
actually happened" into future Plan Contracts without re-deriving the
context.

Linked granular stories: `S-1`, `S-6`, `S-8`.
Linked requirements: `R-1`, `R-6`, `R-8`.
