# Release Plan — Lanes C+D — sprint-pipeline truth + research:deep runnability (WARPOS.md sweep 2026-06-10)

**Sprint:** `SP-20260610-003`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-003\prd.md`

> Honored by `/sprint:release`. Lists the conditions under which the
> sprint may ship. **Ship shape:** engine sprint (lane: engine), no
> deploy artifact — close = local ff-merge per RI-001, retro deferred
> to milestone close. Push to remote stays per-action operator-cadence
> (payload approval boundary; never part of the automated close).

## Required to ship

- [ ] All `done` tickets meet their AC.
- [ ] All blocking issues are resolved, deferred, or explicitly accepted.
- [ ] PRD requirements satisfied (R-1 … R-6).
- [ ] COPY satisfied per `copy.md` (C-1: no user-facing copy introduced).
- [ ] INPUTS satisfied per `inputs.md` (IN-1/IN-2/IN-3 failure modes fail safe).
- [ ] TRACE entries fire as documented in `trace.md` (TR-1/TR-2/TR-3 emitted by fixture runs).
- [ ] Acceptance criteria satisfied per `acceptance-criteria.md` (incl. the planted both-ways epsilon-default tests and the >3-area scaffold consistency test).
- [ ] QA plan passing per `qa-plan.md` (incl. `node scripts/research/deep-run.js --help` exit 0; deep.md zero blocked-primitive matches; trace-integrity passing on this sprint's own bundle).
- [ ] Redteam plan passing per `redteam-plan.md` (incl. enforcer false-green probes, legacy-waive scope abuse, probe misclassification both directions).
- [ ] External service dependencies ready, mocked, integrated, or
      deferred with rationale. (Payload: zero ESDs — quota probe mocked
      in tests; live probe uses existing provider credentials.)
- [ ] Required env vars present (names checked; values never logged). (None added by this sprint; probe references keys via auth-resolver labels only.)
- [ ] Release approval recorded in `approvals/` (β batched pre-clearance EVT-warpos-sprint-2026-06-10-batched-001: Lane C DECIDE 0.82 — epsilon-flip gate SATISFIED by Lane B WG-6 @d13254d; Lane D DECIDE 0.91; silence=proceed at the four boundaries).
- [ ] Lane A disjointness held through close (no edits to release.js, generate-framework-manifest.js, warpos-install-baseline.js).
- [ ] BOTH manifests regenerated as the LAST step before close (scripts/**, .claude/commands/** are hash-tracked — full.md, deep.md, design.js, full.js, status.js, checkpoint.js, NEW deep-run.js all touch tracked surfaces); BC-02/BC-05 green.

## Release artifacts

- [ ] Changelog / release notes drafted (sprint close note; downstream products — doogle, masterconsole, almanac sourced these gaps — inherit on next WarpOS release)
- [ ] Docs updated (full.md org-era body + deep.md thin wrapper ARE the doc deliverables)
- [ ] Analytics/events updated where applicable (TR-1 `design-transition-refused`, TR-2 trace-integrity result, TR-3 quota-probe classification documented in trace.md)
- [ ] Migration plan: `none_required` — engine-default flip is mode-scoped (non-sprint behavior unchanged); enforcers wired report-only; no data/schema migration. Existing closed sprints untouched (non-goal #3).
- [ ] Rollback plan: revert the sprint commits and regen both manifests (no deploy artifact to roll back; backup branch retained per Autonomy table; the epsilon-default flip reverts with full.js).

## Monitoring after release

- [ ] Next sprint-mode `/sprint:full` run: epsilonDispatch resolves true from `isSprint()` (TR-1 record shows mode-derived resolution); next solo/adhoc session shows no epsilon dispatch and no `design-transition-refused` false-fires on legacy sprints; any refusal record is triaged, not suppressed.
- [ ] Next scaffolded sprint (any lane): trace-integrity passes at birth with PRD R-list == stories/trace R-refs (WG-7 class does not recur); next `/research:deep` run completes via deep-run.js with TR-3 probe classifications in the events ledger and zero classifier-blocked primitives.

## Approval

Production deploy requires explicit user approval per
`CLAUDE.md#Autonomy`. Record the approval id in
`releases/<id>.yaml#approval_ref`. **This sprint:** no production
deploy exists — the ship action is a LOCAL ff-merge (RI-001); any push
to remote requires its own per-action operator approval.

## Documentation scaling

Required for `documentation_scale: m | l | xl`. For xs/s, ship-gate may
be a single block inside the QA plan.
