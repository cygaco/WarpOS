# FIX BUNDLE 9d — every named residual must reach the SHIPPED surface (S5), and two false sentences (S2)

Worktree: `C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane\engine` (branch
`wt/S-VLADW1-01-engine`, HEAD `a9e6708`). Work there.

**YOUR FILE — you own exactly one, and nothing else. Four other bundles are running in parallel on
disjoint files. Do not touch any file not listed here.**
- `CUSTODY.md`

**REPAIR ONLY — this is a truthfulness edit, not a redesign.** You add no controls and change no code.

---

## Why this bundle exists

β's release criterion **S5**: *every named residual travels to the recorded/shipped surface.* β ruled
explicitly that a residual disclosed only in WarpOS-side runtime notes does **NOT** satisfy it. Two
independent review lanes found the same failure: several residuals this sprint carefully NAMED exist only
in internal briefs or in test files that **do not ship**. `npm pack --dry-run` resolves a 31-file ship
set; `test/entry-bootstrap.test.js` and `test/env-scrub.test.js` are NOT in it.

**`CUSTODY.md` is the reader's surface.** A user installing this package reads it and nothing else.

## Task 1 — put these four residuals into `CUSTODY.md`

Each is real, each was verified, none is currently on any shipped surface:

1. **`opts.cwd` and `opts.stdio` are not scanned.** `auditedSpawn` refuses secret-shaped content in four
   channels (env keys, env values, command, args) and passes `cwd` and `stdio` through untouched — the
   only occurrences in the shipped tree are the two pass-through lines. It is no longer merely
   theoretical: a secret-shaped value was observed riding through `opts.cwd` into a real child while every
   gate was green. **Honest scope, which you must preserve:** that value is CALLER-SUPPLIED, not a
   credential the engine held, so this is an inconsistency in the wrapper's own shape-refusal surface
   (four channels refused, two not) and **not** an escape of a held credential. Say both halves.
2. **The import walker's mis-resolution residual.** A specifier the resolver mis-resolves *confidently*
   still classifies wrongly; **only the unresolvable case fails closed.** The fail-closed direction is
   already documented internally; this converse is not, anywhere.
3. **`node:` builtins evaluate first.** Named as a ceiling only in a test file that does not ship. The
   shipped mention states the fact in passing inside an argument about something else; it is never
   labelled as a standing residual. Label it.
4. **Preload precedes everything.** `NODE_OPTIONS`, `--require` and `--import` evaluate before the entry's
   ESM graph, so "nothing can run before the scrub" is bounded by them. Reaching it requires control of
   the launch command line, which is outside the shipped launch shape — **say that too**, so the entry is
   calibrated rather than alarming. This residual is currently on NO surface at all, shipped or internal.

## Task 2 — the rotation semantics, stated with the correct valence

`src/env-scrub.js`'s RESIDUAL 1 currently describes the behaviour as *absorbing* a mid-session credential.
That is true **only** when the captured slot was `undefined`. Verified by execution:

```
C1 captured at startup: PROBE-OLD-VALUE
C2 env now holds:       PROBE-ROTATED-VALUE
C3 env after re-scrub:  undefined
C4 getCapturedCredential now: PROBE-OLD-VALUE
C5 ROTATED VALUE REACHABLE ANYWHERE? NO -- rotated value DESTROYED, stale value still served
```

So when a real value was captured at startup and the operator **rotates** the credential mid-session, the
re-scrub keeps the stale value, deletes the new one, and the fallback goes on serving the stale credential
**with no error and no signal**. That is user-visible and currently described with the opposite valence.

State it plainly in `CUSTODY.md`. (A parallel bundle owns the same correction inside
`src/env-scrub.js`'s own header — you own the shipped surface. Do not edit that file.)

## Task 3 — two false/misleading sentences in your file

- **`CUSTODY.md:87`** asserts "the test-node name reserved for it lives in `test/custody-runtime.test.js`".
  **It does not.** `grep -c "selfcheck-runs-on-user-machine" test/custody-runtime.test.js` → **0**, and
  `check:pointers` classifies that pointer `missing-name`. Shipped copy asserts a presence that is absent.
  AC-8.6 genuinely did not land; keep saying so, but stop implying scaffolding that does not exist.
- **`CUSTODY.md:66`** re-introduces the weak *"first statement, before any of that file's own subsequent
  code runs"* framing that this sprint's own restructure repudiated, and names only `src/server-entry.js`,
  leaving its raw-launch conclusion unsupported for the driver entry — which is also a real scrub site.
  Re-derive the sentence. The true form: the only modules evaluating before the scrub call are the
  zero-import `src/env-scrub.js` and the re-export-only `src/bootstrap.js`; `node:` builtins still resolve
  first. Name **both** entries.

---

## The constraint that matters most

`custody-claim-lint.js` verbatim-checks parts of this file against constants in the source. **Run
`npm run check:ship` and `npm test` after editing and make sure both still pass** — if a lint binds a
sentence you reworded, you will see it, and the answer is to keep the binding satisfied, never to relax
the lint.

**Preserve the PROVE/ASSERT boundary.** ADR-0041's rule: a proven claim may never share a status token
with an asserted ceiling. Everything you add here is a **ceiling/residual**, not a proven claim. Do not
let any of it drift into the Proven section or acquire a PROVEN status token.

**Do not oversell any repair.** These entries exist because this sprint kept shipping claims that outran
their controls. An honest, slightly uncomfortable sentence is the deliverable.

## Definition of done

1. All four residuals from Task 1 present in `CUSTODY.md`, each with its honest scope.
2. Rotation semantics stated with the correct valence.
3. `CUSTODY.md:87` and `:66` corrected.
4. `npm test` exit 0 and `npm run check:ship` exit 0. Report both exit codes — run each as its own
   command and read its real exit code; **never pipe a gate through `tail` in a `&&` chain.**
5. `git status --porcelain` shows only `CUSTODY.md` modified.

## Report back (≤25 lines, plain text, no .md file)

- the two exit codes
- the four residual entries you added, quoted
- the rotation sentence, quoted
- anything you could not do, named plainly.
