# ADR-0039 — agy is barred as a security scope of record; advisory-only until it demonstrates discrimination

- **Status:** Accepted (2026-07-27, SP-20260725-002 r10 adjudication)
- **Class:** B (β DECIDE B/0.90, msg_id `2d7a4e91-6b53-4c08-9f14-8e3b0d75a2c6`, boundary `gauntlet→release`, ASK 3)
- **Relates:** ED-230 (served-model unproven), ADR-0037 (agy auth-fallback record honesty), ADR-0025/ED-060
- **Enforcement:** NO automated enforcer today. Debt logged as **ED-298** in `paths.enforcementDebt`, carrying the concrete shape: the ship/release gate must refuse to close when no security lane with `provider != antigravity` has run and passed. Reviewer artifacts already carry a `provider` field, so this is a field read over existing artifacts, not new plumbing. Until it exists, decision #2 below is a convention with a **silent** failure mode.
  <!-- Record-honesty note: this line originally read "debt logged" before ED-298 existed, which was false at write time — the same documented-invariant class this session logged as ED-292. Corrected rather than quietly backfilled. -->


## Context

The `antigravity` (agy) provider carried the security review lane for SP-20260725-002 across
two rounds and returned **0 findings both times**. The same code, reviewed by the codex/GPT
lane, yielded **three HIGH findings**, including a hardlink escape in which `correct` wrote
through an inode and overwrote a file **outside the memory store**.

The disqualifying fact is not the silence. It is that agy **affirmatively certified the exact
property that was broken**. Its part-1 verdict stated the implementation was "locked down using
`isSafeStoreFilename` which rejects separators, absolutes, `.`/`..`, and NTFS alternate data
streams" and provided "absolute defence-in-depth against directory traversal escapes" — over a
preflight that misses the hardlink class entirely, because a hardlink is a regular file by
every stat predicate and `st.nlink` was unchecked.

**A false assurance is materially worse than silence.** Silence is a null result that a reader
discounts. An affirmative security certification gets cited downstream as evidence, and in this
case it was the certification of a control that did not exist.

Two independent weaknesses stack on top of that. ED-230 remains open: an agy `ok:true`
completion record establishes **liveness only**, because the served model is unproven, so we
cannot say which model produced the verdict. And both agy lanes leaked prose before the JSON
fence, which is a malformed-output signal in its own right.

The counter-consideration is real and was weighed: agy is free breadth, it produces a liveness
signal, and it has made genuine catches before. That is why this decision restricts the
**weight** its output may carry rather than removing the lane.

## Decision

1. **agy MAY continue to run as an additional advisory lane.** Its records stay in the artifact
   set, explicitly labelled advisory/liveness-only.
2. **agy MUST NOT establish a security scope of record.** An agy PASS MUST NOT be cited as the
   security evidence for a release, a land, or a gauntlet close.
3. **Named re-entry condition, so this is falsifiable rather than permanent.** agy is restored
   as a scope-of-record provider when BOTH hold:
   - **ED-230 is closed** — served-model proof, so an `ok:true` record identifies what actually
     answered; and
   - **agy passes a seeded-defect positive control** — it is handed code with a KNOWN planted
     HIGH and is required to find it. This is the same calibrate-against-a-real-sample discipline
     used for the agy log-identity work.

   Until it demonstrates discrimination on a control, an agy PASS carries no information.

## Consequences

- Any sprint whose security lane ran on agy alone has **no security scope of record** and must
  re-establish it on a discriminating provider before landing. This applies retroactively to
  SP-20260725-002, where it was applied and caught three HIGHs.
- Gauntlet re-convergence scopes must name the provider for the security lane explicitly rather
  than treating "the security lane ran" as sufficient.
- The re-entry condition is a concrete, cheap experiment. It should be run rather than left
  indefinitely open; a positive control is a bounded task, not a research project.

## Alternatives rejected

- **Remove agy entirely.** Rejected as over-broad. An over-broad rule gets dismissed in practice,
  and the advisory breadth is genuinely free.
- **Rule per-sprint rather than as standing policy.** Rejected: this is the second sprint in which
  an agy PASS had to be overridden, and re-litigating it each time invites the false assurance to
  be accepted once when nobody re-checks.
- **Accept agy where a second provider also passes.** Rejected as unfalsifiable — two passes where
  one lane cannot discriminate is one pass plus noise, and it obscures which lane carried the scope.

## Notes on how this was found

The override that produced the evidence was β's rider F on SP-20260725-002, which rejected the
default re-convergence plan (carry the agy PASSes, re-fire only qa and backend) and required the
security scope be re-established on a provider that demonstrably discriminates. Without that
override, three HIGHs — one of them an out-of-store write — would have landed behind a green
security lane.

A related gauntlet-design lesson from the same round, recorded here because it bears on how much
any single PASS is worth: the backend lane verified the rollback by direct module probes and
passed, while the security lane found the defect it had not been briefed to look for. A lane
briefed to check **enumerated paths** inherits the blind spots of the brief, and the brief is
written by people who already believe the design is sound.

## Amendment (2026-07-28) — the unbriefed attack lane is REQUIRED, not advisory

β DECIDE B/0.90, msg_id `4e8b1d63-7a05-4c29-9e17-2b6f0a5c8d34`, `open_adr: true`.

The paragraph above originally said one lane "should" be briefed to attack invariants. The very
next gauntlet produced a controlled comparison that settles it, so it is now a **requirement**:

> **Every gauntlet round MUST brief at least one lane on invariants to falsify, with NO fix
> enumeration and NO change list.**

**The evidence.** On SP-20260725-002 r11, one commit, three lanes: backend and qa were given the
full five-item change list and both returned PASS with zero findings. The security lane was given
three invariants and no change list, and falsified **all three** — including a CRITICAL in which
the round's own fix mechanism was hardlink-escapable at its temp path, producing an out-of-store
write with `{ok:true, applied:true}` and a clean post-check.

That is a controlled comparison rather than an anecdote: same code, same commit, same provider,
differing only in how the lanes were briefed. The blind-spot mechanism this ADR had just recorded
reproduced itself one round after being written down. Backend's report was accurate in every
word — it verified the temp was created inside the store, renamed over the target, and cleaned up
on failure. It never asked whether the temp *path* could be pre-created as a hardlink, because
that was not on the list it was given.

**Related principle, from the same verdict**, recorded here because it generalizes past this
sprint: *a boolean a caller trusts to mean "the world is in state X" must be computed by
OBSERVING the world, not by reaching the end of the code that was supposed to establish it.*
Scoped to claims consumed as safety guarantees, not to every return value. The instance was
`rolledBack: true`, which had asserted an all-or-nothing guarantee it did not hold in three
consecutive rounds; the remedy is to re-read the restored bytes and compare, so the report is an
observation rather than a self-attestation.
