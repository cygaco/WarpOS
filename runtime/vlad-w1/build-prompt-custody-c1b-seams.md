# BUILD — S-VLADW1-01 CUSTODY, CHUNK 1b: the SEAMS (install already done)

You are the **security-builder**. Build **three seam modules**. Nothing else.

## READ THIS FIRST — THE SETUP IS ALREADY COMPLETE

**`npm install` is DONE. The dependency is added, verified and committed. DO NOT reinstall, do not run
`npm install`, do not modify `dependencies`, and do not touch the `vladDependencyPolicy` block.**

A previous chunk spent its entire 9-minute window on that install and was cut off before writing any
code. That work is banked at commit `393d971`: `@anthropic-ai/claude-agent-sdk@0.3.221` is present,
`node_modules` is populated (109 packages), and the A1 justification is written. **Your whole window is
for writing source.** If you find yourself about to run a package manager, stop — something has gone
wrong with your reading of this brief.

## WHERE

- **Worktree (your only directory):** `C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane`
- **Branch:** `wt/S-VLADW1-01-engine`. Engine lane is committed and green — **25/25 tests pass**.
- **Your tree:** `<worktree>\engine\`. Never touch the canonical checkout at
  `C:\Users\Vlad\Desktop\Claude\Projects\vlad`, nor the dormant repo-root Next/Supabase scaffold.
- **Do not break the 25 passing tests.** If a change turns one red, report it — do not edit that test.

## CONTRACT LINE — CITE SOURCE, NEVER A SUMMARY

Ground every claim about a file in the file **as you read it**, cited `path:line` in your return — not
in this brief, **including where they agree**. On this sprint, source-reading corrected the record
eight times; twice it prevented shipping wrong behaviour to users. If something here does not match
what you find, **stop and report the mismatch** rather than building to either version.

## READ (short list — resist reading more, that is what killed the last window)

- `<worktree>\engine\src\spawn-shim.js` and `output-shim.js` — the engine lane left these as **shims for
  you to own**. Read them before replacing; the engine consumes them.
- The acceptance criteria file, **S-1 (AC-1.1–1.4) and AC-7.1 ONLY**:
  `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\S-VLADW1-01\acceptance-criteria.md`

## BUILD EXACTLY THREE MODULES

### 1. Model-access seam (AC-1.1–1.4)
The **only** module that knows the live auth mode, touches credential material, or constructs the SDK
client. Exports:
- a **session factory** — consumers get a handle, **never a token**;
- **`describeAuth()`** → `{ mode, secretShapes, envDenylist, sentinelHook }`, the single source later
  chunks consume for P2's env denylist and P3's decoy fixture.

**Binding:** no auth-mode conditional and no mode literal outside this module (AC-1.3) — mode-branching
in consumers is what turns a seam swap into a rework.

**Posture:** subscription-primary — the user's own Claude subscription, local MCP, **no developer
credentials anywhere in the path**. API-key is the engineered **fallback**, reachable by swapping the
seam rather than editing consumers (AC-1.2).

### 2. Audited spawn wrapper (AC-7.1)
The **single** sanctioned path for creating a child process. Passes an explicit **allowlist** env
excluding the held secret; ambient credential state is never inherited. Every engine spawn site routes
through it. Note `registry.js` in WarpOS already practises the adjacent discipline — it logs paths
**relative to `os.homedir()`**, commented "never log absolute paths". Preserve that; do not rediscover it.

### 3. Audited output module
The **writer registry** P1's scan surface will later derive from. Every product-written output (journal,
receipts, logs, config) routes through it. Build it so a writer registered outside it *can* be refused —
the enforcer that *does* refuse is a later chunk.

## TESTS

Built-in `node --test`, files under `engine/test/`, names taken from the criteria's `verified_by:` lines.
This chunk: **AC-1.3** (no mode literal outside the seam), **AC-1.4** (`describeAuth()` is the single
source), **AC-7.1** (spawn sites use allowlist env). Run `npm test` and report the real count.

## SCOPE DISCIPLINE

If the window runs short, land the **seam module and its tests first** — the other two chunks depend on
`describeAuth()`. Report what you did not reach rather than half-finishing all three.

## REPORT

What you built; `npm test` counts **actually run**; every `path:line` relied on; anything unverified.
**Never claim an AC is satisfied without running its test.** An honest "built, untested" is worth far
more than an overstatement — I verify against the worktree regardless.
