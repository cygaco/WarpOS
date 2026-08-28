# FIX BUNDLE 10c — the ordering claim told truly, in the entry source

You are a BUILDER on sprint S-VLADW1-03, fix attempt 2 — **the LAST fix attempt this sprint gets.**

## Where you work
- **Worktree (your cwd):** `C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane`
- **Branch:** `wt/S-VLADW1-01-engine`. Commit here directly. Do NOT create a new worktree, do NOT branch, do NOT push.
- All engine paths below are relative to `engine/` inside that worktree.

## Scope contract
**allowedFiles (you may edit ONLY these):**
- `engine/src/server-entry.js`
- `engine/driver/host-free-driver.js`
- `engine/src/bootstrap.js`
- `engine/test/entry-bootstrap.test.js`
- `engine/CUSTODY.md` — **ONE targeted edit only**, described in Part B item 1. Do not touch anything else
  in this file; its claim text was settled by another bundle that has already landed.
- `engine/test/custody-claim-lint.test.js`, `engine/test/env-scrub.test.js`,
  `engine/test/no-tautological-assertions.test.js`, `engine/test/verified-by-resolver.test.js` — **for the
  no-op-guard work in Part B item 2 ONLY.** Do not otherwise modify these files or their assertions.
- `.gitattributes` at the REPOSITORY root (optional, Part B item 3).

**forbiddenFiles:** everything else, and in particular `engine/scripts/checks/**`,
`engine/src/env-scrub.js`, `engine/src/spawn-shim.js`, `engine/test/custody-static.test.js`,
`engine/test/spawn-shim.test.js`, `engine/test/env-scrub-capture.test.js`, `engine/package.json`.
If your fix seems to require a forbidden file, STOP and say so in your envelope instead of editing it.

**You are the ONLY builder running.** The other four bundles of this fix attempt (10a, 10b, 10d, 10e) have
already landed and committed; their builders are gone. So `git status` should be clean when you start — if it
is not, say so before you change anything.

## The defect — proven by a gauntlet lane and re-proven independently by the conductor

`engine/src/server-entry.js:59-60` and `engine/driver/host-free-driver.js:45-46` both carry:

> The only modules that evaluate before this call are src/env-scrub.js, which imports nothing,
> and src/bootstrap.js, which does nothing but re-export it. node: builtins still resolve first.

**Two separate falsehoods in two sentences.**

**(1) The first sentence is unqualified, and is false in a real in-repo process.** The conductor ran a
`node:module` load hook that instruments every module body, so the marker sequence is true EVALUATION
order, and observed:
- `node src/server-entry.js` (server-entry as the process entry): exactly two module bodies evaluate
  before its scrub call — `src/env-scrub.js`, then `src/bootstrap.js`. **The sentence is TRUE here.**
- `await import('./driver/host-free-driver.js')` (driver as the process entry): the evaluation order is
  `src/env-scrub.js`, `src/bootstrap.js`, `driver/host-free-driver.js`,
  `node_modules/@anthropic-ai/claude-agent-sdk/sdk.mjs`, `src/quota.js`, `src/model-seam.js`,
  `src/output-shim.js`, `src/spawn-shim.js`, and only THEN `src/server-entry.js`. **Several module bodies,
  including a production dependency's, evaluate before server-entry's call. The sentence is FALSE here.**

The security conclusion is unaffected — the driver's own scrub call runs at position 3, before any of
them — so this is claim-truthfulness, not a leak. But it is the same
unqualified-evaluation-order-sentence class the predecessor sprint shipped false, **narrowed rather than
closed**, which is why it must be closed properly now rather than narrowed a third time.

**(2) `node: builtins still resolve first.` is new in the last rewrite and is simply false.** Both load-hook
runs show every `node:` builtin evaluating AFTER the scrub call. The repo's own shipped copy already
contradicts it: `CUSTODY.md` states that neither entry currently holds a `node:` builtin in its static
import list — each holds exactly one specifier, `./bootstrap.js`. Read as "builtins evaluate before this
call" it is false; read alongside the preceding "the only modules that evaluate before are X and Y", the
two clauses cannot both hold. **And nothing asserts it**, because of defect (3).

**(3) The standing test pins only the sentence's FIRST LINE.** `RE_DERIVED_CLAIM` in
`engine/test/entry-bootstrap.test.js` is the string
`"The only modules that evaluate before this call are src/env-scrub.js, which imports nothing,"` — one
line. That is exactly how the false `node:` clause shipped with no assertion covering it. A presence check
over a fragment cannot tell a claim's spelling from its truth.

## What you must build

### 1. Replace the claim in BOTH entries with the qualified, true form
Use this sentence. Another builder is writing the matching sentence into `CUSTODY.md` this round from the
identical source text, so **the wording must not diverge** — reproduce it, adapting only the entry name and
the mirrored role for the driver's copy:

> When this file is the process entry point, the only modules that evaluate before this call are
> `src/env-scrub.js`, which imports nothing, and `src/bootstrap.js`, its single-specifier re-export of it.
> The qualifier is load-bearing and not a hedge: when this file is instead imported by
> `driver/host-free-driver.js`, other module bodies — the driver's own, its dependencies', and the Agent
> SDK's — evaluate before this call; what protects that process is the driver's own scrub call, which runs
> before any of them.

For `driver/host-free-driver.js` the mirror is the same shape with the roles swapped: the driver is the
process entry in its own case, and the case where it is not is the one to name.

**Put NO COUNT in the sentence.** A hardcoded number rots the next time a module is added to the graph.
**Delete the `node: builtins still resolve first.` clause.** Do not replace it with a corrected version in
the same breath — the accurate statement about `node:` builtins already lives in `CUSTODY.md` as a named
Ceiling, and duplicating it here is how the two copies drifted apart in the first place. If you believe the
entry source genuinely needs a builtins note, write only what your own probe proves and say where the fuller
statement lives.

### 2. Pin the WHOLE sentence, not a fragment
Widen `RE_DERIVED_CLAIM` so the standing assertion covers **every clause you ship**, including the
qualifier. After your change it must be impossible to add a clause to that sentence, or to delete the
qualifier, without a test going red. That is the actual defect here: a fragment-pin let a false clause ship
uncovered, and a fragment-pin will do it again.

### 3. Replace the local comment-stripper with the shared lexer
`engine/test/entry-bootstrap.test.js` around line 72 defines its own `stripComments`:

    function stripComments(source) {
      return source.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/[^\n]*/g, "");
    }

Its own header admits it breaks on `//` or `/*` inside a string literal. A shared, span-tracking lexer
already exists at `engine/scripts/checks/lib/strip-comments.js`, is consumed by five sibling checks, and was
extended this same round with a comments-plus-strings blanking export. **Delete the local one and import
from the shared module.** Two lexers in one tree with different ceilings is how the invocation classifier
and the import extractor ended up with mirror-image bugs in the same sprint.

Read `engine/scripts/checks/lib/strip-comments.js` first to see which export fits: use the comment-only
export where you need real specifier TEXT to survive, and the comments-plus-strings export where you are
asking "is this real code". Say in your envelope which you used where and why.

### 4. Strengthen the A7 truth-test if you can, and be honest if you cannot
A reviewer graded the existing A7 truth-test as observing **a mirror the test itself builds**, so it proves
ESM re-export semantics (never in doubt) rather than the shipped sentence's truth — and by construction it
cannot model the process in which one entry is imported by the other, which is exactly the process where
the sentence was false. If you can make it observe the REAL modules in the REAL
entry-imported-by-the-other-entry process, do so; a `node:module` load hook over the real graph is how the
conductor measured it. If you cannot do that inside your scope, say so plainly and record the ceiling in
the test — do not leave it reading stronger than it is.

## Discipline
- **APPEND to the test file. Never shrink the suite.** The suite must not lose coverage; 0 failures in your
  own files, 0 skipped, 0 todo.
- Every claim you write must be true of the code at close **under every reading a reader could reasonably
  take.** This sprint has now failed its claim criterion twice on sentences that were true one reading over.
  A qualified true sentence beats an unqualified impressive one.
- Do not weaken the security statement while qualifying the ordering statement. The control is sound; it is
  the wording that has been wrong. Make sure the security inference the surrounding comment draws still
  follows from the qualified sentence, and narrow the inference too if it does not.

---

# PART B — three additions folded in after this brief was first written

Part A above (items 1-4) is the ordering-claim work and is still the priority. Part B is smaller but is
gate-relevant: item 1 is a criterion-S2 truthfulness edit ruled in by beta, and item 2 is the class form of
a defect the conductor observed.

## B1 — a possessive in `CUSTODY.md` that goes FALSE at close (criterion S2)

AC-8.6 — the product-layer custody self-check — has been formally DEFERRED to a named successor sprint. It
will not land in this sprint. Beta ruled the deferral is not a gate reshape, but it makes one shipped
sentence false at close.

In the P3 Ceiling paragraph (locate it by CONTENT, not by line number — it is the paragraph beginning
"**Ceiling — this fixture is not wired to run automatically in a user's install.**"), the text says the
standing proof is *"tracked separately (the sprint's AC-8.6)"*. **The possessive "the sprint's" binds
delivery to THIS sprint, and that becomes false the moment this sprint closes without it.**

Fix it one of two ways: name the successor sprint explicitly, or drop the possessive so the sentence
attributes the work to no particular sprint. **Do not touch the surrounding sentences** — "AC-8.6 has not
landed", "that self-check does not yet exist in `src/` or `driver/`", and the `missing-name` classification
are all TRUE and independently verified by the conductor at this commit, and they must stay exactly as they
are. This is a one-phrase edit.

Note the consequence: `CUSTODY.md` is byte-for-byte bound by the claim lint, so your edit will make the lint
RED until you update the corresponding canonical copy in `engine/scripts/checks/custody-claim-lint.js` —
**which is a forbidden file.** That is deliberate, and it is the test of whether the bind actually works. If
the lint goes RED and you cannot fix it inside your scope, STOP and report that in your envelope. Do not
edit the forbidden file, and do NOT weaken or delete the paragraph to make the lint pass.

## B2 — a mutation that does not mutate must FAIL, everywhere (the class fix)

The conductor observed this by execution: a fresh `git worktree add` of this commit materialises
`engine/CUSTODY.md` with CRLF line endings (282 CRLF, 0 bare LF) while the working tree holds LF (282 bare
LF, 0 CRLF, 24549 bytes). On that clean checkout, mutant tests whose `.replace()` search literal spans a line
break match NOTHING, so the mutation silently becomes a no-op.

Two confirmed instances, both in `engine/test/custody-claim-lint.test.js`, both embedding a bare `\n` in the
search string — the Rule 4 CEILING mutant (searching for ``"`opts.stdio` pass\nstraight through to the
underlying"``) and Rule 4b.

**Do two things, and the second matters more than the first:**

1. Make the mutation logic EOL-agnostic — tolerate `\r?\n`, or normalise line endings before replacing.
2. **Apply the "mutation was a no-op ⇒ FAIL" guard to EVERY mutant test added by bundles 10a, 10b and 10e —
   not only to the two instances named above.** `custody-claim-lint.test.js` already has this guard on some
   of its mutants (`assert.notEqual(mutated, REAL_CUSTODY, "the F-4 mutation must actually change the
   text")`) and that guard is exactly why the defect was caught loudly rather than passing silently. Every
   other mutant — the F-1/F-2/F-3 falsifiers and the A1 mutant proofs in `test/env-scrub.test.js`, the F-5
   work in `test/verified-by-resolver.test.js`, and anything mutating in
   `test/no-tautological-assertions.test.js` — must carry the same guard.

**The conductor's enumeration of affected tests is explicitly INCOMPLETE** (the isolated worktrees were
removed before the full clean-checkout failure list was captured). So do not fix only the listed ones:
**find every mutant in those files and guard each.** A falsifier whose mutation can silently no-op is not
observing anything, and criterion S4's whole bar is "observed RED".

## B3 — OPTIONAL, only if it stays disjoint: pin the line endings at the root

A `.gitattributes` entry pinning `engine/CUSTODY.md` — and any fixture the byte-for-byte binding reads — to
`eol=lf` would make a fresh checkout byte-faithful to the tree under judgment, removing the fidelity gap at
its root rather than tolerating it in every consumer.

Do this ONLY if it is genuinely additive and touches nothing else. If the repository already has a
`.gitattributes` with rules that could interact, or if pinning would rewrite other files' endings on the
next checkout, SKIP IT and say why in your envelope. B2 is the required fix; B3 is the nicer one. **Do not
let B3 put the tree in a state where files are rewritten wholesale** — a mass line-ending change on the last
fix attempt would be indistinguishable from a real diff to every review lane.

## CONCURRENCY — read this before you commit

Other builders may be editing this same worktree and branch in files you are forbidden to touch. Therefore:
- Stage ONLY your own allowed files, BY EXPLICIT PATH. NEVER `git add -A`, `git add .`, or `git commit -a`.
- If `git commit` fails on an index lock, wait a moment and retry. That is contention, not corruption.
- `git status` will show files you did not touch as modified, and may show stray `tmp-*.mjs` files at the
  engine root. Those are not yours. Do not fix, clean, stash, or revert them.
- The full suite currently has failures caused by those stray files, in `test/custody-static.test.js`,
  which is NOT your file. Do not chase them. Report the count you see and move on. What matters is that
  YOUR files' tests pass and that no failure traces to your diff.
- If you create any temporary scratch file, delete it before you finish.

## Verify before you report (run these; quote the real output, not a summary of it)

    cd engine
    node --test "test/*.test.js"
    node --test test/entry-bootstrap.test.js
    npm run check:ship

Your own test file must be fully green. Report the full-suite numbers honestly even where other builders'
in-flight work makes them non-zero, and attribute each failure you see.
Then commit on `wt/S-VLADW1-01-engine` with a message starting `fix(10c):`.

## Envelope — return this as your FINAL message, as JSON, with nothing after it

    {
      "bundle": "10c",
      "ok": true,
      "commit": "<sha>",
      "files_changed": ["..."],
      "suite": { "pass": 0, "fail": 0, "skipped": 0, "todo": 0, "failures_attributed": "..." },
      "entry_bootstrap_test": "<the real result for your own file>",
      "check_ship_exit": 0,
      "sentence_shipped": "<the exact sentence, both entries>",
      "whole_sentence_pinned": "<how, and the red-on-drift you observed>",
      "node_builtins_clause": "<what you did with it>",
      "shared_lexer": "<which export where, and why>",
      "a7_truth_test": "strengthened | ceiling recorded — and what you observed",
      "b1_possessive": "<the exact before/after phrase, and whether the claim lint went RED>",
      "b2_noop_guards": {
        "eol_agnostic": "<what you changed>",
        "mutants_found": ["<every mutant test you located, across all four files>"],
        "mutants_guarded": ["<every one you added the no-op guard to>"],
        "any_you_left_unguarded_and_why": ["..."]
      },
      "b3_gitattributes": "done | skipped — and why",
      "residuals_named": ["..."],
      "what_i_could_not_do": ["..."]
    }

`b2_noop_guards.mutants_found` is the field that matters most in Part B: it is how the conductor learns
whether the enumeration is finally complete. List what you actually found, even the ones that already had
the guard.
