# BUILD — CUSTODY CHUNK 2b: the P2 scanner + its test

You are the **security-builder**. Build **one scanner and append its tests**. Nothing else.

**Your interface sheet is a verified read** — every contract in it was read at source with `path:line`
refs by the conductor. **Read the sheet, not the whole codebase.** A previous dispatch spent its entire
window re-reading source and wrote nothing; the sheet exists so your window goes to writing.

`C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\runtime\vlad-w1\INTERFACE-SHEET-custody.md`

Read **§2** (the spawn wrapper — the sanctioned exception), **§4** (P2's clause), **§5** (the plants),
**§6** (environment). You may open a file to confirm a specific line; do not re-read the tree.

**The contract still binds:** if anything you touch **contradicts the sheet, STOP AND REPORT** rather
than building to either version.

## NOT THIS CHUNK

P3, P4, the quota classifier, the branding guard, the claim lint. If you finish early, **stop and
report**.

## SETUP IS DONE

`npm install` is complete and committed. **Do not run a package manager**, do not modify
`dependencies`, do not touch `vladDependencyPolicy`.

## WHERE

- **Worktree (your only directory):** `C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane`
- **Branch:** `wt/S-VLADW1-01-engine`, HEAD `ad3ccc3`. **44/44 tests pass — do not break them.** If a
  change turns one red, **report it**; do not edit that test.
- Never touch the canonical checkout at `C:\Users\Vlad\Desktop\Claude\Projects\vlad`, nor the dormant
  repo-root Next/Supabase scaffold.

## READ THIS BEFORE YOU WRITE A LINE — the last chunk landed RED here

Chunk 2a's tests were rejected by an existing enforcer, `AC-1.3` in
`engine/test/seam-boundary.test.js`. It **text-scans every JS file** in the engine tree (except the
seam and itself) and fails on:
- a quoted `subscription` or `api-key` literal — **use `AUTH_MODES`**;
- **any** occurrence of the seam's env-var name — **import `AUTH_MODE_ENV_VAR`** from
  `src/model-seam.js`.

It **does not parse** — it reads content, so **comments count too**. Do not retype a secret shape, a
mode value, or the env-var name anywhere, including in a comment. Pull shapes from
`describeAuth().secretShapes` and names from the seam's exported constants. This will save you a
fix-cycle.

## BUILD: `engine/scripts/checks/spawn-env-allowlist.js` (P2)

**Both halves are required, and half (b) is the one that matters.**

- **Half (a) — AC-8.2:** every audited spawn passes an **explicit allowlist env excluding the held
  secret**. Denylisted names come from `describeAuth().envDenylist` (sheet §1) — do not retype them.
- **Half (b) — AC-8.3:** **any raw `spawn` / `exec` / `fork` / `execFile` (or equivalent
  `child_process` use) outside the audited wrapper is a REFUSAL, not a warning.** A scrubbing wrapper
  alone is a convention, not a control — it re-opens the defect the moment one caller goes around it.
  `src/spawn-shim.js` is the **sole** sanctioned exception.
- **Also AC-8.3:** ban **dynamic `require`/`import` with a computed specifier** in the product tree.
  Without it the import-graph rule is **bypassable by construction**.
- **Fail-closed (AC-8.8, AC-8.5):** a **parse error in any scanned file is RED, never a skip**; the
  scanner's own error, timeout or malformed output → **non-zero**. Never green on crash.
- **Shipped-tree boundary (sheet §4):** scan the **engine package**, not the repo root.

Model the CLI on the existing `no-held-secret-in-surface.js` — same report shape, same exit
discipline, same fail-closed `main()` wrapper. Reuse its helpers where sensible rather than
duplicating them.

## TESTS — append to `engine/test/custody-static.test.js`

**APPEND. Do not rewrite.** That file already holds the AC-7.1 and P1 tests; a rewrite would silently
drop them, and a suite that shrinks while staying green is the quietest regression available.

**Your negative plants are MANDATORY** (sheet §5) — each asserted to trip the scanner:
- a **raw `child_process` call outside the wrapper** → P2 half (b) goes **RED**;
- a **dynamic import with a computed specifier** → **RED**;
- an **unparseable file** in the scan surface → **RED, not skipped**.

Plants live under `engine/test/fixtures/` with the scanner pointed at them **explicitly**, so they
never pollute the shipped surface. Follow the layout the P1 plants already use.

A test proving only the happy path proves the scanner **runs**, not that it **catches**. Also assert
the real engine surface scans **clean** — the wrapper itself must be recognised as the sanctioned
exception rather than flagged.

Run `npm test` and report real counts.

## REPORT

What you built; `npm test` counts **actually run**, failures verbatim; any sheet/code mismatch; every
`path:line` you personally confirmed; anything unverified. **Never claim an AC is satisfied without
running its test.**
