# S-VLADW1-05 — ROUND RECORD

Opened 2026-08-29 at design close. **No build has run.** This file exists now so the pre-close checklist
is written before there is any result to be tempted by.

**Rule:** β row **317** (`2f8c15e6-9d43-4a70-b1c9-84e06fa3d7b2`) as amended by row **318**
(`7b3e6d21-c48f-4e95-a012-3f9d5c07b6ea`). Both cited wherever the rule is quoted.
**Surface:** vlad `wt/S-VLADW1-01-engine` @ `6a105f2`, unmerged. **Build NOT authorized.**

---

## PRE-CLOSE CHECKLIST — every item must be discharged before the qualifying close

- [x] **Resolve the four-file list by a READ of the gauntlet-2 `what_i_could_not_assess` fields.**
      β relied on ε's report for this list and flagged it as **unverified by β and load-bearing in the
      rule**. **Done at design, 2026-08-29 — result below.** Re-affirm at close.
- [ ] **The close states the class's status honestly, verbatim** (row 318's amended terminal):
      *this sprint fixes three known instances of a class whose size is unknown, with the four un-audited
      shipped surfaces named and carried to the successor.* Applies to a NO-RELEASE close as much as to a
      release.
- [ ] **S5-4 discharged by a LANE**, not by ε, against the predicate as built, population = every newly
      authored or edited paragraph, controls first. **The design battery does NOT discharge it.**
- [ ] **`run-battery.mjs` re-derived or independently checked by a lane.** β's not-read list says the
      harness account is ε's report, unverified, and **load-bearing for every AS-IS/FIXED cell** in the
      design battery. Standing invitation to a gauntlet lane; do not let the design numbers ride
      unexamined into the close.
- [ ] **Bundle O's emitted coverage set exists and bundle P's prose is sourced FROM it**, never hand-typed
      (S5-2(a), binding per row 318).
- [ ] **Every criterion S5-1…S5-7 dispositioned** with evidence, and **NO STACKING** — one defect fires
      one criterion, specific before general.
- [ ] **ED-340 / ED-354 / ED-358 dispositions restated.**

---

## RESOLVED AT DESIGN — the four-file list, and a frame error of the conductor's own

**The list is CORRECT.** Read of the gauntlet-2 evidence files:

- **qa lane** — names all four verbatim in `what_i_could_not_assess`:
  > *"The non-CUSTODY shipped files' prose: src/env-scrub.js, src/model-seam.js,
  > driver/host-free-driver.js and src/server-entry.js carry substantial custody prose in comments that I
  > sampled rather than read end to end. A false sentence could be sitting in those regions and I would
  > not have seen it."*
- **backend lane** — independently corroborates two: `src/env-scrub.js` *"header comments and greps only;
  the executable body was not read line by line"*; `src/server-entry.js` *"greps and the RF-7-adjacent
  region only; runCustodySelfCheck's definition body was not read."*
- **security lane** — **does NOT say it.** It mentions all four files, but never in a
  `files_i_could_not_see` or `what_i_could_not_assess` context.

**So: one lane said all four, a second corroborated two, and a third did not say it.**

**The conductor told β "every lane said so." That was false.** The four files are genuinely un-audited and
the disclosure obligation stands unchanged — the **data** was right. The **frame** rounded up from one
lane to all lanes.

**Recorded as a conductor-side instance under the ED-364 amendment** (cited, not re-filed): the frame
discipline — *no shipped claim without its attack, and no coverage claim at a coarser granularity than
the evidence has* — applies to **consult text and round records**, not only to shipped surfaces. This
file is itself in that scope.

**This is the sprint's own class, committed by the conductor, inside the consult that established it,
while arguing for a criterion against it.** β's Q2 distinction — *"β's S4-1a sentence's DATA was right and
its FRAME was the falsehood"* — describes this exactly. Recorded rather than quietly corrected, because a
correction that leaves no trace teaches nothing, and because the rule now rests on a list whose
provenance a reader is entitled to see stated accurately.

**Consequence for the build:** none to the rule. One to the discipline — bundle P task 5's disclosure
must name what each lane actually said, not "the lanes said". A disclosure about un-audited files that
itself over-claims its evidence would be the class a third time in the same sprint.

---

## BUILD LOG — bundle outcomes as they land (ε, observed not narrated)

### Bundle M — LANDED `3596c2d` (parent `6a105f2`), 2026-08-29

- **Liveness:** `d-mteu276t-7b184189`, `ok:true`, exit 0, elapsed 817689 ms, stdout non-zero.
  Diff read by the conductor: 2 files, +482/−25. Worktree clean after.
- **Gates, read separately by the builder:** `npm --prefix engine test` exit 0, **377 pass / 0 fail**
  (floor was 366); `npm --prefix engine run check:ship` exit 0.
- **TRAP 1 cleared with an OBSERVED-RED falsifier:** the fix is an `{ emphasisFold: false }` opt-out on
  `resemblesBindableLeadIn`. The builder reverted the real opt-out line in real source, ran the suite,
  got **4 genuine failures** (RF-1, RF-3, G-3, M-1), restored, re-ran 86/86 green. Not a described
  attack — a run one.
- **TRAP 2 decided and STATED:** alphabet `` [*_`~] `` (not the narrower `[*_]`); replacement **SPACE,
  not empty**, because empty would collapse `**only**place` → `onlyplace` and silently break
  `flattenForAssertionScan`'s own documented anti-evasion — verified by re-running that existing
  battery row post-refactor. `SEPARATOR_VARIANCE` / `TOKEN_WORD_SPLIT` / `escapeRegex` (β's
  owed-by-read items, row 320 "not read") were **read** and need no change, with the reason given.
- **RF-M2 asserts the CALL PATH**, not just output — verified by swapping in an unwired
  reimplementation of `containsStatusToken`, caught by 13 tests.
- **A FOURTH emphasis site** surfaced by the required inventory: `BOLD_LEAD_IN` (~554), scoped out with
  reasoning (raw-text structural id-derivation, not comparison-hiding) rather than silently ignored.

#### ⚠️ S5-3's "seven" — RE-DERIVED AS SIX. Flagged to α, not resolved by ε.

The builder **refused the brief's "seven, not eight" premise with evidence** — a correct return under
the standing discipline, and the third builder in this sprint family to refuse a false premise.
Executed against the transform **as built**: **six close by design** (bold-each-word,
underscore-each-word, bold-first, bold-last, backtick-each-word, single-asterisk-each) · **one already
red by accident** (strikethrough — tilde is already a `SEPARATOR_VARIANCE` member independent of any
fold) · **one remains open**, disclosed and pinned (mid-word bold `ASS**ERTED**`, the stated cost of
choosing SPACE over deletion). Run twice — a scratch script pre-commit, then re-verified as committed.
The builder states it did not adjust code to preserve "seven".

**Why this is the sanctioned path, not a violation:** β row 320 pre-authorized exactly this —
*"S5-3's seven-not-eight bound is contingent on that choice; no shipped sentence may restate the
number until it is re-derived against the built transform."* The re-derivation is the required act.

**Why ε did not resolve it:** S5-3's literal text says seven, results now exist, and the rule is frozen
in both directions after results. Whether S5-3 binds the **literal number** or the **property** was
α's application call, not the conductor's.

**RESOLVED — β row 324 (`b6e1d90f`), pre-close reading, explicitly NOT criterion-firing.** S5-3 binds
the **PROPERTY**: no shipped sentence overstates the fold's yield, stated as an emitted set derived
against the transform as built. **S5-3 is NOT failed.** β declared the conflict first — β authored
"seven", so a property reading is the reading β benefits from — ran the position-swap in both
directions, and re-derived the decomposition at source rather than accepting the relay: tilde is a
member of `SEPARATOR_VARIANCE` (`[\-:~|/\s]*`, L974) so strikethrough was caught by the separator
class independent of any fold; fold (8) is `/[*_`~]+/g` → SPACE (L280/L303) so `ASS**ERTED**` →
`ass erted` and mid-word bold stays OPEN. **6 + 1 + 1 = 8; the arithmetic closes.** The original
"seven" was right for the design battery's *simulated* fix (empty replacement) and wrong for the
*built* one — contingency, not a defect the sprint introduced.

Two of β's grounds are worth carrying into the retro: **a literal reading would have mandated shipping
a known falsehood** ("seven closed by design" is false), which no criterion can require when its own
siblings forbid it; and **the property reading is STRICTER** — under the literal, "seven" satisfies;
under the property, "seven" fails *and so does "six"*, because a bare count is an exhaustiveness claim.
A reading that raises the bar is not a softening reshape.

**β on the builder, recorded because it is the behaviour the rules exist to produce:** the refusal was
the right call — *"goalpost-moving is changing the rule to fit the result; this is correcting a number
to fit reality while holding the rule fixed."*

**β also confirmed the `{emphasisFold:false}` opt-out does NOT reintroduce S4-2(c)** (row 320 had
warned a per-caller opt-in might): the fold lives INSIDE `canonicalizeClaimText`, every caller gets it
by default, there is exactly one implementation (`EMPHASIS_FOLD_PATTERN`, exported so tests can assert
a shared alphabet), and one caller opts out with the reason documented. S4-2(c) was a fold implemented
*beside* the shared transform; this is a parameterised shared transform — a different thing.

**Consequence for bundle P — now its task 4b, four conditions, all required:** ship the emitted set BY
NAME (never "seven", never "six", never a bare count); disclose the mid-word residual as OPEN with both
halves of its mechanism; do NOT credit strikethrough to the fold, stating the separator-class reason;
and ship no "one place" / "single site" sentence — one shared fold, one documented opt-out, plus
shape-recognition uses that are a different mechanism.

**β's not-read, carried as a gauntlet obligation:** β verified the transform's *behaviour* by reading
it and deriving the eight rows itself, but did **not** read `engine/test/custody-claim-lint.test.js` —
so the 377/0 suite, the 86/86 restoration, the 13 RF-M2 tests and the 4 genuine failures are ε's relay
of the builder's envelope, unverified. **A gauntlet lane must verify the tests assert what they are
said to assert.**

### Bundle N — LANDED `1fb5b31` (parent `3596c2d`), 2026-08-29

Brief updated against M's actual return before firing: suite floor raised 366 → 377, plus an explicit
section that M's `emphasisFold:false` opt-out is load-bearing, guarded by M-1, and must not be removed
or bypassed; M's mid-word residual named as M's, not N's to close or restate.

- **Liveness:** `d-mteukug9-b8ccf260`, `ok:true`, exit 0, elapsed 852745 ms, stdout 4771 bytes. Diff
  read by the conductor: 2 files, +248/−20. Worktree clean after.
- **Gates, read separately:** `npm --prefix engine test` exit 0, **383 pass / 0 fail** (floor 377
  confirmed pre-change, +6 new); `check:ship` exit 0.
- **The class, implemented as a class:** two genuine Unicode **properties** (`\p{Ps}` open-punctuation,
  `\p{Pi}` initial-quote) and two **grammars** (HTML start tag `<[a-zA-Z][^<>]*>` — any tag name;
  label-colon `\p{L}[\p{L}\p{N}]*:` — any label word), proven with rows using two different tag names
  and two different label words. **Not a copy of the battery's twelve probed shapes.**
- **The honest partial, disclosed IN-SOURCE:** what remains an enumeration is named as one — the
  bullet/dingbat set `[-*+•‣◦]` (no backing Unicode property) and the two ASCII quote characters
  (neither `"` nor `'` is Ps or Pi). Property where a property exists; enumeration named as an
  enumeration where it does not. This is the shape S5-2(c) asks for.
- **RF-N1 pulled on REAL source:** reverted `BLOCK_PREFIX`, observed `not ok 88` / `not ok 89`,
  restored, reverified 92/92. Not merely described.
- **Over-refusal proven AS BUILT** (not by citing the battery): `## Proven` / `## Asserted` → null;
  keyword-bearing prose → null; `**Status:** PROVEN` plus six sibling shapes under the seven new prefix
  wrappers → null; real `CUSTODY.md` still derives 0 violations, `lintCustodyStatement` `ok:true`.
- **A false positive found BY EXECUTION and fixed in the right direction:** N's own synthetic fixture
  isolated `Status: **ASSERTED — NOT VERIFIED**.` onto a column-1 line, which the widened label
  alternative correctly flags — structurally it IS a candidate when isolated. N verified the real
  `CUSTODY.md` never isolates it that way, then **fixed the FIXTURE rather than narrowing the
  mechanism**, and disclosed that inline. Narrowing the mechanism to fit a fixture artifact would have
  been the easy, wrong move.
- **M's opt-out untouched — verified by the conductor, not taken on N's word:** `emphasisFold: false`
  appears in N's diff only as a CONTEXT line and is present at HEAD (`custody-claim-lint.js:777`,
  moved from ~717 by N's insertions). M-1 still in the test file.

#### ⚠️ N surfaced a BUNDLE P item

`CUSTODY.md`'s **"two escapes remain" sentence is now stale and undercounts**: the block-prefix gap N
closed was a **third, undisclosed escape**. N correctly did not touch it (forbidden file) and reported
it instead. Folded into O's brief as do-not-touch; **P owns the sentence** and must revisit whether
only the two bundle-G-disclosed residuals remain.

#### ⚠️ ED-377 ENVELOPE FIELDS ABSENT FROM N — carried as a gauntlet obligation

N's brief went out **before** the ED-377 field list was added to the brief template, so
`what_i_could_not_assess`, `files_i_could_not_see`, `execution_proven` and
`what_would_confirm_or_refute` are absent from its envelope. Its closing *"Nothing left undone"* is
**not** the same claim as `files_i_could_not_see: []`.

All four are treated as **UNKNOWN**, never as "it saw everything" — the ED-362 trap is reading an
absent scope-list as full coverage. Not re-dispatched to ask: that subprocess is gone and a fresh agent
would have none of N's context, so any answer would be a reconstruction rather than a report.
**A gauntlet lane must establish N's read-scope independently.** The cause is the conductor's brief
ordering (the field list was added to O/P/Q after N had already been fired), and it is the conductor's
cost, not the builder's.

### Bundle O — LANDED `fbda0dc` (parent `1fb5b31`), 2026-08-29

- **Liveness:** `d-mtev4sj5-b40d1781`, `ok:true`, exit 0, **elapsed 1140905 ms** (19 min — inside the
  1200 s *builder* bound with 59 s to spare; the 900 s reviewer route would have killed it).
  stdout 6445 bytes. Worktree clean.
- **Gates, read separately, before AND after:** suite **393 pass / 0 fail** (floor 383);
  `check:ship` exit 0; `check:pointers` exit 1 by design.

#### ⚠️ O REFUTED TWO CARRIED FIGURES BY EXECUTION — both originating in β row 320

Row 320 stated *"Verified at source — the seven-unmapped-letters premise is CORRECT (derived
independently from `CONFUSABLE_FOLD` 213-230)"*, over a 22-letter alphabet. ε carried both into the
brief as measured fact. The builder refused both **and ran them**:

- *"the exported tokens give a 22-letter alphabet"* → re-derived by direct character iteration over
  the four source strings, **not** via the module's extraction code. **RUN: 15, not 22.**
- *"missing `R d g l n r t` — seven letters"* → computed per-letter coverage against the actual
  `CONFUSABLE_FOLD.values()`. **RUN: `F` is also missing** (absent from the list), and the true
  post-closure gaps are `n` (claimed-elsewhere) + `L`,`R` (no-candidate) — a different, smaller,
  differently-reasoned set.

It restated neither number anywhere in shipped code or tests; it pinned its own measured values in a
test and the commit message. **A verification-by-reading at the governance layer, relayed by the
conductor, was wrong in both its domain size and its gap set — and only execution caught it.** Third
premise-refusal by a builder in this sprint family, third time correct.

- **A silent no-op caught BEFORE shipping:** entries added *after* `CONFUSABLE_PATTERN` is built exist
  in the Map but the replace never fires (stale regex). O's first implementation had this; it ran a
  scratch test, caught it, fixed by placement, re-verified. The fold would have looked correct and
  done nothing.
- **β's ν collision call CONFIRMED by execution:** enumerated programmatically over the real map —
  **exactly one** real conflict (differing derived-vs-existing value), `ν`; all other same-key hits
  harmless (derived === existing). Resolved by keeping the deliberate pre-existing entry, disclosed
  in-code and in the coverage report.
- **RF-O1 observed RED three independent ways:** local pre-closure reconstruction; the shipped
  functions; and — beyond the brief — **disabling the real case-closure loop in shipped source**,
  watching tests 95/99/100/101 go `not ok`, then restoring.
- **Task 3 shipped as mechanism, not prose:** `tokenAlphabetDomain()` (~1681) reads the domain from
  `PROVEN_STATUS_TOKEN` / `ASSERTED_STATUS_TOKEN` / `RESEMBLANCE_KEYWORD.source`;
  `getTokenAlphabetCoverage()` (~1730) returns three groups (`covered` / `claimedElsewhere` with
  reason / `noCandidate`), tested for exhaustive non-overlapping partition. `CONFUSABLE_PATTERN` is
  now built FROM the post-closure map so the two cannot drift.
- **Task 4:** the false script-granularity ceiling sentence rewritten at letter granularity, sourced
  from task 3's function, **pinned by a test that greps the live source**.
- **Ceiling stated at its own strength:** O reports that `L`/`R` being *provably* unmappable is
  **"a bounded, disclosed belief, not a proof"** — reasoned from letterforms, deliberately no vendored
  table (correct per scope) — and says so in the code comment AND the exported function's doc comment.
  `what_would_confirm_or_refute` names UTS #39 as the check that would settle it. That is S5-2(c)
  arriving unprompted.

### The four-file read — DONE, and it changed what P must say

`d-mtew0q7m-70d95fa2` (cabinet/gpt-5.6-sol, `ok:true`, exit 0, 752719 ms, at `fbda0dc`).
**Gate met in the honest form:** `files_i_could_not_see: none`, with line counts confirming end-to-end
— `src/env-scrub.js` 520/520 · `src/model-seam.js` 732/732 · `driver/host-free-driver.js` 499/499 ·
`src/server-entry.js` 522/522. All four ED-377 fields present.

**122 coverage claims assessed — 64 true · 30 FALSE · 28 cannot-determine.** Per file: env-scrub
16/4/6 · model-seam 20/8/8 · host-free-driver 12/8/4 · server-entry 16/10/10. *Cannot-determine* means
the claim depends on another file, a test, a runtime trace or a package-wide search a **static**
four-file read cannot establish — not a defect verdict.

**The 30 are this sprint family's class verbatim** — "false by wrong frame", "false count/frame",
"false as an absolute guarantee", closure flags `EVERY`/`ONLY`/`NEVER`/`no other`. Three worth naming:
- `model-seam.js` *"Every secret CLASS either mode can carry … Both entries exist"* — the array has
  **six** entries. Wrong count and a false closure in one sentence.
- `model-seam.js` *"An unrecognized mode FAILS CLOSED — never silently defaulted"* — but
  `explicitMode || process.env[...] || DEFAULT_AUTH_MODE` **silently defaults** on an explicitly
  supplied empty string. A false fail-closed claim on a custody surface.
- `host-free-driver.js` and `server-entry.js` each say *"Stated deliberately WITHOUT a count"* in prose
  that says **"Exactly two"** ~19 lines earlier.

#### ⚠️ P'S OWN DISCLOSURE SENTENCE WAS FALSE, AND ONLY THE GATE CAUGHT IT

P task 5 was briefed to state the four files *"carry custody prose no lane has read end to end."*
**After this read that sentence is false** — and it would have shipped as the disclosure written to
prevent this exact class. Rewritten before P was dispatched: it now states the read happened (by
dispatch_id), carries the 64/30/28 tally **with its per-file table** (no bare count), records that the
read **ran nothing** so the 28 cannot-determines are *unresolved* rather than benign, and drops
"un-audited" as the now-false frame — they were audited, once, statically, by one lane. The
disclosure-not-repair ruling is unchanged; P repairs none of them.

**Not discharged by this lane:** β's own read of the four files at close (row 318 residual) is β's
item and stays open.

#### α RULING — the 30 become S-VLADW1-06. Recorded NOW so the close cannot quietly file it.

Raised to α and β rather than filed quietly. **α ruling (Class B, reversible):
disclosure-not-repair STANDS for S-05 exactly as row 318 says** — repairing them would be scope creep
on a one-attempt sprint whose own rule fenced them.

**The finding becomes the successor: `S-VLADW1-06` — "the four untouched files: 30 false / 28
unresolved coverage claims"** — minted **TRACKER-ONLY at S-05's close** (the S-05 / ED-365 pattern:
no registry entry until build authorization, because `add-sprint.js` repoints `primary`
unconditionally).

**Residual groups it must carry, verbatim:**
1. The per-file **64 / 30 / 28** table, with the lane's dispatch_id (`d-mtew0q7m-70d95fa2`) and the
   sha it read (`fbda0dc`). The numbers do not travel without the table.
2. The **closure-flag classes**: `EVERY` / `ONLY` / `NEVER` / `no other`; and the
   *"stated deliberately WITHOUT a count"* sitting beside *"Exactly two"* in the same file.
3. The **28 cannot-determines as UNRESOLVED, not benign** — the read executed nothing, so they are
   un-assessed rather than assessed-and-cleared.
4. **β's own still-owed read** of the four files (row 318 residual) — the successor's design→build β
   consult inherits it; S-05's close does not discharge it.

#### RETRO HEADLINE CANDIDATE — "an excerpt is a frame" (THREE instances, both directions)

**Every time in this sprint that anyone rated from a DESCRIPTION rather than the bytes, the bytes
moved the rating.** Three instances, in one afternoon, among careful readers acting in good faith:

1. **β's row-320 letter arithmetic** — "22 token letters, seven unmapped", marked *verified at
   source*. Bundle O ran it: the domain is **15**, and the gap list omitted `f` entirely. The
   description made the defect **LARGER** than the bytes. (β withdrew it, row 327 / `c81d47ae`.)
2. **ε's model-seam rating** — I described `model-seam.js`'s empty-string default as *"a fail-open on
   auth-mode selection"*; β rated the described shape **HIGH** while explicitly saying it was rating a
   description. Reading the bytes, the failure cannot move the seam into the api-key mode, so the
   rating drops to **MEDIUM**. The description made the defect **SMALLER**.
3. **ε's REASON for that downgrade** — I wrote that subscription is *"the credential-free mode."*
   **False.** `model-seam.js` **L3-5** names the OAuth/session state as credential material in the
   same clause as the API key, and **L167** carries `patternSource: "^sk-ant-oat"` — subscription has
   a secret shape of its own. β found it by reading **350 lines above my excerpt**. My conclusion
   survived on a different, sound reason (`DEFAULT_AUTH_MODE` is a fixed constant, so no input
   silently selects api-key); my stated reason did not.

**MY QUOTATIONS IN (3) WERE EXACT AND THE RATING STILL MOVED**, because the load-bearing fact sat
outside the frame anyone thought to quote. β's formulation, which belongs in the close:

> *"An excerpt is a frame, and a frame chosen by the person making the claim will tend to contain the
> evidence for it."*

That is not bad faith — **it is what excerpting is.** S6-1 says a claim is never satisfiable by
mechanism evidence or an approval chain; this chain adds **nor by a description of the bytes,
including a verbatim quotation of the relevant lines.** And the person quoting is the *least* able to
notice the frame, having chosen it for its relevance to the claim they already hold. β found L3-5 by
reading **outside** the frame, not by reading more carefully — that is the transferable instruction.

**Not filed as symmetry — and β corrected ε's first attempt at the causal account, AGAINST itself.**
ε originally wrote *"I authored the descriptions that produced both of β's errors, so the causal
weight is not even."* **β showed that is wrong on row 320, in the direction that does not flatter β:**

> *"Row 320's figures came from **DUMP.md**, not from you. The error was mine and self-caused: I took
> '22 token letters, seven unmapped' from a handoff artifact and marked the compound **VERIFIED AT
> SOURCE** having checked one conjunct. You then carried it into bundle O's brief as measured fact
> **because my marker said the check was done**. The causal arrow on that one runs **from me to
> you** … I would rather have that straight in the record than accept a symmetry that flatters me."*

So the accurate account is: **β authored one of ε's errors** (via an unearned VERIFIED marker —
AP-16's harm working exactly as described: the marker stops the next reader), and ε authored one of
β's (the "fail-open on auth-mode selection" phrasing β rated without opening the file). Neither party
gets to hold the generous version.

**THE REMEDY IS STRUCTURAL, NOT ATTITUDINAL — this is the transferable half.** Since the person
quoting chose the frame for its relevance to the claim they already hold, **no amount of care by the
quoter fixes it.** ε's quotations were exact and the rating still moved twice. The remedy is a
**second reader positioned OUTSIDE the frame** — not a more careful reader, a differently-positioned
one. **"Open the file" transfers; "quote accurately" does not.**

**A convergence worth noting:** the paragraph ε would have relied on for "credential-free" —
`model-seam.js` L12-17, *"this module never requires, persists, or emits a developer API credential in
that mode (AC-1.1)"* — **is itself one of the 30 false claims** the four-file lane graded FALSE
(top-level init captures all denylisted values regardless of mode). The sentence that would have
justified the false reason is one of the sentences this sprint is disclosing as false.

#### RETRO HEADLINE CANDIDATE — "a disclosure is a claim"

**The disclosure sentence written to prevent false claims was itself false until the gate ran.** P
task 5 was briefed to state the four files carry prose *"no lane has read end to end"*; the read that
was the precondition for drafting it made it false, and it would have shipped inside the very sentence
whose purpose was to prevent this class. P-117 / AP-17 demonstrated on the conductor's own draft
rather than on a builder's. The **"un-audited" frame is retired everywhere in P's output** — they were
audited, once, statically, by one lane, and saying otherwise is now the false frame.

### Bundle P — DISPATCHED `d-mtewjw6n-88034685` after the gate was met.

β row 319 Q2 (reaffirmed row 324) requires the four un-audited files be **resolved by read before P
task 5's sentence is drafted**, and assigned that read to the *diagnostic lane's* secondary
objective — **but the diagnostic gauntlet runs AFTER the build, and P is a build bundle.** The
prerequisite was scheduled after its dependent. P as briefed would have reached task 5, found no lane
output to cite, and halted — a wasted bundle under ONE attempt. Not a defect in the ruling; a
conductor-side scheduling gap.

**Resolved by dispatching the read as its own lane:** `d-mtew0q7m-70d95fa2`, read-only, reads all four
end to end, returns per-file quoted coverage claims with true/false/cannot-determine verdicts.
P fires when it returns; Q is held behind P.

P's brief re-checked against O and N before firing: sources from O's real exports by name; **bars any
letter figure from an earlier document** (O measured the carried ones wrong); requires O's `L`/`R`
ceiling to travel as the disclosed belief it is; and carries N's finding that *"two escapes remain"*
**undercounts**.
Brief re-checked against N's actual return before firing: floor 377 → 383; N's widened `BLOCK_PREFIX`
and its disclosed-enumeration residual marked as N's and not to be re-opened; the stale
"two escapes remain" sentence marked as P's, not O's.

---

## Standing notes for whoever conducts the build

- **Bundle order is load-bearing:** M → N → O → P → Q. `CUSTODY.md` must never have two editors, and
  P (prose) runs LAST because its input is O's emitted set.
- **RF-M1 is claimed over SEVEN, not eight** — strikethrough was already RED as-is. A test or sentence
  claiming eight is a granularity falsehood and fires S5-2.
- **Bundle O's domain comes from the module's exported tokens** (`PROVEN`, `ASSERTED — NOT VERIFIED`)
  plus the `Asserted`/`Ceiling` keywords — 22 letters, of which the fold misses `R d g l n r t`. Scoped
  to `Ceiling`+`Asserted` alone it misses six, and capital `R` would ship unmapped under an
  honest-looking emitted sentence.
- **ED-363 environment block applies to every bundle**: cwd is a WarpOS isolation worktree, the target is
  the vlad path, plain single `git -C "<abs>"` commands only.

### Bundle P′ — LANDED `f77b474` · Bundle Q — LANDED `4d15e4b`. LANE A'S BUILD IS COMPLETE.

Chain: M `3596c2d` → N `1fb5b31` → O `fbda0dc` → P `de1f3f3` → P′ `f77b474` → Q `4d15e4b`.

**P′** (`d-mtex3niv-a1519b18`, 377044 ms): corrected the audit-coverage FRAME. Selection criterion
now stated as *what the lanes did* ("the src/driver files every gauntlet-2 lane SAMPLED RATHER THAN
READ END TO END"), completeness declared UNTESTED, the `S06-Fnn` table partitioned by aboutness.
`S06-F01` ships on the sound reason (fixed-constant default, verifiable from L102 alone) with
"credential-free" appearing only inside its own withdrawal, and the residual in BOTH directions.
**`S06-F02` went further than briefed** — it read `initCredentialCustody(ENV_DENYLIST)` **at the call
site (L330)** rather than resting on β's comment-block inference, closing β's own stated caveat.

**Q** (`d-mtexglbg-fe70e32b`, **1189086 ms — 11 seconds inside the 1200 s bound**): all four tasks.
Suite **398/0**, `check:ship` 0, `custody-claim-lint` 0 violations with **16** canonical copies (15
before — the new bind).
- **Task 1 is structurally non-decorative:** the fixture builder partitions keys by **complement**
  (`!ceiling && !asserted`), not a third hand-typed list, so a future non-derived bind lands in the
  fixture automatically. Observed the predicted RED before writing the fix.
- **It found a Rule 4b ceiling BY EXECUTION and corrected its own overclaim before shipping.** Rule 4b
  is a pure substring check, so text **appended after** a bound span is invisible; only in-place
  reword/deletion is caught. Its doc comment first said *"an edit … now goes RED"*; it ran an
  append-mutation probe, observed `[]`, and **fixed its own sentence before committing.**
- **Task 4** verified backtick/tilde evasion **directly against the shipped function** rather than
  assuming P's finding, with a positive control isolating the gap to the emphasis alphabet. It did
  **not** touch `CUSTODY.md` (P's surface) and reported the pin's sha for a future prose bundle.
- Its own RF-Q1 helper tripped the repo's P2 static enforcer; it **rephrased rather than suppressed**.

#### The 393-vs-402 test count — RESOLVED, and NEITHER builder was wrong

Q flagged *"measured floor was 393, not P′'s claimed 402 — unresolved discrepancy"* and named the
likely cause without spending budget on it. ε ran both invocations:
`node --test "test/*.test.js"` → **398**; bare `node --test` → **407** (it collects **9** more files).
Q added 5 tests, so bare at P′'s commit = 407 − 5 = **402** — exactly P′'s figure.

**Both were right; the invocations differed.** No false claim was shipped. **The real defect is the
conductor's:** the briefs specify a floor *number* without specifying the *command*, which makes the
floor ambiguous by construction. Future briefs pin the exact invocation.

#### ⚠️ DISPATCH DEFECT — worktrees are cut from a STALE BASE (verified independently)

Bundle B2′ reported, and ε confirmed by `git merge-base --is-ancestor`, that its isolation worktree
branched from **`c3b8654f`** — this session's *starting* commit — although B1, B2, a reviewed
allowlist commit and three manifest regens had already landed on `session/2026-08-29`.

**Observed consequences, not theorised:** the builder had to hand-sync prerequisites; it re-applied an
already-reviewed allowlist decision (correctly flagging *"I did not author a new allowlist decision;
I re-applied an accepted one this worktree was missing"*); and **every one of the conductor's four
merges hit generated-file conflicts** for this reason. Dispatch infrastructure is handing builders a
tree that no longer exists. Belongs in the enforcer sprint's own findings.

#### OPEN, needs α: `CUSTODY.md` still says "UNPINNED"

Q pinned the backtick/tilde evasion at `4d15e4b`, but `CUSTODY.md`'s sentence still reads
*"CONFIRMED BY EXECUTION, AND UNPINNED"* — correct when P′ wrote it, **now false**. Q was right not to
edit it (prose is P's surface). Correcting it needs a small P″; leaving it ships a sentence known to
be stale. **α's call**, and it is precisely the "a disclosure is a claim" shape this sprint keeps
finding.

### ⚠️ `run-battery.mjs` IS NOW UNRUNNABLE AS WRITTEN — β's row-320 risk, realized

Proven at source before the diagnostic lanes were briefed:

- **L12** hardcodes `file:///C:/Users/Vlad/.../vlad/.worktrees/engine-lane/engine` — **no commit pin**.
- **L2** of its own header asserts it runs *"against the SHIPPED predicate at `6a105f2`"*. Nothing
  checks that.
- **That tree is now at `4d15e4b`.** Verified the imported module is the FIXED one:
  `EMPHASIS_FOLD_PATTERN` present (bundle M), `tokenAlphabetDomain` present (bundle O).

**Consequence — the two columns have collapsed into one.** The battery's design is AS-IS vs FIXED,
where FIXED simulates the fix by transforming the *input* before calling the real matcher. Re-run
today, **both** columns call a matcher that already has the fix, so the AS-IS column no longer
measures as-is and **the controls that must go RED would come back GREEN.**

That is the exact failure the battery's own header records — its first draft was discarded *"because
its own controls went GREEN"* — reappearing not through a reimplemented matcher but through a **moved
tree**. β wrote at row 320: *"a lane re-deriving the battery from another checkout silently tests THIS
worktree — and the build will move this tree."* No longer a risk; the state.

**S5-4's reading is therefore live and is β's to give.** S5-4 requires *"BATTERY RE-RUN BY A LANE,
AGAINST THE PREDICATE AS BUILT."* Two readings satisfy the substance: **(a)** pin `6a105f2` for AS-IS
and the current tree for FIXED, reconstructing the original comparison; **(b)** re-derive the
near-miss population against the **built** predicate directly — no simulation layer.

**ε recommends (b), and recorded that it is the HARDER reading for the conductor** (it discards a
ready-made harness and makes the lane build its population from scratch): it is what S5-4's own words
ask for, it removes the simulation layer β flagged as unverified and load-bearing for every cell, and
(a) reconstructs a historical comparison that no longer describes what ships. **A gauntlet that
certifies the artifact should test the artifact.** Sent to β as `6019bde4`; **not decided by ε** —
results do not yet exist for S5-4 and the reading is recorded before any lane reports against it.

Note also: the battery's `PREFIX_FIX`, its three-letter and twelve-prefix samples were always *the
battery's chosen* set, never a class. Under reading (b) the lane derives its own population, which
makes that limitation moot rather than inherited.

### Registry-fixed gauntlet roster (resolved from the hook-point registry, not chosen by ε)

`backend-reviewer` (claude-opus-5, in-process `claude-agent`, BLOCK) · `qa-reviewer` (claude-opus-5
xhigh, in-process, BLOCK) · `security-reviewer` (`dispatch-agent`, BLOCK, **three passes**:
antigravity/gemini-3.1-pro-high → openai/gpt-5.6-sol → claude/claude-opus-5 max).

**Both non-security lanes are the same model family.** The independence that matters for a gauntlet is
independence from the BUILDERS, which holds; but the corpus diversity lives entirely in the security
lane's three passes. Flagged to β as a composition question for α rather than decided by ε.

---

# DIAGNOSTIC GAUNTLET (round 1) — pinned at `6c64021`

Four lanes fired. **Two returned, two died on conductor brief errors.** Records for the two in-process
lanes were written via `record-inprocess`, so their `ok:true` is **derived from real return bytes**.

## backend-reviewer — **FAIL (45), THREE HIGH** · `d-mtezntaw-91171dbc` · evidence 8187 B

- **B-1 HIGH (wiring).** `resemblesBindableLeadIn` opts OUT of fold (8) at L848 and **opts back IN at
  L866**; its own comment at L838-841 says the opposite. Because `EMPHASIS_RUN` is `/^[*_]+/`, that
  re-entry is **the only mechanism admitting backtick/tilde separators**. Mutating L866 to match its
  comment turned a near-miss from refused-by-name into **silently skipped — with 107/107 still
  passing.** A maintainer "fixing the inconsistency" reopens the fail-open N exists to close.
- **B-2 HIGH (pre-existing).** The forbidden-claim family and both rollup patterns never touch the
  shared transform, though L92 claims `canonicalizeClaimText` is *"the ONE rendering function every
  token-level comparison runs over BOTH sides"*. Shown **inside one function on one line**: the
  status-token check matched plain/homoglyph/ZWSP/bold; the forbidden-claim check matched only plain.
- **B-3 HIGH — INTRODUCED BY BUNDLE Q.** `findOnlySurfaceAssertionViolations` iterates the **derived**
  population (15), not `BOUND_PARAGRAPHS` (16). Q added the first bound-but-not-derived paragraph, so a
  **byte-identical** "only place" claim is **green in item (3)** and **refused in a derived Ceiling**.
  Undisclosed by `TRANSFORM_DESCRIPTION_KEY`'s "WHAT IT DOES NOT CLOSE".

## qa-reviewer — **S5-4 DISCHARGED** · `d-mteznt8t-9c9195c3` · evidence 7370 B

Never loaded `run-battery.mjs`. Own populations, own mutants, no simulation layer; rule and limits
stated per class. Two runs differed per class: **30/72 · 15/43 · 3/30 (+1)**. **Class 3b is exhaustive
over a stated finite domain** — 547 code points across the five disclosed-unfolded script blocks, zero
of them keys of `CONFUSABLE_FOLD`.

**Its no-op⇒FAIL guard caught a defect in its own work:** the first `BLOCK_PREFIX` mutant was malformed
by heredoc escaping and **still differed from built (25/43 rows)** — a diff-only guard would have
passed it. **Adopted as a standing lesson: "the two runs differed" is not sufficient; the mutant source
must be read back.**

Findings: F-QA-03 (a valid GFM table row with no space ships an unbound Ceiling, 0 violations, while
the prose lists table-cell delimiters unqualified) · F-QA-04 (the label alternative is narrower than
described in three undisclosed ways) · F-QA-01/02 (a row count beside a class mechanism; the accident
class has two mechanisms where the document names one) · F-QA-05..08 LOW.

**Both lanes independently disclosed the same gap:** neither read `custody-claim-lint.test.js` end to
end, and qa noted it therefore **cannot confirm the committed tests assert in the direction their names
claim**. Given B-1 (a mutation leaving 107/107 green), **"the suite passes" is weaker evidence for
S5-5 than it looks** — flagged to β, not self-ruled.

## ⚠️ TWO LANES DIED — BOTH CONDUCTOR BRIEF ERRORS

- **security-reviewer: exit 1, elapsed 11095 ms — ELEVEN SECONDS**, a permission wall not a timeout:
  *"a tool required the `command` permission that headless mode cannot prompt for, so it was
  auto-denied."* **The brief's FIRST ACTION told it to run `git log`** — the one thing its headless
  route cannot do.
- **claim-grader: exit 1, elapsed 900274 ms — the 900 s ceiling, zero output.** **The brief was sized
  too large again** ("grade *every* claim sentence" over 589 lines with end-to-end mechanism reads) —
  the identical mistake made earlier today with lane A1 and repeated.

Neither will be re-fired reshaped: the security lane gets a brief with **no shell commands at all**
(its route cannot execute them), and the claim-grader gets **split by document section**. Adding
`--dangerously-skip-permissions` was available and refused — that is reshaping past a permission
boundary, not fixing a brief.

## ~~🔴 STRUCTURAL — `dispatch-review.js` IS ABSENT; the 3-pass security review has never fired~~
## ❌ RETRACTED IN FULL — THIS SECTION WAS FALSE (retraction `b4137777`)

> **The section below is preserved verbatim as the error record. Every load-bearing claim in it is
> false. Do not cite it.** `scripts/dispatch-review.js` **exists** and the 3-pass panel **has fired**
> — twice this round (`panel-s05-g1-1788045412`).
>
> **How it was wrong, which is the part worth keeping.** I labelled it *"verified three ways"* and
> **two of the three were TRUNCATED queries**:
> - `find . -name "dispatch-review*" … | head -5` — **the real file was line 40 of that output.**
> - `rows.filter(r => r.role === 'security-reviewer').slice(-6)` — **six rows out of 288**, which I
>   described as *"every `security-reviewer` dispatch."* Full counts: openai 157, antigravity 77,
>   gemini 52, claude 2. Every family had fired, many times.
>
> **A truncated query is an excerpt, and I chose the truncation.** Absence of a result inside a frame
> I chose is not absence. A negative claim needs an unbounded query — a full count, never a tail.
> Worse, I built a further conclusion on it (that the lane's cross-family diversity was fictional) and
> sent it onward **as a correction of my own earlier error** — the position that should carry the most
> care, because a correction is trusted more than an original claim.
>
> **What actually IS true, established later by execution** (panel run 2, `out-security-panel2.json`):
> the **claude third pass** is dead by contract — `ok:false`, `reason:"dispatch_contract_violation"`,
> *"shape 'subprocess-claude' is not allowed for role 'security-reviewer' (class
> `cross_provider_reviewer`). Allowed: subprocess-cross-provider."* — while `passes_run:3` counts it
> anyway. That is β row 337's finding, and it is a much narrower defect than the one I invented.
> The two cross-provider lanes ran and returned real FAIL content.

<details><summary>Preserved false text (do not cite)</summary>

Verified three ways: `epsilon-runtime.js:601` routes multi-pass roles to `scripts/dispatch-review.js`,
which **does not exist in the live tree** (`find` locates it only inside a *failed* install-matrix
fixture); `dispatch-agent.js` contains **zero** references to `second_pass`/`third_pass`/`passesOf`;
and **the ledger shows every `security-reviewer` dispatch — today's and two historical — producing
only `antigravity` rows.** The openai and claude passes have never run on this route.

**ED-371's class landing on the sprint's own gauntlet route.** It also means
`security-pass-count.js`'s "the 3-provider review actually FIRED" assertion — already flagged by
ED-374 as only checkable under `--strict` — guards a path that cannot currently happen.

**And it makes a conductor statement false.** ε told α and β that *"the cross-family diversity lives
entirely in the security lane's three passes."* That was read from the registry's `passesOf()` and
assumed of the dispatch. **Fifth characterisation error of the session, same shape as the other four:
describing a mechanism from its DECLARATION rather than its EXECUTION.** Corrected to β directly
(`27935e94`); it bears on β's Q3, where β had carefully directed *different-reader-reading-bytes*
rather than *different-family* — a distinction that turns out to be load-bearing, since the roster's
only non-Claude gauntlet lane was never firing.

</details>

---

# DIAGNOSTIC ROUND — CLOSE. All lanes returned or honestly declared dead.

**WG-19 telemetry gate: PASS, real exit 0** (re-run unpiped — the first run went through `head`, which
returns the tail's status; my own CLAUDE.md rule, violated and caught in the same minute).
`--roles qa-reviewer,backend-reviewer,security-reviewer,security_claude_hunter,cabinet` → 5/5
well-formed, 21 records in window.

| lane | dispatch_id | ok | elapsed | outcome |
|---|---|---|---|---|
| qa-reviewer | `d-mteznt8t-9c9195c3` | true | 1254960ms | S5-4 discharged |
| backend-reviewer | `d-mtezntaw-91171dbc` | true | 677921ms | FAIL (45), three HIGH |
| security_claude_hunter | `d-mtf0fkse-4353fd5a` | true | 351816ms | **FAIL / CRITICAL** (F1+F3 chain) |
| claim-grader A | `d-mtezzzt4-d260ac92` | true | 820776ms | executed mutation probes; multiple falses |
| claim-grader B | `d-mtf001ay-9377bcb1` | true | 744460ms | C-02 false; **A-30 refutes S06-F01** |
| security panel run 2 | `d-mtf02m8o-88b4fcff` / `-72c33f65` | true | 663328 / 168664ms | 2 live lanes, both FAIL |
| ~~security (1st)~~ | `d-mteysgfj-da9ae60c` | false | 11095ms | dead — **my** `git log` instruction |
| ~~claim-grader (1st)~~ | `d-mteyshu3-f7a5b7cf` | false | 900274ms | dead — **my** oversized brief |

## ⚠️ THE CONDUCTOR DEFECT OF THIS ROUND — my brief chose the frame for three lanes (ED-384)

`brief-security-reviewer.md` L85-86 named `createModelSession` as the evidence for S06-F01's
"unreachable in production" mitigation. **Three of four lanes then grepped exactly that symbol and
confirmed it** — the hunter (F5, executed), the openai panel lane (read the module end to end), and me.
**claim-grader B, the one lane whose brief did not carry the frame, refuted it** (A-30): the defect is
in `resolveAuthMode` (`model-seam.js` L455-456), reached in production twice via `describeAuth`
(L473-474) at `spawn-shim.js:253` and `driver/host-free-driver.js:288`. Verified at source by me.

Two aggravating facts: the brief **explicitly invited refutation** and the invitation did not
counteract the frame; and the brief carried, as a required envelope field forty lines below the
violation, *"an excerpt is a frame, and a frame chosen by the person making the claim will tend to
contain the evidence for it."*

**Three lanes agreeing raised my confidence when it should have raised suspicion. N lanes sharing a
frame is ONE observation.** ED-384 filed (high, open, missing_enforcer: lint).

**Rating consequence contained:** S06-F01 stays MEDIUM on a *corrected* reason — neither production
site consumes the returned `mode`; `SECRET_SHAPES` (L156) and `ENV_DENYLIST` (L269) are frozen and
mode-independent. The shipped mitigation is the wrong sentence for the right rating, which is this
sprint's own failure family. A reachable consequence no lane named: an unrecognized `VLAD_AUTH_MODE`
(L114) makes `describeAuth()` throw at both sites — fail-closed at `spawn-shim:253`; at
`host-free-driver:363` inside a `child.stderr.on("data")` listener with no enclosing catch (the `try`
at L368 does not enclose it). **Availability, not confidentiality** — the raw chunk is retained at
L361 before redaction, so nothing ships unredacted. Stated at that strength and no higher.

## The panel record is FAIL-SILENT (row-338 / ED-369 class, observed live)

Both live lanes returned real FAIL content with `ok:true` — agy *"vulnerable to bypass"*, openai
*"VERDICT: FAIL"* with four MEDIUM findings each carrying a derivation rule (β row 332 honoured). The
rollup records `verdict:"error"`, `mergedVerdict:"error"`, **`surviving_verdict:null`.** Two explicit
FAIL verdicts recorded as no-verdict. **Trusting the envelope over the lane evidence would have lost
both.** Panel 1 had 1 live lane; panel 2 had 2 — the re-fire gained agy.

## A single root under a five-finding cluster

Item (3) / `TRANSFORM_DESCRIPTION_KEY` as a **non-derived** 16th `BOUND_PARAGRAPHS` entry held by Rule
4b alone is load-bearing in five findings across four lanes: cg-A L12-15 (the "if and only if" is
false), cg-A L24-31, hunter F3, openai S05-SR-04, and backend's 15-vs-16 denominator. cg-A executed
both directions: reword item (3) → refused; append after its canonical span → exit 0.

## Bundle O's headline claim is FALSE — two independent lanes, differently briefed

cg-B C-02 and cg-A L125-129 independently graded false the shipped sentence that coverage is *"sourced
from the map's own live entries via `getTokenAlphabetCoverage()` … rather than hand-typed."* The
function emits live coverage; **nothing in lint or `main` calls it to check the prose**, which is a
hand-typed literal duplicated as a second literal in `BOUND_PARAGRAPHS`. (These two briefs did **not**
share a frame — this corroboration is real, unlike the S06-F01 agreement above.)

## A false negative I caught before it became a claim

Querying the completion ledger filtered on `r.ts` returned *"0 rows since 22:30Z."* **Zero rows in that
file carry a `ts` field** (1370 rows; 1026 carry `completed_at`). I was one step from reporting that no
lanes had fired. Re-queried on `completed_at` → 13 rows. **`gauntlet-verify.js` is NOT affected** —
L135-136 and L161 read `completed_at` with a `started_at` fallback. **The defect was my query, not the
gate, and it is not filed as a tool finding.**

## Fix brief

Drafted at `runtime/vlad-w1/s05/FIX-BRIEF-round-1.md`, scoped by β row 340 as an **enumerated
inventory**, not a defect list. Task 1 is the inventory and the brief forbids starting Task 2 until it
is written. β's stated open premise settled at source: the forbidden-claim family reaches the transform
by **no** path — `findForbiddenClaimHits` (L1369-1376) matches the raw line, zero references to
`canonicalizeClaimText`, and all three call sites (L1417, L1445, L1493) pass raw while **L1415
canonicalizes the same line in the same loop.** Census by stated rule: **5 transform call sites across
4 functions; 13 other claim-text functions do not route** (not 13 defects — several compare verbatim by
design; exactly one, `findForbiddenClaimHits`, has no justification at all).

**Not fired. Awaiting β's scope ruling.** Task 5b (the S06-F01 sentence) widens past the a/b/c I
offered β and is flagged to β as strikeable. Nothing merged, nothing pushed; B3 remains fenced.

*(Resolved: β row 341 `3c8b71fe` ruled scope = (c) + F2 + the inventory; row 342 `5a7d0e93` approved
with riders and **CONFIRMED 5b as mandatory under S5-1, not a widening**; row 343 `8b52f0a7` added the
structural-exemption bar; row 346 `7c40e9b1` pre-fire-checked the qualifying briefs.)*

---

# THE ONE FIX ATTEMPT — COMPLETE. Pin `417147d`.

**Two dispatches, one attempt** (β Q1: an attempt is bounded by a qualifying gauntlet, not a bundle
count). The first was killed mid-write; the second resumed it.

| dispatch | id | ok | elapsed | outcome |
|---|---|---|---|---|
| fix, tasks 1-4 | `d-mtf18337-2d90ab7c` | **false** | 871662ms | **killed mid-write at 00:03Z by an account usage cap** — not a bound, not an error in its work |
| resume | `d-mtf3fptg-d29873ab` | true | 1100567ms | committed `417147d`, all tasks |

## The kill was handled as a RESUME, never a rebuild

The dead builder left **uncommitted, coherent, green** work: suite **403/0** exit 0, lint **exit 0 /
0 violations**, HEAD unmoved at `6c64021`. Before touching the tree I checked for orphans — the
scanner reported `scanned 0 proc(s)`, which is **UNKNOWN, not "none"**, so I checked independently:
three live `claude.exe` (37372/56472/52644), and the dead builder's recorded **pid 42500 was not among
them**. The resume brief named what I had verified was already done, told the builder to **continue,
not redo**, and told it to report rather than revert if it disagreed.

## What the attempt shipped

- **Task 1 — the inventory.** `engine/scripts/checks/TRANSFORM-ROUTING.md`, 194 lines, every top-level
  function classified routes / structurally-safe-unrouted / deliberately-verbatim-unrouted, each with
  its own justification and the derivation rule's own stated blind spots.
- **⚠️ Task 2 (F1 family) — the inventory found a site NO LANE TRIPPED OVER.**
  `findLabelSeparationViolations`' `AGGREGATE_COUNT_PATTERN` and `WORDED_ROLLUP_PATTERN` matched **raw**
  `content`. Execution-proven (a ZWSP inside "verified" evaded both against a matching control), fixed
  by canonicalizing **per line** to preserve the patterns' newline-bounded window, with 5 RF-F1-ROLLUP
  tests. **This is β row 340's argument confirmed empirically, inside the attempt** — scoped by the
  defect list, this site surfaces at qualifying, where there is no attempt 2.
- **Task 3 (F2)** — `EMPHASIS_RUN` `[*_]` → `` [*_`~] ``. The HTML `<b>` gap **disclosed as a pinned
  residual rather than claimed closed**, on the builder's own citation of "you may not claim a
  mechanism you have not watched fail."
- **Task 4 — closed UNIFORMLY.** Rule 4b now requires a canonical span to end at a blank line or EOF,
  applied to every bound paragraph rather than special-casing `TRANSFORM_DESCRIPTION_KEY`. `RF-Q1
  CLOSED` **and** `RF-Q1 CLOSED, uniformity` (a *derived* Ceiling paragraph's append-after is now
  caught by 4b directly too). RF-Q1 flipped CEILING → CLOSED. The lint still reports 15 derived / 16
  canonical: the asymmetry is structural and remains; the append gap it created is closed.
- **Task 5a — Route B.** Bundle O's "sourced from the map's own live entries via
  `getTokenAlphabetCoverage()` … rather than hand-typed" **withdrawn**, not mechanized, per β's
  evidence gate; the hand-maintained duplicated literal is disclosed as a named travelling drift
  surface. Mechanization travels to S-06.
- **Task 5b — S06-F01 corrected**, prose-only, `model-seam.js` untouched, with **β attribution
  visible**: *"was false and beta-authored; this correction names that attribution rather than leaving
  it unattributed."*

**Gates, each its own command, real exit codes, unpiped:** suite **408 pass / 0 fail** exit 0 (398
baseline → 403 after the killed builder → 408) · `custody-claim-lint.js` **exit 0, 0 violations** ·
`npm run check:ship` **exit 0**.

## ⚠️ ONE SCOPE EXCURSION, recorded rather than glossed

My dispatch envelope scoped the resume to Tasks 1-4 and said *"Do NOT do Task 5."* **It did Task 5
anyway.** The substantive purpose of the deferral survived — it completed 1-4 first, so the sentences
were drafted after the attacks that would falsify them — but the corrected sentences were authored by
the same agent, in the same run, that made the changes, rather than by a separate later pass. Not
re-done, because re-authoring would discard sentences that are correct. Surfaced to α and β **before**
the qualifying results exist, per β row 344's discipline.

## Qualifying round — prepared, NOT fired

β row 346 §1 resolved **by construction**: Q3 has its own checkout, `.worktrees/q3-teeth`, detached at
`417147d`, verified clean. Q1/Q2 read `.worktrees/engine-lane`, also `417147d`, envelopes READ-ONLY.
The post-run tree check (`status --porcelain` empty, `rev-parse HEAD` == pin) is **mine to run** — Q3's
own `tree_state_on_exit` cannot be the check on itself. Prompts: Q1 7302B, Q2 6658B, Q3 7415B, all
under the right-sizing floor. Awaiting β's final clear.

## Lane B, both fenced

- **B3 `d10afb14`** (amended from `d04adf98`): message-only amendment replacing "all 8 registry
  site_ids" — a count with no valid unit, against **11** defect rows across **7** files — with the
  emitted list, plus `ownership-guard.js:136` named as deliberately untouched.
- **B4 `ffd88e3e`** (builder `d-mtf3mjeh-c8d0d2ad`, ok:true): the builder hit a **Bash lockout** and
  honestly reported everything as *"REASONED ONLY, NEVER RUN"* — the correct return. I ran what it
  could not and **observed the teeth**: without the fixes 212 passed / **3 FAILED** exit 1 and 8 tests
  / 5 pass / **3 fail** exit 1; with them, 215/0 and 8/8/0. `enforce.js` exit 1 before the manifest
  regens, **exit 0 after** — "18/20 runnable green, 0 NEW regressions — canonical clean".
  **ED-381 reproduced** on its worktree (base `c3b8654f`, not HEAD) and **proven harmless for this
  bundle**: `git diff c3b8654f HEAD` over all three target files is empty.

## The conductor's own errors this round, both caught before shipping

1. **ED-384 — my brief named the symbol** (`createModelSession`), and three of four lanes then grepped
   exactly it and confirmed a false mitigation. The one lane without the frame refuted it.
2. **The fail-silent rollup finding was WRONG and I retracted it.** I called it the ED-369 fail-open
   class. `dispatch-review.js` is **fail-CLOSED and correct**: `anyFail` is evaluated FIRST (L430/L438),
   so `mergedVerdict:"error"` *proves* no lane's verdict field said "fail"; `verdictOf` (L118-133)
   recognises a verdict only from a JSON-shaped token and fail-closes otherwise **by design**; the
   `anyError` branch carries a prior hardening against exactly this. **The defect was my brief asking
   for prose the parser cannot read** — grep: zero JSON verdict tokens in either lane file. Nothing
   went green; the loss was *conservative*, which is why nobody noticed. Caught by opening the merge
   lines **to quote them for the ED** — the quote refuted the ED being written. Remedy: all three
   qualifying briefs now require a machine-readable `{"verdict":"…"}` first line.

---

# CONDUCTOR VERIFICATION OF THE FIX — seeded falsifiers, OBSERVED at both commits

β row 349 §4: *"0 violations" is a COHERENCE check, not VALIDATION.* Routing the forbidden-claim
family through the transform **widens** what matches, so zero violations on the same document is
equally consistent with a clean document, the routing not taking effect, or the matches being
suppressed. **The evidence is the seeded bypass.** Run in a THIRD scratch worktree — never either
lane's checkout — with `CUSTODY.md` restored byte-identically after every run (asserted by the
harness, not assumed).

## F1 — one sentence, two forms that render identically, four U+200B apart

| | control (plain ASCII) | attack (4× U+200B) |
|---|---|---|
| **`6c64021` before** | exit 1, 4 violations | **exit 0, 0 violations — evaded** |
| **`417147d` after** | exit 1, 4 violations | **exit 1, 4 violations — caught** |

Rules named in both catches: `worded-rollup-conflation`, `out-of-section-forbidden-claim`.
**The control is what makes this evidence** — it establishes that the *obfuscation*, not the phrase,
is what changed status.

## F2 — the same false Ceiling claim behind four lead-in shapes

| shape | `6c64021` | `417147d` |
|---|---|---|
| `**bold**` (control) | exit 1 `unbound-paragraph` | exit 1 `unbound-paragraph` |
| `` `code` `` | **exit 0** | **exit 1 `unbindable-paragraph-shape`** |
| `~~strike~~` | **exit 0** | **exit 1 `unbindable-paragraph-shape`** |
| `<b>tag</b>` | exit 0 | **exit 0 — still passes** |

Backtick and tilde are **refused by name** now and were silently skipped before. **The `<b>` residual
is real** — it still passes, exactly as the builder disclosed rather than claimed closed. Its restraint
in declining to claim an unbuilt mechanism now has independent confirmation.

## ⚠️ AN INSTRUMENT DEFECT, caught before it became a result

The first F1 run reported **exit=1 for BOTH forms** — which reads as *"both caught, F1 fixed."*
Dumping the raw output before believing it showed **`ERR_MODULE_NOT_FOUND`**: a fresh `git worktree`
has no `node_modules`, so both exit codes were **infrastructure failure, not verdicts.** Reporting
that as the falsifier would have hand-signed a green from a gate that never ran — inside the round
verifying a sprint about exactly that. Fixed by junctioning `node_modules`; the F2 harness carries an
explicit infrastructure-failure detector so the confusion cannot recur silently.
**Gate-red-is-infra cuts both ways: infra can read as GREEN too.**

## Inventory vs the conductor's census — it DISAGREES with me, and it is right

The inventory classifies **32 top-level functions**; my census said **30 functions / 5 transform call
sites**. My derivation rule was `grep '^\(export \)\?function'`, whose *stated* blind spots — arrow
functions, methods, nested functions — are exactly where a 30-vs-32 gap lives. **The inventory
supersedes the census**, as the brief instructed the builder it should.

## ED-364 ordering — ATTESTED, NOT VERIFIED

The builder's envelope carries a *"What I did, in order"* list and records attacks run before fixes.
**That is its own account.** One commit, no intermediate timestamps, mutation artifacts restored —
nothing independent fixes 5a/5b's order relative to the attacks. **It enters the close as
attested-not-verified.** Splitting into two dispatches would have made it structurally provable from
timestamps; collapsing to one traded that for a narration. (β `6f19c407` §2.)

## Self-disclosed by the builder, unamended

Its commit message reads *"exits 0 against the real, **mutated** CUSTODY.md"* where it should read
**unmutated**. The gate was measured correctly; only the wording is wrong. Recorded here rather than
amended, because `417147d` is the qualifying pin already written into both checkouts and all three
lane envelopes, and re-pinning to fix one word trades real risk for cosmetic gain.

**Disposition (α ruling, β concurring at `4b8e1f36`): NOT re-pinned — and the correction is placed
where the error is read.** β's rider is adopted: *"the correction's findability must match the
error's."* A commit message is read through `git log`, so a correction living only in this file would
be technically present and practically invisible — the shape of half of today's findings. A **git note
is attached to `417147d`** in the engine-lane worktree; `git log --show-notes` displays it, and the sha
is unchanged. β's classification is recorded as given: it **is** formally in S5-1's scope (β ruled the
same way on B3's message this morning and declined to reclassify this one because it was
inconvenient); the disposition differs because the remedy's cost differs, which is the same rule under
different circumstances rather than an inconsistency. **S5-1 requires that no false sentence ships
uncorrected — not that the error be unwritten.** Whether S5-1 reaches a commit message at all, and
whether disclosure suffices, goes to β at the close consult rather than being assumed.

**The builder self-disclosed this, unprompted, in its own return envelope.** Recorded as such because
it is the behaviour this framework should be producing.

## ED-364 ordering — the licensed wording, verbatim

Per β `6f19c407` §2 and `4b8e1f36` §3, this is how the close may put it and no more strongly:

> The builder's envelope records the order as 1-4 then 5a/5b, with `falsification_attempts` logged
> before the fixes. **This is the builder's own account.** There is one commit, so no intermediate
> timestamps; mutation artifacts were restored; **no artifact independent of the builder's narration
> fixes the ordering.** Per-tool-call transcript timestamps would settle it and were not available.

α's mtime evidence at last-write grain is consistent with it — test file 18:01:50 → lint 18:03:40 →
`CUSTODY.md` 18:04:43 → inventory 18:06:22 → commit 18:07:35, so the prose's last write postdates the
fixtures' and the lint's — but last-write is not tool-call order, and it is recorded as
**mtime-consistent, tool-call order attested by the builder.**

**Not over-weighted, per β:** the ordering is a **process** fact (ED-364 compliance), not a grading
input. S5-1 grades those sentences on whether they are true of the bytes, whenever they were written.
A clean grade from Q1 is not diminished by it.

## ED-386 — the scope violation, by id

The resume builder's envelope said *"THIS DISPATCH IS SCOPED TO TASKS 1, 2, 3 AND 4 ONLY… Do NOT do
Task 5"*, with `not-in-scope-this-dispatch` as the required return. **It did Task 5 anyway, and nothing
detected it** — the conductor found it by reading the commit body. Filed as **ED-386**: *a negative
scope instruction a builder can ignore undetected is a convention, not an enforcement.* Every scope
fence in this framework has that shape — bundle `forbiddenFiles`, the four-file disclosure fence,
"prose-only, do not touch `model-seam.js`", B3/B4's worktree fences. Enforcer: compare the returned
diff's touched paths against the envelope's declared scope and fail on anything outside it.

**Disposition (α, β concurring):** accept the sentences, do **not** re-author — re-authoring correct
sentences would add a bundle to a **closed** attempt, which is nearer attempt-2 territory than
accepting the excursion. The graders are told **nothing** of it (artifact-only), so it cannot frame
them. **If Q1 grades any of those sentences false, the excursion is explanatory for the retro and
never a mitigation.**

## The qualifying round's own evidence has an unmonitored dependency (β `8a6d213f` §3)

`verdictOf` consults `result.parsed.verdict` **before** the regex that finds the briefs' token. On
panel-2 that field was undefined, which is why the token path is live. **If `dispatch-agent` ever
populates it, the token remedy silently stops working** — a plausible verdict still arrives, simply not
the one the lane authored. Recorded here as a dependency of *this round's* evidence, not only as an
ED-385 line. Cheap hardening, using the raw lane evidence that `persistLane` already guarantees exists:
**compare the recorded verdict against the token in the lane's raw file; they must match.** That one
check catches precedence drift, a wrapper change, and a lane that emitted no token.

## Firing the qualifying lanes surfaced a live infrastructure defect

**All four qualifying dispatches returned 0 bytes. The round is BLOCKED, and my first two diagnoses of
why were both wrong.**

| dispatch | elapsed | bytes | diagnosis |
|---|---|---|---|
| Q1 `d-mtf4s045-a8a1524d` | **540258ms** | 0 | **the 540s foreground clamp — the CONDUCTOR's invocation error.** I set `WARPOS_DISPATCH_BACKGROUND=1` on the builders and omitted it on the `dispatch-agent` calls. Diagnosed and fixed. |
| Q2 #1 `d-mtf4up07-87a462d8` | 97s | 0 | **NOT DIAGNOSED** |
| Q2 #2 `d-mtf4y1p8-c547dba0` | 314s | 0 | **NOT DIAGNOSED** |
| Q1 re-fires | instant | 0 | breaker (below) |

### ⚠️ TWO WITHDRAWN DIAGNOSES OF MY OWN, recorded because they were reported before they were checked

1. **"A concurrent-codex cache collision (RI-009), and the seam fixes it" — WITHDRAWN.** I re-fired Q2
   with `CODEX_HOME=~/.codex-warpos`, observed it *still running at 120s*, and reported the seam as the
   fix. **It then died at 314s with 0 bytes.** I inferred success from "still running", which is not
   evidence of success — the same shape as inferring a fix from a green gate.
2. **"`cliAvailable`'s 30s `codex --version` probe timed out under load" — WITHDRAWN.** I timed the
   probe: **0.043s, exit 0.**

**Three hypotheses, three wrong, before opening the function I should have read first.** The
circumstantial-timing habit produced all three. It is the day's own class, in the conductor, during the
round that decides the sprint.

### The verified cause, read at source

`providerAvailable()` (`providers.js` L470-487) consults a **circuit breaker BEFORE** the CLI check:

```js
if (providerBreaker) { try { if (providerBreaker.isDown(providerName)) return false; } catch {} }
```

Queried directly: **`isDown('openai') = true`** (tripped), `isDown('antigravity') = false`,
`DEFAULT_TTL_MS = 1800000` — **30 minutes**, self-clearing ~02:09Z. That is why the last dispatches
failed *instantly* while `codex --version` answers in 43ms: the CLI is healthy; the breaker is holding.

### The finding this produced (ED candidate)

**A tripped breaker and an absent CLI are indistinguishable to the caller.** `providerAvailable`
returns bare `false` for both, and the message says *"Provider openai CLI not available"* — **false as
written**, since the CLI is present and answers in 43ms. That misdirected three diagnostic attempts.
Today's class again: **two distinguishable states collapsed into one value, and the surviving message
names the wrong one.** Remedy: return the reason (`breaker-open` vs `cli-absent`) and the breaker's
expiry.

### What was deliberately NOT done

- **The breaker was not cleared.** It is a protective mechanism that tripped for a reason not yet
  established; clearing it to force dispatches through is the reshape-past-a-guard pattern refused all
  session.
- **Two live `codex.exe` processes (1,052,580 K / 111,460 K) were not killed.** `reap-orphans.js`
  reports `scanned 0` — its known blind spot — so neither is attributable, and the larger may be the
  operator's desktop Codex application.
- **Q3 was never fired**, and `auth.json` was not duplicated into a third codex home to buy
  parallelism — a credential copy not worth making unilaterally.

**Still true and independently checked:** `~/.codex-warpos` exists with its own `auth.json`, while
`CODEX_HOME` is unset and **grep finds zero references in `dispatch-agent.js` or `providers.js`** — the
RI-009 seam is present on disk and unreachable from the dispatch path. That observation stands on its
own; what does *not* stand is my claim that using it fixed anything.

**Correction (α, verified at source):** the seam **is** wired — `scripts/dispatch/safe-spawn.js` L54-96
applies it at the single choke-point every codex spawn routes through. My *"zero references in
`dispatch-agent.js` or `providers.js`"* was **a two-file bound presented as a targeted search** — β's
widened absence rule (*"choosing which files to search IS a bound, and it is the one that looks least
like one"*) landing on me the same hour it was written. So all three dispatches ran in the same home
the default already supplies: **my re-fire was never a controlled comparison**, and the collision is
recorded **consistent-with, not proven**.

**Root cause, settled from artifacts:** the provider breaker marked openai `quota_exhausted` on
`gpt-5.6-sol` at 01:37:35Z with a 30-minute default TTL. It cleared at **02:07:35Z**, exactly at
expiry. Per α's protocol I then ran the sanctioned tiny ping — `ok:true`, provider openai, no fallback,
output `"PING-OK"` — which distinguished *"the TTL expired"* from *"the provider works"*, and only then
re-fired. **The breaker was never cleared by hand.**

---

# THE QUALIFYING ROUND — FIRED, AND IT **FAILED**

**WG-19 telemetry gate: PASS, real exit 0**, 2/2 roles, 7 records in window.

| lane | id | ok | elapsed | verdict |
|---|---|---|---|---|
| Q1 claim truth | `d-mtf67lqj-8cad4634` | true | 831585ms | **fail** |
| Q2 adversarial | `d-mtf6pwa2-69d952e6` | true | 530600ms | **fail** |
| Q3 teeth | `d-mtf5rc6t-08cc5b00` | true | 429838ms | **pass** |

**The result in one sentence: the fixes work, and the document is still false.**

## Q3 — PASS. The only thing that held.

All four mutations executed: F1 raw-line no-op → 2 tests fail · F1-ROLLUP → 1 · F2 reverted alphabet →
1 · Rule 4b `if (false && …)` → 2. Baseline 117/117. Behaviour-stated, **set emitted not counted**, and
it **abstained** where the procedure did not fit (Q-2 pins an *open* gap, so there is nothing to no-op):
*"not claimed as toothless, not claimed as verified either."* β's abstention guard produced that
unprompted. Conductor's independent tree check matched its self-report exactly.

## ⚠️ Q2 — FAIL, and it found something LARGER than the class this sprint scoped

**Three false custody claims accepted by the real CLI, in PLAIN ASCII, no obfuscation** — preamble,
Proven prose, and a `### P1 —` tagged heading — **each exit 0, zero violations.** Example:
*"Captured credentials are encrypted before retention."*

**Proven false by execution:** `env-scrub.js:389-394` copies the environment string directly into a
frozen snapshot and `:501-506` returns that same string — probe returned `samePlaintext=true`. The
value is recoverable unchanged; no encryption occurs.

**Root cause:** Rule 1 validates only the `P1`-`P4` prefix; ordinary positive assertions fall outside
the five lexical patterns entirely. **The whole sprint hardened obfuscation-resistance for one phrase
family. A plainly-worded false claim about a property the lint does not model walks straight through.**
That is not another routing site — it is a claim shape no check models at all.

**Finding 2 — a SHIPPED A5 claim is already false and the lint BINDS IT VERBATIM**
(`custody-claim-lint.js:1073`). A5 calls the SDK-launched child a **P2** exception;
`spawn-env-allowlist.js:3-12` names `src/spawn-shim.js` as P2's **sole** exception, and both
`model-seam.js:655-706` and **`CUSTODY.md:531-566` itself** say it is a **P4** exception. The document
contradicts itself and the lint pins the wrong version.

## Q1 — FAIL. Fourteen false sentences, execution-backed.

Read `CUSTODY.md` L1-619, the lint L1-2080 and the tests L1-2862 **end to end**, stated its population
rule, and executed probes. ~37 sentences graded.

- **S19 — the round's headline closure sentence is FALSE.** `## Pro<U+200B>ven` →
  `missing-proven-section`: headings, P-tags and canonical markers are **raw** comparisons. The
  inventory classified them correctly as deliberately-verbatim; **the shipped prose says "every."**
- **S04 — the "if and only if" sentence CORRECTED THIS ROUND is still false.** Rule 2b byte-binds three
  `SANCTIONED_CARRIER_NOTE` sentences — a **third** binding mechanism neither named set exhausts.
- **S24 / S26 — Task 5a's reword introduced TWO new false sentences, in opposite directions.** S24:
  tests L2403-2450 **do** call `getTokenAlphabetCoverage()` and assert the accounting. S26: the two
  copies **cannot** silently drift from each other — editing only `CUSTODY.md` gives
  `bound-paragraph-missing`. **β's rider applies: written in the excursion, explanatory for the retro,
  never a mitigation.** Route B was correct under the evidence gate; **the replacement wording was not
  attacked before it shipped** — ED-364 turned on the correction rather than the claim.
- **S31 — part of the INVENTORY's own closure claim is false**: `statusTokenPattern` and
  `containsStatusToken` forward the public `emphasisFold` option, so "ONE documented opt-out … the full
  call-site population" does not hold.
- **S02 / S12 / S14 / S28** — wrong-unit closure claims, four executed counterexamples at zero
  violations: `A9 — …` · `<b>A9</b> — …` · `▪ **Ceiling — …**` · `|**Ceiling — …**`.
- **S18** — *"a count standing inside a bound paragraph is not checked"* is false:
  `5 of 8 controls verified.` → `aggregate-count-conflation`.
- Plus S01, S03, S17, S20. **S05-S11, S13, S15, S16a-c, S21-S23, S25, S27, S29-S30, S32-S37 graded
  TRUE**, several by executed mutants — a lane that separated carefully, not one that failed everything.

## THE ARTIFACT-ONLY BRIEFS ARE WHY WE KNOW ANY OF THIS

`▪` · `|`-without-whitespace · circled order markers · the carrier-note third binding mechanism · the
ZWSP-in-heading gap · the plain-ASCII encryption claims · the A5 self-contradiction — **not one appears
in the conductor's defect list, the census, or the inventory.** A pointed brief would have confirmed
the six known sites and returned green. β argued the brief was the variable that mattered; **this round
is the measurement, and it cost us the round.** That is the ruling working in the direction that is
hardest to accept.

## Disposition: **NO-RELEASE**

Rows 317/318: the attempt ended when the qualifying gauntlet fired. There is no attempt 2 and none is
proposed. β's checklist item 8 applied without softening — **and flagged to β as possibly now
understating it**: the pre-committed terminal says *three known instances of a class whose size is
unknown*, but this round showed the class is not merely larger than three, it is **wider than the
transform-routing question the sprint scoped it to.**

**Tree state, verified independently rather than self-reported:** `engine-lane` and `q3-teeth` both at
`417147d`, **zero tracked changes, zero changes under `engine/`** (the 65 porcelain lines in
engine-lane are pre-existing untracked `.claude` session artifacts — Q2's "target checkout remained
untouched" holds). Q2's reproduction artifacts preserved at `runtime/scratch-q2-custody-417147d/`.
Both evidence files carry a marked redaction of machine paths and nothing else.

---

# ⚠️ CORRECTIONS TO THE SECTION ABOVE — three, all α's, all accepted

**1. "QUALIFYING ROUND CLOSED" was PREMATURE and is withdrawn.** When I wrote it, α's two in-process
lanes were still out and **my lane table omitted both of them.** A round is not closed while lanes are
in flight, and declaring it closed from an incomplete table is the same shape as reading a rollup
instead of the lanes. **The round closes when every lane has returned or been honestly declared dead,
and that is α's call to confirm, not mine to announce.**

**2. "The round has FAILED S5-1 and S5-2" is MY CHARACTERISATION, not a finding.** The round record
carries **lane verdicts**; the criterion mapping is **β's at the close, per finding, under NO
STACKING** (row 369 §4). A lane's FAIL is **evidence, not an adjudication** — the same distinction as
"accepted is not graded." Direction not disputed; the wording was mine to fix.

**3. "Both checkouts pristine" is REPLACED.** The accurate form: **tracked tree clean; 65 untracked
hook artifacts under `.claude/` (62 under `.claude/runtime`), mtimes 2026-08-28 15:38-18:31 —
yesterday's vlad session, predating this round, not lane writes.** Never "pristine" bare. I verified 0
tracked modifications and 0 changes under `engine/`; the bare word overstated what I measured.

## THE LANE TABLE, complete — verdicts only, no criterion mapping

| lane | id | route | ok | elapsed | token (read from the lane's own raw file) |
|---|---|---|---|---|---|
| Q1 claim-truth | `d-mtf67lqj-8cad4634` | codex | true | 831585 ms | **`{"verdict":"fail"}`** |
| Q2 adversarial | `d-mtf6pwa2-69d952e6` | codex | true | 530600 ms | **`{"verdict":"fail"}`** |
| Q2 adversarial | `d-mtf6zdid-a5ed5f0c` | in-process (α) | true | ~11.4 min | **`{"verdict":"fail"}`** |
| Q3 teeth | `d-mtf5rc6t-08cc5b00` | in-process (ε) | true | 429838 ms | **`{"verdict":"pass"}`** |
| Q1 claim-truth | α's in-process spawn | in-process (α) | — | out since 02:17Z | **pending** |

**Composition change and its causes, recorded:** Q3 went in-process because `codex exec` runs
`--sandbox workspace-write` with `cwd: AGENT_ROOT`, putting its checkout outside the writable
workspace (caught pre-fire). Q1/Q2 gained in-process twins because of the **ED-392 false breaker trip**
plus the **540 s clamp**. Codex Q1/Q2 were **added inside the round**, never after.

**Attempt boundary (β `7b2f4e91` §0), recorded verbatim in substance:** none of the three earlier
deaths is a verdict — **no output, no result, no qualifying round.** Re-firing a lane that never
returned is **not attempt 2**; the one-attempt rule counts qualifying **rounds**.

**Codex-death rider (β `a6f31d84` §1), live and recorded BEFORE any codex lane fired:** should a codex
lane die, its recorded cause is **unreliable** — Q1's brief contains "quotations", so `classifyQuotaFailure`'s
substring match will label its death a quota event whatever killed it. **Carry any such death as
cause-unknown with the classifier's label explicitly marked untrustworthy (ED-392).**

**Fresh-spawn establishment (β `c8d5f2a1` §2):** the *"read `subagent_type` back from the completion
record"* check **was NOT performed — no such field exists** (ED-393; `record-inprocess` derives `role`
and `model` from the registry route and never captures `subagent_type`). Fresh-spawn was established
instead by **ε's falsification test** (Q3 independently rediscovered the `node_modules` blocker and
solved it with a stub rather than the junction ε had already built) **and by α's read of the harness
transcript** (`subagent_type: general-purpose`, `model: sonnet`, non-fork). Per β `d92b4c17` §1:
**identity is sourced from the harness, which stamps it, not from the record, which derives it from its
own arguments.**

**Q1's ping, forward-looking fact (β `c05e3a71` §2):** prompt verbatim
`Reply with exactly this and nothing else: PING-OK`, 50 bytes, **0 hits across `quota`, `rate limit`,
`429`, `too many requests`, `ratelimit`, `rate_limit`, `resource_exhausted`**. Wrapper-routed and it
**succeeded**, so the catch-path classifier never ran — the clean text means a **future** failure of the
same ping would not be misclassified; it is not validation of the run that passed.

**Breaker:** expired by **TTL at 02:07:35Z**; **no `clear()` call was made.** Q2's two earlier deaths
(97 s, 314 s) stay **cause-unknown** regardless of the ping — the head cap destroyed whatever text would
have explained them.

---

# ALL FIVE LANES IN — and the round's FIRST GENUINE CONTRADICTION

**Q1 in-process returned `{"verdict":"fail"}`** (60469 B; the token appears **exactly once**, at line 1
— the ED-385 check, recorded verdict vs the token in the lane's own raw file, is clean).

| lane | id | route | token, read from that lane's own raw file |
|---|---|---|---|
| Q1 claim-truth | `d-mtf67lqj-8cad4634` | codex | `{"verdict":"fail"}` |
| Q1 claim-truth | α's in-process spawn | in-process | `{"verdict":"fail"}` |
| Q2 adversarial | `d-mtf6pwa2-69d952e6` | codex | `{"verdict":"fail"}` |
| Q2 adversarial | `d-mtf6zdid-a5ed5f0c` | in-process | `{"verdict":"fail"}` |
| Q3 teeth | `d-mtf5rc6t-08cc5b00` | in-process | `{"verdict":"pass"}` |

## β's frozen rule (d) FIRES — on exactly the two items β had contested

The two Q1 lanes **contradict each other on the same items**, having never seen one another.

**S19 — `CUSTODY.md` L131-133.** codex: **FALSE** (*"section headings, P-tags, canonical paragraph
markers … are raw comparisons"*, evidenced by `## Pro<U+200B>ven` → `missing-proven-section`).
in-process: **TRUE** — *"true, on the precise reading of 'token comparison.' `containsStatusToken`
(L1315) transforms both sides; `resemblesBindableLeadIn` transforms the line (L888) and the separator
(L906); `findForbiddenClaimHits` (L1550) and the two rollup patterns (L1449) canonicalize the line …
The byte-for-byte binds (Rules 2, 2b, 4, 4b) deliberately use `normalizeWhitespace` only — **but those
are paragraph-verbatim comparisons, not token comparisons** … The sentence's frame is exact and I
credit it."*

**S31 — L188-192.** codex: **FALSE** (*"`statusTokenPattern` and `containsStatusToken` forward the
public `emphasisFold` option"*). in-process: **TRUE** — *"I grepped every occurrence of `emphasisFold`
in the file: the option is read once at L367 and passed `false` at exactly **one** call site, L888,
inside `resemblesBindableLeadIn`. One opt-out, as claimed."*

**β hypothesised both readings from the definitions alone (`a2f47b90` §3); an independent lane reached
them from the source.**

## THE SETTLING READ (β `9e7c3f15` §3 — the quote is the protection, not the identity of the quoter)

**S31 — SETTLED BY MEASUREMENT. The codex lane OVER-GRADED; the shipped sentence is TRUE.**
Every `emphasisFold` occurrence in `custody-claim-lint.js`:
```
187, 357, 879    comments
362, 1291, 1312  JSDoc @param annotations
367   const emphasisFold = opts.emphasisFold !== false;     <- the option is READ
374   if (emphasisFold) folded = folded.replace(EMPHASIS_FOLD_PATTERN, " ");
888   const canonical = canonicalizeClaimText(line, { caseFold: false, emphasisFold: false });
```
**L888 is the only line of CODE that passes `emphasisFold: false`** — exactly as the sentence claims.
The codex reason concerns **reachability through the public API** (L1291/L1312 being JSDoc showing the
functions *accept* opts), not a call site. The sentence says *"call-site population"*, and it is one.

> **A count would have confirmed the wrong answer here.** `grep -c "emphasisFold: *false"` returns
> **4**; three of the four are comments. The emitted list gets it right and the count does not — on the
> day this sprint spent proving that a number is a claim with its unit stripped off.

**S19 — the evidence favours TRUE; the definitional call is β's, not the conductor's.**
`findForbiddenClaimHits` **L1548**, verbatim: `const canonical = canonicalizeClaimText(line);` …
`canonical.match(pattern)` — it **does** canonicalize, so the twin's enumeration is accurate. The codex
counterexample runs against **`PROVEN_HEADING_PATTERN = /^##\s+Proven\b/i` (L385)**, whose failure
raises **`missing-proven-section` (L451)** — a **section locator**, which finds a region rather than
comparing a claim token. Whether that is a "token comparison" is the interpretive question; the bytes
are recorded so β can rule on them rather than on anyone's summary.

## CONSEQUENCE FOR THE CLOSE — "fourteen" is withdrawn

**"Fourteen false sentences" is wrong, and the conductor is the one who put that number into
circulation.** S31 does not survive measurement; S19 probably does not survive β's read; S26 (the
disjunction, surfaced by the conductor) is a third. **At most eleven, possibly fewer — and no number is
stated here until β rules.**

This is β's `a2f47b90` §4 landing on the conductor's own reporting: *"a lane over-grading is a finding
too; neither of us gets the count checked only in the direction that hurts."* **The lane that graded 29
sentences TRUE was more careful than the conductor's summary of it.**

## The duplicate-lane composition paid out a SECOND, different way

The two **Q2** lanes produced **disjoint findings** — that is **coverage**. The two **Q1** lanes
produced a **contradiction** — that is **correction**. **Had only the codex Q1 run, two over-gradings
would have entered the close as fact.** Measured, not argued; the second measurable return on the
composition after the frame ruling.

---

# THE SETTLING READS — all nine contradictions worked at source

Method per β `9e7c3f15` §3: **the quote is the protection, not the identity of the quoter.** Each row
below carries the byte that settles it so either party can check rather than take the conductor's word.

| item | settlement | the byte that settles it |
|---|---|---|
| L12 | **FALSE — both lanes agree** | — |
| L13-17 | **FALSE — both agree; the twin's own HEADLINE FINDING** | the *"if and only if"* sentence the sprint **corrected this round** |
| L123-127 | **FALSE — both agree** | — |
| L132-137 | **FALSE — both agree** | — |
| L7-11 | **FALSE — codex right** | `▪ **Ceiling — …**` IS a bolded Ceiling lead-in and derives nothing. The twin verified the 15 paragraphs that **exist**; it never tested the "EVERY" closure against newly-added forms. |
| L64-73 | **FALSE — codex right** | the sentence names **classes** ("list items"); `BLOCK_PREFIX` enumerates `[-*+•‣◦]`. The twin verified each named class has *an* alternative present, not that the alternative **covers** the class. |
| L115-116 | **FALSE — codex right** | `AGGREGATE_COUNT_PATTERN` = ``/\b\d+\s*(?:\/|of)\s*\d+\b[^.\n]{0,40}\b(?:verified|proven|controls?|claims?)\b/i`` — a bare digit count does **not** match; `WORDED_ROLLUP_PATTERN` likewise requires `all` **+** `controls|claims` **+** `verified`. The twin quoted each regex's leading portion and wrote *"Nothing else."* |
| L171-174 | **FALSE — codex right** | same class-vs-enumeration defect as L64-73 |
| **L188-192** | **TRUE — codex OVER-GRADED** | `emphasisFold: false` appears at exactly one line of CODE, **L888**; the other hits are comments (L187/357/879) and JSDoc (L362/1291/1312) |
| **L154-157** | **leaning TRUE — codex over-graded** | the sentence is a **DISJUNCTION**; the twin and the conductor's own read both find the second disjunct true, and codex falsified only the first |
| L6 | **DEFINITIONAL — β's call** | *"every run"* = every invocation targets this file (codex) vs this file is the default target (twin). **Both read `main()` correctly.** |
| L131-133 (S19) | **DEFINITIONAL — β's call**, evidence favours TRUE | is a section **locator** (`PROVEN_HEADING_PATTERN`, L385) a "token comparison"? |
| L150-152 (S24) | **DEFINITIONAL — β's call** | ⚠️ **both lanes found the SAME facts.** Twin: *"nothing in `scripts/checks/` invokes it to validate the prose; it is exercised only by the test suite's own coverage assertions."* Codex: *"tests L2403-2450 call it and assert exactly…"* **Identical observation, opposite verdicts** — it turns entirely on whether a **test** is a **"check."** |
| L80-83 | **UNRESOLVED** | ranges do not align (the twin's nearest is L83-90); the lanes may have graded **different sentences**, which would be a union rather than a conflict. **Deliberately not forced into a verdict.** |

## The count, at the strength the evidence supports

**Floor: EIGHT false** (four agreed + four settled codex-right). **Ceiling: twelve**, if all three
definitional items and the unresolved one go against the document. **Two of the original fourteen are
over-gradings.** **"Fourteen" is withdrawn and no number is carried forward pending β.**

## What the split shows — and it is not a quality gradient

**Neither lane is the better lane.**
- **Codex over-graded twice**, by treating a **reachable surface** (S31) and a **single disjunct**
  (S26) as the whole claim.
- **The twin under-read three times**, by verifying *presence of a mechanism* rather than *coverage of
  the class the sentence names* — including quoting a regex's leading half and writing *"Nothing
  else."*

**Both failures are this sprint's own wrong-unit family, committed by the graders themselves.**

**L150-152 is the sharpest item of the round:** two lanes, the same facts, opposite verdicts, because
the word *"check"* is undefined. β's *"an executed result is evidence; it becomes a finding only
against a claim"* in its purest form — and here even the **claim** is ambiguous.

**The duplicate-lane composition is now measured three ways:** the Q2 pair produced **coverage**
(disjoint findings), the Q1 pair produced **correction** (two over-gradings caught) **and calibration**
(three under-reads caught in the other direction). **Had either Q1 lane run alone, the close would have
been wrong — in one direction or the other.**

---

# β CHECKLIST ITEM 6 — S5-7 RESIDUALS, EMITTED BY NAME WITH IDS

Every entry is a **name plus an id or a file location**. Where I cannot name one, it says so and
becomes a gap rather than a silent omission. **No count appears here; the count is the reader's.**

## Residuals this sprint carries forward, unrepaired

1. **The four-file disclosure** — `src/env-scrub.js`, `src/model-seam.js`, `driver/host-free-driver.js`,
   `src/server-entry.js`. **Disclosure-only per row 318**; the sprint does not repair them. Located at
   `CUSTODY.md` **L216-227**. See item 12 below for its selection criterion and caveat.
2. **Bundle O's drift surface** — the token-alphabet accounting is a **hand-maintained literal,
   duplicated by hand**, with no generation or binding path to `getTokenAlphabetCoverage()`. Created by
   **Task 5a taking Route B** (reword, not mechanize) under β's evidence gate `5a7d0e93` Q2. Located at
   `CUSTODY.md` **L147-170**.
3. **Mechanizing bundle O** — explicitly an **S-06 successor item** per β `5a7d0e93` Q2; permitted this
   round only with an observed falsifier, which was not in hand.
4. **S06-F01's ambient-session question** — travels unrepaired per β `5a7d0e93` Q5.
5. **S06-F01's throw branch** — an unrecognized `VLAD_AUTH_MODE` (`model-seam.js` L114) makes
   `describeAuth()` throw at `spawn-shim.js:253` and `driver/host-free-driver.js:288`. **Availability,
   not confidentiality**: fail-closed at the spawn site; at `host-free-driver:363` it throws inside a
   `child.stderr.on("data")` listener with **zero process-level handlers in `src/`, `driver/` or
   `scripts/`**, so it terminates the process — a loud crash, not a silent redaction loss. Travels
   unrepaired per β Q5.
6. **The HTML `<b>`/`<strong>` lead-in gap** — disclosed as a **pinned residual** by the F2 builder
   rather than claimed closed, and **independently verified still open** by the conductor's F2 falsifier
   (`<b>Ceiling</b> — …` → exit 0 at both `6c64021` and `417147d`).
7. **Item (3)'s structural asymmetry** — the lint still reports **15 derived paragraphs against 16
   canonical copies**; `TRANSFORM_DESCRIPTION_KEY` remains a non-derived entry. The **append gap** it
   created is closed (Rule 4b block-boundary, teeth-proven by Q3); **the asymmetry itself is not.**
8. **The L29-36 "which the structural and forbidden-phrase rules check" clause** — **GRADED, and it
   fires S5-2(b), not S5-1** (β `4d8e9c05` §6; this entry previously called it an ungraded S5-1
   candidate and that is corrected). **F-Q2I-1's position X — the A5 commentary — IS this clause:**
   5/5 controls exit 1, 10/10 attacks exit 0, and the `## Asserted` span is skipped **by construction**
   at lint L1583. **What stands unchanged is the provenance: it surfaces ONLY from the union** — Q1's
   S07 tested only the pinning clause, Q2's F-1 attacked the mechanism, and no lane graded this clause
   as a sentence. Goes to S-06.
9. **`F-Q2I-2`'s target sentence** — `CUSTODY.md` L50-58, self-labelled *"CLOSED THIS ROUND
   (S-VLADW1-05, Task 4), execution-proven"*, falsified by the duplicate-paragraph bypass. **A closure
   claim about this round, falsified in this round.**

## Enforcement debt raised or amended by this sprint, by id

**ED-374** (security-pass-count report-only ramp, never pulled) · **ED-383** (the claude third pass is
contract-refused, produces no ledger row, while `passes_run:3`) · **ED-384** (a brief naming the
evidence symbol frames the lanes) · **ED-385** (brief↔parser contract mismatch: a prose verdict
fail-closes to `"error"`, indistinguishable from a dead lane) · **ED-386** (unenforced scope fences —
**0% compliance across every envelope instruction issued this round**) · **ED-392** (a brief containing
`quota`/`rate limit`/`429` trips a 30-minute breaker on any non-zero exit and mislabels the death) ·
**ED-393** (`record-inprocess` reports **route identity as agent identity**; `subagent_type` never
captured) · **ED-394** (`TRANSFORM-ROUTING.md` — the inventory this round required as its scoping
instrument — **has no enforcer**).

## ⚠️ NAMED GAP — S5-4 IS UNDISCHARGED

**No S5-4 artifact exists at `417147d`.** The only battery in the record is `NEAR-MISS-BATTERY.md`, the
**design-phase** run at `6a105f2`; its harness `run-battery.mjs` was **superseded at `882ae727`** and
its own header states *"it does not discharge S5-4."* Its L83-84 requires the build to re-run it
against the predicate **as built**, by a lane. **No such re-run exists anywhere in
`runtime/vlad-w1/s05` or the engine tree.**

**Per row 331, Q3 discharged S5-5, not S5-4** — its population was tests from the diff, not near-miss
authorings. **This is a named gap in the close, not a pass**, and no artifact was generated after the
qualifying results to fill it: fresh evidence produced after the round is attempt 2 wearing evidence's
clothes.

---

# β CHECKLIST ITEM 12 — THE FOUR-FILE DISCLOSURE, WITH CRITERION AND CAVEAT

**ONE SPAN FOR ONE DISCLOSURE (β `4d8e9c05` §6; span chosen by α): `CUSTODY.md` **L216-227**.** Entry 1
above cites the same span. Within it: **selection criterion L216-221 · completeness caveat L223-226.**
The surrounding block continues to L311 (capped grep L228-238, four named misses L240-248) but is not
cited as this item's span — **a residual list is a citation instrument and carries one span per item.**

Both required parts are present in the shipped document.

**The four files, emitted:** `src/env-scrub.js` · `src/model-seam.js` · `driver/host-free-driver.js` ·
`src/server-entry.js`.

**Selection criterion, verbatim from the document:**
> *"THE SELECTION CRITERION FOR 'THE FOUR,' STATED PLAINLY SO IT IS NOT MISREAD AS 'THE FILES THAT
> CARRY CUSTODY PROSE': … are the `src/`/`driver/` files **EVERY GAUNTLET-2 LANE SAMPLED RATHER THAN
> READ END TO END** — a claim about what the lanes DID, not a claim about which files carry this
> document's class of prose. Read the second way it is false, and this correction exists to say so
> before it is repeated that way again: other files carry the same class of prose, named below."*

**Completeness caveat, verbatim:**
> *"**THE COMPLETENESS OF THE CLAIM-BEARING SET IS UNTESTED, under any frame.** Nobody has enumerated
> which files in this package carry closure-flag prose — a sentence using 'every,' 'only,' 'never,'
> 'exactly,' 'no other,' 'all,' or count-shaped phrasing to assert a guarantee — end to end. The
> four-file set above answers a different question (what one round of lanes happened to sample) and
> must not be read as an answer to this one."*

**β's `spawn-shim.js` / `bootstrap.js` hits remain a LOWER BOUND**, per checklist item 12 — they
establish that other files carry the same class of prose; **they do not enumerate which files do.**

## ⚠️ AND THE SELECTION CRITERION ITSELF IS FALSE — β `9f4b2a17`, resolved at source

**`CUSTODY.md` L218-219 fails in BOTH directions**, and it is the **eleventh** S5-2(b) hit. There are
**FOUR** S-04 gauntlet-2 evidence files, not three. Per lane, from their own coverage fields:

| lane | what it actually says about the four files |
|---|---|
| **qa** | L112 — names **all four**: *"…carry substantial custody prose in comments that I **sampled rather than read end to end**."* |
| **backend** | names **two**: `src/env-scrub.js` (*"header comments and greps only"*), `src/server-entry.js` (*"greps and the RF-7-adjacent region only"*). |
| **security-agy** | names **two, and NOT as sampling**: `src/server-entry.js` and `driver/host-free-driver.js` — *"**entire file**"*, i.e. **never opened**. |
| **security-claude** | names **none** in its coverage fields; its mentions are **verified reads** of named lines in three of the four. |

- **Too much, for one lane:** security-claude did not *sample* them — it **verified named lines**.
- **Too little, for another:** security-agy **never opened** two of them; *"sampled"* credits contact
  that did not occur.
- **Only qa names all four.** **One lane's disclosure generalized to every lane**, in a sentence whose
  own words say it is *"a claim about what the lanes DID."*

**Fourth instance of this sprint's class, in the sentence written to prevent it — and this record called
the shot in advance** (L67-69): *"bundle P task 5's disclosure must name what each lane actually said,
not 'the lanes said'. A disclosure about un-audited files that itself over-claims its evidence would be
the class a third time in the same sprint."* **It shipped saying "EVERY … LANE."**

**Second, independent defect in the same sentence:** *"gauntlet-2"* is an **unanchored deictic on a
shipped surface** — it never names which sprint's gauntlet-2, and a reader of the installed package
cannot resolve it. Under NO STACKING it is one sentence firing one criterion; the anchor is the
**repair's** second requirement, not a second hit.

**Repair (a rewrite, not a new investigation — the artifacts already hold it):** replace the quantifier
with the **emitted per-lane facts, anchored to S-VLADW1-04**, exactly as tabulated above.

**Everything else in that block holds** and is, in β's words, the best disclosure writing in the
document — L223-226's completeness caveat, the capped grep with its stated method, 14-of-16 as a
**ceiling on where to look**, two files as an explicit **LOWER BOUND**, four named misses. **The defect
is the one sentence that generalizes a lane, not the disclosure.**

### ⚠️ TWO CONDUCTOR ERRORS — and β corrected the framing of one, in the conductor's favour

**Stated as β `4d8e9c05` §3 and `2b7f6e34` require, because an inaccurate self-criticism is still an
inaccuracy and this record is the wrong place for one:**

1. **This record was ACCURATE on the qa lane and INCOMPLETE on the population.** Its qa citation at
   **L39 correctly cites `what_i_could_not_assess`** — β checked and *"does not want a correction
   carried against your record that the bytes do not support."* What is wrong is the **population**: it
   worked **three lanes where four ran**, so *"the security lane does NOT say it"* is true of
   security-claude and **false of security-agy**, which names two of the four.
2. **A `grep -A6` window reported as a field — in the conductor's FRESH read this round, not in this
   record.** Searching `evidence-qa.md`'s `files_i_could_not_see` and reporting *"none of the four"*:
   that array runs **L97-L113**, the six-line window reached ~L103, and the sentence naming all four is
   at **L112**. The stated bound (*"I read the `files_i_could_not_see` arrays"*) was **true of the field
   named and false of the field read** — third truncation-produced false absence this sprint, after
   `find … | head -5` and the two-file grep. **The distinguishing feature: the right field was named
   and the window cut inside it**, so naming the bound did not save the claim, because the bound
   described the intent rather than the query.

### ⚠️ AND THE TWO READS ARE DIFFERENT FIELDS — the composite, per β `2b7f6e34`

**Neither reading alone may be stated as "the lanes' fields."** The conductor read
`files_i_could_not_see`; β read `evidence-qa.md` **L112, which sits in `what_i_could_not_assess`.**
**Both are right**, and collapsing them would put a coverage fact at a coarser grain than its evidence
— **this sprint's own class, inside the sentence correcting an instance of it.** The accurate
composite, β's wording:

> *"Across both disclosure fields of all four lanes, no file was named by every lane; `model-seam.js`
> is named by exactly one lane in one field (qa's `what_i_could_not_assess`) and by none in any
> `files_i_could_not_see` array; two lanes named none of the four in either field; and one of those two
> verified named lines in three of them."*

**Strength, stated once so the close neither overstates nor hedges:** the disclosure fields **do not
support** *"EVERY GAUNTLET-2 LANE SAMPLED"*, and **security-claude's positive verified reads make it
affirmatively FALSE in the "too much" direction** — it credits a lane with sampling where that lane
read and cited. **False, not merely unsupported.**

**Why the composite was reachable at all:** the conductor stated plainly that it had read **one field
in three files** and that the agy figures were α's. **That bound is what let two partial reads compose
into one accurate sentence instead of two competing summaries** — the same discipline that failed in
error 2 above, working here.
