# FIX BUNDLE 9b — the wiring proof must assert INVOCATION, not reachability (S3, as a CLASS)

Worktree: `C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane\engine` (branch
`wt/S-VLADW1-01-engine`, HEAD `a9e6708`). Work there. Run `npm test` from that directory.

**YOUR FILE — you own exactly one, and nothing else. Four other bundles are running in parallel on
disjoint files. Do not touch any file not listed here.**
- `test/env-scrub.test.js`

**REPAIR AND WIRING ONLY.** No new controls. You are correcting what an existing standing proof asserts.

---

## The defect, execution-proven

Deleting the scrub call from `driver/host-free-driver.js:49`:

```
sed -i 's/^initCredentialCustody(CREDENTIAL_ENV_NAMES);$/\/\/ MUTANT-REMOVED/' driver/host-free-driver.js
npm test              -> 271 pass / 0 fail   EXIT 0
npm run check:ship    -> EXIT 0
npm run check:custody -> EXIT 0
node --test test/entry-bootstrap.test.js -> 15/15 pass
```

**Every gate stays green.** The same mutation on `src/server-entry.js` correctly goes RED (268 pass / 3
fail). So the driver entry's scrub call is **not load-bearing and no control detects its removal** — one
of the two entries has no standing proof at all.

**Root cause**, at `test/env-scrub.test.js:460`: the A1 wiring proof computes

```js
const reachesScrub = visited.has(envScrubPath);
```

That is **REACHABILITY of the module, not INVOCATION of the call.** The driver reaches `env-scrub.js`
three independent ways (`bootstrap.js`, `model-seam.js`, `spawn-shim.js`), so the module is "reached"
whether or not anybody calls the function. This is precisely the *"the scrub rides in on an import it
would need for an unrelated reason"* anti-pattern that `src/env-scrub.js`'s own header (lines 122-132)
names as what makes a mutant proof meaningless. The reasoning was applied to `server-entry.js` and never
carried to the driver.

## Task 1 — assert INVOCATION, for EVERY entry the walker classifies

Fix this as a **CLASS, not per-entry**. Do not add a bespoke driver assertion beside the server one — that
just leaves the third entry point unprotected when someone adds it.

For every entry point the walker derives (it derives them from `package.json#files` — keep that; it is the
right source), assert that the entry **actually calls** `initCredentialCustody(...)`, not merely that it
can reach the module. Reading each derived entry's own source for the call is acceptable and simple; if
you can additionally observe the call happening at runtime, better. State in a comment which of the two
you implemented and what it does NOT cover.

Keep the existing both-directions non-vacuity control at `env-scrub.test.js:482` (`some(canSpawn)` AND
`some(!canSpawn)`) — a reviewing lane verified it genuinely discriminates. **Do not weaken it.** Extend
the same discipline to the new assertion: a walker that classifies every entry as "invokes" would pass a
naive `some(invokes)` check while discriminating nothing.

## Task 2 — commit BOTH mutations as standing regression tests

The bar is *observed RED*, not *fixture exists*.

- **Driver mutant:** delete `initCredentialCustody(CREDENTIAL_ENV_NAMES);` from
  `driver/host-free-driver.js` → the walker test goes RED. Commit this as a re-runnable test that
  performs the mutation against a COPY (never mutate the real tree at test time) and asserts the
  assertion fails.
- **Server mutant:** the same for `src/server-entry.js`, so the existing coverage is a committed
  regression rather than an incidental one.

Run each, observe RED, and quote the real failure output in your report. **A fixture you have not seen
fail proves nothing** — that is the whole lesson of this sprint.

## Task 3 — the walker's own residual, stated where the walker lives

The walker's disclosed residual — *"a specifier the resolver mis-resolves CONFIDENTLY still classifies
wrongly; only the unresolvable case fails closed"* — appears nowhere at all, not even beside the
classifier that implements it. Put it in a comment next to the classifier. (A separate bundle owns
getting it onto the SHIPPED surface; you own stating it where the code is.)

---

## Watch out for this

`src/env-scrub.js` is being changed in parallel by another bundle (its capture map and one header
paragraph). Your file imports it. If your suite goes red on something you did not touch — a changed
`getCapturedCredential` return contract, say — **do not "fix" it by loosening your assertion.** Report it
as an integration collision and leave it visible. The conductor integrates.

## Definition of done

1. `npm test` from the engine dir: exit 0, pass count UP. Report the exact count.
2. Both mutants committed as re-runnable tests, **each observed RED**, with the failure output quoted.
3. The invocation assertion covers every derived entry as a class — adding a third entry point that
   reaches but never calls the scrub would go RED without anyone editing the test.
4. `git status --porcelain` shows only `test/env-scrub.test.js` modified.

## Report back (≤25 lines, plain text, no .md file)

- exact pass/fail counts before and after
- the two RED observations, with real commands and real failure text
- which invocation-detection technique you used and what it does NOT cover
- anything you could not do, named plainly. An honest gap beats a quiet one.
