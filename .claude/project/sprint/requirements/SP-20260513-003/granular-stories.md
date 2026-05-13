# Granular Stories — Organic skill use by agents — research + mechanism

**Sprint:** `SP-20260513-003`
**High-level stories:** `.claude/project/sprint/requirements/SP-20260513-003/high-level-stories.md`

> Granular stories use the `S-N` id convention enforced by `scripts/hooks/requirement-format-guard.js`. Each granular story should produce roughly one ticket during `/sprint:design`.

## S-1 — Reasoning episode canonicalized

**As** the user (or main-session Alpha)
**I want** the multi-candidate ADR for the mechanism choice adjudicated and written as a durable trace
**So that** the chosen mechanism (Hybrid, RT-002) has an official, canonical reasoning record that downstream tickets and the PRD reference

**Status:** Done at design time. Trace ID `RT-002` written to `paths.tracesFile`; durable record at `.claude/project/sprint/sprints/SP-20260513-003/reasoning-organic-skill-use.md`; PRD ADR section updated to reference the trace.

Acceptance criteria:
- AC-1: Comparative-analysis ADR exists with ≥3 candidates and a scored decision matrix (durable record: `reasoning-organic-skill-use.md`)
- AC-2: Trace appended to `paths.tracesFile` with `id: RT-002`, `framework_selected: "Multi-Candidate Comparative Analysis"`, `outcome` naming Mechanism D, and `quality_score: 3`
- AC-3: `prd.md` references `RT-002` in its inline ADR header; proposal-flag callout removed

Linked: `H-1`, `R-1`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-2 — CLAUDE.md "prefer existing skills" rule added

**As** Alex α
**I want** an explicit behavior rule in `CLAUDE.md` that says "when a skill's description matches the user's intent, invoke it instead of ad-hoc tooling — especially when `SUGGESTED SKILLS:` appears in your context"
**So that** my priors shift toward skill-first behavior even on prompts where the ranker doesn't fire (e.g. mid-conversation continuations) or returns an empty result

Acceptance criteria:
- AC-1: New rule appended to `CLAUDE.md` in a `## Skill Use` section (or extended identity bullets), under 40 lines
- AC-2: Rule references the `SUGGESTED SKILLS:` context block format
- AC-3: Rule preserves user agency — explicit non-goal callouts that manual `/skill` invocation always overrides and irreversible skills still respect autonomy table

Linked: `H-1`, `H-2`, `R-2`.
COPY: see `copy.md` C-1, C-2.
INPUTS: see `inputs.md`.
TRACE: see `trace.md` TR-1.

## S-3 — Lexicon updated with skill-use vocabulary

**As** any agent reading `paths.lexicon`
**I want** new entries that name the concepts introduced by this sprint
**So that** future sprints and docs share precise vocabulary — "organic skill use", "skill ranker", "suggested skill", "adherence rate"

Acceptance criteria:
- AC-1: Lexicon entries added for `Organic skill use`, `Skill ranker`, `Suggested skill`, `Adherence rate`
- AC-2: Each entry follows the existing lexicon format (one paragraph, contrast with sibling concept)
- AC-3: New entries cross-reference `CLAUDE.md#skill-use` and `paths.skillCatalog`

Linked: `H-1`, `R-2`.
COPY: see `copy.md` C-2.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-4 — smart-context.js extended with skill ranker

**As** Alex α receiving every prompt
**I want** the existing smart-context Haiku call to also rank the top-3 relevant skills and inject them as `SUGGESTED SKILLS:` in `additionalContext`
**So that** when a skill matches my prompt, the salience is high (top-3 ranked, not 120 flat) and I reach for it organically

Acceptance criteria:
- AC-1: `SYSTEM_PROMPT` in `scripts/hooks/smart-context.js` extended with a fourth task: "rank the top-3 relevant skills against the prompt"
- AC-2: Output JSON schema gains a `skills` array of `{id, slug, score, why}` (max 3 entries)
- AC-3: `assembleContext` emits a `SUGGESTED SKILLS:` block when the array is non-empty
- AC-4: Ranker timeout, parse error, or empty result triggers the existing fail-open path — no new failure mode
- AC-5: Total `MAX_TOKENS` for the Haiku call stays ≤1000 (current 600 + ≤300 for ranker + ≤100 buffer)

Linked: `H-1`, `H-2`, `R-3`, `R-6`, `R-8`.
COPY: see `copy.md` C-3.
INPUTS: see `inputs.md` IN-1, IN-2, IN-3.
TRACE: see `trace.md` TR-1.

## S-5 — Skill catalog generator + index

**As** the skill ranker in smart-context.js
**I want** a compact JSON catalog at `paths.skillCatalog` listing every skill's `{id, slug, description, tags, location}`
**So that** I can rank skills against the prompt without re-walking `.claude/commands/**` every turn

Acceptance criteria:
- AC-1: Generator script (e.g. `scripts/generate-skill-catalog.js`) walks `.claude/commands/**/*.md`, parses frontmatter or first H1/description line, writes `paths.skillCatalog`
- AC-2: `paths.skillCatalog` key registered in `.claude/paths.json` and resolves to a real file path
- AC-3: Catalog auto-regenerates when `.claude/commands/**` changes (PreToolUse / PostToolUse hook on Write/Edit to that path) — or runs as part of `/warp:health` / install pipeline
- AC-4: Catalog payload ≤5K tokens at current ~120-skill volume; documented truncation policy (recency / use-count) if it grows

Linked: `H-1`, `R-4`, `R-6`.
COPY: see `copy.md`.
INPUTS: see `inputs.md` IN-4.
TRACE: see `trace.md`.

## S-6 — Adherence telemetry plumbing

**As** the operator running `/check:patterns`
**I want** `events.jsonl` to log both `skill-suggested` (at ranker time) and `skill-invoked` (when the agent calls a skill) so that adherence = invoked ∩ suggested ÷ suggested
**So that** I can measure whether the sprint actually changed behavior — without telemetry the change is invisible and unrollback-able

Acceptance criteria:
- AC-1: New `events.jsonl` event type `skill-suggested-vs-invoked` with schema documented in `copy.md` C-4
- AC-2: Smart-context.js emits a `skill-suggested` event (or sub-event) every time it injects `SUGGESTED SKILLS:`
- AC-3: A PreToolUse hook on SlashCommand or a wrapper around `.claude/commands/**` invocation emits `skill-invoked`
- AC-4: `/check:patterns` (or new helper) computes 7-day rolling adherence rate
- AC-5: Telemetry corruption (malformed event) does not crash the hook — fail-open writes to `paths.logs/<sessionId>/telemetry-fail.log`

Linked: `H-3`, `R-5`, `R-8`.
COPY: see `copy.md` C-4.
INPUTS: see `inputs.md` IN-5.
TRACE: see `trace.md` TR-2, TR-3.

## S-7 — Skill description audit

**As** the skill ranker
**I want** every skill in `.claude/commands/**` to have a clear, one-line description and ≥1 tag — because ranker quality is bounded by metadata quality
**So that** rankings are accurate and we don't ship a sprint that fails because half the catalog has ambiguous descriptions

Acceptance criteria:
- AC-1: Audit pass over `.claude/commands/**` flags any skill with: no description, description ≥2 sentences without a leading one-liner, no tags, or description that doesn't match the actual skill behavior
- AC-2: Flagged skills written to a remediation list at `runtime/notes/skill-description-audit.md`
- AC-3: Critical-flagged skills (description missing or wildly wrong) fixed inline as part of this sprint; tag-missing flagged but deferred if low-leverage
- AC-4: Audit re-runnable via a script for future drift detection

Linked: `H-1`, `R-7`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.
