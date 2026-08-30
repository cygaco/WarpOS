# CLOSE — S-VLADW1-05 — DRAFT (slots in [brackets] are β's Part B; nothing here is final until β's msg_id is cited beside each slot)

**Disposition:** NO-RELEASE at the one attempt (rows 317/318). No attempt 2. The vlad engine branch `wt/S-VLADW1-01-engine` stays unmerged to vlad main; the qualifying pin is `417147d`. Successor S-VLADW1-06 minted tracker-only.

## The terminal — visible correction (β 2d5f9e18 §1-§2; f2a08d51 (a) A1/A2)
**Pre-committed (row 318, 7b3e6d21, verbatim):** "this sprint fixes three known instances of a class whose size is unknown, with the four un-audited surfaces named and carried to the successor; a close reading as 'the class is closed' is the class one layer out."
**Corrected:** "S-VLADW1-05 repaired four routing sites in `custody-claim-lint.js` at 417147d and proved each repair by observed mutation — baseline 117/117, every protecting test fails when its mechanism is removed, confirmed by an independent lane (Q3, d-mtf5rc6t) and an independent tree check, with the package suite independently confirmed 408/408 at the pin by a blind third-party run with real dependencies. The ROUTING question is closed over that one file at that commit, except the sites `TRANSFORM-ROUTING.md` names as deliberately verbatim. The TRUTHFULNESS question is NOT closed and is wider than the class this sprint scoped: five qualifying lanes (two claim-truth, two adversarial, one teeth; two model families; identical artifact-only briefs) returned four fail / one pass; the sprint's own document carries sentences graded false by independent readers — [β's mapped S5-1 list, led by the A5 P2-vs-P4 self-contradiction that `custody-claim-lint.js:1073` pins verbatim] — including the sentence this sprint corrected (L12-17, both claim-truth lanes agreeing from the bytes), [the correction-introduced sentences, per Part B], and claims one lane graded false that β's read of the document's own vocabulary and qualifiers RESOLVED AS TRUE, reducing the count (S19, S24, S31); and the lint accepts plainly-worded false custody claims outside the phrase family it hardens — [a designed ceiling disclosed at L116/L241, per β f81a5d63 §1 / 5a1e93c7]. Three instances were fixed; the class is demonstrably larger than three and its size remains unknown; its members surfaced here are carried to S-VLADW1-06 as an emitted list, not a count. No release; one attempt; no attempt 2."
**Reason for the correction:** the results showed the pre-committed wording understated (the class measured larger than three; the corrected sentence found false again by two independent lanes) and was silent on what held (four execution-proven repairs; the routing closure). Accuracy, not direction: the same rule forbids softening an overstatement.

## The five lanes — verdicts only (β maps; the lanes do not adjudicate)
| lane | route / id | token (read from the lane's raw file) | coverage limits in the lane's own words |
|---|---|---|---|
| Q1 claim-truth | codex `d-mtf67lqj-8cad4634` | fail | surface read end to end; budget ≤7 min stated-and-exceeded (831585 ms) |
| Q1 claim-truth | in-process `d-mtf79ol1-93a9e0e4` (general-purpose/opus per the harness transcript) | fail | full test file 117/117 + eight mutants run; sampled regions named |
| Q2 adversarial | codex `d-mtf6pwa2-69d952e6` | fail | lint SAMPLED; test file unassessable (`spawn EPERM`, a codex-sandbox limit); budget stated-and-exceeded (530600 ms) |
| Q2 adversarial | in-process `d-mtf6zdid-a5ed5f0c` (general-purpose/opus) | fail | 31 lint invocations, control/attack pairs |
| Q3 teeth | in-process `d-mtf5rc6t-08cc5b00` (general-purpose/sonnet) | pass | population = the changed test file's new/flipped test() blocks; four population-adjacent files not run |
Record caveat (ED-393): the in-process records' `role`/`model` fields are registry-derived; identity is from the harness transcript.

## The union (adjudicated per sentence; no count)
- **Confirmed by both Q1 lanes (same sentence, both false):** L12 · L12-17 (the sentence corrected this round; codex's quote carries the document's own "CORRECTED (S-VLADW1-05, this round):" marker) · L123-127 (three distinct defects across the lanes — [β: which fires]) · L132-137.
- **Contradiction settled codex-right (twin under-graded; α-confirmed at the pin):** L7-11 · L64-73 · L115-116 · L171-174 — class-vs-enumeration claims over character-level mechanisms (`BLOCK_PREFIX` L784-785; `BOLD_LEAD_IN` L678; `AGGREGATE_COUNT_PATTERN` L1335; `WORDED_ROLLUP_PATTERN` L1343).
- **Contradiction settled twin-right (codex over-graded):** L188-192 / S31 (one code call site, L888; "call site" = an invocation location throughout the document; three independent lines).
- **Resolved by β:** L131-133 / S19 TRUE (the document's own "token" = status token; a section locator is not a token comparison) · L150-152 / S24 TRUE (the qualifier "to verify the numbers in THIS paragraph"; the lane quoted it and misread it) · L154-157 / S26 STANDS on AP-17 as an inaccurate disclosure (not false truth-functionally — a disjunction true on its second disjunct); repair = strike the first clause.
- **Definitional, β's:** L6 — [β]. **Range-misaligned, unresolved:** L80-83 — [β: union or unresolved].
- **Q2 codex:** F-Q2C-1a (plainly-worded false custody claims accepted at exit 0 in scanned regions — execution; a designed ceiling unless a shipped sentence claims otherwise: L116/L241 disclose the limit; L320-322 is a norm about authoring — [β]) · F-Q2C-1b · F-Q2C-2 (A5 says P2; `CUSTODY.md:531-566`, `model-seam.js:655-706`, `spawn-env-allowlist.js:3-12` say P4; `custody-claim-lint.js:1073` binds A5 verbatim — a mechanism enforcing a falsehood; leads S5-1).
- **Q2 in-process:** F-Q2I-1 (the `## Asserted` region is scanned by no forbidden-claim rule — ONE defect, [β: mechanism or the L29-36 clause]) · F-Q2I-2 (Rule 4b's block-boundary closure falls to a duplicated paragraph — `locateBoundParagraphSpan` → `content.match`, first occurrence; falsifies a sentence self-labelled "CLOSED THIS ROUND (Task 4), execution-proven") · F-Q2I-3 (the `caseFold:false` carve-out).
- **Surfaced only by the union:** the L29-36 clause "which the structural and forbidden-phrase rules check" — graded by no lane.
- **Not defects:** the lint's "N Proven claim(s) checked" report (β 5a1e93c7: reports an action performed; ε's contrary characterisation recorded); the plain-ASCII acceptances as a lint bypass (a disclosed designed ceiling).

## Criteria (β's grading from the files, per the row-344 checklist)
S5-1 — [β] · S5-2 — [β] · S5-3 — [β; TRANSFORM-ROUTING.md read in full, sound, count reconciles 32; the shipped L131 sentence TRUE on the document's vocabulary] · **S5-4 — UNDISCHARGED: no artifact at 417147d** (the design battery at 6a105f2 is superseded and "does not discharge S5-4" by its own header; no lane re-derived the near-miss population through the matcher as built; ε declined to manufacture one after the results existed) — a named gap, not a pass · S5-5 — [β; discharged on Q3's evidence: every mutation run, baseline 117/117 unaffected by the stub — the file collects 117 with real deps too] · S5-7 — [β; from ε's assembled residual list, item 6] · item 12 — present at CUSTODY.md L216-227 (selection criterion + completeness caveat verbatim) — [β]. NO STACKING: one defect fires one criterion.

## Method notes (the retro's input)
- An executed result is evidence; it becomes a finding only against a claim; the lane supplies the execution, the criterion the question, the mapping decides (β f81a5d63 §2).
- The quote makes an error checkable, not prevented; articulate specificity is not accuracy (β 8c4f0b23).
- Neither lane is the better lane: the two claim-truth lanes were wrong in opposite directions — over-grading (a reachable surface, a disjunct taken as the whole claim) and under-grading (presence of a mechanism verified instead of coverage of the class named). The wrong-unit error appeared at three layers: the prose, a lane's grading of it, a summary of the grading (β 1b8f4a20).
- The duplicate-lane composition paid out three ways: coverage (the Q2 pair's disjoint findings), correction (up to nine over-gradings caught), calibration (four under-reads caught the other way).
- A correction is a new claim and inherits the full claim discipline (β e73f5a28 §3): S-05's own reword produced sentences graded false and an inaccurate disclosure.
- The artifact-only brief is the variable (row 331, measured): every finding above was absent from the sprint's own defect list, census and inventory.
- The engine's fail-closed walker refused the measuring junction ("refusing to silently skip it") — the day's inverse control finding.
- β's measured asymmetry: five failures, five unverified relays; everything checked at source held.
- Envelope instructions had a 0% compliance rate across every lane that received them (ED-386).
- Instruments: the SDK stub (Q3) and `spawn EPERM` (Q2 codex) — both disclosed by the lanes; the junction confound — measured away by run 2.

## Gaps carried by name
S5-4 undischarged at the pin · the four population-adjacent test files not run under the mutations · the four un-audited surfaces (row 318) · TRANSFORM-ROUTING.md without an enforcer (ED-394) · the L29-36 scanning clause ungraded · [item 6 if ε's list is incomplete].

## Commit-message corrections (S5-1 reaches commit messages)
`417147d` — git note (the builder's "mutated"→"unmutated" self-disclosure) · `69143de7`, `e533f7f9` — git notes (three-lane close declared with two lanes omitted; corrected record at 68c7fefb / 0a3fd916; ε's later `-f` overwrite recovered and disclosed in the notes — ED-395).

## Successor
S-VLADW1-06 minted tracker-only from `runtime/vlad-w1/s06/plan-payload.DRAFT.json` with [β's list] — via `add-sprint.js` + `plan.js` + `routing.js record`, manifests regenerated (ED-365; never hand-flipped YAML, ED-359).
