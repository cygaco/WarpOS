# DISPATCH ENVELOPE — lane E3

QUALIFYING_PIN: c88aac1d

Content markers for that pin — verify these in your own checkout rather than trusting the sha:
  - the fail-closed baseline's `purpose` field OPENS with: SUPERSEDED by `b6_correction_of_purpose`
  - the fail-closed registry holds 16 rows, including two whose disposition is `contested`
If either is absent, the tree you are standing in is not the tree this envelope names. Say so and stop.

Repository root (absolute): /c/Users/Vlad/Desktop/Claude/Projects/WarpOS
Your checkout (absolute): /c/Users/Vlad/Desktop/Claude/Projects/WarpOS/.claude/worktrees/enf-e3-teeth
Fixture directory (absolute): /c/Users/Vlad/Desktop/Claude/Projects/WarpOS/runtime/enforcer-fixtures/SP-20260829-001
Sprint evidence directory (absolute): /c/Users/Vlad/Desktop/Claude/Projects/WarpOS/runtime/enforcement-sweep/2026-08-29
Enforcement-debt ledger (absolute): /c/Users/Vlad/Desktop/Claude/Projects/WarpOS/.claude/project/memory/enforcement-debt.jsonl

Environment note: In this checkout `node scripts/testsuite/enforce.js` exits 1. That is a property of this checkout, not of the artifacts you grade, and its cause is recorded outside this round — do not spend budget diagnosing it. Your control runs are on `scripts/checks/gate-failclosed-enforcer.js` and the three suites.

The brief follows this envelope, verbatim and unedited. Where the brief says "the pin" it means
QUALIFYING_PIN above. Where it says "your checkout" it means the absolute path above and no other.

---

# QUALIFYING LANE E3 — do the fixtures exist, and do they have teeth?

## YOU ARE THE NAMED OWNER OF THIS OBLIGATION

**This lane — E3 — is the single named owner of the re-run obligation below. Nobody else discharges
it.** Work done by a builder on its own bundle, or by a conductor at an earlier commit, is evidence
about that commit and does not discharge anything here. **The qualifying pin is stated in the dispatch
envelope as `QUALIFYING_PIN`, and every result you record carries that commit in the artifact itself,
beside the result.** If the envelope does not state a `QUALIFYING_PIN`, say so and stop: an obligation
anchored to "the pin" without a commit is the exact shape that failed on the sibling sprint.

**Three more lines, and they close the ways this obligation is usually defeated:**

1. **Verify the pin; do not assume it.** Run `git rev-parse HEAD` in your checkout. **If it does not
   equal `QUALIFYING_PIN`, say so and stop** — you are standing on a different commit from the one this
   obligation is anchored to. An absent pin and a *wrong* pin are different failures and the
   stop-condition above only catches the first; on the sibling sprint the fixtures were not un-pinned,
   they were pinned to the wrong commit.
2. **Record the commit you MEASURED, never the one you were told.** The commit written beside each
   result is the output of your own `rev-parse`, not the envelope's literal. If the two ever diverge,
   a measured value makes the divergence visible afterwards; a copied one hides it forever.
3. **Report skipped tests explicitly as `not-reached`.** A guard that cannot be assessed on this lane's
   platform is an **unverified** guard, never a passing one. The suite you are about to run exits 0
   with a skip inside it — **do not inherit that convention.** A skipped test is a test of unknown
   teeth, which is precisely what this lane exists to measure.

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

1. Run the suite unmutated at the pin, with `node --test`, **each suite file as its own command**.
   **Record pass/fail/skip counts as numbers you measured**, not numbers you were told. These suite
   files are the binaries this lane runs and the only ones its counts may come from — no other runner's
   exit code is a result of this lane.
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
