# Release Plan — Harden WarpOS update pipeline

**Sprint:** `SP-20260514-001`
**PRD:** `prd.md`

Likely shipped as WarpOS **0.7.0** (minor bump: capsule manifest schema changes shape from 12-char to 64-char sha256).

## Required to ship

- [ ] All 10 tickets `done` with AC satisfied.
- [ ] All `qa-plan.md` smoke + per-story + cross-cutting items green.
- [ ] All `redteam-plan.md` stop-the-bus signals are clear (no escalations standing open).
- [ ] PRD requirements R-1 through R-7 satisfied.
- [ ] COPY satisfied per `copy.md` (each C-N grep'd in production code).
- [ ] INPUTS validation per `inputs.md`.
- [ ] TRACE events fire per `trace.md` (replay-bench shows all three new event kinds).
- [ ] `/check:all` passes on this repo (no new red).
- [ ] Cross-version replay test bench green: 0.6.x → 0.7.0, 0.7.0 → 0.7.0 noop, 0.7.0 → 0.7.0 with edited framework_template, 0.7.0 → 0.7.0 with stale migration.
- [ ] Release approval recorded in `approvals/` for the version bump.

## Release artifacts

- [ ] CHANGELOG entry for 0.7.0 covering the five GPT-5.5 items + deferred item 4.
- [ ] `_docs/sprint/UPDATE_PIPELINE.md` published.
- [ ] `_docs/sprint/CRASH_RECOVERY.md` updated with new event kinds + opt-in recovery tools.
- [ ] Skill body update: `.claude/commands/warp/update.md` mentions the single `--operator-override` flag (not the 4 old flags).
- [ ] Migration plan: existing 0.6.x consumers (`aiweb`, `jobhunter-app`) — one `/warp:update --apply` per consumer upgrades them through the transition.
- [ ] Rollback plan: `framework-installed.json` keeps a snapshot before the upgrade. If a regression surfaces, revert via `git restore` on `.claude/framework-installed.json` and re-run prior `/warp:update`. No DB; no irreversible side effect.
- [ ] Capsule built via `scripts/warpos/release-canonical.js` (canonical workflow); pin-commit + rebuild-checksums follow-up retained per existing pattern.

## Monitoring after release

- [ ] Count `content-hash-mismatch kind=lf_only` events in events.jsonl after each consumer upgrade. Should converge to 0 once consumers are on 0.7.0.
- [ ] Count `operator-override-used` events. Any non-zero count names the specific gate the operator hit — review and decide whether the gate needs to change.
- [ ] Count `ownership-transitioned` events on first apply of 0.7.0 to each existing consumer. Spot-check that all transitions were intentional.

## Approval

Production push to `warpos@0.7.0` tag requires explicit user approval per `CLAUDE.md#Autonomy`. Record approval id in `releases/<id>.yaml#approval_ref`.

## Documentation scaling

Required at `documentation_scale: l`.
