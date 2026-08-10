# BUILD — CUSTODY CHUNK 3a: P3 decoy fixture + P4 outbound walk (BUILD ONLY)

You are the **security-builder**. Build **two enforcers and their tests**. **Do NOT run the mutant
verification** — that is chunk 3b, deliberately split off because two break-verify-restore cycles are
run-dominated and would eat this window.

**Your interface sheet is a verified read** — contracts read at source with `path:line` by the
conductor. **Read the sheet, not the tree.**

`C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\runtime\vlad-w1\INTERFACE-SHEET-custody.md`

Read **§1** (`describeAuth()` — your input), **§2** (the audited wrapper), **§4** (P3/P4 clauses),
**§5** (plants), **§6** (environment). **If anything contradicts the sheet, STOP AND REPORT.**

## WHERE

- **Worktree:** `C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane`, branch
  `wt/S-VLADW1-01-engine`, HEAD `69a04e1`. **49/49 tests pass — do not break them.** Report a red
  rather than editing the test that went red.
- Never touch the canonical checkout or the dormant repo-root scaffold.
- **`npm install` is done.** Do not run a package manager.

## THE AC-1.3 TRAP — read before writing (it cost an earlier chunk a fix-cycle)

`engine/test/seam-boundary.test.js` **text-scans every JS file** (except the seam and itself) and
fails on a quoted `subscription` or `api-key` literal, or **any** occurrence of the seam's env-var
name. **It does not parse — comments count.** So: never retype a secret shape, a mode value, or the
env-var name anywhere, including in a comment. Pull shapes from `describeAuth().secretShapes`, mode
values from `AUTH_MODES`, and the env-var name from the exported `AUTH_MODE_ENV_VAR`.

Note one live subtlety: one secret **class** is spelled identically to one auth **mode**, and the scan
cannot tell them apart. Assert through `envVar` rather than `class` where you can.

## 1. P3 — `engine/test/credential-custody-decoy.test.js` (NEW FILE)

**This file SHIPS. It is not dev-time tooling.** `package.json#files` carves it in explicitly while
excluding the rest of `test/`, because ADR-0041's **A5 firing point** requires the custody enforcers
to run in the **user's install** — an enforcer that runs only in our CI proves something about our
source and nothing about their runtime. Treat it as a shipped runtime control that happens to wear a
`.test.js` extension. Keep it self-contained and dependency-free accordingly.

**AC-7.2 — one decoy PER SECRET CLASS, not one overall.** Iterate `describeAuth().secretShapes`; for
each, plant a decoy value in the ambient env under that shape's `envVar`, spawn a child **through the
audited wrapper**, and assert the child cannot observe **any** planted decoy. One decoy overall would
prove the scrub only for whichever class it happened to represent.

`describeAuth().sentinelHook(childEnv)` returns `{ leaked, keys }` and reports **key names only, never
values** — use it rather than writing your own comparison, and never print a decoy value.

## 2. P4 — `engine/scripts/checks/no-secret-on-outbound.js` (NEW FILE)

**Outbound-request call-site walk.** The **SDK auth call is the sole permitted carrier** of the held
secret. Any other outbound call site carrying it fails the build. Raw HTTP-client use (`fetch`,
`http.request`, `https.request`, `undici`, `axios`) **outside the seam module** is a refusal, not a
warning.

**Claim scope — state it in the file header, precisely.** P4 is PROVEN at **call-site scope**: it
proves the held secret is **not attached to a non-auth outbound call**. It does **not** prove a
destination is safe, and **dependency-initiated egress folds into ADR-0041's A1 ceiling** — those 109
transitive packages, including two HTTP server stacks, are outside P4 and inside A1. Do not let the
header imply "nothing can leak".

**Shipped-tree boundary + fail-closed**, same as P1/P2: scan the engine package, not the repo root;
parse error → RED, never skip; runner error/timeout/malformed output → non-zero, never green on crash.
Model the CLI on `no-held-secret-in-surface.js` and reuse its helpers rather than duplicating them.

## 3. Tests — append to `engine/test/custody-static.test.js`

**APPEND, do not rewrite** — it holds the AC-7.1, P1 and P2 tests, and a rewrite would silently drop
them. A suite that shrinks while staying green is the quietest regression available.

Cover: P4 clean on the real surface; and **plants** under `engine/test/fixtures/` (follow the existing
layout), pointed at explicitly:
- a non-auth outbound call carrying a held-secret-shaped value → **RED**;
- a raw HTTP client used outside the seam → **RED**;
- an unparseable file in P4's surface → **RED, not skipped**.

**Build the plants and their assertions now — 3b will run the deliberate-break mutants against
them.** Design so a mutant is easy: keep P4's detection patterns as named module-level constants.

## REPORT

What you built; `npm test` counts **actually run**, failures verbatim; any sheet/code mismatch; every
`path:line` you personally confirmed; anything unverified. **Never claim an AC is satisfied without
running its test.** If the window runs short, land **P3 first** — it is the shipped control.
