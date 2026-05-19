# TRACE Requirements — Consolidate ROADMAP.md and WARPOS_ROADMAP.md

**Sprint:** `SP-20260518-009`
**PRD:** `prd.md`

## Status: N/A for this sprint

This refactor introduces **no new observability hooks, event captures, or trace points**. The work is a file rename plus four script edits with no runtime behavior change.

Traceability of the sprint itself (requirement → story → ticket → commit → release) is captured by the standard sprint artifacts:

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260519-0013.yaml`
- Sprint current: `.claude/project/sprint/sprints/SP-20260518-009/current.yaml`
- Tickets: `.claude/project/sprint/tickets/T-*.yaml` (minted during `/sprint:design`)
- Routing trace: `.claude/project/sprint/decisions/routing-trace.jsonl` (auto-recorded by `plan.js` and `design.js`)
- Sprint events: appended to `paths.eventsFile` via the standard sprint helpers.

No `TR-N` entries are minted for this sprint.
