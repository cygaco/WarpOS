# QA Plan — Organic skill use by agents — research + mechanism

**Sprint:** `SP-20260513-003`
**PRD:** `.claude/project/sprint/requirements/SP-20260513-003/prd.md`

> Honored by `/sprint:execute` (mid-sprint checks) and `/sprint:release` (final QA gate). Diff-model review on QA is declared in `paths.sprintRouting` (`qa.diff_review: true`). 7-persona failure-mode model applied below.

## Smoke checks

- [ ] `paths.skillCatalog` is registered in `.claude/paths.json` and resolves to a file
- [ ] `scripts/generate-skill-catalog.js` runs cleanly and produces valid JSON
- [ ] `scripts/hooks/smart-context.js` runs without error on a synthetic UserPromptSubmit payload
- [ ] `CLAUDE.md` contains a `## Skill Use` section
- [ ] `paths.lexicon` contains the four new terms
- [ ] A test prompt matching a skill produces a `SUGGESTED SKILLS:` block in `additionalContext`
- [ ] One round-trip from suggestion to invocation produces both event types in `paths.eventsFile`

## Per-story QA

### S-1 — Reasoning episode canonicalized
- [ ] AC-1.1: trace appears in `paths.tracesFile` after `/reasoning:run`
- [ ] AC-1.2: trace has correct `framework_selected`, `outcome`, `quality_score`
- [ ] AC-1.3: `prd.md` updated to reference trace ID
- [ ] Regression: existing traces unchanged; no overwrite

### S-2 — CLAUDE.md rule
- [ ] AC-2.1, AC-2.2, AC-2.3 verified
- [ ] AC-2.4: post-deploy session shows organic invocation (manual smoke test by user)
- [ ] Regression: existing CLAUDE.md sections (Identity, Reasoning, Operational Loop, Autonomy, Paths, Memory, Refactor & Rename Hygiene, Project Context) intact

### S-3 — Lexicon update
- [ ] AC-3.1, AC-3.2 verified
- [ ] Regression: existing lexicon entries unchanged

### S-4 — Skill ranker
- [ ] AC-4.1: positive match produces `SUGGESTED SKILLS:` block
- [ ] AC-4.2: no-match prompt suppresses block
- [ ] AC-4.3: forced Haiku failure → fail-open log + clean exit
- [ ] AC-4.4: token budget enforced
- [ ] AC-4.5: block format matches `copy.md` C-3
- [ ] Regression: existing smart-context behavior (memory injection, mode directives, Gemini auth warning, dedup) all still fire correctly when ranker is added — full regression suite over hook fixtures

### S-5 — Skill catalog generator
- [ ] AC-5.1 through AC-5.5 verified
- [ ] Regression: existing `paths.json` entries unchanged; path-lint still passes

### S-6 — Adherence telemetry
- [ ] AC-6.1 through AC-6.5 verified
- [ ] Regression: existing event types in `paths.eventsFile` unchanged; no schema overlap with `skill-suggested-vs-invoked`

### S-7 — Skill description audit
- [ ] AC-7.1, AC-7.2, AC-7.3 verified
- [ ] Regression: audit script doesn't mutate skills, only reads

## 7-Persona failure-mode QA (mandatory at `documentation_scale: m`)

### 1. Happy-path persona
- [ ] User prompts match a skill → ranker fires → agent invokes → telemetry logs both phases

### 2. Edge-case persona
- [ ] Empty prompt, whitespace-only prompt, prompt with embedded slash → SKIP behavior preserved
- [ ] Catalog of 0 skills (e.g. on fresh install) → ranker suppressed, no errors
- [ ] Catalog of 500 skills (synthetic stress) → truncation to 5K tokens, `CATALOG_TRUNCATED` logged
- [ ] Prompt with a typo / fuzzy match (e.g. "fix it fst") → ranker still surfaces relevant skill
- [ ] Multi-skill prompt (e.g. "fix this and run QA") → top-3 includes both `/fix:fast` and `/qa:check`

### 3. Failure persona
- [ ] Haiku API down → existing fail-open behavior preserved, no new failure mode introduced
- [ ] Catalog file deleted mid-session → `CATALOG_MISSING` logged, ranker disabled this turn, fail-open
- [ ] Malformed Haiku response (skills array present but entries malformed) → `RANKER_PARSE_FAIL` logged, fail-open
- [ ] `events.jsonl` read-only / disk full → `telemetry-fail.log` written, prompt continues

### 4. Concurrency persona
- [ ] Two parallel Alpha sessions both hit smart-context.js → no shared-state races; per-session dedup hashes are session-scoped
- [ ] Catalog regen runs while a prompt is mid-flight → ranker reads either old or new catalog atomically (write-then-rename pattern)

### 5. Partial-write persona (ranker timeout)
- [ ] Ranker mid-Haiku-call timeout → no half-written `SUGGESTED SKILLS:` block; either full block or no block, never partial
- [ ] Catalog regen interrupted (e.g. process killed) → atomic write (temp-then-rename) prevents readers from seeing partial JSON

### 6. Recovery persona (telemetry corruption)
- [ ] `events.jsonl` truncated mid-line → next write succeeds without breaking subsequent reads; `/check:patterns` skips malformed entries
- [ ] Telemetry-write fail recovery: when disk recovers, new events resume; no infinite-retry loop
- [ ] Trace ID referenced in PRD becomes orphaned (trace file deleted) → audit flags broken reference; doesn't block sprint

### 7. Adversarial persona (see also `redteam-plan.md`)
- [ ] Skill description embedded prompt-injection ("ignore previous instructions") → ranker (Haiku) does not propagate the injection into agent context; described in detail in redteam plan

## Cross-cutting QA

- [ ] Lint passes (path-lint, requirement-format-guard, all `lint-*` scripts)
- [ ] Typecheck passes (if any TS files touched)
- [ ] Unit tests pass for `smart-context.js` (existing tests must continue to pass with ranker addition)
- [ ] Integration tests — synthetic UserPromptSubmit fixture exercising the ranker path
- [ ] No new console errors / hook errors in `paths.logs/<sessionId>/`
- [ ] TRACE events fire as documented (TR-1 through TR-4)
- [ ] COPY matches `copy.md` exactly (CLAUDE.md text, lexicon text, block format, event schema, fail-open log lines)
- [ ] INPUTS handle validation per `inputs.md` (out-of-range values reset to defaults)

## External service QA

- [ ] All ESDs in `external-services/` are `none_expected` per Plan Contract — confirmed
- [ ] No `secret: true` env-var values appear in any tracked file (ANTHROPIC_API_KEY already handled by existing `.env.local` flow)
- [ ] Anthropic API behavior unchanged — ranker is added as a task to existing Haiku call, not a new endpoint

## Documentation scaling

This plan is the `documentation_scale: m` cut. Per-persona QA is mandatory at `m`. Cross-cutting checks above are the baseline. The redteam plan is mandatory (separate file).
