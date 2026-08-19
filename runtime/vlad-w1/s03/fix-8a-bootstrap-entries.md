# S-VLADW1-03 · BUNDLE 8a — bootstrap restructure: make the ordering claim TRUE, and fix both entries

Sprint `S-VLADW1-03`. backend-fixer. **DISPATCHED — execute now.**

**WORKTREE:** `C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane`, branch
`wt/S-VLADW1-01-engine`. Paths relative to `<worktree>/engine/`.

**DO NOT `git add`/`git commit`/`git push`.** Other fixers own `CUSTODY.md`,
`scripts/checks/**`, `src/job-manager.js`, `src/quota.js`, `src/model-seam.js`. **`src/env-scrub.js` is
READ-ONLY to you** — another bundle owns it and runs AFTER you.

## scopeContract
**allowedFiles:** `engine/src/server-entry.js` · `engine/driver/host-free-driver.js` ·
`engine/src/bootstrap.js` (CREATE, if you choose that shape) ·
`engine/test/entry-bootstrap.test.js` (CREATE) · `engine/test/driver.test.js`
**forbiddenFiles:** everything else — explicitly `engine/src/env-scrub.js`, `engine/src/model-seam.js`,
`engine/src/spawn-shim.js`, `engine/CUSTODY.md`, `engine/package.json`, `engine/scripts/checks/**`,
every other file under `engine/test/`.

## AUTHORITY — β chose restructure over narrowing, and verified it is cheap

β verdict `5a1d83bc-7e46-4f92-b3c0-2d95e07a41f8` (betaEvents **row 304**, DECIDE, Class B, 0.91),
verified in canonical. It ruled **(b) RESTRUCTURE**, not narrowing, and gave the reason:

> `src/env-scrub.js` has **ZERO static imports**, so a bootstrap importing only it pulls in nothing —
> `initCredentialCustody()` genuinely runs before any other module body in the package evaluates.
> Narrowing leaves a real window: **a module body that captures `process.env` into a closure at import
> time survives the scrub.**

So this is *feasible-and-currently-false*, not infeasible. **You are making a claim true, not softening
it** — which is the whole reason this sprint exists.

## THE DEFECT

Three shipped surfaces claim `initCredentialCustody()` runs "FIRST STATEMENT, before every other import
below". **ESM hoists every static import and evaluates each target to completion before ANY statement of
the importing body.** All three Claude gauntlet lanes proved this independently by execution: eight
production module bodies evaluate with the credential still present. No leak today — none of them reads
`process.env` — but the stated defense-in-depth property does not exist.

And the sting: **`model-seam.js` had already corrected this exact overclaim about itself in the same fix
attempt**, and the corrected-away wording was reintroduced verbatim in two entry points and baked into a
test's assertion message.

## TASKS

**A1 — the bootstrap.** Restructure each entry so it **statically imports exactly ONE specifier**:
`./env-scrub.js` (directly, or a `bootstrap.js` that itself imports only it — your call, justify it).
Call `initCredentialCustody()`, then reach the rest of the program by **dynamic import**. Both entries:
`src/server-entry.js` **and** `driver/host-free-driver.js`.

**A2 — β condition 1: enforce the single-import property with a standing test.** A test on **each
entry's static import list** asserting length 1, which **goes RED when a second static import is added**.
This is the enforcer; without it the restructure decays on the next commit.

**A3 — β condition 2: assert the TRANSITIVE CLOSURE, not the direct list.** The test must **fail if
`env-scrub.js` ever imports anything.** The direct list alone is insufficient — the guarantee is that
nothing else evaluates first, and that is a property of the whole closure. (`node:` builtins still
resolve; say so.)

**A4 — β condition 3: the mutant.** Reverting an entry to a **static** import of the server must make
the test **RED**. Verify the lever first, then observe red, then restore.

**A5 — β condition 4: fix ALL THREE claim surfaces.** `src/server-entry.js`, `driver/host-free-driver.js`,
**and the test-assertion message** that repeats the false rationale. The test covers **both** entries.

**A6 — β condition 5: RE-DERIVE the sentence from the restructured code.** Do **not** carry the old
sentence with "now" appended. β's true-and-strong form: **"before any other module in this package's
graph evaluates."** Write what the new structure actually delivers.

**A7 — the driver's own two defects, while you own that file.**
- **`ok` still infers success from completion.** It requires `Boolean(status)` — set for ANY terminal
  state including **`cancelled`** — and **never reads `status.outcome`**, though `job-manager.js#describe`
  computes it for exactly this purpose. A job reaching DONE carrying `error` yields `ok:true`, exit 0.
  FIX: add `status.outcome === "success"` (and no `status.error`). **Extract
  `computeDriverOk({targetRepoUnchanged, status, toolNames})` as a pure function and unit-test it** —
  the test-only `VLAD_DRIVER_TEST_FORCE_*` env hooks exist *because* this was never extracted; report
  whether they can now be retired (do not remove them unless the tests genuinely replace them).
- **No `child.on("error")` listener.** A spawn failure emits `error` with no handler and Node rethrows it
  as an uncaught exception, bypassing the driver's own `.catch` that exists to report exactly this.
  `scripts/checks/lib/ship-set.js` registers this listener against the same wrapper — the convention was
  available and not followed.

## FIELD 4 — β requires every item to declare CLASS or INSTANCE
For each of A1–A7, state in your report: **does this close the CLASS or only this INSTANCE, and if
instance, what is the named residual?** β made this the gate because *"three rounds regenerated the same
class one syntax over."* An item you cannot answer this for has an unfinished design — say so rather
than guessing.

## DEFINITION OF DONE
1. A1–A7 landed. Both entries import exactly one specifier statically.
2. A2/A3's standing tests exist and cover **both** entries and the transitive closure.
3. **Mutant proof, lever verified FIRST, each reverted ALONE**: A4's static-import revert → RED; a second
   static import added → RED; `env-scrub.js` given an import → RED; A7's outcome check reverted → RED.
   `git diff -- engine/src/ engine/driver/` **empty** when you finish.
4. `npm test` → 0 failures. `npm run check:ship` → exit 0.
5. You RAN every command and pasted its real output tail.

## REPORT (final text; no report file)
- One line per A-id, **each with its field-4 answer**.
- The bootstrap shape you chose and why; the exact re-derived sentence (A6), verbatim.
- How A3 computes the transitive closure, and its ceiling.
- A7: the new `ok` conjunction and your ruling on the test-only env hooks.
- Mutant table; real output tails.
- **Anything in this brief that is wrong.** These findings came from other agents' executions — verify
  each reproduces before you fix it. In particular: confirm for yourself that `env-scrub.js` really has
  zero static imports, because β's whole ruling rests on it and a brief that inherits an unverified
  premise is the defect this sprint is closing.
