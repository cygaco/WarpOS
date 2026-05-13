# PRD — /product:bootstrap skill — guided product brief in MD/HTML/DOCX

**Sprint:** `SP-20260513-001`
**Plan Contract:** `PC-20260513-0002`
**Status:** draft
**Documentation scale:** `m`

## Outcome

A founder/operator running a fresh project gets a thorough, multi-format product brief in one sitting without having to re-derive structure each time. The brief is the artifact other commands (sprint planning, design, onboarding) can lean on for product context.

## Context

### Original Request

> A feature to 'bootstrap' a product from an idea, creating a thorough product brief. This is intended to be the first command run in a new project. The brief should capture the following concepts at minimum: problem solved, JTBDs, value chain analysis, competitive analysis, wedge, vision, wedge to full vision, and mvp. In the creation of the brief, there should be a brief discussion with the user. Use `ai-web-brief-v4` under _docs as inspiration. The final output should result in md, docx, and html versions of the brief. This process should be initiated by a skill. Confirm the skill name with me before building.

### Interpreted Intent

Add a new user-invocable skill `/product:bootstrap` that walks an operator through a short discussion (≤8 turns) to produce a multi-section product brief and emits Markdown, HTML, and (when pandoc is available) DOCX outputs to `_docs/briefs/<slug>/`. Intended as the first command run in a new project. Section taxonomy is seeded from `_docs/ai-web-brief-v4.md` but trimmed to the listed minimum by default.

### Current Behavior

No bootstrap-brief skill exists. The closest analogue is `/sprint:plan` (request-level capture, not a strategic brief). The reference brief lives at `_docs/ai-web-brief-v4.{md,html}`. There is no DOCX rendering pipeline in repo and no `paths.briefs*` key registered.

### Desired Behavior

Operator runs `/product:bootstrap` once near project start. Skill greets, asks ≤8 AskUserQuestion turns covering every required section, drafts each section using the answers + repo signal, runs a coverage QC, then writes MD + HTML always and DOCX when pandoc is on PATH. Re-runs version the prior brief under `<slug>/history/<ISO>/` rather than silently overwriting. Output paths get registered in `paths.json` so downstream skills (sprint planning, onboarding, retrospectives) can read the brief reliably.

## Design-time Decisions (made by Alpha, not escalated)

**D-1 — Section set default.** Default emits the listed minimum: problem, JTBDs, value chain, competitive, wedge, vision, wedge-to-full-vision, MVP. Extended sections from `ai-web-brief-v4` (Bear case, Bull case, Quick Notes, References) are opt-in via `--section-set extended`. Rationale: matches the verbatim ask, keeps the discussion budget honest, and lets the operator opt up without forcing a heavier discussion on every run.

**D-2 — DOCX backend default.** Default backend is `pandoc` shellout. If pandoc is not on PATH, MD + HTML still ship and the operator sees a clear "install pandoc to enable DOCX" message with the platform-appropriate install hint. Rationale: avoids adding a new npm dep (`docx`) just to ship MVP, sidesteps cross-platform DOCX rendering quirks, and lets us bind a renderer choice later without committing to it now.

## Requirements

> Use existing requirement ID conventions enforced by
> `scripts/hooks/requirement-format-guard.js`. PRDs in `_requirements/`
> use `R-N` ids — sprint-scope PRDs that link to a feature in
> `_requirements/04-features/<feature>/PRD.md` should reuse those ids,
> not invent new ones.

- `R-1` — **Skill registration.** Ship `.claude/commands/product/bootstrap.md` registered under the `/product:` namespace. Invokable as `/product:bootstrap`. Help text matches `copy.md#C-1`.
- `R-2` — **Bounded discussion.** The skill MUST use AskUserQuestion with a hard budget of 8 turns per run (4 turns minimum to keep section coverage). The discussion script lives in `scripts/product/bootstrap.js` and maps each turn to ≥1 section ID. Exceeding 8 turns is a hard error caught in unit tests.
- `R-3` — **Section coverage QC.** Before any output is written, the generator MUST verify that every section in the active section set (minimum or extended) has non-empty content. Empty sections halt the run with `copy.md#C-7` and a list of missing sections. Sections that the operator explicitly marked `skipped_declined` via `IN-6` SATISFY coverage QC despite having no content — only truly empty sections (no content AND no explicit decline) halt the run. The generator records `skipped_declined` sections in the output as a single placeholder line so downstream parsers can detect them.
- `R-4` — **MD writer.** The generator MUST write `_docs/briefs/<slug>/<slug>.brief.md`, sectioned with `## NN — <Title>` headings matching the `ai-web-brief-v4` style. Headings are stable so downstream parsers can index them.
- `R-5` — **HTML writer with parity goal.** The generator MUST write `_docs/briefs/<slug>/<slug>.brief.html` using the template at `framework/templates/product-bootstrap/brief.html.tmpl`. Parity goal: visual match with `_docs/ai-web-brief-v4.html` within "looks like the same family of doc" — same heading hierarchy, monospace numerals, callout block style. Exact CSS parity is a non-goal for v0.1.
- `R-6` — **DOCX writer with pandoc fallback.** The generator MUST detect pandoc on PATH. If present, shell out to render `<slug>.brief.docx`. If absent, the run still succeeds with MD + HTML and emits `copy.md#C-5` with install hints. `--docx-backend none` skips DOCX entirely without warning.
- `R-7` — **Output path policy.** Output directory is `_docs/briefs/<slug>/` by default, overridable via `--output-dir`. Slug MUST match `[a-z0-9][a-z0-9-]{0,63}`. Slug collisions with existing dirs trigger the re-run policy.
- `R-8` — **paths.json registration.** On first successful emit, the generator MUST add `paths.briefs` (pointing at `_docs/briefs/`) and `paths.briefsCurrent` (pointing at the slug just emitted) to `.claude/paths.json`. Subsequent runs update `paths.briefsCurrent`. Honors the CLAUDE.md path-registry rule.
- `R-9` — **Re-run versioning.** Re-runs default to versioning the prior brief: move existing `<slug>/<slug>.brief.*` into `<slug>/history/<ISO-8601>/` and write fresh files at the top level. `--rerun-policy overwrite` overwrites without history. `--rerun-policy prompt` asks once.
- `R-10` — **TRACE events emitted.** The generator MUST emit `brief_started`, `section_completed` (one per section), and `brief_emitted` events to `paths.eventsFile`. Schema in `trace.md`. Fail-open: emit failures MUST NOT fail the user run.
- `R-11` — **Non-functional: discussion latency.** End-to-end run from invocation to written files MUST complete in ≤10 minutes on a warm Codex API on a normal-sized project (the discussion + generation does most of the wall time).
- `R-12` — **Non-functional: cross-platform.** The skill MUST run on Windows (primary dev env), macOS, and Linux without code changes. Path separators use `path.join`. Pandoc detection uses `which`/`where` shim.

## Non-Goals

- Replacing `/sprint:plan` or `/sprint:design`. The brief is upstream of sprint planning, not a substitute.
- Full strategic deliverable suite — no pitch deck, no financial model, no go-to-market plan generator.
- Auto-publishing to Notion, Google Drive, or any external system. Outputs stay in `_docs/`.
- Multi-language briefs. Output language matches input language; no translation pass.
- Refinement loop / per-section redraft. v0.1 ships single-pass discussion. Refinement is a future enhancement.
- Brief-from-existing-codebase synthesis. The skill leans on the discussion; it does not auto-extract from source.

## Affected Surfaces

| Surface | Evidence Level |
|---|---|
| `.claude/commands/product/bootstrap.md` (NEW skill file) | assumed_from_request |
| `scripts/product/bootstrap.js` (NEW generator) | assumed_from_request |
| `framework/templates/product-bootstrap/*.tmpl` (NEW MD/HTML templates) | assumed_from_request |
| `_docs/briefs/<slug>/<slug>.brief.{md,html,docx}` (NEW output) | assumed_from_request |
| `.claude/paths.json` (add `briefs`, `briefsCurrent`) | inferred_from_repo |
| `_docs/ai-web-brief-v4.{md,html}` (reference, unchanged) | verified_from_repo |

## External Service Dependencies

See `.claude/project/sprint/external-services/` for ESD records.

Proposed:
- `ESD-pandoc` — optional binary on PATH for DOCX rendering. Status: `optional`. No service signup; install via OS package manager.
- `ESD-docx-npm` — deferred. Only mint if D-2 is reversed during execute.

## Approval Boundaries

See Plan Contract `approval_boundaries`. Summary:
- Creating the new `/product:` namespace under `.claude/commands/` (touches commands index + paths). Approval recorded at design step.
- Adding `docx` npm dep if pandoc default is reversed. Not expected in this sprint.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260513-0002.yaml`
- High-level stories: `high-level-stories.md`
- Granular stories: `granular-stories.md`
- COPY: `copy.md`
- INPUTS: `inputs.md`
- TRACE: `trace.md`
- Acceptance criteria: `acceptance-criteria.md`
- QA plan: `qa-plan.md`
- Redteam plan: `redteam-plan.md`
- Release plan: `release-plan.md`
