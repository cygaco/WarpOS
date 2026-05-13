# PRD — /sprint:retrospective skill — close-of-sprint reflection

**Sprint:** `SP-20260513-004`
**Plan Contract:** `PC-20260513-0005`
**Status:** draft
**Documentation scale:** `m`

## Outcome

After a sprint closes, the operator can run `/sprint:retrospective` and get
a structured retro that surfaces wins, misses, friction, and action
items, written durably to the sprint's history record. Retros
accumulate so trends across sprints become visible.

## Context

### Original Request

> A sprint:retrospective skill.

### Interpreted Intent

Add a `/sprint:retrospective` skill that produces a post-sprint
reflection — what shipped, what didn't, why, what to change next
sprint — and integrates with the rest of the sprint workflow (plan /
design / execute / release).

### Current Behavior

Sprint workflow has `/sprint:plan`, `/sprint:design`, `/sprint:execute`,
`/sprint:release`, `/sprint:status`. There is no `/sprint:retrospective`.
`sprint-history.schema.json` exists but is the registry-of-closed-sprints
artifact (frozen archive), not an analytical retro. `/sprint:release`
Step 8 already references a "Trigger retrospective + learning" sub-step,
but the actual skill does not exist — that's the gap this sprint closes.

### Desired Behavior

`/sprint:retrospective` reads the closed sprint's Plan Contract, design
docs, tickets (by bucket), issues, decisions, checkpoints, and release
record. Synthesizes a retro covering:

- outcomes shipped vs planned
- `plan_quality` predictions vs reality
- scope-variant adherence (which variant the plan picked, which actually
  shipped)
- surprises
- friction points
- action items for next sprint

Writes `retro.yaml` + `retro.md` under
`paths.sprintHistory/<sprint-id>/`. Updates
`paths.sprintActiveRegistry#sprints[].status` from `closed` to
`retrospected`. Idempotent: re-running on an already-`retrospected`
sprint requires `--force` and rewrites both files in place.

## Design Decisions

1. **Schema location:** new
   `schemas/sprint/sprint-retrospective.schema.json` (sibling to
   `sprint-history.schema.json`).
   *Rationale:* `sprint-history` is the frozen registry of closed
   sprints; retrospective is a per-sprint analytical artifact.
   Separating them keeps each schema focused — `sprint-history` stays
   stable across the framework, while retrospective fields can evolve
   independently as we learn what to capture.
2. **Synthesis backend:** LLM-by-default per `paths.sprintRouting`
   (`model_class = strong_reasoning`, `diff_review = true`). Skill
   assembles tracker artifacts into a synthesis prompt → drafts each
   section → operator reviews + amends. `--no-synth` flag emits a
   skeleton-only retro (placeholders) for offline or low-cost use.
   *Rationale:* recommended scope per Plan Contract; synthesis is the
   feature's main leverage.
3. **Status transition:** retro writes update
   `paths.sprintActiveRegistry#sprints[].status` from `closed` to
   `retrospected`. The transition is **idempotent**: re-running on
   `retrospected` is allowed with `--force` and does not double-write
   active-sprints. Sprints in any non-terminal state (not `closed` or
   `abandoned`) cannot be retrospected — the skill exits non-zero with
   COPY `C-2` "sprint not in closed state".
4. **Mid-sprint check-in support:** deferred to expanded scope.
   MVP is post-release only.
5. **Cross-sprint trend analysis:** deferred to expanded scope.
   MVP retros are per-sprint; trend analysis hooks into
   `/check:patterns` later.

## Requirements

> Uses the `R-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`.

- `R-1` — New schema at `schemas/sprint/sprint-retrospective.schema.json`
  (sibling to `sprint-history.schema.json`). `additionalProperties:
  false`. Required fields: `schema`, `sprint_id`, `plan_contract_id`,
  `outcomes_shipped`, `outcomes_missed`, `plan_quality_actual`,
  `scope_variant_actual`, `friction_points`, `action_items`,
  `signed_off_by`, `signed_off_at`. Plus structured fields for
  surprises, tickets-completed, tickets-deferred, issues encountered,
  beta decisions reviewed, key tradeoffs, and learning candidates.
- `R-2` — `scripts/sprint/retrospective.js` writer. Mirrors
  `scripts/sprint/plan.js`/`scripts/sprint/design.js` patterns: reads
  per-sprint tracker artifacts via `paths.sprintHistory/<id>/` and
  `paths.sprintRoot` siblings, renders templates with the existing
  `fs.js#render`, writes `retro.yaml` + `retro.md` to
  `paths.sprintHistory/<sprint-id>/`, validates against
  `sprint-retrospective.schema.json`, updates
  `paths.sprintActiveRegistry`, writes a checkpoint via
  `scripts/sprint/checkpoint.js`, logs an event via
  `paths.loggerLib`. Exit codes: `0` success, `1` validation failure,
  `2` bad usage, `3` sprint not in closed state, `4` retro already
  exists without `--force`.
- `R-3` — `.claude/commands/sprint/retrospective.md` skill doc.
  Mirrors the structure of `.claude/commands/sprint/release.md`:
  frontmatter, When-to-use, Inputs, Step-by-step Procedure
  (collect → synthesize → review → write → update registry →
  checkpoint → surface), Outputs, Recovery, Approval gates (none —
  retro is reversible), Routing, Reference.
- `R-4` — Templates `framework/templates/sprint/retrospective/retro.yaml.tmpl`
  and `retro.md.tmpl` parallel to `framework/templates/sprint/history/`.
  YAML template seeds all required fields with placeholder tokens
  (`{{outcomes_shipped}}`, etc.); MD template renders a
  human-readable retro doc with section headings per COPY `C-1`.
- `R-5` — Status transition logic in `retrospective.js` updates the
  matching `sprints[]` entry in `paths.sprintActiveRegistry` from
  `closed` to `retrospected`, sets `updated_at`. **Sub-requirement:**
  add `retrospected` to the `status` enum in
  `schemas/sprint/active-sprints.schema.json#definitions.registryEntry.status`.
  Idempotent: re-write on already-`retrospected` is a no-op for the
  registry.
- `R-6` — Synthesis prompt (recommended scope). The skill assembles
  the prompt from tracker artifacts (Plan Contract, tickets by bucket,
  issues, decisions, checkpoints, release record, sprint-history
  entry). Prompt instructs the model: only synthesize from supplied
  evidence; mark unknown fields explicitly; never hallucinate wins or
  misses. Output is structured JSON matching the retro YAML shape.
  Routed via `paths.sprintRouting#policies.release` class
  (`strongest_reasoning`, `diff_review: true`) — release-class is
  the closest analogue.
- `R-7` — `--no-synth` skeleton-only mode. Skips the LLM call and
  emits placeholder text per section. Operator fills sections by hand.
  Useful when offline, the LLM budget is exhausted, or the operator
  wants to write the retro themselves.
- `R-8` — Sprint workflow doc update at
  `.claude/project/reference/sprint-workflow.md`: add a "Retrospective"
  row to the Commands table, document the status transition, link to
  the new schema, note the deferred mid-sprint and cross-sprint
  features. Update the lifecycle hierarchy diagram to include retro.

## Non-Goals

- Replacing learning extraction (`/learn:deep`, `/sleep:deep`). Retros
  emit `learning_candidates`; promotion remains the learning system's
  job.
- Auto-executing action items (no auto-ticket-mint into the next
  sprint).
- External publishing (Notion, Slack, email).
- Per-ticket retros.
- Mid-sprint check-ins (deferred to expanded scope).
- Cross-sprint trend analysis (deferred to expanded scope).

## Affected Surfaces

| Surface | Evidence Level |
|---|---|
| `.claude/commands/sprint/retrospective.md` (NEW) | assumed_from_request |
| `scripts/sprint/retrospective.js` (NEW) | assumed_from_request |
| `schemas/sprint/sprint-retrospective.schema.json` (NEW) | assumed_from_request |
| `schemas/sprint/active-sprints.schema.json` (status enum add) | verified_from_repo |
| `framework/templates/sprint/retrospective/retro.yaml.tmpl` (NEW) | assumed_from_request |
| `framework/templates/sprint/retrospective/retro.md.tmpl` (NEW) | assumed_from_request |
| `paths.sprintHistory/<sprint-id>/` (per-sprint output dir) | verified_from_repo |
| `paths.sprintActiveRegistry` (status transition) | verified_from_repo |
| `.claude/project/reference/sprint-workflow.md` (doc update) | verified_from_repo |

## External Service Dependencies

`status: none_expected`. Pure framework work. The LLM call goes
through existing `paths.sprintRouting` plumbing; no new providers, no
new credentials.

See `.claude/project/sprint/external-services/` for ESD records.

## Approval Boundaries

Retro is **reversible** — it writes files but does not deploy, send,
or contact anything external. Adding `retrospected` to the
`active-sprints` status enum is a Class B framework change (schema
contract). Decision recorded in this PRD; no separate approval.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260513-0005.yaml`
- High-level stories: `high-level-stories.md`
- Granular stories: `granular-stories.md`
- COPY: `copy.md`
- INPUTS: `inputs.md`
- TRACE: `trace.md`
- Acceptance criteria: `acceptance-criteria.md`
- QA plan: `qa-plan.md`
- Redteam plan: `redteam-plan.md`
- Release plan: `release-plan.md`
