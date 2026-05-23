<!-- requirement-format-legacy -->
# High-Level Stories — Installer branch-safety — warp/install-timestamp branch default (milestone 0.12.0 sprint 2)

**Sprint:** `SP-20260525-006`
**PRD:** `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-006\prd.md`

> High-level stories use the `H-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`.

## H-1 — As an operator, every shipped skill works because its engine script exists.

**As** the user
**I want** As an operator, every shipped skill works because its engine script exists.
**So that** Operator never encounters a skill that says 'I work' but errors with `Cannot find module`. /check:skill-engines exits 0 on clean canonical; release-build refuses capsules with broken edges; /warp:setup postflight surfaces drift with actionable remediation.

Linked granular stories: see `granular-stories.md`.
Linked requirements: `R-1`.

## H-2 — As the maintainer, release-build refuses to ship a broken capsule.

**As** the user
**I want** As the maintainer, release-build refuses to ship a broken capsule.
**So that** Operator never encounters a skill that says 'I work' but errors with `Cannot find module`. /check:skill-engines exits 0 on clean canonical; release-build refuses capsules with broken edges; /warp:setup postflight surfaces drift with actionable remediation.

Linked granular stories: see `granular-stories.md`.
Linked requirements: `R-2`.
