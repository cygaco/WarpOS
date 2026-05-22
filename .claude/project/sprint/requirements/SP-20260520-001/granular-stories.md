# Granular Stories — `/product:clone`

**Sprint:** `SP-20260520-001`
**High-level stories:** `.claude/project/sprint/requirements/SP-20260520-001/high-level-stories.md`

> Granular stories use the `S-N` id convention. Each story produces roughly one ticket during `/sprint:design`.

## S-1 — CLI surface: parse flags, derive slug, validate input

**As** the skill author
**I want** `/product:clone` (via `scripts/product/clone.js`) to parse `--name`, `--url`, `--video`, `--output-dir`, `--slug`, `--max-review-sources`, `--no-cache`, `--strict`, `--help` and derive a valid slug
**So that** every downstream pass has clean, validated inputs and the operator gets immediate feedback on misuse

Acceptance criteria:
- AC-1.1, AC-1.2, AC-1.3

Linked: `H-1`, `R-1`.
COPY: `C-1`, `C-2`.
INPUTS: `IN-1`, `IN-2`, `IN-3`, `IN-4`, `IN-5`, `IN-6`, `IN-7`, `IN-8`.
TRACE: `TR-1`.

## S-2 — WebSearch product identification

**As** the skill
**I want** to identify the canonical product URL via WebSearch when only `--video` or `--name` is provided
**So that** the rest of the pipeline has a single authoritative source URL to crawl rather than ambiguous mentions

Acceptance criteria:
- AC-2.1, AC-2.2

Linked: `H-1`, `H-4`, `R-2`.
COPY: `C-3`.
INPUTS: `IN-1`, `IN-3`.
TRACE: `TR-2`.

## S-3 — One-level URL discovery from product website

**As** the skill
**I want** to discover and prioritize internal links from the product URL (pricing/features/docs/about/blog/changelog/customers) one level deep
**So that** the extraction passes have rich grounding from the product's own marketing surface without recursive crawling

Acceptance criteria:
- AC-3.1, AC-3.2, AC-3.3

Linked: `H-4`, `R-3`, `R-11`.
COPY: `C-3`, `C-7`.
INPUTS: `IN-2`, `IN-6`.
TRACE: `TR-3`.

## S-4 — Review-source collection (G2, ProductHunt, Reddit, HN, blogs)

**As** the skill
**I want** to query WebSearch for `"<product>" review site:<host>` against a fixed review-host list and collect up to `--max-review-sources` distinct URLs
**So that** voice-of-customer extraction has external-perspective material, not just the product's own marketing copy

Acceptance criteria:
- AC-4.1, AC-4.2, AC-4.3

Linked: `H-3`, `H-4`, `R-4`.
COPY: `C-3`, `C-6`.
INPUTS: `IN-6`.
TRACE: `TR-4`.

## S-5 — Source caching for audit

**As** the skill
**I want** every fetched page stored raw under `_docs/clones/<slug>/_raw/<sha>.html` with `meta.json` (url + retrieved-at + http status)
**So that** an operator can audit any quote against the exact bytes the LLM saw, and re-runs without `--no-cache` skip re-fetching

Acceptance criteria:
- AC-5.1, AC-5.2

Linked: `H-2`, `R-5`, `R-6`.
COPY: —
INPUTS: `IN-7`.
TRACE: `TR-5`.

## S-6 — JTBD extraction pass

**As** the skill
**I want** to run an LLM extraction over aggregated retrieved text → 3-5 JTBDs with one-line rationale each
**So that** the deliverable opens with the jobs-to-be-done framing the operator's clone must serve

Acceptance criteria:
- AC-6.1, AC-6.2

Linked: `H-1`, `H-2`, `R-5`.
COPY: `C-4`.
INPUTS: —
TRACE: `TR-6`.

## S-7 — Feature list with build-complexity + core-ness scoring

**As** the skill
**I want** to emit a feature table — name, description, build-complexity (S/M/L/XL), core-ness (1-5), evidence-source URL
**So that** the operator can immediately decide which features are in the MVP slice for a clone and which are aspirational

Acceptance criteria:
- AC-7.1, AC-7.2, AC-7.3

Linked: `H-1`, `H-2`, `R-5`, `R-6`.
COPY: `C-4`.
INPUTS: —
TRACE: `TR-6`.

## S-8 — Voice-of-customer extraction with quote attribution

**As** the skill
**I want** to extract user quotes from reviews + cached URLs into a table — quote, sentiment, source-url, retrieved-at — and enforce a post-extraction presence check (no quote without a source it actually appears in)
**So that** the deliverable contains zero fabricated quotes and the operator can audit any one in seconds

Acceptance criteria:
- AC-8.1, AC-8.2, AC-8.3

Linked: `H-2`, `R-5`, `R-6`.
COPY: `C-4`, `C-11`.
INPUTS: —
TRACE: `TR-6`.

## S-9 — Gaps extraction

**As** the skill
**I want** to run an LLM pass over reviews + cached pages → 3-7 named gaps with severity (low/med/high)
**So that** the operator sees where the competitor is weak and the clone has openings

Acceptance criteria:
- AC-9.1, AC-9.2

Linked: `H-1`, `R-5`.
COPY: `C-4`.
INPUTS: —
TRACE: `TR-6`.

## S-10 — Opportunities extraction

**As** the skill
**I want** to run an LLM pass over gaps + feature list → 3-5 capitalize-able opportunities for a competing build
**So that** the deliverable ends with concrete hooks the operator can take into `/product:bootstrap` or `/sprint:plan`

Acceptance criteria:
- AC-10.1, AC-10.2

Linked: `H-1`, `R-5`.
COPY: `C-4`.
INPUTS: —
TRACE: `TR-6`.

## S-11 — Output emission: MD + HTML always, DOCX when pandoc

**As** the skill
**I want** to write `<slug>.clone.md` and `<slug>.clone.html` to `_docs/clones/<slug>/` always, and `<slug>.clone.docx` when pandoc is on PATH
**So that** the deliverable is immediately viewable in three formats and matches the `/product:bootstrap` output contract

Acceptance criteria:
- AC-11.1, AC-11.2, AC-11.3

Linked: `H-1`, `H-5`, `R-7`.
COPY: `C-8`, `C-9`.
INPUTS: `IN-4`.
TRACE: `TR-7`.

## S-12 — Paths registration on first emit

**As** the skill
**I want** the first successful emit to add `paths.clones` and `paths.clonesCurrent` to `.claude/paths.json`, and subsequent runs to update `paths.clonesCurrent` only
**So that** downstream skills find the deliverable by path-key, not literal, and re-runs are idempotent

Acceptance criteria:
- AC-12.1, AC-12.2

Linked: `H-5`, `R-8`.
COPY: `C-12`.
INPUTS: —
TRACE: `TR-7`.

## S-13 — Telemetry events: clone_started, product_identified, urls_discovered, source_fetched, source_failed, extraction_completed, clone_emitted

**As** the skill author
**I want** seven event types appended (fail-open) to `paths.eventsFile` across the run lifecycle, with metadata only (no raw scraped text)
**So that** the run is observable end-to-end and a future `/check:patterns` or `/check:timeline` can reconstruct what happened

Acceptance criteria:
- AC-13.1, AC-13.2, AC-13.3

Linked: `H-2`, `H-5`, `R-9`.
COPY: —
INPUTS: —
TRACE: `TR-1`, `TR-2`, `TR-3`, `TR-4`, `TR-5`, `TR-6`, `TR-7`.

## S-14 — Partial-deliverable mode with `[GAP]` markers

**As** the operator
**I want** the skill to render `[GAP — <source-class> — <reason>]` and continue when a source fails, unless I pass `--strict`
**So that** one blocked review site does not destroy a 5-minute run, and I can fill gaps manually after the fact

Acceptance criteria:
- AC-14.1, AC-14.2, AC-14.3

Linked: `H-3`, `R-10`, `R-11`.
COPY: `C-6`, `C-11`.
INPUTS: `IN-8`.
TRACE: `TR-4`.
