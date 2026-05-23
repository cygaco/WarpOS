<!-- requirement-format-legacy -->
# High-Level Stories — /research:* consolidation — validate or deprecate /research:deep + add synthesis phase to /research:simple (milestone 0.13.0 sprint 1)

**Sprint:** `SP-20260525-010`
**PRD:** `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-010\prd.md`

> High-level stories use the `H-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`.

## H-1 — As the framework, events.jsonl stays bounded — no manual /sleep:deep compaction needed.

**As** the user
**I want** As the framework, events.jsonl stays bounded — no manual /sleep:deep compaction needed.
**So that** events.jsonl stays bounded in size. /events:tail / /events:query / smart-context loaders stay fast. Operator stops needing to manually compact via /sleep:deep.

Linked granular stories: see `granular-stories.md`.
Linked requirements: `R-1`.

## H-2 — As an operator running /events:query, my historical queries scan rotated archives too.

**As** the user
**I want** As an operator running /events:query, my historical queries scan rotated archives too.
**So that** events.jsonl stays bounded in size. /events:tail / /events:query / smart-context loaders stay fast. Operator stops needing to manually compact via /sleep:deep.

Linked granular stories: see `granular-stories.md`.
Linked requirements: `R-2`.
