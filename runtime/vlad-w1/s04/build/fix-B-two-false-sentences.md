# BUNDLE B — correct two gate-enforced falsehoods, atomically

Sprint S-VLADW1-04. **ONE fix attempt exists this sprint.** Bundle A has already landed; you are serial
after it, and you are the only builder running.

## Where you work
- **Worktree (cwd):** `C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane`
- **Branch:** `wt/S-VLADW1-01-engine`. Commit here. Do NOT branch, push, or merge.
- Paths relative to `engine/`. `git status` should be clean when you start.

## Scope contract
**allowedFiles:** `engine/CUSTODY.md` · `engine/scripts/checks/custody-claim-lint.js`
**forbiddenFiles:** everything else, including every test file. Stage only your two files by explicit path;
never `git add -A`.

**Do not re-open bundle A's work.** A rewrote the header's what-is/is-NOT-bound block, added a `Ceiling`
paragraph under P3, and built `canonicalizeClaimText`. Leave all of it alone. You are correcting two
specific sentences elsewhere in the file.

## The situation, and why it is the sprint's sharpest shape

Both sentences below are **bound byte-for-byte**. That means the lint currently **requires a false sentence
to be present verbatim** — so correcting the text alone turns `check:ship` RED, and correcting the canonical
copy alone turns it RED the other way. **They move together, in one commit, or not at all.** In the
predecessor sprint a builder hit exactly this, correctly refused to reach outside its scope, and left the
tree red; an extra bundle existed only to finish the pair. You own both halves precisely so that cannot
happen again.

## Sentence 1 — the preload Ceiling's "not named on any other surface"

Locate it by CONTENT: the Ceiling paragraph about **process-level preload** (`NODE_OPTIONS`, `--require`,
`--import`) evaluating before this package's own ESM graph. It ends with a claim that this residual is
**"not, as of this fix cycle, named on any other surface, shipped or internal."**

**That is false and was proven so by execution.** `engine/test/entry-bootstrap.test.js` names the residual
in its own ceiling note — the file explicitly discusses a preload (`--require`/`--import`/`NODE_OPTIONS`)
evaluating before the package's graph, and it *uses* `--import` as a live demonstration. `test/` is an
internal surface, and the sentence says "shipped **or internal**".

**Verify this yourself before editing** — grep for `NODE_OPTIONS` across the tree excluding `node_modules`
and read what you find. Correct the sentence to state what is actually true. Do NOT delete the residual or
weaken the Ceiling; only its "named nowhere else" clause is wrong.

## Sentence 2 — the `opts.cwd` / `opts.stdio` Ceiling's attribution

Same paragraph family: the Ceiling stating that `opts.cwd` and `opts.stdio` are not scanned by
`auditedSpawn`. It asserts the observation **"is not this fix cycle's, which touched neither
`src/spawn-shim.js` nor its test"**, identifying the previous cycle as "the one that last changed
`src/spawn-shim.js`".

**That is false as written.** `src/spawn-shim.js` WAS changed in the same fix cycle that authored the
sentence — `git log --oneline 0732cd8..b2583d6 -- engine/src/spawn-shim.js` shows a commit, and
`git diff --stat 0732cd8..b2583d6` shows the file modified. The change was comment-only, so the sentence
survives a "behaviourally changed" reading — **but that qualifier is not in the text**, and "this fix cycle"
is used inconsistently elsewhere in the file.

**Run those two git commands yourself** and correct the attribution to something true and unambiguous.
Prefer naming what actually happened over adding a qualifier that rescues the old wording — a sentence that
is true only under a reading the reader must supply is the defect class this sprint exists to close.
The second half of that Ceiling — that `opts.cwd`/`opts.stdio` pass through unscanned — is TRUE and stays.

## The atomicity requirement (release criterion S4-3)

For each correction: the paragraph text in `CUSTODY.md` and its canonical copy in `custody-claim-lint.js`
change **in the same commit**. At close, no shipped claim string may diverge from its canonical copy.

Bundle A built **RF-4**, a test that goes RED when a claim string and its canonical copy diverge. **Run it.**
It should be GREEN when you finish and RED if you edit only one side — check that by actually trying it
once, then restoring. If RF-4 does not exist or does not behave that way, say so in your envelope rather
than working around it.

## Discipline
- **Suite floor is bundle A's count** (at least 318), 0 fail / 0 skipped / 0 todo.
- **NEVER offer a green gate as evidence that a sentence is TRUE.** A passing lint proves the text matches
  its stored copy — nothing about whether the text is true of the code. Establish truth by reading the code
  and say what you read. Do not write "the lint is green so the claims are correct."
- If correcting a sentence reveals a THIRD false claim nearby, report it in your envelope; do not silently
  widen your scope to fix it.

## Verify — each as its OWN command, its own exit code (never pipe a gate through `tail` in an `&&` chain)

    cd engine
    node --test "test/*.test.js"
    npm run check:ship

Commit message starts `fix(B):`.

## Envelope — FINAL message, JSON, nothing after it

    { "bundle": "B", "ok": true, "commit": "<sha>", "files_changed": ["..."],
      "suite": {"pass":0,"fail":0,"skipped":0,"todo":0}, "check_ship_exit": 0,
      "sentence_1": {"before":"...","after":"...","evidence_i_ran":"..."},
      "sentence_2": {"before":"...","after":"...","evidence_i_ran":"..."},
      "atomicity": "<RF-4 green at close; and what you observed when you edited one side only>",
      "third_claims_noticed": ["... or none"],
      "residuals_named": ["..."], "what_i_could_not_do": ["..."] }

Emit the envelope even if you stop early. **Committing beats finishing.**
