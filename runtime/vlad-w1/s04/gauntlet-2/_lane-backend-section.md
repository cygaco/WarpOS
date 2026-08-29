---

# YOUR LANE — `backend-reviewer` (BINDING)

Scope: **code quality, mechanism correctness, and the enforcers themselves.** You are the lane that runs
things rather than reading about them.

Worktree `C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane`, branch
`wt/S-VLADW1-01-engine`, commit `<<<COMMIT_SHA>>>`. Paths relative to `engine/`.

## YOU OWN S4-2(d). It is owed AGAIN at this run and it is the reason this lane exists.

β row 312: **bundle G changed the predicate, so gauntlet-1's battery run does NOT carry.** A run against a
pre-fix predicate cannot discharge a criterion that is evaluated against the predicate as built. And the
re-run must be done **by a lane, not by ε** — the conductor authored the design the battery validates, so
the conductor must not also be its judge.

**The battery to re-run:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\runtime\vlad-w1\s04\NEAR-MISS-BATTERY.md`
— the design-phase table, run at `b2583d6`, controls-first, 6/6 controls RED, baseline clean, zero files
mutated. That is its content-invariant; the file is the attachment, not the authority.

**Run it against the predicate AS BUILT at this commit**, and:

1. **CONTROLS FIRST.** If the controls do not go RED, the run proves nothing about the near-misses and you
   must report `cannot-assess`, **not** a pass. A green near-miss under a broken control is meaningless.
2. **Population is larger than the original seven.** Row 312 requires it to include **bundle A's
   newly-authored class-form paragraph** and **ZWSP / homoglyph / emphasis / prefix variants** in addition
   to R1's seven near-miss authorings and both em-dash controls.
3. **S4-2(a) requires all seven R1 near-miss authorings RED plus both em-dash controls RED.** Report each
   row individually — a total is not a set of observations.
4. **Restore every mutation.** Confirm `git status --porcelain -- engine/` is empty before you emit. A lane
   after you depends on the tree.
5. **Report the raw output**, per row, with the command line you used. Not a summary of it.

## S4-2(c) — judge the PROPERTY, not a list

Row 312 amended S4-2(c): it is satisfied by matching on the **RENDERED FORM** — normalization, strip of
default-ignorable code points, confusable fold over the token alphabet, markdown-emphasis canonicalization.
**It is not satisfied by an enumeration of the four observed variants, and it is not to be judged against
any category list β once wrote.** Read `canonicalizeClaimText` and ask whether the rendered-form property
holds, then try to break it: feed it forms that render identically and see whether they compare equal, and
forms that render differently and see whether they compare unequal. **A transform that folds too much is
also a defect** — it manufactures false REDs and pushes an author to route around the lint.

Two disclosed residuals here are **re-confirmations, not new findings**: the confusable fold is an
enumeration over a named alphabet set (scripts outside it evade), and separator variance is closed except
the comma. Firing a criterion on either requires **execution-proving something the disclosure does not
already cover**.

## S4-3 and S4-4 — the mechanical criteria

- **S4-3:** sweep for divergence between any shipped claim string and its canonical copy. Bundles H, K and
  L each edited bound prose. **Verify the bind is green AND verify that green means what it should** — a
  bind is green if text matches its stored copy, which is compatible with both being wrong together.
- **S4-4:** RF-1, RF-3, RF-4, RF-5, RF-6, RF-7 must each be **OBSERVED RED under its own mutation at this
  close**, every mutant carrying the no-op⇒FAIL guard. **`pass-total ≠ observation-count`** — read them
  per-description; the count of DESCRIBED mutations must equal the count claimed. A mutant that does not
  mutate, or whose predicate cannot fail, is a finding **even though it is green**.
- **RF-7 must go RED at RUNTIME**, not at text/AST level (that is S4-5's shape). Verify which it is by
  running it, not by reading the test title.

## Code quality on the fix attempt

`git diff b9b8df3..<<<COMMIT_SHA>>>` is the change set. Read it as an engineer, not only as an auditor:

- **Bundle I** coerced `names` to primitives once before deriving the swept population, and annotated the
  `Array.isArray` gate in `src/spawn-shim.js` as **LOAD-BEARING for D1**. Judge whether that annotation is
  in a form a future cleanup would actually respect, and whether the coercion is genuinely once rather than
  once-per-path.
- **Bundle J** widened a ban family (`createRequire` outside `src/spawn-shim.js`) with a **code-level
  structural exemption and deliberately no suppression marker**. Judge that choice. Also confirm the ban
  does not over-refuse.
- **Bundle G**'s transform runs on every comparison. Consider cost and correctness on large documents.
- Look for the failure this sprint keeps producing: **a claim in a comment or header that is stronger than
  the code beneath it.** You are as entitled to file that as the prose lane is.

## Do not

Do not treat `npm run check:pointers` exit 1 as a defect — it is RED BY DESIGN and deliberately outside
`check:ship`. Do not "fix" `engine/test/fixtures/J-expected-bypass/reflective-launcher.js`; it is a
standing witness that is supposed to bypass, and its test asserts exactly that.

## What you own

Deciding lane for **S4-2** (all four sub-clauses) and **S4-4**; contributing on **S4-3** and **S4-5**.
Run each gate as its own command and read its real exit code — never piped through `tail`/`head` in a `&&`
chain. Say `cannot-assess` where you could not look. Fill `files_i_could_not_see` — it is reconciled
against your findings, not filed.
