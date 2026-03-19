---
name: handoff
description: Generate a handoff document for continuing work in a new session or Claude Project
---

Generate a handoff document that captures the current state of work so it can be loaded into:
- A new Claude Code session (paste as first message)
- A Claude Project chat on claude.ai (paste as first message)
- Another developer picking up the work

The handoff should include:

## 1. Project Context (always)
- What consumer product is (one sentence)
- Current branch and recent commits (last 5)
- Any uncommitted changes

## 2. Current Work (always)
- What was being worked on this session
- What's done vs what's still pending
- Any decisions made and why
- Any blockers or known issues

## 3. Key Files Touched (always)
- List files modified this session with one-line descriptions of changes

## 4. Next Steps (always)
- Prioritized list of what to do next
- Any warnings or "don't forget" items

## 5. Slash Commands (if handing off to Claude Project)
- Include a "Skills" section that lists all available slash commands and their descriptions
- Format as: "When I type /qa, do the following: [paste qa.md content]"
- This lets the recipient Claude Project understand the same commands

## Format
Output as a single markdown document wrapped in a code fence, ready to copy-paste.
Keep it under 2000 words — dense, not verbose.

If the user says `/handoff project`, include the Skills section for Claude Projects.
If the user says `/handoff code`, skip the Skills section (Claude Code has them natively).
Default: include everything.
