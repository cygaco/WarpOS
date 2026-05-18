# TRACE Requirements — /sprint:full

**Sprint:** `SP-20260518-001`
**PRD:** `paths.sprintRequirements/SP-20260518-001/prd.md`

Observability hooks emitted by the orchestrator. Every event lands in `paths.eventsFile` with schema `warpos/sprint-full/<event>/v1`.

## Trace Map

| Source | Requirement | Story | COPY | INPUT | ESD | Ticket | Code | Test | Release | Learning |
|---|---|---|---|---|---|---|---|---|---|---|
| user request | R-1 | S-1 | C-1, C-12 | IN-1 | — | T-… | scripts/sprint/full.js | scripts/sprint/test-sprint-full.js | RL-… | — |
| preset config | R-2 | S-11 | — | IN-2, IN-11 | — | T-… | scripts/sprint/full.js + sprint-full-autonomy.schema.json | scripts/sprint/test-sprint-full.js | — | — |
| hard ceilings | R-3 | S-11 | C-8, C-9, C-10 | — | — | T-… | scripts/sprint/full.js | scripts/sprint/test-sprint-full.js | — | L-N (future) |
| halt report | R-4 | S-9 | C-2..C-7, C-11, C-14 | — | — | T-… | scripts/sprint/full.js | scripts/sprint/test-sprint-full.js | — | — |
| beta cadence | R-5 | S-15 | C-5 | IN-5 | — | T-… | scripts/sprint/full.js | scripts/sprint/test-sprint-full.js | — | — |
| cost gate | R-6 | S-14 | C-7 | IN-9 | — | T-… | scripts/sprint/full.js | scripts/sprint/test-sprint-full.js | — | — |
| resume | R-7 | S-7 | — | IN-7 | — | T-… | scripts/sprint/full.js | scripts/sprint/test-sprint-full.js | — | — |
| branch guard | R-11 | S-20 | C-11 | IN-8 | — | T-… | scripts/sprint/full.js | scripts/sprint/test-sprint-full.js | — | — |

## TR-1 — `sprint_full_started`

**Event:** orchestrator boot
**When:** after CLI parse + preset load + branch guard pass
**Captured fields:** `sprint_id`, `preset_name`, `scope`, `documentation_scale`, `mode`, `request_hash`, `branch`, `started_at`
**Linked requirement:** `R-1`
**Linked story:** `S-1`
**Why we capture this:** Every run starts here. Lets us count runs, distribution across presets, and tie subsequent halt/done events back to the kickoff.

## TR-2 — `sprint_full_phase_started`

**Event:** phase transition begin
**When:** before any work in the new phase
**Captured fields:** `sprint_id`, `phase` (plan|design|execute|release-prep|retro), `phase_index`, `cumulative_cost_estimate`, `ts`
**Linked requirement:** `R-1`
**Linked story:** `S-1`
**Why we capture this:** Final-report timeline reads these to compute per-phase durations and check that all 5 phases ran.

## TR-3 — `sprint_full_phase_completed`

**Event:** phase transition end
**When:** after a phase's underlying helper exits 0 AND post-phase Beta consultation (if adhoc) returns non-ESCALATE
**Captured fields:** `sprint_id`, `phase`, `duration_ms`, `helper_exit_code`, `auto_approvals_recorded` (count)
**Linked requirement:** `R-1`
**Linked story:** `S-1`
**Why we capture this:** Lets us measure pipeline drag per phase and detect drift between expected and actual helper behavior.

## TR-4 — `sprint_full_halt`

**Event:** halt fires
**When:** any halt condition triggers (any phase)
**Captured fields:** `sprint_id`, `phase`, `halt_reason` (enum: plan_quality_fail, esd_signup, approval_beyond_preset, beta_escalate, cost_threshold, repeated_failure_threshold, scope_expansion, destructive, unclear_intent, branch_protection, ceiling_breach), `resume_command`, `beta_verdict` (if any), `halt_report_path`
**Linked requirement:** `R-4`
**Linked story:** `S-9`
**Why we capture this:** Halt taxonomy is the primary signal for tuning autonomy presets. Cross-run aggregation feeds `/check:patterns`.

## TR-5 — `sprint_full_done`

**Event:** terminal success
**When:** all 5 phases completed, no halts
**Captured fields:** `sprint_id`, `total_duration_ms`, `tickets_done`, `tickets_deferred`, `tickets_abandoned`, `beta_consultations`, `auto_approvals_total`, `cumulative_cost_estimate`, `report_path`
**Linked requirement:** `R-1`
**Linked story:** `S-10`
**Why we capture this:** Success counter. Lets us measure "operator-time saved per run" and detect quality drift (deferred ratio creeping up).

## TR-6 — `sprint_full_auto_approval`

**Event:** orchestrator records an approval within its pre-authorization window
**When:** any phase, before continuing past an approval-required ticket/ESD/release record
**Captured fields:** `sprint_id`, `approval_level`, `pre_authorized_by_preset`, `linked_ticket_or_release`, `ts`
**Linked requirement:** `R-2`, `R-12`
**Linked story:** `S-6`, `S-7`
**Why we capture this:** Audit trail of every auto-decision. Operator must be able to retroactively review what was approved on their behalf.

## TR-7 — `sprint_full_beta_consultation`

**Event:** orchestrator dispatches SendMessage to Alex β at a phase boundary
**When:** before each of 4 phase boundaries (adhoc mode only)
**Captured fields:** `sprint_id`, `phase_boundary` (plan_to_design|design_to_execute|before_release|before_retro), `beta_verdict` (DECIDE|DIRECTIVE|ESCALATE), `topic_tags` (array including `sprint_full_phase_boundary`), `ts`
**Linked requirement:** `R-5`
**Linked story:** `S-15`
**Why we capture this:** Closes the audit loop on Beta's role. Cross-references with `paths.betaEvents` to verify ESCALATE is never silenced.

## TR-8 — `sprint_full_ceiling_breach_attempt`

**Event:** orchestrator detects a hard-ceiling violation attempt
**When:** any phase attempts `push_to_remote` / `production_deploy` / `paid_service_signup` / `destructive_migration` / `secret_to_remote`
**Captured fields:** `sprint_id`, `ceiling` (enum), `attempted_action_summary`, `preset_name`, `ts`
**Linked requirement:** `R-3`
**Linked story:** `S-11`
**Why we capture this:** Security signal. Even one ceiling-breach-attempt should be investigated — it means a helper tried to do something it should never do. May reveal a regression in a downstream helper.

## TR-9 — `sprint_full_cost_estimate_update`

**Event:** cumulative cost counter incremented at a phase boundary
**When:** after each phase completes
**Captured fields:** `sprint_id`, `phase`, `phase_estimate_usd`, `cumulative_estimate_usd`, `threshold_usd`
**Linked requirement:** `R-6`
**Linked story:** `S-14`
**Why we capture this:** Calibrate the coarse cost estimator over time. If actual cost wildly differs from estimate, the multiplier needs tuning.

## TR-10 — `sprint_full_resume`

**Event:** `--resume` invocation succeeded in reconstructing prior state
**When:** orchestrator start, when `--resume` is set
**Captured fields:** `sprint_id`, `resumed_from_phase`, `prior_halt_reason`, `prior_halt_at` (iso), `ts`
**Linked requirement:** `R-7`
**Linked story:** `S-7`
**Why we capture this:** Resume reliability metric. If `resumed_from_phase` doesn't match `prior_halt_phase`, the resume path has a bug.

## TR-11 — `sprint_full_branch_protection_blocked`

**Event:** orchestrator refused to start due to current branch == main/master
**When:** boot-time branch check, before any phase
**Captured fields:** `sprint_id`, `current_branch`, `allow_main_set` (bool), `preset_name`, `ts`
**Linked requirement:** `R-11`
**Linked story:** `S-20`
**Why we capture this:** If this fires repeatedly we know operators are forgetting to switch branches — opportunity for a hook that auto-creates `sprint/<SP-id>` branch.
