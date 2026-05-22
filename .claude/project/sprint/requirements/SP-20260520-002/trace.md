# TRACE Requirements — /product:import

**Sprint:** `SP-20260520-002`
**PRD:** `.claude/project/sprint/requirements/SP-20260520-002/prd.md`

> TRACE captures observability, provenance, and the requirement-to-code linkage layer. For new skills like `/product:import`, the explicit event emissions are the primary trace surface — `git log` covers the code change but not the runtime behavior.

## Trace Map

| Source | Requirement | Story | COPY | INPUT | ESD | Ticket | Code / File | Test | Release | Learning |
|---|---|---|---|---|---|---|---|---|---|---|
| User request 2026-05-20 | R-1 | S-1 | C-1, C-2, C-8 | IN-1, IN-2, IN-3, IN-5, IN-6 | — | T-…(S-1) | `.claude/commands/product/import.md`, `scripts/product/import.js#parseArgs` | `tests/regression/SP-20260520-002/cli-flags.test.js` | sprint-close commit | — |
| User request 2026-05-20 | R-3 | S-2 | C-3, C-4 | IN-7 | — | T-…(S-2) | `scripts/product/import.js#runIntrospection` | `tests/regression/SP-20260520-002/introspection.test.js` | sprint-close commit | "Bounded introspection beats audit-mode for pre-step skills" |
| User request 2026-05-20 | R-4 | S-3 | C-7 | IN-8 | — | T-…(S-3) | `framework/templates/product-import/sections.json`, `questionnaire.md.tmpl` | `tests/regression/SP-20260520-002/template-load.test.js` | sprint-close commit | — |
| User request 2026-05-20 | R-6 | S-4 | C-7 | — | — | T-…(S-4) | `scripts/product/import.js#renderQuestionnaire` | `tests/regression/SP-20260520-002/render-paste-friendly.test.js` | sprint-close commit | "5-surface paste compatibility = ASCII headings + anchors + bounded fences" |
| User request 2026-05-20 | R-5, R-8 | S-5 | C-8, C-9 | IN-3 | — | T-…(S-5) | `scripts/product/import.js#writeQuestionnaire`, `#registerPaths` | `tests/regression/SP-20260520-002/emit-and-register.test.js` | sprint-close commit | — |
| User request 2026-05-20 | R-9 | S-6 | — | — | — | T-…(S-6) | `scripts/product/import.js#emitEvent` | `tests/regression/SP-20260520-002/events.test.js` | sprint-close commit | — |
| User request 2026-05-20 | R-4, R-7, R-10 | S-7 | — | IN-5, IN-8 | — | T-…(S-7) | `scripts/product/import.js#probeSectionParity` | `tests/regression/SP-20260520-002/section-parity.test.js` | sprint-close commit | "Section parity check is the load-bearing invariant for import↔bootstrap handoff" |
| User request 2026-05-20 | R-7, R-9 | S-8 | C-5, C-6, C-9 | IN-4 | — | T-…(S-8) | `scripts/product/import.js#parseAnswers` | `tests/regression/SP-20260520-002/parse-round-trip.test.js` | sprint-close commit | — |

## TR-1 — `import_started`

**Event:** `import_started` appended to `paths.eventsFile` via fail-open `appendFileSync`
**When:** After CLI parsing succeeds, before any disk read or write (excluding the parse of `--parse <path>` itself if that flag is set).
**Captured fields:** `ts`, `type: "import_started"`, `slug`, `section_set`, `output_dir` (relative to project root), `surface_hint` (from `--for`), `mode` (`emit` | `parse`), `no_introspect` (boolean), `started_at` (ISO string).
**Linked requirement:** `R-9`.
**Linked story:** `S-1`, `S-6`.
**Why we capture this:** Per-invocation header — gives every later event in the same run a join key (`slug + started_at`) and lets `/check:patterns` count how often each surface hint is requested before we decide whether D-3 deserves re-opening in v2.

## TR-2 — `context_introspected`

**Event:** `context_introspected` appended to `paths.eventsFile`.
**When:** Once per emit-mode run, after the introspection pass completes (or is skipped via `--no-introspect`).
**Captured fields:** `ts`, `type`, `slug`, `project_md_present` (boolean), `readme_present` (boolean), `package_json_present` (boolean), `package_name` (string or null), `git_log_present` (boolean), `commits_collected` (integer 0–10), `truncated` (array of source names whose 64KB cap was hit), `skipped` (boolean — true iff `--no-introspect`).
**Linked requirement:** `R-3`, `R-9`.
**Linked story:** `S-2`, `S-6`.
**Why we capture this:** The introspection pass is the only piece of the skill that touches the host project's contents. Capturing what was found (presence flags only — never file bodies) lets us audit "is this thing actually reading what we think it reads" without leaking project data into the events log.

## TR-3 — `questionnaire_emitted`

**Event:** `questionnaire_emitted` appended to `paths.eventsFile`.
**When:** Once per emit-mode run, after the questionnaire MD is written and paths registration is attempted.
**Captured fields:** `ts`, `type`, `slug`, `output_dir`, `section_count` (integer), `bytes` (integer — MD file size), `paths_registered` (object with `imports: boolean`, `importsCurrent: boolean`), `paths_register_error` (string or null), `total_elapsed_ms`, `outcome` (`success` | `partial`).
**Linked requirement:** `R-5`, `R-8`, `R-9`.
**Linked story:** `S-5`, `S-6`.
**Why we capture this:** Terminal event for the emit path. The `outcome` field is the single signal `/check:patterns` reads to spot "import keeps half-failing on paths registration" — exactly the class of silent partial-failure that bit the path-rename bug class called out in CLAUDE.md.

## TR-4 — `parse_started`

**Event:** `parse_started` appended to `paths.eventsFile`.
**When:** Once per parse-mode run, after the `--parse` file is loaded and slug is resolved, before section validation.
**Captured fields:** `ts`, `type`, `slug`, `parse_input_path` (relative to project root), `parse_input_bytes`, `section_set`, `started_at`.
**Linked requirement:** `R-7`, `R-9`.
**Linked story:** `S-8`, `S-6`.
**Why we capture this:** Marks the start of a round-trip second half. Pairs with TR-5 or TR-6 so `/check:patterns` can compute parse success-rate by surface (when the operator passes `--for` again at parse time, which is allowed but optional).

## TR-5 — `parse_completed`

**Event:** `parse_completed` appended to `paths.eventsFile`.
**When:** Once per parse-mode run, after `answers.json` is written.
**Captured fields:** `ts`, `type`, `slug`, `sections_matched` (integer), `sections_required` (integer), `sections_drafted` (integer), `sections_skipped_declined` (integer), `answers_json_path`, `answers_json_bytes`, `total_elapsed_ms`, `outcome: "success"`.
**Linked requirement:** `R-7`, `R-9`.
**Linked story:** `S-8`, `S-6`.
**Why we capture this:** Terminal happy-path event. The `sections_drafted` / `sections_required` ratio is the headline quality signal — if it consistently sits at e.g. 5/8 we've got a structural problem with the questionnaire prompt clarity, not an operator problem.

## TR-6 — `parse_failed_section_mismatch`

**Event:** `parse_failed_section_mismatch` appended to `paths.eventsFile`.
**When:** Once per parse-mode run where validation finds one or more required sections missing or empty.
**Captured fields:** `ts`, `type`, `slug`, `missing_section_ids` (array of strings — the section ids, never the body content), `parse_input_path`, `parse_input_bytes`, `section_set`, `total_elapsed_ms`, `outcome: "failure"`, `failure_reason: "missing_required_sections"`.
**Linked requirement:** `R-7`, `R-9`.
**Linked story:** `S-8`, `S-6`.
**Why we capture this:** Terminal failure-path event for the round-trip. If `parse_failed_section_mismatch` events cluster around a specific section id (e.g. `value_chain` keeps being absent), that's strong signal the question is too ambiguous and bootstrap's prompt needs editing — not import's. The event is the only place the missing-section pattern is durably recorded.
