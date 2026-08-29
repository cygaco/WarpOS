# backend-reviewer — DIAGNOSTIC gauntlet 1 — S-VLADW1-05 (in-process Agent lane, claude-opus-5)

HEAD verified `6c64021`, branch `wt/S-VLADW1-01-engine`. Read-only; nothing created/edited/committed.

**VERDICT: FAIL (score 45).** Not "the build is broken" — M, N and O are execution-proven load-bearing
and their prose is unusually accurate. FAIL because **three findings ship a gate weaker than its own
text says it is**, two execution-proven evasions and one a trap a future maintainer walks into **with a
fully green suite**.

## B-1 — HIGH (bundle M/Q, WIRING)

`resemblesBindableLeadIn` passes `{emphasisFold:false}` at **L848** and then opts back **IN** at
**L866**: `const separator = canonicalizeClaimText(rest.slice(0, 1));` — defaults, so fold (8) is ON.
**Its own comment at L838-841 says the opposite.** `EMPHASIS_RUN` (L798) is `/^[*_]+/`, so backtick and
tilde reach L866, are folded to a space, trim to `""`, and satisfy the `separator === ""` branch —
**that is the only mechanism admitting them.**

- RAN, shipped: backtick/tilde separators → `"Ceiling"`, **1** refused-by-name violation.
- RAN, with L866 made consistent with its comment: → `null`, **0** violations, **and `node --test` →
  107 pass / 0 fail.**

So the behaviour is **load-bearing AND unpinned**: a maintainer "fixing the inconsistency" reopens the
silent-skip fail-open that RF-1/G-3/N exist to close, with a green suite. `Q-1 PINNED` covers the
**opener** position — a different position, unaffected by this mutation.

## B-2 — HIGH (PRE-EXISTING, not a regression from M–Q)

The forbidden-claim family and both rollup patterns **never touch the shared transform**, although L92
of the file's own header claims `canonicalizeClaimText` is *"the ONE rendering function every
token-level comparison in this file runs over BOTH sides"*. `findForbiddenClaimHits` (L1369) matches
raw `line`; `AGGREGATE_COUNT_PATTERN` (1318) and `WORDED_ROLLUP_PATTERN` (1326) match raw `content`;
`findShippedCopyClaimViolations` (1489, over `package.json`) is raw.

Demonstrated **inside one function**, same line, same loop iteration
(`findOutOfSectionClaimViolations`): the status-token check MATCHED plain / homoglyph / ZWSP / bold,
while the forbidden-claim check matched only the plain controls and **did NOT match** Cyrillic-a in
"guaranteed", ZWSP in "guaranteed", "guar\*\*anteed\*\*", ZWSP in "fully proven", Cyrillic-a in "cannot
leak". Rollups: **6 of 6 evasions not matched** against matched controls.

The residual note at 1348-1353 discloses phrase-shape and line-wrap limits — **not** spelling variance.

## B-3 — HIGH (INTRODUCED BY BUNDLE Q)

`findOnlySurfaceAssertionViolations` (**L1661**) iterates `extractBindableParagraphs`' **derived**
population (15), not `BOUND_PARAGRAPHS` (16). Bundle Q added the first bound-but-not-derived paragraph
(`TRANSFORM_DESCRIPTION_KEY`). Measured on the real `CUSTODY.md`:

| probe | result |
|---|---|
| (A) APPEND inside item (3) | `ok=true`, `[]` — the disclosed ceiling, reproduces |
| (B) REWORD inside item (3) | `ok=false`, `bound-paragraph-missing` — control |
| **(C) "only place" planted in item (3)** | **`ok=true`, onlySurfaceViolations=0 — GAP** |
| (D) same claim in a DERIVED Ceiling (L320) | `ok=false`, onlySurfaceViolations=1 |

**(C) and (D) plant a byte-identical sentence.** `TRANSFORM_DESCRIPTION_KEY`'s "WHAT IT DOES NOT CLOSE"
paragraph names only the Rule 4b append gap, so this second narrowing is **undisclosed**.

## MEDIUM / LOW

- **B-4 MEDIUM** — the case-closure asserts case-pair confusability it never checks. The premise is
  unstated and false for at least Cyrillic `в` U+0432 → `b` and `н` U+043D → `h`. Neither is in the
  token alphabet so coverage is unaffected, but `canonicalizeClaimText` is a general transform. Harm
  direction is **over-folding (false REDs), not evasion**.
- **B-5 MEDIUM** — the coverage report carries no literal-vs-derived provenance. **But
  `getTokenAlphabetCoverage()` reproduces `CUSTODY.md`'s prose EXACTLY** (15 domain, 12 covered, `n`
  claimedElsewhere with the ν reason, L/R noCandidate) — verified **independently**, recorded as
  verified rather than merely un-refuted. The gap is "cannot answer *how do you know* per entry", not
  wrong numbers.
- **B-6 MEDIUM** — `BOLD_LEAD_IN` **does** influence a comparison (L937 makes its capture the id; L1061
  uses it as the `BOUND_PARAGRAPHS` key). Every constructed case **fails closed**, so bundle M's
  scope-out *conclusion* survives but its *reason* does not.
- **B-7 LOW** — `CONFUSABLE_PATTERN` raw-joins 73 map keys into a character class with no escaping;
  safe today, but the closure now appends keys not fully hand-controlled.
- **B-8 LOW** — four exported `/g` regexes carry `lastIndex` for any `.test()` caller.

## MUTATION BATTERY — 6, via a loader hook with a hard "anchor not found" throw

| mutation | suite result |
|---|---|
| fold (8) removed | 4 tests report failures (H-2 ×2, M-1, M-2) |
| `BLOCK_PREFIX` → bundle-G | 3 report failures (G-3, N, RF-N1) — 2nd attempt |
| `CONFUSABLE_PATTERN` built BEFORE the closure loop (the order bug) | 3 report failures (RF-O1 ×3) |
| case-closure overwrites ν | 2 report failures (O-1 ×2) |
| drop `TRANSFORM_DESCRIPTION_KEY` | 3 report failures (RF-Q1 ×3) |
| **L866 made consistent with its comment** | **0 failures, 107 pass** ← B-1 |

**The first `BLOCK_PREFIX` attempt did not apply** (heredoc escaping; anchor not found; the harness
threw). **Per the brief that is a FAILED CHECK, not a pass** — both attempts recorded. The
order-dependence mutation is the one most expected to slip through and it did **not**: bundle O's fix
is genuinely pinned against reintroduction.

## Required fields

**`files_i_could_not_see`** — `engine/test/custody-claim-lint.test.js` (2561 lines) **SAMPLED**: read
L60-161 in full, grep-targeted the M/N/O/Q regions and every `emphasisFold` occurrence; did **not** read
the ~1200-line H/RF-1/RF-3/G battery. **The "suite does not pin L866" claim rests on the mutation run
across all 107, not on having read them.** `CUSTODY.md` **sampled** (item (3) L111-153, one Ceiling
L320), located programmatically, not read as prose. `model-seam.js` **not read**. `package.json` not
read. The four `src/`/`driver/` files not read (discharged elsewhere).

**`execution_proven` — RAN:** the coverage report and its exact agreement with shipped prose; the
separator-position fold behaviour and its mutation; all 8 forbidden-claim/rollup evasion rows plus
controls; the (A)–(D) `CUSTODY.md` mutation matrix; the derived-vs-bound set difference; all six
loader-hook mutations against the full suite; the `BOLD_LEAD_IN` id-derivation rows; the 73-key
regex-class scan; the `.test()` statefulness check; the shipped gate (exit 0) and suite (107/107).
**REASONED, NOT RUN:** B-4's letterform judgements; B-7's future-key risk; that B-2 is pre-existing
(read from commit stats and block comments, **not bisected**).

**`what_i_could_not_assess`** — whether L/R are truly unmappable (no vendored UTS #39); the
Armenian/Cherokee/Coptic/Deseret/Lisu evasions (qa lane owns that); security implications of B-2;
whether `CUSTODY.md`'s prose is *true* as opposed to consistent with the code; whether `check:custody`
is wired into a gate a user's install runs.

**`read_outside_the_quoted_region`** — for **B-1** the load-bearing fact is `EMPHASIS_RUN` at **L798**
being `[*_]+` and not `` [*_`~]+ `` — **50 lines above the quoted line**, and what makes L866 the sole
admitting mechanism. **Reading L848 alone would have supported the opposite conclusion.** For **B-3**
the 60-line rule rationale at L1531-1589 is what turns "a rule has a narrow population" into a finding.
For **B-2** the header claim at L92 and the residual note at 1348-1353. For **B-4/B-5** the closure
rationale at 306-311 supplied the domain-vs-values distinction.

**Attribution:** this is what **this lane** found. It did not read the qa or security returns. Its
probes on the two Rule 4b ceilings **agree** with bundle Q's shipped prose, built independently, and
that is recorded as agreement rather than corroboration.
