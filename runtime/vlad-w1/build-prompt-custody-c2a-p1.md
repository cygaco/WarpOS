# BUILD — CUSTODY CHUNK 2a: the P1 scanner + its test

You are the **security-builder**. Build **one scanner and one test file**. Nothing else.

**Your interface sheet is `runtime/vlad-w1/INTERFACE-SHEET-custody.md`** (WarpOS-side, absolute path
below). **It is a verified read** — every contract in it was read at source with `path:line` refs by
the conductor. **Read the sheet, not the whole codebase.** A previous dispatch spent its entire
9-minute window re-reading source and wrote nothing; the sheet exists so your window goes to writing.

`C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\runtime\vlad-w1\INTERFACE-SHEET-custody.md`

Read **§1** (the seam — your input), **§4** (P1's clause), **§5** (the plants), **§6** (environment).
You may open a source file to confirm a specific line, but do **not** re-read the tree.

**The contract still binds:** if anything you touch **contradicts the sheet, STOP AND REPORT** the
mismatch rather than building to either version.

## NOT THIS CHUNK

P2's scanner (chunk 2b), P3, P4, the quota classifier, the branding guard, the claim lint. If you
finish early, **stop and report**.

## SETUP IS DONE

`npm install` is complete and committed. **Do not run a package manager**, do not modify
`dependencies`, do not touch `vladDependencyPolicy`.

## WHERE

- **Worktree (your only directory):** `C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane`
- **Branch:** `wt/S-VLADW1-01-engine`, HEAD `70fed0d`. **35/35 tests pass — do not break them.** If a
  change turns one red, **report it**; do not edit that test.
- Never touch the canonical checkout at `C:\Users\Vlad\Desktop\Claude\Projects\vlad`, nor the dormant
  repo-root Next/Supabase scaffold.

## BUILD: `engine/scripts/checks/no-held-secret-in-surface.js` (P1)

**Scans the engine package (`engine/`), NOT the repo root** — sheet §4, shipped-tree boundary.

**Match set comes from `describeAuth().secretShapes`** — sheet §1. It is the **UNION** of both secret
classes and is **mode-independent by construction**; that invariant is mutant-verified. **Do not filter
by `.mode`. Do not hardcode a duplicate list.** Each shape carries `class`, `envVar` and
`patternSource` (a regex source string).

Scan surface per sheet §4: committed files, log-writing call sites, telemetry payload builders. Derive
the file surface from the engine package; `src/output-shim.js`'s writer registry (sheet §3) is the
intended long-term source of write targets — use it if it helps, but do not rewire the engine's
existing writers onto it (that is a later chunk).

**Behaviour:**
- **AC-8.1** — fail with the **matching file and rule** when a held-secret value or seam-declared shape
  appears in the scanned surface; pass only when none is present.
- **AC-8.8** — a **parse error in any scanned file is RED, never a skip**.
- **AC-8.5** — the scanner's own error, timeout or malformed output → **non-zero**. Never green on
  crash.
- An **unrecognized seam value fails closed** rather than scanning nothing.

Exit non-zero on any finding; print the file and the rule that matched. Do not print the secret value.

## TEST: `engine/test/custody-static.test.js`

This file **already exists** (chunk 1b put the AC-7.1 spawn-wrapper tests in it). **Append** your P1
tests; do not rewrite what is there.

**Your negative plants are MANDATORY** — sheet §5. Minimum:
- a **seam-shaped secret value** planted in a scanned file → P1 goes **RED**;
- an **unparseable file** in the scan surface → **RED, not skipped**.

Plants live under `engine/test/fixtures/` with the scanner pointed at them **explicitly**, so they
never pollute the shipped surface. A test proving only the happy path proves the scanner **runs**, not
that it **catches** — and a scanner that silently passes reports a clean surface it never checked.

Use `verified_by:` names from the criteria where they exist. Run `npm test` and report real counts.

## REPORT

What you built; `npm test` counts **actually run**, failures verbatim; any sheet/code mismatch; every
`path:line` you personally confirmed; anything unverified. **Never claim an AC is satisfied without
running its test** — an honest "built, untested" beats an overstatement, because I verify against the
worktree regardless.
