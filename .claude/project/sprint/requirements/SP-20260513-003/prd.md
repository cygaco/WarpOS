# PRD — Organic skill use by agents — research + mechanism

**Sprint:** `SP-20260513-003`
**Plan Contract:** `PC-20260513-0004`
**Status:** draft
**Documentation scale:** `m`

## Outcome

The existing skill library under `.claude/commands` becomes high-leverage by default. When a user's natural-language request matches a skill's purpose, the responsible agent (primarily Alex α; also β/γ/δ where applicable) reaches for the skill organically — without the user typing the slash command. The user's manual-prompting overhead drops and skill ROI rises.

## Inline ADR — Reasoning Episode (canonicalized)

> **Canonical trace:** `RT-002` in `paths.tracesFile` (`.claude/project/memory/traces.jsonl`).
> **Durable record:** `.claude/project/sprint/sprints/SP-20260513-003/reasoning-organic-skill-use.md`.
> **Framework:** Multi-Candidate Comparative Analysis (≥3 candidates vs. shared rubric).
> **Outcome:** Mechanism D (Hybrid — CLAUDE.md rule + smart-context.js ranker + adherence telemetry).
> **Quality score:** 3. The ADR below mirrors the durable record; treat it as a summary, not the authoritative version.

### Problem framing

We have ~120 skills under `.claude/commands/**`. They are all listed in the Claude Code system-reminder skill catalog every turn, but the surface is flat and unranked. Empirical observation (and the original request) shows agents rarely invoke them organically — they either:

1. Ignore the catalog and re-derive procedures inline (silent skill underuse), or
2. Wait for the user to type the slash command (manual-prompting overhead).

The root cause is **salience, not knowledge**. The agent has the skills in its context window, but the cost of reading 100+ flat entries every turn exceeds the marginal benefit of picking one — so it defaults to ad-hoc tooling.

### Classification

- **Problem type:** behavior change + observability (mixed) — partly research (which mechanism), partly system change (CLAUDE.md + smart-context.js), partly measurement (adherence telemetry).
- **Reasoning framework:** **comparative analysis** with ≥3 candidates against a shared rubric. Selection criteria: (a) effect on adherence rate, (b) per-turn cost, (c) reversibility, (d) engineering surface, (e) blast radius if wrong.

### Candidate mechanisms

#### Mechanism A — CLAUDE.md rule only

Add a behavior rule to `CLAUDE.md` of the form *"Before reaching for raw tooling, scan the skill catalog. If a skill's description matches the user's intent ≥0.7, invoke it instead."* Optionally append concrete pointers ("for fixes, prefer `/fix:fast` or `/fix:deep`; for QA, prefer `/qa:check`...").

- **Effect:** low–moderate. Behavior rules shift priors, but with ~120 unranked skills the salience problem persists.
- **Per-turn cost:** zero (rule is already-loaded text).
- **Reversibility:** trivial — delete the section.
- **Engineering surface:** ~30 lines in CLAUDE.md.
- **Blast radius:** very low. Rules can be ignored; the agent never silently breaks.
- **Tradeoff:** cheapest, fastest to ship, but does not solve the unranked-catalog problem. Likely **necessary but not sufficient**.

#### Mechanism B — smart-context.js skill ranker (Haiku ranks top-K)

Extend `scripts/hooks/smart-context.js` (the existing UserPromptSubmit Haiku pipeline) with a new responsibility: given the prompt + a skill catalog index (id, description, tags), rank the **top-3** most relevant skills and inject them into `additionalContext` under a `SUGGESTED SKILLS:` heading.

- **Effect:** moderate–high. Surfaces a small, ranked, prompt-specific set rather than 120 flat entries. Salience problem solved for top-K.
- **Per-turn cost:** modest token bump on the existing Haiku call. Catalog index is small (~120 × ~40 tokens ≈ 4.8K input tokens), output is 3 ids + reasons (≈ 200 tokens). At Haiku pricing this is sub-cent per turn.
- **Reversibility:** moderate — feature-flagged via env var, can be disabled per-prompt or globally.
- **Engineering surface:** moderate — modify `SYSTEM_PROMPT` in smart-context.js to add the skill-ranking task, add catalog loader (generate `paths.skillCatalog` from `.claude/commands/**`), update `assembleContext` to emit a SUGGESTED SKILLS section, add fail-open on ranker timeout.
- **Blast radius:** low–moderate. Bad rankings waste tokens and may mislead the agent, but the agent retains final judgment. Fail-open means a Haiku timeout falls back to current behavior.
- **Tradeoff:** correct shape for the problem (rank N items by relevance to a query), reuses an existing well-tested pipeline, but quality depends on skill descriptions and adds modest per-turn cost.

#### Mechanism C — Separate hook with skill suggestions (pollution-prone)

A dedicated UserPromptSubmit hook (parallel to smart-context.js) that emits a skill-suggestion block. Could use a heuristic (tag matching, keyword scoring) or its own LLM call.

- **Effect:** moderate. Similar shape to B but as a parallel pipeline.
- **Per-turn cost:** if heuristic, near-zero; if LLM-based, similar to B but doubles the API calls (or duplicates Haiku's work).
- **Reversibility:** moderate — disable the hook in settings.
- **Engineering surface:** larger — new hook, new pipeline, new logging, new fail-open semantics.
- **Blast radius:** moderate. Two hooks emitting additionalContext can produce conflicting or redundant signals. Token pollution risk if both fire.
- **Tradeoff:** independent, but duplicates infrastructure smart-context already provides. Violates DRY against an existing well-instrumented hook.

#### Mechanism D — Hybrid (CLAUDE.md rule + smart-context ranker + telemetry) — **RECOMMENDED**

Combine A and B and add adherence telemetry as a separate, observable layer.

- **Effect:** highest. Rule shifts priors *and* salience surfaces top-K *and* telemetry tells us if it's working.
- **Per-turn cost:** same as B (Haiku call already runs; ranker is an addition to its system prompt, not a new call).
- **Reversibility:** good — each layer disables independently (delete CLAUDE.md block; env-flag the ranker off; telemetry is append-only).
- **Engineering surface:** largest of the three but well-contained. CLAUDE.md (≤40 lines), smart-context.js (≤80 lines added), new event type `skill-suggested-vs-invoked` in `events.jsonl`, new generator `paths.skillCatalog` (or runtime walk over `.claude/commands/**`).
- **Blast radius:** low. Each layer fails open.
- **Tradeoff:** biggest sprint but the only candidate that *measures itself*. Without telemetry we can't tell A or B apart from "nothing changed."

### Comparison rubric

| Mechanism | Effect | Per-turn cost | Reversibility | Eng. surface | Blast radius | Measurable? |
|---|---|---|---|---|---|---|
| A — CLAUDE.md rule | Low–Mod | 0 | Trivial | XS | Very low | No |
| B — smart-context ranker | Mod–High | Modest | Moderate | M | Low–Mod | No (without telemetry) |
| C — Separate hook | Mod | Low–Mod | Moderate | M+ | Mod | No |
| D — Hybrid (A+B+telemetry) | High | Modest | Good | M+ | Low | **Yes** |

### Decision (proposal)

**Choose Mechanism D — Hybrid.** Rationale:

- **A alone is necessary but not sufficient** — fixes priors, not salience.
- **B alone is the right shape** but invisible without measurement; we cannot ship behavior change to a 120-skill surface without telemetry.
- **C duplicates infrastructure** smart-context.js already provides; rejected on DRY grounds.
- **D is the smallest superset** that ships measurable behavior change. The marginal engineering over B is one event type and one catalog generator.
- **Cost discipline:** ranker reuses the *same* Haiku call already running on every prompt — no new API round-trip. Adherence telemetry is local-only (events.jsonl).

### Fix quality target

Level 3 (fix that prevents the bug class) — measurable, fail-open, reversible. Telemetry lets `/check:patterns` flag regressions; the ranker can be tuned over time without re-architecting.

### Open questions deferred to design / Beta

- Final cost budget for the ranker (proposed default: 5K input tokens, 300 output tokens; ranker share of the existing Haiku call).
- Whether agent-spawned subagents (Gamma builders, Delta cycles) also receive the ranked skill list, or only top-level Alpha. *(Default: top-level Alpha only; subagents have narrower scope and the ranker is prompt-time.)*
- Whether non-user-invocable / internal skills appear in the catalog. *(Default: exclude — only `.claude/commands/**/*.md` user-invocable skills.)*
- Baseline adherence rate (must be measured before/during the first day of telemetry, not after).

## Context

### Original Request

> Actually getting our agents to use skills (under .claude/commands) organically, without me having to do it all the time! /reasoning:run to best examine what to do.

### Interpreted Intent

Raise the rate at which agents — primarily Alpha, also Beta/Gamma/Delta — invoke existing skills under `.claude/commands` when the user's request matches a skill's purpose, without the user typing the slash command. User explicitly requested `/reasoning:run` as the first step to evaluate mechanism candidates.

### Current Behavior

Skills are user-invocable slash commands listed flat in the system-reminder skill catalog every turn (~120 entries). `smart-context.js` enriches prompts with memory but does not surface relevant skills. CLAUDE.md mentions skills only in passing; no explicit "prefer skills" rule. Agents discover skills only through the unranked catalog, which is high-noise / low-signal at this volume.

### Desired Behavior

When the user's prompt or current task matches a skill's purpose, the relevant skill is surfaced to the agent with high signal — concretely, a `SUGGESTED SKILLS:` block in `additionalContext` listing the top-3 ranked candidates with one-line descriptions and a behavior rule in CLAUDE.md instructing the agent to invoke a suggested skill when it matches the intent. Manual invocation by the user remains a no-op override. The ranker fails open: any Haiku error or timeout falls back to current behavior.

## Requirements

> `R-N` ids — sprint-scope PRD. Format guard at `scripts/hooks/requirement-format-guard.js`.

- `R-1` — **Reasoning episode canonicalized.** The proposal-grade ADR above is formally adjudicated via `/reasoning:run`, the trace is written to `paths.tracesFile`, and the chosen mechanism (Hybrid) is locked in before any code changes.
- `R-2` — **CLAUDE.md "prefer existing skills" rule.** A behavior rule added to `CLAUDE.md` (separate section between `## Operational Loop` and `## Autonomy` or appended to the identity bullets) instructing the agent: when a skill's description matches the user's intent, invoke it instead of ad-hoc tooling. Includes the one-line `SUGGESTED SKILLS:` protocol so the agent recognizes ranker output.
- `R-3` — **smart-context.js Haiku skill-ranker integration.** Extend the existing `SYSTEM_PROMPT` and `callHaiku` flow in `scripts/hooks/smart-context.js` to also rank top-3 relevant skills from the catalog and emit them under `additionalContext` as `SUGGESTED SKILLS:`. No new API round-trip — the ranker is a new responsibility on the same Haiku call.
- `R-4` — **Skill catalog index.** A generator (script or hook) produces `paths.skillCatalog` (a compact JSON of `{id, slug, description, tags, location}` for every `.claude/commands/**/*.md` skill) consumed by the ranker. Auto-regenerated when `.claude/commands/**` changes.
- `R-5` — **Adherence telemetry.** `events.jsonl` gains a new event type `skill-suggested-vs-invoked` with fields `{ts, sessionId, prompt_hash, suggested:[{id,score}], invoked:[{id,turn_offset}]}`. Suggestion logged at ranker time; invocation logged when the agent actually calls the skill (slash or otherwise). Adherence rate = invoked ∩ suggested ÷ suggested.
- `R-6` — **Cost budget.** Ranker output capped to top-3 skills, ≤300 output tokens. Catalog index capped at 5K input tokens (truncate by recency/use-count if catalog grows). Ranker share of the existing Haiku call must not push total `MAX_TOKENS` above 1000.
- `R-7` — **Skill metadata audit.** Verify every `.claude/commands/**/*.md` skill has a one-line description and ≥1 tag suitable for ranking. Flag any skill whose description is ambiguous or missing for a follow-up pass.
- `R-8` — **Fail-open behavior.** Ranker timeout, parse error, or empty result MUST NOT block the prompt. Existing `smart-context.js` fail-open semantics extend to the ranker: bad ranker output falls back to current behavior, logs `HAIKU_FAIL` or `RANKER_EMPTY`, and the user never sees a failure.

## Non-Goals

- Removing user agency. The user can always type `/skill:name` manually; manual invocation is a no-op override.
- Auto-executing skills without confirmation when they touch irreversible operations (push, delete, deploy). The ranker suggests; the agent still respects the autonomy table in CLAUDE.md.
- Replacing `AskUserQuestion` or the β consultation protocol. Skill selection is separate from decision authority.
- Re-architecting the skill system itself. Skills under `.claude/commands` remain user-invocable slash commands; this sprint changes salience, not structure.
- Building a learning loop or auto-tuning ranker weights. That's the `expanded` scope variant; out of MVP.

## Affected Surfaces

| Surface | Evidence Level |
|---|---|
| `CLAUDE.md` | verified_from_repo |
| `.claude/agents/00-alex/.system/lexicon.md` (paths.lexicon) | verified_from_repo |
| `.claude/project/reference/operational-loop.md` | verified_from_repo |
| `scripts/hooks/smart-context.js` | verified_from_repo |
| `.claude/commands/**` (metadata audit only) | verified_from_repo |
| `paths.eventsFile` (new event type) | verified_from_repo |
| `paths.skillCatalog` (new generated artifact) | new |

## External Service Dependencies

See `.claude/project/sprint/external-services/` for ESD records. **Status: none_expected.** Pure framework work; no new credentials, sandboxes, or third-party endpoints. Anthropic API key is already used by smart-context.js.

## Approval Boundaries

See Plan Contract `approval_boundaries`. Summary:

- CLAUDE.md changes affect every session — **Class B** (architecture-ish). Beta-review required pre-merge.
- Smart-context cost increase — measure baseline cost before approving the ranker change.
- Anything that mutates dispatch behavior across all agents.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260513-0004.yaml`
- High-level stories: `.claude/project/sprint/requirements/SP-20260513-003/high-level-stories.md`
- Granular stories: `.claude/project/sprint/requirements/SP-20260513-003/granular-stories.md`
- COPY: `.claude/project/sprint/requirements/SP-20260513-003/copy.md`
- INPUTS: `.claude/project/sprint/requirements/SP-20260513-003/inputs.md`
- TRACE: `.claude/project/sprint/requirements/SP-20260513-003/trace.md`
- Acceptance criteria: `.claude/project/sprint/requirements/SP-20260513-003/acceptance-criteria.md`
- QA plan: `.claude/project/sprint/requirements/SP-20260513-003/qa-plan.md`
- Redteam plan: `.claude/project/sprint/requirements/SP-20260513-003/redteam-plan.md`
- Release plan: `.claude/project/sprint/requirements/SP-20260513-003/release-plan.md`
