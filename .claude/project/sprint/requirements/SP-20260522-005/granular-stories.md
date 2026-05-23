<!-- requirement-format-legacy -->
# Granular Stories — /warp:update --status wires manifest validator into per-file table

**Sprint:** `SP-20260522-005`
**High-level stories:** `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260522-005\high-level-stories.md`

> Granular stories use the `S-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`. Each granular story
> should produce roughly one ticket during `/sprint:design`.

## S-1 — Add --status early branch to scripts/warpos/update.js arg parser

**As** the user
**I want** Add --status early branch to scripts/warpos/update.js arg parser
**So that** Maintainers gain a single command to audit any WarpOS install's manifest honesty against its on-disk state — for Jobzooka, DreamTeam, or canonical itself. CI can wire this in as a release gate. Today the audit requires manually running validate.js with the right --root flag; the new wrapper is one canonical entry point.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-1`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-2 — Implement runStatusCli() that spawns validate.js --json and parses output

**As** the user
**I want** Implement runStatusCli() that spawns validate.js --json and parses output
**So that** Maintainers gain a single command to audit any WarpOS install's manifest honesty against its on-disk state — for Jobzooka, DreamTeam, or canonical itself. CI can wire this in as a release gate. Today the audit requires manually running validate.js with the right --root flag; the new wrapper is one canonical entry point.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-2`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-3 — Render per-class findings table (human mode)

**As** the user
**I want** Render per-class findings table (human mode)
**So that** Maintainers gain a single command to audit any WarpOS install's manifest honesty against its on-disk state — for Jobzooka, DreamTeam, or canonical itself. CI can wire this in as a release gate. Today the audit requires manually running validate.js with the right --root flag; the new wrapper is one canonical entry point.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-3`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-4 — Pass-through JSON augmented with mode=status (JSON mode)

**As** the user
**I want** Pass-through JSON augmented with mode=status (JSON mode)
**So that** Maintainers gain a single command to audit any WarpOS install's manifest honesty against its on-disk state — for Jobzooka, DreamTeam, or canonical itself. CI can wire this in as a release gate. Today the audit requires manually running validate.js with the right --root flag; the new wrapper is one canonical entry point.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-4`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-5 — Exit 0 when zero findings; exit 1 otherwise

**As** the user
**I want** Exit 0 when zero findings; exit 1 otherwise
**So that** Maintainers gain a single command to audit any WarpOS install's manifest honesty against its on-disk state — for Jobzooka, DreamTeam, or canonical itself. CI can wire this in as a release gate. Today the audit requires manually running validate.js with the right --root flag; the new wrapper is one canonical entry point.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-5`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-6 — Fall back to canonical validate.js when target lacks it

**As** the user
**I want** Fall back to canonical validate.js when target lacks it
**So that** Maintainers gain a single command to audit any WarpOS install's manifest honesty against its on-disk state — for Jobzooka, DreamTeam, or canonical itself. CI can wire this in as a release gate. Today the audit requires manually running validate.js with the right --root flag; the new wrapper is one canonical entry point.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-6`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-7 — Add scripts/warpos/test-status-cli.js with clean/drifted/missing-validate fixtures

**As** the user
**I want** Add scripts/warpos/test-status-cli.js with clean/drifted/missing-validate fixtures
**So that** Maintainers gain a single command to audit any WarpOS install's manifest honesty against its on-disk state — for Jobzooka, DreamTeam, or canonical itself. CI can wire this in as a release gate. Today the audit requires manually running validate.js with the right --root flag; the new wrapper is one canonical entry point.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-7`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-8 — Update CLI Usage message to mention --status

**As** the user
**I want** Update CLI Usage message to mention --status
**So that** Maintainers gain a single command to audit any WarpOS install's manifest honesty against its on-disk state — for Jobzooka, DreamTeam, or canonical itself. CI can wire this in as a release gate. Today the audit requires manually running validate.js with the right --root flag; the new wrapper is one canonical entry point.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-8`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

