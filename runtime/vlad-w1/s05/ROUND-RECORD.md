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

### Bundle N — dispatched `d-mteukug9-b8ccf260`, in flight
Brief updated against M's actual return before firing: suite floor raised 366 → 377, and an explicit
section that M's `emphasisFold:false` opt-out is load-bearing, guarded by M-1, and must not be removed
or bypassed; M's mid-word residual named as M's, not N's to close or restate.

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
