<!-- requirement-format-legacy -->
# PRD — Founders in-app panel — /admin/readiness view (S-PF-09a R-2)

**Sprint:** `SP-20260614-001`
**Plan Contract:** `PC-20260614-0077`
**Status:** draft
**Documentation scale:** `m`

## Outcome

A founder opens their own product's /admin/readiness and sees exactly what stands between them and launch — what's done, what's left, who owns each gap, how long the slow-clock items take, and a one-tap link to the guide that walks each fix — compressing time-to-launch and removing the ~10-friction-point stall a real founder hit in doogle (WG-29).

## Context

### Original Request

> Sure, proceed [with R-2 + wire the design gate]. Also read the new WARPOS.md items from doogle that are about founder checklists and guides. Remember to use /sprint:full.

### Interpreted Intent

Complete the third leg of the founders launch-readiness arc (data layer + operator cockpit already shipped): the product-shipped, founder-facing view. It reuses the S-PF-03 signed-cookie founder-allowlist admin pattern for a new /admin/readiness route, consumes scripts/scaffold/readiness-report.js (the warpos/readiness/v1 producer) for its data, and renders an ACTIONABLE board — per doogle's WG-29 real-founder feedback, each item deep-links to its click-path guide so the founder is walked to the fix, not just told the goal. Check/uncheck writes [x] back to FOUNDERS_CHECKLIST.md through a NET-NEW surgical line-patch (id-matched in-place toggle, atomic write, patch-on-current — render-from-model is lossy and CREATE-only), keeping it the single source of truth without clobbering human annotations. The cold-start (0/N, all open) state is a first-class oriented layout, not a blank table (FTUE). The panel templates + the producer must ship via the scaffold payload (WG-23 class). A scaffold-coverage extension + a brand-leak scanner enforce the route's gate + brand cleanliness; the build passes the design-quality gauntlet (which also exercises wiring design-quality into sprint-composition — the un-routed judgment layer).

### Current Behavior

The readiness data layer (producer, warpos/readiness/v1) and the operator cockpit (/cockpit:readiness) shipped this session. There is NO founder-facing in-app view — a founder can't see their own product's launch readiness inside the app. The scaffold has the S-PF-03 admin pattern + the FOUNDERS_CHECKLIST data, but no readiness route over it. doogle's WG-29 shows the existing checklist/panel states goals, not the click-path.

### Desired Behavior

A new founder-allowlist-gated /admin/readiness route ships in the app scaffold. It renders the warpos/readiness/v1 report: per item — status, owner-class, lead-time, blocker, and a PROMINENT deep-link to the how-to guide (WG-29 actionable). Cold start (0/N) renders an oriented 'start here' layout (not blank); warm start de-emphasizes done items and focuses what's next. Check/uncheck writes [x] back to FOUNDERS_CHECKLIST.md via a NET-NEW surgical line-patch (match id=, toggle in place, atomic tmp+rename, patch-on-current — NOT render-from-model, which is lossy) and survives reload with all human annotations/markers intact. No product-facing 'WarpOS' string. The route + gate are asserted by scaffold-coverage (planted ungated/brand-leak fixtures FAIL); the producer + templates ship in the scaffold payload (WG-23); the build passes the design-quality gauntlet.

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

- `R-1` — R-1 the panel: a founder-allowlist-gated /admin/readiness scaffold route (reuse S-PF-03 pattern, no new auth) that renders the warpos/readiness/v1 report — per item: status, owner-class, lead-time, blocker.
- `R-2` — R-2 actionable deep-links (doogle WG-29): each item surfaces its deep_link to the how-to/click-path guide PROMINENTLY — the panel walks the founder to the fix, not just states the goal.
- `R-3` — R-3 cold/warm FTUE states: cold start (0/N, all open) renders an oriented 'start here' layout (not a blank table); warm start de-emphasizes done + focuses what's next.
- `R-4` — R-4 write-back (NET-NEW surgical line-patch — NOT a parser round-trip; β corrected the false-reuse claim): check/uncheck locates the item's line by `id=` match (never line index) and toggles `[ ]`<->`[x]` IN PLACE, preserving every other byte. Do NOT render-from-model: parseFoundersChecklist DROPS non-matching lines (human notes/headers/declared_stack) and renderFoundersChecklist regenerates from constants (wipes checked-state) — render-from-model is for CREATE only, lossy for MUTATE. Atomic write (tmp + fs.renameSync); re-read immediately before write (patch-on-current, not write-from-snapshot) since the .md is human-editable + the SoT. Round-trip invariant TESTED (AC-A6): parse->toggle->write->re-parse = same items, exactly ONE flipped checked bit, ZERO other diffs — a planted human note + section header + the declared_stack/markers MUST survive.
- `R-5` — R-5 enforcers + ship-coverage: extend scaffold-coverage-scan (planted ungated-readiness FAILS + planted brand-leak FAILS); add brand-leak-scan.js; confirm the panel + producer ship in the scaffold payload (WG-23) and assert it.
- `R-6` — R-6 design quality: the panel passes the design-quality gauntlet (Playwright); wire design-quality-gate into sprint-composition so UI-touching sprints get mandatory design review (report-only ramp; blocking flip operator-gated).

## Non-Goals

- No new auth provider (reuse the S-PF-03 founder allowlist).

## Affected Surfaces

| Surface | Evidence Level |
|---|---|
| framework/templates/app-scaffold/src/app/admin/readiness/page.tsx.tmpl (+ actions.ts.tmpl) | verified_from_repo |

## External Service Dependencies

See `.claude/project/sprint/external-services/` for ESD records.

## Approval Boundaries

See Plan Contract `approval_boundaries`.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260614-0077.yaml`
- High-level stories: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260614-001\high-level-stories.md`
- Granular stories: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260614-001\granular-stories.md`
- COPY: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260614-001\copy.md`
- INPUTS: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260614-001\inputs.md`
- TRACE: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260614-001\trace.md`
- Acceptance criteria: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260614-001\acceptance-criteria.md`
- QA plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260614-001\qa-plan.md`
- Redteam plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260614-001\redteam-plan.md`
- Release plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260614-001\release-plan.md`
