# Q2 (in-process) — extracted finding set

**Lane:** α's spawn `q2-adversarial-inprocess`, general-purpose/opus, 02:17:14Z → 02:28:40Z; recorded
`d-mtf6zdid-a5ed5f0c`, ok:true, evidence_sha `c0ba35f5…`. Raw output `out-Q2-inprocess.md`, 25604 B.
**Token, read from the lane's own raw file, line 1:** `{"verdict":"fail"}`

**Record fields `role`/`model` are registry-derived, not observed** (ED-393) — as with every in-process
record this round.

**31 lint invocations. Every finding carries a control that FIRES and an attack that does NOT.**
Control-first discipline applied unprompted to an adversarial task, where the brief asked only for
attacks.

**EXTRACTION, not a grading.** Criterion mapping is β's at the close under NO STACKING.

---

## Emitted finding ids

`F-Q2I-1` · `F-Q2I-2` · `F-Q2I-3`

---

## F-Q2I-1 — The `## Asserted` section is scanned by NO forbidden-claim rule

**The document's claim, quoted by the lane exactly, `CUSTODY.md` L34-36:**
> *"A1's `Live measurement` follow-on paragraph, and the commentary paragraphs around A5 — **which the
> structural and forbidden-phrase rules check**, but no stored copy pins."*

**Mechanism, lane's words:** `findForbiddenClaimHits` (L1548) has exactly three call sites —
> *"L1597 — inside `findOutOfSectionClaimViolations`, which builds a `covered[]` array over the Proven
> span AND the Asserted span (L1577-1579) and `continue`s on every covered line (L1583). The Asserted
> section is skipped **by construction**. · L1625 — inside `findProvenProseClaimViolations`, whose loop
> runs `proven.startIdx+1 .. proven.endIdx` only. · L1673 — inside `findShippedCopyClaimViolations`,
> reached solely from `findPackageJsonClaimViolations` (L1702), i.e. `package.json`, never
> `CUSTODY.md`. No fourth consumer exists."*

**Attack set — one sentence per `FORBIDDEN_CLAIM_PATTERNS` id, verbatim:**
```
fully-proven-or-verified     "Credential custody in this engine is fully proven."
independently-verified       "These controls have been independently verified."
cannot-leak                  "A held credential cannot leak from this package."
guaranteed                   "Custody of your credential is guaranteed by this engine."
absolute-negation-of-access  "No dependency in this tree can read your api key."
```
Positions: **P** = file preamble · **S** = `## Asserted` section preamble · **X** = A5 commentary.

**Results as printed, 15 runs:**

| position | fully-proven | independently-verified | cannot-leak | guaranteed | absolute-negation |
|---|---|---|---|---|---|
| P — preamble (control) | exit 1 | exit 1 | exit 1 | exit 1 | exit 1 |
| S — Asserted preamble | **exit 0** | **exit 0** | **exit 0** | **exit 0** | **exit 0** |
| X — A5 commentary | **exit 0** | **exit 0** | **exit 0** | **exit 0** | **exit 0** |

> *"Every P run reported exactly one violation, rule
> `custody-claim-lint/out-of-section-forbidden-claim`. Every S and X run reported 0 violations. A sixth
> control (`A2`, the same 'guaranteed' sentence inside the Proven section) exits 1 with
> `custody-claim-lint/proven-prose-forbidden-claim` — so the family fires in both scanned regions and
> in neither Asserted position. 5/5 controls matched; 10/10 attacks not matched."*

**Why the inserted sentences are false, lane's words:** A1 (bound, verbatim from ADR-0041) states
*"Any package in the tree can read `process.env` and reach the network. No in-repo enforcer can bound
this"*.

**The lane bounded its own finding, verbatim:**
> *"The one way F-1 could be softened, and I could not close it: three sibling enforcers mention
> `CUSTODY` … and I did not read them. … What I did establish: `custody-claim-lint.js` is the only file
> under `scripts/checks/` containing the string `guaranteed` or `FORBIDDEN_CLAIM` (`grep -ln`), so no
> sibling carries this phrase family. I rate the sentence false of this lint as an observation, and
> false of the tree as a strong inference I did not fully verify."*

**⚠️ β `6b09e254` §2: F-1 may be TWO defects** — *is the region scanned?* (mechanism) vs *is L34-36
true?* (claim). Recorded as ONE finding with two candidate questions; **the choice is β's under NO
STACKING.**

## F-Q2I-2 — Rule 4b's block-boundary closure is defeated by DUPLICATING the bound paragraph

**The document's claim, quoted by the lane exactly, `CUSTODY.md` L50-58 — self-labelled *"CLOSED THIS
ROUND (S-VLADW1-05, Task 4), execution-proven"*:**
> *"Rule 4b is now a BLOCK-BOUNDARY check for EVERY bound paragraph, derived or not — closed uniformly,
> not by special-casing item (3)'s key… **Text appended immediately after item (3)'s own words, without
> altering them, now fails closed too**, exactly as a reword or deletion already did — pinned by a
> committed test."*

**Mechanism, lane's words:** `locateBoundParagraphSpan` (L1132) ends in `content.match(pattern)` — **the
FIRST occurrence** — so `endsAtBlockBoundary` (L1151) runs on that copy only, while the presence test
`normalizedDoc.includes(...)` is satisfied by any copy.

**Reproduction, exact inputs:**
- **A10 (control)** — append to item (3)'s block:
  `This transform closes every homoglyph substitution reachable in Unicode.`
  → **exit 1**, 1 violation, `custody-claim-lint/bound-paragraph-appended`.
- **A11 (attack)** — same append **plus a verbatim second copy of item (3)'s whole block inserted
  earlier**, followed by a blank line → **exit 0, 0 violations.** Verified on the mutant:
  `grep -c "(3) NON-BREAKING SPACE"` = 2; appended sentence present at line 238; file 619 → 674 lines.

**The appended sentence is false against the paragraph it is appended to** — item (3) itself states
*"Armenian, Cherokee, Coptic, Deseret and Lisu also contribute Latin homoglyphs and are NOT folded here
AT ALL, at any letter."*

**The lane bounded its own finding rather than rounding it up, verbatim:**
> *"I ran the same duplicate-then-append against a derived bound paragraph (A4): probe D → exit 1. …
> F-2's class is therefore exactly the bound paragraphs that are NOT members of the derived population
> — today precisely one, `TRANSFORM_DESCRIPTION_KEY` (L1058). That is one key, not a general break of
> Rule 4b. But the document's sentence claims closure for 'EVERY bound paragraph, derived or not…
> closed uniformly,' and names item (3) by name as now failing closed. It does not."*

## F-Q2I-3 — The `caseFold:false` carve-out lets a proof be attributed to an Asserted item, in a SCANNED region

**Mechanism, lane's words:** `findLabelSeparationViolations` compares the Proven status token with
`{ caseFold: false }` (L1401-1403), and `findOutOfSectionClaimViolations` does the same (L1587).
> *"The carve-out is disclosed at the transform's block comment and in `CUSTODY.md` item (3); the
> **consequence** is not stated anywhere I read."*

**Reproduction, exact input**, inserted in the preamble — **a region that IS scanned**, where all five
F-Q2I-1 controls fire at exit 1:
```
A1, A2, A3 and A4 are each proven by the enforcers named below.
```
→ probe **K**: **exit 0, 0 violations.**

**False**, lane's words: *"A1's own bound text says 'No in-repo enforcer can bound this,' and the
Asserted header says 'No enforcer exists or can exist in-repo for A1 or A2.'"*

**Isolation the lane performed unprompted:** a sibling probe **A6** placing an equivalent sentence
inside the Asserted section also exits 0, *"but that one is over-determined by F-1, which is why I
re-ran it in the preamble to isolate the carve-out as its own hole."*

---

## Conductor observations — NOT gradings

1. **F-Q2I-2 falsifies a sentence the sprint authored THIS ROUND** — `CUSTODY.md` L50-58 is
   self-labelled *"CLOSED THIS ROUND (S-VLADW1-05, Task 4), execution-proven."* Third such sentence,
   after F-Q1-11 and F-Q1-12.
2. **F-Q2I-2 and Q3 are a UNION, not a contradiction.** Q3 proved `RF-Q1 CLOSED` has teeth — the
   append **is** caught. Q2 found the append is caught **unless a duplicate copy exists earlier**. Q3
   tested append-without-duplicate; Q2 found append-with-duplicate. Both results stand; neither
   contradicts the other. This is exactly the shape β predicted for Q3-vs-Q2 pairings.
3. **Both lanes bounded their own findings** — F-Q2I-1 naming the unread sibling enforcers, F-Q2I-2
   narrowing to the one non-derived key, and F-Q2I-3 re-running in a scanned region to isolate the
   carve-out from F-Q2I-1's over-determination. Each is the party best placed to hide the limit
   disclosing it instead.
