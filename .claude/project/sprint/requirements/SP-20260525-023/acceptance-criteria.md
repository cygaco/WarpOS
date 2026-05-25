<!-- requirement-format-legacy -->
# Acceptance Criteria — Spinup orchestrator — wire bootstrap:spinup pipeline end-to-end (0.15.0 sprint 3 of 3)

**Sprint:** `SP-20260525-023`
**PRD:** `.claude/project/sprint/requirements/SP-20260525-023/prd.md`

> Orchestration is BUILT in canonical, EXECUTES product-side. Canonical proves the
> CHAIN on a fixture (β directive Q(c)); standing up a real product is a non-goal.
> `goal_verification` is intentionally omitted from PC-20260525-0056 (β: orchestration
> sprint verified by its own fixture e2e, same exemption as Sprint A/B), so
> `verified_by:` lines below are traceability hints, not a `/sprint:design` hard gate.

## S-1 — Pre-flight install gate (T1)

- AC-1.1: Given a WarpOS-installed product, when `spinup-orchestrate.js` runs (any phase), then it first runs `/check:install` (incl. the WG-4 sprint-subsystem probe) and **refuses to proceed (non-zero exit, no phase side-effects) on a gappy install**.
  verified_by: scripts/bootstrap/test-spinup-orchestrate.js::preflight-refuses-gappy-install
- AC-1.2: Given a complete install, when the pre-flight runs, then it passes and the pipeline advances to the intent phase.
  verified_by: scripts/bootstrap/test-spinup-orchestrate.js::preflight-passes-complete-install

## S-2 — Intent phase: brief default + --clone (T2)

- AC-2.1: Given no `--clone`, when the intent phase runs, then it drives the guided brief flow and writes a product brief that Phase 2 (canon) consumes as `--intent`.
  verified_by: scripts/bootstrap/test-spinup-orchestrate.js::intent-brief-produces-intent-file
- AC-2.2: Given `--clone <target>`, when the intent phase runs, then it invokes the EXISTING `scripts/portfolio/clone.js` (no reimplementation), writes the clone doc under `_docs/clones/<slug>/`, and feeds it to Phase 2.
  verified_by: scripts/bootstrap/test-spinup-orchestrate.js::intent-clone-reuses-clone-js

## S-3 — Canon-phase chaining (T3)

- AC-3.1: Given a Phase-1 intent file, when the canon phase runs, then `spinup-orchestrate.js` invokes the **SP-022-T6** canon wiring (`scripts/canon/generate.js`) and produces all 11 `_requirements/00-canonical/*` artifacts that pass the engine's own validation (default `--research off`).
  verified_by: scripts/bootstrap/test-spinup-orchestrate.js::canon-phase-emits-11-valid-artifacts

## S-4 — Roadmap-phase chaining (T4)

- AC-4.1: Given freshly-generated `_requirements/00-canonical/*`, when the roadmap phase runs, then it invokes `roadmap:create` grounded in the canonical docs (preferred over brief/clone) and produces a `ROADMAP.md` with milestones + sprints, **MVP-core-loop first** (Milestone-1 sprint-1 = core loop on screen).
  verified_by: scripts/bootstrap/test-spinup-orchestrate.js::roadmap-phase-grounds-on-canon

## S-5 — On-screen phase + verify-before-claim (T5)

- AC-5.1: Given a roadmap, when the on-screen phase runs, then it targets Milestone-1's first sprint for execution.
- AC-5.2: Given the on-screen phase claims the core loop is up, when the verify-before-claim gate runs, then success requires ALL of: build exits clean AND a dev server returns **HTTP 200** on localhost AND the entry module transforms without error. "It builds" alone FAILS the gate; a pre-existing live `node` process or worktree is NOT accepted as evidence. (v1: bounded local-first-PWA target per β Q(b); type-aware is v2.)
  verified_by: scripts/bootstrap/test-spinup-orchestrate.js::serve-gate-requires-200-not-just-build

## S-6 — Phase-state + --phase / --resume (T6)

- AC-6.1: Given a completed phase, when `--resume` is passed, then the orchestrator continues from the next phase (reads durable phase-state), not from the start.
  verified_by: scripts/bootstrap/test-spinup-orchestrate.js::resume-continues-from-last-phase
- AC-6.2: Given `--phase <name>`, when invoked, then only that phase re-runs (idempotent), leaving other phases' outputs intact.
  verified_by: scripts/bootstrap/test-spinup-orchestrate.js::phase-flag-runs-single-phase

## S-7 — Fixture e2e (chain-proof, no real product) (T7)

- AC-7.1: Given the canon fixture intent, when the e2e test runs the chain intent→canon→roadmap (`--research off`), then all phases complete and assert their outputs WITHOUT standing up a real product in canonical (chain-proof only — β Q(c)).
  verified_by: scripts/bootstrap/test-spinup-orchestrate.js::e2e-chain-intent-canon-roadmap
- AC-7.2: Given the orchestrator is an engine/tooling sprint, when closing, then there is no deploy artifact (RI-001) — closed via ff-merge to main, not the release-prep orchestrator path.
  verified_by: not_applicable — process/closure assertion, not code
