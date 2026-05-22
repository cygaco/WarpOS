# INPUT Requirements — /product:import

**Sprint:** `SP-20260520-002`
**PRD:** `.claude/project/sprint/requirements/SP-20260520-002/prd.md`

> INPUTS capture every CLI flag, environment variable, and file the skill reads, with the validation that makes each safe. Each entry should be testable. Field shapes and exit codes mirror `scripts/product/bootstrap.js` where the precedent already exists.

## IN-1 — `--slug <name>` (linked story `S-1`)

| Property | Value |
|---|---|
| Field | `--slug` CLI flag |
| Type | string |
| Required | no (derived from `cwd` basename when omitted, normalized via `bootstrap.js#deriveSlugFromCwd`) |
| Source | user (CLI) or system (derived) |
| Validation | Matches `/^[a-z0-9][a-z0-9-]{0,63}$/` (same regex as bootstrap `SLUG_RE`). Lowercased + normalized when derived. |
| Failure mode | exit 2 with a `Slug \`<raw>\` is not valid…` message and a normalized suggestion (mirrors `bootstrap.js#validateSlug`). |

**Notes:** Reuses bootstrap's slug derivation + validation verbatim so the two skills never disagree about what a valid slug is.

## IN-2 — `--section-set minimal|extended` (linked story `S-1`)

| Property | Value |
|---|---|
| Field | `--section-set` CLI flag |
| Type | enum: `minimal` | `extended` |
| Required | no (default: `minimal`) |
| Source | user (CLI) |
| Validation | Must be one of the two literal values. Anything else → exit 2 `Unknown section set '<v>'. Use minimal or extended.` |
| Failure mode | exit 2 (same as bootstrap `--section-set` validation). |

**Notes:** `minimal` = 8 sections (problem → mvp). `extended` adds 4 (`bear`, `bull`, `quick_notes`, `references`) for 12 total. Section set MUST be a subset/superset of bootstrap's set per R-10.

## IN-3 — `--output-dir <path>` (linked stories `S-1`, `S-5`)

| Property | Value |
|---|---|
| Field | `--output-dir` CLI flag |
| Type | filesystem path (relative or absolute) |
| Required | no (default: `_docs/imports/<slug>/`) |
| Source | user (CLI) |
| Validation | Resolved against `PROJECT` root. Containment check: must stay inside the project root (same algorithm as `bootstrap.js#resolveOutputDir`). |
| Failure mode | exit 2 `--output-dir must stay inside the project root.` if containment fails; exit 4 if the resolved dir is not writable. |

**Notes:** Containment check is the load-bearing input validation — it's what blocks the `../../etc/passwd` redteam scenario in `redteam-plan.md`.

## IN-4 — `--parse <pasted-answers-file>` (linked story `S-8`)

| Property | Value |
|---|---|
| Field | `--parse` CLI flag |
| Type | filesystem path |
| Required | no (omitted = emit-mode; present = parse-mode) |
| Source | user (CLI) — the file is the pasted-back markdown reply from the answering session |
| Validation | File must exist, must be ≤512KB (`MAX_PARSE_FILE_BYTES`), must contain at least one `<!-- section: <id> -->` anchor where `<id>` is in the active section set. |
| Failure mode | exit 2 with C-6 wording (`Parse failed: missing required sections…`) listing the missing section ids. |

**Notes:** `--parse` is mutually exclusive with `--no-introspect` and `--for` (those flags are emit-mode only); passing them together is a soft warning, not a hard error.

## IN-5 — `--no-introspect` (linked stories `S-2`, `S-7`)

| Property | Value |
|---|---|
| Field | `--no-introspect` CLI flag |
| Type | boolean (presence = true) |
| Required | no |
| Source | user (CLI) |
| Validation | Presence only; no value parsed. |
| Failure mode | n/a — flag is purely a behavior switch. |

**Notes:** When set, the introspection pass (S-2) is skipped entirely and the questionnaire preamble degrades to a single line containing only the resolved slug + ISO timestamp.

## IN-6 — `--for <surface-hint>` (linked story `S-1`)

| Property | Value |
|---|---|
| Field | `--for` CLI flag |
| Type | enum: `claude-code` | `codex` | `claude-web` | `chatgpt-web` | `gemini-web` | `universal` |
| Required | no (default: `universal`) |
| Source | user (CLI) |
| Validation | Must be one of the six literal values; anything else → exit 2 `Unknown --for value '<v>'. Use one of: claude-code, codex, claude-web, chatgpt-web, gemini-web, universal.` |
| Failure mode | exit 2. |

**Notes:** Reserved for v2 per D-3. In v1, the value is validated and logged in `import_started.surface_hint` but does NOT branch behavior. Reserving the flag now means v2 can ship presets without a CLI-breaking change.

## IN-7 — Project introspection sources (linked story `S-2`)

| Property | Value |
|---|---|
| Field | The four files/subprocess the introspection pass reads |
| Type | filesystem reads (`PROJECT.md`, `README.md`, `package.json`) + subprocess (`git log -n 10 --pretty=%s`) |
| Required | no (each is independently optional) |
| Source | system (project root) |
| Validation | Each file read is capped at 64KB (truncate + log if exceeded). `git log` subprocess has 5s timeout (`execFileSync({ timeout: 5000 })`); failure is non-fatal. |
| Failure mode | Missing file → omit from preamble + emit C-3 ("No PROJECT.md detected") if it's specifically `PROJECT.md`. `git log` failure → preamble omits "recent activity" line, no error printed. |

**Notes:** All four sources are read-only. No write back, no AST, no recursive traversal. The 5s timeout on `git log` is the hard ceiling that keeps a corrupted repo from hanging the skill (same precedent as `bootstrap.js#PANDOC_PROBE_TIMEOUT_MS`).

## IN-8 — Section template inputs (linked story `S-3`)

| Property | Value |
|---|---|
| Field | `framework/templates/product-import/sections.json` + `questionnaire.md.tmpl` |
| Type | JSON config + Mustache-style template |
| Required | yes (skill fails to start if either is missing or malformed) |
| Source | system (shipped with the framework) |
| Validation | `sections.json` parses as JSON, has `minimal: [...]` and `extended_additions: [...]` arrays of `{ id, title, prompt, framing, response_format_hint }`. The `id` and `title` and `prompt` fields MUST equal the corresponding entry in `framework/templates/product-bootstrap/sections.json` (R-10 parity invariant). |
| Failure mode | exit 2 `Section template at framework/templates/product-import/sections.json is invalid: <reason>`; if `--probe`, emit `section_parity: false` and exit 0 (probe is read-only). |

**Notes:** Parity is enforced at template-load time, not at write-time. This is what prevents bootstrap's section set from drifting silently underneath import.
