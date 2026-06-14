<!-- requirement-format-legacy -->
# TRACE Requirements — admin:* skill suite — open/preview the in-app founder admin panel (SP-20260614-002)

**Sprint:** `SP-20260614-002`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260614-002\prd.md`

> TRACE captures the observability, traceability, event capture, decision
> logging, and requirement-to-code linkage layer. The point of TRACE is
> to answer: why did this exist, where did the requirement come from,
> what changed because of it, what external dependency or approval was
> required, how was it tested, what shipped, and what should persist as
> a learning.

## Trace Map

> One row per requirement area (R-1..R-N, single-source from plan_contract.requirement_areas,
> T-298). Fill in Ticket, Code, and Test columns during execution.

| Source | Requirement | Story | COPY | INPUT | ESD | Ticket | Code | Test | Release | Learning |
|---|---|---|---|---|---|---|---|---|---|---|
| use /sprint:full to bust through | R-1 | S-1 | C-1 | IN-1 | — | T-… | — | — | — | — |
| use /sprint:full to bust through | R-2 | S-2 | C-2 | IN-2 | — | T-… | — | — | — | — |
| use /sprint:full to bust through | R-3 | S-3 | C-3 | IN-3 | — | T-… | — | — | — | — |
| use /sprint:full to bust through | R-4 | S-4 | C-4 | IN-4 | — | T-… | — | — | — | — |
| use /sprint:full to bust through | R-5 | S-5 | C-5 | IN-5 | — | T-… | — | — | — | — |
| use /sprint:full to bust through | R-6 | S-6 | C-6 | IN-6 | — | T-… | — | — | — | — |

## TR-1 — R-1 /admin:preview keystone: a dev-tooling skill (.claude/commands/admin/preview.md) + scripts/admin/preview.js that resolves-or-scaffolds a throwaway product test-instance, ensures deps, runs `npm run dev`, waits for ready, and opens /admin in a browser — idempotent (reuse an existing instance), single authoritative writer for the instance pointer (mode-set.js pattern), fail-clear if no product/Next app is resolvable, and NEVER targets WarpOS itself.

**Event:** (fill)
**When:** (fill)
**Captured fields:** (fill)
**Linked requirement:** `R-1`
**Linked story:** `S-1`
**Why we capture this:** (fill)

## TR-2 — R-2 sub-route openers: /admin:readiness + /admin:guides — thin skills that DELEGATE to preview.js with a target sub-route (/admin/readiness, /admin/guides). No logic duplication — they forward to the canonical opener (the /panel:* synonym pattern). Each is a one-row delegation.

**Event:** (fill)
**When:** (fill)
**Captured fields:** (fill)
**Linked requirement:** `R-2`
**Linked story:** `S-2`
**Why we capture this:** (fill)

## TR-3 — R-3 /admin:seed: a skill + scripts/admin/seed.js that seeds the reused test-instance with a founder session/allowlist cookie + sample events + a FOUNDERS_CHECKLIST.md so the panel renders WARM-start (real data) instead of cold-start. Idempotent; writes only into the throwaway instance.

**Event:** (fill)
**When:** (fill)
**Captured fields:** (fill)
**Linked requirement:** `R-3`
**Linked story:** `S-3`
**Why we capture this:** (fill)

## TR-4 — R-4 admin-panel registry + source path keys: a small registry (admin route -> opener command -> one-line description) that backs the openers and is forward-compatible with item 23 /panel:*. New path keys (scriptsAdmin, adminPanelRegistry) go in the SOURCE framework/paths.registry.json; scripts/paths/build.js regenerates .claude/paths.json + paths.generated.js (guardrail a — never hand-edit the generated view; verify the key survived the regen). The registry/routing file is CROSS-PROVIDER-REVIEWED (dispatch-agent.js reviewer), not a solo alpha draft (guardrail b).

**Event:** (fill)
**When:** (fill)
**Captured fields:** (fill)
**Linked requirement:** `R-4`
**Linked story:** `S-4`
**Why we capture this:** (fill)

## TR-5 — R-5 enforcer + coverage + regen: an admin-skill-resolution / registry-freshness check (the admin skills resolve via dispatch-skill --resolve; the registry has no orphan rows / phantom openers) wired REPORT-ONLY into /scan:full (same shape as skill-hook-coverage; names its enforcer). Rebuild maps (maps:skills / maps:tools) and regenerate BOTH manifests (generate-framework-manifest.js + scripts/warpos/manifest/build.js) so BC-02/BC-05 stay green.

**Event:** (fill)
**When:** (fill)
**Captured fields:** (fill)
**Linked requirement:** `R-5`
**Linked story:** `S-5`
**Why we capture this:** (fill)

## TR-6 — R-6 Playwright-lane enablement (documented, not a live run): /admin:preview emits the live preview URL (e.g. http://localhost:PORT/admin) on success so the deferred design-quality/visual-review lane can target a running Next app; document the handoff in the skill. The actual blocking design-quality run stays deferred/operator-gated.

**Event:** (fill)
**When:** (fill)
**Captured fields:** (fill)
**Linked requirement:** `R-6`
**Linked story:** `S-6`
**Why we capture this:** (fill)
