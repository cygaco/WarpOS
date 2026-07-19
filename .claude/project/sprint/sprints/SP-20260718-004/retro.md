# SP-20260718-004 — Retro (Phase 2: Identity + host portability)

**Merged:** main @ `e768e5c6` (2026-07-19). **Conductor:** Epsilon3. **ops-analyst** cross-cycle synthesis + ε dispositions. β release-record DECIDE B/0.91 (code-verified the env-vector rider + the guard's teeth).

## Cross-cycle pattern (now 3×, threshold crossed)
**Multi-round-same-class fail-open → consolidate-to-structural-guard.** SP-002 (convergence) · SP-003 (7 rounds → provenance-verifier choke-point + provenance-invariants guard, ED-225) · SP-004 (6 rounds → verified-liveness-read choke-point + liveness-read-choke-point guard, ED-232). Identical shape each time: N readers independently trust a settable/forgeable field to gate an irreversible action; per-reader patching recurs every round; ONE choke-point + a structural guard that FAILS any new un-routed reader is the only recurrence-stopper (the SP-004 guard found readers the round-by-round hunt hadn't reached — scripts/ root, sibling paths).

**Root process gap:** that guard is DISCOVERED by the gauntlet, not designed up-front. Design-phase unit tests were positive-only; the cross-provider gauntlet acted as the adversarial-fixture generator across 6 rounds (R1 fail-open bindings → R6 sibling-path reader) — 6 rounds of spend to surface fail-opens a design-time audit + negative fixtures would front-load.

## Proposals (dispositioned)
1. **[Class B → Phase-3 plan input + α ADR candidate] Design-phase "record-trust surface" gate.** Any feature where a reader trusts a record/field to gate an irreversible/security action MUST at DESIGN time (a) name the single choke-point + a structural guard that fails un-routed readers, and (b) ship adversarial fail-open falsifier fixtures (forged/unsigned/unbound X MUST block) BEFORE build. Converts the 6-round hunt into a pre-gauntlet checklist. **Disposition:** FOLDED into the SP-20260718-005 (Phase 3) plan as a binding design-phase gate — Phase 3's ED-218 WorkOrder provenance validator + ED-217 field-set validator are the SAME "reader trusts a record" shape (the compound signal), so this is applied there BEFORE its gauntlet. Also flagged as an α ADR candidate (a standing framework rule).
2. **[Class B → tracked debt, OPEN_ADR] Shared AST/dataflow guard lib.** The regex→AST guard ceiling is now 2× (ED-229 delegation-guard, ED-232(C) liveness-guard) — same undecidable residual. Do NOT grind the regex (SP-004 proved it: broadening → 26 false positives). Track as ONE cross-cutting "shared AST/dataflow guard lib (acorn/babel)" debt vs per-sprint re-derivation; adds a parser dep → α-ruled OPEN_ADR. Deferred defense-in-depth, not urgent. **Disposition:** tracked (ED-229/ED-232 name it); α ADR when a Phase touches it.
3. **[Class A — already implemented, stated as hygiene] Cross-session exemption discipline.** The R3 false-RED lesson generalized: forcing verification on a cross-session-by-construction reader is as bad as a false-green — exemptions must be CODE-allowlisted with a structural reason + a stale-exemption self-policing belt, NEVER a settable per-record marker. Implemented in liveness-read-choke-point.js; recorded as a standing hygiene rule.

**No Class C** (strategic trust-model items — cross-session key-distribution ED-232(A), the per-session-secret same-account ceiling ADR-0025 — are already α-routed / accepted-ceiling; no halt).

## Compound signal (predict, don't react)
Phase 3 (ED-218 WorkOrder provenance validator + ED-217 field-set validator) is the SAME "reader trusts a record" shape → it WILL hit this class. Proposal 1 is applied to Phase 3 at design time, before its gauntlet.

## Data
6 cross-provider gauntlet rounds, findings converging every round; every round caught a REAL fail-open the green unit tests missed (gauntlet-catches-what-green-gates-miss held again on a HIGH-risk sprint). Fix-cycle-limit + recurring-same-class → scope-reckoning escalation to α/β (not more patching); the reconciled α/β split (β's falsification lane won the same-session-readers call on a security-mandatory surface). Evidence: `runtime/sp004-gauntlet/` (all lane out-files + prompts, rounds 1-6).
