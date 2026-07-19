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

## PARK
**STATE: to be PARKED at the plan→design boundary.** β plan→design consult sent; a FRESH conductor consumes the verdict (no re-consult unless a NEW irreversible risk surfaces) and executes design→build. Seeded EDs: ED-218, ED-069/070/071, ED-228, ED-232, ED-221 (Option-2), ED-214 (G0.3 binding flip), ED-215 (Phase-4 dependency). Prior-phase close: SP-20260718-004 (Phase 2) COMPLETE + MERGED @ e768e5c6 (2026-07-19); retro at `.claude/project/sprint/sprints/SP-20260718-004/retro.md`.
