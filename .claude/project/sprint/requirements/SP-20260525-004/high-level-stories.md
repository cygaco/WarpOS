<!-- requirement-format-legacy -->
# High-Level Stories — Beta-honesty enforcement skill — /check:sprint-beta-honesty + AUTONOMY.md enforced (milestone 0.11.0 sprint 2)

**Sprint:** `SP-20260525-004`
**PRD:** `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-004\prd.md`

> High-level stories use the `H-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`.

## H-1 — As the operator, I run `/check:sprint-beta-honesty` and see a clear table of recent sprints showing Beta cadence honored (or violated, with specifics).

**As** the user
**I want** As the operator, I run `/check:sprint-beta-honesty` and see a clear table of recent sprints showing Beta cadence honored (or violated, with specifics).
**So that** Operator can run `/check:sprint-beta-honesty` and trust the output: green means Beta cadence in AUTONOMY.md matches reality across recent sprints; red means specific sprints have placeholder consults or missing escalations. Available for CI integration as a gate on future sprint workflow changes. The enforcement-debt entry closes; milestone 0.11.0 ships. The 'aspirational' disclaimer comes off AUTONOMY.md permanently.

Linked granular stories: see `granular-stories.md`.
Linked requirements: `R-1`.

## H-2 — As the framework, /sprint:full's Beta cadence is now enforced — drift is detectable by anyone running the skill.

**As** the user
**I want** As the framework, /sprint:full's Beta cadence is now enforced — drift is detectable by anyone running the skill.
**So that** Operator can run `/check:sprint-beta-honesty` and trust the output: green means Beta cadence in AUTONOMY.md matches reality across recent sprints; red means specific sprints have placeholder consults or missing escalations. Available for CI integration as a gate on future sprint workflow changes. The enforcement-debt entry closes; milestone 0.11.0 ships. The 'aspirational' disclaimer comes off AUTONOMY.md permanently.

Linked granular stories: see `granular-stories.md`.
Linked requirements: `R-2`.
