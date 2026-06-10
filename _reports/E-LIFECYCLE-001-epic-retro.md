# E-LIFECYCLE-001 — Epic Retrospective (S-LC-01 … S-LC-12)

**Date:** 2026-06-10 · **Branch:** june-9 · **Epic:** [E-LIFECYCLE-001 — Mode-Lifecycle Enforcement](../trackers/epics/E-LIFECYCLE-001-mode-lifecycle-enforcement.md) · **Companion validation:** [_reports/E-LIFECYCLE-001-capstone-validation.md](E-LIFECYCLE-001-capstone-validation.md)

> Synthesis method: the `/sprint:retrospective` skill is per-sprint (it transitions ONE `closed` sprint → `retrospected`) and does not span an epic, so this is the manual `/learn:deep`-style epic synthesis the epic's RI-001 close anticipated — mined from the epic file (12 sprint completion records + change log), the capstone validation report, and the per-sprint records. **Epic state is unchanged by this retro: still Active ~92%.** The retro does NOT flip Completed/100% — the report-only → blocking flip (§22 #4 operator sign-off) and the owed GPT 2nd-pass on the gemini-only security lanes (§H) remain open.

## tl;dr

E-LIFECYCLE-001 converted "mode/team correctness depends on the model remembering the prose" from a recurring, un-enforced failure class into an **operating layer of registries + gates + validators**, each with a planted-violation fixture that proves it self-detects. All 12 sprints (6 waves) landed gauntlet-clean and wired **report-only**; the capstone dry-run found **0 defects** across 21 regression suites + 8 live enforcers + 5 e2e pilot probes. The remaining ~8% is not code — it is the operator-gated flip to blocking + the owed GPT security 2nd-pass.

## What shipped (12/12 sprints, all report-only, all on june-9)

- **Wave 0 — Foundations:** S-LC-01 mode-lifecycle registry keystone (@76da472, fixed the `getMode()` sprint-case fall-through + added `isSprint()`); S-LC-02 lifecycle-event registry + logger + coverage enforcer (@d23e212).
- **Wave 1 — Mechanical gates:** S-LC-03 mode-switch preflight guard; S-LC-04 mode:init:gate generalization; S-LC-05 persistent-team lifecycle manager + SessionEnd backstop (all @june-9, report-only).
- **Wave 2 — Dispatch + turbo:** S-LC-06 dispatch matrix (mode_profiles) + parallelism axis + coverage-gate live wiring (@975ed5c); S-LC-07 turbo hardening — spend ceiling + permission profile + classifier-preflight, ADR-0011 (@95544ac).
- **Wave 3 — Planning + epic-suite:** S-LC-08 `_planning` lifecycle store + planning-principles enforcer (@1a6d638); S-LC-09 `/epic:*` suite — design 10, build `/epic:plan` + `/epic:fold` (@db42f9a).
- **Wave 4 — Provider readiness:** S-LC-10 value-free, report-only T1/T2/T3 provider-tier engine (@4a5e508).
- **Wave 5 — Acceptance + capstone:** S-LC-11 acceptance-criteria 20-category enforcement (@d946f43); S-LC-12 capstone — playbook-suite DESIGN + dry-run sim + e2e pilot, 0 defects.

## Key learnings

1. **The cure for a recurring un-enforced class is a declarative registry + bidirectional coverage, not more prose.** Every sprint that targeted a "remembered" invariant (mode→team, lifecycle events, AC categories, provider tier) replaced memory with a registry a validator reads, and a planted-violation fixture proving the validator fails closed. This is the same root-fix shape the org-design retro (2026-06-03) named — E-LIFECYCLE-001 is its execution.
2. **Cross-run reviewer diversity earns its keep on a real defect, not in theory.** S-LC-07's spend-ledger had three spoofs (prototype-key→NaN, negative-byte under-report, exit_code-string); one was found ONLY by ε's official security lane and missed by the independent qa round — concrete evidence that a second, differently-seeded reviewer catches what the first misses. (Captured in the team's gauntlet-catches-what-green-gates-miss learning.)
3. **The gauntlet caught a defect on multiple HIGH-risk sprints that the green build gate passed.** S-LC-04 dead-counter false-green, S-LC-07 two spend spoofs, S-LC-11 a `/epic:plan` idempotency blocker — all caught in a fix-cycle, none shipped. A green unit gate is necessary, not sufficient; the binding cross-provider verdict is the real ship gate.
4. **Ship-coverage is a live class, not a one-time check.** The Wave-1 tail surfaced `lifecycle.js` + `scripts/epic/` unshipped (caught by ship-coverage → added to ASSET_DIRS). The SAME closed-trap class recurred in the adjacent Lane A sweep (WG-1 dispatch-claude.js, generate-steps-maps.js) — strong signal that "canonical-present, install-absent" is endemic and the ship-payload enforcer (Lane A's `--ship-coverage`) is the durable structural answer.
5. **Report-only is the honest default for a backward-incompatible enforcement layer.** Every gate shipped report-only by design; the flip to blocking is an explicit operator decision (§22 #4), not an implementation detail an agent flips silently. The epic stays Active precisely because the flip is owed — code-complete ≠ done.

## Friction / what slowed us

- **Codex/GPT sustained reap all session** forced every security lane to gemini-only (§H). The verdicts are valid but single-provider; a GPT 2nd-pass is consciously owed before the blocking flip. (Provider-reap → gemini failover is the team's sanctioned mitigation; it held, but it left a known residual.)
- **A pre-existing broken test masqueraded as in-scope.** `tests/regression/SP-20260518-007/check-ac-coverage.test.js` (stale `check/`→`scan/` path from SP-20260528-001) failed on the base commit — correctly identified as NOT introduced by this epic, deferred as a cleanup item. (Now FIXED in the adjacent Lane A sprint SP-20260610-001 / T-20260610-295 @7d16332 — closes capstone residual #4.)
- **Manifest convergence churn (BC-02) at each wave close.** The regen-both-manifests-last discipline had to fire after every framework edit; missing it reds BC-02. Mechanical but recurring — the cost of the honesty gate.

## Action items (owed work, NOT done by this retro)

1. **Operator: §22 #4 sign-off** on the report-only → blocking flip (the backward-incompatible mode behavior). Until then the layer is observational.
2. **GPT 2nd-pass on the gemini-only security lanes** (§H) before the flip — when codex/GPT quota recovers.
3. **Capstone residual #4 — DONE:** the broken AC-coverage test was fixed in Lane A (SP-20260610-001 / T-20260610-295). No longer owed.
4. **Flip ramp sequencing:** when the flip happens, ramp report-only → blocking per-gate with the planted-violation fixtures as the safety net, not all-at-once.

## Process notes

- ε conducted the sprint roster with β at the four phase boundaries; the recurring α-skips-ε / hand-build anti-pattern was operator-corrected mid-arc — ε-conducts-the-roster held for the wave builds.
- RI-001 fast-close (engine sprints: ff-merge, no release-build, retro deferred to epic close) was the right cadence for 12 mechanical/engine sprints; this epic retro IS that deferred close-out.
- The capstone validation report (0 defects) is the validation half; this artifact is the learnings/friction/action-item half. Together they are the epic's close-out record — the Completed flip still waits on the two operator-gated items.
