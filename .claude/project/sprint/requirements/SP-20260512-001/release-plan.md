# Release plan — Multi-sprint parallelism

**Sprint:** `SP-20260512-001`
**PRD:** `prd.md`

Honored by `/sprint:release`. Lists conditions under which this sprint may ship.

## Required to ship

- [ ] All 18 tickets (`T-001` … `T-018`) in `done` status, each meeting their linked ACs.
- [ ] All blocking issues resolved, deferred (with rationale), or explicitly accepted.
- [ ] PRD requirements `R-1` … `R-8` satisfied.
- [ ] COPY satisfied per `copy.md` — all 10 strings appear verbatim in the appropriate emit sites.
- [ ] INPUTS satisfied per `inputs.md` — every flag validates as declared.
- [ ] TRACE events `TR-1` … `TR-7` fire as documented (verified by grep against `paths.eventsFile` after the two-sprint smoke).
- [ ] Acceptance criteria satisfied per `acceptance-criteria.md`.
- [ ] QA plan green per `qa-plan.md`, including both gates (`G-MIGRATION-VERIFY`, `G-TWO-SPRINT-SMOKE`).
- [ ] Redteam plan green per `redteam-plan.md`, including all 10 sprint-specific probes (`A-1` … `A-10`).
- [ ] No new ESDs declared (sprint confirmed `none_expected` in Plan Contract).
- [ ] No required env vars added.
- [ ] Migration approval recorded in `paths.sprintApprovals/` (the legacy-delete confirmation from `G-MIGRATION-VERIFY`).
- [ ] ADR file written under `paths.policy/adr/0002-multi-sprint-parallel-lanes.md` (S-18 / Beta `OPEN_ADR: true` flag).

## Release artifacts

- [ ] Changelog entry under `_docs/sprint/` (e.g. `CHANGELOG_v0.2.md`) describing the layout change, the `--sprint` flag, the lane model, and the migration path.
- [ ] `_docs/sprint/LANES.md` written (S-17 / T-016).
- [ ] Four existing sprint docs updated (S-17 / T-016).
- [ ] `paths.sprintReference` (`sprint-workflow.md`) updated with "Lanes & parallel sprints" section (T-017).
- [ ] Migration plan = the migration script + `G-MIGRATION-VERIFY` checklist (this IS the plan; no separate doc needed).
- [ ] Rollback plan = `git revert <merge-sha>` + `migrate-v0.2.js --rollback` (must be implemented as part of T-006). Rollback restores the legacy singleton files from the script's pre-migration backup directory.

## Monitoring after release

- [ ] First downstream consumer to run the new init: confirm `active-sprints.yaml` is created.
- [ ] First two-sprint user: confirm `/sprint:status` renders correctly and conflict-check fires as expected.
- [ ] Watch `paths.eventsFile` for `TR-3` (warm-up dispatch) — confirm it fires on every worktree-lane execute.
- [ ] Watch for any `sprint.conflict_check.run` rows with `allow_overlap: true` — if frequent, surface a `/learn:integrate` candidate.

## Approval

This sprint changes framework internals only. No production user-facing surface deploys, no paid service signup, no PII handling.

- **Migration approval** (recorded by `G-MIGRATION-VERIFY`): operator confirms before legacy files are deleted from `paths.sprintRoot`. Required.
- **Sprint release approval** (standard `/sprint:release` gate): user approves the sprint closure. Required.
- **Framework promotion** (`/warp:release` to canonical): NOT part of this sprint. Will be a separate user-driven action after this sprint closes. The standard `/warp:release` flow handles its own approval.

Record each approval id in `releases/<RL-id>.yaml#approval_ref`.

## Documentation scaling

Required at `documentation_scale: m`. Already at the right cut.
