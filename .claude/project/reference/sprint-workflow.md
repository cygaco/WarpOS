# Sprint Workflow v0.1 — Reference

Canonical agent-loaded reference for the `/sprint:*` commands. Cite
from `paths.sprintReference`. The four commands live under
`.claude/commands/sprint/` and the helpers under `scripts/sprint/`.

## Hierarchy (top to bottom)

```
Product / Project
  Product Thesis
    Current Sprint
      Sprint Objective
        Plan Contract
          External Service Dependencies
          Approval Boundaries
          Scope Variants
          Design Requirement
        PRD / Requirement Set
          High-Level Stories (H-N)
            Granular Stories (S-N)
              COPY (C-N)
              INPUTS (IN-N)
              TRACE (TR-N)
              Acceptance Criteria (AC-N.M)
              QA / Red-Team Expectations
              Tickets (T-…)
                Tasks / Checklist Items
                Linked Issues (I-…)
                Linked Tests
                Linked Docs
                Linked Decisions
                Linked External Services (ESD-…)
                Linked Releases (RL-…)
                Ralph Progress
```

Tickets sit at the bottom. They are NEVER a substitute for
requirements. `/sprint:design` is the only command that mints tickets
for non-trivial work.

## Commands

| Command | Purpose | Layer |
|---|---|---|
| `/sprint:plan`    | Brief intent → Plan Contract | front door |
| `/sprint:design`  | Plan Contract → PRD/STORIES/COPY/INPUTS/TRACE/AC/QA/release + tickets | design |
| `/sprint:execute` | Tickets → Ralph loops + checks + issues + checkpoints | execution |
| `/sprint:release` | Sprint → release record, approval, deploy mark, retrospective | release |

There is no `/sprint:resume` skill. Resume behavior is in each
command's "Recovery" section and is driven entirely by
`paths.sprintProgress`.

## Relationship to modes

Sprint is a workflow layer **above** modes. Modes (`/mode:solo`,
`/mode:adhoc`, `/mode:oneshot`) remain user-controlled.

| Sprint phase | Solo | Adhoc | Oneshot |
|---|---|---|---|
| plan    | Alpha plans directly | Alpha plans; Beta consulted on Class B/C | unusual but allowed |
| design  | Alpha designs directly | Alpha designs; Beta reviews | unusual |
| execute | Alpha executes | Alpha + Gamma for builds | NOT the intended path |
| release | Alpha releases | Alpha + Beta for ship/no-ship | NOT the intended path |

Sprint state lives in files and survives mode transitions. Team task
ownership (in adhoc) is ephemeral — sprint tracker is the durable
record.

## Documentation scaling

`/sprint:plan` and `/sprint:design` honor a `documentation_scale`:

| Scale | Required artifacts |
|---|---|
| xs   | Plan Contract, AC, ticket-or-task, validation note |
| s    | Plan Contract, mini PRD, stories, AC, ticket, QA checklist |
| m    | Plan Contract, PRD, stories, COPY, INPUTS, TRACE, tickets, QA, redteam, release |
| l/xl | All of m + Beta review + architecture note + ESD review + approval gates + staged rollout + monitoring |

For xs/s, `/sprint:design` skips COPY/INPUTS/TRACE/redteam/release plan
templates. Their absence is recorded as `null` on
`current-sprint.requirements.*`.

## Tracker location

Live tracker state always lives in the **downstream** product repo
under `paths.sprintRoot` (`.claude/project/sprint/`). The framework
repo ships templates + schemas + commands + docs only; it does NOT
seed live tracker state.

```
.claude/project/sprint/                paths.sprintRoot
  current-sprint.yaml                  paths.sprintCurrent
  sprint-progress.yaml                 paths.sprintProgress
  plan-contracts/<PC-id>.yaml          paths.sprintPlanContracts
  plan-contracts/<PC-id>.report.md
  tickets/<T-id>.yaml                  paths.sprintTickets
  issues/<I-id>.yaml                   paths.sprintIssues
  external-services/<ESD-id>.yaml      paths.sprintExternalServices
  approvals/<AP-id>.yaml               paths.sprintApprovals
  decisions/<DEC-id>.yaml              paths.sprintDecisions
  releases/<RL-id>.yaml                paths.sprintReleases
  releases/<RL-id>.report.md
  ralph/<sprint>/<T-id>.yaml           paths.sprintRalph
  checkpoints/<sprint>-<n>.yaml        paths.sprintCheckpoints
  requirements/<sprint>/*.md           paths.sprintRequirements
  history/<sprint>/sprint-history.yaml paths.sprintHistory

issues.md                              paths.sprintIssuesLedger (repo root)
```

## Schemas

10 JSON schemas under `paths.sprintSchemas` (`schemas/sprint/`):

- `plan-contract.schema.json`
- `current-sprint.schema.json`
- `sprint-progress.schema.json`
- `ticket.schema.json`
- `issue.schema.json`
- `external-service-dependency.schema.json`
- `approval.schema.json`
- `release.schema.json`
- `sprint-history.schema.json`
- `ralph-progress.schema.json`

Validate with `node scripts/sprint/validate.js [<file.yaml>]`.

## Helper scripts

```
scripts/sprint/
  paths.js              path resolver
  ids.js                id generators
  fs.js                 yaml writer/reader + template render
  validate.js           schema validator
  init.js               downstream init (writes tracker tree from templates)
  plan.js               /sprint:plan plumbing — writes Plan Contract
  design.js             /sprint:design scaffolder — writes requirements bundle
  ticket.js             create/update/reopen/show/list
  issue.js              create/update/promote/appendmd/list
  external-service.js   create/update/list/show/gate
  execute.js            Ralph loop start/phase/stop/show
  release.js            prepare/check/approve/deploy/rollback/report/show/list
  checkpoint.js         sprint-progress writer + frozen checkpoint
  routing.js            sprint-routing.json loader
```

All read `paths.json` via the shared `scripts/hooks/lib/paths.js`.

## TRACE meaning

In sprint v0.1, **TRACE** is the traceability + observability layer
linking:

```
Source request → Product decision → Requirement (R-N) →
Story (H-N / S-N) → COPY (C-N) → INPUT (IN-N) →
ESD (if applicable) → Ticket (T-…) → Code change →
Test → QA result → Release → Learning
```

Each TRACE entry (`TR-N`) records an event, when it fires, what fields
it captures, why, and which requirement/story it links to. The
`trace.md` template scaffolds this; runtime events still flow through
`paths.eventsFile` (the existing logger) — TRACE is the **schema** for
what those events MUST capture for a given sprint.

## Ralph loop

`/sprint:execute` runs a governed Ralph loop per ticket:

```
plan → act → test → review → record → checkpoint → repeat | stop
```

Persisted at `paths.sprintRalph/<sprint>/<ticket>.yaml`. Stop
conditions (see `schemas/sprint/ralph-progress.schema.json#status`):

- `stopped_clean` (ticket complete)
- `stopped_approval_required`
- `stopped_human_setup_required`
- `stopped_repeated_failure` (3+ failed fix attempts)
- `stopped_scope_expansion`
- `stopped_destructive_action_needed`
- `stopped_production_deploy_needed`
- `stopped_beta_warning`
- `stopped_unclear_intent`

## Crash recovery rule

Every sprint command MUST:

1. Write a `paths.sprintProgress` checkpoint at start.
2. Write a `paths.sprintProgress` checkpoint at end.
3. Set `crash_recovery.resume_command` on `paths.sprintCurrent` to the
   command an agent should run on resume.
4. Set `crash_recovery.safe_to_continue` honestly. If `false`, an
   agent must investigate before resuming.

`paths.sprintCheckpoints/<sprint>-<n>.yaml` is a frozen copy of each
checkpoint (sequence numbered). This is the audit trail when an agent
needs to reconstruct what happened.

## Approval boundaries

Per `CLAUDE.md#Autonomy`, the following always require explicit user
approval:

- Production deploy
- Paid API usage / new paid service
- Service signup / billing setup
- OAuth/app approval
- Domain/DNS changes
- New credentials / secrets
- Destructive migration
- Deleting a major feature
- Changing product thesis
- Changing target customer
- Changing monetization
- Changing privacy / security posture
- Handling sensitive user data
- Bypassing Beta / judgment warning
- Major architecture replacement
- Entering large oneshot-style rebuild scope

Approval lifecycle:

```
pending → approved | rejected | waived | withdrawn
```

Approvals are durable. Sprint commands refuse to proceed past their
gate without an approval record.

## Model routing

Per `paths.sprintRouting` (`sprint-routing.json`):

| Phase | model_class | diff_review |
|---|---|---|
| planning              | strongest_reasoning  | true |
| plan_contract_review  | strongest_reasoning  | true |
| design                | strong_reasoning     | true |
| execution             | economical_coder (escalate: strong_reasoning) | false |
| qa                    | strong_reviewer      | true |
| redteam               | independent_reviewer | true |
| release               | strongest_reasoning  | true |
| docs_sync             | economical_writer    | false |
| tracker_updates       | economical_structurer| false |
| trace_updates         | economical_structurer| false |
| external_service_setup| strong_reasoning     | true |

Routing **declares intent**. Actual provider selection still flows
through `scripts/dispatch-agent.js` / `runProvider`, which honors
`paths.providerFallbackPolicy`. No new SDK installs.

## Issues integration

- `paths.sprintIssuesLedger` (`issues.md`, repo root) — human ledger.
- `paths.sprintIssues/<I-id>.yaml` — machine ledger.
- `scripts/sprint/issue.js create` writes both.
- `scripts/sprint/issue.js promote` prints the ticket-create command to
  link the issue.

Distinct from `paths.recurringIssuesFile` (SYSTEM-level recurring
issues in jsonl), which remains owned by `/issues:log`,
`/issues:list`, `/issues:resolve`, `/issues:scan`.

## Built-in primitive limits (carried forward from Phase 0)

The Claude Code harness's TeamCreate / SendMessage / maxTurns
primitives cannot be fully fixed in-repo. Sprint v0.1 mitigations:

- Sprint tracker is the durable task-truth source — never team-task
  ownership.
- `/mode:adhoc` already classifies stale teams (Phase 0 workstream I).
- Sprint commands include resume instructions in tracker files so a
  defunct or refreshed team does not lose work.

See `_docs/phase0/adhoc-primitive-limits.md` for the inventory.

## See also

- `_docs/sprint/OVERVIEW.md`
- `_docs/sprint/DOWNSTREAM_ADOPTION.md`
- `_docs/sprint/FRAMEWORK_VS_DOWNSTREAM.md`
- `_docs/sprint/CRASH_RECOVERY.md`
- `_docs/sprint/MODE_RELATIONSHIP.md`
- `_docs/sprint/MODEL_ROUTING.md`
- `_docs/sprint/EXTERNAL_SERVICES.md`
- `_docs/sprint/TICKET_MODEL.md`
- `_docs/sprint/ISSUES_MD.md`
- `_docs/sprint/RALPH_LOOP.md`
- `_docs/phase0/adhoc-primitive-limits.md`
