---
name: handoff
description: Generate a handoff document for continuing work in a new Claude Code session or Claude Project chat
---

Generate a handoff document and save it for easy cold-start of a new session.

## Modes

- `/handoff` — full handoff (default), outputs to screen AND saves to `.claude/handoff.md`
- `/handoff code` — optimized for a new Claude Code session (skip skills section, they're native)
- `/handoff project` — optimized for a Claude Project chat (include skills as inline instructions)
- `/handoff quiet` — save to file only, no screen output

## Steps

### 1. Gather State (automated — do not ask the user)

Run these in parallel:

- `git branch --show-current` + `git log --oneline -10` + `git status`
- `git diff --stat` (uncommitted changes summary)
- Read the conversation history for what was worked on, decisions made, blockers hit

### 2. Build the Handoff Document

```markdown
# Handoff — [Product Name] — [Date]

## Project

[One-liner from CLAUDE.md]

## Branch State

- Branch: `[branch]` ([N] commits ahead of master)
- Uncommitted: [summary or "clean"]
- Last commit: `[hash] [message]`

## This Session

[2-5 bullets: what was done, decisions made, blockers encountered]

## Files Changed

[List of files modified this session with one-line change descriptions]

## Next Steps

[Prioritized list of what to do next — be specific, not vague]

## Warnings

[Anything the next session MUST know — don't-touch items, known broken state, pending merges]

## Key Context

[Any non-obvious context that would take time to re-derive — API quirks, architecture decisions, workarounds]
```

### 3. For Claude Project mode (`/handoff project`), append:

```markdown
## Product Context

[Paste the full CLAUDE.md content]

## Skills Reference

[For each skill in .claude/commands/*.md, generate:]

### /[skill-name]

[skill description]
When I say "/[skill-name]", do the following:
[skill content]
```

This lets a Claude Project chat understand the same commands natively.

### 4. Save

- Always save to `.claude/handoff.md` (overwrite previous)
- Also save a timestamped copy to `.claude/handoffs/[YYYY-MM-DD-HHMM].md`
- Display the handoff on screen (unless `quiet` mode)

### 5. Output instructions

After generating, tell the user:

**For a new Claude Code session:**

```
claude --resume "$(cat .claude/handoff.md)"
```

Or just start a new session and paste the contents of `.claude/handoff.md` as your first message.

**For a Claude Project chat:**

1. Go to claude.ai → Projects → [Project Name] → Project Knowledge
2. Paste the contents of `.claude/handoff.md` as a knowledge file
3. Or paste it as the first message in a new chat

**The handoff is saved at:** `.claude/handoff.md`

## Quality Rules

- Keep under 2000 words — dense, not verbose
- Be specific about next steps — "fix the rate limiter in api/jobs/route.ts" not "continue working on the API"
- Include the WHY behind decisions, not just the WHAT
- If there are uncommitted changes, warn prominently
- Never include secrets, API keys, or credentials
