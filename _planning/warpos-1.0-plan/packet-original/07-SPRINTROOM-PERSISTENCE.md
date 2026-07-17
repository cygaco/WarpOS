# SprintRoom Persistence

## Goal

Keep sprint context alive without requiring a live model process to remember it.

## Core concept

A SprintRoom is the durable project room for a sprint.

It stores:

- current goal
- non-goals
- phase
- phase owner
- active WorkOrders
- live leases
- decisions
- do-not-reopen table
- open questions
- evidence index
- tracker links
- handoff
- next action

## Suggested layout

Use path registry if one exists. If not, use:

```text
_state/sprints/<SP-ID>/
  state.json
  room.md
  work-orders.json
  leases.json
  decisions.jsonl
  do-not-reopen.json
  open-questions.json
  evidence-index.json
  events.jsonl
  handoff.md
```

## SprintRoom state example

```json
{
  "schema": "warpos/sprint-room/v1",
  "sprint_id": "SP-WARPOS-1.0-001",
  "goal": "Implement instruction interop and WorkOrder schemas",
  "non_goals": ["Founder Panel app", "Master Console UI"],
  "phase": "execute",
  "phase_owner": "epsilon",
  "current_truth": {
    "branch": "sprint/SP-WARPOS-1.0-001",
    "last_verified_commit": "...",
    "tracker_status": "active",
    "last_reconcile_at": "..."
  },
  "active_work_orders": [],
  "blocked_work_orders": [],
  "completed_work_orders": [],
  "decisions": [],
  "open_questions": [],
  "next_action": "..."
}
```

## Persistence vs live agents

Some roles may stay alive for context, but truth still lives in SprintRoom.

Good live persistence:

- Epsilon stays phase-resident during execute phase.
- Security lead stays through auth/RLS gauntlet.
- Frontend lane pod stays through a coherent UI wave.
- Research conductor stays through multi-provider synthesis.

Bad live persistence:

- a builder stays forever just in case
- Epsilon waits idle for subprocesses with no wake mechanism
- old processes survive across sessions without leases
- one live agent is the only keeper of the plan

## Lease types

```text
one_shot
  one WorkOrder, expires at ResultEnvelope

wave
  2–7 related WorkOrders in one lane, checkpoint after each

phase
  conductor/reviewer/security/research role for one sprint phase

session
  top-level Alpha, expires on session end, writes handoff
```

## Checkpoint rules

A phase-resident or wave-resident agent must checkpoint:

- after each child ticket
- after each dispatch wave
- after every phase transition
- before going idle
- after receiving a stale nudge
- before session end/compaction where possible

## Commands to add

```text
/sprint:room open
/sprint:room status
/sprint:room checkpoint
/sprint:room resume
/sprint:room agents
/sprint:room ping
/sprint:room reap
/sprint:room compact
/agents:status
/session:intent
```

## Tracker reconciliation

SprintRoom must reconcile to tracker state at phase boundaries and Stop/session-save, not only at session end.

Add:

```text
node scripts/checks/tracker-fidelity.js
node scripts/sprint/room-doctor.js
node scripts/session/intent.js
```

## Done when

- A sprint can resume from files without chat history.
- Alpha can answer “what is still running?” from state.
- Epsilon can be killed and respawned from SprintRoom.
- Tracker drift is detected externally, not just internally.
- session intent loads and expires correctly.
