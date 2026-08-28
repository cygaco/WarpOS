# BUNDLE C — AC-8.6: a custody self-check that runs in a USER's install

Sprint S-VLADW1-04. **ONE fix attempt exists this sprint.** Bundles A and B have landed; C, D and E run in
parallel on disjoint files. HEAD is `e6fe52a` or later.

## Where you work
- **Worktree (cwd):** `C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane`, branch
  `wt/S-VLADW1-01-engine`. Commit here. Do NOT branch, push, or merge.
- Paths relative to `engine/`.

## Scope contract
**allowedFiles:** `engine/src/server-entry.js` · `engine/test/custody-runtime.test.js` ·
`engine/ac-pointer-manifest.json` (only if the pointer needs it)
**forbiddenFiles:** everything else. **Especially `engine/CUSTODY.md`, `engine/scripts/checks/**`,
`engine/src/env-scrub.js`, `engine/src/spawn-shim.js`, `engine/driver/host-free-driver.js`** — other bundles
own those RIGHT NOW and are running in parallel with you. Stage only your files by path; never `git add -A`.

`git status` will show other builders' files as modified. **That is expected. Leave them alone.** If the
full suite fails in a file you do not own, re-run once; if it persists, report it rather than editing.

## THE CAP — read this before you design anything

β capped this deliberately: **one invocation, one named test, `check:pointers` resolving.** That is the
whole deliverable.

**A builder who finds itself designing a self-check FRAMEWORK has exceeded the cap and must STOP and say so
in its envelope.** No registry of checks, no plugin surface, no config. One function, invoked once, from the
product-layer entry path. AC-8.6 has slipped two sprints; it fails now only for "not built", never for
"not excellent".

## Task 1 — the self-check, invoked from the product-layer entry

Today nothing in `src/` or `driver/` invokes any custody self-check: `grep -rn "selfcheck" src/ driver/`
returns nothing. `test/credential-custody-decoy.test.js` is a runtime control that ships, but it only fires
when someone runs `npm test` — which a user's install does not do.

Build a self-check invoked when the server starts, from `src/server-entry.js`, on the product-layer path.
Keep it small and honest: it should verify something real about custody state at start-up and report
plainly. **Decide what it checks and justify it in your envelope** — the point is that a control actually
RUNS in a user's install, not that it checks everything.

**Do not make it throw on failure without thinking about it.** A start-up self-check that hard-crashes a
user's server is worse than the gap it closes. Report, or fail closed — your call, justified in the envelope.

## Task 2 — the named test node

Add a test node named exactly **`selfcheck-runs-on-user-machine`** to `engine/test/custody-runtime.test.js`.
That exact name is what `check:pointers` looks for; it is currently classified `missing-NAME` (RED line 313,
because the file exists but the node does not).

## Task 3 — RF-7: RED **at RUNTIME**, not text/AST

Remove the invocation → the named test must go RED **because the check did not run**, not because a string
or an AST node is missing. This distinction is the release criterion S4-5, and it exists because the driver
entry's scrub was found to be load-bearing only at text/AST level in the predecessor sprint.

Ship the mutation as a committed test with the **no-op⇒FAIL guard** (`assert.notEqual(mutated, original,
"...must actually change the text")`) and **EOL-agnostic matching** (`\r?\n`, never a bare `\n`). Observe it
RED yourself and quote the real output.

## Task 4 — `check:pointers` resolves

After your change, `npm run check:pointers` must resolve
`custody-runtime.test.js::selfcheck-runs-on-user-machine` instead of reporting `missing-name`.
**`check:pointers` overall is still RED by design** (other pointers remain unresolved, it is deliberately
outside `check:ship`) — do NOT try to make it exit 0. Report its before/after counts and confirm this one
pointer moved.

## Discipline
- **Suite floor 331**, 0 fail / 0 skipped / 0 todo. APPEND; never shrink.
- **COMMIT AFTER EACH TASK.** Four tasks, four commits is fine and preferred. A previous bundle this sprint
  lost 20 minutes of work by holding everything to one commit at the end.
- **NEVER offer a green gate as evidence that a claim is TRUE.** A passing lint says nothing about truth.
- Do not touch `CUSTODY.md`. If your work implies a claim there should change, say so in your envelope.

## Verify — each as its OWN command, its own exit code (never pipe a gate through `tail` in an `&&` chain)

    cd engine
    node --test "test/*.test.js"
    npm run check:ship
    npm run check:pointers

## Envelope — FINAL message, JSON, nothing after it

    { "bundle": "C", "ok": true, "commit": "<sha or list>", "files_changed": ["..."],
      "suite": {"pass":0,"fail":0,"skipped":0,"todo":0}, "check_ship_exit": 0,
      "selfcheck": {"what_it_checks":"...","why":"...","failure_behaviour":"report|fail-closed + why","invoked_from":"..."},
      "rf7_observed_red_at_runtime": "<the real output, and why it is runtime not text/AST>",
      "check_pointers": {"before":"...","after":"...","this_pointer_resolves":true},
      "cap_respected": "<confirm one invocation + one named test; say so if you nearly exceeded it>",
      "residuals_named": ["..."], "what_i_could_not_do": ["..."] }

Emit the envelope even if you stop early. **Committing beats finishing.** Commit messages start `fix(C):`.
