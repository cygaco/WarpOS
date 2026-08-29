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

- **engine/CUSTODY.md** — the COMPLETE diff for this file (94 changed lines). The file is 383 lines total; **every unchanged line is NOT included.** THE SHIPPED CLAIM SURFACE. S4-1 is the decisive criterion and it is decided by reading these sentences. You get 100% of what the fix attempt CHANGED here, and none of what it did not.
- **engine/src/spawn-shim.js** — lines 228-252, 300-330 ONLY (56 of 553 lines, 10%). **The other 497 lines are NOT included.** THE REGION THAT PRODUCED A FALSE FINDING LAST TIME. the first range holds the Array.isArray gate at line 238 — the refuting code that sat outside the gauntlet-1 window; the second holds the prototype check downstream of it. You are being given the gate this time, deliberately.
- **engine/scripts/checks/custody-claim-lint.js** — lines 100-140, 185-215 ONLY (72 of 1499 lines, 5%). **The other 1427 lines are NOT included.** THE TRANSFORM, in code and in its own comment block. Bundle K rewrote CUSTODY.md's DESCRIPTION of this. Compare the description you read in the CUSTODY.md diff against this — if they disagree, that is an S4-1 finding and it is yours to file.

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

Commit `5b9b757`, branch `wt/S-VLADW1-01-engine`. The fix attempt is `b9b8df3..5b9b757`.

## THE PACKAGE, in one paragraph

A Node ESM package that holds an API credential and launches child processes. Its controls: an audited
spawn wrapper that refuses implicit env inheritance and secret-shaped values in command/args; a
capture-then-scrub of the environment at entry; static enforcers that scan source text for raw launch
shapes and for env objects; and a custody-claim lint that binds prose in `CUSTODY.md` to canonical copies so
a claim cannot drift from what was reviewed. **`CUSTODY.md` ships** — it is what `npm pack --dry-run`
resolves — so a false sentence in it is a shipped defect, not a documentation nit.

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

## What the fix attempt changed (`b9b8df3..5b9b757`)

    G  rendered-form canonical transform; emphasis/block-prefix candidates; comma separator deliberately
       NOT folded (measured false-RED cost); confusable fold is an ENUMERATION over a named alphabet set
    H  stale counts removed; "only shipped place/surface" removed as a CLASS and refused by the lint;
       the rollup residual restated in CLASS form
    I  `names` coerced to primitives once before the swept population is derived; the `Array.isArray`
       gate annotated LOAD-BEARING for the prototype check downstream
    J  `createRequire` banned outside the spawn wrapper, with a code-level structural exemption and
       DELIBERATELY no suppression marker; a standing EXPECTED-BYPASS witness committed
    K  the prose describing the transform rewritten to match the transform as built
    L  the raw-launch clause's heading scoped to matched shapes; its ceiling's named example re-pointed
       to a route that is open and execution-proven  <<<DROP THIS LINE IF L DID NOT RUN>>>

## Where to look hardest

1. **Every new sentence.** Each bundle authored prose. Read each claim under the least flattering
   interpretation a user could take, and ask what would have to be true of the code for it to hold.
2. **Over-refusal, not only under-refusal.** A transform that folds too much manufactures false REDs and
   pushes authors to route around the lint. That is a real failure mode with a green gate.
3. **The enumeration boundaries.** The confusable fold covers a named alphabet set; scripts outside it
   evade. This is DISCLOSED — so it is a re-confirmation, not a new finding, **unless** you can show the
   prose implies a coverage the code does not have.
4. **The gap between a heading and its body.** A section heading that states a universal while its body
   enumerates shapes is the exact defect class this attempt was fixing. Check whether any survive.
5. **Anything that reads as reassurance rather than as a bound.** "Effectively", "in practice",
   "generally" around a control claim.

## Output contract

Return ONE JSON object as your final message, nothing after it. Emit it even if you must stop early — a
lane that returns prose reads downstream as a dead lane and its work is not counted.

    {
      "lane": "security-reviewer",
      "verdict": "PASS" | "FAIL",
      "commit_reviewed": "5b9b757",
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

### engine/CUSTODY.md — UNIFIED DIFF b9b8df3..5b9b757 (complete for this file)

```diff
diff --git a/engine/CUSTODY.md b/engine/CUSTODY.md
index 5b122fb..aada3c0 100644
--- a/engine/CUSTODY.md
+++ b/engine/CUSTODY.md
@@ -23,27 +23,63 @@ Three limits of this file's own checker, named here rather than left to be disco
 
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
+because the family of equivalent phrasings is unbounded. A rollup claim must be reviewed, not linted: S4-1's
+reviewer read is the actual control, and the linter never was that control. The residual is stated as the CLASS
+it is, deliberately WITHOUT a list of the wordings that happen to slip past today. Naming the instances we
+happened to observe would itself be a false disclosure: it reads as an enumerable gap when the gap is unbounded,
+and it invites the one repair that makes matters worse. Widening the matcher to swallow each newly-noticed
+wording manufactures false coverage without narrowing the class, so the matcher is deliberately NOT widened.
+This states a division of labour; it is not an apology for a gap.
 
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
+a Cherokee and an Armenian spelling of the `Ceiling` keyword were each observed GREEN. Closing that class needs a
+vendored Unicode confusables data file and is out of scope here; named, not repaired. Markdown is canonicalized
+before a lead-in is tested for resemblance: nested list-item and blockquote prefixes and any indentation are
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
 
 <!-- OPERATOR-PENDING: a top-of-file, one-paragraph, user-facing summary of what this file means for someone
@@ -146,5 +182,5 @@ variable) used to start the process: a preload module injected through any of th
 launch command line or the environment `NODE_OPTIONS` reads from — a capability outside the shipped launch
 shape this package documents (`node src/server-entry.js` / `node driver/host-free-driver.js`, no preload
-flags) — named here so the entry reads as a calibrated ceiling, not an alarm. This residual is also named on one INTERNAL surface: `test/entry-bootstrap.test.js` states it in that file's own ceiling note, points back to this Ceiling by name, and then USES `--import` to launch a child — a live demonstration of the residual, not merely a mention of it. That file is not in this package's ship set (`package.json`'s `files` ships exactly one test, `test/credential-custody-decoy.test.js`), so among SHIPPED surfaces this document remains the only place the residual is named.
+flags) — named here so the entry reads as a calibrated ceiling, not an alarm. This residual is also named on one INTERNAL surface: `test/entry-bootstrap.test.js` states it in that file's own ceiling note, refers back to this Ceiling by DESCRIPTION rather than by its lead-in text (a grep for this Ceiling's lead-in text in that file returns zero hits), and then USES `--import` to launch a child — a live demonstration of the residual, not merely a mention of it. That file is not in this package's ship set (`package.json`'s `files` ships exactly one test, `test/credential-custody-decoy.test.js`). Among SHIPPED surfaces this residual is named both here and in `scripts/checks/custody-claim-lint.js`, which holds this paragraph verbatim as its canonical copy — an exhaustiveness claim about disclosure surfaces is not available to a bound paragraph at all, because binding is what creates the second shipped copy.
 
 **Ceiling — `opts.cwd` and `opts.stdio` are not scanned by `auditedSpawn` itself.** The runtime checks above refuse
@@ -189,5 +225,5 @@ present in `test/custody-runtime.test.js` and its `verified_by` pointer RESOLVES
 narrowly, because it is ONE control on ONE path: it does not wire THIS fixture into your install — nothing does
 — and `check:pointers` as a whole remains RED by design, with other pointers deliberately left unresolved. The
-class-form Ceiling immediately below still holds for every control except that one.
+class-form Ceiling immediately below is NOT lifted for that one control: what this self-check verifies is an OUTCOME, not the presence or the passing of any control — stated in full there.
 
 **Ceiling — this package does not verify that its controls are invoked in YOUR install.** Every enforcer named
@@ -195,8 +231,16 @@ above runs only when someone runs it — `npm run check:custody`, `npm run check
 `node --test` suite, against a tree they already have. AC-8.6 is the single criterion aimed at closing that gap,
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
 
 ### P4 — No outbound request originating in the shipped tree carries the held secret, other than the SDK's own authenticated call to Anthropic's endpoint
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

### engine/src/spawn-shim.js — LINES 300-330 (verbatim)

```js
300|   //
301|   // WHERE THIS SENTENCE LEANS ON THE B1 GATE ABOVE (bundle I Task 2). The
302|   // narrowing claim is true of the FUNCTION, not of this block read alone,
303|   // and the difference is not academic: a cross-family review lane read this
304|   // block in isolation and reported the sentence FALSE, on the grounds that
305|   // `Object.create(Array.prototype)` passes the prototype check below (it
306|   // does — its prototype IS exactly Array.prototype) while the previous
307|   // `Array.isArray()` check would have refused it. The premise is that D1
308|   // REPLACED that check. It did not: `Array.isArray()` is still the FIRST
309|   // thing this function does (the B1 gate at the top), and D1 was added
310|   // BELOW it. An `Object.create(Array.prototype)` is refused there and never
311|   // reaches this block at all — RF-I2 observes that its own `length` getter
312|   // is never invoked.
313|   //
314|   // SO: THE B1 `Array.isArray()` GATE IS LOAD-BEARING FOR D1 AND MUST NOT BE
315|   // REMOVED as redundant. D1's prototype check does NOT subsume it —
316|   // arrayness is an internal slot, not a prototype relationship, so a
317|   // non-array can hold Array.prototype as its prototype and satisfy D1.
318|   // Delete B1 and that shape becomes a REAL widening, which is the exact
319|   // defect the review lane described one gate too late. RF-I2 is red against
320|   // that removal.
321|   const normCommand = String(command);
322| 
323|   // D1(1) — Proxy FIRST: refused before any other inspection, because every
324|   // inspection below (`Object.getPrototypeOf` included) is itself trappable.
325|   if (nodeTypes.isProxy(args)) {
326|     throw new Error(
327|       "spawn-shim: `args` must be a plain array — the given container is a Proxy. A Proxy's traps can " +
328|         "answer this wrapper's own checks with one set of values and Node's spawn() with another, so no " +
329|         "inspection of it is trustworthy. Pass a plain array.",
330|     );
```


### engine/scripts/checks/custody-claim-lint.js — LINES 100-140 (verbatim)

```js
100| //
101| // BUNDLE G, WHY IT WIDENED. The bundle-A transform folded dash class,
102| // whitespace and case — three dimensions of ASCII spelling — and performed
103| // NO Unicode normalization and NO confusable fold. Execution against a
104| // green gate showed the transform was defeated one alphabet over: exact
105| // `PROVEN` went RED, while `PRO<U+200B>VEN` (zero-width space) and
106| // `PR<U+041E>VEN` (CYRILLIC CAPITAL O) both shipped GREEN, exit 0. The root
107| // cause is one line of the old implementation: JavaScript's `\s` does not
108| // match U+200B, so a zero-width space survived the whitespace fold intact
109| // and split the token. Homoglyphs were never addressed at all. Five more
110| // folds are therefore named below.
111| //
112| // It folds these dimensions, and names each:
113| //
114| //   (1) COMPATIBILITY NORMALIZATION — NFKD. Chosen over NFKC deliberately.
115| //       Where a decision turns on VISUAL equivalence, decomposition is the
116| //       stronger primitive: NFKD splits a precomposed character into base
117| //       plus combining marks, which lets fold (3) below delete the marks so
118| //       a claim spelled with an acute accent renders to its unaccented
119| //       skeleton. NFKC would immediately RECOMPOSE those marks and put the
120| //       accent back, leaving the evasion open. Both forms are compatibility
121| //       (K) mappings, so both already fold the full-width forms, the
122| //       mathematical alphanumerics and the letterlike symbols; only the
123| //       decomposing form additionally EXPOSES the marks for removal. That
124| //       is the whole reason for the D.
125| //   (2) DEFAULT-IGNORABLE CODE POINTS — deleted, by Unicode PROPERTY
126| //       (\p{Default_Ignorable_Code_Point}), not by hand-list. This covers
127| //       the zero-width space U+200B and zero-width non-joiner U+200C that
128| //       were execution-proven to evade, and with them the zero-width
129| //       joiner, the word joiner U+2060, the bidi marks LRM U+200E / RLM
130| //       U+200F and the embedding controls, the variation selectors, the
131| //       Hangul fillers and the BOM U+FEFF. SOFT HYPHEN U+00AD is also
132| //       default-ignorable and folds here. An invisible character nobody
133| //       here has seen is deleted because the Unicode property says it is
134| //       invisible, not because someone remembered to list it.
135| //   (3) COMBINING MARKS — every \p{Mn} deleted. Only meaningful because
136| //       fold (1) decomposes; see the NFKD rationale above.
137| //   (4) CONFUSABLE FOLD over the TOKEN ALPHABET — the Cyrillic and Greek
138| //       homoglyphs of the Latin letters this file's tokens are spelled
139| //       from (PROVEN, ASSERTED, Ceiling, NOT VERIFIED) map to their Latin
140| //       skeleton. This is the one fold that is NECESSARILY an enumeration
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
