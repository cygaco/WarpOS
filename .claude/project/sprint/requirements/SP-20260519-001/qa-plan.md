# QA Plan — ROADMAP + RELEASES ledger discipline

**Sprint:** `SP-20260519-001`
**PRD:** `prd.md`

> Honored by `/sprint:execute` (mid-sprint checks) and `/sprint:release` (final QA gate). Diff-model review on QA declared in `paths.sprintRouting`.

## Smoke checks

- [ ] `node scripts/sprint/ledger.js --self-test` (a tiny self-test entrypoint that exercises append + update + idempotency against a tempdir) exits 0.
- [ ] `node scripts/sprint/backfill-ledgers.js` (no flag) runs cleanly against the live repo and prints the dry-run summary without modifying disk.
- [ ] One round-trip integration: create a throwaway sprint via `add-sprint.js`, observe row in `ROADMAP.md#sprints`, run sham `release.js cmdPrepare`, observe row in `RELEASES.md#sprints`, run `retrospective.js`, observe row status update.
- [ ] `/check:references` passes — no broken markdown links from `RELEASES.md` / `ROADMAP.md` to capsule paths / RL-*.yaml paths.

## Per-story QA

### S-1 (ROADMAP.md Sprints section format)
- [ ] AC-1.1 verified — visual inspection + row-count grep
- [ ] AC-1.2 verified — unit test rejects unknown status
- [ ] Regression: existing Phase-1..4 backlog content is untouched (diff shows only the new Sprints section ABOVE the first Phase H2)

### S-2 (RELEASES.md created)
- [ ] AC-2.1 verified — file shape test
- [ ] AC-2.2 verified — column header assertion
- [ ] Regression: `scripts/warpos/promote.js` excludes `RELEASES.md` (grep the FRAMEWORK_PREFIXES / exclusion list)

### S-3 (sprint-workflow.md codification)
- [ ] AC-3.1 verified — grep smoke
- [ ] Regression: existing sprint-workflow.md sections (planning, design, execute, release, retro) are untouched (diff isolated to the new "Ledger discipline" H2)

### S-4 (ledger.js module)
- [ ] AC-4.1 verified — function shape
- [ ] AC-4.2 verified — idempotency
- [ ] AC-4.3 verified — fail-open contract
- [ ] Regression: no caller of `fs.appendFileSync` on `ROADMAP.md` / `RELEASES.md` exists outside `ledger.js` (grep)

### S-5 (plan.js + add-sprint.js wiring)
- [ ] AC-5.1, AC-5.2 verified — integration test
- [ ] Regression: `plan.js` overlap warning, registry primary handling, and Plan Contract write paths untouched

### S-6 (retrospective.js wiring)
- [ ] AC-6.1 verified — integration test
- [ ] Regression: retrospective.js LLM-synthesis path untouched (LRN-2026-05-13 silent-skeleton avoidance)

### S-7 (release.js wiring)
- [ ] AC-7.1, AC-7.2 verified — prepare + deploy integration tests
- [ ] Regression: release.js routing-trace emission, checklist write, and approval-check paths untouched

### S-8 (/warp:release driver wiring)
- [ ] AC-8.1 verified — capsule build + ledger write
- [ ] AC-8.2 verified — Summary linter rule
- [ ] Regression: `/warp:release` end-to-end still ships a valid capsule + tag (smoke-tested against a sham 0.8.1 bump)
- [ ] Driver-path grep: verified that `release-canonical.js` (or alt) is the SOLE writer to `version.json` outside test fixtures — Plan Contract unsafe-assumption resolved

### S-9 (backfill script)
- [ ] AC-9.1 verified — dry-run no-op
- [ ] AC-9.2 verified — apply row counts
- [ ] AC-9.3 verified — idempotency
- [ ] Regression: missing-capsule case (version listed in `previousVersions[]` without `framework/releases/X.Y.Z/release.json`) writes the "(missing — known gap)" marker AND a traces.jsonl learning candidate

### S-10 (ledger-presence-guard hook)
- [ ] AC-10.1 verified — synthetic payload warn
- [ ] AC-10.2 verified — clock-stubbed mode check
- [ ] Regression: `/check:all` exit code unchanged, no new errors in existing PreToolUse hook pipeline
- [ ] Hook timing: synthetic-payload bench < 50ms (matches sprint-tracker-guard precedent)

### S-11 (skill body updates)
- [ ] AC-11.1 verified — grep smoke
- [ ] Regression: skill files load through `/help` / smart-context.js without parse errors

### S-12 (backfill execution)
- [ ] AC-12.1 verified — end-of-sprint operator step recorded in release-plan ship-gate

## Cross-cutting QA

- [ ] Lint passes (`scripts/lint/*.js` if any apply to new files)
- [ ] Typecheck passes (N/A — no TS)
- [ ] Unit tests pass (`node --test tests/regression/SP-20260519-001/*.test.js`)
- [ ] No new console errors in golden path (`/sprint:plan` round-trip)
- [ ] TRACE events fire as documented (events.jsonl carries `ledger.write` after a smoke round-trip)
- [ ] COPY matches `copy.md`
- [ ] INPUTS handle validation per `inputs.md`
- [ ] `/check:patterns` reports no new recurring issues
- [ ] `/check:references` is green — no dangling links from the two ledgers
- [ ] `paths.json` has no new keys (ledgers are repo-root literals, intentionally not in paths registry — see Q in Plan Contract non-blocking #1)

## External service QA

- [ ] N/A — no ESDs in this sprint (Plan Contract `external_service_dependencies.status = none_expected`)

## Documentation scaling

Scale `m` — all 10 requirements files present, full QA + redteam + release plans. xs/s would inline AC into the QA file; this is not xs/s.
