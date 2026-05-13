# TRACE Requirements — Organic skill use by agents — research + mechanism

**Sprint:** `SP-20260513-003`
**PRD:** `.claude/project/sprint/requirements/SP-20260513-003/prd.md`

> TRACE captures observability, telemetry, decision logging, and requirement-to-code linkage. This sprint's TRACE story is load-bearing — without it, the behavior change is invisible and unrollback-able.

## Trace Map

| Source | Requirement | Story | COPY | INPUT | ESD | Ticket | Code | Test | Release | Learning |
|---|---|---|---|---|---|---|---|---|---|---|
| User request (verbatim, PC-20260513-0004) | R-1 | S-1 | — | — | — | T-… | `paths.tracesFile` (canonical reasoning trace) | manual review | — | — |
| ADR Mechanism D decision | R-2 | S-2 | C-1 | — | — | T-… | `CLAUDE.md#skill-use` | grep CLAUDE.md for "Skill Use" header | — | LRN-…-claudemd-rule-shipped |
| ADR Mechanism D decision | R-2 | S-3 | C-2 | — | — | T-… | `.claude/agents/00-alex/.system/lexicon.md` | grep lexicon for new entries | — | — |
| ADR Mechanism D decision | R-3, R-6, R-8 | S-4 | C-3, C-5 | IN-1, IN-2, IN-3 | — | T-… | `scripts/hooks/smart-context.js` | unit + integration via hook payload fixtures | — | — |
| Salience problem | R-4, R-6 | S-5 | — | IN-4, IN-6 | — | T-… | `scripts/generate-skill-catalog.js`, `paths.skillCatalog` | run gen, verify schema | — | — |
| Measurement requirement | R-5, R-8 | S-6 | C-4 | IN-5 | — | T-… | `scripts/hooks/smart-context.js`, new pre-SlashCommand hook | events.jsonl tail + adherence query | post-ship rollback trigger | — |
| Ranker quality dependency | R-7 | S-7 | — | — | — | T-… | `runtime/notes/skill-description-audit.md`, audit script | re-run audit, zero criticals | — | — |

## TR-1 — `skill-suggested` event (linked requirement `R-5`, story `S-4`, `S-6`)

**Event:** `skill-suggested-vs-invoked` with `phase: "suggested"`
**When:** Inside `smart-context.js#main`, immediately after `callHaiku` returns a non-empty `skills` array and *before* writing `additionalContext`. One event per skill in the top-K array.
**Captured fields:**
- `ts` — ISO8601 from `new Date().toISOString()`
- `type` — literal `"skill-suggested-vs-invoked"`
- `category` — literal `"skill-adherence"`
- `session_id` — from `getSessionId()`
- `prompt_hash` — md5 first 12 chars of `stripSystemTags(prompt)`
- `phase` — literal `"suggested"`
- `skill_id` — slug from catalog (e.g. `"fix:fast"`)
- `score` — float 0.0–1.0 from Haiku response
- `rank` — integer 1–K position in the array

**Linked requirement:** `R-5`
**Linked story:** `S-4`, `S-6`

**Why we capture this:** Without per-skill suggestion telemetry, we cannot compute adherence rate, cannot diff "agent ignored suggestion" from "ranker didn't suggest", and cannot tune the ranker over time. This is the **measurement spine** of the sprint.

## TR-2 — `skill-invoked` event (linked requirement `R-5`, story `S-6`)

**Event:** `skill-suggested-vs-invoked` with `phase: "invoked"`
**When:** Pre-SlashCommand hook fires (or wrapper around `.claude/commands/**` invocation). For each agent-initiated `/skill:name` call OR detected skill-equivalent tool sequence. Slash commands typed by the user are tagged `invocation_path: "user-slash"` and excluded from adherence calculation (they're not organic).
**Captured fields:**
- `ts`, `type`, `category`, `session_id`, `prompt_hash` — same as TR-1
- `phase` — literal `"invoked"`
- `skill_id` — slug of the invoked skill
- `turn_offset` — integer; turns elapsed since the matching `suggested` event for this `prompt_hash` (0 = same turn, 1 = next turn, etc.). Used to bound adherence window.
- `invocation_path` — `"ranker"` (agent invoked a suggested skill), `"agent-tool"` (agent invoked a skill that wasn't suggested), `"user-slash"` (user typed it; excluded from adherence)

**Linked requirement:** `R-5`
**Linked story:** `S-6`

**Why we capture this:** The `suggested` half is meaningless without the `invoked` half. Joining the two by `(session_id, prompt_hash, skill_id)` produces adherence rate. `invocation_path` discriminator lets `/check:patterns` answer the right question: "did the agent take the suggestion?" not "did anyone use the skill?".

## TR-3 — Ranker fail-open log (linked requirement `R-8`, story `S-4`)

**Event:** `RANKER_EMPTY` / `RANKER_PARSE_FAIL` / `RANKER_TIMEOUT` / `CATALOG_MISSING` / `CATALOG_TRUNCATED` lines in `paths.logs/<sessionId>/smart-context.log`
**When:** Any time the ranker portion of the Haiku response is missing, malformed, empty below threshold, or the catalog is unreadable.
**Captured fields:** Timestamp, phase label, latency in ms (where applicable), truncated prompt slice (≤200 chars).
**Linked requirement:** `R-8`
**Linked story:** `S-4`
**Why we capture this:** Fail-open by design means failures are silent at the prompt level. Without explicit phase-labeled log lines we cannot distinguish "ranker working, nothing relevant" from "ranker broken, never firing" — both look identical from the agent's POV. Distinct labels make `/check:patterns` triage trivial.

## TR-4 — Reasoning trace canonicalization (linked requirement `R-1`, story `S-1`)

**Event:** Trace written to `paths.tracesFile` by `/reasoning:run` invocation
**When:** Before any ticket implementation begins.
**Captured fields:** `id`, `ts`, `problem_type: "behavior-change"`, `framework_selected: "comparative-analysis"`, `problem_summary`, `outcome`, `quality_score`, link to PRD inline-ADR.
**Linked requirement:** `R-1`
**Linked story:** `S-1`
**Why we capture this:** The PRD inline ADR is proposal-grade (drafted by a design-step subagent that cannot invoke `/reasoning:run`). The official trace is the canonical record. Downstream tickets reference the trace ID; the PRD updates to point at the trace ID instead of the proposal flag.
