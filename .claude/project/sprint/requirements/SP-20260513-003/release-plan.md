# Release Plan — Organic skill use by agents — research + mechanism

**Sprint:** `SP-20260513-003`
**PRD:** `.claude/project/sprint/requirements/SP-20260513-003/prd.md`

> Honored by `/sprint:release`. Lists the conditions under which the sprint may ship and the post-ship monitoring that confirms it actually changed behavior.

## Pre-ship baseline measurement (REQUIRED)

This sprint changes behavior across every prompt; we ship only if the baseline is measured first.

- [ ] **Baseline adherence rate captured.** Before turning the ranker on, deploy ONLY the telemetry plumbing (S-6) and run for 24–48 hours. This captures `skill-invoked` events for "ad-hoc" skill use (manual slash commands + any agent-initiated skill calls under the unranked catalog). Baseline rate is the denominator everything else measures against.
- [ ] **Baseline Haiku cost captured.** Sample 100 prompts pre-ranker, compute mean Haiku tokens-in / tokens-out. This is the cost denominator for the post-ship cost-delta check.
- [ ] **Baseline skill-invocation count captured.** Total `/skill:` calls per day in the pre-ranker week. The expected delta is "more, organically".

## Required to ship

- [ ] All `done` tickets meet their AC.
- [ ] All blocking issues resolved, deferred, or explicitly accepted.
- [ ] PRD requirements `R-1` through `R-8` satisfied.
- [ ] COPY satisfied per `copy.md` (CLAUDE.md exact text, lexicon entries, `SUGGESTED SKILLS:` format, telemetry schema, fail-open log lines).
- [ ] INPUTS satisfied per `inputs.md` (defaults, validation, failure modes).
- [ ] TRACE entries fire as documented in `trace.md` (TR-1, TR-2, TR-3, TR-4).
- [ ] Acceptance criteria satisfied per `acceptance-criteria.md`.
- [ ] QA plan passing per `qa-plan.md` (smoke checks + per-story + 7-persona).
- [ ] Redteam plan passing per `redteam-plan.md` (per-sprint additions verified, no stop-the-bus signals).
- [ ] External service dependencies: none expected, confirmed.
- [ ] Required env vars present (`ANTHROPIC_API_KEY`); values never logged.
- [ ] Release approval recorded in `approvals/`.
- [ ] **Reasoning trace canonicalized** — `paths.tracesFile` contains the formal `/reasoning:run` entry per S-1.
- [ ] **Baseline measurements captured** (above).
- [ ] **Cost projection signed off** — projected Haiku tokens-per-turn delta < 2x baseline.

## Release artifacts

- [ ] Changelog / release notes drafted — call out CLAUDE.md change, new env vars (`RANKER_*`, `CATALOG_MAX_INPUT_TOKENS`, `SKILL_TELEMETRY_ENABLED`), new paths key (`paths.skillCatalog`), new event type.
- [ ] Docs updated — `_docs/` reference for skill ranker (if applicable), `paths.json` documentation, AGENTS.md if behavior contract for subagents changes.
- [ ] Analytics/events updated — new event type `skill-suggested-vs-invoked` documented for downstream consumers.
- [ ] Migration plan — `none_required` (additive change; ranker fails open so old behavior is the no-op default).
- [ ] Rollback plan — *see below*.

## Rollback plan

Two-level rollback path:

**Level 1 — kill ranker without reverting code.** Set `RANKER_TOP_K=0` (or new flag `SKILL_RANKER_ENABLED=0`) — smart-context.js falls back to current behavior. Catalog generator can keep running; telemetry can keep firing. Recovery in < 1 minute.

**Level 2 — kill telemetry and revert CLAUDE.md.** Set `SKILL_TELEMETRY_ENABLED=0` and `git revert` the CLAUDE.md commit. Lexicon entries can remain (additive, no harm).

**Rollback triggers:**
- Haiku cost > 2x baseline for >24h → Level 1
- Hook error rate > 1% of prompts → Level 1
- Adherence rate drops below baseline (suggestion makes things *worse*) → Level 1 + post-mortem
- User reports degraded prompt-pipeline behavior (slow, weird suggestions) → Level 1 immediately, root-cause before re-enabling
- Stop-the-bus redteam signal surfaces post-ship → Level 1 + Level 2 simultaneously

## Monitoring after release

- [ ] **24-hour cost check.** Compute mean Haiku tokens-per-turn for first 24h post-ship; compare to baseline. If > 2x, rollback Level 1.
- [ ] **48-hour adherence first-light.** Compute `adherence_rate = invoked / suggested` (filtered to `invocation_path: "ranker"`) over first 48h. Expected: > 0.2 (one in five suggestions taken). If 0 or < 0.05, investigate: ranker quality, CLAUDE.md visibility, or threshold tuning.
- [ ] **7-day adherence trend.** Daily adherence rate plotted over 7 days. Stable or rising = healthy. Declining = drift; investigate CLAUDE.md or ranker output quality.
- [ ] **30-day skill-invocation absolute count.** Total agent-initiated skill calls (excluding user-typed slashes) over 30 days. Expected: > 2x pre-ship baseline.
- [ ] **Hook error rate.** `paths.logs/<sessionId>/smart-context.log` `HAIKU_FAIL` + `RANKER_*` rate. Expected: < 1% of prompts. If > 5%, investigate.
- [ ] **Skill description audit drift.** Re-run S-7 audit weekly for first 4 weeks; any new criticals → flag for next sprint.

## Approval

Production deploy (i.e. merging this sprint to `main` and pushing to remote) requires explicit user approval per `CLAUDE.md#Autonomy` (CLAUDE.md changes affect every session — Class B). Record the approval id in `releases/<id>.yaml#approval_ref`.

Beta-review required pre-merge per Plan Contract `beta_review.required: true`.

## Documentation scaling

Required for `documentation_scale: m | l | xl`. The baseline-measurement section is the load-bearing addition for this sprint at `m` — it's the only way to verify the behavior actually changed.
