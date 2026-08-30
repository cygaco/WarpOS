# QUALIFYING LANE E3 — do the fixtures exist, and do they have teeth?

## YOU ARE THE NAMED OWNER OF THIS OBLIGATION

**This lane — E3 — is the single named owner of the re-run obligation below. Nobody else discharges
it.** Work done by a builder on its own bundle, or by a conductor at an earlier commit, is evidence
about that commit and does not discharge anything here. **The qualifying pin is stated in the dispatch
envelope as `QUALIFYING_PIN`, and every result you record carries that commit in the artifact itself,
beside the result.** If the envelope does not state a `QUALIFYING_PIN`, say so and stop: an obligation
anchored to "the pin" without a commit is the exact shape that failed on the sibling sprint.

## THE TWO QUESTIONS, and the second is the one that is usually skipped

**A. EXISTENCE.** Every input that was executed during this sprint's diagnostic work and shown to fool
the scanning instrument **must exist as a committed near-miss fixture** under this sprint's fixture
directory (named in the dispatch envelope). **Derive that population yourself** from the sprint's own
committed artifacts — the round's records, the enforcer's and audit's tests, the fixture directory —
and check each member has a fixture.

**B. TEETH.** For every fixture and every test this sprint added or changed: **does it actually FAIL
when the thing it protects is removed?**

A test that passes both with and without its mechanism protects nothing. **It is worse than no test,
because it reports safety.** Your job is to find out which ones are real.

## ⚠️ AND THE PART THAT MATTERS MOST: RE-RUN AGAINST THE PREDICATE **AS BUILT**, AT THIS PIN

The instrument this sprint ships **has changed since those inputs were first executed.** A fixture
proven to fool an earlier build of the scanner proves nothing about the build shipping now.

> **Every fixture must be re-run against the instrument AS IT EXISTS AT THE PINNED COMMIT, and the
> commit recorded with the result.** A result carried forward from an earlier run does not discharge
> this — and neither does the fixture's mere presence on disk.

**This is the single most likely way this lane fails to deliver.** On a sibling sprint the equivalent
criterion closed as a **named gap** — not because the work was poor, but because the fixtures were
pinned to an earlier commit and **nobody owned re-running them after the mechanism moved.** If you find
that a fixture's recorded result predates the current build, **say so explicitly**; that is a finding,
not a bookkeeping detail.

## YOUR OWN DEDICATED CHECKOUT

Its absolute path is in the dispatch envelope. **Use only it.** Do not touch, read from, or run against
any other checkout of this repository, or any sibling project's tree — other lanes are reading a
different checkout of the same commit right now, and one of them is also mutating its own. **If the
path in the envelope is missing or is not a dedicated checkout, say so and stop.**

**You MAY mutate files inside YOUR checkout** — that is the method. **NOT** commit, **NOT** push, and
**restore incrementally, after each mutation, never batched at the end.** A lane on a sibling sprint
died at a hard ceiling with work in flight; assume you might.

## THE PROCEDURE — per fixture and per test

1. Run the suite unmutated at the pin. **Record pass/fail counts as numbers you measured**, not numbers
   you were told.
2. **Remove or neutralise the mechanism the test protects** — the smallest edit that undoes the
   behaviour, **not** a deletion of the test.
3. Re-run. **The test must fail.** Record the observed result as behaviour or an exit code.
4. Restore, and confirm the restore.

**The no-op guard, and it is the one that matters:** replace the mechanism with something that does
nothing at all. **If the suite still passes, the test is decorative** — report it as such regardless of
how thorough it looks. A fixture satisfied by absence is the failure mode here.

## REPORTING RULES

- **Behaviour, never a colour word.** A sibling helper uses a boolean meaning *matched*, so its "RED"
  means *caught* — the inverse of a test suite's habit, where mutating the code turns the *test* red.
  The two conventions are inverted. Write *"with the mechanism removed, input X is not matched"*, or
  give an exit code.
- **Observed, not cited.** A result you read in a commit message, a comment, or a prior report is **not
  observed**. If you did not run it in this lane, say so.
- **Never pipe a gate through `tail`/`head` in a chain** — the pipeline returns the tail's status, so a
  failing gate reads as passing.
- **Emit the set, never a bare number.** "N fixtures have teeth" without the list is not a result.

## RETURN — plain text, final message. No report files.

### ⚠️ FIRST LINE, EXACTLY: a machine-readable verdict token

```
{"verdict":"pass"}
```

…`pass`, `warn`, `fail` or `error` — that spelling, those quotes, lower-case. Then your prose.
(For this lane: `fail` if any fixture is missing, or if any test you checked lacks teeth, or if the
fixtures were not re-run against the build at this pin.)

The consuming parser recognises a verdict ONLY from this token; prose is unparseable to it and records
as `"error"`, indistinguishable from a dead lane. On a sibling sprint two lanes' genuine findings
vanished exactly that way.

**What the values mean.** `pass` means **you ran the mutations and every fixture and test you checked
genuinely failed without its mechanism, at this pin.** Never "I found nothing", never "I could not
check". **If you could not assess, emit `{"verdict":"error"}`** and explain in
`what_i_could_not_assess` — a correct and valued return. **No data is not a pass. A fixture you did
not get to is `not-reached`, never a passing one.** The token never replaces your prose findings.

**Per fixture / per test:** what it protects, the mutation you made, **what you observed**, whether it
has teeth, and **the commit you ran it at**.

**Required fields — an omitted field reads as UNKNOWN, never "nothing to report":**
- `what_i_could_not_assess`
- `files_i_could_not_see` — regions sampled rather than read end to end; **a window into a structured
  region is not that region**
- `execution_proven` — **the central field for this lane.** Which mutations you actually RAN versus
  reasoned about. A reasoned prediction that a test would fail **is not a teeth check.**
- `what_would_confirm_or_refute`
- `read_outside_the_quoted_region`
- **`derivation_rule`** — how you derived **both** populations: the executed fooling inputs (question
  A) and the tests you checked (question B). Emit each member by member, state the rule, and state
  **what that rule does NOT reach** — tests changed indirectly, fixtures loaded at runtime, inputs
  recorded somewhere your search did not cover. **A bounded search supports a positive finding and can
  never support a negative one**, so if you report a fixture as missing, say what would have found it.
- **`tree_state_on_exit`** — explicit confirmation you restored, or exactly what you left modified.

Say what **this lane** found, in your own name. **If a premise here is wrong, say so with evidence** —
that is a correct return, not a failure.

**There is no reward for reporting that every fixture has teeth.** If that is what you find, it must be
backed by the mutations you ran, listed one by one, each with the commit it ran at.
