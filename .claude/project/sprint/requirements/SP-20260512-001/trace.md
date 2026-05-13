# TRACE — Multi-sprint parallelism

**Sprint:** `SP-20260512-001`
**PRD:** `prd.md`

TRACE links the source request to the requirement, the code change, the test, the release, and the learning. Runtime events still flow through `paths.eventsFile` via `scripts/hooks/lib/logger.js`. TRACE here is the **schema** for what those events MUST capture for this sprint.

## Trace map

| Source                                    | Req   | Story        | COPY  | INPUT  | ESD | Ticket    | Code                                                      | Test                                                    | Release             | Learning                                  |
|---|---|---|---|---|---|---|---|---|---|---|
| "Run multiple sprints in parallel"        | R-1   | S-1, S-2     | —     | IN-3, IN-6 | — | T-001..002 | `scripts/sprint/init.js`, `paths.js`                      | `scripts/test-sprint-hooks.js` extend                   | (this sprint)       | (post-retro)                              |
| Same                                      | R-1   | S-4          | C-7, C-8 | IN-3 | — | T-006     | `scripts/sprint/migrate-v0.2.js` (new)                    | `scripts/test-sprint-migration.js` (new)                | (this sprint)       | (post-retro)                              |
| Same                                      | R-1   | S-5          | —     | —      | — | T-007     | `framework/templates/sprint/init/current-sprint.yaml.tmpl` | `scripts/test-sprint-hooks.js` extend                  | (this sprint)       | template-vs-schema-validation             |
| Same                                      | R-2   | S-6          | —     | IN-1, IN-3 | — | T-003     | `scripts/sprint/paths.js`                                  | unit test                                              | (this sprint)       | (post-retro)                              |
| Same                                      | R-2   | S-7, S-8     | C-10  | IN-1   | — | T-004..005 | 8 helpers; 5 command bodies; `sprint-workflow.md`         | sprint-hooks test                                       | (this sprint)       | (post-retro)                              |
| Same                                      | R-3   | S-9          | C-1   | IN-2   | — | T-008     | `schemas/sprint/plan-contract.schema.json`, `plan.js`     | schema validator                                        | (this sprint)       | —                                         |
| Same                                      | R-3   | S-10, S-11   | C-6   | IN-7   | — | T-009..010 | `scripts/sprint/execute.js`                                | smoke: two worktree lanes, parallel                     | (this sprint)       | parallel-dispatch-leak (LRN ref)          |
| Same                                      | R-3   | S-12         | —     | —      | — | T-011     | `sprint-routing.json`, `routing.js`                        | unit test                                              | (this sprint)       | —                                         |
| Same                                      | R-4   | S-13         | C-4, C-5 | IN-4 | — | T-012     | `scripts/sprint/conflict-check.js` (new); `plan.js`; `execute.js` | unit test                                       | (this sprint)       | (post-retro)                              |
| Same                                      | R-5   | S-14         | C-9   | —      | — | T-013     | `scripts/hooks/lib/logger.js`; `scripts/sprint/issue.js`; decision-ledger appender; Beta event appender | grep-by-sprint-id integration test | (this sprint)       | (post-retro)                              |
| Same                                      | R-6   | S-15         | C-2, C-3 | —    | — | T-014     | `.claude/commands/sprint/status.md` (new); `scripts/sprint/status.js` (new) | golden output test                          | (this sprint)       | —                                         |
| Same                                      | R-7   | S-16         | —     | —      | — | T-015     | `scripts/hooks/sprint-tracker-guard.js`                    | `scripts/test-sprint-hooks.js`                          | (this sprint)       | —                                         |
| Same                                      | R-8   | S-17         | —     | —      | — | T-016..017 | `_docs/sprint/LANES.md` (new); 4 existing docs; `sprint-workflow.md` | docs-only                                  | (this sprint)       | —                                         |
| Same                                      | R-8   | S-18         | —     | —      | — | T-018     | `paths.policy/adr/0002-multi-sprint-parallel-lanes.md` (new) | —                                                    | (this sprint)       | —                                         |

## Events captured

### TR-1 — `sprint.created`

**Event:** new sprint registered.
**When:** `/sprint:plan` writes a new entry to `active-sprints.yaml`.
**Captured fields:** `sprint_id`, `title`, `lane.type`, `lane.value`, `created_by`, `at`.
**Linked requirement:** `R-1`, `R-3`.
**Why we capture this:** lets `/sprint:status` show creation history; lets retros reconstruct when a sprint was opened.

### TR-2 — `sprint.lane.worktree_used`

**Event:** `/sprint:execute` chdir's into a worktree lane.
**When:** first Ralph phase that lands in `lane.value`.
**Captured fields:** `sprint_id`, `lane.value`, `worktree_head_sha`, `at`.
**Linked requirement:** `R-3`.
**Why we capture this:** confirms execution actually ran in the intended worktree (not the default tree by accident).

### TR-3 — `sprint.warmup_dispatch`

**Event:** the no-op warm-up agent fired before the first Ralph dispatch in a worktree lane.
**When:** before any real builder/reviewer agent inside `/sprint:execute`.
**Captured fields:** `sprint_id`, `lane.value`, `reason: first-dispatch-leak-workaround`, `at`.
**Linked requirement:** `R-3` (S-11).
**Why we capture this:** allows future retros to confirm the workaround fired (and to detect if it ever didn't).

### TR-4 — `sprint.conflict_check.run`

**Event:** `conflict-check.js` ran for a candidate sprint.
**When:** `/sprint:plan` finishes; `/sprint:execute` starts.
**Captured fields:** `sprint_id`, `phase: plan|execute`, `result: clean|conflict`, `conflicts: [{ surface, other_sprint_id }]`, `allow_overlap: bool`, `at`.
**Linked requirement:** `R-4`.
**Why we capture this:** audit trail for `--allow-overlap` overrides; surfaces drift between declared and actual affected surfaces over time.

### TR-5 — `sprint.append.tagged`

**Event:** any append-singleton row written with a `sprint_id` field.
**When:** every `logEvent(...)`, decision-ledger append, Beta event append, or `issue.js create`.
**Captured fields:** the row itself, with `sprint_id` populated.
**Linked requirement:** `R-5`.
**Why we capture this:** primary forensic value of this sprint. Without it, two concurrent sprints' logs are an unreadable interleave.

### TR-6 — `sprint.migration.applied`

**Event:** `migrate-v0.2.js` finished `--apply`, including verify step.
**When:** the migration script's success branch.
**Captured fields:** `sprint_id` (the migrated id), `legacy_paths_deleted: bool`, `verified_field_count`, `at`.
**Linked requirement:** `R-1`.
**Why we capture this:** records the one-time upgrade event so a later session knows whether legacy files have been removed.

### TR-7 — `sprint.status.viewed`

**Event:** `/sprint:status` ran.
**When:** user invocation.
**Captured fields:** `viewer`, `active_sprints_count`, `at`.
**Linked requirement:** `R-6`.
**Why we capture this:** weak signal — tells us whether the new status command is actually being used. Low-priority capture; feel free to drop if logger overhead becomes a concern.
