# Release Plan — _guides product-layer shipping + _planning reorg + ship-boundary enforcer

**Sprint:** `SP-20260531-002`
**PRD:** `.claude/project/sprint/requirements/SP-20260531-002/prd.md`

> Honored by `/sprint:release`. This is an engine/tooling sprint (no deploy artifact) — release = ff-merge to main; per RI-001 there is no product deploy step.

## Required to ship

- [ ] All `done` tickets meet their AC.
- [ ] PRD requirements (R-1..R-6) satisfied.
- [ ] Acceptance criteria satisfied per `acceptance-criteria.md`.
- [ ] QA plan passing per `qa-plan.md` (incl. the injected-violation false-green test).
- [ ] Redteam plan passing per `redteam-plan.md`.
- [ ] BOTH manifests regenerated; `scan:full` Tier 3 green (ship-coverage + framework-purity + manifest-coverage).
- [ ] No ESDs (none_expected).
- [ ] No `secret: true` values in any tracked file.

## Release artifacts

- [ ] ROADMAP Shipped narrative entry (Step 8b) + Sprints ledger row.
- [ ] Migration plan: `none_required` (additive dir + manifest + scan; no consumer migration).
- [ ] Rollback plan: `git revert` of the sprint branch merge; no state to unwind.

## Monitoring after release

- [ ] First downstream `/warp:update` / scaffold confirms `_guides/` reaches a product and `_planning/` does not.
- [ ] `scan:full` stays green on `main` post-merge.

## Approval

Engine sprint — no production deploy. Branch merge to `main` per `/commit:land`; push is operator-gated per `CLAUDE.md#Autonomy`.

## Documentation scaling

Required for `documentation_scale: m`.
