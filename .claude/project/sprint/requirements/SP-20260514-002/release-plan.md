# Release Plan — Enforce sprint routing policy

**Sprint:** `SP-20260514-002`
**PRD:** `prd.md`

## Release scope

Ship the routing-enforcement contract: CLI subcommands + sprint-script wiring + guard hook + policy update + skill body docs. Land it in canonical WarpOS so the next `/warp:update` propagates to downstream projects.

## Pre-release checklist

- [ ] All tickets `T-A` through `T-E` in `done` bucket.
- [ ] All AC validated; QA plan tests green.
- [ ] Redteam plan items A-1..A-10 addressed or documented.
- [ ] `node scripts/sprint/routing.js validate` exits 0.
- [ ] `node scripts/sprint/routing.js coverage --sprint SP-20260514-002` exits 0 (smoke).
- [ ] `/warp:health` reports green on hook chain (Section 3) and policy presence (Section 5).
- [ ] Lint + typecheck + tests pass on `main`.
- [ ] No backup-branch deletions; no force-push to main; no API spend >= $5.

## Release steps

1. **Commit** all sprint deliverables in one or more focused commits:
   - `feat(sprint): routing.js record/check/coverage + trace schema`
   - `feat(sprint): wire plan/design/execute/release/retrospective to routing.js record`
   - `feat(hooks): sprint-routing-guard + settings.json registration + enforcement policy`
   - `docs(sprint): routing enforcement section in 5 sprint skill bodies`
   - `test(sprint): unit + integration + hook + smoke`
2. **Smoke-run** the routing.js commands against this very sprint:
   - record traces for planning/design/execution/qa/redteam/release.
   - confirm `coverage` exits 0.
3. **Promote** to canonical WarpOS via `/warp:promote` (dry-run first, then `--apply`).
4. **Release** canonical via `/warp:release` (this is the upstream rollout).
5. **Tag** the canonical release once green.

## Release approval

- Class B (architecture change with hook surface). Decision recorded via the Beta consultation logged at plan time.
- Push to main requires explicit user authorization (per CLAUDE.md autonomy table).
- Tag + push tag: user-authorized per session-handoff context (user pre-approved push+tag this morning for the routing fix).

## Rollback

- **Quick:** Set `sprint-routing.json#enforcement.mode = "warn"` and `soft_rollout_until` far in the future. Removes block behavior, preserves traces.
- **Full:** `git revert` the release commit(s). Hook is registered in settings.json; revert restores prior chain. Trace data on disk is harmless and need not be cleaned.

## Post-release

- Watch `/warp:health` for 7 days; flip `enforcement.mode` to `block` on day 8 (or when smoke confidence is high) via a one-line policy edit + commit.
- Capture learning(s) for the learner pipeline (routing-enforcement design choices).
- Run `/sprint:retrospective` to close the sprint.
