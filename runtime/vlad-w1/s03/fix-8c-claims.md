# S-VLADW1-03 · BUNDLE 8c — make every shipped claim true (R2's half that is not the entry point)

Sprint `S-VLADW1-03`. backend-fixer. **DISPATCHED — execute now.**

**WORKTREE:** `C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane`, branch
`wt/S-VLADW1-01-engine`. Paths relative to `<worktree>/engine/`.

**DO NOT `git add`/`git commit`/`git push`.** Other fixers own `src/server-entry.js`,
`src/env-scrub.js`, `src/job-manager.js`, `src/quota.js`, `driver/**`.

## scopeContract
**allowedFiles:** `engine/CUSTODY.md` · `engine/scripts/checks/custody-claim-lint.js` ·
`engine/test/custody-claim-lint.test.js` · `engine/src/model-seam.js` (**ONLY** the
`SANCTIONED_CARRIER_NOTE` constant and its doc comment — nothing else in that file)
**forbiddenFiles:** everything else, explicitly `engine/src/server-entry.js`, `engine/src/env-scrub.js`,
`engine/src/spawn-shim.js`, `engine/package.json`, `engine/driver/**`, every other
`engine/scripts/checks/*.js`, every other file under `engine/test/`.

## WHY — R2 is why the predecessor closed instead of releasing

Not because a control failed. **R1 held unanimously** — the runtime boundary refuses every demonstrated
bypass. The sprint closed because **shipped copy claimed more than the controls prove**. That is the
whole subject of this bundle: not adding protection, but making sentences true.

Read that framing before you start, because it changes what "done" means here. A narrower true sentence
is a **success**. A broader sentence with a caveat bolted on is not.

## ITEMS

**C1 (the R2 finding) — P2 ships `Status: PROVEN` claiming more than its enforcer does.**
`CUSTODY.md` P2 asserts a raw bypass "is REFUSED, not warned about", with an argv-only Ceiling
paragraph — while the same artifact's own framing names **P2's raw-launch detection as THE completeness
ceiling**, and the comment-stripping lexer "widens the matcher family; it does not close the class".
**Honesty note that cuts against overcorrecting:** the security lane re-ran five raw-launch shapes
through the real pipeline and **all five were caught**. It said plainly: *"the enforcer improved; the
claim did not."* So do **not** weaken the clause into uselessness — the control is strong. Make the
sentence match it.
FIX: add a Ceiling paragraph to P2 in the same voice as its argv one, naming raw-launch detection as a
text-matcher family that widens but does not close the call-site-shape class, and naming
capture-then-scrub (ADR-0041 Amendment 4) as what covers that class at runtime. Or narrow half (b)'s
wording from "is REFUSED" to what the enforcer's matcher precision actually delivers. **State which you
chose and why.**

**C2 — the P2/P4 exemption sentence is factually wrong, and is still wrong at the source.**
`SANCTIONED_CARRIER_NOTE` sentence 3 says *"P2/P4 exist for that, and both exempt only this named call
site's module."* **True of P4** (`SEAM_REL_PATH = src/model-seam.js`). **False of P2**, whose sole
exemption is `WRAPPER_REL_PATH = src/spawn-shim.js` — P2 does **not** exempt `model-seam.js`; it scans
it. Verify both in the scanner sources yourself before writing the correction.
`CUSTODY.md`'s copy was corrected last sprint; **the exported constant was not**, and it is deliberately
outside the lint's `slice(0,2)` verbatim bind — so nothing catches the divergence.
FIX: correct sentence 3 at the source **and** extend `CARRIER_NOTE_BOUND_SENTENCES` to cover it, closing
the carve-out. That second half is the point: the reason this survived is that the bind stopped short of
the wrong sentence.

**C3 — the A5 quoted-rule category slip.** `CUSTODY.md`'s A5 introduces the carrier as the exception to
*"every `auditedSpawn` call site passes an explicit env object…"* — but `query()`'s env **is not an
`auditedSpawn` call site at all**, so it cannot be an exception to a rule quantified over them. The
seam's own note quotes the older every-child-spawn posture, which now appears nowhere in the shipped
file. FIX: state the rule the carrier is genuinely an exception to, in both places, so the lint's bind
holds them identical.

**C4 — the AC-8.6 ceiling is missing from the one document a USER reads.** The qa lane's judgment:
disclosure is *"adequate for engineering, NOT adequate in shipped user-facing copy."* AC-8.6 is named in
the tracker, in `package.json#vladPointerLint`, in the resolver's header, in A5's stdout — **and in none
of them that a user reads.** Meanwhile `CUSTODY.md` calls P3 *"a runtime control that happens to wear a
`.test.js` extension"* while nothing in `src/` or `driver/` invokes it.
FIX: add one sentence to P3 naming the ceiling — the shipped fixture is invoked by no product-layer code
today, and its red-state proof lives in a file that does not ship. **Another fixer may be building
AC-8.6 this same round: check the tree when you write it and describe what is true AT THAT MOMENT.**
Do not describe a future state as present — that is the exact defect this bundle exists to end.

**C5 — the pointer-lint filing error.** `package.json` is **forbidden** to you, so do not edit it —
but report the correction owed: `vladPointerLint.currentState` says AC-8.6 is among the four
*missing-FILE* pointers. It is **missing-NAME** (`custody-runtime.test.js` exists). The split is
**11 missing-name / 4 missing-file** mechanically, and **14 clerical / 1 missing-WORK** substantively.
The error sits in the exact sentence whose job is keeping AC-8.6 distinguishable from drift.

## WHAT YOU MAY NOT DO
**Do not finalise user-facing trust wording.** ADR-0041's labeling rule makes it **Class C — operator
territory**; a draft exists at `runtime/vlad-w1/CUSTODY-ceiling-DRAFT-for-operator.md` and is routed
through α. Leave every `OPERATOR-PENDING` placeholder in place. If your corrections make one stale,
update its *description of what is owed* — never its resolution.

## DEFINITION OF DONE
1. C1–C4 landed; C5 reported (not edited).
2. **The lint's bind is extended to the corrected sentence** and a mutant proves it: reword that
   sentence in `model-seam.js` → the lint goes RED naming it. Restore.
3. Every claim you touch is verified **against the code** at the time you write it — cite what you read.
4. `node scripts/checks/custody-claim-lint.js` → exit 0. `npm test` → 0 failures.
   `npm run check:ship` → exit 0.
5. You RAN every command and pasted its real output tail.

## REPORT (final text; no report file)
- C1: which route you chose (ceiling paragraph vs narrowed wording) and why.
- C2: the verified exemption for each of P2 and P4, quoted from the scanner sources.
- C4: what was true in the tree when you wrote the sentence.
- C5: the exact correction owed in `package.json`.
- The mutant table for the extended bind.
- Any `OPERATOR-PENDING` placeholders, verbatim.
- **Anything in this brief that is wrong** — verify before you fix, and say so if a claim here does not
  hold. Getting a correction wrong in a bundle about correctness would be its own finding.
