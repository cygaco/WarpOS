# COPY Requirements — Organic skill use by agents — research + mechanism

**Sprint:** `SP-20260513-003`
**PRD:** `.claude/project/sprint/requirements/SP-20260513-003/prd.md`

> COPY captures user-visible text and content expectations. Most "copy" here is agent-facing (CLAUDE.md, system-reminder blocks, telemetry schemas) since this sprint changes agent behavior, not UI.

## C-1 — CLAUDE.md "Skill Use" rule (linked story `S-2`)

**Context:** New section appended to `CLAUDE.md`, between `## Operational Loop` and `## Autonomy`. Concrete wording the agent will read every session.

**Text:**

> ## Skill Use
>
> The skill library under `.claude/commands` encodes known-good procedures. **Prefer existing skills when the user's intent matches a skill's purpose** — invoke the skill instead of re-deriving the procedure inline. Skill selection is salience-driven:
>
> - When `SUGGESTED SKILLS:` appears in your `additionalContext`, treat each entry as a strong candidate. If one matches the user's intent ≥0.7, invoke it. Don't enumerate, don't ask — just call it.
> - When no suggestions appear, scan the full skill catalog mentally. The catalog is in your system-reminder; a one-line match is enough to justify invocation.
> - **Manual invocation always overrides.** If the user types `/skill:name` directly, do that — no second-guessing.
> - **Irreversible skills still respect the autonomy table.** Suggestion is not authorization. Skills that push, delete, or deploy require explicit user approval per `## Autonomy`.
> - Telemetry logs both suggestions and invocations — see `paths.eventsFile` event type `skill-suggested-vs-invoked`. Adherence is observable; drift is detectable.

**Notes:** ≤40 lines. Phrased as a behavior rule (active voice, no hedging). Mirrors the existing identity-bullets style at the top of CLAUDE.md.

## C-2 — Lexicon entries (linked story `S-3`)

**Context:** Four new entries appended to `paths.lexicon` (`.claude/agents/00-alex/.system/lexicon.md`). Same format as existing entries.

**Text:**

> **Organic skill use** — Invoking a skill from `.claude/commands` based on prompt-matching alone, without the user typing the slash command. The signal can come from `SUGGESTED SKILLS:` in `additionalContext` (high-salience) or from the full catalog in the system-reminder (low-salience fallback). Contrast with manual invocation, where the user types `/skill:name` explicitly.
>
> **Skill ranker** — The component inside `scripts/hooks/smart-context.js` that asks Haiku to rank the top-3 most relevant skills against the current prompt. Output is injected as `SUGGESTED SKILLS:` in `additionalContext`. Fail-open — a ranker timeout falls back to current behavior, never blocks the prompt.
>
> **Suggested skill** — A skill that the ranker scored ≥ threshold and surfaced to the agent in this turn. Suggestion is not authorization; the agent still applies autonomy rules before invoking irreversible operations.
>
> **Adherence rate** — The fraction of suggested skills that the agent actually invoked: `invoked ∩ suggested ÷ suggested`, computed over a rolling window (default 7 days) from the `skill-suggested-vs-invoked` event type. Drives `/check:patterns` analysis and ranker tuning.

**Notes:** Each entry one paragraph. Cross-references `CLAUDE.md#skill-use` and `paths.skillCatalog`.

## C-3 — `SUGGESTED SKILLS:` context block format (linked story `S-4`)

**Context:** Format that `smart-context.js#assembleContext` emits when the ranker returns a non-empty array. Lives inside `additionalContext`.

**Text:**

> SUGGESTED SKILLS:
>   /fix:fast — quick fix, no formal framework, fits "fix it" / "broken" prompts (score 0.86)
>   /check:patterns — cross-run intelligence and automation proposals (score 0.71)
>   /reasoning:run — reason through a problem, auto-triages quick vs deep (score 0.64)

**Notes:** Plain text, no markdown fences, two-space indent (mirrors existing `RECENT LEARNINGS:` block style in smart-context.js). Max 3 entries. Each line: `  /slug — one-line description (score N.NN)`. Score is the ranker's relevance score 0.00–1.00. If the top score is below a configurable threshold (default 0.6), the block is suppressed entirely.

## C-4 — Telemetry event schema (linked story `S-6`)

**Context:** Schema for the new `skill-suggested-vs-invoked` event type in `paths.eventsFile`. Documented for `/check:patterns` and other downstream consumers.

**Text:**

> {
>   "ts": "ISO8601 timestamp",
>   "type": "skill-suggested-vs-invoked",
>   "category": "skill-adherence",
>   "session_id": "<getSessionId>",
>   "prompt_hash": "<md5 first 12 chars of stripped prompt>",
>   "phase": "suggested" | "invoked",
>   "skill_id": "<slug, e.g. fix:fast>",
>   "score": 0.0-1.0,            // suggested only
>   "rank": 1-3,                  // suggested only
>   "turn_offset": 0+,            // invoked only — how many turns after suggestion
>   "invocation_path": "ranker" | "user-slash" | "agent-tool"  // invoked only
> }

**Notes:** One event per skill, not one event per turn — makes downstream join trivial. `phase` discriminator lets `/check:patterns` compute adherence in a single pass. Append-only via `logger.js` (which uses `paths.eventsFile`). Bad payloads fail open to `paths.logs/<sessionId>/telemetry-fail.log` per S-6 AC-5.

## C-5 — Ranker fail-open log line (linked story `S-4`)

**Context:** Format that `smart-context.js#log` writes when the ranker portion of the Haiku response is missing, malformed, or empty. Lives in `paths.logs/<sessionId>/smart-context.log`.

**Text:**

> [HH:MM:SS] RANKER_EMPTY (1234ms): <prompt slice>
> [HH:MM:SS] RANKER_PARSE_FAIL (1234ms): <prompt slice>
> [HH:MM:SS] RANKER_TIMEOUT (15000ms): <prompt slice>

**Notes:** Mirrors existing `HAIKU_FAIL` / `SKIP` log lines. Distinct phases so we can diagnose whether the ranker is silently failing without blocking prompts.
