# Acceptance Criteria — Organic skill use by agents — research + mechanism

**Sprint:** `SP-20260513-003`
**PRD:** `.claude/project/sprint/requirements/SP-20260513-003/prd.md`

> Each AC is a testable Given/When/Then. Linked from the granular story and the ticket that implements it.

## S-1 — Reasoning episode canonicalized

**Status:** Satisfied at design time. AC-1.1 through AC-1.3 verified during `/sprint:design` Step 0 — see durable record `reasoning-organic-skill-use.md` and trace `RT-002`.

- **AC-1.1:** Given the source request and PC-20260513-0004, when the design subagent ran Step 0 of `/sprint:design`, then trace `RT-002` was appended to `paths.tracesFile` and a durable markdown record was written at `.claude/project/sprint/sprints/SP-20260513-003/reasoning-organic-skill-use.md`.
- **AC-1.2:** Given the trace entry, when inspected, then `framework_selected == "Multi-Candidate Comparative Analysis"`, `outcome` names Mechanism D (Hybrid), and `quality_score == 3`.
- **AC-1.3:** Given the trace exists, when `prd.md` is read, then the inline-ADR section header references `RT-002` and the "proposal-flag" callout is replaced with a canonicalized reference.

## S-2 — CLAUDE.md "prefer existing skills" rule added

- **AC-2.1:** Given the current `CLAUDE.md`, when I diff after the ticket lands, then a new `## Skill Use` section exists and is ≤40 lines.
- **AC-2.2:** Given the new section, when I grep for the phrase `SUGGESTED SKILLS:`, then it appears at least once in the section (so the agent links rule to context-block format).
- **AC-2.3:** Given the new section, when I read its non-goal callouts, then "manual invocation overrides" and "irreversible skills still respect autonomy" are both explicitly stated.
- **AC-2.4:** Given an Alpha session post-deploy, when the user submits a prompt matching a skill (e.g. "fix this bug fast"), then Alpha's response references invoking `/fix:fast` (or directly calls it) — recorded once in events.jsonl as a `skill-invoked` event with `invocation_path: "ranker"` or `"agent-tool"`.

## S-3 — Lexicon updated with skill-use vocabulary

- **AC-3.1:** Given `paths.lexicon`, when I grep for the four new terms (`Organic skill use`, `Skill ranker`, `Suggested skill`, `Adherence rate`), then all four are present.
- **AC-3.2:** Given each new entry, when I read it, then format matches existing lexicon entries (one paragraph, contrasts with sibling concept).

## S-4 — smart-context.js extended with skill ranker

- **AC-4.1:** Given the updated `smart-context.js`, when I send a synthetic prompt matching a known skill (e.g. "fix the broken hook"), then `additionalContext` in the hook output contains a `SUGGESTED SKILLS:` block with ≥1 entry.
- **AC-4.2:** Given the same updated hook, when I send a prompt matching no skill (e.g. "thanks!"), then either no `SUGGESTED SKILLS:` block appears or the block is suppressed (all candidates below `RANKER_MIN_SCORE`).
- **AC-4.3:** Given a forced Haiku timeout (e.g. `ANTHROPIC_API_KEY` unset or network blocked), when the hook runs, then the hook exits cleanly, writes a `RANKER_TIMEOUT` or `HAIKU_FAIL` log line, and the prompt passes through unmodified.
- **AC-4.4:** Given the Haiku request body emitted by `smart-context.js`, when I inspect it, then `max_tokens` ≤ 1000 and the catalog payload ≤ 5K tokens (or truncated with a `CATALOG_TRUNCATED` log line).
- **AC-4.5:** Given a normal Haiku response with `skills` array, when `assembleContext` runs, then the output block format matches `copy.md` C-3 exactly (two-space indent, `/slug — description (score N.NN)` per line, max 3 entries).

## S-5 — Skill catalog generator + index

- **AC-5.1:** Given `scripts/generate-skill-catalog.js` runs, when it completes, then `paths.skillCatalog` exists at the resolved path and parses as JSON.
- **AC-5.2:** Given the generated catalog, when I count entries, then count matches `.claude/commands/**/*.md` file count (minus any explicit excludes).
- **AC-5.3:** Given each catalog entry, when I inspect, then it has `{id, slug, description, tags, location}` and `description` is non-empty.
- **AC-5.4:** Given a new skill is added to `.claude/commands/**`, when the regen hook (or install) runs, then the catalog updates to include it within one cycle.
- **AC-5.5:** Given `paths.skillCatalog` is added to `.claude/paths.json`, when `node scripts/check-paths.js` (or equivalent) runs, then the key resolves to a real file (no path-lint failures).

## S-6 — Adherence telemetry plumbing

- **AC-6.1:** Given the updated `smart-context.js`, when it injects a `SUGGESTED SKILLS:` block, then K `skill-suggested-vs-invoked` events with `phase: "suggested"` are appended to `paths.eventsFile` — one per skill in the block, with `score` and `rank` present.
- **AC-6.2:** Given an agent invokes a suggested skill in the same or a later turn (within the session), when the pre-SlashCommand hook fires, then a `skill-suggested-vs-invoked` event with `phase: "invoked"`, the correct `turn_offset`, and `invocation_path: "ranker"` is appended.
- **AC-6.3:** Given a user types a slash command manually, when the pre-SlashCommand hook fires, then the event is logged with `invocation_path: "user-slash"` and is excluded from adherence calculation by `/check:patterns`.
- **AC-6.4:** Given a corrupted telemetry write (simulated by, e.g., a read-only events.jsonl), when the hook runs, then it logs `telemetry-fail.log` under `paths.logs/<sessionId>/`, returns exit code 0, and never blocks the prompt.
- **AC-6.5:** Given `/check:patterns` (or new helper) is run, when it queries the last 7 days of events, then it reports `suggested_count`, `invoked_count` (filtered to `invocation_path: "ranker"`), and `adherence_rate = invoked / suggested`.

## S-7 — Skill description audit

- **AC-7.1:** Given `.claude/commands/**`, when the audit script runs, then `runtime/notes/skill-description-audit.md` is produced listing every skill with a quality verdict (`ok` / `flag-tag-missing` / `flag-description-missing` / `flag-description-ambiguous`).
- **AC-7.2:** Given the audit report, when I count critical flags (`flag-description-missing` + `flag-description-ambiguous`), then count is 0 at sprint end (criticals fixed inline).
- **AC-7.3:** Given the audit script, when I re-run it, then results are deterministic (same input ⇒ same output) and re-runnable for drift detection.
