# BUNDLE D — close the `args.map` scan door in `auditedSpawn`

Sprint S-VLADW1-04. **ONE fix attempt exists this sprint.** Bundles A and B have landed; C, D and E run in
parallel on disjoint files.

## Where you work
- **Worktree (cwd):** `C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane`, branch
  `wt/S-VLADW1-01-engine`. Commit here. Do NOT branch, push, or merge.
- Paths relative to `engine/`.

## Scope contract
**allowedFiles:** `engine/src/spawn-shim.js` · `engine/test/spawn-shim.test.js` · new fixture files you
create under `engine/test/fixtures/` (prefix them `D-`)
**forbiddenFiles:** everything else. **Especially `engine/CUSTODY.md`, `engine/scripts/checks/**`,
`engine/src/env-scrub.js`, `engine/src/server-entry.js`, `engine/driver/**`, `engine/test/custody-*.test.js`,
`engine/test/env-scrub*.test.js`** — other bundles own those RIGHT NOW, in parallel with you. Stage only your
files by path; never `git add -A`. Other builders' files will show as modified in `git status`; leave them.

## The defect — execution-proven by a gauntlet lane, on this exact code

`src/spawn-shim.js` normalizes its arguments at roughly line 262:

    normArgs = Object.freeze(args.map((arg) => String(arg)))

**`args.map` is caller-controlled.** An `Array` subclass whose own `map()` ignores the callback routes the
wrapper's single normalization point through hostile code, so the elements are never actually stringified.
The scan then calls `String()` on them once (benign value) and **Node calls `toString()` AGAIN inside
`spawn()` (secret value)**.

Observed by a lane against the real wrapper with every gate green:

    class HostileArgs extends Array { map() { return ['-e', PRINT, stateful]; } }
    // stateful.toString() -> '--benign-flag' on call 1, 'KEY:<decoy>' on call 2

    WRAPPER REFUSED? NO -- real child returned
    toString() calls = 2   (1 = scan time, 2 = spawn time)
    CHILD ARGV CARRIES THE SECRET-SHAPED VALUE? YES

This is the T8/T4 TOCTOU class reopened through a door the earlier `A3` fix did not close. **argv is
world-readable to any same-user process.**

## Task 1 — normalize through a route the caller cannot substitute

Stringify via `Array.prototype.map.call` / `Array.from` with own-property iteration, so **the values the
checks scan and the values `spawn()` receives are identical BY CONSTRUCTION**, not by the caller's
cooperation.

**Be conservative by construction.** Prefer **REFUSING** an `args` container that is not a plain array over
attempting to normalize an exotic one. A refusal is a loud, safe failure; a clever normalization of a
hostile object is a new surface. If you refuse, make the refusal message name what was wrong.

**Do not widen what `auditedSpawn` accepts.** This is a security primitive on the shipped surface; the fix
must make it stricter or equal, never looser. If your change would newly accept something previously
refused, stop and report it.

## Task 2 — the shipped comment that is currently false

`src/spawn-shim.js` (around lines 411-415, repeated near 256-260) asserts:

> spawn() receives normCommand/normArgs/normalizedEnv — the EXACT SAME frozen objects every check above just
> scanned ... "Check one object, spawn a different one" is now structurally impossible for command/args, the
> same guarantee normalizeEnv already gave `env`.

**The `env` half is genuinely structural** — `normalizeEnv` builds its own flat object from
`Object.create(null)` and the wrapper controls the walk. **The `args` half was not**, which is the defect
above. `src/spawn-shim.js` is in `package.json#files`, so this is a **shipped surface** and its truth is a
release criterion.

After Task 1, make the comment true — or narrow it to exactly what holds. **State what is structural and
what is not.** Do not leave a sentence that is true only under a reading the reader must supply.

## Task 3 — RF-5, the committed regression fixture

Commit the Array-subclass shape as a standing fixture that goes **RED without your fix**: an `args` object
whose `map()` ignores its callback must not be able to deliver an unscanned value to a real child.

Assert the OBSERVATION, not the absence: run it, and assert the refusal (or the identity of scanned-vs-spawned
values) actually occurs. Carry the **no-op⇒FAIL guard** and **EOL-agnostic matching** (`\r?\n`, never a bare
`\n`) on any mutation.

**Redact any credential-shaped literal** in your test and envelope — use a placeholder. The decoys are
synthetic, but this repo's secret-guard refuses the shape and is right to.

## Discipline
- **Suite floor 331**, 0 fail / 0 skipped / 0 todo. APPEND; never shrink.
- **COMMIT AFTER EACH TASK.** Three tasks, three commits is fine and preferred — a bundle this sprint lost
  20 minutes by holding everything to one commit at the end.
- **NEVER offer a green gate as evidence that a claim is TRUE.**
- `opts.cwd` / `opts.stdio` remain unscanned and are a DISCLOSED ceiling. **Not your scope. Do not fix them,
  do not re-open them.**

## Verify — each as its OWN command, its own exit code (never pipe a gate through `tail` in an `&&` chain)

    cd engine
    node --test "test/*.test.js"
    npm run check:ship

## Envelope — FINAL message, JSON, nothing after it

    { "bundle": "D", "ok": true, "commit": "<sha or list>", "files_changed": ["..."],
      "suite": {"pass":0,"fail":0,"skipped":0,"todo":0}, "check_ship_exit": 0,
      "normalization_route": "<what you used, and why the caller cannot substitute it>",
      "refuses_or_normalizes": "<which, and the refusal message if you refuse>",
      "acceptance_not_widened": "<how you confirmed nothing newly passes that previously failed>",
      "comment_after": "<the corrected shipped comment; what is structural and what is not>",
      "rf5_observed_red": "<the real output with credentials redacted>",
      "residuals_named": ["..."], "what_i_could_not_do": ["..."] }

Emit the envelope even if you stop early. **Committing beats finishing.** Commit messages start `fix(D):`.
