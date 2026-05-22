# PRD — /product:import — generate a portable questionnaire to mine product context from another session, then feed /product:bootstrap

**Sprint:** `SP-20260520-002`
**Plan Contract:** `PC-20260521-0018`
**Status:** designed
**Documentation scale:** `m`

## Outcome

An operator can rescue a product that is "trapped" in a non–Claude-Code environment — an older repo, a long ChatGPT thread, a Notion page, scattered notes — and convert it into a proper Claude Code project rich enough that `/product:bootstrap` can mint real requirements for features that already exist. `/product:import` is the pre-step: run it in the target project, paste the generated questionnaire into the surface that holds the source-of-truth (Claude Code, Codex, Claude web, ChatGPT web, Gemini web), bring the answers back, and feed them straight into `/product:bootstrap --answers-file`. The manual interview burden disappears.

## Context

### Original Request

> /sprint:plan --turbo a skill that basically spits out questions for another claude session in another project to answer about the product being built. Make sure it works for claude code, codex, claude (just normal app), chatgpt (just normal app), etc. It should basically be a pre-step to the product:bootstrap skill. It should be called `product:convert`.
>
> [follow-up: Actually instead of 'product:convert' make it 'product:import']

### Interpreted Intent

Create a new skill `/product:import` in `.claude/commands/product/` that, run inside the target Claude Code project, (a) inspects bounded local context (`PROJECT.md`, `README.md`, `package.json`, last 10 commits) to seed a preamble; (b) emits a single paste-friendly Markdown questionnaire at `_docs/imports/<slug>/<slug>.questionnaire.md` mirroring `/product:bootstrap`'s section set (8 minimal / 12 extended); (c) renders identically enough across five answering surfaces — Claude Code, Codex, Claude web, ChatGPT web, Gemini web — that one universal artifact works in all of them; (d) offers a `--parse <pasted-answers-file>` mode that converts the returned markdown into the exact JSON map shape `/product:bootstrap --answers-file` consumes. User renamed the skill mid-prompt from `/product:convert` to `/product:import` — final, confirmed name is `import`.

### Current Behavior

`/product:bootstrap` runs an interactive 4–8-question conversation and writes `_docs/briefs/<slug>/<slug>.brief.{md,html,docx}`. It accepts `--answers-file <path>`, a JSON object keyed by section id (`{ "problem": "...", "jtbds": "...", ... }`), with each value either a string or a `{content, status, source_turns}` triple. There is no skill that emits a paste-friendly questionnaire for an external session. An operator who wants to drive bootstrap from answers gathered elsewhere has to construct that JSON map by hand from memory, a notes file, or another chat transcript — which is exactly the friction that keeps "trapped" products trapped.

### Desired Behavior

Operator runs `/product:import` in the Claude Code project where they want the brief to land. The skill:

1. **Probes** the project: resolves `slug` from `--slug` or `cwd` basename; bounded reads of `PROJECT.md`, `README.md`, `package.json`, `git log -n 10`; extracts a small set of hints (project name, stack signals, last activity).
2. **Drafts** a single Markdown questionnaire built from `framework/templates/product-import/sections.json` — the file mirrors `/product:bootstrap`'s `sections.json` 1:1 so handoff is lossless. Each section gets a heading, the bootstrap-side prompt verbatim, a 1–2 sentence "what we're after" framing, a fenced response-format hint, and a stable `<!-- section: <id> -->` anchor for the parser.
3. **Writes** the artifact to `_docs/imports/<slug>/<slug>.questionnaire.md`. First emit registers `paths.imports` and `paths.importsCurrent` in `.claude/paths.json`.
4. **Tail-instructs** the answering session: the questionnaire ends with explicit instructions to keep heading text and section anchors verbatim when replying, so the markdown round-trips through the parser cleanly across all five target surfaces.
5. **Optionally parses** a pasted-back answers file: `node scripts/product/import.js --parse <path-to-pasted.md>` reads the file, splits on section anchors, validates that every section the active section-set requires is present (or marks `skipped_declined`), and writes `_docs/imports/<slug>/<slug>.answers.json` in the exact shape `/product:bootstrap --answers-file` expects.
6. **Telemetry**: emits `import_started`, `context_introspected`, `questionnaire_emitted`, `parse_started`, `parse_completed`, `parse_failed_section_mismatch` to `paths.eventsFile` (fail-open).

## Requirements

> Uses the `R-N` id convention enforced by `scripts/hooks/requirement-format-guard.js`.

- **`R-1`** — Skill spec `.claude/commands/product/import.md` exists, mirrors `bootstrap.md` shape (frontmatter description, Input, When to use, What it does, Flags table, Outputs, Exit codes, TRACE events, Procedure, Reference), and explicitly cross-links to `/product:bootstrap` as the downstream consumer.
- **`R-2`** — Generator `scripts/product/import.js` parses CLI args (`--slug`, `--section-set`, `--output-dir`, `--no-introspect`, `--parse`, `--for`, `--help`, `--probe`), resolves the project root the same way `bootstrap.js` does (`CLAUDE_PROJECT_DIR` → walk for `.claude/paths.json` → `cwd`), and exits 0/2/3/4 with the same semantics as `bootstrap.js` (success / invalid input / coverage QC failed / output dir not writable).
- **`R-3`** — Bounded project introspection: reads at most four sources — `PROJECT.md`, `README.md`, `package.json`, last 10 git commit subjects (`git log -n 10 --pretty=%s`, captured via `execFileSync` with a 5s timeout). Each source has a 64KB read cap. `--no-introspect` skips this pass entirely. No AST parsing, no recursive scans, no network calls.
- **`R-4`** — Questionnaire template `framework/templates/product-import/sections.json` is a structural superset of `framework/templates/product-bootstrap/sections.json`: same section ids in the same order, same titles, same prompts (bootstrap prompt strings reused verbatim — never paraphrased) plus per-section `response_format_hint` and `framing` fields specific to import. Minimal = 8 sections (problem → mvp), extended adds `bear`, `bull`, `quick_notes`, `references` for 12 total.
- **`R-5`** — Output emission: `_docs/imports/<slug>/<slug>.questionnaire.md` is a single self-contained Markdown file. The file opens with a one-paragraph preamble identifying the source project, lists each section with stable `## NN — Title` headings (matching bootstrap's heading shape, so a reader of the answers and a reader of the brief see the same labels), wraps each section's response prompt in an HTML anchor `<!-- section: <id> -->`, and ends with a "How to reply" block telling the answering session to keep headings + anchors verbatim. LF line endings, UTF-8, trailing newline. No DOCX, no HTML — paste-friendly Markdown only.
- **`R-6`** — Paste-friendly across 5 surfaces: the questionnaire MUST render correctly when pasted into Claude Code (a CLI), Codex (a CLI), Claude web (rich-text), ChatGPT web (rich-text), and Gemini web (rich-text). The constraints are: ASCII-safe headings and anchors; no triple-backtick blocks longer than the surface's paste limit (capped at 4KB per block); no Markdown features known to break in either rich-text surface (no GFM task lists inside the response prompts; no `#### ` headings beyond depth 3; no embedded images). The rendering contract is exercised by the QA plan in three surfaces minimum before ship.
- **`R-7`** — Round-trip contract with `/product:bootstrap`: `--parse` mode emits a JSON object whose keys are exactly the section ids from `sections.json#minimal` (or `minimal + extended_additions`) and whose values are `{ content: string, status: "drafted" | "skipped_declined", source_turns: [] }`. The shape matches `scripts/product/bootstrap.js#sanitizeAnswer`. A round-trip test (import → fake answers MD → parse → bootstrap --answers-file → brief MD) must succeed end-to-end with all sections drafted.
- **`R-8`** — Paths registration: on first successful questionnaire emit, the generator adds `paths.imports = "_docs/imports"` and `paths.importsCurrent = "_docs/imports/<slug>"` to `.claude/paths.json` (mirrors `bootstrap.js#registerPaths`). Subsequent runs update `paths.importsCurrent` only. Read failure of `.claude/paths.json` is non-fatal — log and continue.
- **`R-9`** — Telemetry: emits six event types to `paths.eventsFile` via fail-open `appendFileSync` — `import_started` (after CLI parse), `context_introspected` (after introspection), `questionnaire_emitted` (after MD write), `parse_started` (when `--parse` is invoked), `parse_completed` (after answers.json write), `parse_failed_section_mismatch` (when validation finds missing required sections). No raw operator content appears in events — only counts, ids, and statuses.
- **`R-10`** — Section parity invariant: a CI-friendly check (`node scripts/product/import.js --probe`) emits JSON including a `section_parity` field that reports `true` iff the `id` ordering in `framework/templates/product-import/sections.json` matches `framework/templates/product-bootstrap/sections.json`. The parity check is the only thing standing between bootstrap evolving its section set and import silently breaking handoff.

## Design decisions (resolved)

These were flagged in the Plan Contract as `needs_user_or_beta_review` or as `open_questions`. Resolutions:

- **D-1 — Skill name: `/product:import`.** Confirmed. The user renamed the skill from `/product:convert` to `/product:import` in a follow-up message mid-prompt. All artifacts (skill spec, generator filename, template dir, paths keys, event-type prefixes) use `import`. No alias is shipped — the rename happened before any spec was written, so there is no muscle-memory cost to honor.
- **D-2 — Output schema target: emit MD questionnaire AND ship a `--parse` companion mode.** The questionnaire MD is the human-facing artifact; the `--parse` mode is the machine bridge to `/product:bootstrap --answers-file`. Both ship in v1. The parse mode produces JSON of the exact shape `scripts/product/bootstrap.js#sanitizeAnswer` already accepts (extracted from `bootstrap.js` lines 282–297: `{ content, status, source_turns }` per section id). This avoids forcing the operator to construct the JSON manually — which was the friction that motivated the sprint in the first place — without making bootstrap learn a new markdown ingestion format (which would mean two parsers to maintain).
- **D-3 — Per-surface presets: DEFERRED to v2.** v1 emits one universal questionnaire targeted at all five surfaces. The `--for <surface-hint>` flag is reserved but a no-op in v1 — it accepts `claude-code`, `codex`, `claude-web`, `chatgpt-web`, `gemini-web`, or `universal`, validates the value, and logs the requested hint in `import_started` for future signal but does not branch behavior. Rationale: maintaining five preset variants when bootstrap evolves its section set would mean five files to keep in sync. We add per-surface tweaks only if v1 universal rendering fails on a real surface (evidence-driven, not preemptive). The Plan Contract `overbuild_risks[0]` explicitly called this out.
- **D-4 — Project introspection: BOUNDED read-only.** v1 reads exactly `PROJECT.md`, `README.md`, `package.json`, and the last 10 commits' subject lines. Each source capped at 64KB. No AST parsing. No git history dive beyond 10 commits. No recursive scans. `--no-introspect` disables the entire pass and emits a single-line preamble using only the resolved slug. Rationale: Plan Contract `non_goals[2]` is explicit ("Do NOT introspect deeply"); the four sources cover the 90% case (project name, stack hints, recency) without entering "audit" territory.
- **D-5 — Questionnaire as `ponder`-style context primer: REJECTED for v1.** The Plan Contract listed this as a `needs_user_or_beta_review` item. v1 keeps the preamble factual (project name, stack hints, last activity) and lets the answering session do the pondering. Adding `/product:ponder`-style observations to the preamble would (a) leak our judgment into the source-of-truth gathering, biasing the answering session, and (b) double the surface area to maintain. If the operator wants pondering, they run `/product:ponder` after `/product:bootstrap` finishes — that's the existing flow.

## Affected Surfaces

| Surface | Evidence | Disposition |
|---|---|---|
| `.claude/commands/product/import.md` | assumed_from_request | create (R-1) |
| `.claude/commands/product/bootstrap.md` | verified_from_repo | unchanged — import aligns to its JSON contract |
| `.claude/commands/product/ponder.md` | verified_from_repo | reference only (style / frontmatter shape) |
| `scripts/product/import.js` | assumed_from_request | create (R-2, R-3, R-5, R-7, R-8, R-9, R-10) |
| `framework/templates/product-import/` | inferred_from_repo | create — `sections.json`, `questionnaire.md.tmpl` (R-4) |
| `_docs/imports/<slug>/` | assumed_from_request | runtime output dir |
| `.claude/paths.json` | inferred_from_repo | add `paths.imports`, `paths.importsCurrent` on first emit (R-8) |
| `scripts/product/bootstrap.js --answers-file` JSON contract | verified_from_repo | import must produce this exact shape (R-7) |

## Non-Goals

- Do NOT auto-paste the questionnaire into another session — flow is operator-mediated by design (Plan Contract `non_goals[0]`).
- Do NOT replace `/product:bootstrap` — `/product:import` is strictly a pre-step.
- Do NOT introspect deeply (no AST parsing, no git history beyond 10 commits, no recursive file scans).
- Do NOT modify `.claude/commands/product/bootstrap.md` behavior — alignment flows one-way (import → bootstrap).
- Do NOT design for multi-source merging — one import per invocation.
- Do NOT teach `/product:bootstrap` to ingest the questionnaire MD natively — `--parse` produces the existing `--answers-file` JSON, not a new format.
- Do NOT ship per-surface preset prose in v1 — `--for` is reserved but inert.
- Do NOT emit HTML or DOCX from `/product:import` — paste-friendly MD only.

## External Service Dependencies

None. Pure local file generation + bounded read-only project introspection. `git log` is the only subprocess; it is shelled via `execFileSync` with a 5s timeout, and a failure is logged and treated as "no commit history available" rather than fatal.

## Approval Boundaries

- **Execute:** user approval required before `/sprint:execute` runs (per the Plan Contract `approval_boundaries[]`, which is empty — defaulting to the project's standard adhoc-mode approval per `CLAUDE.md#Autonomy`).
- **Release:** standard production-deploy approval per `CLAUDE.md#Autonomy` applies to any push that ships the new skill upstream to canonical WarpOS via `/warp:promote`.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260521-0018.yaml`
- High-level stories: `.claude/project/sprint/requirements/SP-20260520-002/high-level-stories.md`
- Granular stories: `.claude/project/sprint/requirements/SP-20260520-002/granular-stories.md`
- COPY: `.claude/project/sprint/requirements/SP-20260520-002/copy.md`
- INPUTS: `.claude/project/sprint/requirements/SP-20260520-002/inputs.md`
- TRACE: `.claude/project/sprint/requirements/SP-20260520-002/trace.md`
- Acceptance criteria: `.claude/project/sprint/requirements/SP-20260520-002/acceptance-criteria.md`
- QA plan: `.claude/project/sprint/requirements/SP-20260520-002/qa-plan.md`
- Redteam plan: `.claude/project/sprint/requirements/SP-20260520-002/redteam-plan.md`
- Release plan: `.claude/project/sprint/requirements/SP-20260520-002/release-plan.md`
