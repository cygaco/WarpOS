<!-- requirement-format-legacy -->
# Granular Stories — Events retention policy — auto-roll events.jsonl above threshold (milestone 0.13.0 sprint 4)

**Sprint:** `SP-20260525-013`
**High-level stories:** `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-013\high-level-stories.md`

> Granular stories use the `S-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`. Each granular story
> should produce roughly one ticket during `/sprint:design`.

## S-1 — Add rotation check to logger.js — before append, stat file size; if > threshold, rotate.

**As** the user
**I want** Add rotation check to logger.js — before append, stat file size; if > threshold, rotate.
**So that** events.jsonl stays bounded in size. /events:tail / /events:query / smart-context loaders stay fast. Operator stops needing to manually compact via /sleep:deep.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-1`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-2 — Implement atomic rotation: write current to events.jsonl.<ISO>.gz, then truncate current.

**As** the user
**I want** Implement atomic rotation: write current to events.jsonl.<ISO>.gz, then truncate current.
**So that** events.jsonl stays bounded in size. /events:tail / /events:query / smart-context loaders stay fast. Operator stops needing to manually compact via /sleep:deep.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-2`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-3 — Implement N-keep cleanup — walk archive dir, sort by timestamp, delete past N.

**As** the user
**I want** Implement N-keep cleanup — walk archive dir, sort by timestamp, delete past N.
**So that** events.jsonl stays bounded in size. /events:tail / /events:query / smart-context loaders stay fast. Operator stops needing to manually compact via /sleep:deep.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-3`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-4 — Update /events:tail to optionally include archives (--with-archives flag).

**As** the user
**I want** Update /events:tail to optionally include archives (--with-archives flag).
**So that** events.jsonl stays bounded in size. /events:tail / /events:query / smart-context loaders stay fast. Operator stops needing to manually compact via /sleep:deep.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-4`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-5 — Update /events:query to scan archives by default (--current-only to skip).

**As** the user
**I want** Update /events:query to scan archives by default (--current-only to skip).
**So that** events.jsonl stays bounded in size. /events:tail / /events:query / smart-context loaders stay fast. Operator stops needing to manually compact via /sleep:deep.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-5`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-6 — Add tests: write 11MB of events, verify rotation, verify 6th rotation evicts 1st.

**As** the user
**I want** Add tests: write 11MB of events, verify rotation, verify 6th rotation evicts 1st.
**So that** events.jsonl stays bounded in size. /events:tail / /events:query / smart-context loaders stay fast. Operator stops needing to manually compact via /sleep:deep.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-6`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-7 — Add concurrent-writer test: two processes appending while rotation happens, verify no event loss.

**As** the user
**I want** Add concurrent-writer test: two processes appending while rotation happens, verify no event loss.
**So that** events.jsonl stays bounded in size. /events:tail / /events:query / smart-context loaders stay fast. Operator stops needing to manually compact via /sleep:deep.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-7`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

