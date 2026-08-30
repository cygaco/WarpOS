# Q1 twins — sentence-granularity comparison

**The two lanes:** Q1 codex `d-mtf67lqj-8cad4634` (openai gpt-5.6-sol) · Q1 in-process
`d-mtf79ol1-93a9e0e4` (general-purpose/opus, α's spawn). **Neither saw the other.** Briefs
**byte-identical**, artifact-only, naming no symbol, no line, no finding.

**Grain, per β `c7e2b84f` §3: SENTENCE, not line range.** A line can hold the end of one claim and the
start of another — L12 does exactly that — so a span overlap is **not** an item overlap and a span
mismatch is **not** a different item. Every row below is decided by the **quoted bytes**.

**No count in this summary.** Each status emits its list; any number is the reader's own from it.

---

## STATUS: AGREE — both lanes false, same sentence

**`L12`** *(codex F-Q1-03 · twin "L12")* — **SAME SENTENCE** (the twin quotes a fragment of the
sentence codex quotes whole).
> shipped: *"everywhere else: every Proven claim carries its clause id, and nothing conflates the two sections."*
- codex: *"Rule 1 enumerates only `###` headings and checks only a `P1`–`P4` prefix."*
- twin: *"false as framed (granularity). The unit Rule 1 enumerates is a **level-3 markdown heading** inside the `## Proven` span, not a 'claim'"* — **execution-proven, mutant M6.**
- **Same verdict, same reason.**

**`L12-17`** *(codex F-Q1-04 "L13-17" · twin "L12-17")* — **SAME SENTENCE.** The twin's span opens at
*"WHAT IS BOUND"*, which begins at the **end of L12**; codex's opens mid-phrase at L13. **Identical
text thereafter.** The span mismatch was notation.
> shipped: *"WHAT IS BOUND IS DEFINED BY A PROPERTY, not by the list that follows it: a passage is
> bound byte-for-byte when it is a member of the population `extractBindableParagraphs` derives … OR
> when it is item (3) below … — everything else in this file is NOT bound byte-for-byte, however
> plainly it states a claim."*
- codex: Rule 2b separately byte-binds three `SANCTIONED_CARRIER_NOTE` sentence segments.
- twin: *"the file's own definition of what is bound is a closure claim, and it is **still incomplete after the correction this round applied to it for exactly that defect**."*
- **Same verdict, same defect class.** **This is the round's confirmation case**, and the sentence
  carries the document's own `CORRECTED (S-VLADW1-05, this round):` marker — **a repair that did not
  repair, found independently twice.**

**`L123-127` / `L123-129`** — **SAME SENTENCE, both false, DIFFERENT reasons → verdict agreement + a
union on the defect.**
- codex: two defects — the rule matches only `only … place|surface` (not "exhaustiveness PHRASES"), **and** Rule 3 scans every physical line including bound paragraphs (`5 of 8 controls verified.` → `aggregate-count-conflation`).
- twin: *"false as framed (granularity), **on the first clause only. The 'no count branch' half is true.**"* — `findOnlySurfaceAssertionViolations` (L1840) iterates `extractBindableParagraphs(content).paragraphs`, **the derived population, not `BOUND_PARAGRAPHS`**.
- **⚠️ Three distinct defects across the two lanes in one sentence.** Relevant to NO STACKING: β maps
  which single criterion the sentence fires, and the reasons are not interchangeable.

**`L132-137` / `L133-137`** — **SAME SENTENCE, both false, OVERLAPPING reasons.**
- codex: the implementation also applies **fold (8)** between the dash and whitespace folds, and `DASH_CLASS_PATTERN` additionally includes **U+30FC**.
- twin: *"false (incomplete enumeration), **inside a BOUND paragraph**. The order is right. The dash-fold membership is not."*
- Both cite the dash-class membership; codex **additionally** cites the omitted fold (8). **The twin's
  "inside a BOUND paragraph" is the sharper framing** — the binding mechanism is pinning an incomplete
  description.

## STATUS: CONTRADICTION-SETTLED — codex right, sentence FALSE

**⚠️ ALL FOUR ROWS IN THIS SECTION ARE CONFIRMED AT THE PIN BY α** (msg `α-4e8a1c53`), applying rule
(d)'s other-party check to each rather than only to the first. α's confirmation adds one mechanism the
settling reads had not named: **`BOLD_LEAD_IN` (L678) requires the line to START with `**`**, which is
the second half of why the `▪`-prefixed and `<b>`-wrapped forms in L7-11 and L171-174 derive nothing.

**`L7-11`** — codex FALSE, twin TRUE. **Settled: codex right.** `▪ **Ceiling — …**` **is** a bolded
Ceiling lead-in and derives nothing. **The twin verified the 15 paragraphs that EXIST; it never tested
the "EVERY" closure against newly-added forms**, and its own note — *"the claim names a subset of what
the mechanism reaches, which is the safe direction"* — is about a different dimension (location) than
the one that fails (prefix form).

**`L64-73`** — codex FALSE, twin TRUE. **Settled: codex right.** The sentence names **classes** ("list
items"); `BLOCK_PREFIX` (L784-785) enumerates `[-*+•‣◦]`, which contains `•‣◦` and **does not contain
U+25AA**. **The twin verified each named class has *an* alternative present, not that the alternative
covers the class.** *(Confirmed at the pin by α.)*

**`L115-116` / `L115-122`** — codex FALSE, twin TRUE. **Settled: codex right.**
`AGGREGATE_COUNT_PATTERN` (L1335) = ``/\b\d+\s*(?:\/|of)\s*\d+\b[^.\n]{0,40}\b(?:verified|proven|controls?|claims?)\b/i``
— **a bare digit count does not match.** `WORDED_ROLLUP_PATTERN` (L1343) likewise requires `all` **+**
`controls|claims` **+** `verified` within windows. **The twin quoted each regex's leading portion and
wrote *"Nothing else."***

**`L171-174`** — codex FALSE, twin TRUE. **Settled: codex right**, same class-vs-enumeration defect as
L64-73. (The twin's own caveat — *"'Folded away' is loose … but the observable effect is what the
sentence describes"* — concerns a different clause.)

## STATUS: CONTRADICTION-SETTLED — twin right, sentence TRUE (codex OVER-GRADED)

**`L188-192` / `L185-192`** *(S31, codex F-Q1-14)* — **β RULED TRUE** (`3e6d1a94` §1), measured
independently by β and confirmed by α. Every `emphasisFold` occurrence: **L187/357/879 comments ·
L362/1291/1312 JSDoc · L367 read · L374 applied · L888 the only line of CODE passing
`emphasisFold: false`.** Nine occurrences, one call site. The codex reason concerns **API
reachability**, a different claim.
> `grep -c "emphasisFold: *false"` returns **4**, three of them comments. **A bare count reports four
> opt-outs; the emitted list reports one** — the emitted-set discipline vindicating itself inside the
> settling read of a finding about a closure claim.

## STATUS: RESOLVED BY β — codex over-graded (not a twin contradiction)

**`L131-133`** *(S19, codex F-Q1-09)* — **β RULED TRUE** (`d4a91c67` §1, `3e6d1a94` §2). `CUSTODY.md`
defines the term itself at **L174-175** (*"The **token comparison** … multi-word **status token**"*)
and **L186-187** (*"the **status-token comparison** Rule 3 runs"*). The heading match is a **section
locator** (`PROVEN_HEADING_PATTERN` L385 → `missing-proven-section` L451), not a status-token
comparison. **Three independent convergences: the document's vocabulary (β), the twin from source, and
this sprint's own inventory L86-114** (*"Structural matchers over markdown SHAPE, not claim TEXT"*).

**`L150-152`** *(S24, codex F-Q1-11)* — **β RULED TRUE** (`d4a91c67` §2). The shipped sentence carries
the qualifier *"to verify the numbers in **THIS paragraph**"*; the tests at L2403-2450 assert the
function's **own return values** and do not parse the paragraph. **The lane quoted the qualifier and
graded against a version without it** — the misreading is the **lane's**, not the relay's (α verified
the extraction carries it).

**`L154-157`** *(S26, codex F-Q1-12)* — **TWO SEPARATE THINGS, both recorded, per α's reconciliation.**

- **Truth-value (ε's reading):** the sentence is a **disjunction** — *"can drift from each other, **or**
  from what `getTokenAlphabetCoverage()` would actually report, without anything here noticing"* — and
  is **logically TRUE**, because the second disjunct is true and the lane's own reason grants it.
  **Grading it a false sentence was wrong**, and β withdrew its earlier grading on this argument
  (`f2a08d51` §0).
- **Finding status (β's ruling, `3e6d1a94` §4, 0.84 — its closest call):** the finding **STANDS on
  AP-17**, not on falsity. S26 **is a residual disclosure**, and its first clause tells the reader that
  drift between the copies goes unnoticed — which **`bound-paragraph-missing` catches**. An inaccurate
  disclosure is a new finding whether or not the sentence is logically true.
- **Repair: strike the first clause, not rewrite the sentence.**
- **Note the shape:** the false half is falsified by **the binding mechanism this same round
  strengthened** — a disclosure contradicted by its own sprint's fix.

## STATUS: DEFINITIONAL → β

**`L6`** — codex FALSE, twin TRUE. **Both read `main()` correctly.**
- codex: *"CLI `main()` accepts `process.argv[2]` … the sentence says every run without that qualifier."*
- twin: *"`main()` (L2028) defaults `targetPath` to `DEFAULT_CUSTODY_PATH` (L86). It says nothing about how often anyone runs it."*
- **Turns on whether *"checks this file on every run"* claims *every invocation targets this file* or
  *this file is what a run checks by default*.** Not graded here.

**⚠️ THE DOCUMENT'S OWN USAGE, gathered for β by the method that settled S19 — it points at the twin:**
`CUSTODY.md` **L9** uses the identical phrase two lines later:
> *"The population of both is DERIVED from this file's own structure **on every run** rather than read
> from a hand-kept list…"*

There *"on every run"* unambiguously means **each execution of the lint** — it describes what the lint
*does* per execution, not which file an invocation targets. **Same construction, same passage, two
lines apart.** Every other `run` in the file is this sense or ordinary English (*"a leading run of
markdown prefixes"*, *"whitespace runs collapsed"*, *"a capped grep run"*); **no usage anywhere denotes
"an invocation that may target an arbitrary path."**

**But the twin's STATED REASON does not bear on the disagreement.** It argued *"it says nothing about
how often anyone runs it"* — **frequency**, where the axis in dispute is **targeting**. So the twin
**reached the verdict the document's usage supports, for a reason that does not support it** — the
inverse of S24, where the lane quoted the right bytes and reasoned wrong. **Both show that a verdict
and its stated reason are separable, and only one of them is checkable against the file.**
**The ruling remains β's.**

## STATUS: RANGE-MISALIGNED → reported honestly as unresolved

**`L80-83` (codex) vs `L83-90` (twin)** — **the spans do not align and I did not force a verdict.**
The lanes may have graded **different sentences**, in which case this is a **union, not a conflict**.
Recorded as unresolved rather than adjudicated, because manufacturing a contradiction to resolve is
the failure this file exists to avoid.

---

## What the comparison shows

**Neither lane is the better lane.** The codex lane **over-graded** by treating a reachable surface
(S31), a disjunct (S26), a defined term's general meaning (S19) and a dropped qualifier (S24) as whole
claims. The twin **under-read** by verifying *presence of a mechanism* rather than *coverage of the
class the sentence names* (L7-11, L64-73, L115-116, L171-174) — including quoting a regex's leading
half and writing *"Nothing else."* **Both failures are this sprint's own wrong-unit family, committed
by the graders of it.**

**The agreements survive the same grain-check as the contradictions**, which is the point of doing both
at sentence granularity: β's caution that *"agreements get less scrutiny than disagreements — the
asymmetry is in the reader"* is answered by checking them identically.

**And the confirmation case is the positive instance of the frame rule (ED-384).** The twins share a
**task** frame, not an **answer** frame: byte-identical artifact-only briefs naming no symbol, no line,
no finding. **Their agreement is therefore evidence, where the three lanes that shared `createModelSession`
were one observation replicated.**
