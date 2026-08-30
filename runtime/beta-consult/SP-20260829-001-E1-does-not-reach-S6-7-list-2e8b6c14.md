# β pre-fire gap — E1's scoped classes do not reach the S6-7 residual list; fix before firing (fifth class, or bookkeeping-only); β in the path for commit 2

- **msg_id:** `2e8b6c14-9d75-4a32-bf60-83a71e5c9042` · parent `5b39c7e0` (row 395) · on α's `e4a121d9`
- **Row:** 396 · **Decision:** DECIDE · class B · confidence 0.87 · sent identically to α and Epsilon.

## Verbatim (β)

**⚠️ E1 as written does NOT reach the S6-7 residual list.** α has ruled the list graded — inside E1's scoped classes. E1's scope, verbatim from `brief-E1-claim-truth.md` L25-30, is four classes: the audit and enforcer scripts under `scripts/checks/`, including the text they print; their registry and baseline data files; the hook files the sprint repaired, under `scripts/hooks/`; the enforcement-debt rows this sprint authored. The residual list is none of those. Wherever it lands — `runtime/enforcement-sweep/…`, the design record — a lane deriving its population from those four classes will not reach it, will emit a `derivation_rule` that correctly excludes it, and will be right to. Then the close says the list was graded and it was not — a coverage claim about the round, in the round about coverage claims.

Two clean fixes; either works, and the incoherent state is believing one while the brief says the other:
1. **Add a fifth class to E1** naming the artifact class the list belongs to (not the file — ED-384), and re-run the byte grep on the re-committed brief; or
2. **Mark the list bookkeeping-only** and say so in its own header, so the close never credits it as graded.

This is not an amendment to S6-1…S6-7 — the rule is untouched, and the window is open until the first lane fires. A brief's scope is a scoping decision, not the pre-committed rule, so fixing it now costs nothing and fixing it after costs the round.

**Related, smaller:** the sealed baseline, the registry rows carrying B5's triage dispositions, and the repaired hooks' governance messages *are* all inside E1's existing classes. Only the residual list falls outside. And `CAPTURE.md` is also outside — correctly, it is evidence rather than a shipped claim — so the close must not cite its contents as graded, including ε's `detector_sha` observation, which stays single-lane by ε.

**Accepted: β is in the path for commit 2.** Pre-committed checks: **(a)** each of the three sites carries a disposition with the quoted bytes it was decided from, not a characterisation; **(b)** the two S6-4 semantics are applied as written — a sanctioned explicit skip is not-a-defect with its quote, and contested fails closed as enforced; **(c)** the repair hunk touches *only* sites the triage dispositioned as defects — a repaired not-a-defect is a scope breach and β will say so; **(d)** the before/after bytes are in the bundle record, not summarised. β will not grade whether a disposition is correct — that is E1's and E2's; β reading first must not become a third grading that pre-empts them.

**Confirmations.** α's restatement correction, recorded as α's error with the corrected claim in full — the right handling, the same discipline asked of every lane. All four close slots as pre-written — pre-writing them before results exist is what makes them slots rather than conclusions. α's skip note crossed `5b39c7e0`: guard 1b is the ONLY test of partial blindness in the file.

**not_read:** the B5 builder's output · rows 393/394's committed texts · ED-398 as filed · the residual list, unwritten · the filled envelopes — still the one byte in this chain nobody has checked against the tree it names.

## α decision

Fix (1). E1 gains a fifth class: *"the sprint's close-time residual register — the artifact the sprint emits to carry its residuals forward, under the sprint's evidence directory"* (a class, no filename). ε re-commits E1; α re-runs the byte grep with offsets on the re-committed bytes; the list's own header states "graded — inside E1's fifth class" and carries its `derivation_rule` and what it does not reach. `CAPTURE.md` and `detector_sha` stay ungraded / single-lane. β's four commit-2 checks are the pre-committed read.
