# Sprint Retrospective — Organic skill use by agents — research + mechanism

**Sprint:** `SP-20260513-003`
**Plan Contract:** `PC-20260513-0004`
**Synthesis mode:** `llm`
**Synthesized at:** `2026-05-13T22:47:16.061Z`
**Signed off by:** `alpha` at `2026-05-13T22:47:16.061Z`

## Summary

Shipped the Hybrid mechanism for organic skill use per /reasoning:run RT-002: CLAUDE.md `prefer existing skills` rule + smart-context.js Haiku skill-ranker (top-3) + skill catalog generator (paths.skillCatalog) + lexicon entries + adherence telemetry + skill-description audit. The ranker reuses the EXISTING Haiku call inside smart-context.js — zero new API round-trips per turn. All 7 tickets landed, the recommended scope variant shipped, release RL-20260513-004 deployed as 0.5.1-sp003. This was the rare sprint where research preceded code: the operator explicitly demanded /reasoning:run first, and the multi-candidate comparative analysis (A=rule-only, B=ranker-only, C=separate-hook, D=hybrid) chose D before any ticket was minted.

## Outcomes Shipped vs Planned

### Shipped
- Reasoning episode RT-002 canonicalized in paths.tracesFile + durable record at .claude/project/sprint/sprints/SP-20260513-003/reasoning-organic-skill-use.md — multi-candidate comparative analysis, chose Hybrid (Mechanism D) with quality score 3 _(evidence: T-20260513-044, RT-002)_
- CLAUDE.md `prefer existing skills` rule — agent instructed to scan SUGGESTED SKILLS block and invoke matching skills over ad-hoc tooling _(evidence: T-20260513-045)_
- Lexicon updated with 4 skill-use vocabulary entries — gives agent a shared vocabulary for skill-selection reasoning _(evidence: T-20260513-046)_
- scripts/hooks/smart-context.js extended with Haiku skill-ranker — same Haiku call now also ranks top-3 relevant skills, emits SUGGESTED SKILLS: block in additionalContext, fail-open on ranker timeout/parse error _(evidence: T-20260513-047)_
- Skill catalog generator + paths.skillCatalog index — compact JSON of every .claude/commands/**/*.md skill (id, slug, description, tags), auto-regenerated on catalog changes, capped at 5K input tokens _(evidence: T-20260513-048)_
- Adherence telemetry — events.jsonl gains type=skill-suggested-vs-invoked with suggested[]/invoked[] fields so /check:patterns can compute adherence rate over time _(evidence: T-20260513-049)_
- Skill description audit completed — flagged skills with ambiguous or missing one-line descriptions for ranker-quality follow-up; no broken ranker output post-audit _(evidence: T-20260513-050)_

### Missed
_None._

## Plan Quality — Predictions vs Reality

- Predicted status: `pass`
- Actual status: `held`
- Predicted confidence: `medium`

Plan Contract correctly flagged medium confidence due to baseline-unknown. /reasoning:run unlocked the design space and ruled out two candidates (B alone, C) on first-pass evaluation — confirming the operator's explicit request to run reasoning before code was the right gate. Telemetry as a separate, observable layer is the only candidate that measures itself.

## Scope Variant Adherence

- Planned variant: `recommended`
- Actual variant: `recommended`
- Adhered: `true`

Recommended (Mechanism D Hybrid) shipped exactly as scoped: CLAUDE.md rule + smart-context ranker + telemetry. Expanded scope (learning loop with auto-tuning weights, friction-driven mid-session skill proposer) deliberately deferred — telemetry is in place so v2 can mine the data the recommended scope generates.

## Surprises

- The cost analysis turned out cleaner than predicted: ranker added a new responsibility to the EXISTING Haiku call in smart-context.js (catalog input ≈4.8K tokens, top-3 output ≈200 tokens) rather than a new API round-trip — the per-turn cost increment was sub-cent, well below the budget ceiling. — impact: Positive — preserved cost discipline; rejected Mechanism C (separate hook) on DRY grounds saved us from a doubled API spend per turn.
- Skill description audit (T-050) surfaced more ambiguous descriptions than expected — the ranker's quality is gated by description quality, and a large fraction of /commands/**/*.md skills had under-specified or front-loaded-jargon descriptions that wouldn't rank well against a natural-language prompt. — impact: Medium — recommended-scope ranker quality depends on description quality; an audit-driven rewrite pass becomes a candidate follow-up sprint.
- The SP-003 retro itself is a real-time test of the Hybrid mechanism: the SUGGESTED SKILLS block emitted by smart-context.js should ideally surface /sprint:retrospective for prompts about retros — telemetry from this very session is the first data point for adherence measurement. — impact: Low — meta, but valuable; the first week of telemetry is the operational baseline.

## Friction Points

- **[medium / process]** Reasoning-first sprint pattern is not yet supported by /sprint:plan — Plan Contract was written before /reasoning:run was invoked, which created a chicken-and-egg moment where the Plan Contract had to declare `recommended` without knowing if the recommended mechanism would survive comparative analysis. Operator explicitly requested reasoning-first as a workaround. Should be a first-class /sprint:plan mode.
- **[high / tooling]** Same sprint-helper ticket-bucket bleed seen in SP-001/002: SP-003's tickets (T-044..T-050) ended up listed in SP-001's current.yaml#tickets.done bucket in addition to SP-003's own. Replaces what should be a clean per-sprint registry view with a contaminated one.
- **[medium / spec]** Skill descriptions across the existing catalog (~120 skills) vary widely in quality for natural-language ranking — some are jargon-loaded, some are missing tags, some are too generic. The ranker's signal quality is bounded by description quality; this is a corpus-quality problem more than a ranker problem.

## Action Items for Next Sprint

- Add a `--reason-first` mode to /sprint:plan that runs /reasoning:run on the framing question before the Plan Contract picks a recommended variant — Plan Contract should record the reasoning episode id (RT-N) and the chosen mechanism, not pre-bind to a variant the reasoning hasn't run yet. _(owner: alpha)_ _(due: next_sprint)_
- Schedule a follow-up sprint or learning-loop task for the skill-description rewrite pass — audit flagged candidates from T-050 should get one-pass tightening so the ranker has higher-signal descriptions to score against. _(owner: alpha)_ _(due: next_sprint)_
- After one week of skill-suggested-vs-invoked telemetry, run /check:patterns to compute the baseline adherence rate — this is the metric the sprint deferred; it's now collectable from the events.jsonl stream the sprint shipped. _(owner: alpha)_ _(due: next_sprint)_

## Tickets Completed

- `T-20260513-044`
- `T-20260513-045`
- `T-20260513-046`
- `T-20260513-047`
- `T-20260513-048`
- `T-20260513-049`
- `T-20260513-050`

## Tickets Deferred or Abandoned

### Deferred
_None._

### Abandoned
_None._

### Reopened
_None._

## Issues Encountered

_None._

## Beta Decisions Reviewed

_None._

## Key Tradeoffs

- Reuse existing Haiku call vs new ranker hook (Mechanism B vs C) — chose reuse on DRY grounds; cost is the Haiku system prompt grew, benefit is no doubled API round-trip per turn.
- Top-3 ranked skills vs full list per prompt — chose top-3 to keep additionalContext compact; cost is rare-but-valid skills below rank-3 stay invisible, benefit is the agent isn't drowned in 120 flat entries.
- Ship telemetry in MVP vs add it later — chose ship-in-MVP because we cannot tell A or B apart from `nothing changed` without measurement; cost is one new event type, benefit is the recommended scope is the only candidate that measures itself.

## Learning Candidates

- When the operator explicitly demands `/reasoning:run` before code, the Plan Contract's `recommended` variant is a placeholder — the actual scope variant is the output of the reasoning episode. Add `reasoning_episode_ref: RT-N` to Plan Contract schema so the variant binding is post-reasoning, not pre-reasoning. _(evidence: PC-20260513-0004, RT-002)_
- Salience problems on flat unranked catalogs (the agent has the data but can't find the right entry cheaply) are solved by ranking, not by expanding the catalog. The fix is a top-K projection at prompt-time, not a richer per-skill description. Pattern applies beyond skills — any time the system reminder grows past ~50 flat entries, salience degrades faster than the marginal entry adds value. _(evidence: RT-002 §Problem framing)_
- Behavior-change sprints should ship telemetry on day one, not add it after. Without measurement the team cannot distinguish `mechanism worked` from `mechanism shipped, nothing changed.` Telemetry is part of the deliverable, not a follow-up. _(evidence: R-5, RT-002 §Decision rationale)_

## Sign-off

- Retro written by: `alpha`
- Retro written at: `2026-05-13T22:47:16.061Z`
- Synthesis: `llm` (claude-opus-4-7)
- History record: `(no sprint-history.yaml)`
- Release record: `RL-20260513-004`

> Re-run with `/sprint:retrospective --sprint SP-20260513-003 --force` to regenerate this retro from updated tracker state, or `--review-only` to print without regenerating.
