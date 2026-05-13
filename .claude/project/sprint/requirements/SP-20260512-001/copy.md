# COPY — Multi-sprint parallelism

**Sprint:** `SP-20260512-001`
**PRD:** `prd.md`

User-visible text. WarpOS sprint is a CLI/skill surface, so "copy" here means the strings printed by commands and the prose users see when they read the docs/skill bodies. Ids are stable so tickets link to specific blocks.

---

## C-1 — `/sprint:plan` mode-aware lane note (linked story `S-9`)

**Context:** Printed by `/sprint:plan` summary if Plan Contract sets a non-default lane.

**Text:**

> Lane: `{lane.type}{:" + lane.value if lane.value else ""}`.
> If you want a separate working tree for this sprint, run `git worktree add {lane.value or "<path>"}` before `/sprint:execute`.

**Notes:** Only printed when `lane.type !== "default"`. Suppressed otherwise to keep happy-path output tight.

---

## C-2 — `/sprint:status` table header (linked story `S-15`)

**Context:** First line of the `/sprint:status` output.

**Text:**

> `SPRINT_ID         LANE                STATUS       PHASE     LAST_CHECKPOINT                              RESUME_COMMAND`

**Notes:** Column widths chosen for an 80-column terminal at typical id+lane lengths. Header is plain ASCII so it pipes cleanly.

---

## C-3 — `/sprint:status` empty state (linked story `S-15`)

**Context:** When `active-sprints.yaml` has no entries.

**Text:**

> No active sprints. Run `/sprint:plan "<request>"` to create one.

**Notes:** Single line. Suggests the next step.

---

## C-4 — Conflict-check warning (linked story `S-13`)

**Context:** Printed by `conflict-check.js` and surfaced by `/sprint:plan`.

**Text:**

> Affected-surface overlap detected between `{sprint_a}` and `{sprint_b}`:
>   - `{surface_1}`
>   - `{surface_2}`
> Pass `--allow-overlap` to proceed anyway. The override will be logged to the decision ledger.

**Notes:** Lists every overlapping surface, one per line. Newline-terminated. Exit code is non-zero unless `--allow-overlap` is set.

---

## C-5 — Conflict-check block at execute (linked story `S-13`)

**Context:** Printed by `/sprint:execute` before starting a Ralph loop when a conflict exists.

**Text:**

> `/sprint:execute` refused: `{sprint_id}` overlaps with `{other_sprint_id}` on `{count}` surface(s). Re-run with `--allow-overlap` to proceed, or rescope this sprint's `affected_surfaces`.

**Notes:** Block at execute is harder than at plan (matches the spec: warn at plan, block at execute).

---

## C-6 — Worktree-missing error (linked story `S-10`)

**Context:** Printed by `/sprint:execute` when `lane.type === "worktree"` and the worktree path does not exist.

**Text:**

> `/sprint:execute` refused: lane worktree missing at `{lane.value}`. Run `git worktree add {lane.value}` then retry. (Worktree creation is intentionally manual — the helper does not create branches for you.)

**Notes:** Manual worktree creation by design — keeps the founder in control of branch naming and remote tracking.

---

## C-7 — Migration-script confirmation prompt (linked story `S-4`)

**Context:** Printed by `scripts/sprint/migrate-v0.2.js` after verify passes, before deleting legacy files.

**Text:**

> Migration verified — every field of the legacy tracker is present in the new layout.
> Delete legacy files at:
>   - `{legacy_current_path}`
>   - `{legacy_progress_path}`
> Confirm? [y/N]:

**Notes:** Default is `N`. Operator must type `y` and press enter. Approval is recorded.

---

## C-8 — Migration-script dry-run summary (linked story `S-4`)

**Context:** Printed by `scripts/sprint/migrate-v0.2.js --dry-run`.

**Text:**

> DRY RUN — no files changed.
> Would create: `.claude/project/sprint/sprints/{sprint_id}/`
> Would move:
>   - `{legacy_current}` → `sprints/{sprint_id}/current.yaml`
>   - `{legacy_progress}` → `sprints/{sprint_id}/progress.yaml`
> Would write: `.claude/project/sprint/active-sprints.yaml` (primary: `{sprint_id}`).
> Re-run with `--apply` to perform the migration.

**Notes:** Designed to be safe to run repeatedly.

---

## C-9 — Warm-up dispatch log row (linked story `S-11`)

**Context:** Written to `paths.eventsFile` before the first real Ralph dispatch in a worktree lane.

**Text:**

> `{"type":"warmup","subsystem":"sprint","actor":"<command>","sprint_id":"<SP-id>","lane":"<lane.value>","reason":"first-dispatch-leak-workaround","at":"<iso-time>"}`

**Notes:** Machine-readable. References the LRN in `scripts/one-off-log-dispatch-issues.js`.

---

## C-10 — `--sprint` unknown-id error (linked story `S-7`)

**Context:** Printed by any sprint helper when `--sprint <SP-id>` names an id not in `active-sprints.yaml`.

**Text:**

> unknown sprint: `{sprint_id}`. See `.claude/project/sprint/active-sprints.yaml` for the live set, or run `/sprint:status`.

**Notes:** Tells the user what to look at next.
