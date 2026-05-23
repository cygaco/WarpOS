<!-- requirement-format-legacy -->
# Granular Stories — Fix current.yaml#status + active-sprints.yaml status lag after /sprint:full Phase 5

**Sprint:** `SP-20260523-001`
**High-level stories:** `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260523-001\high-level-stories.md`

> Granular stories use the `S-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`. Each granular story
> should produce roughly one ticket during `/sprint:design`.

## S-1 — Locate the status-update helper (or add one) for current.yaml + active-sprints.yaml

**As** the user
**I want** Locate the status-update helper (or add one) for current.yaml + active-sprints.yaml
**So that** Sprint registry stays honest with actual completion state — operator can run /sprint:status and trust the output. The active-sprints.yaml registry is what other skills (/sprint:status, downstream tooling) read; manual patches today are a footgun.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-1`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-2 — Update retrospective.js to call the helper on success

**As** the user
**I want** Update retrospective.js to call the helper on success
**So that** Sprint registry stays honest with actual completion state — operator can run /sprint:status and trust the output. The active-sprints.yaml registry is what other skills (/sprint:status, downstream tooling) read; manual patches today are a footgun.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-2`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-3 — Update sprint/full.js Phase 5 wrapper to call the helper even when retrospective.js exits 3

**As** the user
**I want** Update sprint/full.js Phase 5 wrapper to call the helper even when retrospective.js exits 3
**So that** Sprint registry stays honest with actual completion state — operator can run /sprint:status and trust the output. The active-sprints.yaml registry is what other skills (/sprint:status, downstream tooling) read; manual patches today are a footgun.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-3`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-4 — Add scripts/sprint/test-sprint-full.js (or test-status-update.js) assertion: full pipeline → both files show 'retrospected'

**As** the user
**I want** Add scripts/sprint/test-sprint-full.js (or test-status-update.js) assertion: full pipeline → both files show 'retrospected'
**So that** Sprint registry stays honest with actual completion state — operator can run /sprint:status and trust the output. The active-sprints.yaml registry is what other skills (/sprint:status, downstream tooling) read; manual patches today are a footgun.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-4`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

