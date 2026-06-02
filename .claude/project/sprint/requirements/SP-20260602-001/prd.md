<!-- requirement-format-legacy -->
# PRD — Sealed-capsule executable consumer-contract gate (keystone)

**Sprint:** `SP-20260602-001`
**Plan Contract:** `PC-20260602-0063`
**Status:** draft
**Documentation scale:** `m`

## Outcome

Releases can no longer ship code that secretly reaches back into canonical-only state (the #1 recurring 'downstream always missing' disease, e.g. the 100 dangling seeded_from pointers). A failing gate blocks promotion before a broken release reaches a real product install.

## Context

### Original Request

> Build the KEYSTONE (DUMP.md #5): the executable consumer-contract gate in SEALED-CAPSULE posture. Spec: (1) materialize the release capsule into a self-contained sealed payload and install ONLY that into a disposable out-of-tree repo where canonical WarpOS is UNREACHABLE; (2) run the real consumer lifecycle setup->scan:install->a real sprint->dispatch telemetry->update under BOTH repo roles (scripts/warpos/repo-role.js) across cold + warm/update paths; (3) typed success via scripts/dispatch/gauntlet-verify.js (green = action occurred AND telemetry record exists; fail-closed); (4) wire as release/promotion gate + name the enforcer. Builds on already-merged repo-role.js, gauntlet-verify.js, test-fresh-install-smoke.js. HIGH-risk enforcer-class: full 4-reviewer cross-provider gauntlet + telemetry verify REQUIRED, do NOT skip-gauntlet, expect >=1 fix cycle. Beta pre-cleared the plan (DECIDE x3): build in isolated worktree, autonomous through gauntlet, single halt = gauntlet verdict before ff-merge (halt-report to operator), ff-merge LOCAL only (no push - operator-gated). ADR-0006 already written. Engine/tooling sprint (no deploy artifact) -> fast-close path.

### Interpreted Intent

Build the full sealed-capsule consumer-contract release gate (ADR-0006): a script + tests + release/promotion wiring that materializes the release capsule into a self-contained payload, installs ONLY that payload into a disposable out-of-tree repo where canonical is unreachable, runs the real consumer lifecycle under both repo roles across cold+warm paths, and asserts typed success (action occurred AND telemetry record exists) fail-closed. Name the enforcer per CLAUDE.md Policy & Enforcement Hygiene.

### Current Behavior

Only the cheap leading-indicator slice exists (test-fresh-install-smoke.js), which installs via warp-setup source-clone with canonical REPO_ROOT REACHABLE — structurally cannot catch reach-back. The capsule ships a manifest (file list+hashes) but not the file bytes.

### Desired Behavior

A runnable gate that: (a) materializes a sealed self-contained payload from the capsule manifest; (b) installs only that payload into a disposable out-of-tree temp repo with canonical pathed-out/unreachable; (c) runs setup->scan:install->a real sprint->dispatch telemetry->update under BOTH repo roles across cold+warm paths; (d) asserts typed success via gauntlet-verify (action + well-formed telemetry record), fail-closed on runner-error/malformed/no-record; (e) is wired as a release/promotion gate with a named enforcer. Exit 0 = release stands on its own; non-zero = reach-back / contract break detected.

## Requirements

> Use existing requirement ID conventions enforced by
> `scripts/hooks/requirement-format-guard.js`. PRDs in `_requirements/`
> use `R-N` ids — sprint-scope PRDs that link to a feature in
> `_requirements/04-features/<feature>/PRD.md` should reuse those ids,
> not invent new ones.

- `R-1` — sealed-payload materialization from capsule manifest (fail-closed on stale/missing manifest)
- `R-2` — out-of-tree isolation with canonical unreachable (+ negative test: catches a planted reach-back)
- `R-3` — executable consumer lifecycle runner (setup/scan:install/sprint/telemetry/update), fail-closed per step
- `R-4` — typed-success assertion via gauntlet-verify against canonical-anchored telemetry (BC-16; ED-016-safe)
- `R-5` — matrix: both repo roles {canonical,consumer} × {cold,warm} via repo-role override-arg threading
- `R-6` — wired as a release/promotion gate with a NAMED enforcer (see Enforcer below)
- `R-7` — regen BOTH manifests (BC-02/BC-05) + register in `scripts/testsuite/enforce.js`

## Enforcer (Beta before_design constraint — named before design closes)

**Enforcer name:** `sealed-capsule-contract-gate`.
**Mechanism:** `scripts/warpos/test-sealed-capsule-gate.js` (script that exits non-zero on any
seal/isolate/lifecycle/typed-success/matrix failure), wired into:
1. `scripts/warpos/release-gates.js` — runs at release/promotion; a non-zero exit blocks promotion.
2. `scripts/testsuite/enforce.js` — runnable set, so regressions are caught per-run.

**What makes a violation self-detecting:** a release that ships reach-back-to-canonical code, a stale
manifest, a missing telemetry record, or a broken consumer lifecycle step → the gate exits non-zero →
promotion is refused / the testsuite goes red. Fail-closed on runner-error/malformed/no-record. Any
residual policy left unenforced after this build is logged via `/enforcement:log` so the
aspirational-vs-enforced gap is visible (CLAUDE.md Policy & Enforcement Hygiene).

## Non-Goals

- Publishing the capsule to a real network registry (Option C in ADR-0006 — premature; needs hosting/auth/spend)
- Authoring the 99 real seed templates / clearing KNOWN_DANGLING_SET (deferred 0.16.0 Pattern-realignment — Director call)
- 0.18.1 deferred items E6/H4/G1/G2; re-classifying the ~16 misclassified scratch artifacts
- Pushing to remote (operator-gated)

## Affected Surfaces

| Surface | Evidence Level |
|---|---|
| scripts/warpos/ (new sealed-capsule gate script) | verified_from_repo |

## External Service Dependencies

See `.claude/project/sprint/external-services/` for ESD records.

## Approval Boundaries

See Plan Contract `approval_boundaries`.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260602-0063.yaml`
- High-level stories: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260602-001\high-level-stories.md`
- Granular stories: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260602-001\granular-stories.md`
- COPY: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260602-001\copy.md`
- INPUTS: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260602-001\inputs.md`
- TRACE: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260602-001\trace.md`
- Acceptance criteria: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260602-001\acceptance-criteria.md`
- QA plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260602-001\qa-plan.md`
- Redteam plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260602-001\redteam-plan.md`
- Release plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260602-001\release-plan.md`
