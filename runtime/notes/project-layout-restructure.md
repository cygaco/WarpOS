# Project-layout restructure + downstream migration plan (operator design 2026-06-02) — DESIGN ONLY, NOT BUILT

Operator-proposed top-level restructure + the migration plan to propagate it to the 5 portfolio products (one-way sync, /warp:update). Pairs with the req-pipeline / `_knowledge` design in `sprint-hook-points-design.md §9`.

## Proposed top-level layout (axis = concern + audience)

```
_development/        ← engineering lifecycle (how it's built)
  requirements/      ← MOVED+RENAMED from root _requirements — intent: PRDs, stories, AC, canon (00-canonical … 10-contracts)
  stack/             ← NEW — foundation: what it's built ON (frameworks/libs/infra + architecture decisions/ADRs)
  releases/          ← NEW — output: release ledger (history/changelogs/notes)
_knowledge/          ← FOR THE AGENTS (design/copy principles, audience dossiers, living state-of-record)
  audience/  copy/  design/  state/
_guides/             ← FOR THE USER (founder launch guides — AUTH/PAYMENTS/…)
  design/  …
_docs/  _reports/    ← reference docs / reports (unchanged)
```
Pipeline reading of `_development/`: **requirements (what to build) → stack (what it's built with) → releases (what shipped).**

**Naming convention (operator 2026-06-02):** `_` prefixes a TOP-LEVEL framework zone OR a meta-subdir (`_standards`, `_org`, `_shared`); CONTENT dirs nested inside are PLAIN. So `_development/{requirements,stack,releases}`, `_knowledge/{audience,copy,design,state}`, `_guides/{design,…}` — plain children. Dropping the inner `_` on the move is free (folds into M4's rename+move via the `paths.X` remap + literal sweep). Tooling note: `scan:framework-purity`'s root-level-`_requirements` leak check updates (requirements moves out of root into `_development/requirements/`).

## Adjacencies to settle (avoid overlapping homes)
- **`_stack`** — read: the project's technical FOUNDATION (chosen stack + architecture decisions/ADRs). Likely ABSORBS `_requirements/03-architecture/` + the ADR registry. Confirm vs a runtime/deployed-stack record. Must NOT duplicate `package.json`/lockfile — it's the *declared* foundation.
- **`_releases`** — reconcile with existing `.claude/project/sprint/releases/` (sprint-scoped) + `RELEASES.md` + `framework/releases/`. `_development/_releases/` = the project's release LEDGER that sprint release-records FEED; not a third competing home.
- **`_requirements` move = highest blast radius** in WarpOS (`paths.requirementsRoot` + canon + sprint:design writes + scan:requirements + dozens of scripts/skills/agents). Sequence LAST; co-design with the unbuilt `_warpos/` source-of-truth migration so `_requirements` isn't reorganized twice.

## Migration plan (propagate to downstream products)

Machinery that exists: `scripts/warpos/migrations-loader.js`, applied-migrations ledger, `scan:warpos-{applied,coverage,presence}-migrations`, `/warp:update` (delivery), `paths.json` (registry), release capsules (`framework/releases/X.Y.Z/`).

Principles:
1. **Paths-registry-first.** Callers use `paths.X` → a move is a `paths.json` remap + physical `mv`; callers don't change. PLUS a literal-ref sweep (grep ALL old-literal occurrences across `.md`/`.json`/`.js` — rename-hygiene; the anthropic→claude miss is the cautionary tale).
2. **One migration per change, ledgered, idempotent.** Applied exactly once per product via the applied-migrations ledger; products on 0.8.2–0.13.1 get the pending chain in order.
3. **Backward-compat window.** `paths.X` resolves OLD-OR-NEW during transition (half-updated product doesn't break); migration flips canonical + leaves a shim one minor version, then removes.
4. **Sequence low→high risk (additive before moves):**
   - **M1** `_knowledge/` scaffold (additive) — lowest risk, ships first, proves the pipeline.
   - **M2** `_development/_stack/` + `_development/_releases/` (additive).
   - **M3** `_guides/design/` → `_knowledge/design/` (move + rewire 4 agent `<!-- DESIGN-GUIDES -->` blocks + registry + guides:coverage) — medium.
   - **M4** `_requirements/` → `_development/_requirements/` (the big move) — highest risk, ships last, most validation.
5. **Per-migration validation gate** (before "applied"): `scan:install` + `scan:references` (broken links) + `path-lint` + `scan:requirements` (post-move).
6. **Content-preserving downstream.** Each product has its OWN PRDs/canon in `_requirements/` — the migration MOVES their content, never overwrites (product-overlay concern W-9). Per-product, version-aware.
7. **Coverage enforcer.** `scan:warpos-migration-coverage` asserts every structural change has a migration + downstream-apply path — a folder move shipped without a migration = RED ("every policy names its enforcer," applied to layout).

## Meta-point
These migrations ARE the first real exercise of the **C-4 consumer-contract milestone** (dogfood the fresh-install/update path the way downstream hits it — the ED-008 systemic cure). The restructure and C-4 ship together: the migration pipeline is validated by carrying structural change to 5 products on 5 versions, content-preserving.

## Status
DESIGN ONLY — not built (operator directive). Sequence: settle the `_stack`/`_releases` adjacency + co-design with the `_warpos/` source-of-truth migration, then M1→M4 under the C-4 milestone. Write an ADR for the layout at build time.
