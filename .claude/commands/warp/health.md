---
description: Verify WarpOS installation — checks every system, reports green/yellow/red with plain-English fixes
---

# /warp:health — Installation Health Check

Verify that WarpOS is properly installed and all systems are functional. Reports each system as green (working), yellow (degraded), or red (broken) with clear fix instructions.

## Procedure

Run ALL checks below. For each, report the status and any fix needed.

### 1. Directory Structure
Check these directories exist:
- `.claude/` — main config directory
- `.claude/project/events/` — event log
- `.claude/project/memory/` — learnings, traces, systems
- `.claude/project/maps/` — relationship graphs
- `.claude/project/reference/` — reasoning frameworks
- `.claude/runtime/` — session state
- `.claude/agents/` — agent definitions
- `.claude/commands/` — skills (slash commands)
- `scripts/hooks/` — hook implementations
- `scripts/hooks/lib/` — shared hook libraries

If any missing: RED — "Run the WarpOS installer again or create the directory manually."

### 2. Core Files
Check these files exist:
- `.claude/paths.json` — centralized path registry
- `.claude/manifest.json` — project configuration
- `.claude/settings.json` — hook registrations
- `CLAUDE.md` — framework identity doc

If paths.json missing: RED
If manifest.json missing: YELLOW — "Run /warp:init to generate one from your project."
If settings.json missing: RED — "Hooks won't fire without this."
If CLAUDE.md missing: YELLOW — "The system works but Alex won't have identity context."

### 3. Hooks
Read `.claude/settings.json` and verify hooks are registered for:
- `SessionStart` — at least 1 hook
- `UserPromptSubmit` — smart-context should be here
- `PreToolUse` — security and guard hooks
- `PostToolUse` — session tracker, edit watcher
- `Stop|SessionEnd|StopFailure` — session stop

For each missing lifecycle event: YELLOW — "Some automation won't work."
If no hooks at all: RED — "Hooks are the backbone. Re-run the installer."

### 4. Agent System
Check `.claude/agents/` has:
- `00-alex/alpha.md` — orchestrator
- `00-alex/beta.md` — judgment model
- `00-alex/gamma.md` — adhoc builder
- `00-alex/delta.md` — oneshot runner
- `01-adhoc/` — adhoc mode agents
- `02-oneshot/` — oneshot mode agents

If alpha.md missing: RED — "Core agent missing."
If any sub-agents missing: YELLOW — "Some build modes won't work fully."

### 5. Memory Stores
Check these files exist (can be empty):
- `.claude/project/events/events.jsonl`
- `.claude/project/memory/learnings.jsonl`
- `.claude/project/memory/traces.jsonl`

If missing: YELLOW — "Create empty files. They'll populate as you use the system."

### 6. Skills
Count `.md` files in `.claude/commands/`. Report total.
If < 10: YELLOW — "Fewer skills than expected. Check the installer ran correctly."
If 0: RED — "No skills installed."

### 7. Reference Docs
Check `.claude/project/reference/` has:
- `reasoning-frameworks.md`
- `operational-loop.md`
- `learning-lifecycle.md`

If any missing: YELLOW — "Reasoning engine will work but without documentation."

### 8. Git
Check `.git/` exists and `git status` works.
If not a git repo: YELLOW — "Builder isolation (worktrees) won't work. Run: git init"

### 9. Smart Context
Check if `ANTHROPIC_API_KEY` is set in environment or `.env.local`.
If missing: YELLOW — "Smart context (prompt enrichment) won't work. The system still functions but without automatic context injection. Set your API key in .env.local."

### 10. Optional Tools
Check for (report as informational, not blocking):
- `codex` CLI — for cross-model compliance reviews
- `gemini` CLI — for research diversity
- `yt-dlp` — for YouTube transcript ingestion

For each missing: INFO — "Optional. Install for enhanced features."

## Output Format

```
WarpOS Health Check
═══════════════════

  ✓  Directory structure         All 10 directories present
  ✓  Core files                  paths.json, manifest.json, settings.json, CLAUDE.md
  ✓  Hooks                       6 lifecycle events registered
  ✓  Agent system                4 Alex agents + adhoc + oneshot teams
  ✓  Memory stores               3 stores ready
  ✓  Skills                      64 skills installed
  ✓  Reference docs              3 frameworks available
  ✓  Git                         Repository initialized
  !  Smart context               ANTHROPIC_API_KEY not found — set in .env.local
  ─  Optional: codex             Not installed (npm i -g @openai/codex)
  ─  Optional: gemini            Not installed
  ─  Optional: yt-dlp            Not installed

Result: HEALTHY (1 warning)
```

Use simple language. No jargon. If something is broken, tell them exactly what to do to fix it.
