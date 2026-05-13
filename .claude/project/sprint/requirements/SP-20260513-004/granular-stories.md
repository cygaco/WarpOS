# Granular Stories — /sprint:retrospective skill — close-of-sprint reflection

**Sprint:** `SP-20260513-004`
**High-level stories:** `high-level-stories.md`

> Granular stories use the `S-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`. Each granular story
> should produce roughly one ticket during `/sprint:design`.

## S-1 — Author `sprint-retrospective.schema.json`

**As** Alex α
**I want** a JSON Schema for the retrospective artifact at
`schemas/sprint/sprint-retrospective.schema.json`
**So that** retros are validated, machine-readable, and stable across
the framework.

Acceptance criteria:
- AC-1: New file exists at the exact path; sibling to
  `sprint-history.schema.json`.
- AC-2: `additionalProperties: false`; required fields include
  `sprint_id`, `plan_contract_id`, `outcomes_shipped`,
  `outcomes_missed`, `plan_quality_actual`, `scope_variant_actual`,
  `friction_points`, `action_items`, `signed_off_by`, `signed_off_at`.
- AC-3: Validates a hand-written sample retro for SP-20260512-001.

Linked: `H-1`, `H-2`, `H-3`, `R-1`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-2 — Implement `scripts/sprint/retrospective.js`

**As** Alex α
**I want** a Node script that reads a closed sprint's tracker
artifacts and writes `retro.yaml` + `retro.md`
**So that** the skill body has dumb plumbing to turn synthesized
content into durable files.

Acceptance criteria:
- AC-1: Reads Plan Contract, tickets (by bucket), issues, decisions,
  checkpoints, release record, and `sprint-history.yaml`.
- AC-2: Writes `paths.sprintHistory/<sprint-id>/retro.yaml` and
  `retro.md`, validates YAML against the new schema, exits non-zero
  on validation failure.
- AC-3: Mirrors `scripts/sprint/plan.js`/`design.js` conventions:
  uses `scripts/sprint/paths.js`, `scripts/sprint/fs.js`,
  `scripts/sprint/ids.js`; never hard-codes paths.

Linked: `H-1`, `H-2`, `R-2`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-3 — Write skill doc `.claude/commands/sprint/retrospective.md`

**As** an operator
**I want** a discoverable `/sprint:retrospective` skill with clear
inputs, procedure, outputs, recovery, and routing sections
**So that** I can invoke it without reading the source.

Acceptance criteria:
- AC-1: Frontmatter has `description` + `user-invocable: true`.
- AC-2: Mirrors structure of `.claude/commands/sprint/release.md`:
  When-to-use, Inputs, Procedure (numbered steps), Outputs, Recovery,
  Approval gates, Routing, Reference.
- AC-3: Documents `--sprint`, `--no-synth`, `--force`, `--review-only`
  flags (linked to `inputs.md`).

Linked: `H-1`, `R-3`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-4 — Write templates `retro.yaml.tmpl` + `retro.md.tmpl`

**As** Alex α
**I want** template files under
`framework/templates/sprint/retrospective/`
**So that** the script can render consistent retro artifacts.

Acceptance criteria:
- AC-1: Both files exist; `.tmpl` extension; use `{{token}}` syntax
  matching the existing `fs.js#render` helper.
- AC-2: YAML template seeds every required schema field with a
  placeholder token.
- AC-3: MD template renders human-readable retro doc with section
  headings per COPY `C-1`.

Linked: `H-2`, `R-4`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-5 — Status transition `closed` → `retrospected`

**As** Alex α
**I want** the script to flip the matching `sprints[]` entry in
`paths.sprintActiveRegistry` from `closed` to `retrospected`
**So that** the registry reflects which sprints have had a retro and
which haven't.

Acceptance criteria:
- AC-1: New `retrospected` value added to the `status` enum in
  `schemas/sprint/active-sprints.schema.json`.
- AC-2: `retrospective.js` updates the matching entry's `status` and
  `updated_at`. Idempotent on re-run.
- AC-3: Sprints not in `closed` or `abandoned` state cannot be
  retrospected — script exits with code `3` and COPY `C-2` message.

Linked: `H-2`, `R-5`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-6 — Design + wire the synthesis prompt

**As** Alex α
**I want** a synthesis prompt that drafts each retro section from
tracker evidence only
**So that** the LLM never hallucinates wins or misses not supported by
data.

Acceptance criteria:
- AC-1: Prompt body lives inline in `retrospective.js` (or a sibling
  `.txt` file under `scripts/sprint/prompts/`); routed via
  `paths.sprintRouting#policies.release` model class.
- AC-2: Prompt instructs the model: only synthesize from supplied
  evidence; mark unknown fields explicitly with the literal string
  `<unknown — no evidence in tracker>`; output structured JSON
  matching the retro YAML shape.
- AC-3: Prompt is tested against SP-20260512-001 evidence and
  produces a valid retro (manual review).

Linked: `H-3`, `R-6`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-7 — `--no-synth` skeleton-only mode

**As** an operator
**I want** to invoke `/sprint:retrospective --no-synth`
**So that** I get a placeholder retro I can fill by hand — useful
when offline, the LLM is down, or I want to write it myself.

Acceptance criteria:
- AC-1: `--no-synth` skips the LLM call entirely; emits
  placeholder retro using `<TO FILL>` tokens.
- AC-2: Result still validates against
  `sprint-retrospective.schema.json` (placeholders are valid string
  values).
- AC-3: Documented in skill doc + INPUTS `IN-2`.

Linked: `H-1`, `R-7`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-8 — Update `sprint-workflow.md` reference doc

**As** any agent or operator reading the sprint reference
**I want** the workflow doc to document the retrospective phase
**So that** the docs are not stale on landing.

Acceptance criteria:
- AC-1: Commands table includes `/sprint:retrospective` row.
- AC-2: Lifecycle hierarchy diagram includes retro as terminal phase
  after release.
- AC-3: Documents the `closed → retrospected` status transition and
  the deferred mid-sprint + cross-sprint scope.

Linked: `H-3`, `R-8`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.
