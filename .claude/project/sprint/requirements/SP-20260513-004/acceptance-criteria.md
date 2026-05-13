# Acceptance Criteria — /sprint:retrospective skill — close-of-sprint reflection

**Sprint:** `SP-20260513-004`
**PRD:** `prd.md`

> Each AC is a testable statement. Link from the relevant granular story
> + the ticket that implements it.

## S-1 — Author `sprint-retrospective.schema.json`

- AC-1.1: **Given** the repo at HEAD with no
  `schemas/sprint/sprint-retrospective.schema.json`, **when** S-1's
  ticket is marked `done`, **then** the file exists, parses as valid
  JSON, and is loadable by `scripts/sprint/validate.js`.
- AC-1.2: **Given** the schema file, **when** I lint it for required
  fields, **then** the `required` array includes (at minimum)
  `schema`, `sprint_id`, `plan_contract_id`, `outcomes_shipped`,
  `outcomes_missed`, `plan_quality_actual`, `scope_variant_actual`,
  `friction_points`, `action_items`, `signed_off_by`,
  `signed_off_at`.
- AC-1.3: **Given** a hand-written sample retro for SP-20260512-001
  (sample lives in `framework/templates/sprint/retrospective/` as a
  fixture during development), **when** I validate it against the
  schema, **then** validation passes.

## S-2 — Implement `scripts/sprint/retrospective.js`

- AC-2.1: **Given** a closed sprint with full tracker artifacts,
  **when** I run `node scripts/sprint/retrospective.js --sprint
  <SP-id>`, **then** `paths.sprintHistory/<SP-id>/retro.yaml` and
  `retro.md` are written and the script exits `0`.
- AC-2.2: **Given** an open sprint (`status: executing`), **when** I
  run the script, **then** the script exits `3`, no files are
  written, and stderr contains COPY `C-2`.
- AC-2.3: **Given** a retro already exists, **when** I re-run without
  `--force`, **then** the script exits `4` and the existing files are
  untouched.

## S-3 — Write skill doc `.claude/commands/sprint/retrospective.md`

- AC-3.1: **Given** the skill doc, **when** an operator reads it,
  **then** they can identify `--sprint`, `--no-synth`, `--force`,
  `--review-only` from the Inputs section.
- AC-3.2: **Given** the skill doc, **when** `/help` indexes
  user-invocable skills, **then** `/sprint:retrospective` appears
  with its `description` frontmatter.

## S-4 — Write templates `retro.yaml.tmpl` + `retro.md.tmpl`

- AC-4.1: **Given** both template files exist under
  `framework/templates/sprint/retrospective/`, **when** the script
  renders them via `scripts/sprint/fs.js#render`, **then** all
  `{{token}}` placeholders are replaced from the synthesis output
  (or `<TO FILL>` in skeleton mode).
- AC-4.2: **Given** the rendered `retro.md`, **when** I read it,
  **then** the section order exactly matches COPY `C-1`.

## S-5 — Status transition `closed` → `retrospected`

- AC-5.1: **Given** `schemas/sprint/active-sprints.schema.json`,
  **when** I read the `status` enum, **then** `retrospected` is
  present.
- AC-5.2: **Given** a closed sprint, **when** the script writes a
  retro successfully, **then** the matching `sprints[].status` in
  `paths.sprintActiveRegistry` flips from `closed` to `retrospected`
  and `updated_at` is refreshed.
- AC-5.3: **Given** an already-`retrospected` sprint, **when** I
  re-run with `--force`, **then** the registry remains
  `retrospected` (no double-write), `updated_at` is refreshed, and
  the retro files are rewritten.

## S-6 — Design + wire the synthesis prompt

- AC-6.1: **Given** the synthesis prompt assembled from tracker
  artifacts, **when** the LLM is invoked, **then** the routing
  policy from `paths.sprintRouting` is honored (model class +
  diff_review).
- AC-6.2: **Given** the prompt is run against SP-20260512-001's
  evidence, **when** I read the output, **then** every claimed
  "outcome shipped", "friction point", and "action item" can be
  traced back to a Plan Contract field, ticket, issue, decision, or
  release-record field (no hallucinations).
- AC-6.3: **Given** evidence is sparse (e.g., no decisions
  recorded), **when** the prompt synthesizes that section, **then**
  the relevant fields contain the literal string `<unknown — no
  evidence in tracker>`.

## S-7 — `--no-synth` skeleton-only mode

- AC-7.1: **Given** the LLM is unreachable, **when** I run with
  `--no-synth`, **then** the script writes a skeleton retro and
  exits `0`.
- AC-7.2: **Given** the skeleton retro, **when** I validate it,
  **then** validation passes — placeholders are valid string values.
- AC-7.3: **Given** synthesis fails at runtime without `--no-synth`,
  **when** the failure handler runs, **then** the script auto-falls
  back to skeleton mode, prints COPY `C-7`, and exits `0`.

## S-8 — Update `sprint-workflow.md`

- AC-8.1: **Given** `.claude/project/reference/sprint-workflow.md`,
  **when** I grep for `/sprint:retrospective`, **then** at least one
  occurrence is in the Commands table.
- AC-8.2: **Given** the doc's lifecycle hierarchy diagram, **when**
  I read it, **then** retro appears as a terminal phase after
  release.
- AC-8.3: **Given** the doc, **when** I read the status-transition
  section, **then** the `closed → retrospected` flip is documented
  with a pointer to this PRD.
