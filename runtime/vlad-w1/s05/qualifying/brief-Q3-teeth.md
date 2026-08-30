# QUALIFYING LANE Q3 — do the tests have teeth? Artifact-only brief.

## THE QUESTION

**For every test this sprint added or changed: does it actually FAIL when the thing it protects is
removed?**

A test that passes both with and without its fix protects nothing. It is worse than no test, because it
reports safety. Your job is to find out which ones are real.

## WHY THIS BRIEF DOES NOT TELL YOU WHICH TESTS TO SUSPECT

If it named them, you would check those and stop. On an earlier round of this sprint a brief named the
symbol that supposedly proved a claim, and **three lanes on three providers each verified that symbol
and each confirmed something false.** So you get the scope and the method, and you choose the targets.

**Derive the population yourself** — from the diff of what this sprint changed, not from any list. Then
state how you derived it, and what your derivation misses.

## THE SURFACE

**⚠️ YOU HAVE YOUR OWN DEDICATED CHECKOUT. USE ONLY IT.** Its absolute path is in the dispatch envelope
above, and it exists solely for this lane, at the pinned commit. **Package root:** `engine/`.
**Pinned commit and the sprint's base commit:** both in the dispatch envelope; the diff between them is
your population.

**Do NOT touch, read from, or run against any other checkout of this repository** — sibling lanes are
reading a different checkout of the same commit at the same time, and this lane is the only one that
mutates files. If your mutations were visible to them, every finding from all three lanes would become
untrustworthy and un-diagnosably so: a sibling's "this claim is false" could be *your* mutation, thirty
seconds earlier. Your isolation is what makes the round's evidence usable. If the path in the envelope
is missing or is not a dedicated checkout, **say so and stop** — do not fall back to a shared tree.

**You MAY execute.** You may run the test suite and the checks. **You may mutate files in YOUR checkout
to perform the procedure below — that is the point of this lane — but you must NOT commit, must NOT
push, and must restore before you finish.** Report the tree state you leave behind.

**Restore incrementally, not at the end.** Restore after each mutation rather than batching, so a lane
that dies mid-run leaves the least mess. A lane on this sprint died at a hard ceiling with work in
flight; assume you might.

## THE PROCEDURE — per test

1. Run the suite unmutated. Record pass/fail counts as numbers you measured, not numbers you were told.
2. **Remove or neutralise the mechanism the test protects** — the smallest edit that undoes the
   behaviour, not a deletion of the test.
3. Re-run. **The test must fail.** Record the observed result as behaviour or an exit code.
4. Restore.

**The no-op guard, and it is the one that matters:** replace the mechanism with a no-op that does
nothing at all. **If the suite still passes, the test is decorative** — report it as such regardless of
how thorough it looks. A test whose fixture is satisfied by absence is the failure mode here.

## REPORTING RULES

- **Behaviour, never a colour word.** A helper in this sprint uses a boolean meaning *matched*, so its
  "RED" means *caught* — the inverse of a test suite's habit, where mutating the code turns the *test*
  red. The two conventions are inverted and an earlier draft of a sibling brief had it backwards.
  Write *"with the fold removed, input X is not matched"* or give an exit code.
- **Observed, not cited.** A falsifier you read about in a commit message, a comment, or a prior
  report is **not observed**. If you did not run it in this lane, say so. Several claims on this sprint
  were carried forward as observed when nobody had run them.
- **Never pipe a gate through `tail`/`head` in a chain** — the pipeline returns the tail's status, so a
  failing gate reads as passing. Run each as its own command and read its real exit code.
- **A count is not a set.** If you report "N tests have teeth", emit the list; the reader derives the
  count. Never a bare number.

## RETURN — plain text, final message. No report files.

### ⚠️ FIRST LINE, EXACTLY: a machine-readable verdict token

Your reply must BEGIN with a line of exactly this shape, and nothing before it:

```
{"verdict":"pass"}
```

…with `pass`, `warn` or `fail` — **that spelling, those quotes, lower-case.** Then your prose.
(For this lane: `fail` if any test you checked lacks teeth.)

**This is not bureaucracy and it is not optional.** The consuming parser recognises a verdict ONLY from
this token; a verdict written as prose (`VERDICT: FAIL`) is unparseable to it and is recorded as
`"error"` — indistinguishable from a lane that died. On this sprint, two lanes returned genuine FAIL
findings in prose and **both were recorded as `error`**, because the brief asked for prose and the
parser reads a token. The failure is silent and fail-closed, so nothing goes green to warn anyone —
the findings simply vanish. **Emit the token, then say everything else however you like.**

Per test: what it protects, the mutation you made, **what you observed**, and whether it has teeth.

**Required fields — an omitted field reads as UNKNOWN, never "nothing to report":**

- `what_i_could_not_assess`
- `files_i_could_not_see` — regions sampled rather than read end to end
- `execution_proven` — **for this lane, the central field.** Which mutations you actually RAN versus
  reasoned about. A reasoned prediction that a test would fail is not a teeth check.
- `what_would_confirm_or_refute`
- `read_outside_the_quoted_region`
- `derivation_rule` — how you derived the population of tests you checked, and **what that rule does
  not reach** (tests changed indirectly, tests in files you did not diff, fixtures loaded at runtime).
- `tree_state_on_exit` — explicit confirmation you restored, or exactly what you left modified.

Say what **this lane** found, in your own name. If a premise here is wrong, say so with evidence — that
is a correct return, not a failure.

**There is no reward for reporting that every test has teeth.** If that is what you find, it must be
backed by the mutations you ran, listed one by one.
