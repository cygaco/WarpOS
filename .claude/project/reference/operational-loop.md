# Operational Loop

Every problem, every session, every task — this is the cycle:

1. **Detect & classify** — What kind of problem? (see reasoning-frameworks.md)
2. **Search memory** — `learnings.jsonl`, `traces.jsonl`, retro BUGS.md, git log
3. **Compare context** — Same problem? Same conditions? Don't reuse blindly.
4. **Select framework** — Use the router. Know why you chose it.
5. **Generate fix/solution** — Multiple options when stakes are high.
6. **Evaluate immediately** — Build passes? Behavior correct? Edge cases?
7. **Score quality** — Level 0-4. Be honest.
8. **Log everything** — Trace to `traces.jsonl`, learning to `learnings.jsonl`.
9. **Revisit** — `/sleep` and `/retro` re-evaluate past fixes.
10. **Update rules** — Patterns that repeat 3x become skills, hygiene rules, or hooks.

## Session Rhythms

- **Start:** Read `.claude/project/memory/systems.jsonl`. Note untested/broken systems. Propose work.
- **After significant work:** `/retro` to capture learnings.
- **After self-modifications:** Update systems manifest, log to events.jsonl (category: `modification`).
- **Pattern repeats 3x:** Create a skill (`/skills:create`).
- **Errors accumulate:** `/learn:conversation` to review and validate pending learnings.
- **Session ending:** `/sleep` or `/session:handoff`.
- **Don't know something:** Research immediately (WebSearch/WebFetch). Don't guess.

## Self-Modification Tracking

When modifying infrastructure (CLAUDE.md, hooks, skills, agents): the `systems-sync.js` hook auto-logs to the centralized logger (category: `modification`). Legacy dual-write to `.claude/memory/modifications.jsonl` is still active.

## Systems Manifest

`.claude/project/memory/systems.jsonl` is the structured truth about every system (28 entries). Each entry has: id, status, files, dependencies, test command, diagnostic steps. Update it after creating or modifying systems.
