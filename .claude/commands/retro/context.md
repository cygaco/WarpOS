---
description: Scan conversation context for retro signals — bug reports, decisions, deferred items, UX feedback
---

# /retro:context — Conversation Context Scan

Lightweight retro that only looks at what's already in the conversation. Zero tool calls, zero git commands. Use after a work session to capture signals before they scroll away.

## Input

`$ARGUMENTS` — Optional focus filter (e.g., "bugs only", "decisions only"). Default: all categories.

## Procedure

### Step 1: Scan conversation

Read through the full conversation context. Extract every instance of:

| Signal | What to look for |
|--------|-----------------|
| **Bug report** | User complaints, screenshots, described misbehavior, "this is broken", error messages discussed |
| **Bug fix** | Problems diagnosed and resolved during the session — note root cause and fix approach |
| **Decision** | "Let's do X instead of Y", approach changes, architecture choices, rejected alternatives |
| **Deferred** | "We'll fix that later", "TODO", "skip for now", acknowledged but unaddressed issues |
| **UX feedback** | Positive ("this is great") or negative ("this is confusing") reactions to the product |
| **Surprise** | Anything unexpected — wrong assumptions, surprising behavior, mental model corrections |
| **Pattern** | Repeated problems, recurring themes, same file touched multiple times for the same reason |

### Step 2: Classify severity

For each finding:
- **P0**: Blocks the user or breaks core functionality
- **P1**: Significant but has workaround
- **P2**: Minor or cosmetic
- **Info**: Decision, deferred item, or feedback (no severity)

### Step 3: Present

```
/retro:context — {N} signals from conversation:

  1. [BUG P1] {description} — {status: FIXED|OPEN|DEFERRED}
  2. [DECISION] {what was decided} — {why}
  3. [DEFERRED] {what was skipped} — {reason}
  4. [UX+] {positive feedback}
  5. [UX-] {negative feedback}
  6. [SURPRISE] {what was unexpected} — {implication}
  7. [PATTERN] {recurring theme} — {count}x this session

Log to retro docs? (all / pick numbers / skip)
```

### Step 4: Write (if user confirms)

Append confirmed entries to the appropriate retro docs:
- Bugs → `BUGS.md` (with next BUG-NNN ID)
- Patterns → `HYGIENE.md` (with next Rule NN)
- Decisions, deferred, UX → `RETRO.md`
- Surprises that are learnings → `.claude/project/memory/learnings.jsonl`

If no retro directory exists for the current run, ask the user where to write.
