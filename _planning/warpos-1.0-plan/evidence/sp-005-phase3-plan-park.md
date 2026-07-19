# SP-20260718-005 — Phase 3 PLAN PARK handoff (fresh-conductor entry point)

**Parked:** 2026-07-19 (SP-20260718-004 Phase-2 close session, Epsilon3 — plan-mint as the close's final act). **State:** PLAN minted + β plan→design DECIDE B/0.89 (OPEN_ADR) → **PARKED at the plan→design boundary.** A FRESH conductor executes design→build.

## Fresh-conductor entry (do this, in order)
1. Read the full plan: `.claude/project/sprint/sprints/SP-20260718-005/plan.md` (objective, composition, scope 1-9, exit gates G3.1-G3.8 + G0.3 binding flip, seeded EDs, the FOLDED-LESSON record-trust gate, do-not-reopen).
2. **Consume the β plan→design VERDICT — it is FOLDED INTO plan.md** (the "β plan→design VERDICT — DECIDE B/0.89" section + the "β forward note" section). **No re-consult** unless a NEW irreversible risk surfaces (β's terminal instruction). The verdict is ALSO in `paths.betaEvents` — but it is durable in the tracked plan.md (the ED-221 split-durability lesson: don't leave load-bearing verdict content only in the machine-local betaEvents).
3. Enter design (author PRD/build_spec via product-lead/DoE/quality-lead per the ε registry). Then build → gauntlet → release → retro.

## The load-bearing β rulings (DO NOT drift — folded in plan.md)
- **PROCEED to design; the record-trust gate is the right meta-move.** Phase 3 IS the "reader trusts a record" class 3× over (SP-002/003/004) — front-load the STRUCTURAL gate as a pre-gauntlet checklist so Phase 3 does not spend 6 rounds discovering the guard the gauntlet finds.
- **TWO GATE-GAPS to close before design-lock:** GAP-1 the AcceptanceRecord needs its OWN numbered exit gate (the sprint's highest-risk mechanism — a provider `success` NEVER authorizes integration); GAP-2 F1 wake-notification needs an exit gate (no-dropped-re-wake fixture; process-absence is not the signal).
- **THREE SHARPENINGS:** (1) COMPLETE + STRUCTURALLY PARTITION the record-trust surface same-session (HMAC works) vs cross-session (HMAC does NOT — the R3 false-RED: AcceptanceRecord/lease/do-not-reopen-ledger); (2) ADD 3 required-present falsifiers (re-correlation/target-mismatch, superseded-lease, non-success-terminal-as-success); (3) the gate needs a NAMED ENFORCER wired into the design-EXIT (a missing falsifier BLOCKS build-entry).
- **CROSS-SESSION LEASE (ED-228):** build on an ATOMIC-FS primitive (O_EXCL / atomic-rename + monotonic fencing token), NOT per-session signing; REUSE the Phase-2 derived-not-settable machinery for conductor-authority.
- **MINOR:** gate the G0.3/ED-214 binding flip on all conformance fixtures GREEN first.

## Do-not-reopen (carried)
SP-004's dispositions (derived-not-settable spine; the same-session-vs-cross-session signature boundary + the R3 cross-session-false-RED revert; ED-229 regex-guard AST ceiling = named-residual-not-grind); the 2026-07-17 role-binding split; the dropped-from-1.0 packets (02/09/10/11/12); adversarial-helm containment DROPPED; ED-228-in-Phase-3 (β-confirmed).

## Prior sprint (context, not scope)
SP-20260718-004 (Phase 2: Identity + host portability) — COMPLETE + MERGED @ `e768e5c6` (2026-07-19). Retro: `.claude/project/sprint/sprints/SP-20260718-004/retro.md` (the multi-round-same-class → structural-guard pattern is now 3×; the design-phase record-trust gate is the process fix, applied here). Named residuals carried: ED-232 (cross-session key-distribution + correlation-selector signing — priority; touches the blocking coverage-gate), ED-229 (regex→AST guard completeness), ED-221 Option-2 (ADR-0026 ratified), the Unit-B instruction-projection follow-up.
