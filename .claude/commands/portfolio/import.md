---
description: Generate a paste-friendly questionnaire from this project's context for another AI session to answer; the parsed answers feed /portfolio:bootstrap --answers-file
---

# /portfolio:import — Cross-session Product Context Importer

`/portfolio:import` — Generate a paste-friendly questionnaire from this project's context, suitable for handing to another AI session (Claude Code, Codex, Claude web, ChatGPT, or Gemini). Answers come back as Markdown and parse cleanly into `/portfolio:bootstrap --answers-file`.

Usage:

```
/portfolio:import [--slug <name>] [--section-set minimal|extended] [--output-dir <path>] [--no-introspect] [--parse <pasted-answers.md>] [--for <surface-hint>]
```

Intended as a pre-step to `/portfolio:bootstrap` when the product's source-of-truth lives in another session or tool (an older repo, a long ChatGPT thread, a Notion page, scattered notes).

## Input

`$ARGUMENTS` — optional. May contain any of the CLI flags above. If `--slug` is omitted, the slug is derived from the project root basename and normalized (same rule as `/portfolio:bootstrap`).

## When to use this

- A "trapped" product whose source-of-truth lives in another AI session (web ChatGPT, Claude web, Gemini, a ChatGPT-only project), and you want to land its product brief in this Claude Code project.
- Migrating from a notes-only project (no PROJECT.md, no structured brief) into a Claude Code project that needs `/portfolio:bootstrap`-grade requirements.
- Whenever the manual `AskUserQuestion`-driven `/portfolio:bootstrap` discussion is impractical because the relevant context lives outside the active Claude session.

This is **not** a replacement for `/portfolio:bootstrap`. It is strictly a pre-step that gathers answers from elsewhere and lands them as the `--answers-file` JSON `/portfolio:bootstrap` already accepts.

## What it does

1. **Greet & validate** — Parses CLI args, validates slug + section-set + `--for`, and resolves the output directory under `paths.imports` (`_docs/imports/<slug>/`).
2. **Introspect (bounded)** — Reads at most 4 sources at the project root, each capped at 64KB: `PROJECT.md`, `README.md`, `package.json`, and `git log -n 10 --pretty=%s` (5s timeout). Skipped entirely with `--no-introspect`.
3. **Parity check** — Confirms `framework/templates/product-import/sections.json` matches `framework/templates/product-bootstrap/sections.json` 1:1. On drift, exits non-zero with a diff list (the round-trip safety net).
4. **Render** — Composes a Markdown questionnaire from `framework/templates/product-import/questionnaire.md.tmpl` and the active section set (8 minimal / 12 extended). Each section gets a stable `## NN — Title` heading, a `<!-- section: <id> -->` HTML anchor (this is what the parser keys on), a "What we're after" framing line, the bootstrap prompt verbatim, and a response-format hint.
5. **Write** — Emits `_docs/imports/<slug>/<slug>.questionnaire.md` (UTF-8, LF, trailing newline; no DOCX, no HTML).
6. **Register paths** — On first successful emit, adds `paths.imports` and `paths.importsCurrent` to `.claude/paths.json` so downstream skills resolve the questionnaire by paths key.
7. **Summarize** — Prints a 4-step "Next steps" block that closes the loop: paste elsewhere → bring reply back → `--parse` → `/portfolio:bootstrap --answers-file`.

### `--parse` mode (round-trip second half)

When invoked with `--parse <pasted-answers.md>`, the skill switches modes:

1. Loads the pasted Markdown reply (≤512KB).
2. Splits it on `<!-- section: <id> -->` anchors at line-start (anchor-only — heading text may be freely renamed by the answering session).
3. Marks any section whose body is empty or contains the literal `_skipped — operator declined to answer this section._` as `skipped_declined`.
4. If any required section anchor is missing, prints a precise diagnostic (which ids), exits 2, writes nothing.
5. Otherwise writes `_docs/imports/<slug>/<slug>.answers.json` in the exact shape `scripts/product/bootstrap.js#sanitizeAnswer` consumes: `{ "<section_id>": { "content": "...", "status": "drafted"|"skipped_declined", "source_turns": [] } }`.

## Flags

| Flag | Default | Effect |
|---|---|---|
| `--slug <name>` | derived from `cwd` basename | Project slug, used in output dir and filenames. Must match `^[a-z0-9][a-z0-9-]{0,63}$`. |
| `--section-set <minimal\|extended>` | `minimal` | `minimal` = 8 sections (problem -> MVP). `extended` adds Bear Case, Bull Case, Quick Notes, References (12 total). Must match the section set you intend to feed `/portfolio:bootstrap`. |
| `--output-dir <path>` | `_docs/imports/<slug>/` | Override the output directory. Must stay inside the project root. |
| `--no-introspect` | off | Skip the bounded read pass. Preamble degrades to a single line containing the slug + timestamp. |
| `--parse <path>` | (emit mode) | Switch to parse mode. Reads the pasted-back Markdown, emits `<slug>.answers.json`. |
| `--for <surface-hint>` | `universal` | Reserved for v2. Accepts `claude-code`, `codex`, `claude-web`, `chatgpt-web`, `gemini-web`, `universal`. v1 validates + logs the hint but does not branch behavior. |
| `--help` | - | Print this help text and exit 0. |
| `--probe` | - | Read-only. Emits JSON with the parity report and resolved arg values. No writes, no events. |

## Outputs

Emit mode:

```
_docs/imports/<slug>/
  <slug>.questionnaire.md      always
```

Parse mode:

```
_docs/imports/<slug>/
  <slug>.answers.json          always (on success)
```

Headings inside the questionnaire are stable: `## 01 — Problem` through `## 08 — MVP` (minimal) or `## 12 — References` (extended). Downstream parsers (and human readers) index by these.

## Exit codes

- `0` — success
- `2` — invalid input (slug, section set, `--for`, output dir containment, missing parse file, parse-mode section mismatch)
- `3` — reserved (introspection produced nothing without `--no-introspect`; currently emits a warning and continues)
- `4` — output directory not writable
- `5` — parity drift between import and bootstrap section templates (or other CI-grade template failure)

## TRACE events

Emits six event types to `paths.eventsFile` (fail-open per CLAUDE.md learning L-2026-04-17-n):

- `import_started` — once per run, after CLI parse (carries `mode: emit|parse`)
- `context_introspected` — once per emit-mode run, after the introspection pass (presence flags + truncation list; never raw file bodies)
- `questionnaire_emitted` — once per emit-mode run, after MD write + paths registration
- `parse_started` — once per parse-mode run, after `--parse` file is loaded
- `parse_completed` — once per parse-mode run, after `answers.json` write
- `parse_failed_section_mismatch` — once per parse-mode run when validation finds missing required sections

No section body text, no raw operator answers, no `package.json` body, and no commit body content appears in events. Fields are limited to ids, counts, presence flags, and timestamps.

## Reference

- Downstream consumer: `/portfolio:bootstrap` (`.claude/commands/portfolio/bootstrap.md`). The JSON shape `--parse` emits matches `scripts/product/bootstrap.js#sanitizeAnswer` exactly.
- Section source of truth: `framework/templates/product-bootstrap/sections.json` (import's `sections.json` mirrors this 1:1; drift is caught by `--probe` and at runtime).
- Plan Contract: `PC-20260521-0018`
- Sprint: `SP-20260520-002`

## Procedure

Invoke the generator directly:

```bash
node scripts/product/import.js [flags]
```

Typical workflow (the full round-trip):

```bash
# 1. In the target project, generate the questionnaire.
node scripts/product/import.js --slug my-trapped-product

# 2. Copy the contents of _docs/imports/my-trapped-product/my-trapped-product.questionnaire.md
#    into your other AI session (Claude Code, Codex, Claude web, ChatGPT web, Gemini web).
#    Ask it to answer each section, keeping the headings and HTML-comment anchors verbatim.

# 3. Save the reply back into this project, e.g. _docs/imports/my-trapped-product/reply.md
#    Then convert it to answers.json:
node scripts/product/import.js --parse _docs/imports/my-trapped-product/reply.md --slug my-trapped-product

# 4. Feed the result into /portfolio:bootstrap:
node scripts/product/bootstrap.js --slug my-trapped-product --answers-file _docs/imports/my-trapped-product/my-trapped-product.answers.json
```

For CI / smoke testing, `node scripts/product/import.js --probe` prints the parity report as JSON and exits 0 without writing anything.
