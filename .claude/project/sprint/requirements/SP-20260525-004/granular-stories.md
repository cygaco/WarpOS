<!-- requirement-format-legacy -->
# Granular Stories — Beta-honesty enforcement skill — /check:sprint-beta-honesty + AUTONOMY.md enforced (milestone 0.11.0 sprint 2)

**Sprint:** `SP-20260525-004`
**High-level stories:** `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-004\high-level-stories.md`

> Granular stories use the `S-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`. Each granular story
> should produce roughly one ticket during `/sprint:design`.

## S-1 — Pre-flight: verify SP-20260525-003 is shipped — events.jsonl contains real (non-placeholder) sprint_full_beta_consult events from at least one recent sprint

**As** the user
**I want** Pre-flight: verify SP-20260525-003 is shipped — events.jsonl contains real (non-placeholder) sprint_full_beta_consult events from at least one recent sprint
**So that** Operator can run `/check:sprint-beta-honesty` and trust the output: green means Beta cadence in AUTONOMY.md matches reality across recent sprints; red means specific sprints have placeholder consults or missing escalations. Available for CI integration as a gate on future sprint workflow changes. The enforcement-debt entry closes; milestone 0.11.0 ships. The 'aspirational' disclaimer comes off AUTONOMY.md permanently.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-1`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-2 — Create `.claude/commands/check/sprint-beta-honesty.md` skill file with frontmatter + body + scan algorithm description

**As** the user
**I want** Create `.claude/commands/check/sprint-beta-honesty.md` skill file with frontmatter + body + scan algorithm description
**So that** Operator can run `/check:sprint-beta-honesty` and trust the output: green means Beta cadence in AUTONOMY.md matches reality across recent sprints; red means specific sprints have placeholder consults or missing escalations. Available for CI integration as a gate on future sprint workflow changes. The enforcement-debt entry closes; milestone 0.11.0 ships. The 'aspirational' disclaimer comes off AUTONOMY.md permanently.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-2`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-3 — Create `scripts/checks/sprint-beta-honesty.js` — reads paths.sprintFullReports/* + events.jsonl, computes findings, emits findings table

**As** the user
**I want** Create `scripts/checks/sprint-beta-honesty.js` — reads paths.sprintFullReports/* + events.jsonl, computes findings, emits findings table
**So that** Operator can run `/check:sprint-beta-honesty` and trust the output: green means Beta cadence in AUTONOMY.md matches reality across recent sprints; red means specific sprints have placeholder consults or missing escalations. Available for CI integration as a gate on future sprint workflow changes. The enforcement-debt entry closes; milestone 0.11.0 ships. The 'aspirational' disclaimer comes off AUTONOMY.md permanently.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-3`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-4 — Define exempt-list policy for historical sprints (date cutoff approach recommended — sprints before SP-20260525-003 ship date are legacy)

**As** the user
**I want** Define exempt-list policy for historical sprints (date cutoff approach recommended — sprints before SP-20260525-003 ship date are legacy)
**So that** Operator can run `/check:sprint-beta-honesty` and trust the output: green means Beta cadence in AUTONOMY.md matches reality across recent sprints; red means specific sprints have placeholder consults or missing escalations. Available for CI integration as a gate on future sprint workflow changes. The enforcement-debt entry closes; milestone 0.11.0 ships. The 'aspirational' disclaimer comes off AUTONOMY.md permanently.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-4`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-5 — Add structured findings: { sprint_id, phase, expected_consult, actual_event, verdict, evidence, finding_type }

**As** the user
**I want** Add structured findings: { sprint_id, phase, expected_consult, actual_event, verdict, evidence, finding_type }
**So that** Operator can run `/check:sprint-beta-honesty` and trust the output: green means Beta cadence in AUTONOMY.md matches reality across recent sprints; red means specific sprints have placeholder consults or missing escalations. Available for CI integration as a gate on future sprint workflow changes. The enforcement-debt entry closes; milestone 0.11.0 ships. The 'aspirational' disclaimer comes off AUTONOMY.md permanently.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-5`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-6 — Implement output modes: human (table) + --json (machine-readable)

**As** the user
**I want** Implement output modes: human (table) + --json (machine-readable)
**So that** Operator can run `/check:sprint-beta-honesty` and trust the output: green means Beta cadence in AUTONOMY.md matches reality across recent sprints; red means specific sprints have placeholder consults or missing escalations. Available for CI integration as a gate on future sprint workflow changes. The enforcement-debt entry closes; milestone 0.11.0 ships. The 'aspirational' disclaimer comes off AUTONOMY.md permanently.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-6`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-7 — Create `scripts/checks/test-sprint-beta-honesty.js` with 4 fixture scenarios (clean, placeholder, missing, escalate-without-halt)

**As** the user
**I want** Create `scripts/checks/test-sprint-beta-honesty.js` with 4 fixture scenarios (clean, placeholder, missing, escalate-without-halt)
**So that** Operator can run `/check:sprint-beta-honesty` and trust the output: green means Beta cadence in AUTONOMY.md matches reality across recent sprints; red means specific sprints have placeholder consults or missing escalations. Available for CI integration as a gate on future sprint workflow changes. The enforcement-debt entry closes; milestone 0.11.0 ships. The 'aspirational' disclaimer comes off AUTONOMY.md permanently.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-7`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-8 — Update `_docs/sprint/AUTONOMY.md`: remove 'aspirational' disclaimer from Beta cadence section; add 'Enforced by /check:sprint-beta-honesty'

**As** the user
**I want** Update `_docs/sprint/AUTONOMY.md`: remove 'aspirational' disclaimer from Beta cadence section; add 'Enforced by /check:sprint-beta-honesty'
**So that** Operator can run `/check:sprint-beta-honesty` and trust the output: green means Beta cadence in AUTONOMY.md matches reality across recent sprints; red means specific sprints have placeholder consults or missing escalations. Available for CI integration as a gate on future sprint workflow changes. The enforcement-debt entry closes; milestone 0.11.0 ships. The 'aspirational' disclaimer comes off AUTONOMY.md permanently.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-8`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-9 — Close enforcement-debt entry: invoke /enforcement:resolve (or equivalent) referencing this sprint + the new skill as the enforcer

**As** the user
**I want** Close enforcement-debt entry: invoke /enforcement:resolve (or equivalent) referencing this sprint + the new skill as the enforcer
**So that** Operator can run `/check:sprint-beta-honesty` and trust the output: green means Beta cadence in AUTONOMY.md matches reality across recent sprints; red means specific sprints have placeholder consults or missing escalations. Available for CI integration as a gate on future sprint workflow changes. The enforcement-debt entry closes; milestone 0.11.0 ships. The 'aspirational' disclaimer comes off AUTONOMY.md permanently.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-9`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-10 — Local commit on sprint branch capturing all changes

**As** the user
**I want** Local commit on sprint branch capturing all changes
**So that** Operator can run `/check:sprint-beta-honesty` and trust the output: green means Beta cadence in AUTONOMY.md matches reality across recent sprints; red means specific sprints have placeholder consults or missing escalations. Available for CI integration as a gate on future sprint workflow changes. The enforcement-debt entry closes; milestone 0.11.0 ships. The 'aspirational' disclaimer comes off AUTONOMY.md permanently.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-10`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-11 — HALT before git push — operator-scoped

**As** the user
**I want** HALT before git push — operator-scoped
**So that** Operator can run `/check:sprint-beta-honesty` and trust the output: green means Beta cadence in AUTONOMY.md matches reality across recent sprints; red means specific sprints have placeholder consults or missing escalations. Available for CI integration as a gate on future sprint workflow changes. The enforcement-debt entry closes; milestone 0.11.0 ships. The 'aspirational' disclaimer comes off AUTONOMY.md permanently.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-11`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

