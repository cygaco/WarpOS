# Release Plan — /sprint:full

**Sprint:** `SP-20260518-001`
**PRD:** `paths.sprintRequirements/SP-20260518-001/prd.md`

Honored by `/sprint:release`. Conditions under which this sprint may ship.

## Required to ship

- [ ] All 20 granular-story tickets are `done` or `released` (no `in_progress`, `blocked`, `qa_failed`, `redteam_failed`).
- [ ] All blocking issues are resolved, deferred, or explicitly accepted via an approval record.
- [ ] PRD requirements R-1 through R-12 satisfied.
- [ ] COPY blocks C-1 through C-14 implemented byte-for-byte.
- [ ] INPUTS IN-1 through IN-11 validated per `inputs.md`.
- [ ] TRACE events TR-1 through TR-11 fire as documented.
- [ ] Acceptance criteria AC-1.1 through AC-20.1 satisfied.
- [ ] QA plan passing per `qa-plan.md` (all per-story + cross-cutting checks green).
- [ ] Redteam plan passing per `redteam-plan.md` (no critical/high findings unresolved; medium/low documented with rationale).
- [ ] No external service dependencies introduced; `external-services/` still empty for this sprint.
- [ ] Required env vars: NONE introduced.
- [ ] 4 approval records (`AP-…`) for approval_boundaries from the Plan Contract are recorded with `state: approved`:
  - AP — Auto-approval schema (which levels per preset)
  - AP — Cost-ceiling threshold default
  - AP — Auto-defer on repeated_failure
  - AP — Branch-protection refuse on main
- [ ] Release approval recorded in `approvals/AP-….yaml` with `level: release_approval_required`, `state: approved`.

## Release artifacts

- [ ] Changelog / release notes drafted (suggested entry: "feat(sprint): /sprint:full — single-invocation sprint pipeline with bounded autonomy presets").
- [ ] Docs updated:
  - `_docs/sprint/AUTONOMY.md` (new)
  - `_docs/sprint/OVERVIEW.md` (introduces /sprint:full)
  - `.claude/project/reference/sprint-workflow.md` (front-door positioning)
  - Skill body `.claude/commands/sprint/full.md`
- [ ] Analytics/events updated: TR-1..TR-11 documented in `_docs/sprint/EVENTS.md` (or equivalent).
- [ ] Migration plan: NONE required (additive feature, no schema change to existing sprint artifacts).
- [ ] Rollback plan: NONE required (skill + script are removable without affecting per-phase commands).

## Monitoring after release

- [ ] `paths.eventsFile` aggregator counts `TR-4 sprint_full_halt` rows per week. Spike → preset tuning needed.
- [ ] `paths.eventsFile` aggregator counts `TR-8 sprint_full_ceiling_breach_attempt` rows per week. ANY non-zero count → investigate (should be zero in normal use).
- [ ] `paths.betaEvents` shows `topic_tags: [sprint_full_phase_boundary]` on every adhoc-mode `/sprint:full` run. Missing → Beta cadence bug.
- [ ] `paths.sprintFullReports/` accumulates per-run reports. Operator manually reviews first 5 runs to validate halt taxonomy is meaningful.
- [ ] Compare cost-estimate vs actual API spend across first 10 runs. Drift > 25% → calibrate the coarse estimator.

## Approval

Production deploy requires explicit user approval per `CLAUDE.md#Autonomy`. Record the approval id in `releases/<RL-id>.yaml#approval_ref`. `/sprint:release` halts at the deploy step; user invokes the actual `release.js deploy` manually.

## Documentation scaling

Required for `documentation_scale: m | l | xl`. For xs/s, the ship-gate may be a single block inside the QA plan.
