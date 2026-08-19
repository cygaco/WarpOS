# FIX BUNDLE 9e — the captured snapshot must be prototype-proof, and its getter must return a string

Worktree: `C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane\engine` (branch
`wt/S-VLADW1-01-engine`, HEAD `a9e6708`). Work there. Run `npm test` from that directory.

**YOUR FILES — you own these two and nothing else. Four other bundles are running in parallel on disjoint
files. Do not touch any file not listed here.**
- `src/env-scrub.js`
- `test/env-scrub-capture.test.js` — **NEW file, create it.** `test/env-scrub.test.js` belongs to another
  bundle running right now; **do not open it.**

**REPAIR ONLY.** No new controls, no redesign of the custody model.

---

## The defect, found by the cross-family review lane and confirmed by execution

`initCredentialCustody` builds its snapshot as `const snapshot = {}` — an ordinary object carrying
`Object.prototype`. Probe against the real module (values are `PROBE-VALUE-NOT-A-REAL-SECRET`; no real
credential was involved):

```
A0 env own '__proto__'? true | val: PROBE-VALUE-NOT-A-REAL-SECRET
A1 env val after scrub: {}
A2 getCapturedCredential('__proto__') typeof: object | === Object.prototype: true
A3 VALUE PRESERVED? NO -- LOST

B1 env val after re-scrub: [Function: toString]
B2 getCapturedCredential('toString') typeof: function
B3 VALUE PRESERVED? NO -- LOST
```

Two distinct bugs:

1. **`__proto__` assignment hits the setter**, so no own property is created and the value is simply lost;
   `getCapturedCredential("__proto__")` then returns **`Object.prototype`**.
2. **Wider than that:** the re-scrub absorb branch is guarded by `nextCaptured[name] === undefined`, which
   is FALSE for *any* `Object.prototype` key. So `toString`, `constructor`, `valueOf`, `hasOwnProperty`
   skip the absorb path entirely, and the getter returns **a function**.

**Honest severity, and keep it honest in what you write:** this is **not** a leak and does not fire the
release's S1 criterion. `names` is caller-supplied and every shipped caller passes a fixed list
(`CREDENTIAL_ENV_NAMES` / `ENV_DENYLIST`); no prototype key is on either. Nothing escapes to a child. It is
a robustness defect in a security primitive plus a **type-confusion in its getter** — a credential accessor
that can return a non-string. MEDIUM. Do not inflate it into a leak in any comment you write.

## Task 1 — prototype-proof the capture

Build the snapshot with a null prototype (`Object.create(null)`), and guard every read of it with an
own-property check rather than a bare `=== undefined`. Both halves are needed: a null-prototype object
fixes the aliasing, and own-property checks fix the absorb-branch predicate, which is a separate bug that
would still misbehave against a legitimately-`undefined`-valued own key.

Keep the existing **absorption** semantics exactly as they are: a name whose captured slot already holds a
real value is never overwritten. That rule exists because a naive full re-capture would read `undefined`
for already-deleted names and silently destroy the captured credential. **Do not change it while fixing
the prototype bug.**

## Task 2 — `getCapturedCredential` returns string-or-`undefined`, only

Make that its contract, enforce it in the implementation, and state it in the JSDoc. A credential accessor
must never hand back an object or a function under any input.

## Task 3 — the rotation residual, stated with the correct valence

The header's RESIDUAL 1 says a later call **ABSORBS** a mid-session credential. That is true only when the
slot was `undefined`. Verified by execution:

```
C1 captured at startup: PROBE-OLD-VALUE
C2 env now holds:       PROBE-ROTATED-VALUE
C3 env after re-scrub:  undefined
C4 getCapturedCredential now: PROBE-OLD-VALUE
C5 ROTATED VALUE REACHABLE ANYWHERE? NO -- rotated value DESTROYED, stale value still served
```

On a genuine **rotation** the re-scrub keeps the stale value, deletes the new one from `process.env`, and
the fallback goes on serving the stale credential with **no error and no signal**. Rewrite RESIDUAL 1 to
say that plainly.

**This is a documentation fix, not a behaviour change.** Per β row 305 Q4, the decision (absorb, never
overwrite) stands and its consequence is disclosed rather than engineered away — silently preferring the
new value would break the very fallback the absorb rule protects. Say which behaviour was chosen and why,
so the next reader does not "fix" it.

## Task 4 — a stale comment this sprint's own restructure made false

`src/env-scrub.js:101-108` says `model-seam.js`, `server-entry.js` and `host-free-driver.js` "each import
`./env-scrub.js` / `../src/env-scrub.js`". Both **entries** now import `bootstrap.js`, not `env-scrub.js`
— bundle 8a changed that and these lines were never revisited. The conclusion still holds (`bootstrap.js`
re-exports the same module instance, so it IS the same singleton); the stated mechanism does not. Correct
the mechanism, keep the conclusion.

## Task 5 — commit the probes as standing tests, in your NEW file

In `test/env-scrub-capture.test.js`, cover: `__proto__` as a name; a prototype-method name such as
`toString`; the getter's return type on both; and the rotation sequence pinning the chosen semantics. Each
must **fail against the current code** — verify that by running them before your fix, or by reverting your
fix briefly — and pass after. Quote one real RED observation in your report. **A fixture you have not seen
fail proves nothing.**

---

## Watch out for this

`test/env-scrub.test.js` is owned by a parallel bundle and imports your module. If your suite goes red in
a file you do not own, **do not open it and do not loosen anything** — report it as an integration
collision. The conductor integrates.

## Definition of done

1. `npm test` exit 0, pass count UP. Report the exact count.
2. `npm run check:ship` exit 0.
3. At least one RED-before-fix observation quoted with its real output.
4. `git status --porcelain` shows only `src/env-scrub.js` and the new test file.

## Report back (≤25 lines, plain text, no .md file)

- pass/fail counts before and after; both exit codes
- the RED-before-fix observation, with real output
- the rewritten RESIDUAL 1, quoted
- anything you could not do, named plainly.
