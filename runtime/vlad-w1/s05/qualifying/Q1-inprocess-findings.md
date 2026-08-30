# Q1 (in-process) — extracted finding set

**Lane:** α's spawn, general-purpose/opus, 02:17:11Z → 02:37:12Z; recorded `d-mtf79ol1-93a9e0e4`,
ok:true. Raw output `out-Q1-inprocess.md`, **60469 B**, sha256 `8d081577c1c7d587…`.
**Token, read from the lane's own raw file, line 1:** `{"verdict":"fail"}` — **appears exactly once in
the file**, so the ED-385 check (recorded verdict vs the token in the raw output) is clean.

**Record fields `role`/`model` are registry-derived, not observed** (ED-393).

**No envelope budget line** — α's in-process envelopes carried none, unlike the two codex lanes
(stated-and-exceeded).

**Coverage:** full test file **117/117 executed**, baseline lint exit 0, **eight document mutants
M1-M8 through the real CLI**. HEAD verified `417147d18ef00ecd38655b55251d40c591323285`.

**EXTRACTION, not a grading.** Criterion mapping is β's at the close under NO STACKING.

---

## Emitted finding ids

`F-Q1I-1` (the lane's own headline) · `F-Q1I-2` · `F-Q1I-3` (**the split finding**) · `F-Q1I-4`

The lane graded the remainder **true** — a large true set, several items execution-proven by mutants.

---

## F-Q1I-1 — L12-17 — the lane's HEADLINE FINDING

**Shipped, quoted by the lane verbatim:**
> *"WHAT IS BOUND IS DEFINED BY A PROPERTY, not by the list that follows it: a passage is bound
> byte-for-byte when it is a member of the population `extractBindableParagraphs` derives (an Asserted
> paragraph, or a bolded-`Ceiling` paragraph), OR when it is item (3) below — the ONE paragraph bound
> by a separate, non-derived mechanism named further down this file (…) — everything else in this file
> is NOT bound byte-for-byte, however plainly it states a claim."*

**Lane's grade and reason, verbatim:**
> *"**FALSE.** The file's own definition of what is bound is a closure claim, and it is **still
> incomplete after the correction this round applied to it for exactly that defect**."*

Its mechanism: **Rule 2b** (`findCarrierNoteVerbatimViolations`, lint L596) binds the A5 carrier-note
quote at L531-546 — a third byte-binding path neither named set exhausts.

**Class:** closure claim incomplete / third binding mechanism.
**⚠️ CONFIRMED AGAINST THE CODEX TWIN — same sentence, both false, same defect class.** See
`Q1-twins-compare.md`. The sentence carries the document's own `CORRECTED (S-VLADW1-05, this round):`
marker: **a repair that did not repair, found independently by two lanes that never saw each other.**

## F-Q1I-2 — L12 — wrong unit

**Shipped, quoted by the lane:** *"every Proven claim carries its clause id"*

**Lane's grade and reason, verbatim:**
> *"**false as framed (granularity).** The unit Rule 1 enumerates is a **level-3 markdown heading**
> inside the `## Proven` span, not a 'claim': `findProvenClaimViolations` (L446) collects lines matching
> `CLAIM_HEADING_PATTERN` = `/^###\s+(.*)$/` and tests `/^P[1-4]\b/`. A Proven-section claim written as
> prose carries no clause id and is not reached. **Execution-proven — mutant M6** inserted, inside the
> `## Proven` span and not as a `###` heading."*

**Class:** wrong-unit (heading vs claim). **CONFIRMED against the codex twin — same sentence, same
reason.**

## F-Q1I-3 — L123-129 — **THE SPLIT FINDING: one clause false, one clause true**

**Shipped, quoted by the lane verbatim:**
> *"The sibling exhaustiveness rule (`custody-claim-lint/only-surface-assertion`) … matches
> exhaustiveness PHRASES **inside bound paragraphs**, it has no count branch, and it therefore does not
> detect count-form exhaustiveness claims … A count standing inside a bound paragraph is not checked."*

**Lane's grade, verbatim — and it splits the sentence itself:**
> *"**false as framed (granularity), on the first clause only. The 'no count branch' half is true.**"*

**Reason:** `findOnlySurfaceAssertionViolations` (L1840) iterates
`extractBindableParagraphs(content).paragraphs` — **the derived population, not `BOUND_PARAGRAPHS`** —
so by the document's own L12-17 definition it does not cover the bound set it names.

**Class:** wrong-unit (derived population vs bound set), **scoped by the lane to one clause.**

**⚠️ THREE DISTINCT DEFECTS ACROSS THE TWO LANES IN THIS ONE SENTENCE** — the twin's (derived vs
bound), and the codex lane's two (the phrase matcher is only `only … place|surface`; **and** Rule 3
*does* scan bound paragraphs for counts, `5 of 8 controls verified.` → `aggregate-count-conflation`).
**Both lanes graded it false; the reasons are not interchangeable.** Relevant to NO STACKING: β maps
which single criterion the sentence fires.

## F-Q1I-4 — L133-137 — incomplete enumeration, inside a BOUND paragraph

**Shipped, quoted by the lane verbatim:**
> *"It applies, in order: NFKD compatibility normalization; deletion of every default-ignorable code
> point; deletion of the combining marks NFKD has just exposed; a confusable fold from Cyrillic and
> Greek homoglyphs to their Latin skeleton; **the Unicode dash class `\p{Pd}` plus the mathematical
> minus sign** folded to a single hyphen; whitespace runs collapsed to one space; and case …"*

**Lane's grade and reason, verbatim:**
> *"**false (incomplete enumeration), inside a BOUND paragraph.** The order is right. The dash-fold
> membership is not."* — `DASH_CLASS_PATTERN` (L220).

**Class:** incomplete enumeration. **Union with the codex twin, which cites the same dash-class defect
and additionally the omitted fold (8).** The twin's *"inside a BOUND paragraph"* is the sharper framing
— **the binding mechanism is pinning an incomplete description.**

---

## `what_i_could_not_assess` — the lane's own, quoted

1. *"**Whether `ASSERTED_PARAGRAPHS` A1-A4 actually match ADR-0041.** No mechanism in this tree compares
   them; I did not locate or read the ADR. The L494-500 clause 'reproduced verbatim from ADR-0041' is
   therefore **cannot-determine, not true**."*
2. *"The truth of A6, A7, A8, and of the P1/P3/P4 clause bodies and their Ceilings … I verified only
   that they are bound and byte-identical to their canonical copies. I did not open the files they
   describe."*
3. *"**The four-file audit-coverage disclosure (L216-L311)** — the 122-claim table, the 64/30/28 split,
   and findings S06-F01/S06-F02. These are a record of a prior lane's read. I did not re-derive them,
   and **I explicitly decline to round them up or down.**"*
4. *"**Intent claims.** … I can confirm the code is consistent with these, not that the intent is as
   stated."*
5. *"Whether the lint is wired into anything that runs on a user's install."*
6. *"**`getTokenAlphabetCoverage()` caller-search completeness.** I grepped `scripts/` for callers and
   found none outside tests. **A caller reaching it through a computed property name or a re-export
   would not appear in that grep.**"*

**⚠️ Item 6 is the widened absence rule applied by the lane to its own search, unprompted** — it bounds
a negative finding by naming what its query cannot reach. **Item 3 is the same discipline applied to
someone else's numbers**: declining to re-derive rather than passing them along.

---

## Conductor observations — NOT gradings

1. **This lane's true set is large and several items are execution-proven by mutants** (M1-M8 through
   the real CLI, full test file 117/117). It is not a lane that graded everything true, and the
   contradictions it produced with the codex twin split **both ways** — see `Q1-twins-compare.md`.
2. **Its four false findings are all confirmed or unioned with the codex twin**, none contradicted:
   F-Q1I-1 and F-Q1I-2 are same-sentence confirmations; F-Q1I-3 and F-Q1I-4 are same-sentence
   agreements with additional or different defects.
3. **F-Q1I-1 is the round's confirmation case** and the strongest S5-1 evidence available: two readers,
   two model families, **byte-identical artifact-only briefs naming no symbol, no line, no finding**,
   converging on a sentence this sprint corrected in this round. Per β `c7e2b84f` §2 this is the
   **positive case of the frame rule (ED-384)** — a shared *task* frame is not a shared *answer* frame.
