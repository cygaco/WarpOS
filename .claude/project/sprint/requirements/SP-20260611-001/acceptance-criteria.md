<!-- requirement-format-legacy -->
# Acceptance Criteria — Cross-family findings fix sprint — 6 gemini re-review findings (epsilon-runtime spawn race, fallback ENFORCE brick, hardcoded BUILD_CHAIN_ROLES, spoofed-ts window, sprint_id correlation, verifyGauntlet parse refusal)

**Sprint:** `SP-20260611-001`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260611-001\prd.md`

> Each AC is a testable statement. Exploit-shaped per β design-phase guidance
> (P-064 consult 2026-06-11): every fix's AC asserts the OLD attack now fails
> closed, not just that the happy path works — false-green is the bug class
> (BC-16). `verified_by:` lines point at the per-fix regression tests under
> `tests/regression/SP-20260611-001/` (per-fix isolation, β plan-phase risk #4).

## S-1 — epsilon-runtime parent-timeout grace (R-1)

- AC-1.1: Given a spawnAgent call at either spawn site (epsilon-agent ~476, epsilon-claude ~500), when the parent spawnSync timeout is computed, then it exceeds the child wrapper's internal bound by 30–60s of grace (child+grace shape, NOT backstop-only — β plan-phase HOW), so the child's graceful death-record write wins the race.
  verified_by: tests/regression/SP-20260611-001/epsilon-spawn-grace.test.js::parent-bound-exceeds-child-bound-at-both-sites
- AC-1.2: Given a child that self-bounds at its wrapper default, when the child exits gracefully at its own bound, then the parent has NOT yet fired SIGTERM (the 60s-headroom design holds at this layer) — asserted for BOTH spawn sites, not just epsilon-agent (rename-hygiene: the missed second site is the bug class).
  verified_by: tests/regression/SP-20260611-001/epsilon-spawn-grace.test.js::graceful-death-record-wins-race-both-sites

## S-2 — review-fallback sanctioned-shape registration (R-2)

- AC-2.1: Given the sanctioned --review-fallback lane, when the dispatch-shape layer evaluates its shape (resolveShape/shapeMismatch or the dispatch-contract sanctioned-lane registration), then the lane resolves as VALID — registered as a sanctioned shape, not suppressed via the `!blocking` conditional.
  verified_by: tests/regression/SP-20260611-001/review-fallback-shape.test.js::fallback-lane-is-registered-valid-shape
- AC-2.2: Given a future blocking/ENFORCE flip (blocking=true simulated), when a --review-fallback dispatch runs, then it does NOT exit 1 on shape mismatch (the W2 brick is closed) while a genuinely-mismatched non-sanctioned shape still refuses.
  verified_by: tests/regression/SP-20260611-001/review-fallback-shape.test.js::enforce-flip-does-not-brick-sanctioned-lane
- AC-2.3: Given `_planning/epics/E-DISPATCH-SHAPE-001.md` §12.2, when the sprint lands, then the W2 entry gate carries the precondition line "the sanctioned fallback lane is shape-registered before ENFORCE flips" — co-authored with the AC-2.1 code (β risk #5 doc-code coherence).
  verified_by: tests/regression/SP-20260611-001/review-fallback-shape.test.js::w2-entry-gate-text-present

## S-3 — registry-derived build-chain gating (R-3)

- AC-3.1: Given the two consult sites in dispatch-claude.js (worktree-isolation gate ~225, fallback refusal ~182), when build-chain membership is evaluated, then it derives from the registry class (validateDispatchForClass / build_chain_worker), with the literal BUILD_CHAIN_ROLES Set retained as explicit fallback only (β HOW: do not delete the Set; no registry refactor).
  verified_by: tests/regression/SP-20260611-001/build-chain-registry-gate.test.js::membership-derives-from-registry-class
- AC-3.2: Given every role that existed before this sprint, when membership is computed under the new derivation, then gate membership is byte-identical to the literal-Set behavior — the gate neither widens nor narrows for existing roles (β plan-phase membership-parity AC, named explicit at design per risk #3).
  verified_by: tests/regression/SP-20260611-001/build-chain-registry-gate.test.js::membership-parity-existing-roles
- AC-3.3: Given a NEW build-chain-class role registered in the registry but absent from the literal Set, when it dispatches via --review-fallback or without -w, then BOTH gates now refuse it (the unregistered-role bypass is closed).
  verified_by: tests/regression/SP-20260611-001/build-chain-registry-gate.test.js::new-registry-role-cannot-bypass

## S-4 — spoofed-ts window clamp, TWO-SITE (R-4)

- AC-4.1: Given a planted events.jsonl entry with an extreme timestamp (1970-01-01 or 2099-12-31), when sprint-hook-coverage.js derives the sprint window, then the window bounds stay clamped to sane horizons (sprint created_at ± hard cap; outlier ts discarded) and a historic ok:true record OUTSIDE the real window does NOT green the sprint.
  verified_by: tests/regression/SP-20260611-001/window-clamp.test.js::planted-extreme-ts-cannot-widen-hook-coverage-window
- AC-4.2: Given the same planted-extreme-ts exploit, when sprint-manager-consult.js derives its window (lines 266–269, byte-identical derivation), then the same clamp holds — the exploit is tested against BOTH files (β design DIRECTIVE: R-4 is two-site).
  verified_by: tests/regression/SP-20260611-001/window-clamp.test.js::planted-extreme-ts-cannot-widen-manager-consult-window

## S-5 — sprint_id-preferring correlation, both checkers (R-5)

- AC-5.1: Given a dispatch completion record carrying sprint_id (post-W0 records do), when hasBackingDispatchRecord correlates in sprint-hook-coverage.js OR sprint-manager-consult.js, then sprint_id match is PREFERRED over time-window correlation.
  verified_by: tests/regression/SP-20260611-001/sprint-id-correlation.test.js::sprint-id-match-preferred-both-checkers
- AC-5.2: Given a CONCURRENT sprint's ok:true record (overlapping time window, different sprint_id), when correlation runs in either checker, then that record does NOT falsely green this sprint (the cross-sprint leakage exploit fails closed).
  verified_by: tests/regression/SP-20260611-001/sprint-id-correlation.test.js::concurrent-sprint-record-no-false-green
- AC-5.3: Given a legacy (pre-W0) record WITHOUT sprint_id, when correlation runs, then the time-window fallback still applies — WITH the R-4 clamped window on the fallback branch, so the fallback does not re-open the leak (β design risk #3).
  verified_by: tests/regression/SP-20260611-001/sprint-id-correlation.test.js::legacy-fallback-keeps-clamped-window

## S-6 — verifyGauntlet programmatic parse refusal (R-6)

- AC-6.1: Given a programmatic caller of verifyGauntlet() passing unparseable since/until (garbage strings), when the function runs, then it REFUSES (throws/returns refusal) inside the library function — it never silently degrades to the forbidden whole-ledger scan.
  verified_by: tests/regression/SP-20260611-001/verify-gauntlet-parse.test.js::garbage-window-throws-not-whole-ledger
- AC-6.2: Given the existing CLI path with an invalid --since/--until, when invoked, then the existing CLI error message/behavior is preserved (no CLI regression).
  verified_by: tests/regression/SP-20260611-001/verify-gauntlet-parse.test.js::cli-behavior-preserved

## Cross-cutting

- AC-X.1: All pre-existing suites stay green: gauntlet-verify tests, sprint-hook-coverage/sprint-manager-consult selftests, dispatch-claude tests, epsilon-runtime tests, trackers validate 20/20.
  verified_by: tests/regression/SP-20260611-001/suite-regression.test.js::existing-suites-green
- AC-X.2: No shared-lib extraction across the two checkers in this sprint — same fix applied per-site independently; the duplication is noted as a follow-up only (β design HOW: blast-radius bound).
  verified_by: tests/regression/SP-20260611-001/suite-regression.test.js::no-shared-lib-extraction
