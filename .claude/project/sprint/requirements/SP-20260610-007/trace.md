<!-- requirement-format-legacy -->
# TRACE Requirements — E-DISPATCH-SHAPE-001 W1 — make availability and fallback real

**Sprint:** `SP-20260610-007`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-007\prd.md`

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
| W1 — make availability and | R-1 | S-1 | C-1 | IN-1 | — | T-… | — | — | — | — |
| W1 — make availability and | R-2 | S-2 | C-2 | IN-2 | — | T-… | — | — | — | — |
| W1 — make availability and | R-3 | S-3 | C-3 | IN-3 | — | T-… | — | — | — | — |
| W1 — make availability and | R-4 | S-4 | C-4 | IN-4 | — | T-… | — | — | — | — |

## TR-1 — G2: ONE recorded claude-fallback review lane (ledgered, gauntlet-verify-visible, trips cross_provider_required)

**Event:** (fill)
**When:** (fill)
**Captured fields:** (fill)
**Linked requirement:** `R-1`
**Linked story:** `S-1`
**Why we capture this:** (fill)

## TR-2 — G5: provider circuit breaker (provider-down.json, TTL, consult-before-spawn, fail-open)

**Event:** (fill)
**When:** (fill)
**Captured fields:** (fill)
**Linked requirement:** `R-2`
**Linked story:** `S-2`
**Why we capture this:** (fill)

## TR-3 — G4/N4: auth-posture surface (detectAuthTier content-parse, key(metered) vs oauth, envelope stamp)

**Event:** (fill)
**When:** (fill)
**Captured fields:** (fill)
**Linked requirement:** `R-3`
**Linked story:** `S-3`
**Why we capture this:** (fill)

## TR-4 — 3 planted tests (fallback-lane-seen / re-burn-blocked / metered-reads-metered) + wrapper goldens

**Event:** (fill)
**When:** (fill)
**Captured fields:** (fill)
**Linked requirement:** `R-4`
**Linked story:** `S-4`
**Why we capture this:** (fill)
