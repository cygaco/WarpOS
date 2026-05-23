<!-- requirement-format-legacy -->
# Acceptance Criteria — DreamTeam orchestrator capsule fix — include sprintFullAutonomy + sprintSchemas in next capsule (milestone 0.12.0 sprint 1)

**Sprint:** `SP-20260525-005`
**PRD:** `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-005\prd.md`

> Each AC is a testable statement. Link from the relevant granular story
> + the ticket that implements it.
>
> **`verified_by:` linkage convention (SP-20260518-007).** When the Plan
> Contract carries a `goal_verification` block, each AC MUST be
> linked by adding a `verified_by:` line directly under the AC. Two
> accepted forms:
>
> - `verified_by: <test-file>::<test-name>` (executable — ship-gate
>   runs this test under paths.sprintRegressionCorpus/<sprint-id>/)
> - `verified_by: not_applicable — <justification>` (skipped; only
>   valid when `goal_verification.reproduction = not_applicable` in
>   the Plan Contract; justification must be non-empty)
>
> `/sprint:design` refuses to advance the sprint to `designed` if any
> AC lacks a `verified_by:` line while `goal_verification.reproduction
> = executable`. `/sprint:release` ship-gate runs every cited test.

## S-1 — {{story_1_title}}

- AC-1.1: Given {{ac_1_1_given}}, when {{ac_1_1_when}}, then {{ac_1_1_then}}.
  verified_by: tests/regression/SP-20260525-005/<test-file>.test.js::<test-name>
- AC-1.2: Given {{ac_1_2_given}}, when {{ac_1_2_when}}, then {{ac_1_2_then}}.
  verified_by: tests/regression/SP-20260525-005/<test-file>.test.js::<test-name>

## S-2 — {{story_2_title}}

- AC-2.1: Given {{ac_2_1_given}}, when {{ac_2_1_when}}, then {{ac_2_1_then}}.
  verified_by: tests/regression/SP-20260525-005/<test-file>.test.js::<test-name>
