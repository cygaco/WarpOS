<!-- requirement-format-legacy -->
# Acceptance Criteria — Maintainer &amp; Product Workflow — .vscode/tasks.json from portfolio registry, /portfolio:open --spawn VS Code preference, aiweb product-delivery ticket (cadence rule)

**Sprint:** `SP-20260522-003`
**PRD:** `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260522-003\prd.md`

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
  verified_by: tests/regression/SP-20260522-003/<test-file>.test.js::<test-name>
- AC-1.2: Given {{ac_1_2_given}}, when {{ac_1_2_when}}, then {{ac_1_2_then}}.
  verified_by: tests/regression/SP-20260522-003/<test-file>.test.js::<test-name>

## S-2 — {{story_2_title}}

- AC-2.1: Given {{ac_2_1_given}}, when {{ac_2_1_when}}, then {{ac_2_1_then}}.
  verified_by: tests/regression/SP-20260522-003/<test-file>.test.js::<test-name>

## S-3 — /portfolio:open --spawn prefers `code -n <path>` inside VS Code (T-20260522-186)

- AC-3.1: Given TERM_PROGRAM=vscode is set AND `code` is on PATH, when the user invokes /portfolio:open <slug> --spawn, then spawn.js picks the `code` PLATFORM_BINARIES entry (top priority) and opens the repo in a NEW VS Code window via `code -n <path>` instead of yanking the maintainer out to wt / iTerm / gnome-terminal.
  verified_by: scripts/one-off/smoke-spawn.js::AC-3.1 terminal === 'code'
- AC-3.2: Given TERM_PROGRAM=vscode is set AND `code` is NOT on PATH, when the user invokes /portfolio:open <slug> --spawn, then spawn.js's `code` entry probes false (or the env predicate short-circuits per AC-3.3) and the next-priority terminal binary is used (wt / iTerm / gnome-terminal). No fatal error — graceful fallthrough.
  verified_by: scripts/one-off/smoke-spawn.js::AC-3.2 terminal !== 'code'
- AC-3.3: Given TERM_PROGRAM is unset OR set to any value other than 'vscode', when the user invokes /portfolio:open <slug> --spawn, then spawn.js's `code` entry's requiresEnv predicate short-circuits to false (probeBinary returns false without ever invoking `where code` / `which code`), and the existing top-priority binary (wt on win32, iterm on darwin, gnome-terminal on linux) is selected. Zero behavior change for users outside VS Code.
  verified_by: scripts/one-off/smoke-spawn.js::AC-3.3 terminal !== 'code'
