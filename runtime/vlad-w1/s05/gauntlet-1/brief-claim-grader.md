# DIAGNOSTIC GAUNTLET — CLAIM GRADER (different reader, reading bytes) — S-VLADW1-05

You grade **every shipped claim sentence** in `engine/CUSTODY.md` **directly against the code it
describes**. You did not author any of it, and that is the entire point of this lane.

**⏱ HARD BUDGET: your route is killed at 15 minutes.** **Write your envelope BEFORE optional depth.**
A partial grading returned beats a complete one killed — grade in file order, and mark anything you
did not reach `not-reached`. Do not polish.

---

## WHY THIS LANE EXISTS — read this, it changes how you should work

Every material correction on this sprint today came from **someone other than the author, reading the
bytes**. Five instances: a probe shown unsound by execution · a mechanism description corrected · a
static read finding 30 false claims in four files · a builder refuting a letter count that had been
marked "verified at source" · and two reviewers correcting each other's *ratings* while their
quotations were **exact**.

That last one is the load-bearing lesson: **quotations being exact did not save the rating**, because
the fact that decided it sat 350 lines outside the quoted region. The conclusion everyone reached:

> **An excerpt is a frame, and a frame chosen by the person making the claim will tend to contain the
> evidence for it. The person quoting is the least able to notice.**

So: **do not grade a sentence against the lines it cites.** Grade it against the file. Read the
mechanism end to end where you can, and when you cannot, say which parts you did not read.

---

## THE SURFACE — pin it first

**Repo:** `C:/Users/Vlad/Desktop/Claude/Projects/vlad/.worktrees/engine-lane`, package root `engine/`.
**Pinned commit: `6c64021`.**

**FIRST ACTION:** run
`git -C "C:/Users/Vlad/Desktop/Claude/Projects/vlad/.worktrees/engine-lane" log --oneline -1`.
**If it is not `6c64021`, STOP and report the actual sha.** Name the sha on every finding.

**Read-only.** Write nothing into that repo. No commits, no edits, no test files.

**The claims live in** `engine/CUSTODY.md`. **The mechanisms live mainly in**
`engine/scripts/checks/custody-claim-lint.js`, with `engine/test/custody-claim-lint.test.js` for what
is pinned.

---

## WHAT TO GRADE, AND ON WHAT

For **every** sentence in `CUSTODY.md` that asserts something about a mechanism — what it covers,
closes, catches, guarantees, prevents, or is limited to — return a verdict of
**true / false / cannot-determine**, with the line, the quoted sentence, and your reason.

Two independent tests, and a sentence must pass **both**:

**TRUTH.** Is it true of the code at this sha? Not "was it true when written", not "is it plausible" —
**true of these bytes.** A sentence supported only by another sentence, by a commit message, or by a
test's *name* is **not** verified. Open the mechanism.

**GRANULARITY.** Does the claim's **frame name the unit the mechanism actually enumerates**? A claim
that says "scripts" over a mechanism that maps **letters** is false even when its data is right — that
exact failure is why this sprint exists. Watch for: a **count** standing in for a set; "all", "every",
"only", "never", "no other", "exactly", "the two"; and any closure word. A closure claim is admissible
only if the mechanism closes by a **named property** or by an **emitted exhaustive extension over an
explicitly stated finite domain** — otherwise it must state the probed sample and refuse the closure.

**Where a claim cites an emitted set** (the document sources some numbers from
`getTokenAlphabetCoverage()` / `tokenAlphabetDomain()`), **run those functions yourself** and compare.
Do not take the document's numbers, and do not take mine.

---

## KNOWN CONTEXT — so you spend your time on the right thing

- A **findings table** (`S06-Fnn`) in `CUSTODY.md` documents false claims in four *other* files
  (`src/env-scrub.js`, `src/model-seam.js`, `driver/host-free-driver.js`, `src/server-entry.js`) that
  this sprint **deliberately does not repair**. **Those four files are not your target.** But the
  table's own sentences **are** — grade them like any other claim.
- Two residuals are **disclosed on purpose** and should be confirmed as accurately stated rather than
  reported as new: a token split **mid-word** by emphasis is not caught, and **Coptic/Deseret/Lisu**
  homoglyphs are not folded at any letter.
- A backtick/tilde lead-in evasion is disclosed as **pinned by a test that asserts the evasion still
  exists** — i.e. pinned ≠ fixed. Check that the document says that, and that the test does what the
  document says.

**If a disclosed residual is described inaccurately, that is a NEW finding**, not a re-report — an
inaccurate disclosure is not shielded by the gap it describes.

---

## RETURN — plain text, as your final message. Do NOT write report files.

A verdict per graded sentence: line, quoted text, **true / false / cannot-determine**, reason. Then:

**Required fields — an omitted field reads as UNKNOWN, never "nothing to report":**
- **`what_i_could_not_assess`**
- **`files_i_could_not_see`** — every file or region you **sampled rather than read end to end**. Be
  exact and generous here; a later finding touching a region on this list gets re-verified before it
  is graded.
- **`execution_proven`** — which claims you **RAN** (e.g. importing the module and calling a coverage
  function) versus reasoned about from source. Separate them plainly.
- **`what_would_confirm_or_refute`** — for each cannot-determine, the specific check that would settle
  it.
- **`read_outside_the_quoted_region`** — **the field this lane exists for.** For each sentence you
  graded, state what you read **outside** the lines that sentence cites. *"I read L440-471 and the
  constants at L97-102, nothing else in that file"* is usable; *"I read the relevant section"* is not.

**Say what THIS lane found, in your own name.** Never "the lanes found". And **if a previous finding
or a previous rating is wrong, say so** — two builders refuted figures marked "verified" today and
both were right.
