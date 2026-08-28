# FIX BUNDLE 10b — S2 DURABLE: bind every Asserted paragraph and every ceiling

You are a BUILDER on sprint S-VLADW1-03, fix attempt 2 — **the LAST fix attempt this sprint gets.**
This is the highest-leverage item in the sprint. It is what makes every other claim repair
non-re-breakable, and its absence is why three corrections in a row have been re-openable.

## Where you work
- **Worktree (your cwd):** `C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane`
- **Branch:** `wt/S-VLADW1-01-engine` (already checked out; HEAD `0732cd8`). Commit here directly. Do NOT create a new worktree, do NOT branch, do NOT push.
- All engine paths below are relative to `engine/` inside that worktree.

## Scope contract
**allowedFiles (you may edit ONLY these):**
- `engine/CUSTODY.md`
- `engine/scripts/checks/custody-claim-lint.js`
- `engine/test/custody-claim-lint.test.js`

**forbiddenFiles (another builder owns these RIGHT NOW — editing them corrupts the run):**
`engine/src/**` (ALL of it), `engine/driver/**`, `engine/test/env-scrub.test.js`,
`engine/test/entry-bootstrap.test.js`, `engine/test/custody-static.test.js`,
`engine/test/spawn-shim.test.js`, `engine/test/env-scrub-capture.test.js`,
`engine/scripts/checks/lib/strip-comments.js`, `engine/package.json`,
`engine/scripts/checks/no-tautological-assertions.js`, `engine/test/no-tautological-assertions.test.js`,
`engine/test/verified-by-resolver.test.js`, `engine/test/custody-runtime.test.js`.
If your fix seems to require a forbidden file, STOP and say so in your envelope instead of editing it.

## The defect — execution-proven by the binding qa lane

`engine/CUSTODY.md:7` tells the reader that `scripts/checks/custody-claim-lint.js` checks this file
"byte-for-byte where byte-for-byte is what matters (the Asserted paragraphs)".

That is false. `ASSERTED_PARAGRAPHS` in `custody-claim-lint.js` is a **hand-maintained map holding A1-A4
only**, plus A5's carrier sentences via `CARRIER_NOTE_BOUND_SENTENCES`. **A6, A7 and A8 are unbound, and
so is every Ceiling paragraph inside the Proven section.**

The lane proved it by execution. It inverted A7's rotation sentence into the exact falsehood bundle 9d was
written to correct — leaving the shipped text self-contradictory — and `check:custody` exited 0,
`check:ship` exited 0, and the suite stayed at 294/294. It supplied a **working control** (rewording a
bound A1 sentence makes `check:custody` exit 1), so the harness is not broken; the paragraphs are simply
unbound. It then inverted the AC-8.6 disclosure to assert "AC-8.6 HAS LANDED and the self-check runs in
every user install" — a flat falsehood — with every gate still green. That is the precise camouflage this
sprint has already corrected twice.

**This is a regression the S5 fix caused.** Bundle 9d added A7 and A8 under the uncorrected header, taking
the number of unbound Asserted paragraphs from one to three.

## What you must build

### 1. The class fix — a COMPLETENESS assertion, not three more map entries
Adding A6/A7/A8 to `ASSERTED_PARAGRAPHS` fixes today and re-breaks the next time someone adds A9. The
durable fix is a check that **goes RED when `CUSTODY.md` contains an Asserted paragraph or a Ceiling
paragraph that is not in the bound set.** After your change it must be impossible to ship a new
Asserted/Ceiling paragraph without binding it — the lint fails until it is bound.

Requirements:
- Derive the population of paragraphs **from the file's own structure** (the `**An — ...**` Asserted
  paragraph shape, and the `**Ceiling — ...**` shape used in the Proven section). Do not maintain a second
  hand-written list of "what should exist" — that is the same defect one layer out.
- Bind every one of them byte-for-byte modulo line-wrap whitespace, the same way A1-A4 are bound today.
- **Fail closed.** If the file cannot be parsed, or the derivation yields zero paragraphs, that is RED /
  explicit NO_DATA — never a silent pass. A skip-reads-as-pass in this position is the defect, not a
  degradation.
- Report a violation by naming the specific paragraph id that is unbound, missing, or reworded.

### 2. Correct `CUSTODY.md:7` to say what is now true
The header's promise and the lint's behaviour must agree at close. After your change the promise can be
the strong one — but write what the code does, and if any part of the file remains unbound, say which part
plainly rather than generalising.

### 3. The shipped ordering sentence at `CUSTODY.md:68-70`
The current text says the only modules that evaluate before the scrub call, in either entry, are
`src/env-scrub.js` and `src/bootstrap.js`. **The conductor verified by execution that this is false under
one real reading** and true under the other: with `src/server-entry.js` as the process entry, exactly two
module bodies evaluate before its scrub call; but when `driver/host-free-driver.js` is the process entry
and imports it, several other module bodies — the driver's own, its dependencies', and the Agent SDK's —
evaluate before `server-entry.js` runs its call. The security conclusion is unaffected (the driver's own
scrub call runs before any of them), so this is claim-truthfulness, not a leak.

Replace the sentence so the shipped surface carries the QUALIFIED, true form. Use this exact sentence,
adapted only in the way this file's voice requires (the identical sentence is being written into the entry
source by another builder this round, so the wording must not diverge):

> When an entry file is the process entry point, the only modules that evaluate before its scrub call are
> `src/env-scrub.js`, which imports nothing, and `src/bootstrap.js`, its single-specifier re-export of it.
> The qualifier is load-bearing and not a hedge: when `src/server-entry.js` is instead imported by
> `driver/host-free-driver.js`, other module bodies — the driver's own, its dependencies', and the Agent
> SDK's — evaluate before that call; what protects that process is the driver's own scrub call, which runs
> before any of them.

**Put no COUNT in shipped copy.** A hardcoded number rots the next time a module is added. The security
inference this clause draws must survive the qualifier — reread it and make sure the inference is still
valid as written, or narrow the inference too.

### 4. Wrong attribution at `CUSTODY.md:100`
The `opts.cwd` / `opts.stdio` Ceiling says "this fix cycle observed" a secret-shaped value ride through
`opts.cwd`. Neither `spawn-shim.js` nor its test was touched in fix attempt 1 — the observation belongs to
the PREVIOUS cycle. Correct the attribution. Do not weaken the finding; only date it honestly.

### 5. The falsifier you carry (release criterion S4 — present is NOT enough, it must be OBSERVED RED)
**F-4** — reword the previously-unbound carrier sentence and observe the lint go RED. Run it, observe it,
and quote the real output. And now that the bind is complete, add the same OBSERVED-RED demonstration for
at least one **newly-bound** paragraph (an A6/A7/A8 or a Ceiling) — the whole point is that the class is
closed, and a class claim needs a probe at a site that was open before your change.

## Discipline
- **APPEND to the test file. Never shrink the suite.** 294 passing is the floor: at least 294, 0 failures,
  0 skipped, 0 todo.
- Every claim string in `CUSTODY.md` must be TRUE of the code at close. Read the ones you are not editing
  as well: if you find another false one inside your allowed files, fix it and say so. Criterion S2 is
  judged over the whole shipped surface, not over your diff.
- Do not soften a claim into uselessness to make it true. The preferred repair is to make the claim true or
  to qualify it precisely; deleting the substance is a regression a lane will file.

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
Then commit on `wt/S-VLADW1-01-engine` with a message starting `fix(10b):`.

## Envelope — return this as your FINAL message, as JSON, with nothing after it

    {
      "bundle": "10b",
      "ok": true,
      "commit": "<sha>",
      "files_changed": ["..."],
      "suite": { "pass": 0, "fail": 0, "skipped": 0, "todo": 0 },
      "check_ship_exit": 0,
      "bound_paragraphs_now": ["A1", "..."],
      "completeness_check": "<how a NEW unbound paragraph is made to fail — and the output you observed>",
      "falsifier_F4_observed_red": "<the real lint output>",
      "newly_bound_observed_red": "<paragraph id + the real lint output>",
      "claims_corrected": ["CUSTODY.md:7", "CUSTODY.md:68-70", "CUSTODY.md:100", "..."],
      "residuals_named": ["..."],
      "what_i_could_not_do": ["..."]
    }
