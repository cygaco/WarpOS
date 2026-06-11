<!-- requirement-format-legacy -->
# TRACE Requirements — Cross-family findings fix sprint — 6 gemini re-review findings (epsilon-runtime spawn race, fallback ENFORCE brick, hardcoded BUILD_CHAIN_ROLES, spoofed-ts window, sprint_id correlation, verifyGauntlet parse refusal)

**Sprint:** `SP-20260611-001`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260611-001\prd.md`

> TRACE captures the observability, traceability, event capture, decision
> logging, and requirement-to-code linkage layer.

## Trace Map

> One row per requirement area (R-1..R-N, single-source from plan_contract.requirement_areas,
> T-298). Fill in Ticket, Code, and Test columns during execution.

| Source | Requirement | Story | COPY | INPUT | ESD | Ticket | Code | Test | Release | Learning |
|---|---|---|---|---|---|---|---|---|---|---|
| crossfam-findings A.1 | R-1 | S-1 | C-1 | IN-1 | — | T-… | scripts/sprint/epsilon-runtime.js | epsilon-spawn-grace.test.js | — | — |
| crossfam-findings A.2 | R-2 | S-2 | C-2 | IN-2 | — | T-… | dispatch-shape/contract + dispatch-claude.js + §12.2 | review-fallback-shape.test.js | — | — |
| crossfam-findings A.3 | R-3 | S-3 | C-3 | IN-3 | — | T-… | scripts/dispatch-claude.js | build-chain-registry-gate.test.js | — | — |
| crossfam-findings B.4 + β two-site directive | R-4 | S-4 | C-4 | IN-4 | — | T-… | sprint-hook-coverage.js + sprint-manager-consult.js | window-clamp.test.js | — | — |
| crossfam-findings B.5 | R-5 | S-5 | C-5 | IN-5 | — | T-… | sprint-hook-coverage.js + sprint-manager-consult.js | sprint-id-correlation.test.js | — | — |
| crossfam-findings B.6 | R-6 | S-6 | C-6 | IN-6 | — | T-… | scripts/dispatch/gauntlet-verify.js | verify-gauntlet-parse.test.js | — | — |

## TR-1 — epsilon-runtime parent-timeout grace (R-1)

**Event:** existing death-record write (no new event)
**When:** child wrapper exits at its internal bound; parent backstop only after grace
**Captured fields:** existing record fields (elapsed_ms shows child-bound, not parent SIGTERM)
**Linked requirement:** `R-1`
**Linked story:** `S-1`
**Why we capture this:** a reaped child with a graceful death record is diagnosable; a parent-SIGTERM'd child is a silent no-record death — the grace makes the record win.

## TR-2 — review-fallback sanctioned-shape registration (R-2)

**Event:** completion record `shape` field + shape-evaluation advisory
**When:** every --review-fallback dispatch
**Captured fields:** shape, fallback:true, role, provider-origin
**Linked requirement:** `R-2`
**Linked story:** `S-2`
**Why we capture this:** the W2 flip audit needs to see sanctioned-lane dispatches resolving valid (not suppressed) before ENFORCE.

## TR-3 — registry-derived build-chain gating (R-3)

**Event:** refusal stderr (no record written on refusal — refusals are pre-spawn)
**When:** a build-chain-class role attempts --review-fallback or missing -w
**Captured fields:** role, registry class, refusal reason
**Linked requirement:** `R-3`
**Linked story:** `S-3`
**Why we capture this:** distinguishes registry-derived refusal from literal-Set refusal so the bypass closure is observable.

## TR-4 — spoofed-ts window clamp, two-site (R-4)

**Event:** discarded-outlier note in checker output/finding evidence
**When:** window derivation encounters a ts outside created_at ± cap
**Captured fields:** offending ts, sprint created_at, cap
**Linked requirement:** `R-4`
**Linked story:** `S-4`
**Why we capture this:** a planted-ts attack should be VISIBLE (discard note), not silently absorbed — the discard is itself a signal someone spoofed the log.

## TR-5 — sprint_id-preferring correlation (R-5)

**Event:** finding evidence names the correlation path (sprint_id vs legacy window)
**When:** backing-record correlation runs in either checker
**Captured fields:** correlation path used, sprint_id, record dispatch_id
**Linked requirement:** `R-5`
**Linked story:** `S-5`
**Why we capture this:** a red must be diagnosable to the failed path; a green must be attributable to a same-sprint record.

## TR-6 — verifyGauntlet parse refusal (R-6)

**Event:** thrown refusal (programmatic) / CLI error (unchanged)
**When:** unparseable since/until reaches verifyGauntlet
**Captured fields:** offending since/until values, named reason
**Linked requirement:** `R-6`
**Linked story:** `S-6`
**Why we capture this:** the silent degrade-to-whole-ledger was the forbidden path; the refusal must be loud and name the inputs.
