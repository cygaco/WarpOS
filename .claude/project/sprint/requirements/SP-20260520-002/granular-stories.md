# Granular Stories — /product:import

**Sprint:** `SP-20260520-002`
**High-level stories:** `.claude/project/sprint/requirements/SP-20260520-002/high-level-stories.md`

> Granular stories use the `S-N` id convention enforced by `scripts/hooks/requirement-format-guard.js`. Each story produces roughly one ticket in `/sprint:design`.

## S-1 — Skill spec + CLI surface

**As** the framework maintainer
**I want** `.claude/commands/product/import.md` and the `scripts/product/import.js` CLI parser shipped with the documented flag set (`--slug`, `--section-set minimal|extended`, `--output-dir`, `--no-introspect`, `--parse <path>`, `--for <surface-hint>`, `--help`, `--probe`)
**So that** the skill is discoverable in the catalog, invokes the generator with validated inputs, and exits with the same 0/2/3/4 codes a downstream tool can branch on the way `/product:bootstrap` already does

Linked: `H-1`, `R-1`, `R-2`.
COPY: `C-1`, `C-2`, `C-8`.
INPUTS: `IN-1`, `IN-2`, `IN-3`, `IN-4`, `IN-5`, `IN-6`.
TRACE: `TR-1`.

## S-2 — Bounded project introspection pass

**As** the framework maintainer
**I want** the generator to read `PROJECT.md`, `README.md`, `package.json`, and the last 10 commit subjects (each capped at 64KB, `git log` timed-out at 5s)
**So that** the questionnaire preamble is grounded in what the project already says about itself — without entering "audit" territory or making this skill another `/check:all` in disguise

Linked: `H-3`, `R-3`.
COPY: `C-3`, `C-4`.
INPUTS: `IN-7`.
TRACE: `TR-2`.

## S-3 — Questionnaire template (sections + per-section response-format hint)

**As** the framework maintainer
**I want** `framework/templates/product-import/sections.json` and `framework/templates/product-import/questionnaire.md.tmpl` shipped, with one section block per `/product:bootstrap` section (id, title, prompt verbatim from bootstrap, `framing`, `response_format_hint`)
**So that** the questionnaire generator produces a structured, anchor-tagged Markdown artifact that an answering session can fill in by section without losing alignment

Linked: `H-1`, `H-2`, `R-4`.
COPY: `C-7`.
INPUTS: `IN-8`.

## S-4 — Universal phrasing across 5 surfaces

**As** the framework maintainer
**I want** the questionnaire body to use only Markdown features known to render in all five answering surfaces — ASCII-safe headings and anchors, no triple-backtick blocks over 4KB, no GFM task lists in response prompts, no `####+` headings
**So that** the operator can paste the same file into Claude Code, Codex, Claude web, ChatGPT web, or Gemini web and get a usable interview every time, without surface-specific tweaks in v1

Linked: `H-1`, `R-6`.
COPY: `C-7`.

## S-5 — Output emission + paths registration

**As** the framework maintainer
**I want** the generator to write a single self-contained `_docs/imports/<slug>/<slug>.questionnaire.md` with LF line endings, UTF-8, and a trailing newline; on first successful emit register `paths.imports` and `paths.importsCurrent` in `.claude/paths.json`
**So that** downstream skills (and `/product:bootstrap`'s `--answers-file` lookup) can find the questionnaire by paths key, and the directory layout matches the precedent set by `/product:bootstrap`'s `_docs/briefs/<slug>/` shape

Linked: `H-1`, `H-5`, `R-5`, `R-8`.
COPY: `C-8`.
INPUTS: `IN-3`.
TRACE: `TR-3`.

## S-6 — Telemetry events

**As** the framework maintainer
**I want** the generator to emit `import_started`, `context_introspected`, `questionnaire_emitted`, `parse_started`, `parse_completed`, and `parse_failed_section_mismatch` to `paths.eventsFile` via fail-open `appendFileSync`
**So that** `/check:patterns`, `/events:query`, and `/check:warpos-staleness` can see how often `/product:import` runs, on which surfaces, and where it tends to break — without ever logging raw operator content

Linked: `H-5`, `R-9`.
TRACE: `TR-1`, `TR-2`, `TR-3`, `TR-4`, `TR-5`, `TR-6`.

## S-7 — Section parity check vs `/product:bootstrap`

**As** the framework maintainer
**I want** `--probe` to emit JSON including a boolean `section_parity` that compares `framework/templates/product-import/sections.json` to `framework/templates/product-bootstrap/sections.json` (same ids, same order, both for `minimal` and `minimal + extended_additions`)
**So that** when bootstrap's section set evolves, a single CI-grade check catches the drift before a real import → bootstrap handoff silently drops sections

Linked: `H-2`, `R-4`, `R-7`, `R-10`.
INPUTS: `IN-5`.

## S-8 — `--parse` mode: pasted markdown → answers.json

**As** the framework maintainer
**I want** `node scripts/product/import.js --parse <pasted-answers.md>` to split the pasted file on `<!-- section: <id> -->` anchors, derive each section's `content`, mark missing sections `skipped_declined`, and write `_docs/imports/<slug>/<slug>.answers.json` in the exact shape `bootstrap.js#sanitizeAnswer` already accepts (`{ content, status, source_turns: [] }` keyed by section id)
**So that** the operator hands back paste-grade markdown from any of the five surfaces and gets a `/product:bootstrap --answers-file`-ready JSON object on the other side without writing JSON by hand — closing the round-trip loop the sprint was created to solve

Linked: `H-4`, `R-7`, `R-9`.
COPY: `C-5`, `C-6`, `C-9`.
INPUTS: `IN-4`.
TRACE: `TR-4`, `TR-5`, `TR-6`.
