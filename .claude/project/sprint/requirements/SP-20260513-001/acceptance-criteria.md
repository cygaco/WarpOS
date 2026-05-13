# Acceptance Criteria — /product:bootstrap skill — guided product brief in MD/HTML/DOCX

**Sprint:** `SP-20260513-001`
**PRD:** `prd.md`

> Each AC is a testable statement. Link from the relevant granular story
> + the ticket that implements it.

## S-1 — Skill scaffold + namespace registration

- AC-S-1.1: Given a fresh checkout, when the operator runs `/product:bootstrap --help`, then the help block from `copy.md#C-1` is printed verbatim and the process exits 0.
- AC-S-1.2: Given the skill file `.claude/commands/product/bootstrap.md` is present, when the harness enumerates commands, then `product:bootstrap` appears in the registry with a non-empty description frontmatter field.
- AC-S-1.3: Given the `/product:` namespace is new, when `paths:doctor` runs, then no registry warnings are emitted for the new namespace.

## S-2 — Bounded discussion flow

- AC-S-2.1: Given `--section-set minimal`, when the operator completes the discussion, then the number of AskUserQuestion turns is between 4 and 8 inclusive.
- AC-S-2.2: Given any successful run, when `section_completed` events are inspected, then every section in the active set has either `status=drafted` or `status=skipped_declined` with a logged reason.
- AC-S-2.3: Given a unit test that simulates 9 turn attempts, when the generator is invoked, then the run halts with a hard error referencing the 8-turn budget.

## S-3 — MD writer

- AC-S-3.1: Given a completed discussion, when the generator finishes, then `_docs/briefs/<slug>/<slug>.brief.md` exists, is valid UTF-8, uses LF line endings, and ends with a trailing newline.
- AC-S-3.2: Given the minimal section set, when the MD file is parsed by a heading scanner, then headings `## 01 — Problem` through `## 08 — MVP` appear in order with no duplicates.
- AC-S-3.3: Given the extended section set, when the MD file is parsed, then headings `## 09 — Bear Case` through `## 12 — References` also appear in order after `## 08`.

## S-4 — HTML writer with style parity goal

- AC-S-4.1: Given a completed discussion, when the generator finishes, then `<slug>.brief.html` exists as a single-file HTML doc that renders without external network requests.
- AC-S-4.2: Given the HTML file, when the heading structure is extracted, then it matches the MD output exactly (same titles, same order).
- AC-S-4.3: Given the HTML and `_docs/ai-web-brief-v4.html`, when both are opened in a browser, then a designer inspecting both confirms "looks like the same family of document" — same heading hierarchy, similar callout block style, monospace numerals. Exact CSS parity is not required.

## S-5 — DOCX writer with pandoc fallback

- AC-S-5.1: Given pandoc is on PATH, when the run completes with `--docx-backend auto` (default), then `<slug>.brief.docx` exists and opens in Word/LibreOffice without errors.
- AC-S-5.2: Given pandoc is NOT on PATH, when the run completes with default flags, then MD + HTML still exist, the run exits 0, and `copy.md#C-5` is printed.
- AC-S-5.3: Given `--docx-backend pandoc` is explicitly requested but pandoc is missing, when the run starts, then it exits with code 5 and prints the install hint (no MD/HTML written).
- AC-S-5.4: Given `--docx-backend none`, when the run completes, then no DOCX file is written and no skip message is printed.

## S-6 — Output path policy + re-run versioning

- AC-S-6.1: Given an invalid slug `My Project!`, when the run starts, then it exits with code 2 and prints `copy.md#C-6` with a normalized suggestion `my-project`.
- AC-S-6.2: Given an existing `<slug>/<slug>.brief.md`, when a re-run completes with default `--rerun-policy version`, then the prior file is at `<slug>/history/<ISO-8601>/<slug>.brief.md` and the new file is at the top level.
- AC-S-6.3: Given `--rerun-policy overwrite`, when a re-run completes, then no `history/` directory is created and the prior file is replaced atomically.
- AC-S-6.4: Given `--rerun-policy prompt` and an interactive terminal, when a re-run starts, then `copy.md#C-9` is shown and the operator's choice is honored.
- AC-S-6.5: Given `--rerun-policy prompt` and a non-interactive terminal (no TTY), when a re-run starts, then it falls back to `version` and logs a warning.
- AC-S-6.6: Given a locked or unwritable output directory, when the run tries to write, then it exits with code 4 and prints `copy.md#C-10`.

## S-7 — paths.json registration

- AC-S-7.1: Given a first-ever successful run for any slug, when `.claude/paths.json` is read after the run, then `paths.briefs` equals `_docs/briefs/` and `paths.briefsCurrent` equals `_docs/briefs/<slug>/`.
- AC-S-7.2: Given a subsequent successful run with a different slug, when `paths.json` is read, then `paths.briefs` is unchanged and `paths.briefsCurrent` reflects the latest slug.
- AC-S-7.3: Given the post-run state, when `paths:doctor` runs, then both registered keys resolve to extant directories with no warnings.
- AC-S-7.4: Given a run that fails before write (e.g. coverage QC fail), when `paths.json` is read, then no new keys have been added — registration is post-write only.

## S-8 — Integration with project init / onboarding

- AC-S-8.1: Given a project with a `_docs/` index or onboarding page, when the skill is integrated, then a "Start here — `/product:bootstrap`" callout is present (one-line, links to the help command).
- AC-S-8.2: Given the integration commit, when existing onboarding tests run, then none regress.
- AC-S-8.3: Given a project with no `_docs/` index or onboarding page, when the skill is integrated, then no new file is created — the absence of an existing entry point is respected.

## Cross-cutting

- AC-X-1: Given any successful run, when `events.jsonl` is inspected, then exactly one `brief_started`, N `section_completed` (N = active section count), and one `brief_emitted` event are present, in that order.
- AC-X-2: Given the logger is broken (simulated), when the run executes, then file writes still succeed and the user sees the success message — events are fail-open per TRACE.
- AC-X-3: Given the run completes on Windows, macOS, and Linux, when outputs are compared, then file contents are byte-identical modulo platform line endings normalization.
