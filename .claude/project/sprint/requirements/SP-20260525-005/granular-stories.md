<!-- requirement-format-legacy -->
# Granular Stories — DreamTeam orchestrator capsule fix — include sprintFullAutonomy + sprintSchemas in next capsule (milestone 0.12.0 sprint 1)

**Sprint:** `SP-20260525-005`
**High-level stories:** `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-005\high-level-stories.md`

> Granular stories use the `S-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`. Each granular story
> should produce roughly one ticket during `/sprint:design`.

## S-1 — Create .claude/commands/check/skill-engines.md skill with frontmatter + body.

**As** the user
**I want** Create .claude/commands/check/skill-engines.md skill with frontmatter + body.
**So that** Operator never encounters a skill that says 'I work' but errors with `Cannot find module`. /check:skill-engines exits 0 on clean canonical; release-build refuses capsules with broken edges; /warp:setup postflight surfaces drift with actionable remediation.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-1`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-2 — Create scripts/checks/skill-engines.js — walks .claude/commands/**/*.md, extracts scripts/... refs via regex.

**As** the user
**I want** Create scripts/checks/skill-engines.js — walks .claude/commands/**/*.md, extracts scripts/... refs via regex.
**So that** Operator never encounters a skill that says 'I work' but errors with `Cannot find module`. /check:skill-engines exits 0 on clean canonical; release-build refuses capsules with broken edges; /warp:setup postflight surfaces drift with actionable remediation.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-2`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-3 — Define findings structure: { skill_path, line, reference, status: missing|present|templated, remediation }.

**As** the user
**I want** Define findings structure: { skill_path, line, reference, status: missing|present|templated, remediation }.
**So that** Operator never encounters a skill that says 'I work' but errors with `Cannot find module`. /check:skill-engines exits 0 on clean canonical; release-build refuses capsules with broken edges; /warp:setup postflight surfaces drift with actionable remediation.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-3`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-4 — Implement output modes: human (table) + --json.

**As** the user
**I want** Implement output modes: human (table) + --json.
**So that** Operator never encounters a skill that says 'I work' but errors with `Cannot find module`. /check:skill-engines exits 0 on clean canonical; release-build refuses capsules with broken edges; /warp:setup postflight surfaces drift with actionable remediation.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-4`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-5 — Wire into scripts/warpos/release-build.js — call before snapshot, exit 2 on missing refs (non-templated).

**As** the user
**I want** Wire into scripts/warpos/release-build.js — call before snapshot, exit 2 on missing refs (non-templated).
**So that** Operator never encounters a skill that says 'I work' but errors with `Cannot find module`. /check:skill-engines exits 0 on clean canonical; release-build refuses capsules with broken edges; /warp:setup postflight surfaces drift with actionable remediation.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-5`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-6 — Wire into scripts/warp-setup.js — postflight call, warn on findings with remediation hint.

**As** the user
**I want** Wire into scripts/warp-setup.js — postflight call, warn on findings with remediation hint.
**So that** Operator never encounters a skill that says 'I work' but errors with `Cannot find module`. /check:skill-engines exits 0 on clean canonical; release-build refuses capsules with broken edges; /warp:setup postflight surfaces drift with actionable remediation.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-6`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-7 — Create scripts/checks/test-skill-engines.js with 4 fixture cases.

**As** the user
**I want** Create scripts/checks/test-skill-engines.js with 4 fixture cases.
**So that** Operator never encounters a skill that says 'I work' but errors with `Cannot find module`. /check:skill-engines exits 0 on clean canonical; release-build refuses capsules with broken edges; /warp:setup postflight surfaces drift with actionable remediation.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-7`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-8 — Document in /check namespace + USER_GUIDE.

**As** the user
**I want** Document in /check namespace + USER_GUIDE.
**So that** Operator never encounters a skill that says 'I work' but errors with `Cannot find module`. /check:skill-engines exits 0 on clean canonical; release-build refuses capsules with broken edges; /warp:setup postflight surfaces drift with actionable remediation.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-8`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

