# Acceptance criteria — Multi-sprint parallelism

**Sprint:** `SP-20260512-001`
**PRD:** `prd.md`

Each AC is a testable Given/When/Then. Tickets link to their AC ids.

---

## S-1 — Active-sprints registry

- **AC-1.1** Given no `active-sprints.yaml` exists, when `node scripts/sprint/init.js --project <name>` runs, then `.claude/project/sprint/active-sprints.yaml` is created with a single entry pointing at the bootstrapped sprint.
- **AC-1.2** Given `active-sprints.yaml` exists with N entries, when `node scripts/sprint/validate.js .claude/project/sprint/active-sprints.yaml` runs, then it exits 0 and reports `valid against warpos/sprint/active-sprints/v1`.
- **AC-1.3** Given `active-sprints.yaml` has a `primary: <SP-id>` pointer, when `SPRINT.active()` is called, then it returns that id.

## S-2 — Per-sprint state subdirs

- **AC-2.1** Given a sprint `SP-X` exists in `active-sprints.yaml`, when any helper writes its current/progress yaml, then the file lands at `.claude/project/sprint/sprints/SP-X/current.yaml` (or `.../progress.yaml`) — not at the legacy root path.
- **AC-2.2** Given two sprints `SP-A` and `SP-B` both have subdirs, when a helper writes to `SP-B`'s current, then `SP-A`'s files are byte-unchanged.

## S-3 — Loosen current-sprint schema constraint

- **AC-3.1** Given `current-sprint.schema.json`, when read, then its `description` does NOT contain "Always exactly one current-sprint.yaml per downstream repo".
- **AC-3.2** Given a `current-sprint.yaml` with `lane: { type: "worktree", value: "../warpos-lane-b" }`, when validated, then it passes the schema.

## S-4 — Migration script for SP-20260512-001

- **AC-4.1** Given the legacy `current-sprint.yaml` + `sprint-progress.yaml` at the project root, when `node scripts/sprint/migrate-v0.2.js --dry-run` runs, then it prints the move plan and exits 0 without touching disk.
- **AC-4.2** Given dry-run was clean, when `node scripts/sprint/migrate-v0.2.js --apply` runs, then the two files move to `sprints/SP-20260512-001/` AND `active-sprints.yaml` is created.
- **AC-4.3** Given a successful apply, when the script's verify step compares the moved fields, then every field of every value present in the legacy file is reproduced byte-equivalent in the new location (yaml round-trip is allowed; semantic equivalence required).
- **AC-4.4** Given verification passes, when the script reaches the legacy-delete step, then it prompts `Confirm deletion of legacy files? [y/N]` and refuses to delete without `y`. Approval is recorded in `paths.sprintApprovals/` for audit.

## S-5 — Init template bugfix

- **AC-5.1** Given a fresh `node scripts/sprint/init.js` run, when `node scripts/sprint/validate.js` runs against the newly-created `current-sprint.yaml`, then it exits 0 with 0 validation errors.

## S-6 — `paths.js` per-sprint resolver

- **AC-6.1** Given `SPRINT.forSprint("SP-X")` is called, when the return value is inspected, then it has keys `current`, `progress`, `ralph`, `checkpoints`, `requirements`, `history` and each value points to a path under `sprints/SP-X/` (except `ralph`/`checkpoints`/`history`/`requirements` which already had per-sprint subdirs).
- **AC-6.2** Given `SPRINT.active()` is called when `active-sprints.yaml` has primary `SP-X`, when the return value is inspected, then it equals `SPRINT.forSprint("SP-X")`.
- **AC-6.3** Given the legacy callers `SPRINT.current` and `SPRINT.progress` are read (back-compat aliases retained for one release), when the live primary is `SP-X`, then they resolve to `sprints/SP-X/current.yaml` and `sprints/SP-X/progress.yaml`.

## S-7 — `--sprint` flag end-to-end

- **AC-7.1** Given any helper in `scripts/sprint/` (8 files), when invoked with `--sprint <SP-id>`, then all reads and writes target that sprint's subdir.
- **AC-7.2** Given a helper invoked without `--sprint`, when `active-sprints.yaml` has primary `SP-X`, then the helper targets `SP-X`.
- **AC-7.3** Given a helper invoked with `--sprint <SP-id>` for an id that does not exist in `active-sprints.yaml`, when it runs, then it exits non-zero with a message like `unknown sprint: SP-X — see active-sprints.yaml`.

## S-8 — Sprint command bodies document `--sprint`

- **AC-8.1** Given each of `/sprint:plan|design|execute|release|status` skill bodies, when read, then they document the `--sprint` flag, the default-to-primary behavior, and a one-line resume snippet.
- **AC-8.2** Given `paths.sprintReference` (`sprint-workflow.md`), when read, then it contains a "Lanes & parallel sprints" section linking to `_docs/sprint/LANES.md`.

## S-9 — Plan Contract gains a `lane` field

- **AC-9.1** Given `schemas/sprint/plan-contract.schema.json`, when read, then `lane` is a required field with sub-keys `type` (`default|worktree|branch`), `value` (string-or-null), `isolation_notes` (string).
- **AC-9.2** Given `node scripts/sprint/plan.js --payload <file>` runs with a payload omitting `lane`, then the Plan Contract is written with `lane: { type: "default", value: null, isolation_notes: "" }` and the run exits 0.

## S-10 — `/sprint:execute` honors `lane.type === "worktree"`

- **AC-10.1** Given a sprint with `lane: { type: "worktree", value: "../warpos-lane-b" }`, when `/sprint:execute` starts a Ralph loop, then `execute.js` verifies the worktree exists, chdir's into it for the loop, and writes its commits there.
- **AC-10.2** Given two sprints `SP-A` (lane: default) and `SP-B` (lane: worktree), when both Ralph loops are in their `act` phase concurrently, then `git log -1 --format=%H` differs between the two trees AND neither tree's HEAD is corrupted by the other.
- **AC-10.3** Given a `lane.type === "worktree"` sprint whose `lane.value` path does not exist on disk, when `/sprint:execute` starts, then it exits with `lane worktree missing: <path> — run 'git worktree add <path>' first` and does NOT create the worktree silently.

## S-11 — Worktree warm-up dispatch

- **AC-11.1** Given a worktree-lane sprint just started its Ralph loop, when `execute.js` is about to spawn its first agent dispatch, then it first spawns one no-op warm-up agent via `node scripts/dispatch-agent.js` with the same isolation primitive — and only after that warm-up returns does it spawn real builder/reviewer agents. The warm-up call is logged via `logEvent("warmup", "sprint", ...)` for audit.

## S-12 — Routing concurrency block

- **AC-12.1** Given `.claude/agents/00-alex/.system/policy/sprint-routing.json`, when read, then it contains a `concurrency: { max_lanes: <int ≥ 1>, default_lane: "default", default_isolation: "worktree" }` block.
- **AC-12.2** Given `scripts/sprint/routing.js`, when called as `routing.concurrency()`, then it returns the parsed block.

## S-13 — Conflict-check

- **AC-13.1** Given two active+executing sprints whose `affected_surfaces` sets are disjoint, when `node scripts/sprint/conflict-check.js --sprint <SP-id>` runs against the candidate sprint id, then it exits 0 and reports `no conflicts`.
- **AC-13.2** Given two active+executing sprints whose `affected_surfaces` sets share at least one entry, when `conflict-check.js` runs, then it exits non-zero and reports each conflicting surface with both sprint ids.
- **AC-13.3** Given a conflict exists, when `/sprint:execute --allow-overlap` is passed, then execution proceeds AND the override is logged to `paths.decisionLedger` with reason `manual_allow_overlap`.

## S-14 — Append singleton sprint-id tagging

- **AC-14.1** Given `logEvent(...)` is called inside a sprint helper that knows its `sprint_id`, when the resulting row lands in `paths.eventsFile`, then it includes a `sprint_id: "SP-…"` field.
- **AC-14.2** Given `scripts/sprint/issue.js create --sprint SP-X` runs, when `issues.md` is read, then the appended block starts with `## [SP-X] <issue title>` AND the corresponding YAML record carries `sprint_id: "SP-X"`.
- **AC-14.3** Given any append singleton row lacks a `sprint_id` (pre-existing rows), when a reader filters by sprint, then those rows are returned for `sprint_id == null` queries and excluded from `sprint_id == "SP-X"` queries. (Forward-compat, not retro-fill.)

## S-15 — `/sprint:status` command

- **AC-15.1** Given `active-sprints.yaml` lists ≥ 1 sprint, when `node scripts/sprint/status.js` runs, then it prints a table with columns `SPRINT_ID`, `TITLE`, `LANE`, `PHASE`, `STATUS`, `LAST_CHECKPOINT`, `RESUME_COMMAND` and exits 0.
- **AC-15.2** Given a sprint is in `executing` state, when `status.js` runs, then that row also lists `CURRENT_TICKET` and `CURRENT_LOOP`.

## S-16 — `sprint-tracker-guard.js` accepts new layout

- **AC-16.1** Given a write to `.claude/project/sprint/sprints/SP-X/current.yaml` with a valid `warpos/sprint/current-sprint/v1` body, when `sprint-tracker-guard.js` fires, then the write is allowed.
- **AC-16.2** Given a write to `.claude/project/sprint/sprints/SP-X/current.yaml` with a body missing a required field, when the guard fires, then the write is blocked with a schema-mismatch reason.

## S-17 — Sprint docs

- **AC-17.1** Given `_docs/sprint/LANES.md`, when read, then it describes (a) the three lane types, (b) when to choose each, (c) how to create a worktree lane (`git worktree add` example), (d) the conflict-check contract, (e) the warm-up dispatch workaround citation.
- **AC-17.2** Given the four existing sprint docs (`OVERVIEW`, `CRASH_RECOVERY`, `FRAMEWORK_VS_DOWNSTREAM`, `MODE_RELATIONSHIP`) and `paths.sprintReference`, when read, then none of them still describe sprint as a singleton; all reference lanes and `active-sprints.yaml` in their relevant sections.

## S-18 — ADR for multi-sprint lane architecture

- **AC-18.1** Given `paths.policy/adr/`, when listed, then there is a new ADR file named `0002-multi-sprint-parallel-lanes.md` documenting: context, decision (recommended variant + worktree default), rejected alternatives (minimal_safe, expanded coordinator), consequences (operational burden, follow-up sprints), Beta verdict reference.
