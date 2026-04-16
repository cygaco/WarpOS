---
description: Combined learning — runs learn:conversation + learn:events in parallel, then deduplicates and reports
---

# /learn:combined — Combined Learning Extraction

Runs both learning sources in parallel and produces a unified report.

## Procedure

### Step 1: Parallel extraction

Launch two agents in parallel:

**Agent A — Conversation learnings:**
Execute the full `/learn:conversation` procedure (Phase A + A.5 + B). Extract learnings from the current conversation — corrections, effective patterns, discoveries. Audit existing learning statuses. Review and maintain learning quality.

**Agent B — Event log learnings:**
Execute the full `/learn:events` procedure. Mine `.claude/project/events/events.jsonl` for behavioral patterns — tool hotspots, prompt patterns, spec drift, hook triggers, modification frequency.

Both agents write their findings to `.claude/project/memory/learnings.jsonl` using appendFileSync.

### Step 2: Deduplicate

After both agents complete:
1. Read `.claude/project/memory/learnings.jsonl`
2. Find entries with duplicate or overlapping tips (same insight, different wording)
3. Keep the entry with higher score or more specific conditions
4. Remove duplicates using Edit tool

### Step 3: Unified report

```
/learn:combined complete

CONVERSATION ({N} new):
| # | Type | Category | Learning |
|---|------|----------|----------|
| 1 | ... | ... | ... |

EVENTS ({N} patterns from {M} events):
| # | Category | Pattern |
|---|----------|---------|
| 1 | ... | ... |

LEARNINGS STATUS:
  Total:       {N} entries
  Implemented: {N}
  Informed:    {N}
  Injected:    {N}
  Dormant:     {N}

MAINTENANCE:
  Promoted:    {N}
  Pruned:      {N} ({N} stale, {N} duplicate)
  Deduplicated: {N} (cross-source overlaps removed)
```
