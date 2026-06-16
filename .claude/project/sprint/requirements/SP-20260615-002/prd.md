<!-- requirement-format-legacy -->
# PRD — Visual interactive roadmap panel — browser GUI (ROADMAP item 25, redone)

**Sprint:** `SP-20260615-002`
**Plan Contract:** `PC-20260615-0080`
**Status:** draft
**Documentation scale:** `m`

## Outcome

The operator runs /panel:roadmap and a clean, modern, interactive panel opens in their browser — active sprints, the prioritized roadmap, epics with progress, and the ticket breakdown per sprint — so 'what's next / where are we' is a visual glance + drill-down, not a text dump and not asking.

## Context

### Original Request

> That was a mistake on your part. I explicitly asked for a nice visual panel. /sprint:full to get it done; and I want it to look nice, and be interactive. I need info on current ongoing sprints, the roadmap, epics, and sprint breakdown.

### Interpreted Intent

Replace the v1 text-only /panel:roadmap with a real browser GUI panel (like /models:router's Dispatch Console): visually polished + interactive, surfacing the four data areas the operator named so they can SEE the portfolio state at a glance and drill in.

### Current Behavior

/panel:roadmap (v1, SP-20260615-001) prints a static TEXT board to stdout — functional but NOT the visual panel requested. The other panels (/panel:models → Dispatch Console gui.js, /panel:admin → browser preview) DO open the browser; /panel:roadmap does not. No epics or per-sprint ticket breakdown in the v1 board.

### Desired Behavior

/panel:roadmap opens a polished interactive panel in the browser. It shows: (a) current ongoing/active sprints (id, status, phase, ticket counts); (b) the roadmap (prioritized do-next order + items/sections); (c) epics (state, % complete, child sprints); (d) per-sprint ticket breakdown (tickets + statuses). The operator can filter, expand/collapse, drill into a sprint/epic, and click an item for detail. Read-only (ROADMAP stays the source of truth). It genuinely LOOKS NICE (design-quality + visual-review gauntlet pass). The v1 text board remains as --text + the shared data layer.

## Requirements

> Use existing requirement ID conventions enforced by
> `scripts/hooks/requirement-format-guard.js`. PRDs in `_requirements/`
> use `R-N` ids — sprint-scope PRDs that link to a feature in
> `_requirements/04-features/<feature>/PRD.md` should reuse those ids,
> not invent new ones.
>
> This list is generated from `plan_contract.requirement_areas` (N items → R-1..R-N).
> A sprint with >3 requirement areas will have more than 3 entries here — trace.md
> and granular-stories.md reference the same R-1..R-N set (single-source, T-298).

- `R-1` — R-1 data aggregator: extend scripts/panel/roadmap.js to emit a COMPLETE --json with the four data areas — (a) active sprints (id/status/phase/ticket-counts), (b) roadmap (prioritized do-next order + items/sections), (c) epics (state/%/child-sprints from trackers/epics/), (d) per-sprint ticket breakdown (tickets + statuses from sprint records); fail-SOFT per source (reuse v1's degrade-to-section-unavailable, never throw/write).
- `R-2` — R-2 browser GUI server: a NEW scripts/panel/roadmap-gui.js that mirrors scripts/dispatch/gui.js — http.createServer on an OS-chosen port, loopback-only, token-guarded, serves the panel HTML + the aggregated JSON, then openInBrowser; no external deps; clean shutdown.
- `R-3` — R-3 visual frontend: a polished, modern, design-system-aligned panel (cards/columns/timeline/progress bars — NOT a text dump) rendering all four data areas; mirror the Dispatch Console visual idiom + the design-system docs.
- `R-4` — R-4 interactivity: client-side filter, expand/collapse, drill into a sprint or epic, and click-an-item-for-detail — all read-only (no write-back to any source).
- `R-5` — R-5 wire-up: rewire .claude/commands/panel/roadmap.md + the framework/panel-registry.json `roadmap` opener to open the GUI by default (with --text forwarding to the v1 board); keep panel-registry-coverage green; regen path keys + both manifests + maps.
- `R-6` — R-6 looks-nice gauntlet: a design-quality + visual-review pass (Playwright against the running served page) verifying the panel renders cleanly, is visually polished against the design-system, and the interactions work — the explicit 'it must look nice' acceptance bar.

## Non-Goals

- No edit/write-back from the panel in v1 (read-only; ROADMAP stays source of truth).

## Affected Surfaces

| Surface | Evidence Level |
|---|---|
| scripts/panel/roadmap.js (extend → shared data aggregator) | verified_from_repo |

## External Service Dependencies

See `.claude/project/sprint/external-services/` for ESD records.

## Approval Boundaries

See Plan Contract `approval_boundaries`.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260615-0080.yaml`
- High-level stories: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260615-002\high-level-stories.md`
- Granular stories: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260615-002\granular-stories.md`
- COPY: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260615-002\copy.md`
- INPUTS: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260615-002\inputs.md`
- TRACE: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260615-002\trace.md`
- Acceptance criteria: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260615-002\acceptance-criteria.md`
- QA plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260615-002\qa-plan.md`
- Redteam plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260615-002\redteam-plan.md`
- Release plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260615-002\release-plan.md`
