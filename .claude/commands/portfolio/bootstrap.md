---
description: Bootstrap a thorough product brief from a guided discussion — outputs MD/HTML (always) and DOCX (when pandoc is installed) to _docs/briefs/<slug>/
---

# /portfolio:bootstrap — Product Brief Bootstrap

`/portfolio:bootstrap` — Bootstrap a thorough product brief from a guided discussion.

Walks through 4-8 questions covering problem, jobs-to-be-done, emotional promise, value chain, competitive landscape, wedge, vision, wedge to full vision arc, and MVP. Emits MD + HTML (always) and DOCX (when pandoc is installed) to `paths.briefs` (`_docs/briefs/<slug>/`).

Usage:

```
/portfolio:bootstrap [--slug <name>] [--section-set minimal|extended] [--docx-backend auto|pandoc|none] [--output-dir <path>] [--rerun-policy overwrite|version|prompt]
```

Designed for two flows: (1) bootstrap a brief in a fresh project, and (2) explore an adjacent "what-if" product idea inside an existing repo without committing to it. The skill is reversible — outputs land in a single brief dir, history is kept, and the `paths.briefsCurrent` pointer is the only registry change.

## Input

`$ARGUMENTS` — optional. May contain any of the CLI flags above. If `--slug` is omitted, the slug is derived from the project root basename and normalized.

## When to use this

- **Fresh project**, rough idea, no written brief yet.
- **Mid-project exploration**: a "what-if" adjacent product idea you want to draft without committing to. Use `--rerun-policy version` so successive iterations stack in `history/<ISO>/` and the whole experiment is one-line revertible.
- **Before `/sprint:plan`** so sprint planning has product context.
- **Onboarding / retrospectives** want a single document with stable section headings.

Output is consumed by `/sprint:plan`, `/oneshot:start`, and onboarding scaffolds. The brief is also the natural pre-flow before `/dream-team`-style staffing skills that need a project description as input.

## What it does

1. **Greet** — Print the greeting from `copy.md#C-2` so the operator knows what's coming.
2. **Probe** — Resolve the slug from `--slug` or `cwd` basename. Detect pandoc on PATH. Detect an existing brief at `_docs/briefs/<slug>/` to drive the re-run policy.
3. **Discuss** — Run an AskUserQuestion-budgeted conversation that covers every section in the active section set. Prefer ONE batched call with 4 question objects (one beta-gate consult in adhoc mode) over 4 separate turns. The operator may answer multiple sections in one reply; the generator does not re-ask answered sections. Skip the AskUserQuestion path entirely by passing `--answers-file <path>` — the iterate-via-answers-file pattern is the recommended way to refine a draft across multiple passes.
4. **Coverage QC** — Before any write, verify every section has either drafted content or an explicit `skipped_declined` marker. Truly empty sections halt the run with `copy.md#C-7`.
5. **Write** — Emit `<slug>.brief.md` and `<slug>.brief.html` to `paths.briefs` (`_docs/briefs/<slug>/`). Each artifact carries a `draft N` revision counter computed from history-dir count (visible in MD frontmatter `draft:` field and HTML version-badge). If pandoc is available, also emit `<slug>.brief.docx`. Otherwise print `copy.md#C-5` and continue.
6. **Render quality** — The HTML renderer processes inline markdown: `**bold**` → `<strong>`, `*italic*` → `<em>`, `` `code` `` → `<code>`. It also detects the intro-then-bullets pattern (text lines followed by `- ` lines) and splits into `<p>intro</p><ul>...</ul>` instead of flattening into a `<p>` with `<br>` runs.
7. **Register paths** — On first successful emit, add `paths.briefs` and `paths.briefsCurrent` to `.claude/paths.json` so downstream skills can read the brief.
8. **Summarize** — Print `copy.md#C-8` with the emitted file paths.

## Flags

| Flag | Default | Effect |
|---|---|---|
| `--slug <name>` | derived from `cwd` basename | Project slug, used in output dir and filenames. Must match `^[a-z0-9][a-z0-9-]{0,63}$`. |
| `--section-set <minimal\|extended>` | `minimal` | `minimal` = 9 sections (problem -> MVP, including Emotional Promise). `extended` adds Bear Case, Bull Case, Quick Notes, References (13 total). |
| `--docx-backend <auto\|pandoc\|none>` | `auto` | `auto` shells out to pandoc if present, otherwise skips DOCX with a hint. `pandoc` is strict — exit 5 if missing. `none` skips DOCX silently. |
| `--output-dir <path>` | `_docs/briefs/<slug>/` | Override the output directory. Must stay inside the project root. |
| `--rerun-policy <overwrite\|version\|prompt>` | `version` | On re-run for an existing slug: `version` moves the prior brief into `<slug>/history/<ISO>/`. `overwrite` replaces without backup. `prompt` asks once. |
| `--help` | - | Print this help text and exit 0. |

## Iterating on a draft

A brief almost always goes through multiple drafts as users layer in directional content. The recommended workflow:

1. First emit — run interactively (or pass an initial `--answers-file`). This writes draft 1.
2. Edit the answers JSON (typically stored in `.claude/runtime/<slug>-answers.json` — gitignored) with refined section content.
3. Re-emit with `--rerun-policy version` (default) — the prior draft moves to `history/<ISO>/`, the new draft becomes current, the draft counter increments. Repeat as many times as needed.
4. For purely cosmetic / renderer fixes that should NOT bump the draft counter (e.g. you re-ran after a template tweak), use `--rerun-policy overwrite` — replaces current files without adding a history entry.

This pattern is how the skill is designed to be used iteratively. The `draft N` counter in the artifact is computed from `history/*` dir count, so it's accurate without any extra state.

## Reversibility

When used exploratorily inside an existing repo, the skill's footprint is small and one-line revertible. Per-run touches:

| File | Change | Revert |
|---|---|---|
| `_docs/briefs/<slug>/` | new dir with current + `history/` | `rm -rf` |
| Answers file (if used) | typically `.claude/runtime/<slug>-answers.json` (gitignored) | `rm` |
| `.claude/paths.json` | `briefsCurrent` value updated; on first emit, may also add `briefs`, `briefsCurrent`, `clones`, `clonesCurrent`, `imports`, `importsCurrent` | `git checkout .claude/paths.json` |
| `paths.eventsFile` | 3+ append-only events | not reverted (low signal) |

PowerShell one-shot:

```powershell
Remove-Item -Recurse -Force _docs/briefs/<slug>, .claude/runtime/<slug>-answers.json
git checkout .claude/paths.json
```

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

Headings are stable: `## 01 — Problem` through `## 09 — MVP` (minimal) or `## 13 — References` (extended). Downstream parsers index by these. (Section count bumped +1 when `emotional_promise` was added as a sibling to `jtbds`.)

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
node scripts/portfolio/bootstrap.js [flags]
```

The generator reads the active section set from CLI, runs the discussion loop, drafts each section, writes the outputs, and registers the paths keys. See `scripts/portfolio/bootstrap.js` for the orchestrator and `framework/templates/product-bootstrap/` for the templates.

For interactive use, run the AskUserQuestion turns from the skill driver and pass the answers to the generator's `--answers-file <path>` flag (JSON map keyed by section id). For non-interactive batch runs (CI tests, dry runs), pass `--answers-file` directly.

**AskUserQuestion batching note:** in adhoc mode each call to AskUserQuestion is gated by `beta-gate.js` — one beta consult per call. To minimize consult overhead, batch up to 4 question objects into a single AskUserQuestion call rather than serializing 4 separate turns. Coverage stays the same; round-trips drop 4× → 1×.
