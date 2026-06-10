<!-- requirement-format-legacy -->
# Granular Stories — Lanes C+D — sprint-pipeline truth + research:deep runnability (WARPOS.md sweep 2026-06-10)

**Sprint:** `SP-20260610-003`
**High-level stories:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-003\high-level-stories.md`

> Granular stories use the `S-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`. Each granular story
> should produce roughly one ticket during `/sprint:design`.

## S-1 — TICKET-1: /sprint:full skill org-era rewrite + full.js epsilon-dispatch default via isSprint() + design-transition enforcer (report-only)

**As** the operator
**I want** `.claude/commands/sprint/full.md` rewritten for the org era (Phase 2/3 route through ε's hook-point roster — no instruction for α to author design artifacts or mint tickets itself), `scripts/sprint/full.js` defaulting `epsilonDispatch` to true when `scripts/hooks/lib/mode.js` `isSprint()` is true (planted tests both ways: sprint mode→ON, other modes→unchanged; explicit flag still overrides), and a design-transition enforcer that refuses design→designed when requirement artifacts changed without matching roster completion records (report-only, scoped to newly scaffolded sprints)
**So that** the skill prose matches the engine, the org roster runs by default in sprint mode, and a roster bypass during design is self-detecting instead of operator-observed. β gate satisfied: Lane B WG-6 stall rules landed @d13254d before this flip.

Acceptance criteria:
- AC-1.1 – AC-1.4: see `acceptance-criteria.md` §S-1 (set at design; minted into TICKET-1).

Linked: `H-1`, `R-1`, `R-2`.
COPY: see `copy.md` (none — engine sprint).
INPUTS: see `inputs.md` (`IN-1`).
TRACE: see `trace.md` (`TR-1`).

## S-2 — TICKET-2: design scaffold R-id single-sourcing + trace-integrity check + AL-W-006 status/checkpoint schema align

**As** an auditor
**I want** `scripts/sprint/design.js` + `framework/templates/sprint/requirements/*` deriving the PRD R-section AND the stories/trace R-references from the SAME source (plan contract `requirement_areas`, sized dynamically — a >3-area contract yields a matching-size R-list, not a fixed R-1..R-3 stub), a NEW trace-integrity check failing (not legacy-waiving) on any R-id cited in stories/trace but undefined in the PRD for newly scaffolded sprints, and `status.js`/`checkpoint.js` field schemas aligned with current.yaml (`crash_recovery`, `ralph`, `reports`; checkpoint validates existing instead of returning unvalidated)
**So that** the WG-7 orphan-R-id class (reproduced live TODAY in SP-20260610-002's own scaffold) is impossible by construction AND enforced, and pipeline status stops misreporting schema fields (AL-W-006).

Acceptance criteria:
- AC-2.1 – AC-2.3: see `acceptance-criteria.md` §S-2 (set at design; minted into TICKET-2).

Linked: `H-2`, `R-3`, `R-4`.
COPY: see `copy.md` (none — engine sprint).
INPUTS: see `inputs.md` (`IN-2`).
TRACE: see `trace.md` (`TR-2`).

## S-3 — TICKET-3: scripts/research/deep-run.js + deep.md thin wrapper + Phase 0 quota probe

**As** the operator
**I want** NEW `scripts/research/deep-run.js` — a standalone node runner with INTERNAL async polling (no bash `sleep`) and all fs-writes inside the script — with `.claude/commands/research/deep.md` rewritten as a thin wrapper that launches it (zero `sleep N` / `node -e ... writeFileSync` patterns remain), plus a Phase 0 billable quota probe per provider (cheapest model, ≤5 tokens) classifying `insufficient_quota`/429-credits as an up-front skip with an actionable message (auth-resolver labels only, never key values; spend ≤ cents within the $5 floor)
**So that** /research:deep runs to completion under the harness security model (MC-WG-2) and depleted keys are caught before async submission, not after (MC-WG-3).

Acceptance criteria:
- AC-3.1 – AC-3.3: see `acceptance-criteria.md` §S-3 (set at design; minted into TICKET-3).

Linked: `H-3`, `R-5`, `R-6`.
COPY: see `copy.md` (none — engine sprint).
INPUTS: see `inputs.md` (`IN-3`).
TRACE: see `trace.md` (`TR-3`).
