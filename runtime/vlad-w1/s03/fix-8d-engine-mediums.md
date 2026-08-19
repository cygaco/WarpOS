# S-VLADW1-03 · BUNDLE 8d — the surviving MEDIUMs in engine code

Sprint `S-VLADW1-03`. backend-fixer. **DISPATCHED — execute now.**

**WORKTREE:** `C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane`, branch
`wt/S-VLADW1-01-engine` (continues as the build surface). Paths relative to `<worktree>/engine/`.

**DO NOT `git add`/`git commit`/`git push`.** Other fixers are working disjoint files —
`src/server-entry.js`, `src/env-scrub.js`, `CUSTODY.md`, `scripts/checks/**` are **theirs**.

## scopeContract
**allowedFiles:** `engine/src/job-manager.js` · `engine/src/quota.js` ·
`engine/test/quota.test.js` · `engine/test/lifecycle.test.js` · `engine/test/cancel.test.js`
**forbiddenFiles:** everything else — explicitly `engine/driver/host-free-driver.js` and
`engine/test/driver.test.js` (**bundle 8a owns the driver this round** — its `ok`-computation and
`child.on("error")` items moved there so one fixer owns that file), `engine/src/server-entry.js`,
`engine/src/env-scrub.js`, `engine/src/model-seam.js`, `engine/src/spawn-shim.js`,
`engine/CUSTODY.md`, `engine/scripts/checks/**`, `engine/package.json`.

## CONTEXT — why these survived three rounds

Each item below was found by a gauntlet lane, **reported fixed at least once, and found still live**.
They are individually MEDIUM/LOW and collectively they are the reason the predecessor closed rather
than released: a set of small honest-reporting defects in an engine whose stated value is that
**status is never inferred**. Fix the mechanism; do not widen scope.

## ITEMS — every one, by id

**D1 — MOVED TO BUNDLE 8a.** The driver's `ok`-inference defect and its missing `child.on("error")`
listener now belong to 8a, which owns `driver/host-free-driver.js` for the bootstrap restructure. One
file, one owner — two fixers editing it concurrently is the collision this sprint cannot afford.
**Do not touch the driver.**

**D2 — `permission-level-valid` computes non-emptiness, not validity.** `src/job-manager.js` ~682.
`ok: Boolean(permissionLevel)`. Executed: `getReadiness({permissionLevel: "totally-bogus-level"})`
returns `ready:true`. `permission.js` exports `isValidPermissionLevel` and `job-manager.js` imports
nothing from it.
FIX: import and call it. A readiness check whose id names validity and computes truthiness is a
tautology wearing a check's name, in the surface whose contract is that every check is honestly
computed.

**D3 — `cancelJob`'s `idempotent` flag misreports its own call.** `src/job-manager.js` ~601-614.
Executed: two consecutive `cancelJob()` calls on a job already in `cancellation-requested` both return
`idempotent:false`. The flag is true only on the terminal-state branch.
FIX: return `idempotent:true` whenever the call performed **no transition**. Track it from the branch
actually taken, not from the state class.

**D4 — quota recognition is position-dependent.** `src/quota.js` ~159-182.
`extractSignalText` joins a multi-entry `.errors` array with `"\n"`, then `matchesQuotaExhaustionPrefix`
applies `startsWith` to the **joined** string — so only `errors[0]` can ever match. Executed:
`errors:['Session ended unexpectedly', "You've hit your usage limit"]` → `could-not-run`. Separately
`signal instanceof Error` is tested before the object branch, so an `AggregateError`'s `.errors` is
never read.
**Why this one matters more than its severity:** it degrades in the safe direction, which is exactly why
nobody notices — and AC-9.3's whole point is that a founder must not be told the wrong thing about why
a run failed. A genuine exhaustion silently reclassified as `could-not-run` is the *other* wrong door.
FIX: test each extracted candidate **independently** against the prefixes rather than testing one joined
blob; read `.errors` on `Error` instances too.

**D5 — the quota corpus has no drift enforcer.** `src/quota.js` + `test/quota.test.js`.
The 12 prefixes are a hand-frozen copy of the SDK's `USAGE_LIMIT_ERROR_PREFIXES`, and the test
**hardcodes the same literals** — it asserts the copy against itself. Two lanes verified the copy is
currently byte-identical, so the corpus is honest *today*; what is missing is anything that keeps it so
across an SDK bump.
FIX: import `USAGE_LIMIT_ERROR_PREFIXES` from the **installed** SDK in the test and assert set-equality
with the local array. **The pattern already exists in this repo** — `test/model-seam.test.js`'s D-2
durability test mechanically extracts the SDK's credential-var group and fails closed on drift. Follow
it rather than inventing a second shape.

**D6 — MOVED TO BUNDLE 8a**, with D1, for the same one-file-one-owner reason.

## FIELD 4 — β requires every item to declare CLASS or INSTANCE
For each of D2–D5, state in your report: **does this fix close the CLASS or only this INSTANCE, and if
instance, what is the named residual?** β made this the design gate because *"three rounds regenerated
the same class one syntax over."* D4 is the one to think hardest about — a position-dependent matcher is
an instance of "the predicate asks the wrong question", which is the same family as the anchored-pattern
defect the predecessor fixed in three separate places. An item you cannot answer this for has an
unfinished design; say so rather than guessing.

## DEFINITION OF DONE
1. D1–D6 fixed, or explicitly reported unfixed with a reason. No silent omissions.
2. **Mutant proof per fix, lever verified FIRST, each reverted ALONE.** Revert D1's outcome check → the
   new test goes RED; revert D2 → the bogus-level test goes RED; and so on. `git diff -- engine/src/
   engine/driver/` must be **empty** when you finish. A mutant aimed at the wrong lever is false
   reassurance, not weak reassurance — this sprint's predecessor lost one that way and then found a
   second whose test could not see it.
3. D1's `computeDriverOk` is a pure function with its own unit tests, and you report whether the
   `VLAD_DRIVER_TEST_FORCE_*` env hooks can now be retired (do not remove them unless the tests
   genuinely replace them — say which).
4. `npm test` → 0 failures. `npm run check:ship` → exit 0. Other fixers are working concurrently; if one
   of their checks flags YOUR file, that is a real finding — fix your file, do not work around it.
5. You RAN every command and pasted its real output tail.

## REPORT (final text; no report file)
- One line per D-id.
- D1: the exact new `ok` conjunction, and your ruling on the test-only env hooks.
- D4: how you now test candidates independently, and what you did about `AggregateError`.
- D5: how the drift test resolves the installed SDK, and what it does if the export is absent (it must
  fail loudly, not skip).
- Mutant table: lever verified, what went red, restored-green, clean `git diff` confirmed.
- Real output tails for both commands.
- **Anything in this brief that is wrong** — every item here came from another agent's execution, so
  verify each reproduces before you fix it, and say so plainly if one does not.
