<!-- requirement-format-legacy -->
# PRD — Orchestrator-Beta bridge — choose dispatch-from-subprocess or halt-at-Beta-boundary (milestone 0.11.0 sprint 1)

**Sprint:** `SP-20260525-003`
**Plan Contract:** `PC-20260523-0037`
**Status:** draft
**Documentation scale:** `m`

## Outcome

Every `sprint_full_beta_consult` event in `events.jsonl` reflects an actual SendMessage round-trip to Beta with a real verdict (DECIDE | DIRECTIVE | ESCALATE) and real reasoning. The operator can `grep events.jsonl | jq` to audit β-consultation cadence and see it matches `_docs/sprint/AUTONOMY.md`'s declared policy. ESCALATE verdicts halt the sprint reliably. The autonomy ladder rungs become load-bearing instead of decorative.

## Context

### Original Request

> Orchestrator→Beta bridge — sprint 1 of milestone 0.11.0 Sprint Workflow Honesty. /sprint:full currently emits placeholder DECIDE events without actual SendMessage round-trip to Beta — the subprocess can't easily reach in-process teammates. Design + ship one of: (a) dispatch-from-subprocess pattern (orchestrator runs as spawnSync-d node, gains a bridge to in-process teammates), or (b) halt-at-each-Beta-boundary (orchestrator halts at each Phase boundary, operator runs Beta consult interactively, then resumes). Either way, _docs/sprint/AUTONOMY.md cadence becomes enforced. Autonomy: aggressive. Mode: adhoc.

### Interpreted Intent

`scripts/sprint/full.js` currently writes `sprint_full_beta_consult` events with placeholder verdicts (DECIDE) without actually invoking Beta via SendMessage. The subprocess can't reach in-process teammates because the Agent/SendMessage tool surface lives in the Claude Code runtime, not in node-spawned subprocesses. Two architectures resolve this: (a) build a subprocess-to-runtime bridge (file-drop-and-poll, named pipe, HTTP localhost) so the orchestrator's subprocess can drop a consult-request and the runtime picks it up + dispatches Beta + drops the verdict back, OR (b) restructure /sprint:full so it halts the subprocess at each Beta boundary, exits with a checkpoint, and the operator (or Alpha in the foreground) drives the Beta consult interactively before resuming. Design pass chooses (a) or (b) based on operator UX + crash-recovery + simplicity tradeoffs.

### Current Behavior

Per ROADMAP.md milestone 0.11.0 entry + 'Sprints feeding this' bullet 1: '`/sprint:full` emits DECIDE events without actually SendMessage-ing Beta — the subprocess can't easily reach in-process teammates.' Per existing 'open' note in roadmap section 'Shipped in SP-20260522-001/002/003': 'orchestrator emits the event without actually SendMessage-ing Beta. Honest halt approach pending a dispatch-from-subprocess design'. Honest halts (Phase 2 tickets_pending, Phase 3 no_tickets_ready, Phase 4 no_tickets_done) ARE implemented and tested. The gap is specifically the Beta SendMessage round-trip.

### Desired Behavior

After sprint completion: (1) chosen pattern (a or b) is implemented end-to-end in /sprint:full; (2) Every Phase-boundary Beta-consult produces a real `sprint_full_beta_consult` event with non-placeholder verdict + beta_message + latency_ms; (3) ESCALATE verdict triggers `sprint_full_halt` with `halt_reason: beta_escalate`; (4) DIRECTIVE verdict applies the directive to downstream phase behavior (e.g., 'skip Phase 3, halt for operator review'); (5) DECIDE verdict continues unchanged; (6) `_docs/sprint/AUTONOMY.md` Beta cadence line removes 'aspirational' disclaimer; (7) `scripts/sprint/test-sprint-full.js` includes a Beta-consult contract test that exercises all 3 verdict paths.

## Requirements

> Use existing requirement ID conventions enforced by
> `scripts/hooks/requirement-format-guard.js`. PRDs in `_requirements/`
> use `R-N` ids — sprint-scope PRDs that link to a feature in
> `_requirements/04-features/<feature>/PRD.md` should reuse those ids,
> not invent new ones.

- `R-1` — sprint-workflow
- `R-2` — agent-dispatch
- `R-3` — ipc

## Non-Goals

- Implementing the Beta-honesty enforcement skill (`/check:sprint-beta-honesty`) — that's SP-20260525-004 (sprint 2 of 0.11.0)

## Affected Surfaces

| Surface | Evidence Level |
|---|---|
| scripts/sprint/full.js | verified_from_repo |

## External Service Dependencies

See `.claude/project/sprint/external-services/` for ESD records.

## Approval Boundaries

See Plan Contract `approval_boundaries`.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260523-0037.yaml`
- High-level stories: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-003\high-level-stories.md`
- Granular stories: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-003\granular-stories.md`
- COPY: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-003\copy.md`
- INPUTS: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-003\inputs.md`
- TRACE: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-003\trace.md`
- Acceptance criteria: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-003\acceptance-criteria.md`
- QA plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-003\qa-plan.md`
- Redteam plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-003\redteam-plan.md`
- Release plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-003\release-plan.md`
