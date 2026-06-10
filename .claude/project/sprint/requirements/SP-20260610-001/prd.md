<!-- requirement-format-legacy -->
# PRD — Lane A — ship/install integrity fixes (2026-06-10 WARPOS.md sweep)

**Sprint:** `SP-20260610-001`
**Plan Contract:** `PC-20260610-0067`
**Status:** draft
**Documentation scale:** `m`

## Outcome

Products that install/update WarpOS receive the mandatory build-chain wrapper (dispatch-claude.js) the dispatch guides tell them to use; product repos can close sprints without the regression-seed gate falsely blocking on a canonical-only module; scaffolded products get the CommonJS runtime pin (no ESM-inherit breakage of ad-hoc runtime .js) and a PROJECT.md that points to the scaffolded brief; the test suite is honestly green (no top-level ENOENT crash masquerading as a pass); and the closed-trap class is mechanically self-detecting at /scan:full going forward.

## Context

### Original Request

> Lane A — ship/install integrity fixes from the 2026-06-10 WARPOS.md sweep (runtime/notes/warpos-md-sweep-2026-06-10.md, §Lane A). Five items, all verified reproducing: (1) doogle WG-1: ship scripts/dispatch-claude.js + scripts/dispatch/dispatch-claude.test.js in the framework manifest generator (scripts/generate-framework-manifest.js top_script entries) so products receive the mandatory build-chain wrapper; (2) doogle WG-9: scripts/sprint/release.js regressionSeedGate must detect product-vs-canonical BEFORE require('../testsuite/enforce') — product repos no-op exit 0 without the module existing; canonical unchanged mandatory; add a product-role fixture to scripts/sprint/test-regression-seed-gate.js; (3) almanac AL-W-007: ship .claude/runtime/package.json {"type":"commonjs"} in the scaffold/install payload (same pattern as the existing scripts/package.json WG-9 pin); (4) almanac AL-W-004: add the scaffolded-brief-location pointer to the scaffold's PROJECT.md template; (5) E-LIFECYCLE-001 step 4 (operator pre-authorized): fix pre-existing broken test tests/regression/SP-20260518-007/check-ac-coverage.test.js (stale check/->scan/ path from SP-20260528-001 + missing real-tree fixture) — repoint + restore fixture, or retire with evidence if superseded. PLUS the class-closing enforcer: extend scripts/checks/warpos-install-baseline.js (fail-closed, non-zero exit per beta) to assert every script path mandated by a guard's remediation message / required by a shipped gate exists in the ship payload.

### Interpreted Intent

Convert four ship/install-integrity defects + one silently-broken regression test from 'present in canonical but never reaching products / failing closed wrongly / crashing the suite' into shipped, honest, gated state — and close the underlying closed-trap CLASS once via a ship-payload enforcer so the same gap can't recur silently. Each fix is file-disjoint from Lane B (no .claude/agents/** specs, no dispatch-contract.json, no role-parity-scan.js, no epsilon.md).

### Current Behavior

All five reproduce at canonical @75cd7e5 (verified this session by reading each file): WG-1 dispatch-claude.js not in TOP_LEVEL_SCRIPTS; WG-9 require() inside the gate try -> product repos block at exit 3; AL-W-007 .claude/runtime/package.json absent + .claude/runtime/ wholesale-excluded from the manifest; AL-W-004 PROJECT.md template lacks the brief pointer; E-LIFECYCLE step4 test crashes with ENOENT on the stale check/ path + expects a fixture-backed --json shape that isn't on the tree. The enforcer asserts on-disk existence only, so it cannot catch a canonical-present/install-absent file.

### Desired Behavior

dispatch-claude.js + its test ship to products via the manifest generator; regressionSeedGate detects product-vs-canonical BEFORE the require so product repos no-op exit 0 (canonical unchanged: mandatory + fail-closed on real regression/runner-error); .claude/runtime/package.json = type:commonjs ships in the scaffold/install payload; the scaffold PROJECT.md template carries the brief-location pointer; tests/regression/SP-20260518-007/check-ac-coverage.test.js passes cleanly (scan/ path + real fixture) with no top-level throw; warpos-install-baseline.js fails closed (non-zero) when any guard-mandated or shipped-gate-required script path is absent from the ship payload. Both manifests regenerated; Lane B files untouched.

## Requirements

> Use existing requirement ID conventions enforced by
> `scripts/hooks/requirement-format-guard.js`. PRDs in `_requirements/`
> use `R-N` ids — sprint-scope PRDs that link to a feature in
> `_requirements/04-features/<feature>/PRD.md` should reuse those ids,
> not invent new ones.

- `R-1` — WG-1: ship dispatch-claude.js + test via manifest generator top_script
- `R-2` — WG-9: product-vs-canonical before require + product-role fixture
- `R-3` — AL-W-007: ship .claude/runtime/package.json commonjs in scaffold/install payload

## Non-Goals

- Any Lane B surface: .claude/agents/** specs, _org/dispatch-contract.json, scripts/checks/role-parity*, epsilon.md (file-disjoint by design).

## Affected Surfaces

| Surface | Evidence Level |
|---|---|
| scripts/generate-framework-manifest.js TOP_LEVEL_SCRIPTS (WG-1) | verified_from_repo |

## External Service Dependencies

See `.claude/project/sprint/external-services/` for ESD records.

## Approval Boundaries

See Plan Contract `approval_boundaries`.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260610-0067.yaml`
- High-level stories: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-001\high-level-stories.md`
- Granular stories: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-001\granular-stories.md`
- COPY: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-001\copy.md`
- INPUTS: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-001\inputs.md`
- TRACE: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-001\trace.md`
- Acceptance criteria: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-001\acceptance-criteria.md`
- QA plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-001\qa-plan.md`
- Redteam plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-001\redteam-plan.md`
- Release plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-001\release-plan.md`
