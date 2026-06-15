<!-- requirement-format-legacy -->
# TRACE Requirements — Panel namespace + roadmap panel (ROADMAP items 23+25)

**Sprint:** `SP-20260615-001`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260615-001\prd.md`

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
| Build the /panel:* unified panel-opener | R-1 | S-1 | C-1 | IN-1 | — | T-… | — | — | — | — |
| Build the /panel:* unified panel-opener | R-2 | S-2 | C-2 | IN-2 | — | T-… | — | — | — | — |
| Build the /panel:* unified panel-opener | R-3 | S-3 | C-3 | IN-3 | — | T-… | — | — | — | — |
| Build the /panel:* unified panel-opener | R-4 | S-4 | C-4 | IN-4 | — | T-… | — | — | — | — |
| Build the /panel:* unified panel-opener | R-5 | S-5 | C-5 | IN-5 | — | T-… | — | — | — | — |

## TR-1 — R-1 panel registry: ONE source of truth (extend framework/admin-panel-registry.json to a general panels map OR a new framework/panel-registry.json) — one row per panel {name, opener command, one-line description, run_context}; consumed by BOTH the forwarders and the enumerator (the synonym-layer analog of the role-registry).

**Event:** (fill)
**When:** (fill)
**Captured fields:** (fill)
**Linked requirement:** `R-1`
**Linked story:** `S-1`
**Why we capture this:** (fill)

## TR-2 — R-2 /panel:* forwarder skills: thin synonym skills that DELEGATE to the canonical opener with no logic duplication — /panel:readiness->/cockpit:readiness, /panel:models->/models:router, /panel:admin->/admin:preview, /panel:roadmap->the roadmap board; the canonical skill stays the source of truth.

**Event:** (fill)
**When:** (fill)
**Captured fields:** (fill)
**Linked requirement:** `R-2`
**Linked story:** `S-2`
**Why we capture this:** (fill)

## TR-3 — R-3 /panel enumerator: /panel (or /panel:list) lists the available panels + one-line descriptions from the registry, so 'show me a panel' has one discoverable entry.

**Event:** (fill)
**When:** (fill)
**Captured fields:** (fill)
**Linked requirement:** `R-3`
**Linked story:** `S-3`
**Why we capture this:** (fill)

## TR-4 — R-4 roadmap panel (item 25): a READ-ONLY 'what's next' board generated from ROADMAP §Prioritized + TRACKER §Current-Highest-Priority-Next-Action + active-sprints.yaml + the open-gaps registers (enforcement-debt/recurring-issues); static regenerated artifact (like the maps); resilient/fail-soft parsing; /panel:roadmap is its opener.

**Event:** (fill)
**When:** (fill)
**Captured fields:** (fill)
**Linked requirement:** `R-4`
**Linked story:** `S-4`
**Why we capture this:** (fill)

## TR-5 — R-5 coverage enforcer + shipping integrity: a fail-closed scripts/checks/panel-registry-coverage.js wired REPORT-ONLY into /scan:full (every registry row's opener resolves to a real skill/script; the admin-suite-coverage/role-registry pattern), new path keys via the SOURCE registry, and both manifests + maps regenerated.

**Event:** (fill)
**When:** (fill)
**Captured fields:** (fill)
**Linked requirement:** `R-5`
**Linked story:** `S-5`
**Why we capture this:** (fill)
