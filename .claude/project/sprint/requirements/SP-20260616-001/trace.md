<!-- requirement-format-legacy -->
# TRACE Requirements — E-DISPATCH-SHAPE-001 W2-core: shape-door report-only parity + per-wrapper enforce-ramp scaffolding

**Sprint:** `SP-20260616-001`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260616-001\prd.md`

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
| Operator autonomous mandate 2026-06-16 (/session:resume | R-1 | S-1 | C-1 | IN-1 | — | T-… | — | — | — | — |
| Operator autonomous mandate 2026-06-16 (/session:resume | R-2 | S-2 | C-2 | IN-2 | — | T-… | — | — | — | — |
| Operator autonomous mandate 2026-06-16 (/session:resume | R-3 | S-3 | C-3 | IN-3 | — | T-… | — | — | — | — |
| Operator autonomous mandate 2026-06-16 (/session:resume | R-4 | S-4 | C-4 | IN-4 | — | T-… | — | — | — | — |
| Operator autonomous mandate 2026-06-16 (/session:resume | R-5 | S-5 | C-5 | IN-5 | — | T-… | — | — | — | — |

## TR-1 — R-1 dispatch-skill consultation: dispatch-skill.js consults dispatch-shape.js#shapeMismatch for the subprocess-skill shape at spawn, through the shared door, report-only by default, fail-open on resolver error

**Event:** (fill)
**When:** (fill)
**Captured fields:** (fill)
**Linked requirement:** `R-1`
**Linked story:** `S-1`
**Why we capture this:** (fill)

## TR-2 — R-2 epsilon-runtime consultation: epsilon-runtime.js consults shapeMismatch at its role spawn point for the shape it routes (subprocess-claude / subprocess-cross-provider), through the shared door, report-only, fail-open

**Event:** (fill)
**When:** (fill)
**Captured fields:** (fill)
**Linked requirement:** `R-2`
**Linked story:** `S-2`
**Why we capture this:** (fill)

## TR-3 — R-3 unified shape-door: a single shapeDoor() helper in dispatch-shape.js implements WARPOS_SHAPE_DOOR=report|enforce (default report) + WARPOS_DISABLE_SHAPE_DOOR kill-switch (forces report) + enforce-mode high-severity refusal (exit 2, named reason) + fail-open; all four wrappers route their consultation through it; dispatch-agent/dispatch-claude migrate without regressing existing behavior

**Event:** (fill)
**When:** (fill)
**Captured fields:** (fill)
**Linked requirement:** `R-3`
**Linked story:** `S-3`
**Why we capture this:** (fill)

## TR-4 — R-4 planted tests both modes: per-mode planted-violation tests assert report=>advisory+proceed(exit0), enforce=>refuse(exit2), kill-switch=>forces report under enforce, resolver-error=>fail-open; extend dispatch-shape.test.js and add per-wrapper coverage

**Event:** (fill)
**When:** (fill)
**Captured fields:** (fill)
**Linked requirement:** `R-4`
**Linked story:** `S-4`
**Why we capture this:** (fill)

## TR-5 — R-5 contract documentation: document the door convention + kill-switch + per-wrapper ramp in the dispatch guide (paths.agentDispatchGuide) + epsilon.md so callers know the contract (pair the transport-level seam with a referenced dispatch-contract rule, per CLAUDE.md lib-only-fix lesson)

**Event:** (fill)
**When:** (fill)
**Captured fields:** (fill)
**Linked requirement:** `R-5`
**Linked story:** `S-5`
**Why we capture this:** (fill)
