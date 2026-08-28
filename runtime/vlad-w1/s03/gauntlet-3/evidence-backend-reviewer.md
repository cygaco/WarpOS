# Lane evidence — `backend-reviewer` (BINDING) — S-VLADW1-03 gauntlet-3 (QUALIFYING RUN)

Shape: `in-process-agent` · claude-opus-5 · elapsed 622633 ms · 36 tool_uses · agentId `a7ff5a06325e2eb40`
Target: commit `b2583d6`. Brief: `lane-backend.md`. Isolation: second of three SERIALIZED lanes, live worktree.

**Verdict: FAIL.** S-criteria: **S1 cannot-assess · S2 FAILS · S3 holds · S4 cannot-assess · S5 cannot-assess.**
Worktree restored; HEAD unchanged; suite back to 318/318; `check:ship` exit 0.

**This lane returned its JSON on the FIRST dispatch.** It was lost to truncated mid-thought returns twice
earlier in this sprint; the brief told it so explicitly and instructed it to cut scope rather than run out of
room before emitting. It did.

## THE HEADLINE — F-1, HIGH, and it is a fix-attempt-2 regression

Bundle 10b replaced a hand-kept paragraph list with a DERIVED population and shipped a claim about that
derivation stronger than the derivation delivers. The shape predicates are:

    ASSERTED_PARAGRAPH_MARKER = /^\*\*(A\d+)\s+—\s/      (custody-claim-lint.js:381)
    CEILING_PARAGRAPH_MARKER  = /^\*\*Ceiling\s+—\s/     (custody-claim-lint.js:383)

Both require an **exact em-dash**. `extractBindableParagraphs` `continue`s on non-match (:410) **with no
violation recorded**, so a paragraph failing the predicate is INVISIBLE rather than REFUSED.

The lane injected one new, substantive, user-visible claim paragraph, one authoring at a time, running
`npm run check:custody` after each and restoring between — **controls first**:

| # | authoring | result |
|---|---|---|
| T1 | `**A9 — ...**` (em-dash) | **RED** exit 1 — `unbound-paragraph: asserted paragraph "A9" (line 188) has NO canonical copy` |
| T7 | `**Ceiling — ...**` (em-dash) | **RED** exit 1 — `ceiling paragraph ... has NO canonical copy` |
| T2 | `**A9 – ...**` (en-dash U+2013) | **GREEN** exit 0 |
| T3 | `**A9 - ...**` (plain hyphen) | **GREEN** exit 0 |
| T4 | `**A9: ...**` (colon) | **GREEN** exit 0 |
| T5 | `  **A9 — ...**` (two-space indent) | **GREEN** exit 0 |
| T6 | `**Ceiling – ...**` (en-dash) | **GREEN** exit 0 |

**Five of seven authorings produced ZERO violations of any kind** — not `unbound-paragraph`, not
`unbindable-paragraph-shape`, not `no-bindable-paragraphs-found`.

The file's own three-direction fail-closed disclosure (:352-362) covers only case (a), ZERO paragraphs
derived — **it cannot fire when 20 paragraphs derive and the 21st is invisible.** Single-paragraph
invisibility is asserted away, not disclosed.

**T6 is the sharpest instance.** The shipped sentence at `CUSTODY.md:7-11` says *"EVERY paragraph led by a
bolded `Ceiling` lead-in"* is derived and bound, and that *"a NEW Asserted or Ceiling paragraph added here is
RED until it is bound"*. T6 IS a paragraph led by a bolded `Ceiling` lead-in, and it shipped green. Per the
lane: **"This is not true-one-reading-over; it is false on the sentence's own words."**

The pre-10b hand-kept list would have failed VISIBLY on a new paragraph. The derivation fails INVISIBLY.

## Verbatim envelope

```json
{
  "lane": "backend-reviewer",
  "verdict": "FAIL",
  "commit_reviewed": "b2583d6",
  "worktree_clean_at_finish": true,
  "s_criteria": { "S1": "cannot-assess", "S2": "FAILS", "S3": "holds", "S4": "cannot-assess", "S5": "cannot-assess" },
  "findings": [
    {
      "id": "F-1", "severity": "HIGH", "criterion": "S2",
      "file": "engine/CUSTODY.md:7-11 (shipped copy); engine/scripts/checks/custody-claim-lint.js:347-350 and :380-383 (mechanism)",
      "claim": "The completeness rule's own claim — that EVERY Asserted paragraph and EVERY paragraph led by a bolded Ceiling lead-in is derived and bound, so 'a NEW Asserted or Ceiling paragraph added here is RED until it is bound' and 'Shipping an unbound one is not possible by construction' — is FALSE: the derivation's shape predicate requires an exact em-dash marker, so five distinct user-visible authorings of a brand-new unbound claim paragraph ship with the gate GREEN.",
      "execution_proven": true,
      "evidence": "See the T1-T7 table above. Root cause read from source: ASSERTED_PARAGRAPH_MARKER = /^\\*\\*(A\\d+)\\s+—\\s/ and CEILING_PARAGRAPH_MARKER = /^\\*\\*Ceiling\\s+—\\s/ (custody-claim-lint.js:381,383); extractBindableParagraphs continues on non-match at :410 with no violation recorded. The file's three-direction fail-closed disclosure (:352-362) covers only case (a) ZERO paragraphs derived. NOTE: this defect is NEW IN FIX ATTEMPT 2 — bundle 10b (d5fca1d) introduced both the derivation and the sentence, replacing a hand-kept list that would have failed visibly."
    },
    {
      "id": "F-2", "severity": "MEDIUM", "criterion": "none",
      "file": "engine/scripts/checks/lib/strip-comments.js:428",
      "claim": "The string-blanking half of bundle 10a's new export is present and correct but is asserted by NOTHING — its distinguishing behaviour can be reverted to the old comments-only policy with the entire suite and every ship gate staying green, so the mechanism can silently regress.",
      "execution_proven": true,
      "evidence": "Mutation P5: changed stripCommentsAndStringBodies from `return lexAndBlank(source, true);` to `return lexAndBlank(source, false);` (making the new export behaviourally identical to the old one) and ran the full suite: exit=0, 318/318, nothing red. The export IS genuinely consumed on real classifier paths (test/env-scrub.test.js:610, :1312, :1336; test/entry-bootstrap.test.js:882), so this is a falsifier gap, not dead code. Direct demonstration the reverted policy reopens a real hole: for `const doc = \"initCredentialCustody(CREDENTIAL_ENV_NAMES);\";`, the SHIPPED strings policy yields 'looks like a real call? false' while comments-only yields 'true'. Why no test catches it: the committed inert-control fixture test/fixtures/10a-inert-control-bypass/entry.js carries its decoy text in // COMMENTS (lines 17, 31), and the gauntlet-2 bootstrap.js defect was likewise comment-shaped — both directions plain stripComments() already closed. No committed fixture is STRING-shaped, so the half of 10a that is actually new is unobserved. Does NOT by itself fire S4 (not one of the five named falsifiers); it is the same 'present but never observed' shape S4 exists to catch."
    },
    {
      "id": "F-3", "severity": "LOW", "criterion": "none",
      "file": "engine/scripts/checks/lib/strip-comments.js:341-350",
      "claim": "The strings policy can blank REAL CODE and hide a real call (fail-open) when the regex-vs-division heuristic mis-reads a regex literal following `)` — but this is an explicitly disclosed residual and it is NOT instantiated on the shipped graph, so it is a re-confirmation, not a new finding.",
      "execution_proven": true,
      "evidence": "Probe: `if (c) /['x]/.test(s); initCredentialCustody(NAMES);` -> after blanking, 'call visible = false' — the real call was blanked because isRegexAllowedHere() returns false after `)`, so the `'` inside the regex class opened a string span consuming the line. Four sibling shapes left the call visible. Disclosed verbatim in the file header (NAMED CEILINGS #1-#3): 'code inside a span mis-read as a literal may be blanked away (the direction that hides real code). Neither is silently assumed impossible'. Instantiation check: grepped `[)\\]]\\s*/[^/*= ]` across src/, driver/, scripts/checks/ — two hits, both `[,)]/g` inside a regex character class (the grep's own false positive), correctly handled by consumeRegexLiteral's inClass tracking. The harmful shape does not occur on the shipped graph."
    },
    {
      "id": "F-4", "severity": "LOW", "criterion": "none",
      "file": "engine/src/env-scrub.js:322-325",
      "claim": "The captured-state update is gated on `capturedChanged || nextNamesSet.size !== capturedNames.length`, a length comparison against a list that may contain duplicates, rather than a set-membership comparison — reasoned only; I could not construct a reachable shape that loses a name.",
      "execution_proven": false,
      "evidence": "Read-only. On the first call capturedNames is namesArr.slice() WITHOUT deduplication (:283), while later calls rebuild from a Set (:324), so the representations can disagree in length for the same membership. Attempted to derive a case where a newly-supplied name is dropped from the full-history sweep and could not: any genuinely new name either absorbs a live value or takes the !hasOwnCaptured branch (:316-318), setting capturedChanged=true. Every shipped caller passes a frozen duplicate-free list. Robustness observation about a security primitive's bookkeeping, not a demonstrated defect."
    }
  ],
  "regressions_from_fix_attempt_2": [
    "F-1 (HIGH) — bundle 10b (d5fca1d) is the regression. It replaced a hand-kept paragraph list with a DERIVED population and shipped a stronger claim about that derivation than the derivation delivers. The pre-10b hand-kept list would have failed VISIBLY on a new paragraph; the derivation fails INVISIBLY on any paragraph whose lead-in deviates from the exact em-dash marker. This is precisely the predicted pattern — the repair produced a new defect one layer out from the thing it fixed, and the new false sentence sits in SHIPPED CUSTODY.md copy (lines 7-11), not only in an internal comment.",
    "F-2 (MEDIUM) — bundle 10a (49fa49f) shipped a new blanking policy whose distinguishing behaviour no committed test observes; the mechanism is correct today but unprotected against silent reversion.",
    "No regression found in bundles 10c, 10d, 10e or 10f within my scope — all four were verified sound by execution (see what_i_could_not_assess for the boundaries of that statement)."
  ],
  "what_i_could_not_assess": [
    "S1 — NOT ASSESSED AT ALL. I ran no leak probe, no TOCTOU battery, and no raw-control child-process test. I neither confirm nor deny S1 and my lane must not be read as evidence for it.",
    "S5 — NOT ASSESSED. Residual traceability is the qa lane's scope and I deliberately did not duplicate it. NOTE for alpha: F-1 is adjacent to S5 but is not an S5 verdict — F-1 says a shipped claim is FALSE (S2), not that a residual failed to travel.",
    "S4 — I did NOT systematically mutate all five falsifiers, so I return cannot-assess rather than a guess. Observed incidentally: falsifier F-2 went RED under my mutation M1 (test #193); the F-1 spelling falsifier's non-vacuity assertion exists at test/env-scrub.test.js:1427. I did not observe F-3, F-4 or F-5 red under their own mutations, and did not re-verify AC-8.4.",
    "S3 clause 3 ('the walker asserts BOTH classification directions') — verified by READING, not mutation. Assertions exist at test/env-scrub.test.js:711 and :723. My S3 'holds' is fully execution-proven for clauses 1 and 2 only; treat clause 3 as read-verified.",
    "I did not attempt to defeat the import-graph walker with an undisclosed mis-classification shape (aliased imports, re-bound references, computed member access). The header discloses computed member access, createRequire and globalThis['fetch'] as completely invisible to every downstream matcher; I did not test whether any is INSTANTIATED on the shipped graph. That is the exact distinction that defeated the control last round and I ran out of scope before reaching it — the highest-value unexamined area in my lane.",
    "custody-claim-lint fail-closed direction (a): I proved the derivation misses individual paragraphs, but did NOT separately verify that a wholesale structural rename yielding zero derived paragraphs actually produces no-bindable-paragraphs-found and a non-zero exit.",
    "I did not review no-held-secret-in-surface.js, no-secret-on-outbound.js, spawn-env-allowlist.js, verified-by-resolver.js or a5-wiring-presence.js.",
    "worktree_clean_at_finish detail, stated honestly rather than rounded: `git status --porcelain -- engine/` is EMPTY and every file I mutated was verified byte-identical to its pre-mutation content. HEAD still b2583d6, suite 318/318 exit 0, check:ship exit 0. However the FULL `git status --porcelain` was NOT empty at my baseline either — 41 untracked entries, all under .claude/ (session checkpoints, handoff files, runtime session-id stubs), none under engine/. That count is 41 both before and after my run, so I added nothing, but the brief's statement that the conductor verified porcelain 'empty' after the qa lane does not match what I found at start. Flagging it rather than quietly asserting a clean tree."
  ]
}
```

## Conductor note — the lane's last bullet is a correct catch against the conductor

The lane is right and I am recording it against myself. My verification and my brief said the tree was
"clean" / `git status --porcelain` empty; what I actually ran was **`git status --porcelain -- engine/`**,
which is path-scoped. The full porcelain carries 41 untracked `.claude/` session artifacts, unchanged at
41 before and after every lane. Nothing under `engine/` and nothing affecting the tree under judgment — but
the lane was right to refuse to assert a clean tree on my wording rather than on what it observed.
