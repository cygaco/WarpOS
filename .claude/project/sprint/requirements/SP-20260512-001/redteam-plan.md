# Red-team plan — Multi-sprint parallelism

**Sprint:** `SP-20260512-001`
**PRD:** `prd.md`

Diff-model review on redteam is declared in `paths.sprintRouting` (`redteam.diff_review: true`). Sprint v0.1 ships a generic checklist; this section adds sprint-specific adversarial probes.

## Generic threat classes (carry-forward)

- [ ] Authentication / authorization bypass — n/a (no auth surfaces in this sprint).
- [ ] Input validation / injection — covers the `--sprint`, `--allow-overlap`, and lane-value flags.
- [ ] Business-logic abuse — covers lane bypass and conflict-check evasion.
- [ ] Secrets exposure — none expected (no env vars added).
- [ ] External service abuse — n/a (no ESDs).
- [ ] Approval-boundary bypass — covers the migration's legacy-delete approval prompt.
- [ ] State-of-the-world bypass — covers stale `active-sprints.yaml` reads.
- [ ] Prompt-injection of the agent loop — covers Plan Contract `lane.value` field.

## Sprint-specific adversarial probes

### A-1 — `active-sprints.yaml` deletion mid-flight

> What happens if a user deletes `active-sprints.yaml` while two sprints are mid-execute?

- Expected: every helper that calls `SPRINT.active()` exits with a recoverable error (not a stack trace).
- Test: `rm .claude/project/sprint/active-sprints.yaml` then run `node scripts/sprint/checkpoint.js --sprint SP-X --phase plan --command none --status running --next-action "test" --resume-command "/sprint:status" --resume-notes "test" --safe-to-continue false`. Helper must print a clear "registry missing" error and exit non-zero.
- Mitigation: helpers fall back to scanning `sprints/*/current.yaml` for a single match and printing a `registry-missing-rebuild-hint` row, but do NOT auto-rebuild the registry without `init.js --rebuild-registry`.

### A-2 — Subdir orphan

> What happens if `sprints/SP-X/` exists on disk but `active-sprints.yaml` doesn't list it (or vice versa)?

- Expected: `node scripts/sprint/status.js` flags orphan subdirs as `STATUS=orphaned` and ghost registry entries as `STATUS=missing-subdir`. Neither is silently fixed.
- Test: hand-create `sprints/SP-GHOST/` with no registry entry; run `/sprint:status`. Hand-add a registry entry for a non-existent subdir; run `/sprint:status`. Both must surface as drift.

### A-3 — Two `/sprint:execute` calls on the same lane

> What happens if a user fires `/sprint:execute --sprint SP-A` and `/sprint:execute --sprint SP-B` where both share `lane: default` and overlapping `affected_surfaces`?

- Expected: conflict-check at execute blocks the second one unless `--allow-overlap`. With `--allow-overlap`, the override is logged.
- Test: declare two sprints with overlapping `affected_surfaces`; run both with and without the flag; assert the block fires on the second one without and proceeds with.
- Adversarial extension: what if both calls fire concurrently (race)? Conflict-check reads `active-sprints.yaml` at start of each call but the second one writes its "executing" state before the first one — could two slip through? If yes, add a sprint-level lock file under `.claude/runtime/dispatch-locks/sprint/` and gate execute-state writes on it.

### A-4 — Worktree-lane drift

> What happens if a user `cd`s into a worktree lane and runs `git checkout main` mid-Ralph?

- Expected: `/sprint:execute` detects HEAD-drift on next phase write via `git rev-parse HEAD` comparison against the value captured at lane-entry; if HEAD moved unexpectedly, the loop stops with `stopped_unclear_intent` and resume_notes flag the drift.
- Test: start a worktree-lane Ralph; manually move HEAD; verify next phase stops cleanly.

### A-5 — Conflict-check undercount

> What if a user under-declares `affected_surfaces` on a candidate sprint?

- Expected: conflict-check returns clean → first commit collides with the other sprint's work → Ralph's `record` phase notices the collision and stops with `stopped_destructive_action_needed`.
- Mitigation in this sprint: scope-creep detection lives in execute (not conflict-check) — but document the limitation prominently in `_docs/sprint/LANES.md` and the conflict-check.js source comment so future readers know the check is a best-effort guard, not a proof.

### A-6 — Plan Contract `lane.value` injection

> What if a malicious user crafts a Plan Contract with `lane.value: "; rm -rf .claude/"` or with a path traversal `lane.value: "../../etc/passwd"`?

- Expected: `lane.value` is validated as a relative or absolute path, but no helper ever passes it to a shell. `execute.js` uses `process.chdir(lane.value)` and `git -C lane.value` invocations, both of which take the value as an argv argument, not a shell string.
- Test: write a Plan Contract with malicious `lane.value`; run validate.js (passes — schema only constrains it to string); run execute.js (must safely error on bad path, never execute as shell).
- Path-traversal: chdir into `../../etc/passwd` cannot grant write access this process didn't already have; it will fail because that path is not a worktree.

### A-7 — Append-singleton sprint-id forgery

> What if an agent writes to `events.jsonl` with a fake `sprint_id` ("SP-99999999-999")?

- Expected: logger does not validate `sprint_id` against the registry on every append (would be a measurable hit on the hot path). Forensics reads tolerate unknown ids — `/sprint:status` shows "unknown" for any id not in `active-sprints.yaml`.
- Decision: ACCEPT the risk. Sprint-id is forensic, not authoritative. If an attacker can write to `events.jsonl`, they already have local code-exec.

### A-8 — Migration script run twice

> What if a user accidentally runs `migrate-v0.2.js --apply` a second time after the first succeeded?

- Expected: script detects already-migrated state (legacy files absent, sprints/SP-X/ present, registry present), prints `already migrated — no-op` and exits 0.
- Test: run `--apply` twice; second run must be a clean no-op.

### A-9 — TRACE silent suppression

> What if an agent disables the warm-up dispatch event (TR-3) to hide that the workaround didn't fire?

- Expected: TRACE writes go through `scripts/hooks/lib/logger.js`. Suppressing TR-3 requires editing logger.js or execute.js — both diff-visible and review-blocked.
- Mitigation: add `scripts/test-sprint-hooks.js` coverage that asserts TR-3 fires on every worktree-lane execute, so a silent suppression triggers a test failure.

### A-10 — Beta cross-sprint precedent bleed

> What if Beta is consulted in SP-A's design and pulls a precedent recorded under SP-B that doesn't apply?

- Expected: Beta event rows now carry `sprint_id`; precedent retrieval may prefer same-sprint but should not exclude other sprints' precedents — they often DO apply. Add a `sprint_id_match` field to the retrieval result so Beta can disclose when it borrowed from another sprint.
- Decision: ACCEPT cross-sprint precedent reuse as desirable. Surface it in Beta's response, do not filter.

## Stop-the-bus signals

If any of these surface during redteam, halt `/sprint:execute` and escalate:

- Any path to silently corrupting `active-sprints.yaml` so a sprint becomes invisible.
- Any path to the migration script deleting legacy files without an approval record.
- Any path to conflict-check returning clean while overlap exists.
- Any path to a worktree-lane Ralph writing to the wrong tree.
- Any path to the warm-up dispatch being skipped on a worktree lane.

## Documentation scaling

Mandatory at `documentation_scale: m`. The probes above are sprint-specific; the generic threat classes are inherited from the template.
