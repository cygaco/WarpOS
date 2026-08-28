# FIX BUNDLE 10d — the re-scrub guarantee: make it true of the MECHANISM, or state its precondition

You are a BUILDER on sprint S-VLADW1-03, fix attempt 2 — **the LAST fix attempt this sprint gets.**

## Where you work
- **Worktree (your cwd):** `C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane`
- **Branch:** `wt/S-VLADW1-01-engine` (already checked out; HEAD `0732cd8`). Commit here directly. Do NOT create a new worktree, do NOT branch, do NOT push.
- All engine paths below are relative to `engine/` inside that worktree.

## Scope contract
**allowedFiles (you may edit ONLY these):**
- `engine/src/env-scrub.js`
- `engine/src/spawn-shim.js`
- `engine/test/spawn-shim.test.js`
- `engine/test/env-scrub-capture.test.js`

**forbiddenFiles (another builder owns these RIGHT NOW — editing them corrupts the run):**
`engine/CUSTODY.md`, `engine/src/server-entry.js`, `engine/src/bootstrap.js`, `engine/driver/**`,
`engine/test/env-scrub.test.js`, `engine/test/entry-bootstrap.test.js`, `engine/test/custody-static.test.js`,
`engine/scripts/checks/**`, `engine/package.json`, `engine/test/verified-by-resolver.test.js`,
`engine/test/custody-runtime.test.js`, `engine/test/no-tautological-assertions.test.js`,
`engine/test/custody-claim-lint.test.js`.
If your fix seems to require a forbidden file, STOP and say so in your envelope instead of editing it.

**`engine/test/env-scrub.test.js` is explicitly NOT yours this round** even though it tests your module.
Another builder is rewriting its analyzers. If your change would break a test in that file, STOP and report
it in your envelope rather than editing it or weakening your own change to avoid it.

## The defect — found by the cross-family lane, then confirmed by the conductor's own execution

`engine/src/spawn-shim.js:356-373` (the Z1 re-scrub choke-point) states, unconditionally:

> A credential provisioned at any point after startup ... is captured-and-deleted from `process.env` here,
> before the NEXT child launched through this wrapper could ever inherit it — this is what makes
> idempotence a CLASS property of the wrapper rather than an accident.

The re-scrub deletes **only the names passed in the current call**. So: a full-list call at startup, then a
name `B` re-provisioned mid-session, then a **partial** later call that omits `B`, leaves `B` sitting in
`process.env` for the next child to inherit. The conductor reproduced this by execution:
`env[B] after partial re-scrub: <value still present> — would be inherited by the next child`.

**Reachability, checked rather than assumed — this does NOT fire criterion S1.** Every shipped call site
passes a FULL list: `src/server-entry.js` and `driver/host-free-driver.js` pass `CREDENTIAL_ENV_NAMES`,
`src/model-seam.js` passes `ENV_DENYLIST`, `src/spawn-shim.js` passes `envDenylist` from `describeAuth()`,
and a standing test asserts `CREDENTIAL_ENV_NAMES` and `describeAuth().envDenylist` stay set-identical.
There is no shipped-reachable trigger today.

**But the claim is broader than the mechanism**, and that is this sprint's recurring failure class. The
guarantee holds only because every caller happens to pass the full list. It is a property of the CALL SITES
stated as a property of the MECHANISM — while explicitly claiming CLASS status. That is a criterion-S2
defect on a shipped surface.

## What you must build

You choose between two repairs, and you justify the choice. This is a real decision with a user-visible
consequence, so decide it rather than defaulting.

**Preferred — make the claim true of the mechanism.** On every call, delete every name this module has
**previously captured**, in addition to the names in the current call. Then the guarantee holds regardless
of what any caller passes, and CLASS status is earned rather than asserted.
- The module already tracks captured credentials for its fallback path — reuse that state; do not add a
  parallel registry.
- Be conservative about what you delete: only names this module itself captured, never an arbitrary
  widening of the deletion set. Deleting a name it already captured is consistent with custody; deleting
  something it never captured is a new behaviour nobody asked for.
- Say plainly, in the header, that a later call now also removes previously-captured names, and what a
  caller can and cannot conclude from that.

**Fallback — state the precondition.** If the mechanism change cannot be made without weakening an existing
assertion, or without reaching into a forbidden file, then rewrite `spawn-shim.js:356-373` so the guarantee
carries its precondition explicitly ("holds for callers that pass the complete denylist; every shipped call
site does, and a standing test asserts the two lists stay set-identical"), re-grade the claim from CLASS to
INSTANCE, and name the residual where the claim lives. Do not leave the word CLASS attached to a call-site
property.

Either way:
- **Ship the teeth.** A standing test must go RED if your repair is removed. If you took the mechanism
  route, the test is: capture, re-provision a name mid-session, call with a PARTIAL list omitting it, and
  assert it is gone from `process.env` — with a control proving the same sequence leaves it present when
  the repair is reverted. If you took the precondition route, the test pins the precondition sentence so it
  cannot silently drift back to an unconditional promise.

### Two residuals that must remain stated wherever your claim now lives
Both were named by beta at the design boundary and neither is closed by this bundle:
- the **worker-thread realm** (a fresh module registry and its own `process.env` copy; `SHARE_ENV` changes
  the shape);
- that re-scrub **CAPTURES a mid-session credential** rather than ignoring it — correct for custody, but
  user-visible, so it must be stated rather than discovered.

### Also in your files
- The `names` guard: verify it genuinely honours its `names` argument (an earlier round found a guard that
  ignored it). If it still does, fix it and say so.
- The lane filed a LOW finding worth recording, not inflating: a secret **split across two benign-named env
  values**, cut before the shape matcher's recognisable prefix, passes `auditedSpawn` unrefused and the
  child reconstitutes the plaintext. It is not env-inheritance and requires a caller already holding the
  plaintext. Do NOT build a new matcher for it in this attempt. Record it as a named residual where
  `auditedSpawn`'s shape-refusal surface is described, so it is not mistaken for covered.

## Discipline
- **APPEND to test files. Never shrink the suite.** 294 passing is the floor: at least 294, 0 failures,
  0 skipped, 0 todo.
- You are editing a security primitive on the last fix attempt. Prefer the smallest change that makes the
  shipped sentence true. A refactor here is not worth what it risks.
- Every claim you write must be true of the code at close, under every reading a reader could reasonably
  take — this sprint has failed twice on sentences that were true one reading over.

## CONCURRENCY — read this before you commit

THREE OTHER BUILDERS are editing this same worktree and this same branch RIGHT NOW, in files you are
forbidden to touch. Therefore:
- Stage ONLY your own allowed files, BY EXPLICIT PATH. NEVER `git add -A`, `git add .`, or `git commit -a` —
  any of those would sweep another builder's half-finished work into your commit.
- If `git commit` fails on an index lock, wait a moment and retry. That is contention, not corruption.
- `git status` will show files you did not touch as modified. That is expected, and is NOT yours to fix,
  clean, stash, or revert. Leave them alone.
- If the full suite fails in a file you do NOT own, re-run it once — you may have caught another builder
  mid-write. If it still fails, report it in your envelope rather than editing their file.

## Verify before you report (run these; quote the real output, not a summary of it)

    cd engine
    node --test "test/*.test.js"
    npm run check:ship

Suite must be >= 294 pass / 0 fail / 0 skipped / 0 todo; `check:ship` must exit 0.
Then commit on `wt/S-VLADW1-01-engine` with a message starting `fix(10d):`.

## Envelope — return this as your FINAL message, as JSON, with nothing after it

    {
      "bundle": "10d",
      "ok": true,
      "commit": "<sha>",
      "files_changed": ["..."],
      "suite": { "pass": 0, "fail": 0, "skipped": 0, "todo": 0 },
      "check_ship_exit": 0,
      "route_chosen": "mechanism | precondition",
      "why": "<the justification>",
      "class_or_instance": "CLASS | INSTANCE — and what the claim now says",
      "red_on_removal_observed": "<the real test output you observed>",
      "residuals_stated": ["worker-thread realm", "captures mid-session credential", "..."],
      "names_guard": "<was it honouring its argument, and what you did>",
      "what_i_could_not_do": ["..."]
    }
