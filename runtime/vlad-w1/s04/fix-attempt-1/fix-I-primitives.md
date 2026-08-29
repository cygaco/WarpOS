# BUNDLE I — coerce before you freeze, refuse what isn't an array, and give E's control its teeth

Sprint S-VLADW1-04, **fix attempt 1 — there is no attempt 2.** Bundles G and H own the claim lint and
`CUSTODY.md`; bundle J owns `spawn-env-allowlist.js`. **All are running in parallel with you.**

## Where you work
Worktree `C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane`, branch
`wt/S-VLADW1-01-engine`. Commit here. No branch, push, or merge. Paths relative to `engine/`.

**allowedFiles:** `engine/src/env-scrub.js` · `engine/src/spawn-shim.js` ·
`engine/test/env-scrub-capture.test.js` · `engine/test/spawn-shim.test.js` · `engine/test/driver.test.js`
**forbiddenFiles:** everything else — **especially `engine/CUSTODY.md`, `engine/scripts/checks/**`,
`engine/src/server-entry.js`, `engine/driver/host-free-driver.js`, `engine/test/env-scrub.test.js`,
`engine/test/custody-*.test.js`, `engine/package.json`.** Other bundles own those right now. Stage only your
files by path; never `git add -A`. Their files will show modified in `git status`; **leave them.**

## THE PROCESS RULE

**You draft each shipped claim sentence AFTER running the attack that would falsify it. No claim without
its attack.** Envelope carries a `falsification_attempts` array. **This bundle exists because a shipped
sentence was written before its attack was run** — see Task 2.

---

## TASK 1 — `env-scrub.js`: coerce names to primitives ONCE, before freezing

The cross-family lane found this, from two excerpts, with no tools:

> Elements of `namesArr` are **not coerced to strings before being frozen into `sweepNames`**, so an object
> with a stateful `toString()` is evaluated **multiple times** as both loops iterate — independently for
> `hasOwnProperty`, `nextCaptured`, and `readOwnEnvValue` in the absorption loop, and **again** in the
> deletion loop for `delete process.env[name]`. **A single element can absorb one variable and delete
> another.**

Unreachable via shipped callers (all pass fixed string arrays), so **LOW on reachability** — **but it
falsifies the shipped CLASS claim** that the mechanism guarantees symmetry regardless of what a caller
passes, because `env-scrub.js` says it has *"no second population for the first to drift from."*

**Build:** `String()`-coerce each name **exactly once** into a frozen array of primitives **before**
deriving `sweepNames` — the same technique bundle D already used for `args`. Then the single population is
genuinely single.

**Then make the header sentence true of what you built** — and note that if you coerce, the CLASS claim
becomes defensible; if you cannot, the claim must be downgraded with the precondition named. Run the attack
before you write the sentence.

## TASK 2 — `spawn-shim.js`: `Array.isArray`, the 15th shape, and a sentence that is currently false

The same lane falsified bundle D's own headline:

> `Object.getPrototypeOf(args) !== Array.prototype` verifies the prototype but **does not verify
> `Array.isArray(args)`**. `Object.create(Array.prototype)` **passes** the new check (its prototype *is*
> exactly `Array.prototype`) and can define own-property getters for `length`.

No TOCTOU bypass follows — the shim normalizes into a fresh frozen `normArgs` before `spawn()` — **but the
shipped comment claiming D1 is "STRICTLY NARROWING" and "adds no new acceptance" is FALSE**: such an object
**would have been rejected by the previous `Array.isArray()` check** and is accepted now. **D's envelope
reported a differential probe over 14 container shapes with "0 widenings". This is the 15th.**

**Build:** add `Array.isArray()` to D1's refusal so the non-array is refused again. **Then re-run the
differential probe INCLUDING that 15th shape** and **correct the shipped sentence to whatever the probe
shows** — not to what it said before, and not to what you hope. `spawn-shim.js` ships, so its comment is a
shipped claim.

**Do not widen acceptance.** The fix must be stricter or equal. If anything newly passes that previously
failed, stop and report it.

## TASK 3 — bundle E's driver control has no teeth

Bundle E took S4-5's route (a): the driver entry's scrub gained a runtime-observable consequence — a throw
at load if a credential-shaped name survives. **No test mutates the driver's scrub call and observes that
throw.** `grep -rln host-free-driver test/` returns five files; none neuters the call. The repo's own rule
calls a control like that **"enforcement debt wearing a green badge."**

**Build the mutant test.** Follow RF-7's shape in `test/custody-runtime.test.js:322-364`, which is the
worked example: write a mutant COPY of the entry, assert the mutation is **not a no-op**, run it as a real
child, and assert the throw actually occurs. **Observe it RED yourself and quote the real output.**

You may edit `test/driver.test.js` for this. **You may NOT edit `driver/host-free-driver.js`** — you are
giving the existing control a witness, not changing it.

---

## Discipline
- **Suite floor is the current count** (≥339), 0 fail / 0 skipped / 0 todo. APPEND; never shrink.
- **COMMIT AFTER EACH TASK.** Three tasks, three commits expected.
- Every mutant carries the **no-op⇒FAIL guard** and **EOL-agnostic matching** (`\r?\n`, never a bare `\n`).
- **Redact credential-shaped literals** — placeholders only.
- **NEVER offer a green gate as evidence that a claim is TRUE.**
- Deleting an env value is irreversible: do not widen what gets deleted beyond names this module captured.
- `opts.cwd` / `opts.stdio` remain a DISCLOSED ceiling. **Not your scope.**
- If the suite fails in a file you do not own, re-run once; if it persists, **report rather than edit.**

## Verify — each as its OWN command, its own exit code

    cd engine
    node --test "test/*.test.js"
    npm run check:ship

## Envelope — FINAL message, JSON, nothing after it

    { "bundle": "I", "ok": true, "commit": "<sha list>", "files_changed": ["..."],
      "suite": {"pass":0,"fail":0,"skipped":0,"todo":0}, "check_ship_exit": 0,
      "task1": {"coercion":"...","class_claim_after":"<the shipped sentence>","stateful_toString_test":"<real output>"},
      "task2": {"isArray_added":true,"probe_15_shapes":"<result incl. Object.create(Array.prototype)>",
                "widenings":0,"shipped_sentence_after":"<the corrected text>"},
      "task3": {"mutant_test":"...","observed_red":"<the real output>"},
      "falsification_attempts": [ {"claim":"...","attack_run":"...","outcome":"..."} ],
      "residuals_named": ["..."], "what_i_could_not_do": ["..."] }

Emit the envelope even if you stop early. **Committing beats finishing.** Commits start `fix(I):`.
