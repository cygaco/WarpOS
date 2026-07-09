# Angle 3 (BEHAVIORAL) — /discover:systems (2026-07-09)

Method: streamed events.jsonl (53.6k lines) by real `cat`/`type`/`actor`/`ts` fields (NOTE: field is `cat` not `category`), plus sibling logs, `.claude/runtime/`, project-root `runtime/`, memory-store mtimes. Session-gap: dense through 06-28, then 07-04 + current 07-09 session.

Top actors: alex 29.6k, system 15.8k, alpha 5.8k, user 836, boss 680, team-lifecycle-manager 241, skill-invocation-tracker 185, turbo 164, sprint 65.

## ACTIVE (fired within ~2 weeks)
- tool-telemetry-logger | events.jsonl + tools.jsonl (cat:tool) | 07-09 | ~29k very high
- bash-permission-classifier | audit:bash-allowed(7634)+merge(7778) | 07-09 | very high
- cd-prefix-stripper | audit:cd-prefix-stripped | 07-09 | 1810
- memory-guard-hook | audit:memory-guard-blocked | 07-09 | 2542
- merge-guard-hook | audit:merge-guard-blocked(126)/merge-unknown(146) | 07-09 | med
- smart-context-prompt-pipeline | cat:prompt(836) | 07-09 | med (DISABLED 07-09 by operator)
- agent-tool-dispatch-tracker | audit:dispatch-*(gp 271/builder 142/epsilon 31/beta 69)+agent-result-hashed(511) | 07-09 | high
- dispatch-reap-orphans | cat:dispatch-reap(32) | 07-09 | low
- team-guard-hook | team-guard-debug.log (274KB) | 07-09 | high
- skill-adherence-tracker | skill-suggested-vs-invoked(185) | 07-09 | low-med
- session-start/stop-hooks | audit:session-start(291)/session-stop(119) | 07-09 | med
- auth-bypass-audit | type:auth-bypass(228) | 07-09 | med
- response-size-guard | audit:response_size(181) | 07-09 | low-med
- inbox-cross-session-msg | cat:inbox(633) | 07-04 | med
- team-lifecycle-manager | cat:team-lifecycle(292) | 07-04 | med
- handoff-system | runtime/handoffs/2026-07-04-0439.md | 07-04 | rolling
- codex-cross-provider-dispatch | .codex/ + CODEX-LOG.md (untracked, NEW) + actor:codex(16) | 07-09 | new
- spec-logger | cat:spec(890) | 06-28 | med
- decision-logger | cat:decision(81) | 06-28 | low
- manager-consult-log | events/manager-consult.jsonl (607) | 06-28 | med
- epsilon-sprint-runtime | runtime/epsilon-prompts + SP-20260627-001, actor:sprint(65) | 06-28 | med
- sprint-lifecycle-enforcers | audit:sprint-tracker-guard(131)/no-retro-created(118)/routing.evidence(81)/sprint.routing.recorded(81)/conflict_check(25) | 06-28 | high
- beta-gate-enforcer | audit:beta-gate-blocked(66)+dispatch-beta(69) | 06-28 | med
- beta-honesty-waivers-store | beta-honesty-waivers.jsonl (86KB) | 06-27 | rolling
- dispatch-completion-records | dispatch-completions.jsonl(310KB)+deaths | 06-27 | high
- push-advisory-hook | audit:push-advisory(148) | 06-27 | low-med
- pipeline-health-probes | runtime/health/*.txt | 06-27 | low
- gpt-cross-provider-review | runtime/sp-20260627-gpt-review*.json | 06-27 | low
- requirements-logger | events/requirements.jsonl (490KB) | 06-27 | high

## COOLING (06-19→06-24)
- self-modification-tracker | cat:modification(494) | 06-22
- systems-manifest-store | systems.jsonl (80KB) | 06-22
- skill-catalog-weighting | skill-catalog.json (72KB) | 06-22
- enforcement-debt-store | enforcement-debt.jsonl (96KB) | 06-20
- portfolio-registry | cat:portfolio(39) | 06-20
- lifecycle-events | cat:lifecycle(58) | 06-19
- session-checkpoint | .session-checkpoint.json | 06-19
- turbo-session-mode | actor:turbo(164)+audit:turbo-on(35) | 06-18
- mode-state-machine | mode.json | 06-18

## DORMANT (>3 weeks)
- learnings-store | learnings.jsonl (109KB) | 06-17 (22d)
- learn-integrate-events | cat:integration(7) | 06-17
- admin-preview-harness | admin-preview.json | 06-14 (25d)
- recurring-issues-store | recurring-issues.jsonl | 06-11 (28d)
- session-handoff-live | handoff-live-*.md (~25 files) | 06-10
- reasoning-traces-store | traces.jsonl | 06-08 (31d)
- gamma-adhoc-build-artifacts | .gamma-*.txt | 06-01 (5wk)
- beta-consult-events-store | cat:beta(5) | 05-29 (6wk)
- tv/sc-close-logs | runtime/.tv*.log, .sc.log, sealed-gate-full.log | 06-19
- per-run-sprint-scratch | runtime/sp-*/ (bulk 06-19 mtime) | 06-19
- models-research | runtime/models-research/ | 06-19

## Load-bearing behavioral reads
1. Highest-volume live systems are ALL hook-layer (tool/audit telemetry, bash classifier, memory-guard, cd-strip) — fire on nearly every tool call.
2. Sprint/epsilon stack, manager-consult, beta-gate, cross-provider dispatch genuinely active but frozen at the last real sprint (06-27/06-28).
3. **Notable dormancy = the COGNITIVE-MEMORY layer**: learnings(06-17), traces(06-08), β-consult store(05-29) unwritten 3–6wk while their ENFORCEMENT counterparts still fire. "Stores lag enforcers" is the clearest behavioral anomaly — the company kept enforcing but stopped learning.
4. Codex cross-provider dispatch (.codex/, CODEX-LOG.md) is brand-new + untracked.
