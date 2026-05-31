<!-- requirement-format-legacy -->
# TRACE Requirements — _guides product-layer shipping + _planning reorg + ship-boundary enforcer

**Sprint:** `SP-20260531-002`
**PRD:** `.claude/project/sprint/requirements/SP-20260531-002/prd.md`

> Internal framework/tooling sprint — TRACE is light (no product runtime events). The load-bearing observability is the enforcer's own fail-closed exit + its surfacing in `scan:full`.

## Trace Map

| Source | Requirement | Story | COPY | INPUT | ESD | Ticket | Code | Test | Release | Learning |
|---|---|---|---|---|---|---|---|---|---|---|
| operator 2026-05-31 | R-1 | S-1/S-2/S-3 | C-1 | — | — | T-… | `_guides/`, `.claude/framework-manifest.json`, `_warpos/MANIFEST.json` | scan:warpos-ship-coverage | — | ED-012 closed |
| operator 2026-05-31 | R-2 | S-4 | — | — | — | T-… | `_planning/` | — | — | — |
| operator 2026-05-31 | R-3 | S-5/S-6 | C-1 | — | — | T-… | `scripts/checks/warpos-ship-coverage.js` | scan:full Tier 3 | — | ED-012 closed |

## TR-1 — ship-boundary-violation

**Event:** `warpos-ship-coverage` enforcer detects a boundary violation
**When:** the scan runs (manually, in QA, in `scan:full` Tier 3, or pre-release)
**Captured fields:** violating path(s); side (`must-ship-missing` | `must-not-ship-present`); exit code (non-zero)
**Linked requirement:** `R-3`
**Linked story:** `S-5`
**Why we capture this:** makes the framework/product ship boundary self-detecting instead of convention-only — closes ED-012.
