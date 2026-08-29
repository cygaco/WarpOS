# S-VLADW1-05 — Vlad Wave-1 ONE TRANSFORM, BOTH SITES (successor to S-VLADW1-04)

- **Status:** minted, not started — **no registry entry** (`add-sprint.js` repoints primary; mint at build authorization)
- **Minted:** 2026-08-29, at S-VLADW1-04's honest close
- **Surface:** vlad `wt/S-VLADW1-01-engine` @ **`6a105f2`** — UNMERGED, left deliberately as this sprint's starting surface
- **Predecessor ruling:** `runtime/vlad-w1/s04/gauntlet-2/ALPHA-RULING-S4-1-TO-S4-6.md` — S4-1 FAILS · S4-2(c) FAILS · S4-3/4/5/6 HOLD · **NO RELEASE, no attempt 2**
- **Predecessor adjudication:** `runtime/vlad-w1/s04/gauntlet-2/ROUND-ADJUDICATION.md`
- **β confirmation of the application:** row 316 `6e2d94af-b53c-4871-a09e-c8f107b2e35d`, `runtime/beta-consult/S-VLADW1-04-close-confirmation-6e2d94af.md` — CONFIRMED in full, **including that one of the two S4-1 failures is wording β itself recommended at row 313**. β ran the position-swap and reports the answer is the same in both directions: *"Approval is not a truth check, and β's recommendation is worth exactly nothing against the shipped bytes."*

**The class this sprint is aimed at, in β's words:** coverage asserted at a coarser granularity than the
mechanism has — "the two scripts the fold DOES cover" asserted a **script-level closure over a letter-level
sample** (`CONFUSABLE_FOLD` contains no lowercase `l`, `n`, `g` — three of `Ceiling`'s seven letters).
**Three instances: S4-1a, S4-1b, S4-1c.** Aim at the class, not the three sentences.

## Why this sprint exists, stated plainly

S-VLADW1-04's fix attempt closed every finding gauntlet-1 raised, discharged S4-2(d) twice over, held four of
six criteria, and grew the suite 339 → 366 with every mutant guarded. **It failed on the same class the
sprint pair exists to close, one layer out:** it authored **new false sentences about its own mechanisms**,
and it left one dimension of the rendered-form property implemented *beside* the shared transform rather than
*inside* it.

**The finding to carry above every process one:** those sentences were in prose the conductor reviewed and
passed, and one carried β's recommendation and α's approval. **The approval chain is not a truth check.**

## Residual groups carried VERBATIM from the ruling

1. **S4-1a** — confusable-fold calibration paragraph false: the fold is a 56-entry map (36/52 Latin skeleton letters); `l n g` etc. unmapped in both scripts; in-script homoglyphs of unmapped letters evade; the "mistake-reachable scripts closed / remainder attacker-only" framing is false because unmapped letters are reachable by the paragraph's own accident vector. Fix shape: state coverage as the letter set actually mapped (or vendor a confusables table), never as "scripts closed"; enforcer comment corrected to match.
2. **S4-1b** — "two escapes REMAIN" false: ATX-heading-prefixed (and twelve other prefix shapes) bolded lead-ins silently skipped. Fix shape: refuse-not-skip must extend to heading/list/blockquote prefixes on the LEAD-IN path (G handled block prefixes for candidates; the heading marker escapes), and the escape count must be replaced by a named class, not a number (the document's own rule: a number is a property of the day it is read).
3. **S4-2(c)** — emphasis canonicalization is not on the status-token path; `**ASSERTED** — NOT VERIFIED` plants green in Proven. Fix shape: move the emphasis fold INTO `canonicalizeClaimText` (or have `containsStatusToken` call `flattenForAssertionScan`) so both sites share one transform as G's comment already requires; near-miss battery gains emphasis-split status-token variants, controls first.
3b. **S4-1c** (re-classified per β row 316 `6e2d94af`) — the NOT-bound enumeration omits P1–P4 headings (an inverted P2 heading ships green): a coverage claim stated at a coarser granularity than the mechanism has, with an execution-proven evasion, inside a list the preamble introduces as "said plainly rather than generalised." **Third instance of the S4-1a/S4-1b class** — the successor is aimed at the CLASS with all three instances in view.
4. Security lane MEDIUM — `spawn-shim.js`'s split-secret worked example is false (fail-safe direction); qa MEDIUM — a third unnamed escape class; qa LOWs as filed.
5. **agy fallback** — the cross-family lane served on `gemini-3.1-pro-high`, not the pinned model; the record is well-formed but the pin was not honoured (ED-230 class); noted, not counted against any criterion.
6. Successor-carried from fix attempt 1 (already in the S-04 tracker): the transform's description paragraph is UNBOUND (needs the fixture builder); "unbound ≠ re-wrap is free" (header substrings pinned across wraps); the task-4 assertion message ("reviewer read") in a non-shipping test; a text-matching enforcer cannot distinguish a violation from a description of one (K and L2 both tripped it).
7. **ED-340** — remains OPEN, carried: mutant half satisfied 2026-08-10; roster half open with ED-354 as its instance. **ED-354** — OPEN (installed-roster parity; no new instance this sprint). **ED-358** — OPEN; this ruling is its second instance one layer out: a predicate/fold stated as closed over a category it only samples (S4-1a, S4-1b). New this sprint and cited: ED-360, ED-361, ED-362, ED-363; ED-257 amendment; ED-356 recurrence ×3.
8. Process residuals for the retro: three brief-premise defects (J's "zero executable uses", K's atomicity, L2's cwd — ED-363); the excerpt-window false HIGHs (ED-362, then agy's Unicode belief refuted in two commands); ε's idle-while-polling pattern (repeated; the α watchers carried the waits); ε's "clean tree" reading a mid-write tree (caught before reporting); the α/ε WarpOS commit race (resolved by hash-naming); usage-limit risk not realised this run.

## Successor-carried items already recorded in the S-04 tracker (expanded)

1. **The transform's own description paragraph is UNBOUND.** Nothing pins `CUSTODY.md`'s description of `canonicalizeClaimText` byte-for-byte. It cannot be closed cheaply: adding a `BOUND_PARAGRAPHS` entry makes Rule 4b demand the text appear in the clean test fixture, and that fixture is built only from keys matching `^Ceiling` or `^A\d+$`, so the "clean fixture lints clean" test would go RED. Closing it needs the fixture builder in `test/custody-claim-lint.test.js` extended, with its own falsifier. Bundle K escalated rather than faked it.
2. **The count-of-surfaces exhaustiveness family is disclosed but not mechanised** (β row 314 DISCLOSE; L1's measured candidate pattern handed forward — zero hits across 15 bound paragraphs, no false positives — which does NOT overturn the ruling, whose ground was unboundedness rather than over-refusal).
3. **"Unbound" does not mean re-wrapping is free** — header substrings are pinned across wraps independently of the canonical-copy bind.
4. **A stale assertion MESSAGE in a non-shipping test** ("reviewer read" vs "human review"); cannot fail S4-1 because the file does not ship.

## Scope (proposed — β mints the rule, α authorizes the build)

- **One transform, both sites.** The emphasis fold moves INSIDE `canonicalizeClaimText`, or `containsStatusToken` routes through `flattenForAssertionScan`. G's own comment already requires this; the sprint is making the code obey it. Battery gains emphasis-split status-token variants, controls first.
- **Refuse-not-skip on the LEAD-IN path for every prefix class**, heading markers included.
- **Confusable coverage stated as the mapped letter set**, or a vendored Unicode confusables table. Never "scripts closed".
- **Escape counts replaced by named classes everywhere** — a number is a property of the day it is read.
- **Bind the description paragraph** via an extended fixture builder, with its own falsifier.
- Residual groups 1, 2, 3, 4 and 6 above.

## Standing discipline — binding on this sprint

- **Every shipped claim sentence is drafted AFTER the attack that would falsify it — including sentences β recommends and α approves.** This run shows the approval chain is not a truth check. A `falsification_attempts` entry per shipped claim, and an entry whose `attack_run` is a description rather than something that was run is not an entry.
- **β mints a FRESH rule before any result exists.** S4-1…S4-6 do NOT carry over automatically; the predecessor's numbering must never be mis-cited into this sprint.
- **A brief may not assert "X is missing" or "X is required" without an attached grep/read proof** (ED-363), and a builder is entitled to refuse a false premise with evidence — that is a correct return, not a failed bundle.
- **A finding from a read-scope-limited lane is reconciled against the full file before it is graded** (ED-362).
- **A text-matching enforcer cannot distinguish a violation from a description of one.** Prose about a banned primitive trips the ban. Two bundles hit this from opposite directions; document it in the scanner header.

## Definition of Done

- [ ] β mints a fresh, pre-committed release rule before any build result exists.
- [ ] Residual groups 1, 2, 3 closed with execution-proven falsifiers, controls first.
- [ ] Group 4's MEDIUMs dispositioned (fixed or disclosed in class form on the surface where the reader is).
- [ ] Group 6's items closed or explicitly re-carried with reasons.
- [ ] Every shipped claim sentence carries a `falsification_attempts` entry naming the attack that was RUN.
- [ ] ED-340 / ED-354 / ED-358 dispositions restated at close.
- [ ] No claim of completeness over a category the mechanism only samples (ED-358's class).

## Decisions

- **2026-08-29 — this sprint exists rather than a fix attempt 2 on S-VLADW1-04.** β's rule pre-committed ONE attempt with **no exception clause, deliberately**; α applied it verbatim. Reopening would be reshaping a pre-committed gate after seeing the result, barred in both directions (P-094).
- **2026-08-29 — `wt/S-VLADW1-01-engine` is NOT merged.** It stays at `6a105f2` as this sprint's starting surface, because its shipped copy contains sentences proven false by execution.
