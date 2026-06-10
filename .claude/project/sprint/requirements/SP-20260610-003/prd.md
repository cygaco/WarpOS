<!-- requirement-format-legacy -->
# PRD — Lanes C+D — sprint-pipeline truth + research:deep runnability (WARPOS.md sweep 2026-06-10)

**Sprint:** `SP-20260610-003`
**Plan Contract:** `PC-20260610-0068`
**Status:** draft
**Documentation scale:** `m`

## Outcome

Sprint mode stops silently bypassing the company org; scaffolded sprints are born with consistent traceability; /research:deep works instead of dying on blocked primitives; depleted API keys are caught up front instead of after async submission.

## Context

### Original Request

> Lane C (sprint-pipeline truth): (1) WG-3: rewrite the /sprint:full skill body (.claude/commands/sprint/full.md) for the org era — Phase 2/3 route through ε's hook-point roster instead of instructing α to author design artifacts + mint tickets itself; flip --epsilon-dispatch to default ON when the live mode is sprint (use scripts/hooks/lib/mode.js isSprint() — the S-LC-01 mode-lifecycle registry mechanism — NOT a new literal); add a design-transition enforcer: refuse the design→designed transition when requirement artifacts changed without matching roster completion records on the ledger. (2) WG-7: derive the PRD R-section and stories/trace R-references from the SAME source (plan contract requirement_areas), sized dynamically, in the design scaffold; add a trace-integrity check — every R-id cited in stories/trace MUST be defined in the PRD (fail, not legacy-waive). (3) AL-W-006: align status.js/checkpoint.js field schemas with the current.yaml schema (crash_recovery, ralph, reports fields). Lane D (research:deep runnability): (4) MC-WG-2: ship scripts/research/deep-run.js — standalone node runner with INTERNAL async polling (no bash sleep), all fs-writes inside the script; rewrite .claude/commands/research/deep.md as a thin wrapper that launches it; (5) MC-WG-3: Phase 0 adds a tiny billable test call per provider (cheap model, <=5 tokens) classifying insufficient_quota/429-credits as an up-front skip with an actionable message.

### Interpreted Intent

Close the aspirational-vs-enforced gap in the sprint pipeline (the org roster is policy without an enforcer on the default path) and make the deep-research skill actually runnable under the harness security model.

### Current Behavior

`.claude/commands/sprint/full.md` never mentions ε (`grep -c epsilon` → 0, verified 2026-06-10) and instructs α to author design artifacts + mint tickets itself; `scripts/sprint/full.js:178-179` makes epsilon dispatch opt-in via env with `epsilonDispatch: false` default even in sprint mode. The design scaffold mints a fixed PRD R-list while stories/trace cite R-refs beyond it — reproduced live TODAY: the SP-20260610-002 scaffold needed a sub-agent to repair orphan R-ids. `status.js:55-100` field schema misses `crash_recovery`/`ralph`/`reports` vs the current.yaml schema; `checkpoint.js:83` returns an existing checkpoint without validation. `.claude/commands/research/deep.md` carries foreground `sleep 15/90/60` (lines 255/339/452) and `node -e` `writeFileSync` blocks (lines 212-468) that the auto-mode classifier blocks — structurally unrunnable; no `scripts/research/deep-run.js` exists. Phase 0 checks model ACCESS (/v1/models) but not CREDIT, so a depleted key fails only after async submission. All file:line evidence: `runtime/notes/warpos-md-sweep-2026-06-10.md`.

### Desired Behavior

sprint-mode /sprint:full defaults to ε-dispatch (registry-derived mode detection via `isSprint()`); the skill prose matches the engine; design transition requires roster records; scaffolded R-ids are consistent by construction + enforced; status/checkpoint read the real schema; research:deep runs as a standalone node runner with an up-front quota probe.

## Requirements

> Use existing requirement ID conventions enforced by
> `scripts/hooks/requirement-format-guard.js`. PRDs in `_requirements/`
> use `R-N` ids — sprint-scope PRDs that link to a feature in
> `_requirements/04-features/<feature>/PRD.md` should reuse those ids,
> not invent new ones.

- `R-1` — **sprint:full org-era skill + epsilon-dispatch default (WG-3).** `.claude/commands/sprint/full.md` rewritten for the org era: Phase 2/3 route through ε's hook-point roster instead of instructing α to author design artifacts + mint tickets itself. `scripts/sprint/full.js` flips `--epsilon-dispatch` to default ON when the live mode is sprint — detected via `scripts/hooks/lib/mode.js` `isSprint()` (the S-LC-01 mode-lifecycle registry mechanism, NOT a new literal). Non-sprint modes (solo/adhoc/oneshot) keep the existing default; explicit flags still override both ways. Planted tests prove both directions.
- `R-2` — **Design-transition roster-record enforcer (WG-3 enforcer).** The design→designed transition is REFUSED when requirement artifacts changed without matching roster completion records on the ledger — wired report-only first, scoped to newly scaffolded sprints (no false positives on legacy sprints). Wiring point (inside full.js's design phase vs a standalone check following the `dispatch-contract.js validate` idiom) is resolved at design.
- `R-3` — **R-id single-source scaffold + trace-integrity check (WG-7).** `scripts/sprint/design.js` + `framework/templates/sprint/requirements/*` derive the PRD R-section AND the stories/trace R-references from the SAME source (plan contract `requirement_areas`), sized dynamically — no fixed R-1..R-3 stub. NEW trace-integrity check: every R-id cited in stories/trace MUST be defined in the PRD — FAIL, not legacy-waive, for newly scaffolded sprints (folded into scan:requirements or req-format-guard per existing idiom).
- `R-4` — **status/checkpoint schema align (AL-W-006).** `scripts/sprint/status.js` + `checkpoint.js` field schemas aligned with the current.yaml schema (`crash_recovery`, `ralph`, `reports` fields); `checkpoint.js` validates an existing checkpoint instead of returning it unvalidated.
- `R-5` — **deep-run.js standalone runner + thin skill (MC-WG-2).** NEW `scripts/research/deep-run.js` — standalone node runner with INTERNAL async polling (no bash `sleep`), all fs-writes inside the script. `.claude/commands/research/deep.md` rewritten as a thin wrapper that launches it — zero `sleep N` and zero `node -e ... writeFileSync` patterns remain.
- `R-6` — **Phase 0 billable quota probe (MC-WG-3).** Phase 0 adds a tiny billable test call per provider (cheapest model, ≤5 tokens) classifying `insufficient_quota`/429-credits as an UP-FRONT skip with an actionable message naming the provider via auth-resolver label only — never key values. Probe spend stays in cents, within the $5 floor.

## Non-Goals

- Touching Lane A surfaces (release.js, generate-framework-manifest.js, warpos-install-baseline.js).
- Flipping any E-LIFECYCLE report-only gate to blocking.
- Re-running existing closed sprints' traceability (no retrofit trace repair).
- Pushing to remote (α merges; push per-action).

## Affected Surfaces

| Surface | Evidence Level |
|---|---|
| .claude/commands/sprint/full.md (org-era rewrite; grep -c epsilon → 0 verified 2026-06-10) | verified_from_repo |
| scripts/sprint/full.js (epsilon-dispatch default when isSprint(); design-transition enforcer seam; full.js:178-179 epsilon opt-in env, epsilonDispatch:false) | verified_from_repo |
| scripts/sprint/design.js + framework/templates/sprint/requirements/* (R-id single-sourcing; live reproduction TODAY in SP-20260610-002) | verified_from_repo |
| scripts/sprint/status.js + checkpoint.js (schema align; status.js:55-100, checkpoint.js:83) | verified_from_repo |
| NEW scripts/research/deep-run.js + .claude/commands/research/deep.md thin wrapper (deep.md lines 255/339/452 sleep + 212-468 node -e writeFileSync) | verified_from_repo |
| NEW trace-integrity check (R-id cited ⊆ R-id defined) wired report-only | inferred_from_repo |

## External Service Dependencies

See `.claude/project/sprint/external-services/` for ESD records.

## Approval Boundaries

See Plan Contract `approval_boundaries`.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260610-0068.yaml`
- High-level stories: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-003\high-level-stories.md`
- Granular stories: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-003\granular-stories.md`
- COPY: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-003\copy.md`
- INPUTS: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-003\inputs.md`
- TRACE: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-003\trace.md`
- Acceptance criteria: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-003\acceptance-criteria.md`
- QA plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-003\qa-plan.md`
- Redteam plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-003\redteam-plan.md`
- Release plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-003\release-plan.md`
