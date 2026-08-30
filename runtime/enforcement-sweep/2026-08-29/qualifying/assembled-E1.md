# DISPATCH ENVELOPE — lane E1

QUALIFYING_PIN: c88aac1d

Content markers for that pin — verify these in your own checkout rather than trusting the sha:
  - the fail-closed baseline's `purpose` field OPENS with: SUPERSEDED by `b6_correction_of_purpose`
  - the fail-closed registry holds 16 rows, including two whose disposition is `contested`
If either is absent, the tree you are standing in is not the tree this envelope names. Say so and stop.

Repository root (absolute): /c/Users/Vlad/Desktop/Claude/Projects/WarpOS
Your checkout (absolute): /c/Users/Vlad/Desktop/Claude/Projects/WarpOS (READ-ONLY; do not write, commit or mutate anything anywhere)
Fixture directory (absolute): /c/Users/Vlad/Desktop/Claude/Projects/WarpOS/runtime/enforcer-fixtures/SP-20260829-001
Sprint evidence directory (absolute): /c/Users/Vlad/Desktop/Claude/Projects/WarpOS/runtime/enforcement-sweep/2026-08-29
Enforcement-debt ledger (absolute): /c/Users/Vlad/Desktop/Claude/Projects/WarpOS/.claude/project/memory/enforcement-debt.jsonl

The brief follows this envelope, verbatim and unedited. Where the brief says "the pin" it means
QUALIFYING_PIN above. Where it says "your checkout" it means the absolute path above and no other.

---

# QUALIFYING LANE E1 — claim truth. Artifact-only brief.

You grade shipped sentences against the code they describe. You did not author any of it, and **this
brief deliberately tells you almost nothing about what to look for.** Read the next section before you
decide that is an oversight.

## WHY THIS BRIEF IS SO THIN

On a sibling sprint, a brief NAMED the symbol that supposedly proved a claim. Three lanes, on three
different providers — two of which read the module end to end — then verified **that symbol** and all
three confirmed a claim that was **false**. The one lane whose brief did not mention it found the
defect immediately.

**If you could answer a question in this brief by searching for a string this brief gave you, the brief
would be broken.** I have removed the strings. You choose the unit, you choose where to look, and the
finding is yours. **Do not ask for pointers.**

## THE SURFACE

**Repo:** the WarpOS project root — absolute path in the dispatch envelope above.
**Pinned commit:** given in the dispatch envelope. **Read-only.** Write nothing, commit nothing, no
report files.

**What this sprint ships, and therefore what you grade:**
- the fail-closed **audit** and **enforcer** scripts under `scripts/checks/`, including **the text they
  print**
- their **registry** and **baseline** data files
- the **hook files** the sprint repaired, under `scripts/hooks/`
- the **enforcement-debt rows this sprint authored** (in the project's enforcement-debt ledger) —
  their `policy`, `source` and `note` fields are shipped sentences like any other
- the sprint's **close-time residual register** — the artifact the sprint emits to carry its residuals
  forward, under the sprint's evidence directory. Its entries and its stated derivation rule are
  shipped claims, and its claim to completeness is a coverage claim like any other

## YOUR TASK

**Assess whether every current-tense claim these artifacts make about what they mechanically do is true
of the code at this commit.** That is the whole assignment.

### The three tests a sentence must pass

**TRUTH.** True of the code at this sha — not "true when written", not "plausible", not "a test with a
reassuring name exists", **and never established by an approval chain or by the fact that a mechanism
exists.** Open the mechanism.

**GRANULARITY.** Does the claim's frame **name the unit the mechanism actually enumerates**? A claim
about one unit, over a mechanism that enumerates a different unit, is false **even when its data is
right**. Watch closure words — "all", "every", "only", "never", "no other", "exactly" — and watch a
**count standing in for a set**. A closure claim is admissible only if the mechanism closes by a
**named property** or by an **emitted exhaustive extension over an explicitly stated finite domain**.

**INSTRUMENT CEILING.** Where a claim rests on a text-scanning instrument, does it carry that
instrument's ceiling **at the point of claim** — *"what this instrument at this commit finds, limits
named"* — rather than speaking of the whole population? **⚠️ HAVING a ceiling is NOT a defect.** A
disclosed limit honestly stated is correct engineering. **The defect is only ever a CLAIM that exceeds
the instrument's capability.** Do not file a ceiling as a finding; file a claim that outruns one.

### ⚠️ Do not grade a sentence against the lines it cites

Grade it against the file. On a sibling sprint, ratings moved when someone read **outside** the region
a claim quoted — including one where the quotes were **exact** and the rating still changed,
because the deciding fact sat hundreds of lines away. **An excerpt is a frame, and the person making
the claim chose it.** That applies to the artifacts' own citations, and to any excerpt you take.

### The method

**For each sentence, first state what would have to be true of the code for it to be true. Then verify
that thing directly.** Do that before you form an opinion about the sentence — deciding what would make
it true is a different act from deciding whether it is true, and doing them in that order is what stops
you finding support for a reading you already hold.

Ways a claim and its mechanism can drift apart include: the mechanism never runs; it runs on a
different input than the sentence implies; it covers a narrower set than the sentence names; the
sentence describes an intention the code did not implement. **These are examples, not the classes — a
kind not listed here is exactly what this lane exists to find.** The list was written by someone who
has already looked.

## RETURN — plain text, as your final message. No report files.

### ⚠️ FIRST LINE, EXACTLY: a machine-readable verdict token

Your reply must BEGIN with a line of exactly this shape, and nothing before it:

```
{"verdict":"pass"}
```

…with `pass`, `warn`, `fail` or `error` — **that spelling, those quotes, lower-case.** Then your prose.

**This is not bureaucracy.** The consuming parser recognises a verdict ONLY from this token; a verdict
written as prose is unparseable to it and is recorded as `"error"` — indistinguishable from a lane that
died. On a sibling sprint two lanes returned genuine findings in prose and **both were recorded as
`error`**, because the brief asked for prose and the parser reads a token. The failure is silent and
fail-closed, so nothing goes green to warn anyone.

**What the values mean — this is not a formality.**
`pass` means **you affirmatively verified the claims are correct.** It does **not** mean "I found
nothing", and it does **not** mean "I could not check". `fail` and `warn` mean you found something.
**If you could not assess — access, tooling, time, a missing artifact — emit `{"verdict":"error"}` and
explain in `what_i_could_not_assess`.** That is a correct and valued return; it holds the review open
rather than clearing it on a check nobody ran. **No data is not a pass.** The token never replaces your
prose findings — it is in addition to them.

### Per sentence
The artifact and location, the quoted text, **true / false / cannot-determine**, and the reason.

**Required fields — an omitted field reads as UNKNOWN, never "nothing to report". An empty
`files_i_could_not_see` must be an explicit, deliberate empty, not an absent key:**

- `what_i_could_not_assess`
- `files_i_could_not_see` — every file or region you **sampled** rather than read end to end. Be exact;
  a finding touching anything on this list gets re-verified before it is graded. **A window into a
  field is not the field:** if you read part of a structured region, say which part.
- `execution_proven` — which claims you **RAN** versus reasoned about. Separate them plainly. A
  reasoned finding labelled as reasoned is valuable; a reasoned finding phrased as observed is the
  defect this sprint exists to end.
- `what_would_confirm_or_refute` — for each cannot-determine, the specific check that would settle it.
- **`read_outside_the_quoted_region`** — per graded sentence, what you read OUTSIDE the lines it cites.
  *"I read L720-785 and the constants at L340-360, nothing else"* is usable; *"I read the relevant
  section"* is not.
- **`derivation_rule`** — how you derived the population of sentences you graded, and **what that rule
  does NOT reach.** Emit the population member by member. "I reviewed the shipped claims" is not a
  frame, and a bounded search supports a positive finding but can never support a negative one.

**Two reporting rules:**
1. **Report behaviour, never a colour word.** Give exit codes, or matched / not-matched. Sibling
   artifacts use a helper where the boolean means *matched*, so its "RED" means *caught* — the inverse
   of a test suite's habit. Bare colour words are ambiguous here and are barred.
2. **Emit the set, never a bare number.** Any count must be derivable by the reader from your list.

Say what **this lane** found, in your own name — never "the lanes found". **If a premise in this brief
is wrong, say so with evidence.** That is a correct return, not a failure; multiple builders and graders
refuted figures marked "verified" on the sibling sprint, and every one of them was right.
