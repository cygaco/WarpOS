# ADR 0028 — acceptance-record `result_commit`: immutable-SHA binding + exact-equality override + ancestry invariant

**Date:** 2026-07-19
**Status:** accepted
**Class:** B (data-model/security invariant — changes what `result_commit` IS and hardens the C3 accepted-result binding)
**Context sprint:** SP-20260718-005 (Phase 3 WorkOrder/Envelope) · R5 bounded-final fix round
**Relates to:** ADR-0025 (attestation origin-proof) · the Phase-3 C3 accepted-content CAS binding (SP-005 R2, commit `55f2594c`) · ED-236
**β consult:** cap-ruling DECIDE B/0.89, OPEN_ADR:true, 2026-07-19 (~23:0xZ) — the ruling authorized the bounded-final R5 AND directed this invariant be recorded as an ADR, not buried in a fix commit. Logged `paths.betaEvents`.

---

## Decision

In acceptance records (`scripts/dispatch/acceptance-record.js`):

1. **`result_commit` is stored as an IMMUTABLE full 40-hex commit SHA, captured at produce time.** A mutable ref (branch/tag name) is never accepted as the stored binding.
2. **Authorization recomputes the accepted result tree EXCLUSIVELY from `record.result_commit`.** Never from the destination `targetRef` (the R3-REG-1 wrong-ref defect) and never from a caller-preferred source.
3. **Caller-supplied `opts.resultRef`/`opts.newHead` have NO precedence.** If supplied, they must resolve to EXACTLY `record.result_commit` — **exact SHA equality; tree equality is insufficient** (the attack is a DIFFERENT commit whose tree equals `result_tree_hash`).
4. **The CAS integration path may advance the destination only to `newHead === record.result_commit`.**
5. **`base_commit` must be an ancestor of `result_commit`** (injectable `ancestryResolver`; absent/undecidable → fail-closed).

## Context

The SP-005 gauntlet drilled the same mechanism two rounds running. R3 caught authorization recomputing from `targetRef` (a real integration could never authorize — fail-closed availability defect). The R3 fix recomputed from a candidate source but gave caller-supplied `opts.resultRef`/`opts.newHead` precedence over the record binding, and left `result_commit` only *syntactically* mandatory — satisfiable by a mutable ref. R4 (qa gpt-5.6-terra + security gpt-5.6-sol, convergent) showed the consequences: passing `targetRef` as `resultRef` re-opens the wrong-tree recompute, and an attacker-controlled different commit with an equal tree can authorize and be installed via the CAS path forwarding `opts.newHead` — regressing the C3 accepted-result binding this record exists to enforce.

β's cap-ruling identified this as the 2×-recurrence → structural-fix pivot: the R3 spot-fix closed the headline path and leaked at the sibling path; the durable close is a data-model invariant, not another precedence tweak.

## Options considered

1. **Record-binding outranks caller opts (precedence flip only):** rejected — leaves the mutable-ref binding and the same-tree-different-commit vector alive; β predicted an identical-cluster R5 re-fail under this shape.
2. **Full data-model invariant (CHOSEN):** immutable-SHA storage + exclusive recompute source + exact-equality overrides + CAS pin + ancestry.
3. **Remove caller overrides entirely:** viable and simpler, but exact-SHA-equality keeps the call-surface compatible while making overrides inert-unless-identical; equivalent security posture with less churn on callers.

## Why this option won

The invariant closes every R4-named vector at the model level (nothing to get precedence-wrong later): a mutable ref can't be stored, a non-identical override can't select a source, a same-tree substitute fails SHA equality, an unrelated candidate fails ancestry, and the CAS can only install the bound commit. Option 1 fails the β falsifier set by construction; option 3 buys no additional safety over option 2.

## Risks

1. Fail-closed availability: legitimate callers passing refs that resolve correctly but mismatch by SHA (e.g., re-created commits with identical trees) are refused.
2. The ancestry check depends on the resolver's correctness in worktree/partial-clone contexts.

## Mitigations

1. Intentional: a re-created commit IS a different commit; the producer must mint a new record for it. The refusal message names the mismatch explicitly.
2. `ancestryResolver` is injectable and fail-closed; the falsifier suite pins its refusal behavior.

## Enforcers (named)

- The four β-required falsifiers, committed as regression teeth in the same round: **mismatched `resultRef`/`newHead` · retargeted mutable ref · DIFFERENT same-tree commit · candidate unrelated to `base_commit` — all BLOCK.**
- The R5 re-gauntlet (BE + QA + security lanes) is the acceptance gate; per the β hard-stop, a third residual of this defect parks the sprint and escalates the mechanism (schema rethink), not another spot round.

## Reversal plan

Superseding ADR required. The plausible evolution is schema-level (e.g., content-addressed result envelopes), which would subsume rather than loosen this invariant. Loosening exact-SHA to tree-equality is explicitly forbidden without a new β-consulted ADR — that's the attack, not a relaxation.

## References

- R4 raw verdicts: session scratchpad `qa-r4.out` / `sec-r4b.out` (R4-RESULT-COMMIT-BINDING)
- R5 fix brief: `.claude/project/sprint/sprints/SP-20260718-005/R5-fix-brief.md` (commit `9ac1b34f`) — R5-C2A/R5-C2B
- β cap-ruling: `paths.betaEvents` 2026-07-19 (DECIDE B/0.89, bounded-final + hard stop)
- Prior: ADR-0025 · SP-005 R2 C3 binding (`55f2594c`)
