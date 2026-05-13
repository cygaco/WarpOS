# Granular Stories — /product:bootstrap skill — guided product brief in MD/HTML/DOCX

**Sprint:** `SP-20260513-001`
**High-level stories:** `high-level-stories.md`

> Granular stories use the `S-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`. Each granular story
> should produce roughly one ticket during `/sprint:design`.

## S-1 — Skill scaffold + namespace registration

**As** an operator
**I want** `/product:bootstrap` to appear as a valid invokable skill
**So that** I can call it from a fresh project without manually wiring command files

Acceptance criteria:
- AC-1: `.claude/commands/product/bootstrap.md` exists with frontmatter (description, allowed-tools) and matches `copy.md#C-1` help text.
- AC-2: `/product:bootstrap --help` prints the help block; exits 0.

Linked: `H-1`, `R-1`.
COPY: see `copy.md` (C-1, C-2).
INPUTS: see `inputs.md` (IN-1).
TRACE: see `trace.md` (TR-1).

## S-2 — Bounded discussion flow

**As** an operator
**I want** a 4–8 turn AskUserQuestion discussion that maps each turn to ≥1 section in the active section set
**So that** the brief covers every required section without dragging into a 30-minute interrogation

Acceptance criteria:
- AC-1: A run with the default `--section-set minimal` asks between 4 and 8 questions inclusive.
- AC-2: Every section in the active set has at least one mapped answer or a documented "skipped — operator declined" annotation.
- AC-3: Hard error if any code path could exceed 8 turns; covered by unit test.

Linked: `H-1`, `R-2`, `R-3`.
COPY: see `copy.md` (C-3 discussion prompts).
INPUTS: see `inputs.md` (IN-2 section_set).
TRACE: see `trace.md` (TR-2 section_completed).

## S-3 — MD writer

**As** an operator
**I want** a Markdown file written to `_docs/briefs/<slug>/<slug>.brief.md`
**So that** I can review the brief in any editor and downstream Markdown tooling can index it

Acceptance criteria:
- AC-1: File is UTF-8, LF line endings, ends with a trailing newline.
- AC-2: Sections use `## NN — <Title>` headings matching the ai-web-brief-v4 style.
- AC-3: Required sections present in order (see `prd.md#R-4`).

Linked: `H-1`, `H-3`, `R-4`.
COPY: see `copy.md` (C-4 section titles).
INPUTS: see `inputs.md` (IN-1 project_slug).
TRACE: see `trace.md` (TR-3 brief_emitted).

## S-4 — HTML writer with style parity goal

**As** an operator
**I want** an HTML file written to `_docs/briefs/<slug>/<slug>.brief.html`
**So that** I can share the brief as a single self-contained link without exposing my editor

Acceptance criteria:
- AC-1: Single-file HTML with inlined CSS; opens correctly without a server.
- AC-2: Heading hierarchy and section structure match the MD output.
- AC-3: Visual family-resemblance to `_docs/ai-web-brief-v4.html` (heading style, callout block, monospace numerals) — exact CSS parity is a non-goal.

Linked: `H-1`, `H-3`, `R-5`.
COPY: see `copy.md` (C-4 section titles).
INPUTS: see `inputs.md` (IN-1).
TRACE: see `trace.md` (TR-3).

## S-5 — DOCX writer with pandoc fallback

**As** an operator
**I want** a DOCX rendered via pandoc when it is on PATH, and a clear "install pandoc to enable DOCX" message otherwise
**So that** DOCX-needing teammates get the file when available, and the run never fails just because pandoc is missing

Acceptance criteria:
- AC-1: When `pandoc --version` succeeds, `_docs/briefs/<slug>/<slug>.brief.docx` exists after the run.
- AC-2: When pandoc is absent, the run still succeeds with MD + HTML, exits 0, and prints `copy.md#C-5`.
- AC-3: `--docx-backend none` skips DOCX silently regardless of pandoc presence.

Linked: `H-1`, `H-3`, `R-6`.
COPY: see `copy.md` (C-5 pandoc missing message).
INPUTS: see `inputs.md` (IN-3 docx_backend).
TRACE: see `trace.md` (TR-3 — docx_status field).

## S-6 — Output path policy + re-run versioning

**As** an operator
**I want** clean slug-based output paths and re-run versioning that preserves prior briefs
**So that** I can iterate on a brief without manually backing files up and without slug typos corrupting the docs tree

Acceptance criteria:
- AC-1: Slug validates against `[a-z0-9][a-z0-9-]{0,63}`; invalid slugs halt with `copy.md#C-6`.
- AC-2: Re-run with existing slug default-versions previous files into `<slug>/history/<ISO-8601>/`.
- AC-3: `--rerun-policy overwrite` overwrites without history; `--rerun-policy prompt` asks once.

Linked: `H-2`, `R-7`, `R-9`.
COPY: see `copy.md` (C-6 slug invalid, C-9 rerun prompt).
INPUTS: see `inputs.md` (IN-4 output_dir, IN-5 rerun_policy).
TRACE: see `trace.md` (TR-3 — rerun_action field).

## S-7 — paths.json registration

**As** any downstream skill (sprint planning, onboarding, retrospectives)
**I want** `paths.briefs` and `paths.briefsCurrent` registered after a successful emit
**So that** I can read the canonical brief location without hardcoding `_docs/briefs/`

Acceptance criteria:
- AC-1: First successful run adds `paths.briefs` (= `_docs/briefs/`) and `paths.briefsCurrent` (= `_docs/briefs/<slug>/`) to `.claude/paths.json`.
- AC-2: Subsequent runs update `paths.briefsCurrent` to the latest slug; do not duplicate `paths.briefs`.
- AC-3: Path keys pass `paths:doctor` validation.

Linked: `H-3`, `R-8`.
COPY: n/a.
INPUTS: see `inputs.md` (IN-1, IN-4).
TRACE: see `trace.md` (TR-3 — paths_registered field).

## S-8 — Integration with project init / onboarding signal

**As** an operator running a fresh project
**I want** the README / onboarding-style entry points to mention `/product:bootstrap` as the recommended first command
**So that** the skill is discoverable without having to grep `.claude/commands/`

Acceptance criteria:
- AC-1: `_docs/` index page (if present) gets a "Start here — `/product:bootstrap`" callout.
- AC-2: `CLAUDE.md` or `PROJECT.md` references the skill in the "first command" section (if such section exists; if not, no new section is created).
- AC-3: No regressions in existing onboarding flows.

Linked: `H-3`, `R-1`, `R-8`.
COPY: see `copy.md` (C-1 help text).
INPUTS: n/a.
TRACE: n/a.
