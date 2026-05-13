# TRACE Requirements — /product:bootstrap skill — guided product brief in MD/HTML/DOCX

**Sprint:** `SP-20260513-001`
**PRD:** `prd.md`

> TRACE captures the observability, traceability, event capture, decision
> logging, and requirement-to-code linkage layer. The point of TRACE is
> to answer: why did this exist, where did the requirement come from,
> what changed because of it, what external dependency or approval was
> required, how was it tested, what shipped, and what should persist as
> a learning.

## Trace Map

| Source | Requirement | Story | COPY | INPUT | ESD | Ticket | Code | Test | Release | Learning |
|---|---|---|---|---|---|---|---|---|---|---|
| user-request 2026-05-13 | R-1 | S-1 | C-1, C-2 | IN-1 | — | T-… | `.claude/commands/product/bootstrap.md` | `tests/product/bootstrap/skill.test.js` | RP-1 | — |
| user-request 2026-05-13 | R-2, R-3 | S-2 | C-3, C-7 | IN-2, IN-6 | — | T-… | `scripts/product/bootstrap.js#runDiscussion` | `tests/product/bootstrap/discussion.test.js` | RP-1 | — |
| user-request 2026-05-13 | R-4 | S-3 | C-4 | IN-1 | — | T-… | `scripts/product/bootstrap.js#writeMd` | `tests/product/bootstrap/md.test.js` | RP-1 | — |
| user-request 2026-05-13 | R-5 | S-4 | C-4 | IN-1 | — | T-… | `scripts/product/bootstrap.js#writeHtml` | `tests/product/bootstrap/html.test.js` | RP-1 | — |
| design-D-2 | R-6 | S-5 | C-5 | IN-3, IN-7 | ESD-pandoc | T-… | `scripts/product/bootstrap.js#writeDocx` | `tests/product/bootstrap/docx.test.js` | RP-1 | — |
| user-request 2026-05-13 | R-7, R-9 | S-6 | C-6, C-9, C-10 | IN-1, IN-4, IN-5 | — | T-… | `scripts/product/bootstrap.js#resolveOutputDir` | `tests/product/bootstrap/paths.test.js` | RP-1 | — |
| paths-registry rule | R-8 | S-7 | — | IN-1, IN-4 | — | T-… | `scripts/product/bootstrap.js#registerPaths` | `tests/product/bootstrap/paths-json.test.js` | RP-1 | — |
| H-3 | R-1, R-8 | S-8 | C-1 | — | — | T-… | `_docs/*` (callout) | manual | RP-1 | — |

## TR-1 — brief_started

**Event:** `brief_started`
**When:** Emitted by `scripts/product/bootstrap.js` immediately after CLI args are parsed and slug is resolved, before any AskUserQuestion turn.
**Captured fields:**
- `slug` — resolved project slug (string)
- `section_set` — `minimal` | `extended`
- `docx_backend` — `auto` | `pandoc` | `none`
- `output_dir` — resolved absolute path
- `rerun_policy` — `overwrite` | `version` | `prompt`
- `rerun_detected` — boolean — `true` if `<slug>/<slug>.brief.md` already exists
- `pandoc_present` — boolean — result of IN-7 probe
- `started_at` — ISO-8601 timestamp
**Linked requirement:** `R-10`
**Linked story:** `S-1`, `S-2`
**Why we capture this:** Establishes run boundaries, lets `events:query` group by run, and provides the baseline for the wall-clock latency metric in R-11. The `pandoc_present` boolean here is the canonical environment-probe record for support triage.

## TR-2 — section_completed

**Event:** `section_completed`
**When:** Emitted once per section after the generator has drafted and coverage-QC'd that section. Fires regardless of whether the section is `minimal` or `extended`.
**Captured fields:**
- `slug`
- `section_id` — one of `problem`, `jtbds`, `value_chain`, `competitive`, `wedge`, `vision`, `wedge_to_vision`, `mvp`, `bear`, `bull`, `quick_notes`, `references`
- `section_index` — 1-indexed position in the active set
- `word_count` — drafted section word count (integer)
- `source_turns` — array of AskUserQuestion turn indices that informed the section (helps debug coverage failures)
- `status` — `drafted` | `skipped_declined` | `skipped_disabled`
- `elapsed_ms` — milliseconds from `brief_started` to this event
**Linked requirement:** `R-3`, `R-10`
**Linked story:** `S-2`
**Why we capture this:** Drives the coverage QC dashboard, surfaces under-supported sections across runs (informs the question set), and is the primary signal for the QA `partial-write` failure-mode persona. Does NOT capture the section body text — only counts and provenance.

## TR-3 — brief_emitted

**Event:** `brief_emitted`
**When:** Emitted at the end of the run after all writes complete (or fail). Always fires; status reflects outcome.
**Captured fields:**
- `slug`
- `output_dir`
- `formats` — object: `{ md: "ok", html: "ok", docx: "ok" | "skipped_pandoc_missing" | "skipped_backend_none" | "error:<reason>" }`
- `format_counts` — `{ ok: N, skipped: N, error: N }` — at-a-glance summary
- `rerun_action` — `none` | `versioned` | `overwritten` | `canceled`
- `paths_registered` — `{ briefs: bool, briefsCurrent: bool }`
- `total_elapsed_ms` — from `brief_started`
- `outcome` — `success` | `partial` | `failure`
**Linked requirement:** `R-4`, `R-5`, `R-6`, `R-8`, `R-9`, `R-10`
**Linked story:** `S-3`, `S-4`, `S-5`, `S-6`, `S-7`
**Why we capture this:** Single-event "did the run land?" answer. `format_counts` lets dashboards compute success rate without parsing strings. `rerun_action` + `paths_registered` are the only durable side-effect records when the brief itself is on disk but the user wants to debug "what changed in paths.json?" later.

## Observability rules

- All three events fire through `paths.eventsFile` via the project logger (CLAUDE.md memory section).
- Event emission MUST be fail-open: a logger failure cannot crash the user run.
- No section body text or raw operator answers appear in any event. Only counts, ids, statuses, and timing.
- All timestamps are ISO-8601 UTC.
