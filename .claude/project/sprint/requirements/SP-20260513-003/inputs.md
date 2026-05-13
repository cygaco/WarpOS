# INPUT Requirements — Organic skill use by agents — research + mechanism

**Sprint:** `SP-20260513-003`
**PRD:** `.claude/project/sprint/requirements/SP-20260513-003/prd.md`

> INPUTS captures tunable parameters, system inputs, and config knobs. Most "inputs" in this sprint are ranker tuning parameters and feature flags, not user form fields.

## IN-1 — Ranker top-K (linked story `S-4`)

| Property | Value |
|---|---|
| Field | `RANKER_TOP_K` |
| Type | integer |
| Required | no (default = 3) |
| Source | env var on `scripts/hooks/smart-context.js` |
| Validation | 1 ≤ K ≤ 5 (cap at 5 to bound token cost) |
| Failure mode | If invalid or unset → default 3; never throw |

**Notes:** Why 3 default — small enough that the agent reads all entries, large enough to give the ranker margin for tie cases. Output capped to top-K regardless of how many skills score above threshold.

## IN-2 — Ranker score threshold (linked story `S-4`)

| Property | Value |
|---|---|
| Field | `RANKER_MIN_SCORE` |
| Type | float |
| Required | no (default = 0.6) |
| Source | env var on `scripts/hooks/smart-context.js` |
| Validation | 0.0 ≤ score ≤ 1.0 |
| Failure mode | If invalid or unset → default 0.6; ranker block suppressed when nothing scores above |

**Notes:** Below 0.6 the suggestion is more noise than signal. Empirically tunable: if adherence rate drops at 0.6, lower to 0.5 and re-measure.

## IN-3 — Ranker timeout (linked story `S-4`)

| Property | Value |
|---|---|
| Field | `RANKER_TIMEOUT_MS` |
| Type | integer (ms) |
| Required | no (default = 500ms is too tight — the ranker shares the existing Haiku call which has `TIMEOUT_MS = 15000`. Practical default = 15000 inherited; no separate ranker timeout) |
| Source | env var on `scripts/hooks/smart-context.js` |
| Validation | 1000 ≤ ms ≤ 30000 |
| Failure mode | Timeout → `RANKER_TIMEOUT` log line; fail-open to current behavior |

**Notes:** Because the ranker is a new responsibility on the *same* Haiku call (not a new round-trip), it inherits the existing 15s timeout. Separate timeout only needed if we ever split it into a second call. Document this default of "shared with smart-context timeout".

## IN-4 — Skill catalog path (linked story `S-5`)

| Property | Value |
|---|---|
| Field | `paths.skillCatalog` |
| Type | path key in `.claude/paths.json` |
| Required | yes (new key this sprint) |
| Source | generated artifact from `scripts/generate-skill-catalog.js` |
| Validation | File exists; JSON parses; each entry has `{id, slug, description, tags, location}` |
| Failure mode | Missing or unparseable → ranker disabled this turn (logs `CATALOG_MISSING`); fail-open |

**Notes:** Catalog is the single source of truth for skill metadata at ranker time. Regenerate on `.claude/commands/**` change. Cap size at 5K tokens; truncation policy = by recency of last-modified, then alphabetical.

## IN-5 — Telemetry enabled flag (linked story `S-6`)

| Property | Value |
|---|---|
| Field | `SKILL_TELEMETRY_ENABLED` |
| Type | boolean (`1` / `0` / unset) |
| Required | no (default = enabled) |
| Source | env var on `scripts/hooks/smart-context.js` and SlashCommand pre-hook |
| Validation | None — any non-`0` value enables |
| Failure mode | Telemetry write fail → `paths.logs/<sessionId>/telemetry-fail.log`; prompt continues |

**Notes:** Ship enabled by default. Disable flag exists for emergency rollback if event volume becomes a problem. Per the sprint plan, baseline adherence measurement REQUIRES telemetry, so disabling defeats the sprint's measurement story.

## IN-6 — Catalog token budget (linked story `S-5`, `S-6`)

| Property | Value |
|---|---|
| Field | `CATALOG_MAX_INPUT_TOKENS` |
| Type | integer (tokens) |
| Required | no (default = 5000) |
| Source | env var on `scripts/hooks/smart-context.js` |
| Validation | 1000 ≤ tokens ≤ 20000 |
| Failure mode | If catalog exceeds, truncate by recency; log `CATALOG_TRUNCATED` count |

**Notes:** At ~120 skills × ~40 tokens/entry ≈ 4.8K tokens — fits comfortably. Headroom for growth to ~150 skills before truncation kicks in.
