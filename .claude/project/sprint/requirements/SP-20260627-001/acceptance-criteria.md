<!-- requirement-format-legacy -->
# Acceptance Criteria — E-DISPATCH-SHAPE-001 ADR-0013 enforce repair + W3 review-lane policy

**Sprint:** `SP-20260627-001`
**PRD:** `.claude/project/sprint/requirements/SP-20260627-001/prd.md`

> Each AC encodes a β pin (DECIDE 0.89/0.90) as a TESTABLE statement that names its
> enforcer/artifact — β verifies ENCODING not assertion at before_execute (AP-8).
> verified_by tests live under tests/regression/SP-20260627-001/.

## S-1 — Enforce-correctness: re-allow ONLY the legitimate cases (β pins 1 + 2), then flip default to enforce

- AC-1.1: Given a `-w` build-chain dispatch (passW=true, `scripts/dispatch-claude.js:200`) where claude creates the isolated worktree AFTER `validateDispatch` runs (`scripts/dispatch-claude.js:366`), when validateDispatch is called with a `worktreePending` signal and cwd=canonical/absent, then no cwd-worktree violation fires; AND conversely, when `worktreePending` is false/absent and cwd=canonical, the cwd-worktree violation STILL fires. (β pin 1 — conditioned predicate, NOT a blanket cwd=canonical pass.)
  verified_by: tests/regression/SP-20260627-001/enforce-correctness.test.js::worktree_pending_conditioned
- AC-1.2: Given a `fixer` dispatch routed in-process (no -w/worktree), when validateDispatch/validateDispatchForClass runs, then it is STILL refused with a build-chain-in-process violation — adding `fixer` to GENERIC_BUILD_IDS classifies it as a build role but does NOT exempt it from the in-process refusal. (β pin 2a.)
  verified_by: tests/regression/SP-20260627-001/enforce-correctness.test.js::fixer_in_process_still_refused
- AC-1.3: Given the role-normalization map, when every entry is evaluated, then each maps old->new within the SAME role class (pure alias); a fixture FAILS if any entry reclassifies a role across classes. (β pin 2b.)
  verified_by: tests/regression/SP-20260627-001/enforce-correctness.test.js::role_norm_pure_alias
- AC-1.4: Given no env override, when `contractEnforceMode(wrapperKey, env)` is queried, then it returns enforce (default), while `WARPOS_DISPATCH_CONTRACT_ENFORCE=report|off|0` override and the per-wrapper kill-switch are still honored. (ADR-0013 flip, reversibility preserved.)
  verified_by: tests/regression/SP-20260627-001/enforce-correctness.test.js::enforce_default_with_override

## S-2 — No-widen invariant: NEGATIVE fixtures per refused class + BC-16 + gauntlet (β pin 3)

- AC-2.1: Given a planted genuinely-wrong api-when-CLI dispatch, when run under enforce-by-default, then it exits 1 (refusal preserved).
  verified_by: tests/regression/SP-20260627-001/negative-fixtures.test.js::api_when_cli_exit1
- AC-2.2: Given a planted build-chain-in-process dispatch, when run under enforce-by-default, then it exits 1.
  verified_by: tests/regression/SP-20260627-001/negative-fixtures.test.js::build_chain_in_process_exit1
- AC-2.3: Given a planted REAL cwd-worktree-violation (build-chain, no -w, cwd=canonical), when run under enforce-by-default, then it exits 1 (the legit -w case from AC-1.1 must NOT mask this).
  verified_by: tests/regression/SP-20260627-001/negative-fixtures.test.js::real_cwd_worktree_violation_exit1
- AC-2.4: Given a planted forbidden_shape dispatch, when run under enforce-by-default, then it exits 1.
  verified_by: tests/regression/SP-20260627-001/negative-fixtures.test.js::forbidden_shape_exit1
- AC-2.5: Given the dispatch-contract gate is fed malformed/own-error input, when evaluated, then it FAILS CLOSED (exit non-zero), never silently passes. (BC-16.)
  verified_by: tests/regression/SP-20260627-001/negative-fixtures.test.js::fail_closed_on_own_error
- AC-2.6: Given the dispatch-contract.js + coverage-gate.js diffs, when the cross-provider gauntlet runs (GPT-5.5 + Claude; gemini hard-deprecated ED-063), then both lanes return PASS on the actual diff.
  verified_by: not_applicable — gauntlet verdict recorded in the sprint gauntlet records (real cross-provider review, not a unit test)

## S-3 — W3 per-failure-class review-lane policy (report-only ramp, consumer-fired)

- AC-3.1: Given the per-class lane-min keys, when `coverage-gate.js` runs, then a NAMED consumer function READS the lane-min key and ACTS on it (the function + line cited in the ticket) — the key is consumed, not declarative. (β: Policy-key-must-fire, DP-gap #41(b).)
  verified_by: tests/regression/SP-20260627-001/w3-lane-policy.test.js::lane_min_key_is_consumed
- AC-3.2: Given each risk class, when the W3 policy ships, then the class has EITHER a green planted fixture proving its lane minimum OR a logged enforcement-debt entry — no aspirational blocking rule ships without one. (β: honesty-ceiling P-061, approval boundary #3.)
  verified_by: tests/regression/SP-20260627-001/w3-lane-policy.test.js::per_class_fixture_or_debt

## S-4 — ADR-0013 amendment

- AC-4.1: Given ADR-0013, when this sprint lands, then it is AMENDED in place with the revised enforce-correctness model (worktree-pending predicate + negative-fixture no-widen invariant) — no new ADR is opened. (β precedent: OPEN_ADR false.)
  verified_by: not_applicable — doc amendment verified by inspection (ADR-0013 carries the amendment section citing this sprint id)
