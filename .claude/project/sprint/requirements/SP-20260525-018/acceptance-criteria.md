<!-- requirement-format-legacy -->
# Acceptance Criteria — WarpOS installer completeness: complete + sprint-capable fresh installs

**Sprint:** `SP-20260525-018`
**PRD:** `.claude/project/sprint/requirements/SP-20260525-018/prd.md`

> Each AC is a testable statement. The primary verifier is
> `scripts/warpos/test-install-matrix.js` (extended to 3 install modes) plus
> the named `/check:*` gates. `verified_by:` points at the runnable check.
> No `goal_verification` block on the contract → the executable-link gate is
> advisory here, but every AC names a concrete verifier anyway.

## S-1 — ROADMAP scaffold at install

- AC-1.1: Given a fresh `/warp:setup` into a product with no `ROADMAP.md`, when setup completes, then `ROADMAP.md` exists at the product root, generated via `scripts/warpos/generate-roadmap-scaffold.js`.
  verified_by: scripts/warpos/test-install-matrix.js::clean_install (asserts ROADMAP.md present)
- AC-1.2: Given a product that already has `ROADMAP.md`, when `/warp:setup` is re-run, then the existing `ROADMAP.md` is left untouched (idempotent, skip-if-present).
  verified_by: scripts/warpos/test-install-matrix.js::existing_install_upgrade (asserts ROADMAP.md unchanged)

## S-2 — sprint-orchestrator infra at install

- AC-2.1: Given a fresh install, when setup completes, then the `.claude/project/sprint/` runtime dirs exist and the installed `.claude/paths.json` contains both `sprintFullAutonomy` and `sprintSchemas` keys.
  verified_by: scripts/warpos/test-install-matrix.js::clean_install (asserts sprint dirs + paths keys)
- AC-2.2: Given a fresh install, when `node scripts/sprint/full.js` boots in the product, then it does not fail for missing sprint-orchestrator infra (the product is sprint-capable).
  verified_by: scripts/warpos/test-install-matrix.js::clean_install (smoke: full.js boot does not error on missing infra)
- AC-2.3: Given an existing install, when `/warp:setup` is re-run, then sprint paths keys are not duplicated and `.claude/project/sprint/` runtime content is not clobbered (idempotent).
  verified_by: scripts/warpos/test-install-matrix.js::existing_install_upgrade

## S-3 — `_requirements/*` + `_docs/` skeleton zones

- AC-3.1: Given a fresh install, when setup completes, then the `_requirements/*` skeleton dirs declared by `/check:warpos-structure-parity` exist, and `_docs/` exists with `_docs/briefs/` + `_docs/clones/`.
  verified_by: scripts/warpos/test-install-matrix.js::clean_install (asserts zone dirs)
- AC-3.2: Given a fresh install, when `/check:warpos-structure-parity` runs against it, then it exits 0 (no missing `_requirements/*`).
  verified_by: scripts/checks/warpos-structure-parity.js (exit 0 on a fresh-install fixture)
- AC-3.3: Given an existing install with content under `_requirements/`/`_docs/`, when `/warp:setup` is re-run, then that content is not disturbed (skip-if-present; bare-dir creation only).
  verified_by: scripts/warpos/test-install-matrix.js::existing_install_upgrade

## S-4 — `/portfolio:adopt` brief placement

- AC-4.1: Given `/portfolio:adopt <slug>` for a clone brief, when the brief is moved into the target repo, then it lands under `_docs/clones/<slug>/` (a bootstrap brief under `_docs/briefs/<slug>/`), not the repo root.
  verified_by: scripts/warpos/test-install-matrix.js::adopt_path (asserts brief under _docs/, not root)

## S-5 — 3-mode install matrix + acceptance gate (β before_design constraint)

- AC-5.1: `scripts/warpos/test-install-matrix.js` exercises three install modes — clean install, upgrade (re-run setup on an existing install), and adopt path (via `adopt.js`) — and all three pass.
  verified_by: scripts/warpos/test-install-matrix.js (3 modes green)
- AC-5.2: Acceptance gate — a fresh install passes both `/check:install` and `/check:warpos-structure-parity`.
  verified_by: scripts/checks/warpos-install.js + scripts/checks/warpos-structure-parity.js (both exit 0)
- AC-5.3: No regression — the upgrade/re-run mode passes; every `warp-setup.js` addition is check-before-write so existing installs are not broken (idempotency is load-bearing — P-005).
  verified_by: scripts/warpos/test-install-matrix.js::existing_install_upgrade

## Non-goals (must NOT be implemented this sprint)

- NG-1: The `_warpos/` source-of-truth mirror migration (heavy; separate roadmapped `_warpos/`-zone migration). No ticket may add a `_warpos/` source mirror.
- NG-2: Backfilling the existing companycam repo directly from the WarpOS session (companycam is fixed by re-running `/warp:setup` in its own session).
