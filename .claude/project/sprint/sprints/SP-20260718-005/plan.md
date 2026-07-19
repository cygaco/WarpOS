# SP-20260718-005 — Phase 3: WorkOrder / ResultEnvelope (PLAN — to be parked at plan→design)

**Minted:** 2026-07-19 (WARPOS 1.0 Phase 3, per `_planning/warpos-1.0-plan/RATIFIED-PLAN.md` §Phase 3). **Minted by:** Epsilon3 (as the SP-20260718-004 close's final act). **State:** PLAN minted → β plan→design consult → PARK for a FRESH conductor to execute design→build.

## Objective
Adapt packet 06's WorkOrder/ResultEnvelope onto the EXISTING dispatch ledger (dispatch-completions + dispatch-record-fields + gauntlet-verify) — NO greenfield. Give every dispatch a schema-versioned, correlated, provenance-bound WorkOrder in and a trusted AcceptanceRecord out, so the propose→dispatch→gauntlet→acceptance→integration loop is auditable and un-forgeable end-to-end.

## Composition (for the ε registry runtime)
- **Unit types:** backend + security (dispatch control-plane schema; provenance validation; lease/claim mechanism).
- **Max risk:** HIGH — the irreversible outcome is a false ACCEPTANCE (a provider's self-authored `success` authorizing integration) or a stale/forged WorkOrder binding. Same non-dispositionable class as Phases 1-2's security-truth.
- **Domains:** routing / security / dispatch-control-plane.

## Scope (RATIFIED-PLAN Phase 3 — verbatim intent + lead-seeded)
1. **Minimum WorkOrder schema** (§5, D5, `workorder-min.schema.json`): schema version, correlation id, effective role/provider/model, immutable base commit + result-tree hash (NOT "worktree base = live_head" — enforce freshness separately), allowed capabilities+paths, retry lineage, evidence refs, 5 terminal states {success, partial, blocked, failed, cancelled}, `failure_reason` codes from packet-08's taxonomy (timeout/quota_exhausted/provider_unavailable/model_unavailable/auth_missing/worktree_base_stale = CLASSES not states).
2. **ED-218 — the ACTIVE `validated_workorder_or_cli` provenance validator** (the Phase-2 scope-line's deferred half): a WorkOrder schema validator AND an authority/provenance checker wired into every dispatch writer, ACTIVELY performing §3 P3.2's (a) schema + (b) authority checks, rejecting an unvalidated/self-asserted/merely-transited binding at dispatch time BEFORE it resolves a role. **α ruling (Phase-3 seed): KEEP the prompt-size floor (WG-10 hollow-prompt tripwire) AND add the required-semantics validation — belt+suspenders.**
3. **sol-A2 AcceptanceRecord** (the Phase 3/4 seam): the ResultEnvelope stays an UNTRUSTED execution report; a separate TRUSTED AcceptanceRecord (WorkOrder digest, exact base/tree/target ref, checker+policy digests, evidence digests, effective route/fallback, integration receipt) authorizes integration — a provider-authored `success` NEVER does.
4. **ED-069 started-row + ED-070 quota field wired into ALL dispatch writers as ONE coherent change**; fold `teammate-stall-rules.md` back into epsilon.md + agent-dispatch-guide.md (**ED-071**).
5. **Packet-07 mechanisms:** sprint **leases** (a sprint claims a lock so two sessions can't conduct the same SP-id) + a **do-not-reopen ledger** (settled decisions a resumed session must not re-litigate). **ED-228 conductor-lease/claim-file lands HERE** (β-ruled Phase-3) — with TWO clean manual executions now as the behavioral spec (Epsilon→Epsilon2, Epsilon2→Epsilon3 transfers).
6. **Packet-08 harvest as checklists (not code):** failure-classification taxonomy (incl. `model_unavailable` — predicted the harness-spawn bug class) + the reaper signal-ranking (never reap from process absence; 8 ranked signals) → Phase-3 conformance fixtures. Optional: `dispatch doctor --json`.
7. **F1 — wake-notification structural fix** (lead-seeded, PRIORITY): the teammate bg-dispatch re-wake seam dropped 9+ completions this session (overwhelming data). A robust completion signal + the fire-and-poll doctrine is load-bearing for the dispatch control plane.
8. **Worktree-base:** declare an explicit immutable base commit (consult) AND assert freshness against the integration head for dependent builders (packet-08) — both.
9. **Carried debt this sprint owns:** **ED-232** cross-session key-distribution DESIGN (fits WorkOrder/Envelope's cross-boundary trust domain naturally — the AcceptanceRecord IS a cross-session trust artifact; α-routes the mechanism, ε drafts options); **ED-221 Option-2 implementation** (the tracked cited-ED registry + sync-drift lint — ADR-0026 ratified); the **Unit-B instruction-projection follow-up** (SP-004's deferred G2.2 generator — deferred-with-scope-note, honest-accounting).

## Exit gates (Phase 3, per RATIFIED-PLAN §Gates)
- **G3.1** schema suite: 5 terminal states + failure_reason codes.
- **G3.2** prompt-size floor AND required-semantics both enforced; hollow-prompt fixture fails closed.
- **G3.3** ED-069 started-row + ED-070 quota wired in ALL dispatch writers as one change; regression green.
- **G3.4** leases + do-not-reopen live (two-sessions-same-SP fixture BLOCKS with fencing tokens; SIMULTANEOUS-acquisition race fixture; do-not-reopen requires explicit SUPERSESSION, not advisory surfacing; resumed-session re-litigation surfaces the ledger).
- **G3.5** tracker-fidelity probe wired into /scan:full (ED-056 recurrence class; field-level ground-truth authority map; consistent-snapshot semantics; mismatches BINDING at Phase-3 exit).
- **G3.6** ED-071 fold-back done.
- **G3.7** immutable base commit AND freshness assertion; stale-base fixture red→green (head-advanced-after-check REFUSES — no check→merge TOCTOU).
- **G3.8** packet-08 reaper-ranking fixtures (process-absence-only reap REFUSED).
- **G0.3 conformance runner flips BINDING at Phase-3 exit** (ED-214) — never a silent default.

## FOLDED LESSON (binding at design — SP-004 retro proposal 1, the compound signal)
**Phase 3 is the SAME "reader trusts a record" shape as Phases 1-2 (ED-218 provenance validator + the AcceptanceRecord + the field-set validator all gate an irreversible action on a record).** It WILL hit the multi-round-same-class fail-open pattern (now 3× across SP-002/003/004). Apply the **DESIGN-PHASE RECORD-TRUST GATE at design, BEFORE build**: for every path where a reader trusts a record/field to gate integration/dispatch/acceptance, (a) name the SINGLE choke-point + a STRUCTURAL guard that fails any new un-routed reader (the verified-liveness-read / provenance-verifier pattern), and (b) ship adversarial fail-open FALSIFIER fixtures (forged / unsigned / stale-base / self-asserted-success MUST block) as REQUIRED-PRESENT before design closes. This converts the 6-round gauntlet hunt into a pre-gauntlet checklist. (SP-004 spent 6 rounds discovering the guard the gauntlet should not have had to find.)

## Do-not-reopen (carried)
SP-004's dispositions (derived-not-settable spine; the same-session-vs-cross-session signature boundary; the R3 cross-session-false-RED revert; ED-229 regex-guard AST ceiling as named-residual-not-grind); the 2026-07-17 role-binding split; the dropped-from-1.0 packets (02/09/10/11/12); adversarial-helm containment DROPPED.

## β forward note (Phase-3 plan-lock preview, 2026-07-19 — β will fold at the plan→design boundary)
Phase 3 inherits the SP-004 identity/attestation arc DIRECTLY — each item is where the durable spine applies again, NOT a fresh problem:
- **ED-218** = the spawn-provenance validator: the "was-this-spawn-LEGITIMATE" layer ABOVE Phase-2's "worker-can't-forge-its-role". Same derived-not-settable / origin-proof discipline, one layer up.
- **ED-228** (conductor-lease) = REUSE the Phase-2 derived-not-settable binding machinery (β plan-lock rider) — conductor-authority IS a derived binding + claim-file; do NOT build a parallel mechanism. Two clean manual transfers this session are the behavioral spec.
- **ED-232** (cross-session key-distribution) = the account-ceiling residual + the re-correlation that touches the BLOCKING coverage-gate (priority); the AcceptanceRecord is itself a cross-session trust artifact — the natural home for the key-distribution DESIGN (α-routes the mechanism, ε drafts).
- **F1** (wake-seam) = the dispatch-control-plane liveness signal.
The pattern worth keeping (β): the code-grounded review was possible because the design gave real STRUCTURAL invariants to check (a worker that can't set its role; a guard that fails an un-routed reader) rather than claims on faith. Design Phase-3 the same way — structural invariants + the record-trust gate above.

## β plan→design VERDICT — DECIDE B/0.89, OPEN_ADR (2026-07-19, FOLDED for the fresh conductor — CONSUME, do NOT re-consult)
β ruled PROCEED to design (record-trust gate is the right meta-move; composition faithful; no re-consult unless a NEW irreversible risk surfaces). Load-bearing deltas the fresh conductor MUST fold at design:

**TWO GATE-GAPS to close before design-lock (aspirational-vs-enforced trap — named-priority items left without a binding gate):**
- **GAP-1 (the big one) — the AcceptanceRecord needs its OWN numbered exit gate (G3.9).** It is the sprint's HIGHEST-risk mechanism (the irreversible false-acceptance class: a provider `success` NEVER authorizes integration) but appears only in the folded-lesson falsifier list. Gate: self-asserted-success BLOCKS; only a trusted AcceptanceRecord (WorkOrder digest + exact base/tree/TARGET ref + checker/policy digests + evidence digests) authorizes integration; with the SHARP-2(a) target-mismatch falsifier.
- **GAP-2 — F1 wake-notification needs an exit gate (G3.10).** Flagged PRIORITY (9+ dropped re-wakes) but no binding gate. Gate: a no-dropped-re-wake fixture (a bg-dispatch completion is reliably signaled/re-woken; process-absence is NOT the signal — ties to G3.8 reaper-ranking).

**THREE SHARPENINGS to the design-phase record-trust gate:**
- **SHARP-1 — COMPLETE + PARTITION the record-trust surface enumeration (P-057).** Phase 3 has MORE than the 3 named paths, and they SPLIT by session-scope. SAME-SESSION (per-session HMAC works): WorkOrder/dispatch validators. CROSS-SESSION (HMAC does NOT — the R3 false-RED): the AcceptanceRecord, the LEASE/fencing-token, the DO-NOT-REOPEN ledger. The gate must enumerate ALL and STRUCTURALLY partition same-vs-cross-session (the SP-004 liveness-guard exemption pattern — reviewed code-allowlist keyed by the structural property, NEVER a settable marker). Cross-session artifacts use the ED-232 mechanism OR an atomic-FS primitive (leases), never per-session signing — or Phase 3 re-hits the R3 cross-session-false-RED.
- **SHARP-2 — COMPLETE the falsifier set (3 required-present additions):** (a) RE-CORRELATION / target-mismatch — a VALID signed AcceptanceRecord for target A presented to integrate target B → BLOCK (closes ED-232's residual at HIGHER stakes: it authorizes INTEGRATION); (b) STALE/SUPERSEDED LEASE — a conductor acting under an expired/superseded lease (the late-firing-prior-conductor case) → its writes REFUSED; (c) NON-SUCCESS-TERMINAL-AS-SUCCESS — a partial/blocked/failed WorkOrder whose ResultEnvelope claims success → AcceptanceRecord does NOT authorize (only a terminal `success` + valid AcceptanceRecord does).
- **SHARP-3 — the gate itself needs a NAMED ENFORCER (else hollow-ladder-rung).** Wire the record-trust gate into the design→build EXIT as a BLOCKING checklist: each enumerated record-trust path must NAME its choke-point AND the required-present falsifier fixtures must EXIST (named test files) AND fail-closed. A missing falsifier BLOCKS build-entry — convert the checklist from discipline to enforcement.

**CROSS-SESSION LEASE CATCH (ED-228, β's confirmed Phase-3 ruling):** the conductor-lease is a CROSS-SESSION record-trust → its fencing token inherits the ED-232 cross-session problem (per-session HMAC can't verify another session's claim). Build the lease on an ATOMIC-FS primitive (O_EXCL create / atomic rename + a monotonic fencing token the next acquirer checks), NOT signing; REUSE the Phase-2 derived-not-settable binding machinery for conductor-authority (no parallel mechanism). G3.4's fencing tokens must be cross-session-valid + the SHARP-2(b) superseded-lease falsifier binds it.

**MINOR:** the G0.3/ED-214 binding flip must be gated on ALL conformance fixtures GREEN first (flipping a default reds everything that passed under report-only — the SP-20260627 sweep-in-sprint lesson).

**β also carried the earlier forward note** (ED-218 = spawn-provenance one layer up; ED-228 = reuse the derived binding machinery; ED-232 = the AcceptanceRecord is the cross-session trust home; F1 = the dispatch-control-plane liveness signal — see the β forward note above). Do-not-reopen honored in full.

## PARK
**STATE: PARKED at the plan→design boundary — β verdict FOLDED above (DECIDE B/0.89), consumable without re-consult.** β plan→design consult sent; a FRESH conductor consumes the verdict (no re-consult unless a NEW irreversible risk surfaces) and executes design→build. Seeded EDs: ED-218, ED-069/070/071, ED-228, ED-232, ED-221 (Option-2), ED-214 (G0.3 binding flip), ED-215 (Phase-4 dependency). Prior-phase close: SP-20260718-004 (Phase 2) COMPLETE + MERGED @ e768e5c6 (2026-07-19); retro at `.claude/project/sprint/sprints/SP-20260718-004/retro.md`.

## β PLAN→DESIGN VERDICT (rendered 2026-07-19 ~04:32Z, folded by α — the park is verdict-COMPLETE; consume, do NOT re-consult unless a NEW irreversible risk surfaces at design)

**DECIDE B / 0.89 — PROCEED to design. OPEN_ADR: true. FORWARD-LOADED.** The record-trust gate is WELL-FORMED. β re-litigates no do-not-reopen item; ED-228-in-Phase-3 confirmed. Load-bearing deltas (BINDING at design):

**TWO GATE-GAPS to close BEFORE design-lock (the aspirational-vs-enforced trap):**
- **GAP-1 — AcceptanceRecord needs its OWN numbered binding exit gate** (it is the sprint's HIGHEST-risk mechanism: a provider `success` NEVER authorizes integration). Gate shape: self-asserted-success BLOCKS; only a trusted AcceptanceRecord (WorkOrder digest + exact base/tree/TARGET ref + checker/policy/evidence digests) authorizes; + a target-mismatch falsifier. A falsifier bullet alone is not a gate.
- **GAP-2 — F1 wake-notification (PRIORITY) needs an exit gate**: a no-dropped-re-wake fixture (process-absence is NOT the signal; ties to G3.8 reaper-ranking).

**THREE SHARPENINGS to the record-trust gate:**
1. COMPLETE + PARTITION the trust-surface enumeration: same-session (HMAC works: WorkOrder/dispatch validators) vs cross-session (HMAC does NOT — the R3 false-RED class: AcceptanceRecord, lease/fencing-token, do-not-reopen ledger). STRUCTURAL partition, never a settable marker.
2. ADD three required-present falsifiers: re-correlation/target-mismatch; stale/superseded-lease; non-success-terminal-recorded-as-success.
3. The gate itself needs a NAMED ENFORCER wired into the design-EXIT (a missing falsifier BLOCKS build-entry) — else it is a hollow ladder rung.

**CROSS-SESSION LEASE CATCH (ED-228):** build the conductor-lease on an ATOMIC-FS primitive (O_EXCL / atomic-rename + monotonic fencing token), NOT per-session signing; REUSE the Phase-2 derived-not-settable machinery for conductor-authority (β plan-lock rider — no parallel mechanism).

**MINOR:** gate the G0.3/ED-214 binding flip on ALL conformance fixtures GREEN first (flipping a default reds everything that passed report-only).
