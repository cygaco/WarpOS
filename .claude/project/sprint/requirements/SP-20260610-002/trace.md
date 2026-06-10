<!-- requirement-format-legacy -->
# TRACE Requirements — Lane B — dispatch/registry coherence (WARPOS.md sweep 2026-06-10)

**Sprint:** `SP-20260610-002`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-002\prd.md`

> TRACE captures the observability, traceability, event capture, decision
> logging, and requirement-to-code linkage layer. The point of TRACE is
> to answer: why did this exist, where did the requirement come from,
> what changed because of it, what external dependency or approval was
> required, how was it tested, what shipped, and what should persist as
> a learning.

## Trace Map

| Source | Requirement | Story | COPY | INPUT | ESD | Ticket | Code | Test | Release | Learning |
|---|---|---|---|---|---|---|---|---|---|---|
| WARPOS.md sweep WG-2 | R-1 | S-1 | C-1 (none) | IN-1 | — | T-1 | 6 role specs + president/beta.md + _system/frontmatter-guide.md (source layer + regen) | re-grep `^model: inherit` = 0; role-parity-scan clean-tree pass | ff-merge (RI-001) | — |
| WARPOS.md sweep WG-2 | R-2 | S-2, S-3 | C-1 (none) | IN-1 | — | T-2, T-3 | scripts/checks/role-parity-scan.js | planted spec-model-mismatch + inherit + shape-vs-route fixtures (AC-2.1–AC-2.4, AC-3.3) | ff-merge (RI-001) | — |
| WARPOS.md sweep WG-5 | R-3 | S-3 | C-1 (none) | IN-2 | — | T-3 | .claude/agents/_org/dispatch-contract.json class_derivation.rules | design-lead-subprocess + claude-leads-still-manager fixtures (AC-3.1, AC-3.2) | ff-merge (RI-001) | — |
| WARPOS.md sweep WG-4 (operator-ratified doogle 2026-06-09) | R-4 | S-4 | C-1 (none) | IN-3 | — | T-4 | .claude/agents/president/epsilon.md + _system/guides/agent-dispatch-guide.md | grep doc-presence (AC-4.1–4.3); TR-1 live in next ε sprint | ff-merge (RI-001) | — |
| WARPOS.md sweep WG-6 (recurrence ×3 in doogle) | R-5 | S-4, S-5 | C-1 (none) | IN-3 | — | T-4, T-5 | epsilon.md stall-rules block + NEW scripts/checks/epsilon-liveness.js | evidence-without-record + clean + malformed-fail-closed fixtures (AC-5.1–5.3) | ff-merge (RI-001) | — |
| regen-both-manifests discipline (LRN-2026-06-05-source-vs-generated) | R-6 | S-1, S-5 | C-1 (none) | — | — | T-1, T-5 | _warpos sources + both manifests | scan:framework-views-fresh + BC-02/BC-05 green (AC-1.3, AC-5.4) | ff-merge (RI-001) | — |

## TR-1 — epsilon-conduct-route-selfcheck

**Event:** ε startup conduct-route self-check record (route = top-level Agent-tool vs teammate subprocess)
**When:** at ε startup, before conducting any phase — every ε activation (top-level or teammate-spawned)
**Captured fields:** active conduct route, spawn context (top-level vs teammate), sprint id, timestamp
**Linked requirement:** `R-4`
**Linked story:** `S-4`
**Why we capture this:** the WG-4 bug class was a documented conduct route the actual spawn context could not execute (ED-041); recording which route is live at startup makes route-vs-context mismatches observable instead of discovered mid-sprint.

## TR-2 — epsilon-stalled

**Event:** loud `epsilon-stalled` event emitted by `scripts/checks/epsilon-liveness.js` (fail-closed, non-zero exit)
**When:** when evidence files exist without a matching ledger record after N minutes (N decided at design, ~10 min); check runs report-only inside `/scan:full`
**Captured fields:** stale evidence path(s), expected ledger location, age vs threshold N, sprint id, timestamp
**Linked requirement:** `R-5`
**Linked story:** `S-5`
**Why we capture this:** the WG-6 stall class (conductor idle 25 min on returned work, recurrence ×3 in doogle) was operator-detected only; this event makes a stalled conductor self-detecting within N minutes per CLAUDE.md Policy & Enforcement Hygiene.
