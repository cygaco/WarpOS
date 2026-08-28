# FIX BUNDLE 10a — S3 ROOT: the inert invocation control + ONE shared lexer

You are a BUILDER on sprint S-VLADW1-03, fix attempt 2 — **the LAST fix attempt this sprint gets.**
Nothing after this is repaired; what you ship is what is judged.

## Where you work
- **Worktree (your cwd):** `C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane`
- **Branch:** `wt/S-VLADW1-01-engine` (already checked out; HEAD `0732cd8`). Commit here directly. Do NOT create a new worktree, do NOT branch, do NOT push.
- All engine paths below are relative to `engine/` inside that worktree.

## Scope contract
**allowedFiles (you may edit ONLY these):**
- `engine/scripts/checks/lib/strip-comments.js`
- `engine/test/env-scrub.test.js`
- `engine/test/custody-static.test.js`
- new fixture files you create under `engine/test/fixtures/` (name them with a `10a-` prefix)

**forbiddenFiles (another builder owns these RIGHT NOW — editing them corrupts the run):**
`engine/CUSTODY.md`, `engine/scripts/checks/custody-claim-lint.js`, `engine/test/custody-claim-lint.test.js`,
`engine/src/**` (ALL of it), `engine/driver/**`, `engine/test/entry-bootstrap.test.js`,
`engine/test/spawn-shim.test.js`, `engine/test/env-scrub-capture.test.js`, `engine/package.json`,
`engine/scripts/checks/no-tautological-assertions.js`, `engine/test/no-tautological-assertions.test.js`,
`engine/test/verified-by-resolver.test.js`, `engine/test/custody-runtime.test.js`.
If your fix seems to require a forbidden file, STOP and say so in your envelope instead of editing it.

## The defect — execution-proven by a gauntlet lane, and independently by the conductor

`engine/test/env-scrub.test.js` around lines 544-560, in `analyzeScrubInvocation()`, tests two regexes
against **RAW source text**:

    const IMPORTS_SCRUB_BINDING_RE = /\bimport\s*\{[^}]*\binitCredentialCustody\b[^}]*\}\s*from\s*["'][^"']+["']/;
    const CALLS_SCRUB_RE = /(?<!function\s)\binitCredentialCustody\s*\(\s*[^)\s]/;

`engine/src/bootstrap.js:27` contains the text `initCredentialCustody(...)` **inside a prose comment**.
That text matches `CALLS_SCRUB_RE`. Bundle 8a put `bootstrap.js` on the **mandatory hot path of BOTH
shipped entry points**, so every graph that reaches an entry contains it. Therefore `anyCallFound` is
**pre-satisfied by a comment for every shipped entry**, and the A1 assertion (the test titled
"A1 (beta, class-level, bundle 9b: INVOCATION not reachability)") is **INERT**.

A gauntlet lane built the bypass and ran it: a new entry with exactly ONE static import of `bootstrap.js`
that deliberately does NOT name the scrub binding (so the `orphanedImporters` half cannot see it),
reaching `child_process` via a dynamic import. Result: `node --test test/env-scrub.test.js` gave 22/22 with
A1 GREEN, and running that entry with a decoy credential in the environment printed the credential from
inside the child. **A real child obtained a real credential while every gate was green.**

The irony that tells you the shape of the right fix: bundle 9a fixed comment-blindness in the *extractor*
by stripping comments before matching. Bundle 9b's *classifier* has the mirror bug. Same sprint, same file
family, opposite direction. **Do not fix this one site. Fix the class.**

## What you must build

### 1. Extend the SHARED lexer — `engine/scripts/checks/lib/strip-comments.js`
This file already exports `stripComments(source)` (length-preserving, position-preserving) and is already
consumed by five sibling checks. It blanks **comments only** — string-literal bodies survive intact, so a
matcher run over its output still over-matches call-shaped or import-shaped text sitting inside a string.

Add a second export alongside it (name it as you see fit, e.g. `stripCommentsAndStringBodies`) that blanks
**comment bodies AND string / template-literal bodies**, preserving the delimiting quotes, the exact input
length, and every line/column position — the same contract the existing export documents and is tested on.

Requirements:
- It must **reuse** the existing lexer's span-tracking, not duplicate it. One lexer, two blanking policies.
  A second hand-rolled scanner in this file is the defect this bundle exists to remove, not a fix for it.
- Preserving the quotes matters: an analyzer that reads an import specifier out of a match must still see
  that a specifier *was* there even when the body is blanked. Where a consumer genuinely needs the
  specifier's TEXT (the import walker does), it uses `stripComments` and gets the real specifier; where a
  consumer needs "is this real CODE" (the call classifier does), it uses the new export.
- Name its ceilings in the header the way the existing header already does. Do not round the file's
  honesty up: if the regex-vs-division heuristic or the template-substitution handling bounds the new
  export the same way it bounds the old one, say so in the same voice.

### 2. Route the analyzers through it — `engine/test/env-scrub.test.js`
- `analyzeScrubInvocation()` must apply the **comments + strings** blanking before testing either regex.
  After your fix, `src/bootstrap.js`'s comment must NOT satisfy `anyCallFound`.
- `walkRelativeImportGraph()`'s `importRe` walk must run over **comment-stripped** source (prose in this
  repo's headers is full of the words `import`, `export` and `from` sitting next to quoted text). Verify it
  still extracts every real specifier — the specifier text must survive your change.
- Do NOT re-implement stripping locally. Import from `../scripts/checks/lib/strip-comments.js`.
- The long "WHAT THIS DOES NOT COVER" comment block above `analyzeScrubInvocation` currently discloses the
  comment/string false-positive as an accepted gap. That disclosure is now stale — you are closing it.
  Rewrite it to describe what is actually true after your change, and keep disclosing what remains open
  (the aliased-import and re-bound-reference blind spots are still real).

### 3. Commit the bypass as a REQUIRED-RED regression fixture
Build the lane's probe shape as a committed fixture under `engine/test/fixtures/` plus a standing test that
**observes it RED**: an entry that imports `bootstrap.js` **without naming the scrub binding** and reaches
`child_process` dynamically must classify as `canSpawn && !invokes`, i.e. the A1 rule must FAIL on it.
Assert the failure is OBSERVED — run the classifier over the fixture and assert it reports that failure —
not merely that a fixture file exists. Title it so the words `OBSERVED RED` appear, matching the
convention of the existing F-2 test ("F-2 (mutant proof, standing, OBSERVED RED — B4/Z4) ...").

**Do not let the fixture become a shipped entry point.** It must not enter `package.json#files` and must
not be picked up by the real entry-point derivation. It is a fixture the test points the classifier at.

### 4. Two more defects that live in your files
- **qa F-4 —** the A1 guard is `if (canSpawn && !invokes)`, and `src/server-entry.js`'s graph reaches only
  SAFE builtins, so `canSpawn` is false for it and **it can never be flagged on its own account**; its
  coverage today is incidental. Either widen the classification so server-entry is genuinely covered, **or**
  record this exemption in the test's own "WHAT THIS DOES NOT COVER" block, which currently does not
  mention it. Whichever you choose, say which and why in your envelope. Do not leave it undisclosed.
- **backend F-3 —** the F-2 mutant near `engine/test/env-scrub.test.js:1018` substitutes the replacement
  text `// F-2 MUTANT: initCredentialCustody(...) call deleted`, which is **itself call-shaped** and would
  match `CALLS_SCRUB_RE` — the exact trap the A1 mutants ~330 lines earlier were just hardened against,
  recurring in the same file. It is currently harmless because F-2's oracle is a real child-process run
  rather than the text classifier. Remove the landmine anyway; a latent one has already become a live one
  once this sprint.

### 5. Falsifiers you carry (release criterion S4 — present is NOT enough; each must be OBSERVED RED)
S4 has been carried on assertion for two rounds and nobody has mutated these. That ends here.
- **F-1** — three spawn spellings classify spawn-capable. Mutate each spelling's detection and observe the
  classification flip. A test asserting the current green state does not satisfy this.
- **F-3** — a credential provisioned AFTER the first `initCredentialCustody()` call. Observe the mutation
  going RED. You own only the TEST side: `src/env-scrub.js` belongs to another builder this round, so
  mutate a COPY, exactly as the existing F-2 test already does for `server-entry.js`.
- **F-2** — already carries an OBSERVED RED title. Re-verify it still goes red and quote what you observed.

## Discipline
- **APPEND to test files. Never shrink the suite.** 294 passing is the floor: your run must be at least 294
  with 0 failures, 0 skipped, 0 todo. A `t.skip()` or `.todo` in a falsifier position is itself the defect.
- Every claim you write in a comment must be true of the code at close. This sprint has already failed its
  claim criterion twice on sentences that were true "one reading over". Prefer a qualified true sentence to
  an unqualified impressive one.
- Where you cannot close something, DISCLOSE it in the code, next to the code — not only in your envelope.

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
Then commit on `wt/S-VLADW1-01-engine` with a message starting `fix(10a):`.

## Envelope — return this as your FINAL message, as JSON, with nothing after it

    {
      "bundle": "10a",
      "ok": true,
      "commit": "<sha>",
      "files_changed": ["..."],
      "suite": { "pass": 0, "fail": 0, "skipped": 0, "todo": 0 },
      "check_ship_exit": 0,
      "inert_control_closed": "<how you proved bootstrap.js's comment no longer satisfies anyCallFound>",
      "probe_fixture_observed_red": "<the actual assertion output you observed>",
      "f4_choice": "widened | disclosed — and why",
      "falsifiers_observed_red": { "F-1": "...", "F-2": "...", "F-3": "..." },
      "residuals_named": ["..."],
      "what_i_could_not_do": ["..."]
    }
