# QUALIFYING LANE Q1 — claim truth. Artifact-only brief.

You grade shipped sentences against the code they describe. You did not author any of it, and **this
brief deliberately tells you almost nothing about what to look for.** That is not an oversight — read
the next section before you decide it is.

## WHY THIS BRIEF IS SO THIN

A previous round of this sprint failed a check because the brief NAMED the symbol that supposedly
proved a claim. Three separate lanes, on three different providers — two of which read the module end
to end — then verified **that symbol** and all three confirmed a claim that was **false**. The one lane
whose brief did not mention it found the defect immediately.

So: **if you could answer a question in this brief by grepping a string this brief gave you, the brief
would be broken.** I have removed the strings. You choose the unit, you choose where to look, and the
finding is yours. If you feel under-briefed, that is the control working. **Do not ask for pointers.**

## THE SURFACE

**Repo:** the `vlad` project's `engine-lane` worktree — absolute path in the dispatch envelope above.
**Package root:** `engine/`. **Pinned commit:** given in the dispatch envelope.

- **Claims:** `engine/CUSTODY.md`
- **Mechanisms:** `engine/scripts/checks/custody-claim-lint.js`
- **Tests:** `engine/test/custody-claim-lint.test.js`

**Read-only.** Write nothing, commit nothing, no report files.

## YOUR TASK

**Assess whether every claim `CUSTODY.md` makes about what the lint mechanically does is true of these
bytes.** Grade in file order. That is the whole assignment.

### The two tests a sentence must pass

**TRUTH.** True of the code at this sha — not "true when written", not "plausible", not "a test with a
reassuring name exists". Open the mechanism.

**GRANULARITY.** Does the claim's frame name **the unit the mechanism actually enumerates**? A claim
about one unit, over a mechanism that enumerates a different unit, is false even when its data is
right. Watch closure words — "all", "every", "only", "never", "no other", "exactly" — and watch a
**count standing in for a set**. A closure claim is admissible only if the mechanism closes by a
**named property** or by an **emitted exhaustive extension over an explicitly stated finite domain**.

### ⚠️ Do not grade a sentence against the lines it cites

Grade it against the file. On this sprint, ratings moved when someone read **outside** the region a
claim quoted — including one where the quotations were **exact** and the rating still changed, because
the deciding fact sat hundreds of lines away. **An excerpt is a frame, and the person making the claim
chose it.** That applies to the document's own citations, and to any excerpt you take.

### Where claims and mechanism can drift apart

Without telling you what to find: a claim can be false because the mechanism never runs, because it
runs on a different input than the sentence implies, because it covers a narrower set than the sentence
names, or because the sentence describes an intention the code did not implement. **Check that the
thing a sentence says is checked is actually reached** — a function that exists is not a function that
is called.

## RETURN — plain text, as your final message. No report files.

Per sentence: line, quoted text, **true / false / cannot-determine**, and the reason.

**Required fields — an omitted field reads as UNKNOWN, never "nothing to report". An empty
`files_i_could_not_see` must be an explicit, deliberate empty, not an absent key:**

- `what_i_could_not_assess`
- `files_i_could_not_see` — every file or region you **sampled** rather than read end to end. Be exact;
  a finding touching a region on this list gets re-verified before it is graded.
- `execution_proven` — which claims you **RAN** versus reasoned about. Separate them plainly. A
  reasoned finding labelled as reasoned is valuable; a reasoned finding phrased as observed is the
  defect this sprint exists to end.
- `what_would_confirm_or_refute` — for each cannot-determine, the specific check that would settle it.
- **`read_outside_the_quoted_region`** — the field this lane exists for. Per graded sentence, what you
  read OUTSIDE the lines it cites. *"I read L720-785 and the constants at L340-360, nothing else"* is
  usable; *"I read the relevant section"* is not.

**Two reporting rules:**

1. **Report behaviour, never a colour word.** A file in this sprint uses a helper where the boolean
   means *matched*, so its "RED" means *caught* — the inverse of a test suite's habit. Write *"input X
   is not matched by <the check you name>"*, or give an exit code. Never a bare RED/GREEN.
2. **Any population you derive is YOURS, not the class.** If you construct a set of inputs or sentences,
   emit it item by item, state the **rule** by which you derived it, and state **what that rule does not
   reach**. "I tried a range of shapes" is not a frame.

Say what **this lane** found, in your own name — never "the lanes found". A conductor on this sprint
already shipped one false sentence by rounding one lane up to all lanes.

**If a premise in this brief is wrong, say so with evidence.** That is a correct return, not a failure.
Multiple builders and graders refuted figures marked "verified" on this sprint, and every one of them
was right.
