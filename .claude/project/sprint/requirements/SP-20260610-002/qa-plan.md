# QA Plan — Lane B — dispatch/registry coherence (WARPOS.md sweep 2026-06-10)

**Sprint:** `SP-20260610-002`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-002\prd.md`

> Sprint v0.1 QA plan. Honored by `/sprint:execute` (mid-sprint checks)
> and `/sprint:release` (final QA gate). Diff-model review on QA is
> declared in `paths.sprintRouting` (`qa.diff_review: true`).
> Scope: registry/contract/specs/checks only — engine sprint, no UI.

## Smoke checks

- [ ] `node scripts/checks/role-parity-scan.js` exits 0 on the post-build tree (all pre-existing checks + new model/shape checks green)
- [ ] `node scripts/checks/epsilon-liveness.js` exits 0 on a clean runtime (no stale evidence-without-record)
- [ ] `grep -rn "^model: inherit"` over registry-routed role specs under `.claude/agents/` returns 0 matches

## Per-story QA

### S-1 (model pins)
- [ ] AC-1.1 verified (re-grep zero `model: inherit` on registry-routed roles)
- [ ] AC-1.2 verified (6 specs + beta.md frontmatter model == registry model; beta = opus)
- [ ] AC-1.3 verified (source-layer edit; `/scan:framework-views-fresh` green)
- [ ] AC-1.4 verified (frontmatter-guide `inherit` scoped to non-registry agents)
- [ ] Regression: in-process Agent spawn of a repinned role resolves the pinned model, not the session model

### S-2 (parity scan — model)
- [ ] AC-2.1 verified (planted spec-vs-registry mismatch fixture → non-zero, names role + both models)
- [ ] AC-2.2 verified (planted `inherit` fixture → non-zero)
- [ ] AC-2.3 verified (clean tree → 0; existing checks unchanged-green)
- [ ] Regression: AC-2.4 — non-registry agents produce no false positive

### S-3 (contract derivation + shape parity)
- [ ] AC-3.1 verified (design-lead derives subprocess, matches registry route)
- [ ] AC-3.2 verified (claude leads still derive manager — both-direction fixture)
- [ ] AC-3.3 verified (planted shape-vs-route contradiction → non-zero)
- [ ] Regression: full class_derivation table re-derived for every registry role — no role's derived class changed except cross-provider leads

### S-4 (epsilon docs)
- [ ] AC-4.1 verified (epsilon.md sanctioned subprocess routes present, ED-041-consistent)
- [ ] AC-4.2 verified (dispatch-guide teammate-ε section present, no contradiction with epsilon.md)
- [ ] AC-4.3 verified (startup route self-check instruction present)
- [ ] AC-4.4 verified (stall-rules block present: never-idle / dispatch-blocking / report-before-idle)
- [ ] Regression: epsilon.md heartbeat §109-120 language no longer assumes ε-is-session unconditionally

### S-5 (epsilon-liveness + close)
- [ ] AC-5.1 verified (planted evidence-without-record fixture → non-zero + `epsilon-stalled` event)
- [ ] AC-5.2 verified (clean fixture → 0; deterministic timestamps, no wall-clock flake)
- [ ] AC-5.3 verified (malformed/missing ledger → fail-closed non-zero)
- [ ] AC-5.4 verified (report-only in /scan:full; BOTH manifests regenerated LAST; BC-02/BC-05 green)
- [ ] Regression: /scan:full completes with the new lane present and report-only (does not flip any gate to blocking)

## Cross-cutting QA

- [ ] Lint passes (path-lint: no new literal paths where `paths.*` keys apply)
- [ ] Typecheck passes (n/a — plain Node scripts; `node --check` on changed/new .js instead)
- [ ] Unit tests pass (planted-fixture runs for both check scripts)
- [ ] Integration tests pass (role-parity-scan + epsilon-liveness inside /scan:full)
- [ ] No new console errors in golden path (n/a — no UI; check scripts emit clean output on pass)
- [ ] No new accessibility regressions in changed UI surfaces (n/a — engine sprint, no UI)
- [ ] TRACE events fire as documented (TR-1 route self-check instruction in place; TR-2 `epsilon-stalled` emitted by fixture run)
- [ ] COPY matches `copy.md` (C-1: confirms no user-facing copy was introduced)
- [ ] INPUTS handle validation per `inputs.md` (IN-1/IN-2/IN-3 failure modes fail closed)
- [ ] Lane A disjointness held: no edits to generate-framework-manifest.js, release.js, warpos-install-baseline.js, scaffold payload

## External service QA

- [ ] All ESDs in `external-services/` are `ready_for_terminal_work`,
      `mocked`, `integrated`, or explicitly `deferred`. (Payload: no
      external service dependencies — list is empty.)
- [ ] No `secret: true` env-var values appear in any tracked file.
- [ ] Mocks behave equivalently to sandbox where claimed. (n/a — no ESDs.)

## Documentation scaling

This plan is the `documentation_scale: m` cut. For
xs/s, ACs may be inlined and a Cross-cutting subset is enough. For l/xl,
add a separate red-team plan and architecture-review plan.
