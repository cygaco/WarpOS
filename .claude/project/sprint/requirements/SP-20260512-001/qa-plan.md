# QA Plan — Multi-sprint parallelism

**Sprint:** `SP-20260512-001`
**PRD:** `prd.md`

QA is honored by `/sprint:execute` (mid-sprint checks) and `/sprint:release` (final gate). Diff-model review on QA is declared in `paths.sprintRouting` (`qa.diff_review: true`).

## Smoke checks

- [ ] `node scripts/sprint/validate.js` exits 0 against `active-sprints.yaml` and every `sprints/*/current.yaml` + `progress.yaml`.
- [ ] `node scripts/test-sprint-hooks.js` exits 0 (existing test suite for `sprint-tracker-guard`).
- [ ] `npm run lint` and any project-specific linters exit 0.
- [ ] Two-sprint smoke (G-TWO-SPRINT-SMOKE — see below).
- [ ] Migration smoke (G-MIGRATION-VERIFY — see below).
- [ ] `node scripts/path-lint.js` (or the canonical command — `paths:doctor` skill) exits clean.

## Gates

### G-MIGRATION-VERIFY (blocker for any commit touching live tracker)

1. `node scripts/sprint/migrate-v0.2.js --dry-run` — must print a clean plan and exit 0.
2. `git stash` working state, then `--apply` → byte-equivalence verify is part of the script — must exit 0.
3. `node scripts/sprint/validate.js .claude/project/sprint/sprints/SP-20260512-001/current.yaml` — must exit 0.
4. Operator confirms COPY C-7 prompt only when verify succeeded; approval is recorded in `paths.sprintApprovals/`.
5. If any step fails, the script must NOT delete legacy files and must leave the tracker in a recoverable state.

### G-TWO-SPRINT-SMOKE (post-merge gate)

1. With migration applied, create a second sprint by `/sprint:plan "fake-test-sprint"` while SP-20260512-001 exists — assert `active-sprints.yaml` now has 2 entries and primary unchanged.
2. Run `/sprint:status` — output must list both sprints.
3. Run `node scripts/sprint/conflict-check.js --sprint <new-id>` — must exit 0 (no overlap) because the test sprint declares no affected_surfaces.
4. Run `node scripts/sprint/ticket.js create --sprint <new-id> --title "smoke" --type chore ...` — ticket lands under `sprints/<new-id>/` not under SP-20260512-001.
5. Run the same `ticket.js create` without `--sprint` — ticket lands under the primary id.
6. Hand-rollback: delete the fake sprint's subdir; remove from `active-sprints.yaml`; assert primary survives.

## Per-story QA

### S-1 — Active-sprints registry
- [ ] AC-1.1, AC-1.2, AC-1.3 verified.
- [ ] Regression: `init.js` re-run idempotent (no second-write on existing tracker).

### S-2 — Per-sprint state subdirs
- [ ] AC-2.1, AC-2.2 verified.
- [ ] Regression: legacy `sprintRoot/current-sprint.yaml` path produces a clear error from `paths.js` (not a silent fallback) after migration.

### S-3 — Schema constraint loosened
- [ ] AC-3.1, AC-3.2 verified.
- [ ] Regression: every existing `current-sprint.yaml` field still validates.

### S-4 — Migration script
- [ ] AC-4.1, AC-4.2, AC-4.3, AC-4.4 verified.
- [ ] Regression: running migration twice on already-migrated state is a no-op and exits 0.

### S-5 — Init template bugfix
- [ ] AC-5.1 verified.
- [ ] Regression: `scripts/test-sprint-hooks.js` covers the template-validation case so we never re-introduce the pre-existing bug.

### S-6 — `paths.js` per-sprint resolver
- [ ] AC-6.1, AC-6.2, AC-6.3 verified.
- [ ] Regression: legacy `SPRINT.current` / `SPRINT.progress` aliases still resolve (one-release back-compat).

### S-7 — `--sprint` flag end-to-end
- [ ] AC-7.1, AC-7.2, AC-7.3 verified.
- [ ] Regression: invoking each helper WITHOUT `--sprint` still works (the default-to-primary path).

### S-8 — Sprint command bodies
- [ ] AC-8.1, AC-8.2 verified.
- [ ] Regression: the legacy "resume from `paths.sprintProgress`" instruction still works because `SPRINT.active()` resolves to the primary's progress yaml.

### S-9 — Plan Contract `lane`
- [ ] AC-9.1, AC-9.2 verified.
- [ ] Regression: every prior Plan Contract under `plan-contracts/` continues to validate (lane is required but defaults rendered for old contracts via the validator's `default` injection — or, equivalently, the migration script back-fills `lane: {type: default, ...}` on PC-20260512-0001).

### S-10 — `/sprint:execute` worktree honor
- [ ] AC-10.1, AC-10.2, AC-10.3 verified.
- [ ] Regression: `lane.type === "default"` sprints continue to execute exactly as today (cwd unchanged).

### S-11 — Worktree warm-up dispatch
- [ ] AC-11.1 verified — TR-3 event present in `paths.eventsFile` after first worktree-lane execute.

### S-12 — Routing concurrency block
- [ ] AC-12.1, AC-12.2 verified.

### S-13 — Conflict-check
- [ ] AC-13.1, AC-13.2, AC-13.3 verified.
- [ ] Regression: a sprint with empty `affected_surfaces` never triggers a conflict (don't false-block).

### S-14 — Sprint-id tagging on append singletons
- [ ] AC-14.1, AC-14.2, AC-14.3 verified.
- [ ] Regression: rows without `sprint_id` (pre-existing) still parse cleanly by every existing reader.

### S-15 — `/sprint:status`
- [ ] AC-15.1, AC-15.2 verified.
- [ ] Regression: status output stays under 80 columns for the typical 1-3 sprint case.

### S-16 — Hook compatibility
- [ ] AC-16.1, AC-16.2 verified via `scripts/test-sprint-hooks.js` extension.

### S-17 — Docs
- [ ] AC-17.1, AC-17.2 verified by hand-read review and a doc-presence smoke test (`scripts/test-sprint-docs.js` or a one-off `grep` checklist).

### S-18 — ADR
- [ ] AC-18.1 verified by file presence.

## Cross-cutting QA

- [ ] Lint passes (project + sprint-specific path-lint).
- [ ] Typecheck passes (where applicable — Node helpers are JS, so n/a unless a `// @ts-check` block is in use).
- [ ] Unit tests pass.
- [ ] No new console errors in any sprint helper happy path.
- [ ] TRACE events fire as documented (`paths.eventsFile` grep for `"type":"warmup"`, `"type":"sprint.conflict_check.run"`, etc.).
- [ ] COPY strings match `copy.md`.
- [ ] INPUTS handle validation per `inputs.md`.

## External service QA

- [ ] No ESDs declared — section confirmed N/A.

## Documentation scaling

This plan is the `documentation_scale: m` cut. For l/xl, add a separate architecture-review plan covering the lane isolation model — for this sprint that role is filled by the ADR (S-18).
