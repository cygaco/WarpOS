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

**Second evidence item, structurally independent of the first** (β `c5e1a739`). The r11 comparison
shows that an unbriefed lane finds what a briefed lane misses. The r12→r13 round shows something
stronger: **a briefed lane is constitutionally incapable of finding a defect introduced by the act
of fixing.** The r12 fixer exported a write primitive so its spy fixture could assert the write goes
through a file descriptor — a good guard. The r13 security lane then walked through that export,
which had no confinement assertion. No fix-list brief could ever have surfaced it, because the brief
is generated FROM the change list and the new export IS the change. The reviewer would have had to
suspect the thing it was handed as the solution.

These are two independent arguments, and both should be weighed before anyone proposes dropping the
lane for throughput: one is empirical (same commit, differently-briefed lanes, opposite results), the
other structural (a change-list brief has a blind spot exactly the shape of the change).

**Related principle, from the same verdict**, recorded here because it generalizes past this
sprint: *a boolean a caller trusts to mean "the world is in state X" must be computed by
OBSERVING the world, not by reaching the end of the code that was supposed to establish it.*
Scoped to claims consumed as safety guarantees, not to every return value. The instance was
`rolledBack: true`, which had asserted an all-or-nothing guarantee it did not hold in three
consecutive rounds; the remedy is to re-read the restored bytes and compare, so the report is an
observation rather than a self-attestation.

---

## Amendment 2 — disclosed-residual closes for security-lane HIGHs + mitigation layer-naming

**Status:** ACCEPTED (β read-back chain, 2026-07-29: CORRECT `e2a71c85-4b90-4f13-a7d6-58c3b0e94f26`
→ CONFIRM `a4c8e70f-91d2-4b63-8c05-7e1f3a6d2b48` — the four correction items, examined against the
PRIOR quote block → CONFIRM `c3f9d418-7e26-4a05-b1d7-90a4e2c85b73` — the source-text replacement,
**the confirm covering the text as landed**. Post-landing on-disk verification: `d81b6f35`.)
**Ruling:** β DECIDE B/0.90, msg_id `b7e4c1a9-3f28-4d56-8e01-9a2f7c34b0d5`, betaEvents line 270,
boundary `gauntlet→release`, `open_adr: true`, ED-287. Precedent chain cited in the ruling:
`8f3d0b52`, `4e8b1d63`, `c5e1a739`, `9f4e7b21`. Drafted by α; authored-vs-transcribed split and
all four read-back corrections recorded in the draft trail
(`runtime/adr-0039-amendment-2-DRAFT-pending-beta.md`, local runtime artifact).

### A2.1 The reusable rule — when a binding-lane HIGH may close as "narrowed + named residual"

A HIGH from a **binding lane** — one whose verdict **establishes the security scope of record**
for the release (sourced from this ADR's own partition: decision #1 makes agy ADVISORY, decision #2
bars an advisory lane from establishing scope of record) — normally closes only by being eliminated.
(The adjacent org-authority rule — neither the Security Lead nor the Director of Engineering can
override a security-reviewer FAIL — is separately written at
`.claude/agents/engineering/security/security-lead.md:7-8` and `:45`; it is cited here as context,
not as this rule's scope definition.) It MAY instead close
as **"narrowed + named residual"** — the residual disclosed rather than fixed — **only when all five
of the following hold.** Fewer than five is not a close; it is a deferral wearing a schedule (P-064).

**Source text (β's choice, read-back e2a71c85):** the tracked r14 brief
(`runtime/gauntlet-SP-20260725-002/r14-fix-brief.md` §"β's FIVE CONDITIONS", committed at
`82f6bc9a`), which carries β's ORIGINAL wording. betaEvents line 270 (msg_id `b7e4c1a9`) carries
ε's compressed rendering of the same ruling — faithful, but not this ADR's text. The brief is OWED
a pointer edit (ε, at r14 close) so it points here rather than standing as a second rendering — an
obligation at this writing, not a fact.
*Bracketed italics are editorial, not β's words.*

> 1. The residual is unreachable by any mechanism available in **this runtime AND threat model** —
>    impossible, not merely expensive. Name the specific absence.
> 2. The narrowing removes the **SILENT** outcome. After the fix the bad case is prevented or loud;
>    it is never quiet success.
> 3. The residual grants **no capability the actor lacks** (the capability discriminator).
> 4. It is **disclosed where a future reader hits it**: its own ED, plus correction of any comment
>    that currently overclaims.
> 5. A **named falsifiable re-entry condition** *[editorial marker: the brief's "Here:" that
>    follows is the ED-287 instance — the memory store; the GENERAL rule requires naming, per
>    residual, the event that kills condition 1's premise]*. Here: the store becoming multi-writer
>    or shared across trust boundaries re-opens it, because condition 1's premise dies at that
>    moment.

Two riders that come with the rule, not additions to it:

- **Condition 1 must be CHECKED, not reasoned.** β declared the limit herself — she inferred Node's
  absence of rename-by-descriptor from the documented `fs` surface without running anything, and
  directed r14 to state it as checked or soften it. ε then checked it on node v24.16.0: rename/link
  are path-only (`link`, `linkSync`, `rename`, `renameSync`, `symlink`, `unlink`), the fd-based
  surface is `fchmod`/`fchown`/`fdatasync`/`ftruncate`/`futimes`, and `renameat`/`renameat2`/`linkat`
  are all `undefined`. A "specific absence named" that nobody executed is an assumption.
- **Condition 5 is what makes this falsifiable rather than permanent.** The re-entry condition names
  the event that kills condition 1's premise. Without it, a disclosed residual is a permanent
  deferral, which P-064 bars.

### A2.2 Layer-naming requirement — the class goes in the CODE COMMENT

Every mitigation layer MUST state its class **at the mitigation site, in the code comment** — not
only in the review artifact, fix brief, or ADR:

| Class | What it means |
|---|---|
| **CONTROL** | Load-bearing. The property holds because this exists. |
| **WINDOW NARROWING** | Defense-in-depth. Shrinks exposure; the property does **not** rest on it. |
| **HYGIENE** | Housekeeping. Nothing is built on its having run. |

β's reason, verbatim: *"if it gets described as a control we have rebuilt the exact defect this sprint
keeps producing."* Review artifacts are read once and archived; the comment is what the next reader
hits. A comment that overclaims its layer is **part of the defect**, and correcting it is in scope of
the same commit that adds the layer — as already applied to Sprint A `:473-474`, and to
`memory-apply.js:165-171` and `:234` in r14, which asserted the descriptor binding covered an
operation ending at a path-based `rename`.

### A2.3 Residual-statement form — STRONG, never weak

A residual MUST be stated in the **strong form**: what actor and what privilege it concedes.

- **Weak (barred):** *"Node has no rename-by-descriptor."* True, and useless — a future reader
  concludes a runtime upgrade closes it, and it does not.
- **Strong (required):** *"the threat model is a SAME-USER actor with write access to the store, so
  control and attacker hold identical privileges and no filesystem mechanism separates them; given
  rename-by-descriptor the actor would simply modify the file after apply returns."*

The test is whether the sentence names the actor and the privilege. A missing-API sentence describes
the runtime; a strong-form sentence describes who wins and why. Correspondingly, a verified claim
states its instant: with a read-back control the honest claim is *"at the moment I checked, the
intended bytes were on disk"* — an observation, not a guarantee.

### A2.4 Provenance

SP-20260725-002, r13 → r14, `scripts/checks/memory-apply.js`.

- **The finding.** S-1, HIGH, security lane, binding: a TOCTOU source-swap at the `fs.renameSync`
  on `:276`. The write chain is bound to the descriptor (`:214` `openSync(…,"wx")`, `:228`
  `fstatSync(fd)` nlink check, `:235` `writeFileSync(fd, …)`, `:258` fatal `closeSync`) and then
  renames **by path**, re-resolving `tmpAbs` without confirming it is still the inode that was
  exclusively created and written.
- **ε's three-call-site verification.** β caught what ε's report missed — `atomicWriteInStore` is
  called at `:900` (apply), `:906` (index rewrite) **and** `:974` (undo/rollback), so S-1 reaches the
  rollback path too. ε independently confirmed all three call sites after the ruling.
- **β's reclassification, which changed the fix.** The attacker gains **no write capability** — they
  must already own the store. What they gain is a **FALSE SUCCESS REPORT**: apply returns
  `applied:true` over content it did not write. So the load-bearing half is the **read-back compare**
  (re-read the target after rename, compare to the bytes just written, `applied:false` and fail loudly
  on mismatch) — a CONTROL that closes the lying half by construction, independent of the race. The
  `{dev,ino}` fstat-before-close / lstat-after-close check is **WINDOW NARROWING**, explicitly not a
  control. This is the sprint's own thesis (`4e8b1d63`, ratified one round earlier for rollback): a
  boolean a caller reads as "the world is in state X" must be computed by OBSERVING the world.
  `undo()` already re-read and compared bytes; apply verified what it wrote not at all. That
  asymmetry was the defect.
- **Trigger check.** β checked the costly reading first and confirmed the `8f3d0b52` ship-stop trigger
  does not fire on either reading: a swapped temp is renamed as the link itself (rename moves a
  directory entry, it does not follow the source), so nothing lands outside `storeAbs`; and the
  capability discriminator agrees, since the actor already owns the store. Plan-reachable out-of-store
  escapes measured r11→r14: 2 → 0 → 0.

### A2.5 Enforcement

- **Eventual enforcer: ED-302** (logged 2026-07-29, BEFORE this amendment left draft). Conditions
  1–5 and the residual-form rule are release-gate-shaped checks over artifacts that already exist —
  a security-lane HIGH closed with `resolution: residual` must refuse to close without a linked ED,
  a named re-entry condition, and a strong-form statement. **ED-298 explicitly does NOT cover this
  rule** — β verified its recorded shape is a provider-identity check (*"no security lane with
  `provider != antigravity` has run and passed"*), which would pass a release carrying a
  residual-close with no ED, no re-entry condition, and a weak-form statement. Naming ED-298 here
  would manufacture the appearance of an owed enforcer that never fires on this rule.
- **Cheapest available enforcer — NOT YET BUILT:** the layer-label convention is grep-able.
  `CONTROL` / `WINDOW NARROWING` / `HYGIENE` as literal tokens at each mitigation site can be
  scanned by a check that fails when a security-lane fix adds a layer carrying no class token — a
  lint over a fixed vocabulary, not new plumbing, and reviewable by eye in any diff. Nothing runs
  today.
- **Until ED-302's enforcer exists this is a convention with a silent failure mode** — the same
  standing caveat as decision #2 above. The gap IS logged (ED-302, `paths.enforcementDebt`); do not
  let the reader assume a check runs.
