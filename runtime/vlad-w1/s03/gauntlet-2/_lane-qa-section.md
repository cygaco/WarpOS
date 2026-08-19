
---

## YOUR LANE — `qa-reviewer` (functional + traceability + integrity, BINDING)

**Working tree — read and run from here:**
`C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane\engine`

You have Read/Grep/Glob/Bash. **Use them.** Run the suite yourself; do not take `271/271` on faith.

### Your three scopes, in priority order for this run

**1 — INTEGRITY (this is where S2 and S5 live, and it is the heaviest scope).**

The predecessor sprint failed its release on exactly this: shipped copy claiming more than its control
delivered. ADR-0041's PROVE/ASSERT boundary says **a proven claim may never share a status token with an
asserted ceiling.**

- Read `CUSTODY.md` end to end. For **every** claim in the Proven section, find the control, confirm it
  is wired into `check:custody`/`check:ship`, and confirm it actually runs. A claim whose control is
  present-but-unwired, or wired-but-vacuous, is an S2 finding.
- **S5 is new and is yours.** Take the residual list from the header (node: builtins; mid-session
  credential is captured-not-ignored; worker-thread realm; confident-mis-resolution in the walker;
  `opts.cwd`/`opts.stdio` unscanned; A6 unbound claim strings; P2 raw-launch matcher-family ceiling;
  AC-8.6 absent). For **each one**, answer: **does it appear in the SHIPPED surface** (`CUSTODY.md`, a
  code header that ships, a `package.json` field, driver output)? A residual that lives only in
  WarpOS-side runtime notes **fails S5**. Give a per-residual table.
- Check the reverse direction too: does the shipped copy assert any residual that is actually **closed**?
  Over-hedging is a smaller defect but it is still an inaccuracy.
- AC-8.6 is absent and `CUSTODY.md:86` discloses it. **Is that disclosure adequate?** Read the
  surrounding text and judge whether a user reading `CUSTODY.md` would come away with a true picture.

**2 — TRACEABILITY.**

- `ac-pointer-manifest.json` + `scripts/checks/lib/ac-manifest.js` are new (β Q2 option b). Verify: is it
  generated-by-observation with a do-not-edit banner? Are the two checks' scopes honestly stated
  (product-side resolution everywhere; staleness dev-side only)? **Does a skip read as pass anywhere?**
  β ruled skip must be `NO_DATA`/RED, never green. Try to make a check skip and see what it reports.
- `npm run check:pointers` is exit 1 with 33/48 resolving. Audit the 15 unresolved: 11 `missing-name`, 4
  `missing-file`. Are they clerical drift or missing WORK? The predecessor's tracker undercounted this
  (claimed 7, actual 15) — **count them yourself and report the number you counted.**
- F-5: does a `verified_by` naming a real file with a missing test node go RED, and is it
  **distinguishable** from a missing file? Construct the case and run it.

**3 — FUNCTIONAL.**

- Run `npm test`, `npm run check:ship`, `npm run check:pointers`. Report each exit code you observed —
  **run each as its own command and read its real exit code; never pipe a gate through `tail`/`head` in a
  `&&` chain.**
- Bundle 8d touched `src/job-manager.js`, `src/quota.js` and the cancel/lifecycle/driver tests. Did those
  changes preserve the job state machine's enumerated transition table and the crash-survivable journal?
  Look for a test that was *weakened* rather than fixed.
- **Watch for tests that flipped green by having their assertion loosened.** Three tests legitimately
  flipped this sprint because the debt they surfaced was paid (the branding test, the env-scrub
  "first statement" assertion, the tautology lint's occurrence count). Each should carry an in-place
  annotation distinguishing "flipped because debt paid" from "flipped because someone wanted green."
  **Verify that annotation exists and is TRUE for each.** If a fourth test flipped without one, that is a
  finding.

### Scope discipline

- Findings only, no refactor proposals.
- `execution_proven: true` only for something you ran, with the command in `how_proven`.
- Put anything you could not assess in `what_i_could_not_assess`. **`NO_DATA` and `t.skip` are not a
  pass** — if a check skipped, say it skipped.
- Leave the worktree clean; verify with `git status --porcelain`.
