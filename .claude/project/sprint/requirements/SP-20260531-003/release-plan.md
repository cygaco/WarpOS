# Release Plan — scan:warpos-layer-diff — product-vs-dev-tooling layer diff report

**Sprint:** `SP-20260531-003`
**PRD:** `.claude/project/sprint/requirements/SP-20260531-003/prd.md`

> Honored by `/sprint:release`. Engine/tooling sprint (no deploy artifact) — release = ff-merge to main per RI-001; no product deploy. Stacked on `sprint/SP-20260531-002` (lands together unless the operator splits).

## Required to ship

- [ ] All `done` tickets meet their AC.
- [ ] PRD requirements (R-1..R-3) satisfied.
- [ ] Acceptance criteria satisfied per `acceptance-criteria.md`.
- [ ] QA plan passing (incl. read-only guarantee + --json valid + missing-manifest error).
- [ ] Redteam plan passing.
- [ ] BOTH manifests regenerated; new script + skill shipped; `scan:full` Tier 3 green.
- [ ] No ESDs; no `secret: true` values in tracked files.

## Release artifacts

- [ ] ROADMAP Shipped narrative + Sprints ledger row.
- [ ] Migration plan: `none_required` (additive read-only scan).
- [ ] Rollback plan: `git revert` of the merge; no state to unwind.

## Monitoring after release

- [ ] `/scan:warpos-layer-diff` runs clean on `main` post-merge.

## Approval

Engine sprint — no production deploy. Merge to `main` per `/commit:land`; push operator-gated per `CLAUDE.md#Autonomy`.

## Documentation scaling

`s/m` cut.
