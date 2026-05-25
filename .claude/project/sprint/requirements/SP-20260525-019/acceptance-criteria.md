<!-- requirement-format-legacy -->
# Acceptance Criteria — Install completeness: unify install.ps1 + warp-setup paths, scaffold PROJECT.md + product maps

**Sprint:** `SP-20260525-019`
**PRD:** `.claude/project/sprint/requirements/SP-20260525-019/prd.md`

> Primary verifier: `scripts/warpos/test-install-matrix.js` (extended with an install.ps1-path scenario + a both-path parity diff). `verified_by:` points at the runnable check. No `goal_verification` block on the contract → executable-link gate is advisory; every AC still names a concrete verifier.

## S-1 — Shared scaffold core (extract, don't fork) — β constraint 1

- AC-1.1: `warp-setup.js`'s scaffold logic (registry-driven paths.json, `_warpos/` mirror, `_requirements/_docs` zones, ROADMAP gen, sprint-orchestrator infra) lives in ONE shared node module (`scripts/warpos/scaffold-core.js`); `warp-setup.js` invokes it rather than inlining. No second copy exists.
  verified_by: scripts/warpos/test-install-matrix.js::clean_install (warp-setup path still 6/6 — no behavior change)
- AC-1.2: The existing 6 matrix scenarios stay green (warp-setup path unregressed by the extraction).
  verified_by: scripts/warpos/test-install-matrix.js (scenarios 1-6 pass)

## S-2 — install.ps1 invokes the shared core (cross-platform) — β constraints 1 + 3

- AC-2.1: `install.ps1` invokes the shared scaffold core via `node scripts/warpos/scaffold-core.js` (a real shell-out, NOT inline `node -e` with fs writes — A-006 / Windows-stdin class), so a consumer install is complete.
  verified_by: scripts/warpos/test-install-matrix.js::installps1_path (asserts shell-out path)
- AC-2.2: A fresh install via `install.ps1` produces the full tree: `_warpos/`, `_requirements/*`, `_docs/`, `ROADMAP.md`, registry-driven `paths.json` (incl. sprint keys), sprint dirs — and passes `/check:warpos-structure-parity` + `regenerate.js --check`.
  verified_by: scripts/warpos/test-install-matrix.js::installps1_path

## S-3 — Both-path parity as a diff (β before_design constraint)

- AC-3.1: The matrix runs the install.ps1-path AND the warp-setup-path against identical fixture inputs and DIFFS the resulting directory trees; any divergence (beyond a documented allowlist of path-specific files) fails the gate.
  verified_by: scripts/warpos/test-install-matrix.js::both_path_parity (tree diff == empty)

## S-4 — PROJECT.md scaffolded

- AC-4.1: A fresh install via EITHER path writes a `PROJECT.md` template at the product root (skip-if-present; idempotent). CLAUDE.md's "see PROJECT.md" reference now resolves.
  verified_by: scripts/warpos/test-install-matrix.js::clean_install + ::installps1_path (PROJECT.md present)

## S-5 — Product maps (not canonical baseline)

- AC-5.1: A fresh install has product-appropriate maps (generated for the product) OR a clear, asserted "run `/maps:all`" nudge in the next-steps — not silently the canonical WarpOS baseline masquerading as the product's.
  verified_by: scripts/warpos/test-install-matrix.js::clean_install (maps are product-generated or the nudge is present)

## S-6 — Registry-first for any new keys (A-015)

- AC-6.1: Any new `paths.json` keys introduced go through `framework/paths.registry.json` (then `paths/build.js`), never raw-inserted (A-015). Canonical `paths/build.js --check` + `regenerate.js --check` stay clean.
  verified_by: scripts/paths/build.js --check + scripts/warpos/views/regenerate.js --check (both exit 0 on canonical)

## Non-goals (must NOT be implemented)

- NG-1: Re-architecting the capsule/release format.
- NG-2: Backfilling existing products (companycam/dreamteam) — that's an operator re-setup, not this sprint.
- NG-3: A second copy of the scaffold logic — the whole point is ONE shared core (extract, don't fork).
