<!-- requirement-format-legacy -->
# TRACE Requirements — scan:warpos-layer-diff — product-vs-dev-tooling layer diff report

**Sprint:** `SP-20260531-003`
**PRD:** `.claude/project/sprint/requirements/SP-20260531-003/prd.md`

> Internal observability tooling — TRACE is light (read-only scan; no runtime events). The "observability" IS the report itself.

## Trace Map

| Source | Requirement | Story | COPY | INPUT | ESD | Ticket | Code | Test | Release | Learning |
|---|---|---|---|---|---|---|---|---|---|---|
| operator 2026-05-31 | R-1 | S-1 | C-1 | IN-1 | — | T-… | `scripts/checks/warpos-layer-diff.js` | QA (manual) | — | sibling of ED-012 |
| operator 2026-05-31 | R-2 | S-2 | C-1 | — | — | T-… | `.claude/commands/scan/warpos-layer-diff.md` | skill catalog | — | — |
| operator 2026-05-31 | R-3 | S-3 | — | — | — | T-… | manifests | scan:full | — | — |

## TR-1 — layer-diff-report

**Event:** maintainer runs `/scan:warpos-layer-diff` (or `--json`)
**When:** on demand (manual)
**Captured fields:** product_layer[] (framework-owned + shipped), dev_tooling_layer[] (framework-owned + not shipped), summary counts
**Linked requirement:** `R-1`
**Linked story:** `S-1`
**Why we capture this:** makes the framework/product layer split observable at a glance — the read-only complement to SP-20260531-002's fail-closed ship boundary.
