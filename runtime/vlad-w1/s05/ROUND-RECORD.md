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

### Bundle P — HELD, not dispatched. A sequencing gap found before firing.

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
