# ADR 0013 — Two dispatch gates, one authority each: the shape-door (canonical pick) + the contract gate (full contract), with defined precedence

**Status:** accepted

**Date:** 2026-06-16

## Decision

The dispatch path has **two** gates, each enforcing by default, with **distinct, mostly non-overlapping
authority** and a **defined precedence**:

1. **The shape-door** (`dispatch-shape.js#shapeDoor`, exit **2**) — the **canonical-PICK** gate. "Is the
   actual shape the one the resolver picks for this role?" Refuses a high-severity mismatch
   (unproven-subprocess / build-chain-in-process).
2. **The contract gate** (`dispatch-contract.js#validateDispatch`, exit **1**) — the **full dispatch-CONTRACT**
   gate. Checks a **strictly larger** surface: `forbidden_shapes`, the **api-when-CLI rule** (operator
   failure ii), **build-chain→NOT-in-process** verified directly against the role-registry (iii),
   **cwd-worktree-required** (build-chain isolation), `tool_id` match, and **mode-narrowing** intersection.

Both are flipped to **enforce-by-default** (W2). The contract gate's flip is governed by the shared
`contractEnforceMode(wrapperKey, env)` helper with escapes mirroring the shape-door (per-wrapper /
fleet / master kill). The DoD's separate "dispatch-contract ENFORCE flip" item is **SATISFIED BY
FLIPPING IT** — it is a real, distinct gate, not redundant with the shape-door.

## Context

When the shape-door became "THE shape-enforce authority" (§16.9) and was flipped to enforce, the
question arose: is the *separately-planned* dispatch-contract enforce flip now redundant — supersede it?
α's first lean was supersede. **β (DECIDE 0.87) read `validateDispatch` in full and refuted the
redundancy premise:** the two gates overlap on **exactly one axis** (the canonical shape); everything
else `validateDispatch` checks (api-when-CLI, in-process-hard, cwd, forbidden_shapes, mode-narrowing)
has **no shape-door analog**. The shape-door's `actualShape` is only ever
`subprocess-claude`/`subprocess-cross-provider` — it never even evaluates an `api` proposal, so the
operator's **fundamental CLI-vs-API rule (ii)** would be enforced by **nothing** if the contract gate
stayed report-only. Superseding would convert built, operator-named safety checks into
permanently-deferred-on-redundancy-grounds — a deferral dressed as a decision (P-064).

## Options considered

1. **Supersede** — keep `validateDispatch` report-only as a secondary advisory; let the shape-door be
   the sole enforced gate.
2. **Flip** — enforce both; the contract gate is the non-overlapping authority.

## Why option 2 (flip) won

The redundancy premise is **false on the merits** (β verified in code). The single overlapping axis is
intentional belt-and-suspenders on the highest-value invariant (the same pattern as `scan:model-chain`
deliberately mirroring `scan:role-parity`). And the flip is **safe-by-construction against the
double-refuse** α feared: the two gates exit **different codes** (1 vs 2), and the **contract-consult
runs BEFORE the shape-door** in both wrappers — so on the one overlapping axis the contract refuses
first (exit 1) and the door never runs. The door's exit-2 teeth then bite only the cases the contract
**passed** — e.g. a wrapper whose hardcoded `actualShape` drifted from its own resolver — which the
contract does not model. Two authorities, defined precedence, no collision.

## Risks

- The `api-when-CLI` check is **dormant today** — no wrapper currently proposes `shape='api'`, so that
  branch is not catching live violations. Enforcing it is cheap insurance that arms the operator's (ii)
  rule for the day a raw-API caller appears — but it must NOT be claimed as an active catch (same honesty
  as the model-chain green-state note).
- A `validateDispatch` false-positive would now refuse a legitimate dispatch. Mitigated: the consult is
  in a fail-OPEN try/catch (a contract-read error never refuses), safe-by-construction was verified (a
  real cross-provider reviewer passes; a build-chain-via-cross-provider violation refuses), and a
  cross-family gauntlet backstops the flip.

## Mitigations / escapes

Per-wrapper `WARPOS_DISPATCH_CONTRACT_ENFORCE_<WRAPPER>=report`, fleet
`WARPOS_DISPATCH_CONTRACT_ENFORCE=report`, master `WARPOS_DISABLE_SHAPE_DOOR=1` (disables BOTH gates).
Legacy `WARPOS_DISPATCH_CONTRACT_ENFORCE=block` still enforces (now the default).

## Reversal plan

Set `WARPOS_DISPATCH_CONTRACT_ENFORCE=report` (fleet) to return the contract gate to advisory without a
code change; or revert `contractEnforceMode` to `=== "block"` for the old enable-to-enforce semantics.

## References

- `scripts/dispatch/dispatch-contract.js#contractEnforceMode`/`validateDispatch`,
  `scripts/dispatch-agent.js`/`scripts/dispatch-claude.js` (the consults), `scripts/dispatch/dispatch-shape.js#shapeDoor`.
- E-DISPATCH-SHAPE-001 W2 DoD; β DECIDE 0.87 (the in-code refutation of the redundancy premise);
  ADR-0008 (dispatch consumers derive from the registry).
