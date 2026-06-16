<!-- requirement-format-legacy -->
# TRACE Requirements — Visual interactive roadmap panel — browser GUI (ROADMAP item 25, redone)

**Sprint:** `SP-20260615-002`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260615-002\prd.md`

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
| That was a mistake on | R-1 | S-1 | C-1 | IN-1 | — | T-… | — | — | — | — |
| That was a mistake on | R-2 | S-2 | C-2 | IN-2 | — | T-… | — | — | — | — |
| That was a mistake on | R-3 | S-3 | C-3 | IN-3 | — | T-… | — | — | — | — |
| That was a mistake on | R-4 | S-4 | C-4 | IN-4 | — | T-… | — | — | — | — |
| That was a mistake on | R-5 | S-5 | C-5 | IN-5 | — | T-… | — | — | — | — |
| That was a mistake on | R-6 | S-6 | C-6 | IN-6 | — | T-… | — | — | — | — |

## TR-1 — R-1 data aggregator: extend scripts/panel/roadmap.js to emit a COMPLETE --json with the four data areas — (a) active sprints (id/status/phase/ticket-counts), (b) roadmap (prioritized do-next order + items/sections), (c) epics (state/%/child-sprints from trackers/epics/), (d) per-sprint ticket breakdown (tickets + statuses from sprint records); fail-SOFT per source (reuse v1's degrade-to-section-unavailable, never throw/write).

**Event:** (fill)
**When:** (fill)
**Captured fields:** (fill)
**Linked requirement:** `R-1`
**Linked story:** `S-1`
**Why we capture this:** (fill)

## TR-2 — R-2 browser GUI server: a NEW scripts/panel/roadmap-gui.js that mirrors scripts/dispatch/gui.js — http.createServer on an OS-chosen port, loopback-only, token-guarded, serves the panel HTML + the aggregated JSON, then openInBrowser; no external deps; clean shutdown.

**Event:** (fill)
**When:** (fill)
**Captured fields:** (fill)
**Linked requirement:** `R-2`
**Linked story:** `S-2`
**Why we capture this:** (fill)

## TR-3 — R-3 visual frontend: a polished, modern, design-system-aligned panel (cards/columns/timeline/progress bars — NOT a text dump) rendering all four data areas; mirror the Dispatch Console visual idiom + the design-system docs.

**Event:** (fill)
**When:** (fill)
**Captured fields:** (fill)
**Linked requirement:** `R-3`
**Linked story:** `S-3`
**Why we capture this:** (fill)

## TR-4 — R-4 interactivity: client-side filter, expand/collapse, drill into a sprint or epic, and click-an-item-for-detail — all read-only (no write-back to any source).

**Event:** (fill)
**When:** (fill)
**Captured fields:** (fill)
**Linked requirement:** `R-4`
**Linked story:** `S-4`
**Why we capture this:** (fill)

## TR-5 — R-5 wire-up: rewire .claude/commands/panel/roadmap.md + the framework/panel-registry.json `roadmap` opener to open the GUI by default (with --text forwarding to the v1 board); keep panel-registry-coverage green; regen path keys + both manifests + maps.

**Event:** (fill)
**When:** (fill)
**Captured fields:** (fill)
**Linked requirement:** `R-5`
**Linked story:** `S-5`
**Why we capture this:** (fill)

## TR-6 — R-6 looks-nice gauntlet: a design-quality + visual-review pass (Playwright against the running served page) verifying the panel renders cleanly, is visually polished against the design-system, and the interactions work — the explicit 'it must look nice' acceptance bar.

**Event:** (fill)
**When:** (fill)
**Captured fields:** (fill)
**Linked requirement:** `R-6`
**Linked story:** `S-6`
**Why we capture this:** (fill)
