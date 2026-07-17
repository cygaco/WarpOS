# Observability, Memory, and Learning

## Purpose

WarpOS should be resumable from files and auditable after the fact. Logs should not be one giant transcript. Memory should be scoped, queryable, and promotable into enforcement.

## Event streams

Replace monolithic logs with append-only event streams:

```text
_events/
  YYYY-MM-DD/
    dispatch.jsonl
    hooks.jsonl
    agents.jsonl
    sprints.jsonl
    guides.jsonl
    research.jsonl
    releases.jsonl
    panels.jsonl
    products.jsonl

_runs/
  RUN-ID/
    events.jsonl
    summary.md
    state.json

_state/
  agents.json
  work-orders.json
  providers.json
  sprints.json
  trackers.json
  panels.json
```

Use path registry if different.

## Event schema

```json
{
  "schema": "warpos/event/v1",
  "id": "EV-...",
  "ts": "...",
  "subsystem": "dispatch|hooks|sprint|guide|panel|release|research",
  "type": "...",
  "actor": "alex-alpha|epsilon|system|worker",
  "run_id": "...",
  "sprint_id": "...",
  "work_order_id": "...",
  "payload": {},
  "evidence": []
}
```

## Materialized state

State files are regenerated from events where possible. State is optimized for fast reads by agents.

Commands:

```text
node scripts/events/validate.js
node scripts/events/compact.js
node scripts/state/materialize.js
node scripts/state/doctor.js
node scripts/events/query.js --subsystem dispatch --since ...
```

## Handoff

Every session writes:

```text
_state/session/current-handoff.md
```

Handoff includes:

- current goal
- current sprint room
- active/blocked/completed WorkOrders
- known risks
- next action
- what not to do
- files changed
- checks run

## Session intent

`/session:intent` writes:

```json
{
  "next_session_goal": "...",
  "must_read": [],
  "first_command": "...",
  "do_not_start": [],
  "expires_after_first_action": true
}
```

SessionStart loads it, surfaces it, then marks it consumed after first action.

## Project sleep vs studio sleep

### Project sleep

Consolidates one product/project:

- decisions
- risks
- next actions
- current stage
- unresolved launch/founder tasks
- product-specific known failures

### Studio sleep

Promotes cross-product lessons:

- repeated bugs → tests/hooks/templates
- repeated founder friction → founder panel items/guides
- repeated launch mistakes → gates
- repeated UX wins → patterns
- repeated decision preferences → Beta rules
- repeated dispatch failures → dispatch fixtures and contracts

## Learning promotion rule

No lesson is complete until it becomes one of:

- hook
- check
- test
- fixture
- template
- pack item
- founder-panel item
- Beta rule
- checklist gate
- ADR

## Hidden evals

Create holdouts for:

- PRD completeness
- UX flow quality
- analytics coverage
- security/privacy
- launch readiness
- founder judgment
- dispatch false-green resistance
- tracker drift
- guide correctness

## Done when

- Agents can query state instead of reading giant logs.
- Tracker validity failures are recorded as events.
- Dispatch/provider failures are classified.
- Sleep produces concrete promotions.
- Every repeated failure is converted into enforcement or a named deferred debt.
