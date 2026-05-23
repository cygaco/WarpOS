<!-- requirement-format-legacy -->
# PRD — Beta-honesty enforcement skill — /check:sprint-beta-honesty + AUTONOMY.md enforced (milestone 0.11.0 sprint 2)

**Sprint:** `SP-20260525-004`
**Plan Contract:** `PC-20260523-0038`
**Status:** draft
**Documentation scale:** `s`

## Outcome

Operator can run `/check:sprint-beta-honesty` and trust the output: green means Beta cadence in AUTONOMY.md matches reality across recent sprints; red means specific sprints have placeholder consults or missing escalations. Available for CI integration as a gate on future sprint workflow changes. The enforcement-debt entry closes; milestone 0.11.0 ships. The 'aspirational' disclaimer comes off AUTONOMY.md permanently.

## Context

### Original Request

> Beta-honesty enforcement skill — sprint 2 of milestone 0.11.0 Sprint Workflow Honesty. After SP-20260525-003 (orchestrator-Beta bridge) ships real Beta round-trips, this sprint adds a check skill that proves it stays honest. /check:sprint-beta-honesty scans paths.sprintFullReports/* + events.jsonl for placeholder vs real Beta consult events. Promotes _docs/sprint/AUTONOMY.md from aspirational → enforced. Closes the enforcement-debt entry for 'Beta consultation cadence'. Pure canonical-internal — touches .claude/commands/check/sprint-beta-honesty.md, scripts/checks/, events schema, AUTONOMY.md, enforcement-debt registry only. No cross-project work. Autonomy: aggressive. Mode: adhoc.

### Interpreted Intent

Sprint 1 of 0.11.0 (SP-20260525-003) makes Beta consults real. Sprint 2 makes the enforcement DURABLE by adding a check skill that any operator or CI run can invoke to confirm Beta consultation cadence is being honored. Per CLAUDE.md § Policy & Enforcement Hygiene: 'Every policy needs a named enforcer' — this sprint creates that named enforcer for the Beta consultation cadence policy declared in _docs/sprint/AUTONOMY.md. The skill scans recent sprint full-reports + events.jsonl for: (a) presence of sprint_full_beta_consult events at expected Phase boundaries, (b) non-placeholder verdicts (DECIDE | DIRECTIVE | ESCALATE with real beta_message + latency_ms), (c) ESCALATE handling (sprint halted with halt_reason=beta_escalate when ESCALATE returned). Skill exits 1 on findings; exits 0 on clean state. Closes the corresponding enforcement-debt entry.

### Current Behavior

No skill currently audits Beta consultation honesty. Per CLAUDE.md § Policy & Enforcement Hygiene + roadmap milestone 0.11.0 entry: 'Beta consultation cadence in _docs/sprint/AUTONOMY.md is aspirational until [SP-20260525-003 ships]'. The enforcement-debt entry exists (per /enforcement:log discipline) and is open. AUTONOMY.md currently carries the 'aspirational' disclaimer.

### Desired Behavior

After sprint completion: (1) `/check:sprint-beta-honesty` skill exists and is invocable; (2) Skill scans last N sprints (configurable, default 5) and per-phase verifies real Beta consult events present; (3) Skill outputs structured findings table (sprint × phase × verdict × evidence); (4) Skill exits 0 on clean state, 1 on any finding; (5) `_docs/sprint/AUTONOMY.md` removes 'aspirational' disclaimer from Beta cadence section; (6) Enforcement-debt entry for Beta consultation cadence is closed via /enforcement:resolve (or sibling); (7) Tests cover all finding classes (placeholder verdict, missing event, ESCALATE-without-halt); (8) Local commit on sprint branch captures all changes. Push remains operator-scoped.

## Requirements

> Use existing requirement ID conventions enforced by
> `scripts/hooks/requirement-format-guard.js`. PRDs in `_requirements/`
> use `R-N` ids — sprint-scope PRDs that link to a feature in
> `_requirements/04-features/<feature>/PRD.md` should reuse those ids,
> not invent new ones.

- `R-1` — policy-enforcement
- `R-2` — check-skills
- `R-3` — events-consumption

## Non-Goals

- Implementing the Beta-bridge mechanism itself — that's SP-20260525-003

## Affected Surfaces

| Surface | Evidence Level |
|---|---|
| .claude/commands/check/sprint-beta-honesty.md | unknown |

## External Service Dependencies

See `.claude/project/sprint/external-services/` for ESD records.

## Approval Boundaries

See Plan Contract `approval_boundaries`.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260523-0038.yaml`
- High-level stories: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-004\high-level-stories.md`
- Granular stories: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-004\granular-stories.md`
- COPY: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-004\copy.md`
- INPUTS: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-004\inputs.md`
- TRACE: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-004\trace.md`
- Acceptance criteria: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-004\acceptance-criteria.md`
- QA plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-004\qa-plan.md`
- Redteam plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-004\redteam-plan.md`
- Release plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-004\release-plan.md`
