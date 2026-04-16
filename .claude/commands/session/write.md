---
description: Post a message to the cross-session inbox so other Alex sessions can see it
---

# /session:write — Cross-Session Message

Posts an inbox event to `.claude/project/events/events.jsonl` (cat=inbox) that all other Alex sessions will see on their next prompt (via smart-context).

## Input

`$ARGUMENTS` — Optional. A message or note to include. If omitted, the skill auto-gathers ALL context — you don't need to think about what to share.

## Process

### 1. Auto-Gather Context (no user effort required)

The skill collects everything another session would need. Run these in parallel:

**a) Git state:**
```bash
BRANCH=$(git branch --show-current)
LAST_COMMIT=$(git log -1 --format="%h %s" 2>/dev/null)
UNCOMMITTED=$(git diff --stat HEAD 2>/dev/null | tail -1)
```

**b) Recent file changes** (what was actually touched this session):
```bash
# Files modified in the last 2 hours (session proxy)
git diff --name-only HEAD 2>/dev/null | head -15
```
If no uncommitted changes, check `git log --since="2 hours ago" --name-only --format=""` instead.

**c) Last user task:** Read the conversation context — what was the user's last major request or goal? Summarize in one line.

**d) Learnings added:** Check if any learnings were appended to `.claude/project/memory/learnings.jsonl` this session (compare line count or check recent timestamps).

**e) Systems changed:** Check if any of these were modified: `CLAUDE.md`, `.claude/commands/**`, `scripts/hooks/**`, `.claude/reference/**`, `.claude/project/memory/systems.jsonl`. List which ones.

**f) Research outputs:** Check if any new files exist in `docs/99-resources/research/` that weren't there before.

**g) Spec changes:** Check for modified files in `docs/05-features/` or `docs/04-architecture/`.

### 2. Build Message

Compose the message automatically from gathered context:

```
Session ended. Last task: {user's last major request}
{UNCOMMITTED — e.g. "14 files changed, 3 insertions(+), 2 deletions(-)"}
{Key files: list of important changed files, max 10}
{If learnings added: "+N learnings"}
{If systems changed: "Systems modified: CLAUDE.md, hooks/foo.js, ..."}
{If research: "Research: docs/99-resources/research/{slug}/"}
{If $ARGUMENTS provided: "Note: {user's message}"}
```

**Keep it under 500 chars.** Other sessions get this injected into every prompt — be dense, not verbose.

```json
{
  "ts": "ISO-8601 timestamp",
  "session_id": "read from .claude/.session-id",
  "from": "{branch} / {one-line task descriptor}",
  "message": "{auto-composed message above}",
  "files_changed": ["auto-gathered list"]
}
```

### 3. Write via Logger

Use the centralized logger to write the inbox event:
```bash
node -e "const {log}=require('./scripts/hooks/lib/logger'); log('inbox', {from:'...', message:'...', files_changed:[...]}, {session:'...'}); console.log('OK')"
```

No cleanup needed — events.jsonl is append-only, smart-context already filters by 24h TTL.

### 4. Confirm

Output a brief confirmation:
```
Shared to inbox: "{first 80 chars of message}"
Other sessions will see this on their next prompt.
```

## Auto-Share Triggers

Consider posting to inbox automatically when:
- A significant system change is made (new hook, new skill, CLAUDE.md edit)
- A breaking change to shared files (types.ts, constants.ts, settings.json)
- After `/sleep` completes (consolidation results)
- After a commit that other sessions should know about

## Notes

- Messages expire after 24 hours automatically
- Max 5 most recent messages shown per prompt (older ones still in file but not injected)
- The prompt-enhancer reads this file on every UserPromptSubmit
- All sessions sharing the same project directory share the same inbox
- This is one-way broadcast — no replies or threading. Keep messages self-contained.
