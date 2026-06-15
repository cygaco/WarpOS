<!-- requirement-format-legacy -->
# PRD — Panel namespace + roadmap panel (ROADMAP items 23+25)

**Sprint:** `SP-20260615-001`
**Plan Contract:** `PC-20260615-0079`
**Status:** draft
**Documentation scale:** `m`

## Outcome

The operator opens any panel with one consistent verb and sees 'what's next' without asking; adding a panel is a single registry row; a registry row that points at a non-existent opener is caught by an enforcer instead of failing silently at open time.

## Context

### Original Request

> Build the /panel:* unified panel-opener namespace (ROADMAP item 23) + the roadmap panel/visualization (item 25). (A) /panel:* thin synonyms forwarding to canonical openers + a /panel:list enumerator, off ONE panel registry, forwards-only no logic dup. (B) roadmap panel: read-only 'what's next' board from ROADMAP §Prioritized + TRACKER §Current-Highest-Priority-Next-Action + active-sprints.yaml + open-gaps; static regenerated board; /panel:roadmap opener; read-only v1, operator-facing. (C) fail-closed coverage enforcer report-only in /scan:full: every registry row resolves to a real opener.

### Interpreted Intent

Stop the operator having to remember which namespace each panel lives under (or ask 'what's next'): one /panel: verb opens any registered panel, and /panel:roadmap renders the ranked next-action + in-flight + blocked at a glance from the files that are already the source of truth.

### Current Behavior

Panels exist but each lives under its own namespace (/cockpit:readiness, /models:router, /admin:preview); there is no unified opener verb and no single enumerator. No roadmap-at-a-glance view exists — 'what's next' currently requires reading ROADMAP.md/TRACKER.md or asking. admin-panel-registry.json exists but is admin-scoped.

### Desired Behavior

/panel:<x> opens any registered panel by forwarding to its canonical opener (no duplicated logic); /panel:list enumerates them from the registry; /panel:roadmap renders a read-only board of the ranked next-action + in-flight sprints + blockers from the live source files; a coverage enforcer (report-only in /scan:full) fails closed if any registry row's opener does not resolve to a real skill/script.

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

- `R-1` — R-1 panel registry: ONE source of truth (extend framework/admin-panel-registry.json to a general panels map OR a new framework/panel-registry.json) — one row per panel {name, opener command, one-line description, run_context}; consumed by BOTH the forwarders and the enumerator (the synonym-layer analog of the role-registry).
- `R-2` — R-2 /panel:* forwarder skills: thin synonym skills that DELEGATE to the canonical opener with no logic duplication — /panel:readiness->/cockpit:readiness, /panel:models->/models:router, /panel:admin->/admin:preview, /panel:roadmap->the roadmap board; the canonical skill stays the source of truth.
- `R-3` — R-3 /panel enumerator: /panel (or /panel:list) lists the available panels + one-line descriptions from the registry, so 'show me a panel' has one discoverable entry.
- `R-4` — R-4 roadmap panel (item 25): a READ-ONLY 'what's next' board generated from ROADMAP §Prioritized + TRACKER §Current-Highest-Priority-Next-Action + active-sprints.yaml + the open-gaps registers (enforcement-debt/recurring-issues); static regenerated artifact (like the maps); resilient/fail-soft parsing; /panel:roadmap is its opener.
- `R-5` — R-5 coverage enforcer + shipping integrity: a fail-closed scripts/checks/panel-registry-coverage.js wired REPORT-ONLY into /scan:full (every registry row's opener resolves to a real skill/script; the admin-suite-coverage/role-registry pattern), new path keys via the SOURCE registry, and both manifests + maps regenerated.

## Non-Goals

- No interactive/edit-from-panel board in v1 (read-only; ROADMAP stays source of truth).

## Affected Surfaces

| Surface | Evidence Level |
|---|---|
| framework/admin-panel-registry.json (or a new framework/panel-registry.json) | verified_from_repo |

## External Service Dependencies

See `.claude/project/sprint/external-services/` for ESD records.

## Approval Boundaries

See Plan Contract `approval_boundaries`.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260615-0079.yaml`
- High-level stories: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260615-001\high-level-stories.md`
- Granular stories: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260615-001\granular-stories.md`
- COPY: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260615-001\copy.md`
- INPUTS: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260615-001\inputs.md`
- TRACE: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260615-001\trace.md`
- Acceptance criteria: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260615-001\acceptance-criteria.md`
- QA plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260615-001\qa-plan.md`
- Redteam plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260615-001\redteam-plan.md`
- Release plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260615-001\release-plan.md`
