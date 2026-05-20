# Release Plan — ROADMAP + RELEASES ledger discipline

**Sprint:** `SP-20260519-001`
**PRD:** `prd.md`

> Honored by `/sprint:release`. Lists conditions under which the sprint may ship.

## Required to ship

- [ ] All 12 `done` tickets (T-001..T-012) meet their AC.
- [ ] All blocking issues resolved, deferred, or explicitly accepted.
- [ ] PRD requirements R-1..R-7 satisfied.
- [ ] COPY satisfied per `copy.md` — `ROADMAP.md#sprints` and both `RELEASES.md` sections carry the exact column headers from C-1/C-2/C-3.
- [ ] INPUTS satisfied per `inputs.md` — `ledger.js` validates per IN-1..IN-4; backfill reads sources per IN-5..IN-8.
- [ ] TRACE entries fire as documented in `trace.md` — `ledger.write` event present in `events.jsonl` after a smoke round-trip.
- [ ] Acceptance criteria AC-1.1..AC-12.1 satisfied.
- [ ] QA plan passing per `qa-plan.md`.
- [ ] Redteam plan covered per `redteam-plan.md`; flagged follow-ups recorded as new ROADMAP entries (NOT blockers).
- [ ] No new ESDs introduced (`external_service_dependencies.status = none_expected` from Plan Contract — re-confirm at release).
- [ ] No new env vars required.
- [ ] Release approval recorded in `approvals/` per `CLAUDE.md#Autonomy` — `/sprint:release` deploy is user-approved (unchanged convention).

## Ship-gate verification (post-merge, pre-tag)

- [ ] **Round-trip smoke #1 — sprint creation**: `node scripts/sprint/add-sprint.js --id SP-test --title "ship-gate smoke"` → grep `ROADMAP.md#sprints` for `SP-test` → row present at status `planning`. Delete `SP-test` registry entry + ledger row after smoke.
- [ ] **Round-trip smoke #2 — release**: a sham `release.js cmdPrepare --sprint SP-test` → grep `RELEASES.md#sprints` for the new `RL-*` at status `prepared`. Clean up after.
- [ ] **Round-trip smoke #3 — version bump**: dry-run `/warp:release` (do NOT actually bump version.json — use a `--dry-run` flag if available, or stub the bump) → confirm `ledger.appendVersionRow` would be called with valid args. Skip if no dry-run path; document the gap as a follow-up.
- [ ] **Backfill smoke**: run `node scripts/sprint/backfill-ledgers.js --apply` ONCE against the live repo. Verify final row counts match Plan Contract expectations (~14 sprint rows, ~21 release rows, ~21 version rows). Idempotent re-run reports `0 inserted, N already present`.
- [ ] **Hook smoke**: synthetic payload run of `ledger-presence-guard.js` against a fake `/sprint:plan` invocation with NO ledger write — confirm stderr warn fires, exit code 0 (warn mode).
- [ ] **Reference check**: `node scripts/check/references.js` (or equivalent) confirms no broken markdown links from `RELEASES.md` / `ROADMAP.md` to capsule paths or `RL-*.yaml`.
- [ ] **Promote-exclusion check**: `grep -nE "RELEASES.md|ROADMAP.md" scripts/warpos/promote.js` confirms both files are in the exclusion list before any promote operation.

## Release artifacts

- [ ] **Changelog / release notes drafted**: `.claude/project/sprint/releases/<RL-id>.changelog.md` carries:
  - One-paragraph summary of the ledger discipline
  - Bullet list of writers wired (plan, add-sprint, retrospective, release, /warp:release)
  - Note on warn-mode soft-rollout until 2026-06-02
  - Backfill row counts
  - Recorded follow-ups (downstream `RELEASES.md` scaffold, row-attestation, ledger-lock race)
- [ ] **Docs updated**:
  - `paths.sprintReference` (`sprint-workflow.md`) carries new "Ledger discipline" H2
  - `/sprint:plan`, `/sprint:release`, `/sprint:retrospective`, `/warp:release` skill bodies carry the C-12 one-liner
  - `ROADMAP.md` has the new "Sprints" section above the Phase backlog
  - `RELEASES.md` exists with both sections + backfilled rows
- [ ] **Analytics/events updated**: `events.jsonl` carries the 9 new event types (TR-1..TR-9 emitters), confirmed by a tail after smoke.
- [ ] **Migration plan**: `none_required` — additive (new files + new sections + new scripts). No data migration. No breaking changes.
- [ ] **Rollback plan**: revert the merge commit + delete `RELEASES.md`. Backfill is idempotent so re-running on a re-applied state is safe. Document in retro.

## Monitoring after release

- [ ] **Soft-rollout window (14d, ends 2026-06-02)**: review `events.jsonl` for `ledger-presence-guard.fire` occurrences. Zero fires = healthy → flip `enforcement.mode` to `block` in a follow-up sprint. Non-zero fires = identify which writer-script integration is leaky.
- [ ] **First post-release sprint cycle**: confirm a real `/sprint:plan` → `/sprint:release` → `/sprint:retrospective` round-trip writes the correct rows in the correct order without operator intervention.
- [ ] **First post-release `/warp:release`**: confirm `RELEASES.md#versions` gets a row with a downstream-readable Summary.

## Approval

Production deploy requires explicit user approval per `CLAUDE.md#Autonomy`. Record approval id in `releases/<id>.yaml#approval_ref`.

## Documentation scaling

Scale `m` — required. Ship-gate above is the full m-cut.
