<!-- requirement-format-legacy -->
# TRACE Requirements — ED-051 enforcer — missing_product_lead_authoring finding

**Sprint:** `SP-20260613-001`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260613-001\prd.md`

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
| Build the ED-051 enforcer (completes | R-1 | S-1 | C-1 | IN-1 | — | T-… | — | — | — | — |
| Build the ED-051 enforcer (completes | R-2 | S-2 | C-2 | IN-2 | — | T-… | — | — | — | — |
| Build the ED-051 enforcer (completes | R-3 | S-3 | C-3 | IN-3 | — | T-… | — | — | — | — |
| Build the ED-051 enforcer (completes | R-4 | S-4 | C-4 | IN-4 | — | T-… | — | — | — | — |
| Build the ED-051 enforcer (completes | R-5 | S-5 | C-5 | IN-5 | — | T-… | — | — | — | — |

## TR-1 — R-1 detector: add a missing_product_lead_authoring finding to computeFindings() — cutoff-gated, record-backed (reuse hasBackingDispatchRecord), solo-mode-aware (alpha-solo legitimate only in solo mode), fail-closed on a missing/unparseable record source; export any new constants for the test harness.

**Event:** (fill)
**When:** (fill)
**Captured fields:** (fill)
**Linked requirement:** `R-1`
**Linked story:** `S-1`
**Why we capture this:** (fill)

## TR-2 — R-2 authorship-record contract: define and read the authoritative product-lead authorship signal correlated to a sprint (resolved in design), and the precondition that the sprint produced a plan-contract or PRD.

**Event:** (fill)
**When:** (fill)
**Captured fields:** (fill)
**Linked requirement:** `R-2`
**Linked story:** `S-2`
**Why we capture this:** (fill)

## TR-3 — R-3 scan wiring: surface the new finding_type through scan:sprint-manager-consult / /scan:full alongside missing_design_consult (additive).

**Event:** (fill)
**When:** (fill)
**Captured fields:** (fill)
**Linked requirement:** `R-3`
**Linked story:** `S-3`
**Why we capture this:** (fill)

## TR-4 — R-4 fixtures + coverage: plant positive fixtures (post-cutoff non-solo sprint with plan-contract/PRD and no product-lead record) and negative fixtures (solo mode, pre-cutoff, valid product-lead record present) so the detector is proven and false-green-resistant.

**Event:** (fill)
**When:** (fill)
**Captured fields:** (fill)
**Linked requirement:** `R-4`
**Linked story:** `S-4`
**Why we capture this:** (fill)

## TR-5 — R-5 debt reconciliation: mark ED-051 resolved in enforcement-debt.jsonl with the enforcer reference; regenerate both manifests if any framework-tracked file changed.

**Event:** (fill)
**When:** (fill)
**Captured fields:** (fill)
**Linked requirement:** `R-5`
**Linked story:** `S-5`
**Why we capture this:** (fill)
