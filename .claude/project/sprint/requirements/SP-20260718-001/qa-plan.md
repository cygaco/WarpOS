# SP-20260718-001 Phase 0 — qa-plan (Quality Lead consult)

**Author:** quality-lead (in-process consult, opus), design step. **Seed principle:** Product Priority over Severity — here "product" = the contract's fitness to make trust/binding decisions SELF-DETECTING. Golden Path (deepest coverage) = the lint fail-closing on its own malformed input + CORE invariants being non-waivable. Enforcer exit convention: **0** clean · **1** policy FAIL · **2** fail-closed/structural.

## 1. Per-gate verification (packet-14 named-command shape)
- **G0.1 contract-lint** — `node scripts/checks/contract-lint.js`. Expect **exit 0** on the final contract: every policy block names `Enforcer:` or an ED; every `Enforcer:` ref resolves to a script that EXISTS AND RUNS; every cited ED EXISTS in `paths.enforcementDebt`; CORE invariants carry a real enforcer (ED escape-hatch refused).
- **G0.2** — ADR committed (`git log --oneline -- <adr-path>` non-empty) + `node scripts/checks/doc-ref-integrity.js` (/scan:references) **exit 0**.
- **G0.3 conformance-matrix** — `node scripts/checks/conformance-matrix.js --report-only`. Expect **exit 0 report-only** (BINDING deferred to Phase-3 exit under ED-214); kernel IN/OUT line (H-4) present; fixture count > 0.
- **G0.4** — exact-string grep of the H-1 DoD sentence in the contract; expect FOUND.

## 2. Acceptance criteria (verified_by)
| AC | Deliverable | Assertion | verified_by |
|----|----|----|----|
| AC-1 | D1/G0.1 | every policy block names Enforcer\|ED | `contract-lint.js` exit 0 |
| AC-2 | G0.1 sol-Q2 | Enforcer refs resolve (script exists+runs) | `contract-lint.js` resolve-check |
| AC-3 | G0.1 sol-Q2 | cited EDs exist in ledger | lint cross-check vs `enforcementDebt` |
| **AC-4 (R1)** | G0.1 fail-closed | lint fed malformed / unresolvable-ref / missing-ED exits NON-ZERO AND labels a lint error, never clean pass (structural→exit 2, distinct from policy-FAIL exit 1) | neg fixtures `fixtures/contract-lint/{malformed,unresolvable-ref,missing-ed}.*` → assert non-zero + distinct code |
| AC-5 | G0.1 CORE | CORE invariant with only-an-ED (no live enforcer) = FAIL | neg fixture `core-waived-by-ed.*` → exit 1 |
| AC-6 | D2/G0.2 | ADR committed + references clean | `git log` + /scan:references |
| AC-7 | D4/G0.3 | runner executes report-only, IN/OUT line present | `conformance-matrix.js --report-only` |
| AC-8 | D6/G0.3 | fixture count nonzero | runner count assertion |
| **AC-9 (R3)** | D6/D4 positive coverage | ≥1 fixture bound per CORE invariant AND per in-kernel-scope matrix cell; qa-reviewer TRACEABILITY lane asserts each CORE invariant has ≥1 bound fixture | `conformance-matrix.js --coverage` + traceability lane |
| AC-10 | D8/G0.4 | DoD preamble verbatim | exact-string grep |
| AC-11 | D3 | precedence graph: UNBOUND→fail-closed; repo-prose-cannot-bind | fixture `unbound-dispatch.*` fails closed |
| AC-12 | D5 | WorkOrder minimal field set is a lint-covered policy block | `contract-lint.js` |
| AC-13 | D7 | retention classes = archive-not-delete; raw-history-never-destroyed | lint + cross-ref `retention.js` D-1 |

## 3. CORE invariants (non-waivable — ED escape-hatch unavailable; enumerate in contract §7)
- **CORE-1** UNBOUND → fail-closed (dispatched workers never default to President).
- **CORE-2** provider-independent TRUSTED layer SOLELY owns capability grants, protected mutation, verification, integration-to-main.
- **CORE-3** repo prose can NEVER manufacture a binding (only validated WorkOrder/CLI or explicit top-level runtime binding).
- **CORE-4** raw history NEVER destroyed — retention = archive-not-delete (retention.js D-1).
- *(Candidate, contract-author's call:* durable on-disk state is the source of truth, not chat memory — the D2 doctrine. Recommend CORE if the contract asserts it as an invariant.)

## Runnability flags
- **G0.3 binding is NOT runnable-binding in P0 — report-only under ED-214** (BINDING from Phase-3 exit; never a silent default). Compliant.
- **G0.1 bootstrap caveat (β trust-ordering):** the lint is deliverable AND gate and self-hosts (dogfoods its own policy blocks). It runs as a self/CI check; it is NOT independently trusted until Phase-4 G4.1 re-validates gate dependencies from the pinned checker. Flag in the P0 exit record; not a P0 blocker.
- **CORE designation is the load-bearing precondition** for AC-5 + AC-9 — the contract author MUST enumerate CORE invariants or those two ACs lose their anchor.
