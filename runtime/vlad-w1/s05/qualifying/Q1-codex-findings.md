# Q1 (codex) — extracted finding set

**Lane:** `d-mtf67lqj-8cad4634`, cabinet/openai gpt-5.6-sol, ok:true, 831585 ms, raw output
`out-Q1.json` → `out-Q1-claim-truth.md`. **Token, read from the lane's own raw file, line 1:**
`{"verdict":"fail"}`

**Envelope budget: STATED-AND-EXCEEDED.** The dispatch envelope stated *"spend at most ~7 minutes on
analysis, then WRITE."* The lane ran **831585 ms ≈ 13.9 min** — roughly 2× the stated line, inside the
900 s bound — and read the assigned surface end to end. Recorded as stated-and-exceeded, never as
"worked within budget."

**Lane's own coverage fields, quoted:**
> `files_i_could_not_see`: *"Assigned surface: none. CUSTODY.md L1-619, custody-claim-lint.js L1-2080,
> and custody-claim-lint.test.js L1-2862 were read end to end."*
> `what_i_could_not_assess`: *"The historical provenance and chronology claims at L18-23, L26-29,
> L47-50, L75-86, and L148-150. Current behavior or recreated mutants often agree, but these bytes do
> not prove that a named earlier run, draft, or commit actually behaved as reported."* · *"The
> canonical `node --test test/custody-claim-lint.test.js` runner could not start its child process in
> this sandbox (`spawn EPERM`). Running the test module directly executed all 117 registered tests
> successfully."*

**This file is an EXTRACTION, not a grading.** No finding is added, removed, paraphrased or mapped to a
criterion. Criterion mapping is β's at the close under NO STACKING. Conductor observations, where any,
are quarantined in the final section and are explicitly not gradings.

---

## Emitted graded set — line numbers

**Graded FALSE (14):** L6 · L7-11 · L12 · L13-17 · L64-73 · L80-83 · L115-116 · L123-127 · L131-132 ·
L132-137 · L150-152 · L154-157 · L171-174 · L188-192

**Graded TRUE — emitted as the list, count derived by the reader from it, per R1:** L24-27 · L27-29 · L29-36 · L36-38 · L40-45 · L50-56 · L56-60 · L79 ·
L83-90 · L92-96 · L96-110 · L111-113 · L137-139 · L139-142 · L142-147 · L152-154 · L158-170 · L174-178
· L179-182 · L182-183 · L185-188 · L192-198 · L200-204 · L205-207 · L208-212 · L421 · L498-500 ·
L526-529 · L579-582

**Arithmetic, per β row 371 §6 — MEASURED from the file, not asserted, no `~`:**

```
labelled entries (S01…S37 incl. lettered sub-entries), unique:  43
grade lines matching ^(true|false|cannot-determine):            43
  false             14
  true              29
  cannot-determine   0
```

**14 + 29 + 0 = 43**, and the 43 grade lines match the 43 labelled entries one-for-one, so the emission
is complete with nothing ungraded.

**Two corrections to my own earlier statements, both caught by measuring rather than by review:**
1. My report of *"~37 sentences graded, fourteen false"* conflated **labelled entries** with **graded
   propositions** and carried a `~`. Superseded by the block above.
2. My **first attempt at this very reconciliation** asserted *"FALSE 14 / TRUE 25 / cannot-determine 4"*
   — the right total reached with **wrong components**. There are **29 true and zero cannot-determine
   entries**; the items I mentally filed as cannot-determine live in the lane's
   `what_i_could_not_assess` field, which is not a graded entry. Reaching a correct total through wrong
   parts is the failure mode this sprint exists to end, committed inside the paragraph fixing the
   previous instance of it — recorded rather than silently fixed.

---

## FALSE — each with the shipped sentence verbatim, the lane's reason verbatim, and the lane's class

### F-Q1-01 — L6 — class: wrong-unit
**Shipped, verbatim:**
> ``scripts/checks/custody-claim-lint.js` checks this file on every run.`

**Lane's reason, verbatim:**
> *"CLI `main()` accepts `process.argv[2]`, and the exported lint accepts arbitrary supplied content.
> The package's `check:custody` invocation uses the default file, but the sentence says every run
> without that qualifier."*

### F-Q1-02 — L7-11 — class: wrong-unit
**Shipped, verbatim:**
> *"Byte-for-byte (modulo line-wrap whitespace) where byte-for-byte is what matters: EVERY Asserted
> paragraph, A1 onward, and EVERY paragraph led by a bolded `Ceiling` lead-in inside the Proven
> section."*

**Lane's reason, verbatim:**
> *"the actual unit is a blank-line block beginning at column 1 with literal `**A<n> — ` or
> `**Ceiling — `, plus a finite resemblance predicate. Four independently constructed additions each
> produced `ok:true`, zero violations: `A9 — …` · `<b>A9</b> — …` · `▪ **Ceiling — …**` ·
> `|**Ceiling — …**`"*
>
> Derivation rule the lane stated for that probe set: *"each item fits one noun class named by the
> sentence but misses one actual grammar requirement. This population does not claim to enumerate
> every evasion."*

### F-Q1-03 — L12 — class: wrong-unit / closure
**Shipped, verbatim:**
> *"everywhere else: every Proven claim carries its clause id, and nothing conflates the two sections."*

**Lane's reason, verbatim:**
> *"Rule 1 enumerates only `###` headings and checks only a `P1`–`P4` prefix. Rule 3 recognizes fixed
> status-token and rollup shapes. The committed suite affirmatively verifies that comma-, semicolon-,
> and period-separated forms of the Asserted status remain unmatched in Proven prose."*

### F-Q1-04 — L13-17 — class: contradicted-by-mechanism (a third binding path)
**Shipped, verbatim:** the "if and only if" passage, incl.
> *"…OR when it is item (3) below — the ONE paragraph bound by a separate, non-derived mechanism named
> further down this file … — everything else in this file is NOT bound byte-for-byte, however plainly
> it states a claim. CORRECTED (S-VLADW1-05, this round):"*

**Lane's reason, verbatim:**
> *"Rule 2b separately byte-binds three `SANCTIONED_CARRIER_NOTE` sentence segments. Runtime inspection
> returned 15 derived paragraphs, 16 canonical paragraph entries, and three carrier sentences, none of
> which is a derived paragraph."*

**Note carried, not graded:** the shipped text is self-labelled *"CORRECTED (S-VLADW1-05, this round)"*
— i.e. this is a sentence the sprint edited in this attempt.

### F-Q1-05 — L64-73 — class: wrong-unit / closure
**Shipped, verbatim (the enumerated prefix class and its closing promise):**
> *"After any leading run of markdown block-level or wrapping prefixes — list items, ordered-list
> markers, blockquotes, ATX headings, table-cell delimiters, HTML start tags, wrapping
> brackets/parens/quotation marks, and a bare label word followed by a colon, nested to any depth — is
> stripped … A candidate is bound or REFUSED by name; it is never silently skipped."*

**Lane's reason, verbatim:**
> *"`BLOCK_PREFIX` contains a hand-enumerated bullet set and whitespace-sensitive alternatives. The
> square-bullet, circled-order-marker, and no-space table-delimiter probes returned `null`; the full
> lint emitted no violation for the corresponding new paragraphs."*

### F-Q1-06 — L80-83 — class: wrong-unit / closure
**Shipped, verbatim:**
> *"WIDENED (S-VLADW1-05, bundle N) from list-item/blockquote prefixes only to the fuller class named
> in the paragraph above…"*

**Lane's reason, verbatim:**
> *"it handles the grammars actually encoded, not the whole named classes. Unicode bullets outside
> `[-*+•‣◦]`, circled order markers, and `|` without following whitespace remain outside it."*

### F-Q1-07 — L115-116 — class: wrong-unit
**Shipped, verbatim:**
> *"(2) THE ROLLUP CLASS. The rollup rule matches a named lexical family: digit-form counts, and the
> word `all`."*

**Lane's reason, verbatim:**
> *"the actual units are much narrower: `N / M` or `N of M` followed within 40 characters by selected
> nouns, and `all … controls|claims … verified` within fixed windows. Many digit counts and uses of
> `all` are not enumerated."*

### F-Q1-08 — L123-127 — class: wrong-unit + contradicted-by-mechanism
**Shipped, verbatim:**
> *"it matches exhaustiveness PHRASES inside bound paragraphs, it has no count branch, and it therefore
> does not detect count-form exhaustiveness claims … A count standing inside a bound paragraph is not
> checked."*

**Lane's reason, verbatim:**
> *"the rule matches only `only … place|surface`; additionally, Rule 3 scans every physical line,
> including bound paragraphs, for its numeric aggregate shape. `5 of 8 controls verified.` produced
> `aggregate-count-conflation`."*

### F-Q1-09 — L131-132 — class: wrong-unit ⚠️ CONTESTED (β `a2f47b90` §3)
**Shipped, verbatim:**
> *"(3) NON-BREAKING SPACE. Every token comparison in the lint renders BOTH sides through one named
> canonical transform, `canonicalizeClaimText`."*

**Lane's reason, verbatim:**
> *"section headings, P-tags, canonical paragraph markers, and several regex expectations are raw
> comparisons. Replacing the real `## Proven` heading with `## Pro<U+200B>ven` produced
> `missing-proven-section`, proving that token was not canonicalized."*

**⚠️ ADJUDICATED — β RULES THE SENTENCE **TRUE**; THE LANE OVER-GRADED** (β `d4a91c67` §1,
`3e6d1a94` §2). The lane's grade above is preserved as the lane's; this is the adjudication beside it.

`CUSTODY.md` **defines the term itself**:
> L174-175: *"The **token comparison** that consumes the transform also tolerates separator variance
> between the words of a multi-word **status token**."*
> L186-187: *"…before the **status-token comparison** Rule 3 runs."*

So *"every token comparison"* means **every status-token comparison**, and they all route. The lane's
counterexample runs against `PROVEN_HEADING_PATTERN` (L385) → `missing-proven-section` (L451) — a
**section locator**, which finds a region rather than comparing a claim token. **The execution is real
and it does not falsify this sentence.** Three independent convergences: the document's own vocabulary
(β), the Q1 twin from source, and this sprint's own `TRANSFORM-ROUTING.md` L86-114 (*"Structural
matchers over markdown SHAPE, not claim TEXT"*).

### F-Q1-10 — L132-137 — class: incomplete-transform-description
**Shipped, verbatim:**
> *"It applies, in order: NFKD compatibility normalization; deletion of every default-ignorable code
> point; deletion of the combining marks NFKD has just exposed; a confusable fold from Cyrillic and
> Greek homoglyphs to their Latin skeleton; the Unicode dash class `\p{Pd}` plus the mathematical minus
> sign folded to a single hyphen; whitespace runs collapsed to one space; and case…"*

**Lane's reason, verbatim:**
> *"the implementation also applies fold (8), markdown emphasis, between the dash and whitespace folds,
> and `DASH_CLASS_PATTERN` additionally includes U+30FC. Direct probes produced
> `canonicalizeClaimText("**Alpha**") === "alpha"` and `canonicalizeClaimText("AーB") === "a-b"`."*

### F-Q1-11 — L150-152 — class: contradicted-by-tests ⚠️ sprint-authored this round
**Shipped, verbatim:**
> *"but no check in this tree calls it to verify the numbers in THIS paragraph."*

**Lane's reason, verbatim:**
> *"tests L2403-2450 call it and assert exactly: domain 15, covered 12, lower-case `n` claimed
> elsewhere, and `L`/`R` no-candidate. The narrower statement 'no check parses this paragraph and
> compares its bytes to the return value' is true, but that is not what this sentence says."*

**This sentence was authored by Task 5a in this round** (the Route-B reword of bundle O's withdrawn
sourcing claim).

**⚠️ ADJUDICATED — β RULES THE SENTENCE **TRUE**; THE LANE OVER-GRADED** (β `d4a91c67` §2). The
shipped sentence carries the qualifier **"to verify the numbers in THIS paragraph"** — quoted verbatim
above. The tests at L2403-2450 call the function and assert **its own return values**; they do **not**
parse this paragraph and compare its bytes. **That is exactly what the sentence says.**

**The lane quoted the qualifier and then graded against a version without it** — its own *"the narrower
statement … is true, but that is not what this sentence says"* is materially the same claim as the
shipped sentence, so it distinguished two statements that say the same thing and graded on the
distinction. **α verified this extraction carries the qualifier, so the misreading is the LANE's, not
the relay's.**

### F-Q1-12 — L154-157 — class: contradicted-by-mechanism ⚠️ sprint-authored this round · CONTESTED by ε
**Shipped, verbatim:**
> *"No generation or binding path connects either copy to the function's live return value, so the two
> hand-typed copies can drift from each other, **or from what `getTokenAlphabetCoverage()` would
> actually report**, without anything here noticing…"*

**Lane's reason, verbatim:**
> *"changing only CUSTODY.md's `NFKD` wording produced `bound-paragraph-missing`. The two copies can
> jointly drift from the live function, but they cannot drift from each other silently."*

**⚠️ Conductor observation, flagged not graded: the shipped sentence is a DISJUNCTION.** The lane's
reason grants the second disjunct (*"can jointly drift from the live function"*) while falsifying only
the first.

**⚠️ ADJUDICATED — β RULES IT **STANDS**, but on AP-17 rather than falsity** (β `3e6d1a94` §4, its
closest call at 0.84; β withdrew its earlier grading in `f2a08d51` §0 on the conductor's argument).
> *"Logically 'A or B' is true when B is true — and B is true. **Grading it as a false sentence was
> wrong.** But the applicable standard is AP-17: a residual disclosure that is itself inaccurate is a
> new finding. S26 **is** a disclosure, and its first clause tells the reader drift between the copies
> goes unnoticed — which `bound-paragraph-missing` catches."*

**So it stands as a finding, and the repair is to STRIKE THE FIRST CLAUSE, not rewrite the sentence.**
Note the shape: the false half is falsified by **the binding mechanism this same round strengthened**
— a disclosure contradicted by its own sprint's fix.

### F-Q1-13 — L171-174 — class: wrong-unit / closure
**Shipped, verbatim:**
> *"a leading run of block-level or wrapping prefixes (item (1) above names the full class) and any
> indentation are stripped…"*

**Lane's reason, verbatim:** *"same counterexamples as S12/S14."*

### F-Q1-14 — L188-192 — class: wrong-unit ⚠️ CONTESTED (β `a2f47b90` §3)
**Shipped, verbatim:**
> *"There is ONE shared fold inside `canonicalizeClaimText`, applied by default, with ONE documented
> opt-out (`resemblesBindableLeadIn`, which needs the raw emphasis run intact as lead-in shape data,
> not noise to fold away) — that is the full call-site population for THIS fold specifically, verified
> against this file's own source rather than assumed."*

**Lane's reason, verbatim:**
> *"`statusTokenPattern` and `containsStatusToken` forward the public `emphasisFold` option to
> additional transform calls. The committed tests invoke `containsStatusToken(..., {emphasisFold:false})`;
> direct execution showed the default matched a formatted token while the opt-out did not."*

**⚠️ ADJUDICATED — β RULES THE SENTENCE **TRUE**; THE LANE OVER-GRADED** (β `3e6d1a94` §1, measured by
β independently, confirmed by α at the pin, and reached separately by the Q1 twin from source).

Every occurrence of `emphasisFold` in the file:
```
187, 357, 879    comments
362, 1291, 1312  JSDoc @param annotations
367   const emphasisFold = opts.emphasisFold !== false;      <- the option is READ
374   if (emphasisFold) folded = folded.replace(EMPHASIS_FOLD_PATTERN, " ");
888   const canonical = canonicalizeClaimText(line, { caseFold: false, emphasisFold: false });
```
**Nine occurrences, ONE call site.** The sentence says *"call-site population"*, and the call-site
population is one. **The lane's reason concerns API reachability** — L1291/L1312 are JSDoc showing the
functions *accept* opts — **which is a different claim.**

> `grep -c "emphasisFold: *false"` returns **4**, three of them comments. **A bare count reports four
> opt-outs; the emitted list reports one** — the emitted-set discipline vindicating itself inside the
> settling read of a finding about a closure claim.

---

## β `6b09e254` §3 — THE L36 LOOKUP: **UNION, not contradiction. The quote-rule does NOT fire.**

**`CUSTODY.md` L29-36 is ONE SENTENCE WITH TWO CLAUSES**, and each lane took a different one. Verbatim:

> *"Other illustrative, non-exhaustive examples of the same unbound class: the numbered
> limits-of-this-checker paragraphs below …, the audit-coverage disclosure … , the P1–P4
> status/enforcer/proof-scope lines, the P1–P4 BODY PROSE …, A1's `Live measurement` follow-on
> paragraph, and the commentary paragraphs around A5 — **which the structural and forbidden-phrase
> rules check, but no stored copy pins.**"*

**Q1's S07 covers L29-36 and graded it TRUE — but only the pinning clause.** Its own `Would require`
line, verbatim: *"Would require those specific unmarked blocks to be absent from `BOUND_PARAGRAPHS` and
the carrier bind."* Reason: *"verified against the entire canonical map and Rule 2b."*
**Q1 never tested "which the structural and forbidden-phrase rules check."**

**Q2 in-process's F-1 attacks that untested clause** — that the `## Asserted` region (where the A5
commentary sits) is scanned by no forbidden-claim rule.

**Therefore: disjoint clauses of one sentence → UNION.** No lane contradicts another; rule (d) does not
fire.

**And it leaves a residue worth β's attention:** the *"which the structural and forbidden-phrase rules
check"* clause is an S5-1 candidate **that no lane graded as a sentence** — Q1 did not test it, Q2
attacked the mechanism rather than grading the prose. It exists only in the union.

---

## Conductor observations — NOT gradings, NOT findings, quarantined here deliberately

**⚠️ THE HEADLINE NUMBER IS WITHDRAWN. This file emitted fourteen lane-graded-false entries; β has
since adjudicated four of them.** The correct form is: **fourteen graded false by the lane; three
over-graded on β's read (F-Q1-09/S19, F-Q1-11/S24, F-Q1-14/S31); one standing on revised grounds
(F-Q1-12/S26, on AP-17 rather than falsity).** **No number is carried.**

**"At most eleven" is withdrawn from this file** (it stood here until α flagged it). β withdrew
*"eleven"* at `1b8f4a20` as a **METHOD error, not an arithmetic one**: it was obtained by subtracting
over-gradings from **the codex lane's fourteen**, which silently makes **one lane's set the baseline
and the other an adjustment to it** — and the twin's own false set is four. The union is built item by
item and can land outside either lane's count. **The honest forms are:** *"the two Q1 lanes agree on
four items and disagree on nine; of the nine, four settled codex-right, two settled as codex
over-gradings, three are definitional and one was mis-populated"*, or **floor eight / ceiling twelve
with no number carried**. β's Part B fills the slot.

1. **The four adjudications are annotated in place above, beside the lane's own grade** — the lane's
   verdict and the adjudication side by side, neither deleted.
2. **All three over-gradings are this sprint's own wrong-unit family, committed by the grader of it:**
   a **reachable surface** read as a call-site population (S31), a **defined term** graded against its
   general meaning (S19), and **a qualifier the lane quoted and then dropped** (S24). The lane read
   the file end to end, quoted correctly, and misgraded anyway — which is β `8c4f0b23` §2's point that
   **a quote makes an error checkable by the next reader; it does not prevent it.**
3. **F-Q1-11 and F-Q1-12 are sentences the sprint authored in THIS round** (Task 5a's Route-B reword).
   β's rider: explanatory for the retro, **never a mitigation** — and note that after adjudication one
   of the two (S24) is **not** a defect at all, while the other (S26) stands on a revised ground.
4. **The conductor put "fourteen" into circulation and it did not survive.** It was reduced by β's
   reads, by a settling read the conductor ran on its own headline findings, and by the Q1 twin — none
   of which would have happened had the number been accepted.
