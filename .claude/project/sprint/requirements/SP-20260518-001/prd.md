# PRD — /sprint:full — autonomous sprint orchestrator chaining plan→design→execute→release-prep→retro

**Sprint:** `SP-20260518-001`
**Plan Contract:** `PC-20260518-0010`
**Status:** draft
**Documentation scale:** `m`

## Outcome

Operator types `/sprint:full "<request>"` once. The system writes a Plan Contract, scaffolds the requirements bundle, mints tickets, runs Ralph loops, prepares a release record, and writes a retrospective — without further keyboard input — UNLESS it hits a pre-declared halt condition (Class B/C decision outside preset, approval beyond preset's pre-authorization, Beta ESCALATE, production deploy, ESD requiring signup/billing/credentials, repeated-failure threshold). On halt, the skill writes a structured halt report and surfaces a single resume command.

## Context

### Original request

> A sprint:full command that goes through all sprint phases automatically, without a human needed to initiate each sprint command or to give approvals.

### Interpreted intent

Add a meta-orchestrator skill `/sprint:full` that takes a single plain-language request, chains the existing sprint phases (plan → design → execute → release-prep → retrospective) without per-command operator input, and pre-authorizes the in-flight approval gates within a clearly bounded autonomy preset. Hard ceilings from CLAUDE.md autonomy table (push to remote, paid services, production deploy, destructive migrations, secret handling) remain non-bypassable regardless of preset. The skill is composition over duplication: it shells out to scripts/sprint/{plan,design,ticket,external-service,execute,release,retrospective}.js rather than reimplementing their logic.

### Current behavior

Sprint pipeline today requires 5+ explicit operator invocations: /sprint:plan, /sprint:design, /sprint:execute, /sprint:release, /sprint:retrospective. Each command stops at gates that require operator input (approval records, ESD setup, scope decisions). Beta is consulted per-skill in adhoc mode. The pipeline is crash-safe (per-phase checkpoints + ralph state) and routing-traced (auto-recorded in each helper). But there is no single entry point that drives the pipeline autonomously. `/loop` with a sequence command does not encode policy or halt behavior.

### Desired behavior

`/sprint:full "<request>" [--autonomy moderate|conservative|aggressive] [--scope minimal_safe|recommended|expanded] [--documentation-scale auto|xs|s|m|l|xl] [--mode solo|adhoc] [--sprint <SP-id>] [--resume]` executes the full sprint pipeline in a single invocation. Phase transitions are automatic. Approval gates are auto-satisfied when within the preset's pre-authorization. Beta is consulted at the same gates as today; ESCALATE halts. Hard ceilings are never bypassed regardless of preset. On any halt, writes a structured halt report and surfaces a single resume command. On completion, writes a full `sprint-full-report.md` timeline.

## Requirements

- **R-1** — Orchestration state machine: `plan → design → execute → release-prep → retro` with explicit halt states (`halted:<reason>`) and a `done` terminal state. Each transition emits a `paths.eventsFile` row. Crash recovery reconstructs the current phase from `paths.sprintProgress`.
- **R-2** — Autonomy preset schema and default config. Three presets (`conservative`, `moderate` default, `aggressive`). Preset declares: `pre_authorized_approval_levels[]`, `stop_condition_policy{}`, `halt_threshold_failed_tickets_pct`, `cost_estimate_threshold_usd`. Preset MAY NOT lift hard ceilings.
- **R-3** — Hard-ceiling enforcement: a hardcoded enum inside `scripts/sprint/full.js` of NEVER-bypassable actions (`push_to_remote`, `paid_service_signup`, `production_deploy`, `destructive_migration`, `secret_to_remote`). Hard-ceiling violation attempts halt immediately and log a `ceiling_breach_attempt` event regardless of preset.
- **R-4** — Halt report format: `paths.sprintFullReports/<SP-id>/halt-<ISO>.md` containing `phase`, `halt_reason`, `beta_verdict_if_any`, `autonomy_preset`, `resume_command`, `next_human_action`, `timestamp`. Operator can read one file to understand what gate fired.
- **R-5** — Beta consultation cadence (adhoc mode only): consult Beta at every phase boundary (plan→design, design→execute, before release-prep, before retro). Each consultation logged to `paths.betaEvents` with `data.topic_tags` including `sprint_full_phase_boundary`. ESCALATE is a HARD HALT regardless of preset.
- **R-6** — Cost-estimate halt gate: track LLM-spend estimate across phase invocations (coarse counter — phase count × phase-typical-spend). Halt + ask operator if cumulative estimate exceeds the preset's `cost_estimate_threshold_usd` (default $5 per CLAUDE.md autonomy table). Operator can resume with `--cost-acknowledged`.
- **R-7** — Crash recovery: `/sprint:full --sprint <SP-id> --resume` reads `paths.sprintProgress`, identifies `current_phase`, and continues from the next phase boundary (does NOT restart the failed phase mid-state; the per-phase helpers own intra-phase resume).
- **R-8** — Integration tests: `scripts/sprint/test-sprint-full.js` exercises 5 scenarios — (a) happy path xs-scoped run, (b) halt on `plan_quality=needs_user_clarification`, (c) halt on ESD with `signup: true`, (d) halt on Beta ESCALATE, (e) halt on approval level outside preset.
- **R-9** — Documentation: skill body `.claude/commands/sprint/full.md`, plain-English autonomy doc `_docs/sprint/AUTONOMY.md`, plus updates to `paths.sprintReference` and `_docs/sprint/OVERVIEW.md` introducing `/sprint:full` as the autonomous front door (per-phase commands remain documented as manual path).
- **R-10** — Path registry additions: `paths.sprintFullAutonomy` (autonomy preset config) and `paths.sprintFullReports` (run reports). Skill body and orchestrator MUST reference via `paths.*` tokens — path-guard enforces.
- **R-11** — Branch protection: orchestrator refuses to start when current branch is `main`/`master` unless `--allow-main` is passed AND preset is `aggressive`. Default behavior: halt with COPY `C-11`.
- **R-12** — Release-prep auto-approval boundary: in `moderate` preset, `release_approval_required` is HARDCODED as non-auto-approvable (only `aggressive` preset opts in, and only for non-production targets — staging/internal-canary). Even `aggressive` cannot auto-approve production release.

## Non-goals

- Reimplementing plan/design/execute/release/retro logic — strict composition over duplication.
- Auto-deploying to production — hard ceiling, never bypassable, even in `aggressive` preset.
- Auto-signing up for paid services — hard ceiling.
- Auto-pushing to remote — hard ceiling; orchestrator commits but never pushes.
- Replacing `/sprint:plan` as the front door — `/sprint:plan` remains available for explicit per-phase control.
- Adding new phases (e.g., `design-review`, `qa-isolation`) — scope is exactly the existing 5 phases.
- Adding new stop conditions to `execute.js` — orchestrator reuses the existing 9.
- Changing Beta's role — Beta is consulted at the same gates as today.
- Bypassing the routing-trace coverage gate at release time — coverage report must still pass.
- Cross-sprint orchestration (running 3 sprints in parallel from one prompt) — single-sprint only in v0.1.
- Building a UI for autonomy preset editing — config file is operator-editable; no UI.
- Auto-promoting retro `action_items` into a new sprint plan — operator decides what enters the next sprint.
- Backporting `/sprint:full` to v0.1 sprint installations — forward-only.

## Affected surfaces

| Surface | Evidence Level | Notes |
|---|---|---|
| `.claude/commands/sprint/full.md` (new) | assumed_from_request | User-invocable skill body. Mode-aware. |
| `scripts/sprint/full.js` (new) | assumed_from_request | Orchestrator script. ~400 LOC. Phase state machine. |
| `schemas/sprint/sprint-full-autonomy.schema.json` (new) | assumed_from_request | Preset bundle schema. |
| `.claude/agents/00-alex/.system/policy/sprint-full-autonomy.json` (new) | assumed_from_request | Default presets (conservative/moderate/aggressive). |
| `scripts/sprint/plan.js` | verified_from_repo | Reuse via subprocess. Stable `--payload` contract. |
| `scripts/sprint/design.js` | verified_from_repo | Reuse with auto-derived `--documentation-scale`. |
| `scripts/sprint/ticket.js` | verified_from_repo | Reuse for create+update. Bucket-bleed guard satisfied. |
| `scripts/sprint/external-service.js` | verified_from_repo | Reuse for ESD gate. Halts on signup/billing. |
| `scripts/sprint/execute.js` | verified_from_repo | Reuse. Stop conditions mapped to preset policy. |
| `scripts/sprint/release.js` | verified_from_repo | Reuse for prepare+check+report. NEVER deploy. |
| `scripts/sprint/retrospective.js` | verified_from_repo | Reuse with `--signed-off-by alpha`. |
| `scripts/sprint/checkpoint.js` | verified_from_repo | Reuse for crash-safe progress at every boundary. |
| `scripts/sprint/routing.js` | verified_from_repo | Reuse for trace recording. No new routing logic. |
| `scripts/hooks/sprint-routing-guard.js` | verified_from_repo | No change. Same Edit/Write surface. |
| `.claude/agents/00-alex/beta.md` | verified_from_repo | Reuse SendMessage pattern. ESCALATE halts. |
| `.claude/agents/00-alex/.system/policy/decision-policy.md` | verified_from_repo | Read by Beta. Class C always halts. |
| `.claude/agents/00-alex/.system/policy/current-stage.md` | verified_from_repo | Beta reads. Informs verdicts. |
| `.claude/project/reference/sprint-workflow.md` | verified_from_repo | Add `/sprint:full` section. Cross-link AUTONOMY. |
| `_docs/sprint/AUTONOMY.md` (new) | assumed_from_request | Plain-English preset + ceiling docs. |
| `_docs/sprint/OVERVIEW.md` | verified_from_repo | Introduce `/sprint:full` as autonomous front door. |
| `.claude/paths.json` | verified_from_repo | Add `sprintFullAutonomy` + `sprintFullReports`. |
| `scripts/sprint/test-sprint-full.js` (new) | assumed_from_request | Integration test harness. 5 scenarios. |

## External service dependencies

None expected. /sprint:full shells out to existing scripts which already use configured LLM providers via the dispatch-agent route. No new third-party services. See `paths.sprintExternalServices/` for any future additions.

## Approval boundaries

Surfaced by Plan Contract `approval_boundaries` — must be recorded before `/sprint:execute` runs the dependent tickets:

1. **AP — Auto-approval schema** (`schemas/sprint/sprint-full-autonomy.schema.json` + default config). Operator must approve the enumeration of which approval levels are pre-authorized in each preset BEFORE shipping. Defaults proposed: `moderate` pre-authorizes `none_required` + `low_risk_design_approval`; `aggressive` adds `medium_risk_execution_approval` + `staging_release_approval`; neither pre-authorizes `production_release_approval` or `paid_service_approval`.
2. **AP — Cost ceiling threshold** (default $5 per CLAUDE.md autonomy table). Operator must approve the threshold value. Mechanism: coarse phase-count × phase-typical-spend counter; soft halt with `--cost-acknowledged` resume.
3. **AP — Auto-defer on `repeated_failure`** (3-attempt rule). Operator must confirm "defer + move on" is preferred over "halt + ask" as default behavior.
4. **AP — Branch protection refuse on `main`** (require `--allow-main` + `aggressive` preset to override). Operator must confirm this default.

## Linked artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260518-0010.yaml`
- High-level stories: `paths.sprintRequirements/SP-20260518-001/high-level-stories.md`
- Granular stories: `paths.sprintRequirements/SP-20260518-001/granular-stories.md`
- COPY: `paths.sprintRequirements/SP-20260518-001/copy.md`
- INPUTS: `paths.sprintRequirements/SP-20260518-001/inputs.md`
- TRACE: `paths.sprintRequirements/SP-20260518-001/trace.md`
- Acceptance criteria: `paths.sprintRequirements/SP-20260518-001/acceptance-criteria.md`
- QA plan: `paths.sprintRequirements/SP-20260518-001/qa-plan.md`
- Redteam plan: `paths.sprintRequirements/SP-20260518-001/redteam-plan.md`
- Release plan: `paths.sprintRequirements/SP-20260518-001/release-plan.md`
