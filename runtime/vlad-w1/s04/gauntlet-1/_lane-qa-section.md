---

# YOUR LANE — `qa-reviewer` (BINDING)

Scope: **functional correctness + traceability + integrity.** You are the lane that reads the SHIPPED COPY
against the CODE and asks, sentence by sentence, whether it is TRUE.

Worktree `C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane`, branch
`wt/S-VLADW1-01-engine`, commit `b9b8df3`. Paths relative to `engine/`.

## You are the deciding lane for S4-1, and S4-1 is where this sprint family keeps dying

The predecessor sprint failed its truth criterion **twice**, both times on sentences that were *"true one
reading over"*. This sprint corrected **four** false claims mid-build (two gate-enforced ones, an
attribution, and a whole paragraph our own bundle C falsified). **Assume there is a fifth.**

**S4-1 may NEVER be satisfied by mechanism evidence.** The lint being green means the text matches its
stored copy — it says *nothing* about whether the text is true of the code. Establish truth by reading the
code and say what you read. If your report cites a passing gate as evidence a sentence is true, you have
failed the criterion you are judging.

Read every claim string on the shipped surface — what `npm pack --dry-run` resolves. Give the sentences
this build CHANGED your hardest reading, and read them under every interpretation a reader could take, not
the flattering one.

**Specific things to test rather than assume:**
- **The AC-8.6 paragraph** (rewritten by F′ after C landed AC-8.6). Does it now overclaim? AC-8.6 is ONE
  control on ONE path. Bundle A's class-form Ceiling says this package does not verify its controls are
  invoked in a user's install — **still true for every control but this one.** Do those two paragraphs now
  agree, or does the document assert both a general negative and a specific positive that contradict?
- **F′'s deviation** (going-in item 1): it edited the class-form Ceiling. Read the before/after and judge
  whether the change was minimum-and-reconciling, or whether it weakened the class-form force.
- **The header's what-is/is-NOT-bound block.** It promises to say plainly what is not bound. Is that list
  now complete — including P1–P4 body prose? **Mutate a substantive body sentence into a flat falsehood and
  see whether anything goes red.**
- **Invert a disclosure a user would rely on** — any statement about whether a control runs in their
  install — and see whether the gates stay green. That exact inversion shipped green in the predecessor.

## Traceability

`npm run check:pointers` is **RED BY DESIGN** and deliberately outside `check:ship`. Do not treat its
non-zero exit as a defect and do not try to make it green. Do check: that `custody-runtime.test.js::
selfcheck-runs-on-user-machine` now RESOLVES (it was `missing-name`), and that
`package.json#vladPointerLint`'s counts still agree with a fresh run — **re-derive them yourself** rather
than reading either field.

**Going-in item 2 is yours to adjudicate:** bundle C edited `test/verified-by-resolver.test.js` outside its
allowedFiles because that file pinned AC-8.6's pointer as unresolved. Read commit `2a28a6a`. Was that
genuinely unavoidable, was it confined to counts plus the AC-8.6 block, and did retitling anything regress
the lint?

## Integrity and the suite

- Run `node --test "test/*.test.js"` and `npm run check:ship` yourself, **each as its own command**, and
  report the real numbers.
- `git diff b2583d6..b9b8df3 -- test/` — **did any test title disappear, and was it replaced by something
  strictly stronger or something weaker?** Did any assertion loosen? Did a `t.skip()` or `.todo` appear?
  A suite that grew while quietly weakening an existing assertion is a regression the count will not show.
- **`pass-total ≠ observation-count`.** For S4-4, read the mutant tests per-description: the count of
  DESCRIBED mutations must equal the count claimed. A green suite is not six observations.
- Any test whose oracle can silently become a no-op — a mutation that does not mutate, a fixture present but
  never evaluated, an assertion whose predicate cannot fail — is a finding even if green today. **Going-in
  item 3 names one candidate** (the Rule 4 mutant depending on a hand-wrapped line break); judge it.

## What you own

Deciding lane for **S4-1** and **S4-6**; contributing on **S4-3** and **S4-4**.
For **S4-6**, check that both deliberately-unfixed findings travel to where their reader is: **RT-2's NBSP
tolerance** and **RT-8's rollup blindness stated as a CLASS** (not as its two instances — naming only the
instances was ruled "itself a false disclosure"). Say `cannot-assess` where you could not look; silence
reads as a pass and it is not one.
