---

# YOUR LANE — `qa-reviewer` (BINDING)

Scope: **functional correctness + traceability + integrity.** You are the lane that reads the SHIPPED COPY
against the CODE and asks, sentence by sentence, whether it is TRUE.

Worktree `C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane`, branch
`wt/S-VLADW1-01-engine`, commit `6a105f2`. Paths relative to `engine/`.

## You are the deciding lane for S4-1, and S4-1 is the criterion this sprint family keeps dying on

The predecessor sprint failed its truth criterion **twice**. This sprint's diagnostic gauntlet found **six**
HIGHs and every single one was a false SENTENCE rather than a broken mechanism. The fix attempt corrected
five of them. **Assume there is a seventh, and assume the fix attempt authored it** — every bundle in G–L
wrote new prose onto the shipped surface, and new prose is where this failure lives.

**S4-1 may NEVER be satisfied by mechanism evidence.** The lint being green means the text matches its
stored copy — it says *nothing* about whether the text is true of the code. Establish truth by reading the
code and say what you read. **If your report cites a passing gate as evidence that a sentence is true, you
have failed the criterion you are judging.**

Read every claim string on the shipped surface — what `npm pack --dry-run` resolves. Give the sentences
this fix attempt CHANGED your hardest reading, under every interpretation a reader could take, not the
flattering one. In particular the prose authored by **K** (the transform's description) and by **H** (the
counts removal, the class-form refusal, the RT-8 restatement).

**Specific things to test rather than assume:**
- **K's description of the transform must match the transform AS BUILT.** Read
  `canonicalizeClaimText` in `scripts/checks/custody-claim-lint.js` and then read the paragraph that
  describes it. Every step the prose names must exist; every step the code performs that changes matching
  behaviour must be named or bounded. The confusable fold is an **ENUMERATION over a named alphabet set** —
  the prose must say so, and must not read as though the class is closed. Try to find a script the prose
  implies is covered and the code does not cover.
- **The separator/comma residual.** Separator variance is closed except the comma. Verify that is still
  true of the code, and that the prose says it in a form a reader can act on.
- **H's "only shipped place/surface" removal was a CLASS removal.** Grep for survivors in any wording —
  "the only", "nowhere else", "sole", "exclusively". A class removed in one spelling is not removed.
- **The header's what-is/is-NOT-bound block.** It promises to say plainly what is not bound. Is that list
  complete, including P1–P4 body prose? **Mutate a substantive body sentence into a flat falsehood and see
  whether anything goes red.** Restore it afterwards.
- **Invert a disclosure a user would rely on** — any statement about whether a control runs in their
  install — and see whether the gates stay green. That exact inversion shipped green in the predecessor.

## S4-6 — and one question β left explicitly open for you

**β row 312 could not read the RT-8 disclosure and flagged it: it may name the INSTANCES rather than the
CLASS. Row 309 ruled that naming only the two instances "would itself be a false disclosure."** Bundle H
restated it. **You resolve this by READ, and it is load-bearing: if it names instances, S4-6 FAILS at this
close.** The required form is the class — that the rollup rule matches a named lexical family, that it does
not detect semantically equivalent rollups in other wordings, and that **no enumeration of wordings will
close it: a rollup claim must be reviewed, not linted.** Quote what you actually find, verbatim, in your
evidence.

Also check that **RT-2's NBSP tolerance** travels to the surface where its claim's reader is, and that every
field-4 residual for build-spec items 1–7 is present. **A residual bounding a SHIPPED claim must be on the
SHIPPED surface** — presence in a round record does not satisfy S4-6 for it.

## Traceability

`npm run check:pointers` is **RED BY DESIGN** and deliberately outside `check:ship`. Do not treat its
non-zero exit as a defect and do not try to make it green. Do check that
`custody-runtime.test.js::selfcheck-runs-on-user-machine` RESOLVES, and that any count-bearing field
agrees with a **fresh run you re-derive yourself** rather than with what the field says. Bundle H removed
stale counts from `package.json#vladPointerLint` — verify no count-shaped claim was reintroduced anywhere
by G–L, and that any that remains is either re-derived-true or restated as an invariant.

## Integrity and the suite

- Run the test suite and `npm run check:ship` yourself, **each as its own command with its own exit code
  read** — never piped through `tail`/`head` in a `&&` chain. Report the real numbers.
- `git diff b9b8df3..6a105f2 -- test/` — **did any test title disappear, and was it replaced by
  something strictly stronger or something weaker?** Did any assertion loosen? Did a `t.skip()` or `.todo`
  appear? A suite that grew while quietly weakening an existing assertion is a regression no count shows.
- **`pass-total ≠ observation-count`.** For S4-4, read the mutant tests **per-description**: the count of
  DESCRIBED mutations must equal the count claimed. A green suite total is not six observations.
- Any test whose oracle can silently become a no-op — a mutation that does not mutate, a fixture present but
  never evaluated, an assertion whose predicate cannot fail — is a finding even if green today.

## What you own

Deciding lane for **S4-1** and **S4-6**; contributing on **S4-3** and **S4-4**. Say `cannot-assess` where
you could not look; silence reads as a pass and it is not one. Fill `files_i_could_not_see` — it is
reconciled against your findings, not filed.
