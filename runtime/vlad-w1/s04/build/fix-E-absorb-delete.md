# BUNDLE E — absorb/delete symmetry, and the driver entry's either-or

Sprint S-VLADW1-04. **ONE fix attempt exists this sprint.** Bundles A and B have landed; C, D and E run in
parallel on disjoint files.

## Where you work
- **Worktree (cwd):** `C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane`, branch
  `wt/S-VLADW1-01-engine`. Commit here. Do NOT branch, push, or merge.
- Paths relative to `engine/`.

## Scope contract
**allowedFiles:** `engine/src/env-scrub.js` · `engine/test/env-scrub-capture.test.js` ·
`engine/driver/host-free-driver.js`
**forbiddenFiles:** everything else. **Especially `engine/CUSTODY.md`, `engine/scripts/checks/**`,
`engine/src/spawn-shim.js`, `engine/src/server-entry.js`, `engine/test/env-scrub.test.js`,
`engine/test/custody-*.test.js`** — other bundles own those RIGHT NOW, in parallel with you. Stage only your
files by path; never `git add -A`. Other builders' files will show modified in `git status`; leave them.

`engine/test/env-scrub.test.js` is NOT yours even though it tests your module. If your change would break a
test there, STOP and report it rather than editing it or weakening your own change to avoid it.

## Task 1 — absorb and delete must cover the same population

Found by the cross-family review lane, precondition established from the file text:

> The **absorption** loop iterates only the CURRENT call's `namesArr`, while the **deletion** loop sweeps the
> full `capturedNames` history. So a previously-captured name omitted from a partial call is **deleted from
> `process.env` without ever being checked for absorption** — and if that name was provisioned mid-session,
> its value is destroyed and can never be retrieved via `getCapturedCredential()`.

**Unreachable in production today** — every shipped call site passes a full, set-identical list, and a
standing test asserts that. **But it falsifies the CLASS claim** the predecessor added, which says the
guarantee holds regardless of what any one caller passes.

**Build:** absorb and delete iterate the **same derived population, computed once**. If they must differ,
then **state the precondition in the header and downgrade the claim from CLASS to INSTANCE with the residual
named.** Either is acceptable; **silently leaving a CLASS claim over an asymmetric mechanism is not.**
Choose, and justify in your envelope.

Deleting a value is irreversible. Be careful that your change does not widen what gets deleted beyond names
this module itself captured.

## Task 2 — RF-6, observed RED

A committed standing test: a previously-captured name, provisioned mid-session, omitted from a later partial
call, **must not be deleted without being absorbed.** Observe it RED against the pre-fix behaviour (mutate
your own fix back, or drive the asymmetric path) and quote the real output.

Carry the **no-op⇒FAIL guard** (`assert.notEqual(mutated, original, "...must actually change the text")`)
and **EOL-agnostic matching** (`\r?\n`, never a bare `\n`). **Redact credential-shaped literals** — use a
placeholder; the repo's secret-guard refuses the shape and is right to.

## Task 3 — S4-5's either-or on the driver entry. Silence FAILS.

A review lane proved the driver entry's scrub call is **load-bearing only at TEXT/AST level**: semantically
neutering it (`initCredentialCustody([])`) leaves the environment still scrubbed, because the driver's graph
reaches `src/model-seam.js`, whose own module-body call scrubs anyway. Under the neutering, only text/AST
classifiers noticed — the runtime probe still showed everything scrubbed.

β made this an explicit either-or in the release rule. **Do ONE and say which:**

- **(a)** give the driver entry's scrub a **runtime-observable consequence**, so neutering it is caught by a
  runtime test rather than only by a text classifier; **or**
- **(b)** state plainly, in the driver entry's own header, that its scrub call is **load-bearing only at
  text/AST level** and that `src/model-seam.js`'s own call is what scrubs that process in practice.

**Either satisfies the criterion. Silence does not.** If you take (b), the sentence must be true and
unqualified-in-the-right-direction — do not write something that reads stronger than what you verified.

**Note:** you may edit `driver/host-free-driver.js`, but **not** `src/server-entry.js` (bundle C owns it) and
**not** `CUSTODY.md` (nobody owns it this wave — if your work implies a claim there should change, say so in
your envelope instead of editing it).

## Discipline
- **Suite floor 331**, 0 fail / 0 skipped / 0 todo. APPEND; never shrink.
- **COMMIT AFTER EACH TASK.** Three tasks, three commits is fine and preferred — a bundle this sprint lost
  20 minutes by holding everything to one commit at the end.
- **NEVER offer a green gate as evidence that a claim is TRUE.**
- Two residuals stay stated and unchanged wherever your claim lives: the **worker-thread realm**, and that
  re-scrub **CAPTURES** a mid-session credential rather than ignoring it.

## Verify — each as its OWN command, its own exit code (never pipe a gate through `tail` in an `&&` chain)

    cd engine
    node --test "test/*.test.js"
    npm run check:ship

## Envelope — FINAL message, JSON, nothing after it

    { "bundle": "E", "ok": true, "commit": "<sha or list>", "files_changed": ["..."],
      "suite": {"pass":0,"fail":0,"skipped":0,"todo":0}, "check_ship_exit": 0,
      "symmetry_route": "same-population | precondition-stated + INSTANCE — and why",
      "deletion_not_widened": "<how you confirmed you delete only names this module captured>",
      "rf6_observed_red": "<the real output, credentials redacted>",
      "s4_5_either_or": "(a) runtime consequence | (b) header states text/AST-only — WHICH, and the exact text",
      "residuals_stated": ["worker-thread realm", "captures mid-session credential", "..."],
      "residuals_named": ["..."], "what_i_could_not_do": ["..."] }

Emit the envelope even if you stop early. **Committing beats finishing.** Commit messages start `fix(E):`.
