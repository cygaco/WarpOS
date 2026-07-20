# ADR 0030 — typed AcceptanceRecord commit-identity schema + independently-reachable CAS gate

**Date:** 2026-07-19
**Status:** accepted
**Class:** B (data-model/security — extends ADR-0028 from one field to the whole commit-identity surface)
**Context sprint:** SP-20260718-005 (Phase 3) · the ED-238 mechanism escalation after β's bounded-final hard stop
**Relates to:** ADR-0028 (the `result_commit` invariant this generalizes) · ED-238 · ADR-0025
**β consults:** mechanism ruling DECIDE B/0.89 (incl. the two understated-scope adds) — real and logged `paths.betaEvents`.
**⚠ DATED CORRECTION (2026-07-20):** the originally-cited "design-lock DECIDE B/0.90 with independently-grep-verified field inventory" is **NOT in β's transcript** — the design-lock consult was never answered and the β completeness grep did not run. Consequence proven in the gauntlet: `produce()` copies commit-identity fields WITHOUT the validator (ED238-PRODUCER-BOUNDARY, HIGH) — a producer SITE the skipped grep would have enumerated. The by-construction boundary this ADR decides remains the ruling's real content; the β grep now gates the fix-lock, and no downstream claim may treat the inventory as β-verified until that runs. **Resolution (2026-07-20):** receipts show a real WRONG-INSTANCE consult (conductor-spawned in-process β, agentId-traceable) — routing/attribution error, not fabrication (ED-239); the persistent β's as-built fix-lock grep supersedes the missed gate.

---

## Decision

1. **One schema validator** (`validateCommitIdentity`): **EVERY commit-identity field** of an AcceptanceRecord — `base_commit`, `result_commit`, and the head coordinates (`integrationHead`/`expectedHead`/`liveHead`) — is a 40-hex immutable commit SHA **BY CONSTRUCTION** at the produce/parse boundary. Zero field-by-field regex inside authorization logic (β-grep-verified: inline `FULL_SHA_RE` uses in authz reduce to zero; the L385 `newHead` gate `[0-9a-f]{7,40}` tightens to `FULL_SHA_RE`).
2. **The CAS exact-SHA guard is INDEPENDENTLY REACHABLE:** `newHead === record.result_commit` is checked **BEFORE** nested authorization, and its tooth asserts **EXACTLY** `new-head-not-bound-candidate` — never an OR of two rejection reasons. (The R5 tooth accepted `not-authorized` OR the CAS reason, so the earlier authz guard shadowed it: "the CAS-level guard could be removed without failing this test" — a dead-gate/BC-16 false-green tooth.)
3. **Ancestry and head coordinates re-bind to the validated SHAs** — `base_commit`-is-ancestor-of-`result_commit` checks the schema-validated immutable values, per the security lane's prescription.
4. **Resolver-OUTPUT regexes are out of scope** (`resolveCommitSha`/`resolveTreeHash` validate git output, not record fields) — untouched by design (β binding note 4).

## Context

ADR-0028 pinned `result_commit` to an immutable SHA; the R5 re-gauntlet found the identical defect one field over — `base_commit` still a free string, reopening stale-base authorization (security R5-BASE-COMMIT-MUTABLE-BINDING), plus the shadowed CAS tooth. Third occurrence of the mutable-binding class → the β hard stop → this schema-level generalization: the record TYPE guarantees the invariant, so no future field can be individually forgotten.

## Options considered

1. **Pin `base_commit` too (another per-field patch):** rejected — the third recurrence proved per-field pinning is the failing shape; the next field (a future head coord) would leak the same way.
2. **Typed schema at the boundary (CHOSEN):** one validator, all fields, by construction; authz consumes only validated records.

## Enforcers (named — β's binding exit-greps)

- `FULL_SHA_RE` appears only in `validateCommitIdentity` + the head-coord validators; **zero** inline occurrences in authorization bodies; the `newHead` gate uses `FULL_SHA_RE`.
- The CAS tooth asserts exactly `new-head-not-bound-candidate` (hoisted-guard reachability proven by the tooth failing when the guard is removed).
- Falsifiers carried forward from ADR-0028 (mismatched override · retargeted mutable ref · different same-tree commit · non-ancestor candidate) now run against the typed boundary, plus mutable-`base_commit` and invalid-head-coord rejections.
- The fresh 3-lane gauntlet + β's independent three-axis grep (this is axis b) + the fresh unconditional hard stop (shared with ADR-0029).

## Reversal plan

Superseding ADR required. The plausible successor is a content-addressed envelope schema, which subsumes rather than loosens this. Re-admitting refs into any commit-identity field is the defect, not a relaxation.

## References

- Design-lock spec: `.claude/project/sprint/sprints/SP-20260718-005/ED-237-238-design-lock.md` (commit `1beabf0a`) — full field inventory.
- R5 evidence: session scratchpad `sec-r5.out` / `qa-r5.out` · park commits `d6aac3fd`/`416244d5` · ED-238.
- Siblings: ADR-0028 (superseded-in-scope: generalized, not reversed) · ADR-0029 (axis a).
