<!-- requirement-format-legacy -->
# PRD — Spinup orchestrator — wire bootstrap:spinup pipeline end-to-end (0.15.0 sprint 3 of 3)

**Sprint:** `SP-20260525-023`
**Plan Contract:** `PC-20260525-0056`
**Status:** draft
**Documentation scale:** `m`

## Outcome

The 0.15.0 milestone's payoff: a fresh product goes from 'just WarpOS installed' to 'core loop on screen' with ONE command. This is JTBD-3 ('just WarpOS' -> canonical docs + roadmap + something running) fully realized. Sprints A (suite reconciliation) and B (canon engine) built the parts; C composes them into the on-ramp.

## Context

### Original Request

> Wire bootstrap:spinup's full orchestration pipeline (0.15.0 sprint 3 of 3, the on-ramp finisher). The phases already exist as documented hooks in .claude/commands/bootstrap/spinup.md; this sprint makes them execute end-to-end: (1) /check:install pre-flight gate refuses a gappy install; (2) intent phase — guided brief (default) or --clone a competitor via scripts/portfolio/clone.js; (3) canon phase already wired in T6 to scripts/canon/generate.js (B's engine — reuse, don't rebuild); (4) roadmap phase invokes roadmap:create grounded in the canonical docs, MVP-core-loop first; (5) on-screen phase executes the first sprint until the core loop SERVES, gated by verify-before-claim (build clean + dev server HTTP 200 + entry module transforms). Sprint C is itself an engine/tooling sprint with no deploy artifact — expect the RI-001 release-prep friction at close (close via ff-merge to main, not the orchestrator). Off main.

### Interpreted Intent

Turn bootstrap:spinup from a documented skeleton (Phases 1-4 are prose hooks, Phase 4 on-screen explicitly deferred to this sprint) into an executable one-command on-ramp. The orchestration LOGIC is built in canonical (the spinup.md skill body + any supporting scripts under scripts/bootstrap/ or scripts/canon/) but EXECUTES product-side (spinup runs inside a product repo). Concretely: (0) a /check:install pre-flight gate that refuses to proceed on a gappy install (incl. the WG-4 sprint-subsystem probe); (1) intent phase that runs the guided brief by default or derives intent from a competitor via the existing scripts/portfolio/clone.js when --clone is passed (reuse, do not reimplement); (2) canon phase that invokes scripts/canon/generate.js (B's engine, already wired in T6) on the Phase-1 intent; (3) roadmap phase that invokes roadmap:create grounded in the freshly-generated _requirements/00-canonical/* (preferred) with MVP-core-loop-first sprint ordering; (4) on-screen phase that takes Milestone-1's first sprint and executes it until the core loop SERVES, gated by verify-before-claim (build clean + dev server returns HTTP 200 + entry module transforms without error — 'it builds' != 'it serves'). --phase <name> re-runs a single phase; --resume continues from the last completed phase.

### Current Behavior

bootstrap:spinup exists (added in SP-021) with Phases 1-4 as documented hooks. Phase 2 (canon) was wired to scripts/canon/generate.js in SP-022 T6. Phase 4 (on-screen) is explicitly a documented contract deferred to SP-20260525-023. There is no driver that executes the full intent->canon->roadmap->on-screen chain, no --resume phase-state tracking, and no verify-before-claim serve gate.

### Desired Behavior

Running /bootstrap:spinup inside a WarpOS-installed product executes end-to-end: pre-flight /check:install gate -> intent (brief or --clone) -> canon (generate.js) -> roadmap:create -> execute first sprint until the core loop SERVES (verify-before-claim). --phase re-runs one phase; --resume continues from the last completed phase. A fixture e2e proves the chain in canonical without standing up a real product.

## Requirements

> Use existing requirement ID conventions enforced by
> `scripts/hooks/requirement-format-guard.js`. PRDs in `_requirements/`
> use `R-N` ids — sprint-scope PRDs that link to a feature in
> `_requirements/04-features/<feature>/PRD.md` should reuse those ids,
> not invent new ones.

- `R-1` — spinup-orchestration
- `R-2` — preflight-install-gate
- `R-3` — intent-phase-brief-and-clone

## Non-Goals

- Standing up / serving a REAL product inside canonical (canonical proves the chain on a fixture; real serve is product-side via spinup)

## Affected Surfaces

| Surface | Evidence Level |
|---|---|
| .claude/commands/bootstrap/spinup.md (orchestration body) | verified_from_repo |

## External Service Dependencies

See `.claude/project/sprint/external-services/` for ESD records.

## Approval Boundaries

See Plan Contract `approval_boundaries`.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260525-0056.yaml`
- High-level stories: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-023\high-level-stories.md`
- Granular stories: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-023\granular-stories.md`
- COPY: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-023\copy.md`
- INPUTS: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-023\inputs.md`
- TRACE: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-023\trace.md`
- Acceptance criteria: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-023\acceptance-criteria.md`
- QA plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-023\qa-plan.md`
- Redteam plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-023\redteam-plan.md`
- Release plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-023\release-plan.md`
