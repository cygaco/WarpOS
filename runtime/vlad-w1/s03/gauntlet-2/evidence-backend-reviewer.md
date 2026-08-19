# Lane evidence — `backend-reviewer` (BINDING) — S-VLADW1-03 gauntlet-2

Shape: `in-process-agent` · claude-opus-5 · elapsed 296476 ms · 17 tool_uses · agentId `adcae0149b21fd965`
Target: commit `0732cd8`. Brief: `lane-backend.md` (narrowed re-dispatch).

**Verdict: FAIL.** S1 cannot-assess · **S2 FAILS** · S3 holds · S4 cannot-assess · S5 cannot-assess.
Worktree clean, HEAD `0732cd8`.

## DISPATCH NOTE
This lane was lost to a truncated return **twice** (gauntlet-1 and gauntlet-2's first attempt). Both times
it had done substantial work; both times the lane read as `no-record`. The third dispatch was narrowed to
two tasks with an explicit instruction to prioritise emitting the JSON. It returned in 296s.

## F-1 — MEDIUM — S2 — the rewritten ordering sentence is STILL false, one reading over

The new sentence — *"The only modules that evaluate before this call are `src/env-scrub.js` ... and
`src/bootstrap.js` ..."* — is unqualified, and is **false in the driver's process**. Proven with a
`node:module` load hook:

`node --import <reg.mjs> -e "await import('./driver/host-free-driver.js')"` printed, in order: driver,
bootstrap.js, env-scrub.js, `node:url`, `node:path`, `node:fs`, `node:os`, spawn-shim.js,
`node:child_process`, model-seam.js, ... quota.js, output-shim.js, **THEN `src/server-entry.js`**. So when
`server-entry.js:78`'s scrub call runs in that process, **at least 22 other modules have already
evaluated.** The control run with `server-entry.js` as the process entry confirms the sentence IS true
under the process-entry reading only — and the sentence carries no such qualifier.

**The security conclusion is unaffected** (whichever module is the process entry scrubs first, and the
driver's own call precedes everything), so this is comment-truthfulness, not a leak. But it is **the same
unqualified-evaluation-order-sentence class the predecessor sprint shipped false**, narrowed rather than
closed. The identical unqualified claim is also on the SHIPPED surface at `CUSTODY.md:68-70`, where a
security inference is drawn from it.

## F-2 — MEDIUM — S2 — the new `node:` builtins clause is false and self-contradictory

*"`node:` builtins still resolve first"* is **new in this rewrite** and is not true of either entry. Both
load-hook runs show every `node:` builtin evaluating **after** the scrub call. The repo's own shipped copy
agrees and contradicts the source comment: `CUSTODY.md:79-80` states *"Neither entry currently holds a
`node:` builtin in its static import list."* Read as "builtins evaluate before this call" it is false;
read at face value alongside the preceding "only X and Y", the two clauses cannot both hold.

**And nothing asserts it:** `RE_DERIVED_CLAIM` at `test/entry-bootstrap.test.js:369` pins only the
sentence's FIRST line, so the new clause shipped with no assertion covering it.

## F-3 — LOW — the just-fixed trap recurred ~330 lines away

`test/env-scrub.test.js:1018`'s F-2 mutant fixture substitutes
`// F-2 MUTANT: initCredentialCustody(...) call deleted` — text `CALLS_SCRUB_RE` would match, which is
exactly the trap documented and fixed for the A1 mutants at lines 676-686. **Currently harmless** because
F-2's oracle is a real child-process run rather than the text classifier, and no walker is pointed at that
tmp tree. Filed as a latent landmine of the just-fixed class, not a current false green. `execution_proven:
false` — reasoned from the code's own documented match condition, not run.

## F-4 / F-5 — LOW — honest strength-grading of the new tests
- The A7 truth-test observes a **mirror the test itself builds**, so it proves ESM re-export semantics
  (never in doubt) rather than the shipped sentence's truth, and by construction cannot model the
  entry-imported-by-the-other-entry process in which F-1 shows the sentence false.
- The invocation non-vacuity control discriminates only against a constant-true classifier; its `!invokes`
  witness is an ordinary derived entry, not an imports-without-calling shape. **Materially better than the
  predecessor's self-vacuous control** — filed for honesty of strength, not as a defect.

## `regressions_from_fix_attempt_1` (verbatim)
1. Bundle 9a's rewrite replaced a false unqualified ordering sentence with a **narrower but still
   unqualified** one that remains false in a real in-repo process — the class was narrowed, not closed.
2. The `node:` builtins clause is NEW in this rewrite and is false/self-contradictory; the predecessor
   sentence did not contain it, and the presence test pins only the first line, so it shipped uncovered.
3. `test/env-scrub.test.js:1018` re-introduces the call-shaped replacement-text pattern the same file's A1
   mutants were just hardened against.

## Assessed and found TRUE — filed as no finding (worth recording)
`src/bootstrap.js`'s header (one static import, re-export-only — confirmed by both load probes);
`src/env-scrub.js`'s rewritten RESIDUAL 1 rotation text, which **matches the implementation** (absorb only
when there is no real captured value, via own-property check; never overwrite; delete every call); and the
module-cache singleton comment, true within a realm with the worker realm disclosed as RESIDUAL 2.

## `what_i_could_not_assess`
S1, S4, S5 entirely — outside this narrow dispatch. `extractStaticImportSpecifiers` form coverage not
reached. `model-seam.js` carrier note and `buildSecretSearchPattern`; `spawn-shim.js` re-scrub
cost/reentrancy/ordering; `job-manager.js`/`quota.js`; and **`no-tautological-assertions.js` /
`ac-manifest.js` fail-closed-on-crash behaviour and whether the lint's semantic-vacuity ceiling is honest
— NOT reached.** Whether `CALLS_SCRUB_RE` actually matches F-3's string was reasoned, not executed.
