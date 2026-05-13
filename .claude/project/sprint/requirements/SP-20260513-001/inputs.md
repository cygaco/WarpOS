# INPUT Requirements — /product:bootstrap skill — guided product brief in MD/HTML/DOCX

**Sprint:** `SP-20260513-001`
**PRD:** `prd.md`

> INPUTS captures fields, forms, data entry, validation, and user/system
> inputs. Each entry should be testable.

## IN-1 — project_slug (linked story `S-1`, `S-3`)

| Property | Value |
|---|---|
| Field | `--slug <value>` (CLI flag) |
| Type | string |
| Required | No — derived from `cwd` basename if omitted |
| Source | user (CLI) or system (derived) |
| Validation | Matches `^[a-z0-9][a-z0-9-]{0,63}$`. If derived from cwd, normalize: lowercase, replace non-`[a-z0-9-]` with `-`, collapse runs of `-`, trim leading/trailing `-`, truncate to 64. |
| Failure mode | Invalid → emit `copy.md#C-6`, exit 2. Empty after normalization → emit `copy.md#C-6` with the literal `<empty>` suggestion. |

**Notes:** Slug is the single id used for output dir, filenames, and `paths.briefsCurrent`. Stable across re-runs.

## IN-2 — section_set (linked story `S-2`)

| Property | Value |
|---|---|
| Field | `--section-set <minimal\|extended>` (CLI flag) |
| Type | enum |
| Required | No — defaults to `minimal` |
| Source | user (CLI) |
| Validation | Must be exactly `minimal` or `extended`. Any other value halts with a hint listing the two valid values. |
| Failure mode | Invalid value → exit 2 with `"Unknown section set '<value>'. Use minimal or extended."`. |

**Notes:** `minimal` = problem, JTBDs, value chain, competitive, wedge, vision, wedge→vision, MVP (8 sections). `extended` adds Bear/Bull/Quick Notes/References (12 sections total).

## IN-3 — docx_backend (linked story `S-5`)

| Property | Value |
|---|---|
| Field | `--docx-backend <auto\|pandoc\|none>` (CLI flag) |
| Type | enum |
| Required | No — defaults to `auto` |
| Source | user (CLI) |
| Validation | Must be exactly one of `auto`, `pandoc`, `none`. |
| Failure mode | Invalid → exit 2 with a hint. `pandoc` explicitly requested but not found → exit 5 with install hint. `auto` + missing pandoc → success with `copy.md#C-5` warning. |

**Notes:** `auto` is the most forgiving; `pandoc` is strict; `none` skips DOCX entirely with no message.

## IN-4 — output_dir (linked story `S-6`)

| Property | Value |
|---|---|
| Field | `--output-dir <path>` (CLI flag) |
| Type | path |
| Required | No — defaults to `_docs/briefs/<slug>/` |
| Source | user (CLI) |
| Validation | Must resolve under the project root (no `..` escape). Parent directory must be writable. Path normalized via `path.resolve`. |
| Failure mode | Escapes project root → exit 2 with `"--output-dir must stay inside the project root."`. Not writable → emit `copy.md#C-10`, exit 4. |

**Notes:** When overridden, `paths.briefsCurrent` is still updated to the resolved location. `paths.briefs` defaults to `_docs/briefs/` even if a custom output-dir is used (the registry key reflects the conventional location).

## IN-5 — rerun_policy (linked story `S-6`)

| Property | Value |
|---|---|
| Field | `--rerun-policy <overwrite\|version\|prompt>` (CLI flag) |
| Type | enum |
| Required | No — defaults to `version` |
| Source | user (CLI) |
| Validation | Must be exactly one of `overwrite`, `version`, `prompt`. |
| Failure mode | Invalid → exit 2 with hint. `prompt` selected without an interactive terminal → fall back to `version` and log a warning. |

**Notes:** `version` moves prior `<slug>.brief.*` into `<slug>/history/<ISO-8601>/` before writing. `overwrite` deletes prior top-level files without backup. `prompt` shows `copy.md#C-9` once.

## IN-6 — discussion answers (linked story `S-2`)

| Property | Value |
|---|---|
| Field | Free-form text per AskUserQuestion turn |
| Type | string (per turn) |
| Required | Yes (each turn) |
| Source | user (interactive) |
| Validation | Non-empty after trim. Hard cap: 4 000 characters per answer (defends against paste-injection DoS). Stripped of ANSI escapes and BOM. |
| Failure mode | Empty answer → re-prompt once, then proceed marking the section as `skipped — operator declined`. Over-length → truncate to 4 000 and warn. |

**Notes:** Answers are stored verbatim in an in-memory context object and only used by the generator. They are NOT written into events.jsonl (avoid leaking strategy to the event log).

## IN-7 — pandoc presence (linked story `S-5`)

| Property | Value |
|---|---|
| Field | result of `pandoc --version` exit status |
| Type | boolean |
| Required | Yes (probed on every run when `docx-backend != none`) |
| Source | system (PATH probe) |
| Validation | Exit 0 → present. Any other exit or ENOENT → absent. Timeout (>2s) → absent + log warning. |
| Failure mode | Absent + `docx-backend=auto` → emit `copy.md#C-5`, continue. Absent + `docx-backend=pandoc` → exit 5. |

**Notes:** Probe uses cross-platform shim: `where pandoc` on Windows, `which pandoc` elsewhere, with a 2 s timeout.
