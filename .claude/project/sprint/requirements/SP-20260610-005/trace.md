<!-- requirement-format-legacy -->
# TRACE Requirements — E-DISPATCH-INTEGRITY-001 F-1+F-3 — coverage-honesty (kill telemetry-only false-greens)

**Sprint:** `SP-20260610-005`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-005\prd.md`

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
| F-1 — kill telemetry-only false-green (manager consult) | R-1 | S-1 | C-1 (none) | IN-1 | — | T-300 | — | — | — | — |
| F-1 — kill telemetry-only false-green (hook coverage) | R-2 | S-1 | C-1 (none) | IN-1 | — | T-300 | — | — | — | — |
| F-3 — gauntlet-verify correlation + whole-ledger refusal | R-3 | S-2 | C-1 (none) | IN-2 | — | T-301 | — | — | — | — |
| F-1+F-3 — legacy cutoff + caller compatibility | R-4 | S-1, S-2 | C-1 (none) | IN-1, IN-2 | — | T-300, T-301 | — | — | — | — |

## TR-1 — manager-consult record-backed coverage (F-1)

**Event:** per-consult coverage verdict emitted by `scripts/checks/sprint-manager-consult.js` (covered / NOT-covered / legacy-exempt), naming the backing completion record or its absence.
**When:** every scan run (standalone and under `/scan:full`), per sprint × consult point evaluated.
**Captured fields:** sprint_id, consult point/phase, telemetry record ref (`manager_consult`), backing completion record ref + its `ok` flag, verdict, legacy-exempt flag.
**Linked requirement:** `R-1`
**Linked story:** `S-1`
**Why we capture this:** a green verdict must carry the PROOF (the `ok:true` record id) so an auditor can distinguish "manager ran" from "telemetry was emitted" — the RC-2 sprint-theater class becomes auditable, not just blocked.

## TR-2 — hook-coverage record-backed predicate (F-1)

**Event:** per-hook-point coverage verdict emitted by `scripts/checks/sprint-hook-coverage.js` under the same record-backed predicate.
**When:** every scan run (standalone and under `/scan:full`), per sprint × hook point evaluated.
**Captured fields:** sprint_id, hook point, telemetry record ref, backing `ok:true` completion record ref, verdict, legacy-exempt flag.
**Linked requirement:** `R-2`
**Linked story:** `S-1`
**Why we capture this:** the same predicate applied to the second coverage surface — both scans must cite the same record class or the false-green class survives on the unwired scan.

## TR-3 — gauntlet-verify sprint_id/window correlation + whole-ledger refusal (F-3)

**Event:** gauntlet-verify outcome record — verify-pass / verify-fail (no correlated record) / REFUSED (unbounded invocation, exit non-zero with usage guidance).
**When:** every `scripts/dispatch/gauntlet-verify.js` invocation (epsilon-runtime gauntlet phase, sprint-close paths).
**Captured fields:** sprint_id argument, window bounds (since/until), matched record count, matched record id(s) + `ok` flag + elapsed/bytes, refusal reason when unbounded.
**Linked requirement:** `R-3`
**Linked story:** `S-2`
**Why we capture this:** the refusal and the correlation parameters are the evidence that NO verify ran unbounded — a historic `ok:true` greening a never-ran lane (the T3 incident, RC-4/G4) is detectable from the ledger itself.

## TR-4 — legacy cutoff exemption + caller compatibility

**Event:** legacy-exemption application (coverage scans waiving a pre-cutoff sprint) and caller-audit result (call sites passing sprint_id/window after the CLI-contract change).
**When:** exemption — each scan run that touches a sprint dated before 2026-06-10; caller audit — once at T-301 landing (grep evidence in the ticket/commit).
**Captured fields:** sprint_id, sprint date vs cutoff (2026-06-10), exemption-applied flag; caller audit: call-site list (epsilon-runtime, sprint close), flags passed.
**Linked requirement:** `R-4`
**Linked story:** `S-1`, `S-2`
**Why we capture this:** the exemption must be loud (a named waiver, not silence) so it cannot become a bypass; the caller audit is the compat proof that the gauntlet-verify contract change broke no consumer (epic risk note + payload complexity driver #2).
