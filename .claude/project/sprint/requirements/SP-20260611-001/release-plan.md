# Release Plan — Cross-family findings fix sprint — 6 gemini re-review findings (epsilon-runtime spawn race, fallback ENFORCE brick, hardcoded BUILD_CHAIN_ROLES, spoofed-ts window, sprint_id correlation, verifyGauntlet parse refusal)

**Sprint:** `SP-20260611-001`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260611-001\prd.md`

> Honored by `/sprint:release`. Lists the conditions under which the
> sprint may ship.

## Required to ship

- [ ] All `done` tickets meet their AC.
- [ ] All blocking issues are resolved, deferred, or explicitly accepted.
- [ ] PRD requirements satisfied.
- [ ] COPY satisfied per `copy.md`.
- [ ] INPUTS satisfied per `inputs.md`.
- [ ] TRACE entries fire as documented in `trace.md`.
- [ ] Acceptance criteria satisfied per `acceptance-criteria.md`.
- [ ] QA plan passing per `qa-plan.md`.
- [ ] Redteam plan passing per `redteam-plan.md`.
- [ ] External service dependencies ready, mocked, integrated, or
      deferred with rationale.
- [ ] Required env vars present (names checked; values never logged).
- [ ] Release approval recorded in `approvals/`.

## Release artifacts

- [ ] Changelog / release notes drafted
- [ ] Docs updated
- [ ] Analytics/events updated where applicable
- [ ] Migration plan (or `none_required` annotated)
- [ ] Rollback plan (or `none_required` annotated)

## Monitoring after release

- [ ] Next real ε-conducted sprint: confirm no parent-SIGTERM reaps (death records all graceful, elapsed_ms < parent bound)
- [ ] Next /scan:full: sprint-hook-coverage + sprint-manager-consult emit no new findings on the real ledger; any discarded-outlier notes investigated (a discard = someone wrote a bad ts)

## Approval

Production deploy requires explicit user approval per
`CLAUDE.md#Autonomy`. Record the approval id in
`releases/<id>.yaml#approval_ref`.

## Documentation scaling

Required for `documentation_scale: m | l | xl`. For xs/s, ship-gate may
be a single block inside the QA plan.
