# FIX BUNDLE 9c — the tautology lint is fail-OPEN and wired to nothing (β Q3 condition, unsatisfied)

Worktree: `C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane\engine` (branch
`wt/S-VLADW1-01-engine`, HEAD `a9e6708`). Work there. Run `npm test` from that directory.

**YOUR FILES — you own these three and nothing else. Four other bundles are running in parallel on
disjoint files. Do not touch any file not listed here.**
- `scripts/checks/no-tautological-assertions.js`
- `test/no-tautological-assertions.test.js`
- `package.json`

**REPAIR AND WIRING ONLY.** The lint's four-family bounding is correct and stays. Do not widen it, do not
add new patterns, do not attempt semantic vacuity.

---

## Task 1 — make it FAIL-CLOSED (this is the finding)

Execution-proven: with the scan root absent, the lint walks **zero files**, `runAllChecks` returns
`ok:true` because `violations.length === 0`, and the binary prints the affirmative

> `no-tautological-assertions: OK — no occurrence of the four named syntactic tautology families under engine/test/`

and **exits 0 having scanned nothing at all.** Reproduced against an explicitly nonexistent root
(`C:/definitely/not/here` → `{"ok":true,"violations":[]}`), with a discriminating control on the same
binary proving it CAN go red (root present + one seeded `|| true` → `RED ... (constant-truthy-disjunct)`,
exit 1). So the exit-0 is caused by the absent root, not by an inability to detect.

The mechanism is `walkJsFiles`' `catch { continue; }` (around lines 116-138), which swallows the error on
the **ROOT directory itself** exactly as it does for an unreadable subdirectory, plus `runAllChecks`
(around 239-270) treating "no violations" as success without ever asking whether anything was examined.

Fix both halves:

- **Absent or unreadable scan ROOT → `NO_DATA`, exit NON-ZERO.** Never `OK`. β's ruling on this is
  explicit and general: *skip never reads as pass.* A checker that examined nothing has produced no
  evidence, and no evidence is not a green.
- **Zero files walked → `NO_DATA`, exit non-zero**, even if the root technically exists. An empty scan is
  the same epistemic state as an absent one.
- **An unreadable SUBdirectory must not be silently swallowed either** (the same `catch { continue; }`).
  A subtree you could not read is a subtree you cannot vouch for: surface it. Whether that is fatal or a
  reported-but-non-fatal warning is your call — **but it must be visible in the output either way**, and
  say in a comment which you chose and why.
- Make the success message honest: report **how many files were actually scanned**. "OK" over a count of
  0 is what made this invisible.

## Task 2 — WIRE IT. Right now it gates nothing.

`grep -c "no-tautological" package.json` → **0**. Not in `npm test`, not in `check:custody`, not in
`check:ship`. The file discloses this itself and calls the wiring owed. β's Q3 said **LAND** it; a lint
that no run invokes is not landed.

Add it to `check:ship`. Verify by running `npm run check:ship` and confirming the lint's output appears
and the gate's exit code is still 0 on the clean tree.

## Task 3 — the two-direction falsifier, kept and made re-runnable

Keep the seeded two-direction falsifier. It must demonstrate BOTH directions as committed tests:
- a seeded tautology from each of the four named families → **RED, exit non-zero**
- a clean tree → **green, exit 0**
- **and now the third case:** absent/empty root → **`NO_DATA`, exit non-zero** (Task 1's own falsifier).

Perform each against a temp copy, never against the real tree.

## Task 4 — two small truths in files you already own

- `scripts/checks/no-tautological-assertions.js:64-69` ships a header reporting a live defect that no
  longer exists ("A real, PRE-EXISTING occurrence ... in test/env-scrub.test.js (line ~408) ... reported
  to the conductor as a finding, not fixed"). Bundle 8b deleted that occurrence; a reader sent to line 408
  now finds nothing. Correct the header to describe what the lint does today.
- `package.json:22` (`vladPointerLint`) is self-contradictory: it calls eleven unresolved pointers
  "clerical NAME drift (the substance exists under a different test-node name)" and then admits one of
  those eleven is "missing WORK, not a missing name". The honest split, counted from
  `npm run check:pointers` output, is **ten drift + one missing work + four missing files = fifteen**.
  Write the honest split.

**Do NOT wire `check:pointers` into `check:ship`.** β ruled it stays out, and it is still exit 1 by
design. Out of scope here.

**Keep the stated semantic-vacuity ceiling.** The lint catches a named SYNTACTIC family; it does not
catch a semantically vacuous assertion. That sentence stays and must not be softened into implying more.

---

## Definition of done

1. `npm test` exit 0, pass count UP. Report the exact count.
2. `npm run check:ship` exit 0 on the clean tree, **with the lint visibly running in its output.**
3. Absent-root run → **NO_DATA, non-zero**, demonstrated. Quote the command and the real output.
4. Seeded-tautology run → RED non-zero; clean run → green. Both quoted.
5. `git status --porcelain` shows only your three files modified.

## Report back (≤25 lines, plain text, no .md file)

- pass/fail counts before and after; `check:ship` exit code with the lint wired
- the three demonstrations (absent-root NO_DATA, seeded RED, clean green) with real output
- what you chose for an unreadable SUBdirectory and why
- anything you could not do, named plainly.
