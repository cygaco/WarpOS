---
description: Browse past session handoff summaries from the handoffs directory — useful for tracking what happened in a prior session, picking up a thread, or auditing decisions over time.
user-invocable: true
tags: [session, history, handoffs]
---

# /session:history — Session History

Browse past session handoffs. Useful for finding what happened in a prior session.

## Procedure

### Step 1: List recent handoffs

```bash
ls -lt .claude/runtime/handoffs/ | head -20
```

Show the 20 most recent with date, time, and first line (title) of each:

```
Recent Sessions (20 most recent):

1. 2026-04-02 08:13 — Handoff — feature polish + retro redesign
2. 2026-04-01 16:37 — Handoff — load hanging investigation
3. 2026-04-01 08:52 — Handoff — Run 006 complete
...
```

### Step 2: User picks one to view

Ask which number to display. Read and show that file's contents.

### Step 3: Optional — load into context

Ask if they want to load this handoff as current context (equivalent to `/session:resume` but from a specific session).

Lightweight. No agents, no heavy reads. Just `ls` + `head` + user picks.
