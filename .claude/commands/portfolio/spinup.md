---
description: "Get the thinnest runnable slice of a fresh product's core loop on screen, fast — local-first, no backend, installable PWA — with a verify-before-claim gate (build clean + dev server serves + entry module transforms)."
user-invocable: true
---

# /portfolio:spinup — Core loop on screen, fast

Codifies the fastest safe path from a fresh `/portfolio:new` product to a
**runnable first slice of its core loop**: identify the Core-5 loop, pick a
local-first no-backend stack, record a stack ADR, scaffold directly, and
**prove it actually serves** before claiming done.

This is the lightweight alternative to `/sprint:full` for a product's very
first slice. `/sprint:full` is the heaviest path; the adhoc build chain can
phantom-dispatch (WG-6). Spinup is direct + foreground + verified.

## When to use

- A fresh product (just scaffolded by `/portfolio:new`) with a clone brief
  and/or `PROJECT.md` but no runnable app yet.
- You want the core loop validated on screen before front-loading infra.

Do NOT use for: mature apps (use `/sprint:full` or adhoc), backend-heavy
products where local-first doesn't fit (override the stack bias below).

## Input

`/portfolio:spinup [--stack <override>] [--no-pwa] [--keep-running]`

Default stack bias (proven, overridable): **Vite + React + TS**, local-first
**IndexedDB** persistence (no backend), **installable PWA**, mobile-first. The
bias exists because most portfolio cores are a capture/list/detail loop that a
local-first PWA serves with zero infra. Override with `--stack` when the core
loop genuinely needs something else.

## Procedure

### Phase 1 — Identify the core loop + lock the stack

1. Mine `<slug>.clone.md` (JTBDs, scored features) and `PROJECT.md` for the
   **Core-5**: the 3–5 steps that ARE the product (e.g. capture → tag → list →
   detail → share). Everything else is out of scope for the first slice.
2. Choose the stack (default bias above unless `--stack`/`--no-pwa`).
3. **Record a stack ADR** at `_requirements/03-architecture/adr/ADR-<n>-spinup-stack.md`
   — the decision, the core loop it serves, and the explicit out-of-scope list
   (auth, backend, sync, etc.). The ADR is the authoritative brief for the build.

### Phase 2 — Scaffold directly (foreground)

4. Scaffold the app in a subdir (`app/` or `web/`) so the product
   `package.json` `"type":"module"` stays out of the framework's way — and
   confirm `scripts/package.json` (`{"type":"commonjs"}`) exists so framework
   scripts/hooks keep working regardless (WG-9). If you write a `"type":"module"`
   root instead of a subdir, the `scripts/package.json` guard is mandatory.
5. Build ONLY the Core-5 loop with local-first persistence. No auth, no
   backend, no settings screens. Use the design-system primitives if present;
   otherwise minimal clean defaults.

### Phase 3 — Verify before claim (the gate — WG-6 antidote)

"It builds" ≠ "it serves." Prove **all three**, capturing evidence; a worktree
existing or a live `node` process is NOT evidence:

6. **Build clean:** `npm --prefix <appdir> run build` exits 0.
7. **Dev server serves:** start `npm --prefix <appdir> run dev`, then
   `curl -sS -o /dev/null -w "%{http_code}" http://localhost:<port>/` returns
   **200** (retry briefly for startup).
8. **Entry module transforms:** request the entry module
   (`curl -sS http://localhost:<port>/src/main.tsx` — Vite serves transformed
   source) and confirm it returns JS without a transform error.

If any of the three fails, the slice is **NOT done** — fix and re-verify. Never
report "running" off a started process alone. Tear down the dev server unless
`--keep-running`.

### Phase 4 — Report

Report: the Core-5 loop built, the stack + ADR path, and the three verification
results (build exit, HTTP status, entry-module OK) with the actual evidence.
Suggest the next step (`/roadmap:create` to sequence the rest, or `/sprint:full`
for the next feature).

## Relationship

- `/roadmap:create` sequences Milestone 1's first sprint AS a `/portfolio:spinup`
  (get the loop on screen before infra).
- `/portfolio:new` scaffolds the repo; spinup puts the first slice on screen.
- The verify-before-claim gate is the skill-level antidote to WG-6 (phantom
  dispatch); the build-chain itself carries the structural fix (gamma.md
  verify-before-report contract).

## Notes

- Reference paths via `paths.*` keys, not literals (Paths rule; path-lint enforces).
- Fully reversible: writes app files + one ADR; never pushes, never deploys.
