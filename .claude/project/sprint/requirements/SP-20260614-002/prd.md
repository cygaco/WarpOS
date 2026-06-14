<!-- requirement-format-legacy -->
# PRD — admin:* skill suite — open/preview the in-app founder admin panel (SP-20260614-002)

**Sprint:** `SP-20260614-002`
**Plan Contract:** `PC-20260614-0078`
**Status:** draft
**Documentation scale:** `m`

## Outcome

A founder (or the President testing a product) can open the in-app admin panel with one command — /admin:preview — instead of hand-scaffolding a Next app and remembering the route. The render harness also unblocks the design-quality/visual-review Playwright lane (which needs a running Next app), and makes 'test the panel' real (WarpOS itself can't render it — not a Next app).

## Context

### Original Request

> use /sprint:full to bust through the work. [pickup #1, operator-directed 2026-06-14 right after R-2 shipped: "how does one open it? there has to be a skill" + "get us ready to build a 'admin:' skill suite, and let's test this panel on warpos itself."]

### Interpreted Intent

Close the missing-opener gap for the founder admin panel. The R-2 panel (/admin + /admin/readiness + /admin/guides) is test-proven (8/8) but cannot be OPENED/rendered from a session. Build dev-tooling skills under .claude/commands/admin/ + node helpers under scripts/admin/: (1) /admin:preview — the keystone — resolves-or-scaffolds a throwaway product test-instance (reuse the scaffold/portfolio path), ensures deps, runs `npm run dev`, opens /admin in a browser; idempotent (reuse an existing instance); single authoritative writer for the instance pointer (mode-set.js pattern). (2) /admin:readiness + /admin:guides — thin openers that DELEGATE to the preview harness with a target sub-route (no logic duplication — the /panel:* synonym pattern, item 23 seam). (3) /admin:seed — seeds a founder session + sample events + a FOUNDERS_CHECKLIST so the panel renders warm-start, not cold-start (WarpOS itself has no checklist → cold-start, verified 2026-06-14). A small admin-panel registry (route -> opener -> description) backs the openers and is forward-compatible with item 23 /panel:*; its path keys live in the SOURCE framework/paths.registry.json (build.js regenerates the .claude view); the registry/routing file is cross-provider-reviewed, never a solo alpha draft. The keystone emits the live preview URL so the deferred design-quality Playwright lane can finally target a running Next app.

### Current Behavior

The founder admin panel (/admin + /admin/readiness + /admin/guides) shipped in R-2 (SP-20260614-001) via the app scaffold and is test-proven (8/8 regression). But there is NO opener: unlike /cockpit:readiness (operator board) and /models:router (Dispatch Console GUI), which launch their own surfaces, nothing renders the founder panel from a session. WarpOS itself cannot render it (not a Next app, no FOUNDERS_CHECKLIST -> cold-start, error surfaced; verified 2026-06-14). The deferred design-quality/visual-review Playwright lane is blocked precisely because there is no running Next app to point it at.

### Desired Behavior

/admin:preview resolves-or-scaffolds a throwaway product test-instance, ensures deps, runs `npm run dev`, and opens /admin in a browser — idempotent (reuse an existing instance), single authoritative writer for the instance pointer, never targeting WarpOS itself. /admin:readiness + /admin:guides open the sub-routes by delegating to the harness (no logic duplication). /admin:seed seeds a founder session + sample events + a FOUNDERS_CHECKLIST so the panel renders warm-start. A small admin-panel registry backs the openers, its path keys live in the SOURCE paths.registry.json (build.js regenerates the view), and the routing/registry file is cross-provider-reviewed. The skills resolve + the registry is fresh (enforcer wired report-only into /scan:full); maps + both manifests are regenerated; the keystone emits the live preview URL so the design-quality Playwright lane can target it.

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

- `R-1` — R-1 /admin:preview keystone: a dev-tooling skill (.claude/commands/admin/preview.md) + scripts/admin/preview.js that resolves-or-scaffolds a throwaway product test-instance, ensures deps, runs `npm run dev`, waits for ready, and opens /admin in a browser — idempotent (reuse an existing instance), single authoritative writer for the instance pointer (mode-set.js pattern), fail-clear if no product/Next app is resolvable, and NEVER targets WarpOS itself.
- `R-2` — R-2 sub-route openers: /admin:readiness + /admin:guides — thin skills that DELEGATE to preview.js with a target sub-route (/admin/readiness, /admin/guides). No logic duplication — they forward to the canonical opener (the /panel:* synonym pattern). Each is a one-row delegation.
- `R-3` — R-3 /admin:seed: a skill + scripts/admin/seed.js that seeds the reused test-instance with a founder session/allowlist cookie + sample events + a FOUNDERS_CHECKLIST.md so the panel renders WARM-start (real data) instead of cold-start. Idempotent; writes only into the throwaway instance.
- `R-4` — R-4 admin-panel registry + source path keys: a small registry (admin route -> opener command -> one-line description) that backs the openers and is forward-compatible with item 23 /panel:*. New path keys (scriptsAdmin, adminPanelRegistry) go in the SOURCE framework/paths.registry.json; scripts/paths/build.js regenerates .claude/paths.json + paths.generated.js (guardrail a — never hand-edit the generated view; verify the key survived the regen). The registry/routing file is CROSS-PROVIDER-REVIEWED (dispatch-agent.js reviewer), not a solo alpha draft (guardrail b).
- `R-5` — R-5 enforcer + coverage + regen: an admin-skill-resolution / registry-freshness check (the admin skills resolve via dispatch-skill --resolve; the registry has no orphan rows / phantom openers) wired REPORT-ONLY into /scan:full (same shape as skill-hook-coverage; names its enforcer). Rebuild maps (maps:skills / maps:tools) and regenerate BOTH manifests (generate-framework-manifest.js + scripts/warpos/manifest/build.js) so BC-02/BC-05 stay green.
- `R-6` — R-6 Playwright-lane enablement (documented, not a live run): /admin:preview emits the live preview URL (e.g. http://localhost:PORT/admin) on success so the deferred design-quality/visual-review lane can target a running Next app; document the handoff in the skill. The actual blocking design-quality run stays deferred/operator-gated.

## Non-Goals

- NOT building item 23 /panel:* itself (admin:* is only forward-compatible with it).

## Affected Surfaces

| Surface | Evidence Level |
|---|---|
| .claude/commands/admin/preview.md (new) + scripts/admin/preview.js (new) | inferred_from_repo |

## External Service Dependencies

See `.claude/project/sprint/external-services/` for ESD records.

## Approval Boundaries

See Plan Contract `approval_boundaries`.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260614-0078.yaml`
- High-level stories: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260614-002\high-level-stories.md`
- Granular stories: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260614-002\granular-stories.md`
- COPY: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260614-002\copy.md`
- INPUTS: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260614-002\inputs.md`
- TRACE: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260614-002\trace.md`
- Acceptance criteria: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260614-002\acceptance-criteria.md`
- QA plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260614-002\qa-plan.md`
- Redteam plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260614-002\redteam-plan.md`
- Release plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260614-002\release-plan.md`
