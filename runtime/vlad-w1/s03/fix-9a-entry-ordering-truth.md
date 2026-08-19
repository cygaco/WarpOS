# FIX BUNDLE 9a — the extractor's blind spots, and the ordering claim told truthfully

Worktree: `C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane\engine` (branch
`wt/S-VLADW1-01-engine`, HEAD `a9e6708`). Work there. Run `npm test` from that directory.

**YOUR FILES — you own these three and nothing else. Four other bundles are running in parallel on
disjoint files. Do not touch any file not listed here.**
- `test/entry-bootstrap.test.js`
- `src/server-entry.js`
- `driver/host-free-driver.js`

**REPAIR AND WIRING ONLY.** No new controls, no refactors, no scope beyond the four tasks below.

---

## Task 1 — the extractor is FAIL-OPEN in two shapes (CRITICAL). Fix both.

`extractStaticImportSpecifiers` (`test/entry-bootstrap.test.js:88-89`) drives the A2 "exactly ONE static
import" and A3 closure assertions. Two proven blind spots make those assertions silently weaker than they
read. Both were verified by running the verbatim regex over nine forms:

| Input | Current result | Should be |
|---|---|---|
| `import a from "./one.js"; import b from "./two.js";` | `["./two.js"]` — **`./one.js` LOST** | both |
| `import a from "./blockcmt.js"; /* note */` | `[]` — **whole import LOST** | the specifier |
| `import a from "./blk2.js" /* n */` | `[]` — **whole import LOST** | the specifier |

The first is the severe one: **an entry can statically import an arbitrary extra module while A2/A3 stay
green**, which is exactly what A2 exists to forbid. Execution-proven — a `sed`-mutated `server-entry.js`
line 66 carrying a second same-line import left `entry-bootstrap` at 15/15 pass, `check:ship` exit 0 and
the suite at 271/271.

The `$`-anchored tail currently tolerates only `;` and a `//` comment. That narrowness is the same class
the file's own header (lines 81-87) says was already "PROVED insufficient by this fix's own A4 mutant
proof" for the `//` case — it was fixed for that one spelling only. **Fix the class, not a third
spelling:** make the extractor find EVERY static import in the source rather than one per line, and stop
letting trailing trivia hide one.

These forms already work and must keep working — assert them: `export * from`, `export { a } from`,
side-effect-only `import "x"`, multi-line `import {\n a,\n} from`, `import type`, and dynamic `import(...)`
correctly EXCLUDED by the `(?!\()` guard.

## Task 2 — commit the F-1 mutation as a standing regression test

Add a test that feeds the extractor a source with **two static imports on one line** and asserts BOTH
specifiers come back. This is the exact bypass; it must be a committed, re-runnable test, not a one-time
observation. Same for the two block-comment shapes.

## Task 3 — replace the presence-test with a TRUTH-test (this is the heart of the bundle)

`test/entry-bootstrap.test.js:259` defines `RE_DERIVED_CLAIM` and lines 271-275 assert
`source.includes(RE_DERIVED_CLAIM)` — **presence, never truth.** A gauntlet lane used that gap to prove
the sentence it certifies is FALSE. A test that checks a claim's spelling cannot detect a claim's
falsehood; that is the defect class this whole sprint exists to close, sitting inside the guard built to
close it.

Replace it with an assertion that **observes real evaluation order**. The technique that falsified the
claim is the one to standardize: build a faithful mirror of the shipped chain in a temp dir — an entry
that statically imports a re-export-only shim that re-exports from a zero-import module, each module body
logging its own evaluation — run it with `node`, and assert the observed order. Then assert the shipped
entries' actual static shape matches that mirrored shape.

Keep a presence-check if you like, but it may no longer be the ONLY thing asserted. **The test must be
able to go RED when the sentence stops being true**, and you must demonstrate that: mutate an entry so
the claim becomes false, observe RED, revert, and put the mutation in the commit as a regression test.

## Task 4 — rewrite the two header sentences to what is TRUE

`src/server-entry.js:59` and `driver/host-free-driver.js:45` both ship:

> "initCredentialCustody() runs before any other module in this package's graph evaluates."

**That is false.** `src/bootstrap.js` and `src/env-scrub.js` are both modules in this package's graph and
both evaluate to completion first — proven by executing a faithful mirror, which printed `env-scrub.js`
body, then `bootstrap.js` body, then the scrub call. It is the predecessor's own false "FIRST STATEMENT"
claim reproduced one hop out.

Replace both with the true statement. Say exactly this shape, in your own words but with nothing added:

> The only modules that evaluate before this call are `src/env-scrub.js`, which imports nothing, and
> `src/bootstrap.js`, which does nothing but re-export it. `node:` builtins still resolve first.

**Do not oversell the repair.** The security property is intact — nothing that could carry or observe a
credential evaluates first. What failed was the CLAIM, not the control. Say that plainly. And keep
`RE_DERIVED_CLAIM` (or its replacement constant) in sync with whatever you write, since Task 3's test
binds to it.

**Both entry files must state it. Two copies, one truth.** The old false sentence must not survive
anywhere — grep for it before you finish.

---

## Definition of done

1. `npm test` from the engine dir: exit 0, and the pass count has GONE UP (you are adding tests).
   Report the exact count.
2. The F-1 two-imports-on-one-line mutation and both block-comment shapes are committed regression tests.
3. The evaluation-order truth-test exists, and you have **observed it RED** under a mutation that makes
   the claim false. Quote the command and the failure output in your report.
4. `grep -rn "before any other module in this package" src/ driver/` returns NOTHING (the false sentence
   is gone from both entries).
5. `git status --porcelain` shows only your three files modified. **You touch no other file.**

## Report back (≤25 lines, plain text, no .md file)

- exact `npm test` pass/fail counts before and after
- the RED observation for Task 3, with the command and the real failure text
- the new true sentence you wrote, verbatim
- anything you could NOT do, named honestly — an unfinished task said plainly is worth more than a
  quiet omission. If you run short on time, do Tasks 1+2 first; they are the CRITICAL half.
