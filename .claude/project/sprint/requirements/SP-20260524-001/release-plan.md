# Release Plan — Install fixture CI matrix

**Sprint:** `SP-20260524-001`
**PRD:** `prd.md`

> Internal canonical-side test tool. No production deploy. "Release" here means landing on the sprint branch + propagating into the next WarpOS canonical release capsule (so downstream products receive the matrix on their next `/warp:update`).

## Required to ship

- [ ] All `done` tickets meet their AC.
- [ ] All blocking issues resolved, deferred, or explicitly accepted.
- [ ] PRD requirements R-1..R-10 satisfied.
- [ ] COPY satisfied per `copy.md` — every CLI string in the matrix matches.
- [ ] INPUTS satisfied per `inputs.md` — every CLI flag honored, validated, with rejection of unknown values.
- [ ] TRACE entries fire per `trace.md` — `install_matrix_start`, `install_matrix_scenario_completed`, `install_matrix_done`, `install_matrix_meta_caught`.
- [ ] Acceptance criteria satisfied per `acceptance-criteria.md`.
- [ ] QA plan passing per `qa-plan.md`.
- [ ] Red-team plan passing per `redteam-plan.md` — no stop-the-bus signals.
- [ ] External service dependencies — N/A (none).
- [ ] No `secret: true` env-var values appear in matrix output.
- [ ] Release approval — N/A (canonical-internal test tool; no production gate).

## Release artifacts

- [ ] ROADMAP.md updated — mark scenario A done in Sprint 10+ candidates section.
- [ ] `scripts/warpos/test-install-matrix.js` shipped + tests passing.
- [ ] `package.json` `test:install-matrix` script declared.
- [ ] `.claude/paths.json` `paths.testInstallMatrix` declared.
- [ ] No new external dependencies (matrix uses only Node core + existing repo modules).
- [ ] Migration plan: `none_required` — pure additive.
- [ ] Rollback plan: `none_required` — pure additive; reverting the commit removes the matrix entirely.

## Monitoring after release

- [ ] Matrix runtime stays <90s on a typical dev machine (drift check on next sprint touching install pipeline).
- [ ] Meta-test injection coverage holds — at least 2 planted regressions still caught by the matrix on regen of canonical install code.

## Approval

No production deploy. Canonical landing only. Subsequent WarpOS release (next `/warp:release`) propagates the matrix into the next capsule.

## Documentation scaling

Required for `documentation_scale: m`. Internal tool ship — light release plan, no production stage.
