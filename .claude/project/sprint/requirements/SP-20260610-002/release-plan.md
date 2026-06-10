# Release Plan — Lane B — dispatch/registry coherence (WARPOS.md sweep 2026-06-10)

**Sprint:** `SP-20260610-002`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-002\prd.md`

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
- [ ] INPUTS satisfied per `inputs.md` (IN-1/IN-2/IN-3 failure modes fail closed).
- [ ] TRACE entries fire as documented in `trace.md` (TR-1 instruction in place; TR-2 emitted by fixture run).
- [ ] Acceptance criteria satisfied per `acceptance-criteria.md`.
- [ ] QA plan passing per `qa-plan.md` (incl. `role-parity-scan` exit 0, `epsilon-liveness` exit 0 on clean tree).
- [ ] Redteam plan passing per `redteam-plan.md` (incl. enforcer false-green probes).
- [ ] External service dependencies ready, mocked, integrated, or
      deferred with rationale. (Payload: zero ESDs — vacuously satisfied.)
- [ ] Required env vars present (names checked; values never logged). (None added by this sprint.)
- [ ] Release approval recorded in `approvals/` (β batched pre-clearance EVT-warpos-sprint-2026-06-10-batched-001, DECIDE 0.87, silence=proceed at the four boundaries).

## Release artifacts

- [ ] Changelog / release notes drafted (sprint close note; downstream products inherit on next WarpOS release)
- [ ] Docs updated (epsilon.md, agent-dispatch-guide.md, frontmatter-guide.md ARE the doc deliverables; views-fresh green)
- [ ] Analytics/events updated where applicable (`epsilon-stalled` event + ε startup route self-check record documented in trace.md)
- [ ] Migration plan: `none_required` — additive contract rule + spec pins + new check script; no data/schema migration
- [ ] Rollback plan: revert the sprint commits and regen both manifests (no deploy artifact to roll back; backup branch retained per Autonomy table)

## Monitoring after release

- [ ] Next `/scan:full` run shows the epsilon-liveness lane present, report-only, and not false-firing `epsilon-stalled` on a healthy runtime; role-parity-scan stays green after the next view regen / release promote.
- [ ] Next ε-conducted sprint: startup route self-check record (TR-1) appears in the events ledger, and no >N-minute silent conductor stall recurs (WG-6 class); any `epsilon-stalled` event is triaged, not suppressed.

## Approval

Production deploy requires explicit user approval per
`CLAUDE.md#Autonomy`. Record the approval id in
`releases/<id>.yaml#approval_ref`. **This sprint:** no production
deploy exists — the ship action is a LOCAL ff-merge (RI-001); any push
to remote requires its own per-action operator approval.

## Documentation scaling

Required for `documentation_scale: m | l | xl`. For xs/s, ship-gate may
be a single block inside the QA plan.
