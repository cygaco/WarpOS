---
description: Browse recent session summaries from handoffs/ directory
user-invocable: true
---

# /session:history — Session History

Browse past session handoffs. Useful for finding what happened in a prior session.

## Procedure

### Step 1: List recent handoffs

```bash
ls -lt .claude/handoffs/ | head -20
```

Show the 20 most recent with date, time, and first line (title) of each:

```
Recent Sessions (20 most recent):

1. 2026-04-02 08:13 — Handoff — consumer product — domain pills + retro redesign
2. 2026-04-01 16:37 — Handoff — consumer product — load hanging investigation
3. 2026-04-01 08:52 — Handoff — consumer product — Run 006 complete
...
```

### Step 2: User picks one to view

Ask which number to display. Read and show that file's contents.

### Step 3: Optional — load into context

Ask if they want to load this handoff as current context (equivalent to `/session:resume` but from a specific session).

Lightweight. No agents, no heavy reads. Just `ls` + `head` + user picks.
