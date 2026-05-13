# COPY Requirements — /sprint:retrospective skill — close-of-sprint reflection

**Sprint:** `SP-20260513-004`
**PRD:** `prd.md`

> COPY captures user-visible text and content expectations. Each entry
> is a concrete string the product will display, with context. Keep
> ids stable so tickets can link to specific copy blocks.

## C-1 — Retro section headings (linked story `S-4`)

**Context:** Section headings used in the rendered `retro.md` doc.
These are the canonical structure the synthesis prompt also targets.

**Text:**

> ```
> # Sprint Retrospective — <sprint-title>
>
> ## Summary
> ## Outcomes Shipped vs Planned
> ## Plan Quality — Predictions vs Reality
> ## Scope Variant Adherence
> ## Surprises
> ## Friction Points
> ## Action Items for Next Sprint
> ## Tickets Completed
> ## Tickets Deferred or Abandoned
> ## Issues Encountered
> ## Beta Decisions Reviewed
> ## Key Tradeoffs
> ## Learning Candidates
> ## Sign-off
> ```

**Notes:** Section order is stable — downstream tools (`/check:patterns`
later) parse by heading. Do not rename without bumping the retro
schema.

## C-2 — "Sprint not in closed state" error (linked story `S-5`)

**Context:** Printed to stderr and surfaced to the operator when the
target sprint is in any state other than `closed` or `abandoned`. The
skill exits non-zero.

**Text:**

> Sprint `<SP-id>` is in state `<status>`. `/sprint:retrospective`
> requires the sprint to be `closed` or `abandoned`. Finish
> `/sprint:release` first, or invoke `/sprint:retrospective` against
> a different sprint via `--sprint <SP-id>`.

**Notes:** Mirror the tone of existing sprint command errors. Include
the actual current status so the operator doesn't have to look it up.

## C-3 — "No plan contract found" error (linked story `S-2`)

**Context:** Printed to stderr when the target sprint has no
`plan_contract` pointer in its `current.yaml` or the referenced Plan
Contract file is missing.

**Text:**

> No Plan Contract found for sprint `<SP-id>`. The retro needs the
> Plan Contract to compare predictions vs reality. Expected at
> `<path>`. Re-run `/sprint:plan --sprint <SP-id>` to recreate it,
> or pass `--no-plan-contract` to write a retro without the
> plan-quality section.

**Notes:** `--no-plan-contract` is documented in INPUTS but is a
graceful-degradation escape hatch, not a primary flag.

## C-4 — "Retro complete" success message (linked story `S-2`)

**Context:** Printed to stdout when `/sprint:retrospective` finishes
successfully and the registry status has been flipped.

**Text:**

> Retrospective written for `<SP-id>`.
>   YAML: `<paths.sprintHistory>/<SP-id>/retro.yaml`
>   MD:   `<paths.sprintHistory>/<SP-id>/retro.md`
> Sprint status: closed → retrospected.
> Synthesis: `<llm|skeleton>`. Action items: `<n>`.
> Next: review `<retro.md>` and amend any synthesized sections.

**Notes:** Keep terse. The retro YAML is the source of truth; the
on-screen summary is a pointer.

## C-5 — "Retro already exists" warning (linked story `S-2`)

**Context:** Printed when a retro already exists at the target path and
`--force` was not passed. Skill exits with code `4`.

**Text:**

> Retro already exists for `<SP-id>` at
> `<paths.sprintHistory>/<SP-id>/retro.yaml`. Pass `--force` to
> overwrite, or `--review-only` to print the existing retro without
> regenerating.

**Notes:** Idempotent behavior is documented in the skill — `--force`
is the standard escape hatch.

## C-6 — "Unknown sprint" error (linked story `S-3`, shared with COPY C-10 family)

**Context:** Printed when `--sprint <SP-id>` references a sprint not in
`paths.sprintActiveRegistry` AND not in `paths.sprintHistory`.

**Text:**

> Unknown sprint `<SP-id>`. Not found in active-sprints registry or
> sprint history. Run `/sprint:status` to list active sprints, or
> check `paths.sprintHistory/` for archived ids.

**Notes:** Aligns with the shared COPY C-10 convention across sprint
skills (per `sprint-workflow.md`).

## C-7 — "Synthesis failed, falling back to skeleton" warning (linked story `S-6`)

**Context:** Printed when the LLM synthesis call fails (timeout,
provider error, schema mismatch) and the skill auto-falls back to
skeleton mode.

**Text:**

> Synthesis call failed: `<reason>`. Falling back to skeleton-only
> retro. Re-run with `--retry-synth` after fixing the upstream issue,
> or fill the retro by hand.

**Notes:** Fail-open is the right default — operator still gets a
durable skeleton retro and can re-synthesize later.
