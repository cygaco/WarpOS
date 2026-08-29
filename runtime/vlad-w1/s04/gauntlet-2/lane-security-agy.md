# S-VLADW1-04 — GAUNTLET 2 — CROSS-FAMILY SECURITY LANE — **THE QUALIFYING RUN**

You are the `security-reviewer` lane, and you are the only reviewer in this gauntlet outside the Claude
family. In four consecutive gauntlets this lane has found real defects that every same-family lane missed,
including on ground a Claude lane had already cleared. That is why you are here: **look where the others
structurally cannot.**

## READ THIS FIRST — you are being fed EXCERPTS, and last time that cost a false finding

You have **no tools**. You cannot open files, run commands, or check a line you were not given. Everything
you can see is inline below.

In the diagnostic run, this lane filed a HIGH that was **correct reasoning over an incomplete window**: it
judged a prototype check in `src/spawn-shim.js` from lines 280-340, and the gate that refuted it —
`Array.isArray(args)` — sits at **line 238**, outside the window the conductor chose. This lane honestly
listed "the rest of the file" as unseen; the conductor failed to connect that to the finding. **The
conductor's process is now fixed** (that reconciliation is mandatory before any finding is graded), and
**your side of the fix is this manifest:**

### LINE-RANGE MANIFEST — exactly what you were given, and therefore what you were not

- **engine/CUSTODY.md** — the COMPLETE diff for this file (132 changed lines). The file is 405 lines total; **every unchanged line is NOT included.** THE SHIPPED CLAIM SURFACE. S4-1 is the decisive criterion and it is decided by reading these sentences. You get 100% of what the fix attempt CHANGED here, and none of what it did not.
- **engine/src/spawn-shim.js** — lines 228-252 ONLY (25 of 553 lines, 5%). **The other 528 lines are NOT included.** THE GATE THAT REFUTED A FALSE FINDING LAST TIME — the Array.isArray gate at line 238, with the annotation above it marking it LOAD-BEARING for the prototype check downstream. It sat outside the gauntlet-1 window and a lane reasoned correctly to a wrong conclusion without it; you are being given it deliberately. NOTE WHAT YOU DO NOT HAVE: the prototype check itself (~lines 300-330) was cut for the argv ceiling, so any claim about what that check accepts or rejects is a files_i_could_not_see entry, not a finding.
- **engine/scripts/checks/custody-claim-lint.js** — lines 185-215 ONLY (31 of 1515 lines, 2%). **The other 1484 lines are NOT included.** THE TRANSFORM's fold constants and the confusable ceiling comment. Bundle K rewrote CUSTODY.md's DESCRIPTION of this and L1 calibrated it. Compare the description you read in the CUSTODY.md diff against this code — if they disagree, that is an S4-1 finding and it is yours to file. NOTE what you do NOT have: the transform's main comment block (~lines 95-145) and the function body itself were cut for the argv ceiling, so a claim about a fold you cannot see here is a files_i_could_not_see entry.

**Nothing else was included.** No other file of this package is in this payload at all — not `src/env-scrub.js`, not `driver/host-free-driver.js`, not `scripts/checks/spawn-env-allowlist.js`, not `package.json`, and no test file. If a judgement needs one of them, that is a `files_i_could_not_see` entry, and it will be reconciled rather than discarded.

**Use it.** If a judgement depends on code outside these ranges, say so in `files_i_could_not_see` naming
the file AND the region you would have needed. That is not a weak answer — it is the answer that gets
reconciled instead of discarded. **A finding you file without the code that could refute it is worth less
than a precise statement of what you would need to see.**

Where a finding is nonetheless worth filing on reasoning alone, file it with `execution_proven: false` and
say plainly what would confirm or refute it. You cannot execute anything, so **no finding of yours can be
execution-proven** — that is expected and is not a defect in your report. State your reasoning so the
conductor can run it.

## THE RUN

This is the **QUALIFYING** gauntlet. Under β's pre-committed rule there was **ONE fix attempt** and it is
spent: gauntlet-1 (diagnostic) → fix attempt 1 → **this run**. At its close α applies the release rule
verbatim, and any one criterion failing means **NO RELEASE, no attempt 2**. Two consequences: do not soften
a real finding, and do not inflate a weak one — β ruled both directions equally forbidden. **Lane verdicts
do not decide; criteria do.**

Commit `6a105f2`, branch `wt/S-VLADW1-01-engine`. The fix attempt is `b9b8df3..6a105f2`.

## THE PACKAGE

A Node ESM package holding an API credential and launching child processes. Controls: an audited spawn
wrapper refusing implicit env inheritance and secret-shaped command/args; a capture-then-scrub of the
environment at entry; static enforcers scanning source text for raw-launch and env-object shapes; and a
custody-claim lint binding `CUSTODY.md` prose to canonical copies so a claim cannot drift from what was
reviewed. **`CUSTODY.md` ships** — it is what `npm pack --dry-run` resolves — so a false sentence in it is
a shipped defect, not a documentation nit.

## THE CRITERIA you are assessing against

- **S4-1 — TRUTH.** Every custody claim string on a shipped surface is TRUE of the code. **This criterion
  may NEVER be satisfied by mechanism evidence** — a green lint or a green gate is not evidence a sentence
  is true. This is where this sprint family keeps failing: in the diagnostic run **all six HIGHs were false
  SENTENCES, not broken mechanisms.**
- **S4-2 — MECHANISM**, separate from S4-1 on purpose: the near-miss rules fire; the refusal refuses; and
  the status-token near-misses are closed by a **canonical transform judged as a PROPERTY** — matching on
  the rendered form (normalization, strip of default-ignorable code points, confusable fold over the token
  alphabet, emphasis canonicalization). **An enumeration of observed variants does not satisfy it.**
- **S4-3 — ATOMICITY.** No shipped claim string diverges from its canonical copy.
- **S4-4 — FALSIFIERS OBSERVED.** Each falsifier observed RED under its own mutation, with a no-op⇒FAIL
  guard. **pass-total ≠ observation-count.**
- **S4-5 — a self-check invoked from the product entry path**, failing at RUNTIME when removed; plus an
  either-or on the driver entry's scrub (runtime-observable consequence **OR** the header says plainly it is
  text/AST-level only — **silence satisfies neither**).
- **S4-6 — RESIDUALS TRAVEL.** A residual bounding a SHIPPED claim must be on the SHIPPED surface, in
  strong actionable form, stated as a CLASS where the class is what is open.

## What the fix attempt changed (`b9b8df3..6a105f2`)

Seven bundles: the canonical transform widened to match on the RENDERED form (comma separator
deliberately NOT folded, on a measured false-RED cost; the confusable fold an ENUMERATION over a named
alphabet set); false and count-bearing sentences corrected and an exhaustiveness class refused by the lint;
a swept population coerced to primitives once; a launch primitive banned outside its wrapper with a
code-level structural exemption, DELIBERATELY no suppression marker, and a standing EXPECTED-BYPASS witness
committed; the transform's shipped description rewritten to match it as built; internal process vocabulary
scrubbed from shipped surfaces; a clause heading scoped to what its enforcer actually matches, and that
clause's ceiling re-pointed to a route that is open and EXECUTION-PROVEN.

**You have the complete diff of the shipped claim surface below. Read it rather than this summary** — the
summary is what the fix attempt believes it did.

## Where to look hardest

1. **Every new sentence**, under the least flattering interpretation a user could take: what would have to
   be true of the code for it to hold?
2. **Over-refusal, not only under-refusal.** A transform folding too much manufactures false REDs and pushes
   authors around the lint — a real failure mode with a green gate.
3. **Enumeration boundaries.** The confusable fold covers a named alphabet set; scripts outside evade. That
   is DISCLOSED, so it is a re-confirmation **unless** the prose implies a coverage the code lacks.
4. **The gap between a heading and its body** — a heading stating a universal over a body that enumerates
   shapes is the exact class this attempt was fixing. Check whether any survive.
5. **Reassurance wearing the clothes of a bound** — "effectively", "in practice", "generally".

## Output contract

Return ONE JSON object as your final message, nothing after it. Emit it even if you must stop early — a
lane that returns prose reads downstream as a dead lane and its work is not counted.

    {
      "lane": "security-reviewer",
      "verdict": "PASS" | "FAIL",
      "commit_reviewed": "6a105f2",
      "s_criteria": { "S4-1": "holds|FAILS|cannot-assess", "S4-2": "...", "S4-3": "...",
                      "S4-4": "...", "S4-5": "...", "S4-6": "..." },
      "criteria_reasoning": { "S4-1": "<why, citing what you read>", "...": "..." },
      "findings": [ { "id": "F-1", "severity": "HIGH|MEDIUM|LOW", "criterion": "S4-n|none",
                      "file": "path:line", "claim": "<one sentence>",
                      "execution_proven": false,
                      "what_would_confirm_or_refute": "<the exact check the conductor should run>",
                      "new_or_reconfirmation": "new|re-confirmation" } ],
      "files_i_could_not_see": ["<file + the REGION you would have needed, per the manifest>"],
      "what_i_could_not_assess": ["<be specific; silence reads as a pass and it is not one>"]
    }

`cannot-assess` where you could not look is CORRECT. A lane claiming to have assessed everything from
excerpts is less trustworthy, not more.


---

# THE CODE YOU WERE GIVEN

### engine/CUSTODY.md — UNIFIED DIFF b9b8df3..6a105f2 (complete for this file)

```diff
diff --git a/engine/CUSTODY.md b/engine/CUSTODY.md
index 5b122fb..cc00e7f 100644
--- a/engine/CUSTODY.md
+++ b/engine/CUSTODY.md
@@ -13,7 +13,8 @@ everywhere else: every Proven claim carries its clause id, and nothing conflates
 bound byte-for-byte, said plainly rather than generalised: prose that is neither an Asserted nor a Ceiling
-paragraph — this preamble, the P1–P4 status/enforcer/proof-scope lines, the P1–P4 BODY PROSE (the substantive
-sentences under each clause heading stating what that enforcer actually scans — a lane proved three flat
-falsehoods there ship green, so this omission is named, not implied), A1's `Live measurement` follow-on
-paragraph, and the commentary paragraphs around A5 — which the structural and forbidden-phrase rules check, but no
-stored copy pins. A5 is the hybrid: its own paragraph is pinned here byte-for-byte, and the three sentences of the
+paragraph — this preamble, the three numbered limits-of-this-checker paragraphs below (including (3)'s
+description of `canonicalizeClaimText` itself), the P1–P4 status/enforcer/proof-scope lines, the
+P1–P4 BODY PROSE (the substantive sentences under each clause heading stating what that enforcer actually
+scans — a lane proved three flat falsehoods there ship green, so this omission is named, not implied), A1's
+`Live measurement` follow-on paragraph, and the commentary paragraphs around A5 — which the structural and
+forbidden-phrase rules check, but no stored copy pins. A5 is the hybrid: its own paragraph is pinned here byte-for-byte, and the three sentences of the
 carrier note it quotes are pinned byte-for-byte to `src/model-seam.js`'s exported `SANCTIONED_CARRIER_NOTE`, while
@@ -24,25 +25,73 @@ Three limits of this file's own checker, named here rather than left to be disco
 (1) THE RESEMBLANCE CEILING. A lead-in that fails the canonical Asserted or Ceiling shape is no longer skipped:
-the lint refuses it by name when it RESEMBLES one — bolded, opening with an `A<n>`, `Asserted` or `Ceiling`
-keyword, followed by any Unicode dash, a colon, or whitespace. Before this, five near-miss authorings of a new
-unbound claim paragraph (en-dash, hyphen, minus sign, colon, and a two-space indent) all shipped green while this
-header promised every bolded `Ceiling` lead-in was bound. But "resembles" is ITSELF a predicate, and a paragraph
-resembling nothing that predicate knows — an unbolded lead-in, or one opening with some other keyword — remains
-invisible to it. This narrows the class of silently-unbound paragraphs; it does not eliminate it, and this file
-does not claim it does.
+the lint refuses it by name when it RESEMBLES one. What "resembles" means was MEASURED BY THE BATTERY in
+`test/custody-claim-lint.test.js` and then written here — not the reverse. After any nesting of markdown
+list-item or blockquote prefixes and any indentation is stripped, a line is a candidate when it opens with an
+emphasis run of `*` or `_` characters — opened before the keyword OR closed around it — then an `A<n>`,
+`Asserted` or `Ceiling` keyword, then any Unicode dash, a colon, or whitespace. Keyword and separator both
+render through `canonicalizeClaimText` first, so a zero-width space or a Cyrillic homoglyph sitting inside the
+keyword no longer hides it. A candidate is bound or REFUSED by name; it is never silently skipped.
+
+The previous version of this sentence was FALSE OF THE CODE, and is corrected rather than quietly dropped. It
+said the refusal caught a lead-in that was bolded and opened with the keyword, naming two escapes. Three shapes
+that were bolded AND opened with the keyword shipped green anyway — emphasis closed around the keyword, and the
+list-item and blockquote prefixes — because indentation had been considered and markdown block prefixes had not.
+Each of the three is a candidate now, pinned by its own row in the battery.
+
+But "resembles" is ITSELF a predicate, and two escapes REMAIN, named here rather than left to be discovered
+later: a lead-in carrying NO markdown emphasis at all is still invisible to it, and the homoglyph fold is an
+enumeration over Cyrillic and Greek only, so a keyword spelled with a Cherokee or Armenian lookalike still
+passes. Both escapes are held by a residual test that FAILS if either is ever closed, so this disclosure cannot
+go stale without something going red. This narrows the class of silently-unbound paragraphs; it does not
+eliminate it, and this file does not claim it does.
 
 (2) THE ROLLUP CLASS. The rollup rule matches a named lexical family: digit-form counts, and the word `all`. It
-does not detect semantically equivalent rollups in other wordings — a spelled-out numeral, or the word `every`,
-passes it — and no enumeration of wordings will close this, because the family of equivalent phrasings is
-unbounded (`each`, `the entire set`, `100% of`, and onward). A rollup claim must be reviewed, not linted. Naming
-only the two wordings we happened to observe would itself be a false disclosure, so the residual is stated as the
-class it is. This is safe to disclose rather than alarming, and the reason matters: the actual control for a
-rollup claim's truth is the reviewer read, and the linter never was that control. This states a division of
-labour; it is not an apology for a gap.
+does not detect semantically equivalent rollups in ANY other wording, and no enumeration of wordings will close this,
+because the family of equivalent phrasings is unbounded. A rollup claim must be reviewed, not linted: human
+review is the actual control, and the linter never was that control. The residual is stated as the CLASS
+it is, deliberately WITHOUT a list of the wordings that happen to slip past today. Naming the instances we
+happened to observe would itself be a false disclosure: it reads as an enumerable gap when the gap is unbounded,
+and it invites the one repair that makes matters worse. Widening the matcher to swallow each newly-noticed
+wording manufactures false coverage without narrowing the class, so the matcher is deliberately NOT widened.
+This states a division of labour; it is not an apology for a gap. The sibling exhaustiveness rule
+(`custody-claim-lint/only-surface-assertion`) sits under that same division of labour and is disclosed here
+rather than in a numbered item of its own: it matches exhaustiveness PHRASES inside bound paragraphs, it has no
+count branch, and it therefore does not detect count-form exhaustiveness claims — the same assertion carried by
+a number or a quantifier instead of by the phrase. A count standing inside a bound paragraph is not checked.
+That family is unbounded for the same reason the rollup family is, so widening the matcher to swallow count
+wordings is refused on the same grounds, and human review is the control there too.
 
 (3) NON-BREAKING SPACE. Every token comparison in the lint renders BOTH sides through one named canonical
-transform, `canonicalizeClaimText`, which folds the Unicode dash class to a single hyphen, collapses whitespace
-runs, and folds case — except for the one-word Proven status token, where case is the only thing separating the
-status token from the ordinary English word, and folding it would flag this file's own correct hedging. That
-transform's whitespace fold also tolerates a non-breaking space, which is not line-wrap whitespace. Named, not
-repaired: narrowing it would invite false REDs.
+transform, `canonicalizeClaimText`. It applies, in order: NFKD compatibility normalization; deletion of every
+default-ignorable code point; deletion of the combining marks NFKD has just exposed; a confusable fold from
+Cyrillic and Greek homoglyphs to their Latin skeleton; the Unicode dash class `\p{Pd}` plus the mathematical
+minus sign folded to a single hyphen; whitespace runs collapsed to one space; and case — except for the one-word
+Proven status token, where case is the only thing separating the status token from the ordinary English word, and
+folding it would flag this file's own correct hedging. NFKD is used rather than NFKC deliberately: decomposition
+splits a precomposed character into a base plus its combining marks so those marks can then be deleted, where
+NFKC would recompose them and put the accent back. Default-ignorable code points are removed BY PROPERTY
+(`\p{Default_Ignorable_Code_Point}`), not by a hand-list, which is what reaches the zero-width space, the
+zero-width non-joiner and joiner, the word joiner, the LRM and RLM bidi marks, the soft hyphen, the variation
+selectors and the BOM without anyone having had to remember them. THE CONFUSABLE FOLD IS THE ONE THAT IS NOT A
+PROPERTY, and that difference is real rather than cosmetic: the dash fold closes a Unicode category by
+definition, while the confusable fold is an ENUMERATION over Cyrillic and Greek, because Unicode exposes no
+confusable property to lean on. Armenian, Cherokee, Coptic, Deseret and Lisu lookalikes therefore still evade it;
+a Cherokee and an Armenian spelling of the `Ceiling` keyword were each observed GREEN. The two scripts the fold
+DOES cover are the two a homoglyph reaches BY MISTAKE — a paste from mixed-script text, an editor substitution, an
+identifier copied out of a document that was never all-Latin — whereas a keyword spelled in Armenian, Cherokee,
+Coptic, Deseret or Lisu is essentially only reachable by someone doing it ON PURPOSE. Read the split that way:
+the fold is calibrated against accident, and what remains is a class reachable by a deliberate hand — which is a
+statement about who reaches it, NOT a claim that the remainder is closed, and not a claim that the list of
+evading scripts above is complete. Closing that class needs a vendored Unicode confusables data file and is out
+of scope here; named, not repaired. Markdown is canonicalized before a lead-in is tested for resemblance:
+nested list-item and blockquote prefixes and any indentation are
+stripped, and an emphasis run opened before the keyword or closed around it is folded away. The token comparison
+that consumes the transform also tolerates separator variance between the words of a multi-word status token —
+any run of dash, colon, tilde, pipe, slash or whitespace, including an EMPTY run — with comma, semicolon and
+period deliberately excluded, because including the comma was MEASURED to refuse ordinary prose ("the item is
+asserted, not verified"), the comma being what makes that a grammatical English contrastive clause. The accepted
+cost of allowing an empty run is a false RED: the bare three-word adjacency of the Asserted token's own words,
+carrying no punctuation between them at all, is now refused in ordinary running prose. This paragraph cannot
+quote that adjacency literally without itself going RED — the cost is demonstrating itself here rather than
+being asserted about somewhere else. That transform's whitespace fold also tolerates a non-breaking space, which
+is not line-wrap whitespace. Named, not repaired: narrowing it would invite false REDs.
 
@@ -69,3 +118,3 @@ unrecognized seam value fails closed rather than silently narrowing the scan.
 
-### P2 — Every `auditedSpawn` call site passes an explicit env object naming no denylisted variable, and a raw bypass of the audited wrapper is refused
+### P2 — Every `auditedSpawn` call site passes an explicit env object naming no denylisted variable, and the raw-launch and import call-site SHAPES this enforcer matches in source text are refused
 
@@ -103,4 +152,13 @@ ceiling further each time. But widening a matcher family narrows a ceiling; it d
 call-site-shape class the family describes — a launch reached through a route this pattern family does not name
-(for one example, an aliased reference to an already-imported launch function) is outside what a text matcher
-can see, by construction. `src/env-scrub.js`'s capture-then-scrub mechanism (ADR-0041 Amendment 4) is what
+(for one example, `process.binding("spawn_sync")` driven through a computed member key, which is not a
+conceivable route but an EXECUTION-PROVEN one: the standing witness committed at `ff6d483`,
+`test/fixtures/J-expected-bypass/reflective-launcher.js`, is scanned clean by this enforcer and still launches a
+real child that echoes back the placeholder env pair it was handed) is outside what a text matcher
+can see, by construction. So a green result from this enforcer means the call-site shapes it names are absent
+from the text it scanned; it does not mean no raw launch is present there, and it must not be read as though it
+did. The example above is re-pointed rather than kept: the aliased-requirer route this paragraph named when it
+was authored has since been closed by bundle J's ban on the requirer-constructing primitive, and a closed route
+cannot witness a ceiling.
+Routes reached through `eval`, `Function()`, WASM, or a native addon remain open by construction and are not
+enumerated here. `src/env-scrub.js`'s capture-then-scrub mechanism (ADR-0041 Amendment 4) is what
 covers that residual class AT RUNTIME, independent of whether any given call site was caught statically. Stated
@@ -147,3 +205,3 @@ launch command line or the environment `NODE_OPTIONS` reads from — a capabilit
 shape this package documents (`node src/server-entry.js` / `node driver/host-free-driver.js`, no preload
-flags) — named here so the entry reads as a calibrated ceiling, not an alarm. This residual is also named on one INTERNAL surface: `test/entry-bootstrap.test.js` states it in that file's own ceiling note, points back to this Ceiling by name, and then USES `--import` to launch a child — a live demonstration of the residual, not merely a mention of it. That file is not in this package's ship set (`package.json`'s `files` ships exactly one test, `test/credential-custody-decoy.test.js`), so among SHIPPED surfaces this document remains the only place the residual is named.
+flags) — named here so the entry reads as a calibrated ceiling, not an alarm. This residual is also named on an INTERNAL surface: `test/entry-bootstrap.test.js` states it in that file's own ceiling note, refers back to this Ceiling by DESCRIPTION rather than by its lead-in text (a grep for this Ceiling's lead-in text in that file returns zero hits), and then USES `--import` to launch a child — a live demonstration of the residual, not merely a mention of it. That file is not in this package's ship set (`package.json`'s `files` ships exactly one test, `test/credential-custody-decoy.test.js`). Among SHIPPED surfaces this residual is named both here and in `scripts/checks/custody-claim-lint.js`, which holds this paragraph verbatim as its canonical copy — an exhaustiveness claim about disclosure surfaces is not available to a bound paragraph at all, because binding is what creates the second shipped copy.
 
@@ -190,3 +248,3 @@ narrowly, because it is ONE control on ONE path: it does not wire THIS fixture i
 — and `check:pointers` as a whole remains RED by design, with other pointers deliberately left unresolved. The
-class-form Ceiling immediately below still holds for every control except that one.
+class-form Ceiling immediately below is NOT lifted for that one control: what this self-check verifies is an OUTCOME, not the presence or the passing of any control — stated in full there.
 
@@ -196,6 +254,14 @@ above runs only when someone runs it — `npm run check:custody`, `npm run check
 and it is scoped to ONE control at start-up rather than to the set; as of S-VLADW1-04 (2026-08-28) it HAS landed
-for that one control on that one path, as the Ceiling immediately above records. That single exception aside,
-the controls above are proven by our own test run, on our tree, at the moment we ran it. That is a real result,
-and it is not a statement about your machine: apart from the start-up self-check named above, nothing in `src/`
-or `driver/` checks, at run time in your install, that any of these controls is still present or still passing.
+for that one control on that one path, as the Ceiling immediately above records. That landing does NOT make
+that control an exception to this Ceiling, for the reason given at the end of this paragraph. The controls
+above are proven by our own test run, on our tree, at the moment we ran it. That is a real result, and it is
+not a statement about your machine: nothing in `src/` or `driver/` checks, at run time in your install, that
+any of these controls is still present or still passing — INCLUDING the start-up self-check, which verifies
+NEITHER. What that check reads is an OUTCOME: whether any credential-shaped name is still readable as an own
+property of this process's env at start-up. Executed against an environment holding no credential it returns
+`ok:true`, so its green is equally consistent with a correct scrub, with a scrub that is ABSENT, and with a
+machine that never held a credential at all. It is a start-up observation, not a verification that any control
+is present or passing. That reading is stated at `runCustodySelfCheck`'s own definition in
+`src/server-entry.js`; it is repeated here because a residual that lives only in a code comment is not
+disclosed to the person this document is written for.
 
```


### engine/src/spawn-shim.js — LINES 228-252 (verbatim)

```js
228|   // way to proceed once `args` is not the array this wrapper's contract
229|   // requires.
230|   // LOAD-BEARING FOR D1 (bundle I Task 2) — do not remove this as redundant
231|   // with D1's `Object.getPrototypeOf(args) !== Array.prototype` check below.
232|   // The two are NOT interchangeable and neither subsumes the other:
233|   //   * arrayness is an internal slot, so `Object.create(Array.prototype)`
234|   //     FAILS here but PASSES D1's prototype check;
235|   //   * an Array subclass PASSES here but FAILS D1's prototype check.
236|   // D1's "adds no new acceptance" sentence is true of this function only
237|   // while BOTH gates stand. Enforcer: RF-I2 in test/spawn-shim.test.js.
238|   if (!Array.isArray(args)) {
239|     throw new Error(
240|       "spawn-shim: `args` must be an array — a non-array `args` causes Node's own spawn() to " +
241|         "discard the third `options` argument entirely (env allowlist included), silently " +
242|         "inheriting process.env wholesale.",
243|     );
244|   }
245| 
246|   if (!opts || typeof opts.env !== "object" || opts.env === null) {
247|     throw new Error(
248|       "spawn-shim: an explicit `env` allowlist object is required — ambient process.env is " +
249|         "never inherited by default.",
250|     );
251|   }
252| 
```


### engine/scripts/checks/custody-claim-lint.js — LINES 185-215 (verbatim)

```js
185| /**
186|  * Invisible / zero-width code points, taken from the Unicode
187|  * Default_Ignorable_Code_Point property. Deleted outright by fold (2).
188|  * U+200B and U+200C are both members and were both execution-proven to
189|  * defeat the pre-bundle-G transform.
190|  */
191| export const IGNORABLE_PATTERN = /\p{Default_Ignorable_Code_Point}/gu;
192| 
193| /** Non-spacing combining marks, deleted by fold (3) after NFKD exposes them. */
194| export const COMBINING_MARK_PATTERN = /\p{Mn}/gu;
195| 
196| /**
197|  * FOLD (4) — the confusable map, over the TOKEN ALPHABET ONLY.
198|  *
199|  * Covers the Cyrillic and Greek homoglyphs of the Latin letters used by
200|  * this file's status tokens and resemblance keywords. Keys are the
201|  * confusable; values are the Latin skeleton.
202|  *
203|  * THIS ONE IS AN ENUMERATION, AND THAT IS ITS CEILING. Folds (2), (3), (5)
204|  * and (6) are Unicode PROPERTIES — they close a class by definition. There
205|  * is no `\p{Confusable}` property to lean on, so this fold closes exactly
206|  * the two scripts listed and no others. Armenian, Cherokee, Coptic,
207|  * Deseret and Lisu also contribute Latin homoglyphs and are NOT folded
208|  * here; a token spelled with one of those still evades. Named, not
209|  * repaired — the same discipline the NBSP tolerance is disclosed under.
210|  * Note that the mathematical-alphanumeric and full-width lookalikes are
211|  * NOT in this map because fold (1) already folds them by property.
212|  */
213| export const CONFUSABLE_FOLD = new Map(
214|   Object.entries({
215|     // Cyrillic -> Latin
```
