# Release Plan — E-DISPATCH-INTEGRITY-001 F-1+F-3 — coverage-honesty (kill telemetry-only false-greens)

**Sprint:** `SP-20260610-005`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-005\prd.md`

> Honored by `/sprint:release`. Lists the conditions under which the
> sprint may ship. **Ship shape:** engine sprint (lane: engine), no
> deploy artifact — close = local ff-merge per RI-001, retro deferred
> to milestone close. Push to remote stays per-action operator-cadence
> (payload approval boundary; never part of the automated close).

## Required to ship

- [ ] All `done` tickets (T-300, T-301) meet their AC.
- [ ] All blocking issues are resolved, deferred, or explicitly accepted.
- [ ] PRD requirements satisfied (R-1 … R-4).
- [ ] COPY satisfied per `copy.md` (C-1: no user-facing copy introduced).
- [ ] INPUTS satisfied per `inputs.md` (IN-1/IN-2 failure modes fail safe — unverifiable ledger input never greens; unbounded verify refused).
- [ ] TRACE entries fire as documented in `trace.md` (TR-1/TR-2 coverage verdicts cite backing record ids; TR-3 refusal + correlation params recorded; TR-4 exemptions named, caller audit evidenced).
- [ ] Acceptance criteria satisfied per `acceptance-criteria.md` (incl. the planted telemetry-only-RED / record-backed-GREEN / pre-cutoff-GREEN cases, the historic-green fixture FAILING, and the unbounded gauntlet-verify refusal exiting non-zero).
- [ ] QA plan passing per `qa-plan.md` (incl. both existing check suites + gauntlet-verify.test.js green; no historic sprint flips RED under /scan:full).
- [ ] Redteam plan passing per `redteam-plan.md` (incl. enforcer false-green probes, legacy-cutoff scope abuse, window-gaming, fixture-theater checks).
- [ ] External service dependencies ready, mocked, integrated, or
      deferred with rationale. (Payload: zero ESDs — all surfaces are
      local check scripts; no network calls.)
- [ ] Required env vars present (names checked; values never logged). (None added by this sprint.)
- [ ] Release approval recorded in `approvals/` (β pre-cleared epic chaining: EVT-warpos-sprint-2026-06-10-batched-001 DECIDE 0.88; silence=proceed boundaries; gauntlet on gemini per payload approval boundary).
- [ ] Lane disjointness held through close (no edits to scripts/dispatch/dispatch-skill.js or safe-spawn tests — SP-20260610-004's lane).
- [ ] BOTH manifests regenerated as the LAST step before close (scripts/** is hash-tracked — sprint-manager-consult.js, sprint-hook-coverage.js, gauntlet-verify.js + tests all touch tracked surfaces); BC-02/BC-05 green.

## Release artifacts

- [ ] Changelog / release notes drafted (sprint close note; epic E-DISPATCH-INTEGRITY-001 tracker updated — F-1 + F-3 DoD evidence linked)
- [ ] Docs updated (check-script usage strings ARE the doc deliverables — gauntlet-verify usage guidance names the required correlation flags)
- [ ] Analytics/events updated where applicable (TR-1/TR-2 record-backed verdicts, TR-3 verify/refusal records, TR-4 named exemptions documented in trace.md)
- [ ] Migration plan: `none_required` — legacy date-cutoff (2026-06-10) exempts historic sprints in place (no retrofit of closed sprints); gauntlet-verify callers updated in the same commit (no staged migration).
- [ ] Rollback plan: revert the sprint commits and regen both manifests (no deploy artifact to roll back; the predicate + CLI contract revert together with their callers; backup branches retained per Autonomy table).

## Monitoring after release

- [ ] Next sprint-mode `/sprint:full` run: coverage scans green ONLY with backing `ok:true` completion records (verdicts cite record ids); any telemetry-only RED is triaged as a real no-run, not suppressed.
- [ ] Next gauntlet phase: every gauntlet-verify invocation in the events ledger carries sprint_id + window (zero refusal records from in-engine callers — a refusal from epsilon-runtime/sprint-close means the caller audit missed a site); no historic-green recurrence (RC-4/G4 stays closed).

## Approval

Production deploy requires explicit user approval per
`CLAUDE.md#Autonomy`. Record the approval id in
`releases/<id>.yaml#approval_ref`. **This sprint:** no production
deploy exists — the ship action is a LOCAL ff-merge (RI-001); any push
to remote requires its own per-action operator approval.

## Documentation scaling

Required for `documentation_scale: m | l | xl`. For xs/s, ship-gate may
be a single block inside the QA plan. (This sprint is `s` but ships the
full 10-file structure per sibling convention — SP-20260610-002/003.)
