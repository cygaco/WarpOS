# TRACE Requirements — /sprint:retrospective skill — close-of-sprint reflection

**Sprint:** `SP-20260513-004`
**PRD:** `prd.md`

> TRACE captures the observability, traceability, event capture, decision
> logging, and requirement-to-code linkage layer. The point of TRACE is
> to answer: why did this exist, where did the requirement come from,
> what changed because of it, what external dependency or approval was
> required, how was it tested, what shipped, and what should persist as
> a learning.

## Trace Map

| Source | Requirement | Story | COPY | INPUT | ESD | Ticket | Code | Test | Release | Learning |
|---|---|---|---|---|---|---|---|---|---|---|
| User request | R-1 | S-1 | — | IN-7 | — | T-… | `schemas/sprint/sprint-retrospective.schema.json` | sample-retro validation | RL-… | — |
| User request | R-2 | S-2 | C-3, C-4, C-5 | IN-6 | — | T-… | `scripts/sprint/retrospective.js` | unit + integration | RL-… | — |
| User request | R-3 | S-3 | C-2, C-4, C-5, C-6 | IN-1..IN-5 | — | T-… | `.claude/commands/sprint/retrospective.md` | manual skill-doc smoke | RL-… | — |
| User request | R-4 | S-4 | C-1 | — | — | T-… | `framework/templates/sprint/retrospective/*.tmpl` | render snapshot | RL-… | — |
| User request | R-5 | S-5 | C-2 | IN-1 | — | T-… | `schemas/sprint/active-sprints.schema.json`, `scripts/sprint/retrospective.js` | status-transition test | RL-… | — |
| User request | R-6 | S-6 | C-7 | — | — | T-… | `scripts/sprint/retrospective.js` (prompt) | SP-20260512-001 evidence run | RL-… | — |
| User request | R-7 | S-7 | C-7 | IN-2 | — | T-… | `scripts/sprint/retrospective.js` (`--no-synth` branch) | skeleton round-trip | RL-… | — |
| User request | R-8 | S-8 | — | — | — | T-… | `.claude/project/reference/sprint-workflow.md` | docs grep | RL-… | — |

## TR-1 — `retro_started`

**Event:** `retro_started`
**When:** Skill body begins resolving `--sprint`, loading tracker
artifacts, before any synthesis call.
**Captured fields:** `sprint_id`, `mode` (`synth` | `skeleton`),
`triggered_by`, `force`, `review_only`.
**Linked requirement:** `R-2`
**Linked story:** `S-2`
**Why we capture this:** Marks the start of a retro attempt for
crash-recovery and audit. Pairs with `retro_signed_off` to compute
synthesis duration.

## TR-2 — `retro_synthesized`

**Event:** `retro_synthesized`
**When:** After the LLM synthesis call returns (success or fall-back
to skeleton).
**Captured fields:** `sprint_id`, `synthesis_status` (`ok` |
`failed_falling_back_to_skeleton` | `skipped_no_synth_flag`), `model`
(provider:model id from the routing call), `duration_ms`,
`output_chars`.
**Linked requirement:** `R-6`
**Linked story:** `S-6`
**Why we capture this:** Detects synthesis failures so future retros
of `/check:patterns` can surface "LLM frequently fails at retro
stage" as a friction signal. Also feeds COPY `C-7`'s decision (when
to print fallback warning).

## TR-3 — `retro_signed_off`

**Event:** `retro_signed_off`
**When:** After `retro.yaml` + `retro.md` are written, validation
passes, and the registry status flip to `retrospected` is committed.
**Captured fields:** `sprint_id`, `plan_contract_id`, `retro_path`,
`action_items_count`, `friction_points_count`,
`status_transition_from`, `status_transition_to`, `signed_off_by`,
`signed_off_at`.
**Linked requirement:** `R-2`, `R-5`
**Linked story:** `S-2`, `S-5`
**Why we capture this:** Durable record that a sprint has a retro.
`/check:patterns` (expanded scope) will read these events to compute
cross-sprint trends without re-parsing every retro YAML.

## TR-4 — `retro_status_transition_blocked`

**Event:** `retro_status_transition_blocked`
**When:** Operator attempts `/sprint:retrospective` on a sprint that
is not in `closed` or `abandoned` state.
**Captured fields:** `sprint_id`, `current_status`, `attempted_by`.
**Linked requirement:** `R-5`
**Linked story:** `S-5`
**Why we capture this:** Surfaces premature-retro attempts.
Recurring premature attempts indicate the workflow doc is unclear
about when retros run.

## Cross-sprint integration

A future `/check:patterns` pass (expanded scope, deferred) will read
TR-1, TR-2, TR-3 events from `paths.eventsFile` and synthesize:

- average synthesis duration
- fallback rate (synth failures / total retros)
- average action-items per sprint
- recurring friction-point themes across sprints

This is **not** in scope for MVP — the trace events are the data
contract that lets it be implemented later without re-instrumentation.
