# BUILD — S-VLADW1-01 CUSTODY, CHUNK 2: the P1 + P2 SCANNERS

You are the **security-builder**. Build **two static scanners and their tests**. Nothing else.

**Not this chunk:** P3's decoy fixture, P4's outbound walk, the quota classifier, the branding guard,
the claim lint. Those are chunks 3–4. If you finish early, **stop and report**.

## SETUP IS DONE — DO NOT REDO IT

**`npm install` is complete and committed. Do NOT run a package manager**, do not modify
`dependencies`, do not touch `vladDependencyPolicy`. The seam modules exist and are green. Your whole
window is for writing the two scanners and their tests. If you are about to install something, stop —
you have misread this brief.

## WHERE

- **Worktree (your only directory):** `C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane`
- **Branch:** `wt/S-VLADW1-01-engine`, HEAD `70fed0d`. **35/35 tests pass — do not break them.** If a
  change turns one red, **report it**; do not edit that test.
- **Your tree:** `<worktree>\engine\`. Never touch the canonical checkout at
  `C:\Users\Vlad\Desktop\Claude\Projects\vlad`, nor the dormant repo-root Next/Supabase scaffold.

## CONTRACT LINE — CITE SOURCE, NEVER A SUMMARY

Ground every claim about a file in the file **as you read it**, cited `path:line` in your return — not
in this brief, **including where they agree**. On this sprint source-reading has corrected the record
eight times, twice preventing wrong behaviour shipping to users. If something here does not match what
you find, **stop and report the mismatch** rather than building to either version.

## READ (short list — over-reading is what killed an earlier window)

- `<worktree>\engine\src\model-seam.js` — specifically `describeAuth()`. **It is your input.**
- `<worktree>\engine\src\spawn-shim.js` — the audited wrapper P2 enforces the use of.
- `<worktree>\engine\src\output-shim.js` — the writer registry P1's surface derives from.
- Acceptance criteria, **S-8 only** (AC-8.1, 8.2, 8.3, 8.5, 8.8):
  `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\S-VLADW1-01\acceptance-criteria.md`

## BUILD TWO SCANNERS

### 1. `engine/scripts/checks/no-held-secret-in-surface.js` (P1)

Scans the **shipped engine package** — `engine/` — **not the repo root**. The repo root holds ~2280
files of dormant web scaffold; a root walk would report a large green surface while proving nothing
about the code that handles the secret. **A wide scan of the wrong tree is weaker than a narrow scan of
the right one and reads stronger**, which is the dangerous combination.

**Match set: the UNION of every secret class, unconditionally.** Take it from
`describeAuth().secretShapes`, which is a frozen constant carrying **both** classes and is
**mode-independent by construction** — `engine/test/seam-boundary.test.js` pins that invariant and it
is mutant-verified. **Never filter by the live mode** (ADR-0041 Amendment 1): a stale live-mode value
would silently narrow the scan and pass GREEN, and both secrets can be present at once because the
fallback seam is engineered and ready. A new seam **ADDS** a class; an **unrecognized seam value fails
closed** rather than scanning nothing.

- **AC-8.1:** fails with the matching file and rule when a held-secret value or seam-declared shape
  appears in the scanned surface.
- **AC-8.8:** a **parse error in any scanned file is RED, never a skip**.
- **AC-8.5:** the scanner's own error, timeout or malformed output → **non-zero**. Never green on crash.

### 2. `engine/scripts/checks/spawn-env-allowlist.js` (P2)

**Both halves are required. Half (b) is the one that matters.**

- **Half (a) — AC-8.2:** every audited spawn passes an explicit allowlist env excluding the held
  secret.
- **Half (b) — AC-8.3:** **any raw `spawn` / `exec` / `fork` (or equivalent) outside the audited
  wrapper is a REFUSAL, not a warning.** A scrubbing wrapper alone is a convention, not a control — it
  re-opens the defect the moment one caller goes around it.
- **AC-8.3 also bans dynamic `require`/`import` with a computed specifier** in the product tree.
  Without that ban the import-graph rule is **bypassable by construction**.
- Same fail-closed rules: parse error → RED; runner error → non-zero.

`spawn-shim.js` is the sanctioned wrapper and must be the sole exception.

## TESTS

Built-in `node --test`, files under `engine/test/`, names from the criteria's `verified_by:` lines.

**Every scanner test must include its NEGATIVE case** — a fixture that *should* trip it, asserted to
trip it. A test proving only the happy path proves the scanner **runs**, not that it **catches**, and a
scanner that silently passes reports a clean surface it never checked. Plant, at minimum: a
seam-shaped secret in a scanned file (P1), a raw `child_process` call outside the wrapper (P2 half b),
and a computed-specifier import. Fixtures must live where the scanner will find them without polluting
the shipped surface — a `test/fixtures/` tree the scanner is pointed at explicitly is fine.

Run `npm test` and report real counts.

## REPORT

What you built; `npm test` counts **actually run**, with failures verbatim; every `path:line` relied
on; anything unverified. **Never claim an AC is satisfied without running its test.** An honest "built,
untested" is worth far more than an overstatement — I verify against the worktree regardless.
