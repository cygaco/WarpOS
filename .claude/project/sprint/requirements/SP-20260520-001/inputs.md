# INPUT Requirements — `/product:clone`

**Sprint:** `SP-20260520-001`
**PRD:** `.claude/project/sprint/requirements/SP-20260520-001/prd.md`

> INPUTS captures every CLI flag the skill accepts and the validation rules. Each is testable. Operator-facing failure modes are visible via the help text (`C-2`) and exit codes.

## IN-1 — `--name` (linked story `S-1`, `S-2`)

| Property | Value |
|---|---|
| Field | `--name <product-name>` |
| Type | string |
| Required | Optional, but at least one of `--name` / `--url` / `--video` must be present |
| Source | user |
| Validation | Non-empty after trim. Length ≤ 200 chars. No control chars (`\x00`-`\x1f` except `\t`). |
| Failure mode | Empty after trim → exit `2` + help. Too long → exit `2`. Control chars → exit `2`. |

**Notes:** When only `--name` is given (no URL), the skill runs WebSearch to identify the authoritative product URL (S-2). The name also seeds the slug if `--slug` is absent.

## IN-2 — `--url` (linked story `S-1`, `S-3`)

| Property | Value |
|---|---|
| Field | `--url <product-url>` |
| Type | URL |
| Required | Optional, but at least one of `--name` / `--url` / `--video` must be present |
| Source | user |
| Validation | Parses as a URL with scheme in {`http`, `https`}. Hostname is not an IP literal (no `192.168.*`, `10.*`, `127.*`, `0.*`, `169.254.*`, IPv6 loopback). No `file://`, `javascript:`, `data:` schemes. |
| Failure mode | Invalid URL → exit `2`. Disallowed scheme → exit `2`. IP literal → exit `2` + SSRF-block message. |

**Notes:** The SSRF-block on private/loopback IPs is a red-team guardrail (see `redteam-plan.md`). Public DNS-resolvable hostnames only.

## IN-3 — `--video` (linked story `S-1`, `S-2`)

| Property | Value |
|---|---|
| Field | `--video <video-url>` |
| Type | URL |
| Required | Optional |
| Source | user |
| Validation | Same scheme/host rules as `--url`. Hostname is a known video host (`youtube.com`, `youtu.be`, `vimeo.com`, `loom.com`) OR has `?v=` / typical video query patterns. |
| Failure mode | Invalid URL → exit `2`. Unknown host → warning printed; skill continues using the URL but expects fallback (C-10). |

**Notes:** Transcript ingestion requires `yt-dlp` on PATH (D-3). If absent, the skill prints C-10 and uses just the URL/title via WebSearch.

## IN-4 — `--output-dir` (linked story `S-1`, `S-11`)

| Property | Value |
|---|---|
| Field | `--output-dir <path>` |
| Type | filesystem path |
| Required | Optional (defaults to `_docs/clones/<slug>/`) |
| Source | user |
| Validation | Resolves to a path inside the project root (no `..` traversal escaping the project). Path is creatable (writable parent dir). Slug-derived subdirectory does not contain control chars or path separators. |
| Failure mode | Traversal escape → exit `2`. Parent unwritable → exit `4`. |

**Notes:** Defends against the redteam scenario "output-path traversal via crafted slug". The slug itself is also validated (IN-5).

## IN-5 — `--slug` (linked story `S-1`)

| Property | Value |
|---|---|
| Field | `--slug <slug>` |
| Type | string (slug) |
| Required | Optional (derived from `--name` normalized, else from URL hostname) |
| Source | user |
| Validation | Matches `^[a-z0-9][a-z0-9-]{0,63}$` (same regex as `/product:bootstrap` `SLUG_RE`). Lower-case, alphanumeric + hyphen, 1-64 chars, starts with alphanumeric. |
| Failure mode | Regex fail → exit `2` with the regex in the error message. |

**Notes:** When derived from `--name`, the skill applies: lowercase → replace non-alphanumeric with `-` → collapse repeats → trim leading/trailing hyphens → truncate to 64.

## IN-6 — `--max-review-sources` (linked story `S-3`, `S-4`)

| Property | Value |
|---|---|
| Field | `--max-review-sources <n>` |
| Type | integer |
| Required | Optional (default `3`) |
| Source | user |
| Validation | Integer in range [1, 8]. |
| Failure mode | Non-integer → exit `2`. Out of range → exit `2`. |

**Notes:** Caps cost + crawl impact. Default `3` matches the "2-3 review sources" framing in the original request. Separate budget from the one-level discovery cap on the product site (which is also bounded — currently hard-coded at 8 internal URLs per run; not a flag in v1).

## IN-7 — `--no-cache` (linked story `S-5`)

| Property | Value |
|---|---|
| Field | `--no-cache` |
| Type | boolean flag |
| Required | Optional (default false) |
| Source | user |
| Validation | Presence-only flag. No value. |
| Failure mode | Unknown value after flag → exit `2`. |

**Notes:** When set, the skill ignores any existing `_docs/clones/<slug>/_raw/` cache and re-fetches every URL. Useful when re-running against a target whose pages changed.

## IN-8 — `--strict` (linked story `S-1`, `S-14`)

| Property | Value |
|---|---|
| Field | `--strict` |
| Type | boolean flag |
| Required | Optional (default false → permissive mode) |
| Source | user |
| Validation | Presence-only flag. |
| Failure mode | n/a (flag parsing only) |

**Notes:** Permissive (default) mode marks failed sources with `[GAP]` and continues. Strict mode aborts on the first source failure with exit `5`. Strict mode is for CI/audit contexts where partial deliverables are unacceptable.
