---
description: Bootstrap a thorough product brief from a guided discussion — outputs MD/HTML (always) and DOCX (when pandoc is installed) to _docs/briefs/<slug>/
---

# /product:bootstrap — Product Brief Bootstrap

`/product:bootstrap` — Bootstrap a thorough product brief from a guided discussion.

Walks through 4-8 questions covering problem, jobs-to-be-done, value chain, competitive landscape, wedge, vision, wedge to full vision arc, and MVP. Emits MD + HTML (always) and DOCX (when pandoc is installed) to `paths.briefs` (`_docs/briefs/<slug>/`).

Usage:

```
/product:bootstrap [--slug <name>] [--section-set minimal|extended] [--docx-backend auto|pandoc|none] [--output-dir <path>] [--rerun-policy overwrite|version|prompt]
```

Intended as the first command run in a new project.

## Input

`$ARGUMENTS` — optional. May contain any of the CLI flags above. If `--slug` is omitted, the slug is derived from the project root basename and normalized.

## When to use this

- A fresh project that has a rough idea but no written product brief
- Before `/sprint:plan` so sprint planning has product context
- When the operator wants a single document downstream tooling (onboarding, retrospectives) can index by stable headings

This is intended as the first command an operator runs in a new project. The output is consumed by `/sprint:plan`, `/oneshot:start`, and onboarding scaffolds.

## What it does

1. **Greet** — Print the greeting from `copy.md#C-2` so the operator knows what's coming.
2. **Probe** — Resolve the slug from `--slug` or `cwd` basename. Detect pandoc on PATH. Detect an existing brief at `_docs/briefs/<slug>/` to drive the re-run policy.
3. **Discuss** — Run an AskUserQuestion-budgeted (4-8 turns) conversation that covers every section in the active section set. The operator may answer multiple sections in one reply; the generator does not re-ask answered sections.
4. **Coverage QC** — Before any write, verify every section has either drafted content or an explicit `skipped_declined` marker. Truly empty sections halt the run with `copy.md#C-7`.
5. **Write** — Emit `<slug>.brief.md` and `<slug>.brief.html` to `paths.briefs` (`_docs/briefs/<slug>/`). If pandoc is available, also emit `<slug>.brief.docx`. Otherwise print `copy.md#C-5` and continue.
6. **Register paths** — On first successful emit, add `paths.briefs` and `paths.briefsCurrent` to `.claude/paths.json` so downstream skills can read the brief.
7. **Summarize** — Print `copy.md#C-8` with the emitted file paths.

## Flags

| Flag | Default | Effect |
|---|---|---|
| `--slug <name>` | derived from `cwd` basename | Project slug, used in output dir and filenames. Must match `^[a-z0-9][a-z0-9-]{0,63}$`. |
| `--section-set <minimal\|extended>` | `minimal` | `minimal` = 8 sections (problem -> MVP). `extended` adds Bear Case, Bull Case, Quick Notes, References (12 total). |
| `--docx-backend <auto\|pandoc\|none>` | `auto` | `auto` shells out to pandoc if present, otherwise skips DOCX with a hint. `pandoc` is strict — exit 5 if missing. `none` skips DOCX silently. |
| `--output-dir <path>` | `_docs/briefs/<slug>/` | Override the output directory. Must stay inside the project root. |
| `--rerun-policy <overwrite\|version\|prompt>` | `version` | On re-run for an existing slug: `version` moves the prior brief into `<slug>/history/<ISO>/`. `overwrite` replaces without backup. `prompt` asks once. |
| `--help` | - | Print this help text and exit 0. |

## Outputs

```
_docs/briefs/<slug>/
  <slug>.brief.md      always
  <slug>.brief.html    always
  <slug>.brief.docx    when pandoc available
  history/             when re-run with default --rerun-policy=version
    <ISO-8601>/
      <slug>.brief.md
      <slug>.brief.html
      <slug>.brief.docx
```

Headings are stable: `## 01 — Problem` through `## 08 — MVP` (minimal) or `## 12 — References` (extended). Downstream parsers index by these.

## Exit codes

- `0` — success (may include a DOCX skip note)
- `2` — invalid input (slug, section set, output dir, etc.)
- `3` — coverage QC failed (no files written)
- `4` — output directory not writable
- `5` — `--docx-backend pandoc` explicitly requested but pandoc missing

## TRACE events

Emits three event types to `paths.eventsFile` (fail-open per `trace.md`):

- `brief_started` — once per run, after CLI parsing
- `section_completed` — one per section in the active set
- `brief_emitted` — once per run, at the end

No section body text or raw operator answers appear in events.

## Reference

- Reference brief: `_docs/ai-web-brief-v4.{md,html}` — the family the output resembles.
- Plan Contract: `PC-20260513-0002`
- Sprint: `SP-20260513-001`

## Procedure

Invoke the generator directly:

```bash
node scripts/product/bootstrap.js [flags]
```

The generator reads the active section set from CLI, runs the discussion loop, drafts each section, writes the outputs, and registers the paths keys. See `scripts/product/bootstrap.js` for the orchestrator and `framework/templates/product-bootstrap/` for the templates.

For interactive use, run the AskUserQuestion turns from the skill driver and pass the answers to the generator's `--answers-file <path>` flag (JSON map keyed by section id). For non-interactive batch runs (CI tests, dry runs), pass `--answers-file` directly.
