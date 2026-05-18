# Release Plan — Sprint Goal Verification

**Sprint:** `SP-20260518-007`
**PRD:** `prd.md`

> Honored by `/sprint:release`. Sprint A is the sprint that adds the cited-test ship-gate — its own release dogfoods that gate.

## Required to ship

- [ ] All Sprint A tickets are `done`, `released`, `deferred`, or `abandoned`.
- [ ] All blocking issues are resolved, deferred, or explicitly accepted.
- [ ] PRD requirements R-1..R-11 satisfied (see `prd.md`).
- [ ] COPY strings match `copy.md` exactly.
- [ ] INPUTS handle as documented in `inputs.md` (`goal_verification` payload, fixture YAML, `--documentation-scale`, `--json` flag, decision-ledger override row).
- [ ] TRACE entries fire as documented (`TR-1` through `TR-6`).
- [ ] Acceptance criteria `AC-1.1.1` through `AC-6.1.1` all satisfied per `acceptance-criteria.md`.
- [ ] QA plan passing per `qa-plan.md` — including the dogfood block (every Sprint A AC is `verified_by:` an actual fixture under `tests/regression/SP-20260518-007/`).
- [ ] Red-team plan passing per `redteam-plan.md` — no live gate-bypass paths.
- [ ] External service dependencies: N/A (none for Sprint A).
- [ ] Required env vars: N/A.
- [ ] Release approval recorded in `paths.sprintApprovals/`.

## Execution ordering (Beta directive 2026-05-18 design-review)

Sprint A's tickets each author both the implementation **and** the cited-test fixture under `tests/regression/SP-20260518-007/`. The fixtures must exist before the dogfood ship-gate fires at `/sprint:release`. Per Beta directive (agent `a6eadba65750a3d06`), this is a **sequential dependency**, not a circular one:

1. Per ticket: author the code under `scripts/`, `schemas/`, `.claude/`, etc. + the cited-test fixture under `tests/regression/SP-20260518-007/`. Both in the same ticket; fixture commit can precede or follow code commit.
2. After all tickets are `done`: run `/sprint:release prepare` then `release.js check`. The cited-test executor (R-6 / T-20260518-108) reads the AC markdown, finds every `verified_by:` line, locates each fixture, executes it, and aggregates.
3. Sprint A is allowed to ship only when its own dogfood ship-gate returns `acceptance_criteria_satisfied: true`.

If any ticket completes without authoring its cited fixture, the dogfood ship-gate fails closed (`AC-2.3.2`) — the sprint cannot release until the gap is closed. This is the load-bearing rule applied to Sprint A itself.

## Sprint-A-specific ship-gate (dogfood)

The new cited-test executor (R-6) runs against Sprint A's own AC corpus before release advances:

- [ ] `node scripts/sprint/release.js check --id <RL-id>` returns `acceptance_criteria_satisfied: true`.
- [ ] No cited test in `tests/regression/SP-20260518-007/*.test.js` is `inconclusive`.
- [ ] No decision-ledger override row exists for Sprint A's release (we ship clean; overrides become available to *future* sprints, not us).

## Release artifacts

- [ ] Changelog drafted summarizing: `goal_verification` field, fixture corpus convention, AC `verified_by:` linkage, design-time fixture gate, release ship-gate cited-test executor, `/check:ac-coverage` skill, `/linters:run` wiring, retro annotation, `/sprint:full` preset note.
- [ ] Docs updated: `sprint-workflow.md` reference doc (R-9), four sprint skill bodies (R-9 / S-6.1), AC template (R-4).
- [ ] Analytics/events updated where applicable — `paths.eventsFile` event types `sprint-design-fixture-gate-refused`, `sprint-release-cited-test-result`, `sprint-release-inconclusive-override`, `check-ac-coverage-run`, `sprint-retro-verification-status`.
- [ ] Migration plan — none required. Additive schema fields; closed sprints exempt; design gate fully gated on `goal_verification` presence.
- [ ] Rollback plan — revert the additive schema field, the design-gate logic, the release-gate executor, the new skill, the `/linters:run` discoverer extension, the workflow doc section, the retro annotation, the preset note. No data migration to undo.

## Monitoring after release

- [ ] Watch `paths.eventsFile` for the first `sprint-design-fixture-gate-refused` event in the next active sprint — confirms the gate is live in the wild.
- [ ] Watch `paths.decisionLedger` for any `release_override_inconclusive_test` entries — first occurrence reveals the actual bypass-pattern signal Beta wanted to observe before flag-shipping.
- [ ] Watch `/check:ac-coverage` invocations via `paths.eventsFile` — adoption signal.
- [ ] If a downstream `/warp:update` operator reports `/sprint:design` refusing on a pre-Sprint-A Plan Contract, that's a backward-compat regression — investigate immediately.

## Approval

Production deploy requires explicit user approval per `CLAUDE.md#Autonomy`. Internal-canary releases also require explicit approval (precedent: SP-20260518-001). Record the approval id in `releases/<RL-id>.yaml#approval_ref`.

## Documentation scaling

Required for `documentation_scale: m | l | xl`. Sprint A is `m`.
