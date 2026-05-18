# Acceptance Criteria — /sprint:full

**Sprint:** `SP-20260518-001`
**PRD:** `paths.sprintRequirements/SP-20260518-001/prd.md`

Each AC is a testable Given/When/Then linked to a granular story + ticket.

## S-1 — Orchestrator entry point

- **AC-1.1**: Given `paths.sprintFullAutonomy` exists and the operator is on a feature branch, when the operator runs `/sprint:full "test request"`, then `scripts/sprint/full.js` parses argv, loads the preset, emits `TR-1 sprint_full_started`, and enters Phase 1 (plan).
- **AC-1.2**: Given `paths.sprintFullAutonomy` is missing, when the operator runs `/sprint:full ...`, then the orchestrator exits 1 with a clear message naming the missing config path and exits before any helper is invoked.

## S-2 — Phase 1: plan invocation

- **AC-2.1**: Given a valid `<request>` arg, when Phase 1 runs, then a payload JSON is written to `.warpos/plan-payload-<slug>.json`, `scripts/sprint/plan.js --sprint <id> --payload <file>` is invoked, and on exit 0 a Plan Contract is present under `paths.sprintPlanContracts/`.
- **AC-2.2**: Given Plan Contract returns `plan_quality.status: needs_user_clarification`, when Phase 1 completes, then `/sprint:full` halts with COPY `C-2`, writes a halt report (S-9), and emits `TR-4 sprint_full_halt` with `halt_reason: plan_quality_fail`.

## S-3 — Phase 2a: design scaffold

- **AC-3.1**: Given Plan Contract scope.size = `m` and `--documentation-scale auto`, when Phase 2a runs, then `scripts/sprint/design.js` is invoked with `--documentation-scale m`, returns 0, and 10 template files exist under `paths.sprintRequirements/<SP-id>/`.

## S-4 — Phase 2b: hand-edit templates

- **AC-4.1**: After Phase 2b, when each template under `paths.sprintRequirements/<SP-id>/*.md` is read, then no `{{placeholder}}` strings remain and the legacy marker `<!-- requirement-format-legacy -->` is removed.
- **AC-4.2**: After Phase 2b, when `scripts/hooks/requirement-format-guard.js` is dispatched against each template, then it exits 0 (well-formed `R-N`/`S-N`/`H-N` ids only).

## S-5 — Phase 2c: mint tickets

- **AC-5.1**: Given N granular stories in `granular-stories.md`, when Phase 2c runs, then N ticket YAML files exist under `paths.sprintTickets/T-*.yaml` with `sprint: <SP-id>`, each linked to its `S-N`, `H-N`, `R-N`, `C-N`, `IN-N`, `TR-N`, `AC-N.M`.
- **AC-5.2**: After ticket minting completes, when `paths.sprintCurrent` is read, then every minted ticket id appears in the `ready_for_execution` bucket (not `proposed`).

## S-6 — Phase 3: execute

- **AC-6.1**: Given a ticket completes its Ralph loop with `stop_reason: completed`, when execute.js exits, then orchestrator continues to the next `ready_for_execution` ticket without operator input.
- **AC-6.2**: Given a ticket hits `stop_reason: repeated_failure` and preset = `moderate`, when execute.js stops, then orchestrator logs COPY `C-6`, marks ticket `deferred`, emits a `sprint_full_ticket_deferred` event, and continues to next ticket.
- **AC-6.3**: Given a ticket hits `stop_reason: approval_required` and the approval level is outside preset's `pre_authorized_approval_levels[]`, when execute.js stops, then orchestrator halts with COPY `C-4`, writes halt report (S-9), and emits `TR-4` with `halt_reason: approval_beyond_preset`.

## S-7 — Phase 4: release-prep

- **AC-7.1**: Given preset = `aggressive` and target = `staging`, when Phase 4 runs, then `release.js prepare` is invoked, `release.js check` returns 0, orchestrator auto-records approval and invokes `release.js approve`, status becomes `ready_to_deploy`, but `release.js deploy` is NEVER called.
- **AC-7.2**: Given preset = `moderate`, when Phase 4 reaches the approval step, then orchestrator halts with COPY `C-4` (release_approval_required is outside `moderate` pre-authorization), writes halt report, and emits `TR-4` with `halt_reason: approval_beyond_preset`.

## S-8 — Phase 5: retrospective

- **AC-8.1**: Given Phases 1-4 completed, when Phase 5 runs, then `scripts/sprint/retrospective.js --sprint <id> --signed-off-by alpha` is invoked, exits 0 (including the skeleton-fallback path), and `paths.sprintHistory/<SP-id>/retro.yaml` exists.

## S-9 — Halt-report writer

- **AC-9.1**: Given any halt fires, when the halt-report writer runs, then `paths.sprintFullReports/<SP-id>/halt-<ISO>.md` is created with all schema fields (phase, halt_reason, beta_verdict_if_any, autonomy_preset, resume_command, next_human_action, timestamp).
- **AC-9.2**: After halt-report write, when `paths.eventsFile` is tailed, then a `TR-4 sprint_full_halt` row exists referencing the halt-report path.

## S-10 — Final-report writer

- **AC-10.1**: Given all 5 phases completed without halt, when the final-report writer runs, then `paths.sprintFullReports/<SP-id>/sprint-full-report.md` exists with the schema in COPY `C-13` followed by a phase timeline (one row per phase: phase name, duration, helper exit code, auto_approvals_recorded count).

## S-11 — Autonomy preset schema

- **AC-11.1**: Given `schemas/sprint/sprint-full-autonomy.schema.json` exists, when a preset file is loaded, then schema validation passes for all three default presets (conservative/moderate/aggressive).
- **AC-11.2**: Given a malformed preset (e.g., `pre_authorized_approval_levels: ["production_release_approval"]`), when validation runs, then it fails with a clear error AND the orchestrator refuses to start.

## S-12 — Default presets config

- **AC-12.1**: After config write, when each default preset is loaded and validated, then validation passes AND `hard_ceilings[]` is identical across all three presets (read-only enum).
- **AC-12.2**: Given preset `moderate`, when `pre_authorized_approval_levels[]` is inspected, then `release_approval_required`, `production_release_approval`, and `paid_service_approval` are absent.

## S-13 — Path registry additions

- **AC-13.1**: After path registry update, when `node scripts/paths/doctor.js` (or equivalent) runs, then `sprintFullAutonomy` and `sprintFullReports` resolve to existing paths, AND no literal-string references to those paths remain in `scripts/sprint/full.js` or `.claude/commands/sprint/full.md` (path-guard passes).

## S-14 — Cost-estimate halt gate

- **AC-14.1**: Given cumulative cost estimate exceeds threshold mid-Phase 3, when the next phase boundary is reached, then orchestrator halts with COPY `C-7`, writes halt report, and emits `TR-4` with `halt_reason: cost_threshold`.
- **AC-14.2**: Given a prior cost-estimate halt, when operator resumes with `--cost-acknowledged`, then threshold is raised to 2× the preset value FOR THIS RUN ONLY, preset config on disk is unchanged.

## S-15 — Beta consultation cadence

- **AC-15.1**: Given mode = `adhoc`, when each phase boundary is reached, then SendMessage to Alex β is dispatched, the verdict is logged to `paths.betaEvents`, and `TR-7 sprint_full_beta_consultation` is emitted.
- **AC-15.2**: Given Beta returns ESCALATE at any boundary, when the orchestrator processes the verdict, then it halts with COPY `C-5`, writes halt report, emits `TR-4` with `halt_reason: beta_escalate`, regardless of preset.

## S-16 — Skill body

- **AC-16.1**: After skill body write, when `.claude/commands/sprint/full.md` is read, then it documents all 11 inputs (IN-1..IN-11), all 14 COPY blocks, all 11 TRACE events, the autonomy preset semantics, and the relationship to /sprint:plan / /sprint:design / /sprint:execute / /sprint:release / /sprint:retrospective.

## S-17 — AUTONOMY doc

- **AC-17.1**: After doc write, when `_docs/sprint/AUTONOMY.md` is read, then it explains in plain English what each preset does, enumerates hard ceilings, defines the halt taxonomy, and shows at least one example of a custom preset.

## S-18 — Workflow + OVERVIEW updates

- **AC-18.1**: After update, when `.claude/project/reference/sprint-workflow.md` and `_docs/sprint/OVERVIEW.md` are read, then `/sprint:full` is introduced as the autonomous front door, per-phase commands remain documented as manual path, and a decision tree (when to use which) is present.

## S-19 — Integration test harness

- **AC-19.1**: Given a happy-path xs-scoped synthetic request, when `test-sprint-full.js` runs scenario (a), then the orchestrator reaches `done` and emits `TR-5 sprint_full_done`.
- **AC-19.2**: Given a synthetic request that produces `plan_quality: needs_user_clarification`, when scenario (b) runs, then orchestrator halts with `halt_reason: plan_quality_fail`.
- **AC-19.3**: Given a synthetic ESD with `signup: true`, when scenario (c) runs, then orchestrator halts with `halt_reason: esd_signup`.
- **AC-19.4**: Given a mocked Beta returning ESCALATE, when scenario (d) runs, then orchestrator halts with `halt_reason: beta_escalate`.
- **AC-19.5**: Given a synthetic ticket carrying `approval_required: true` at level `production_release_approval`, when scenario (e) runs with preset `moderate`, then orchestrator halts with `halt_reason: approval_beyond_preset`.

## S-20 — Branch protection guard

- **AC-20.1**: Given current branch = `main`, when operator runs `/sprint:full "..."` without `--allow-main`, then orchestrator exits non-zero with COPY `C-11`, emits `TR-11 sprint_full_branch_protection_blocked`, and never invokes any phase helper.
