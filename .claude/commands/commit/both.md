---
description: Commit locally then push to remote — full commit + push flow
---

# /commit:both — Commit and Push

Runs `/commit:local` then `/commit:remote` in sequence.

## Input

`$ARGUMENTS` — Optional commit message hint. Passed to the local commit step.

## Procedure

### Step 1: Commit locally

Follow the full `/commit:local` procedure:
- Assess state, stage files, draft message, commit
- If nothing to commit, check if there are unpushed commits — if so, skip to Step 2
- If nothing to commit AND nothing to push, report "Nothing to do" and stop

### Step 2: Push to remote

Follow the full `/commit:remote` procedure:
- Pre-push checks, show what will be pushed, then push immediately
- The user already confirmed by invoking `/commit:both` — no second confirmation needed
- Still show what was pushed in the report

### Step 3: Report

```
Committed: `<hash>` <message>
Pushed: <N> commits to origin/<branch>
```
