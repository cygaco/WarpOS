# WarpOS User Guide

How to actually use the system. Not the reference — the workflow.

If you've just installed, start at §1. If you want to know why five-terminal-setup matters, skip to §4.

---

## 1. First Session (15 min)

1. Install (see [README.md](README.md))
2. Open Claude Code in your project
3. Type `/warp:tour` — guided introduction, reads out what you have
4. Type `/warp:health` — verifies every system is wired up, reports green/yellow/red
5. Fix anything red before doing real work
6. Type `/mode:solo` — stay solo for your first hour, get a feel for the baseline

Don't touch the team modes yet. Don't run `/preflight:run`. Don't spawn agents. Just type normal prompts and watch what fires:

- Every prompt → `smart-context.js` runs, injects relevant memory
- Every Edit/Write → format + typecheck + lint + memory-guard run
- Every session end → handoff is generated

That's the baseline. Everything else builds on it.

---

## 2. Git Discipline (the #1 thing most new users get wrong)

Before you use the team modes, before you run oneshot, before you touch anything risky — get your git habits in order. AI agents move fast and touch many files. Without discipline, you'll lose work or end up with an unshippable main branch.

### The Rules

1. **`main` / `master` stays stable and clean at all times.** Never commit exploratory work directly to it. It should always be a branch you can hand to a stranger.

2. **Every feature, fix, or experiment starts on its own branch.** Name it something you'll recognize in two days: `feat/resume-export`, `fix/auth-timeout`, `spike/new-prompt-pipeline`.

3. **Commit often. Push often.** Rule of thumb: any time you'd feel bad losing the work, commit. Any time you'd feel bad if your laptop died, push. Your commit terminal (Terminal 5, see §4) exists for this reason — `/commit:both` stages, commits with a smart message, and pushes in one go.

4. **Test on a branch, not on main.** When you're about to try a risky refactor or let oneshot run, be on a throwaway branch. If it goes sideways, `git checkout main` and your clean state is intact.

5. **Merge deliberately.** When a branch is good, open a PR (even to yourself), review what changed, then merge. Don't fast-forward random work into main.

### Practical Daily Pattern

```
# Start of day
git checkout main && git pull
git checkout -b feat/today-thing

# During work
/commit:both   # every milestone, multiple times per session

# End of feature
/qa:check && /redteam:scan
# if green: open PR or merge to main
# if red: fix on the branch, never bypass
```

### Why This Matters More With AI

When Alex or a builder agent writes 40 files in 10 minutes, you can't un-think that change by hand. Branches are your undo button. Commits are your save game. Without them, a bad agent run can nuke a week of work.

`/preflight:run` sets up branches with skeleton stubs correctly. Use it at the start of any non-trivial feature.

---

## 3. The Three Modes

Pick one at the start of every work session. Switch with `/mode:solo`, `/mode:adhoc`, `/mode:oneshot`.

| Mode | Who's in the room | When to use |
|------|-------------------|-------------|
| **solo** | Just you + Alex α | System tweaking, quick edits, exploratory reading, skill management |
| **adhoc** | α + β (judgment) + γ (builder orchestrator) | Building ONE feature with oversight. Gamma dispatches builder/evaluator/compliance agents. |
| **oneshot** | δ (standalone) | "Build me this entire skeleton while I go to bed." Delta runs a state machine with cycles and fix loops. No α/β. |

**Starting adhoc:** `/mode:adhoc` → describe the feature → Alpha plans, Beta judges the plan, Gamma executes. Beta protocol: DECIDE (proceed) / DIRECTIVE (do this specific thing) / ESCALATE (ask user).

**Starting oneshot:** `/mode:oneshot` → write a skeleton spec → Delta builds every feature in dependency order with gauntlets between each. Wake up to a completed or diagnosed run.

**Starting solo:** Most of your time. You're Alex's pair. No team overhead.

---

## 4. The Daily Loop

The rhythm that actually works:

```
work → milestone → /learn:combined → /sleep:quick → next
```

**Work** = whatever you're doing (building, fixing, reading, speccing).

**Milestone** = a unit you'd describe to a teammate. "Auth flow done", "refactored the prompt pipeline", "shipped v0.1." Not too small (don't learn after every file save), not too big (don't go 6 hours without).

**`/learn:combined`** runs `/learn:conversation` and `/learn:events` in parallel — extracts patterns from both what you said and what fired in the event log. Writes to `.claude/project/memory/learnings.jsonl`.

**`/sleep:quick`** consolidates: cleans stale markers, compresses old events, refreshes memory indexes. ~5 min.

Once a day or so, do a **`/sleep:deep`** (15-30 min) — full 6-phase cycle with dreaming (surfaces unexpected connections), repair, growth. Do this when you're on a break, not mid-flow.

---

## 5. The Five-Terminal Setup

Parallel terminals with clear jobs. Cross-session inbox (`/session:write` / `/session:read`) keeps them aware of each other.

| Terminal | Mode | Purpose |
|----------|------|---------|
| **1. Main** | `/mode:solo` | System tweaks, skill edits, quick Q&A. Your home base. |
| **2. Build** | `/mode:adhoc` | Feature work with the team. Keep this window focused — don't multitask inside it. |
| **3. Skills** | solo | `/skills:create`, `/skills:edit`, `/hooks:add`. Any time you notice "I keep doing this by hand", make it a skill here. |
| **4. Research** | solo | `/research:deep` — takes 15-40 min, parallel queries to multiple models. Let it run while you work in Terminal 2. |
| **5. Commit** | solo | Just `/commit:both`. Stage, commit, push. While agents work in Terminal 2, ship from here. |

**Coordination rule:** when terminal N finishes something big, it runs `/session:write` with a one-line summary. Other terminals' next prompt auto-reads the inbox via `smart-context.js`.

Your actual `/commit:both` usage: 50+ invocations in recent event log. This terminal is load-bearing.

---

## 6. Top Skill Sequences

From your own event log — the chains that fire most often:

### "Something broke"
```
/fix:deep <error description>
→ [framework auto-selected, 5 solutions proposed, root cause analyzed]
→ pick solution, apply, verify
→ /learn:conversation
```
The `/learn:conversation` capture is what makes the fix stick for next time. Without it, you'll debug the same thing in 3 weeks.

### "I need to think this through"
```
/reasoning:run <problem>
→ [quick-triage OR deep-deliberate, framework picked automatically]
→ /learn:conversation
```

### "I've been working for a while, is everything in sync?"
```
/maps:all        # regenerates every map from current state
→ catches stale hook refs, broken skill dependencies, orphaned systems
→ /check:references    # optional — cross-file integrity
→ /check:requirements   # optional — spec drift
```

### "I want this skill to exist"
```
/skills:create <description>
→ /skills:edit   # refine after seeing it in action
→ repeat
```
Skills are cheap. If you catch yourself typing the same multi-step prompt twice, make it a skill.

### "Oneshot run is mid-flight"
```
/retro:context   # light — just current conversation
/retro:code      # git diff signals
/retro:full      # everything, run at end of run
→ /learn:combined
```

### "What have other sessions been doing?"
```
/session:read    # cross-session inbox
/session:write <update>  # post back
```

### "Mine the raw data"
```
/learn:events "category:prompt"  # patterns from prompts
/beta:mine                       # Beta behavior analysis
```

---

## 7. The Data You're Generating

WarpOS writes a lot of ambient data. Understanding it helps you debug and mine it.

| File | Writes When | What It's For |
|------|-------------|---------------|
| `.claude/project/events/events.jsonl` | Every tool call, prompt, hook fire | Source of truth. Mine for patterns. |
| `.claude/project/memory/learnings.jsonl` | `/learn:*`, sleep cycles | Long-term patterns. Injected into every prompt. |
| `.claude/project/memory/traces.jsonl` | `/reasoning:log`, `/reasoning:run` | Reasoning episodes — what framework, why, outcome. |
| `.claude/project/memory/systems.jsonl` | `systems-sync.js` hook | Living manifest of all systems. Auto-updated. |
| `.claude/runtime/logs/s-<sid>/` | Every prompt (smart-context) | Per-session prompt/enhancement logs. |
| `.claude/runtime/handoffs/` | Every session stop | Handoff docs. Loaded on next session-start. |
| `.claude/runtime/handoff.md` | Session stop | Latest handoff (convenience pointer). |
| `.claude/agents/00-alex/.system/beta/events.jsonl` | Every Beta decision | Beta's judgment log. Not shipped. |

**Never edit these by hand.** Use logger.js (the hook) or the skills that write them. `memory-guard.js` will block direct writes.

**To read them:** `/learn:events`, `/beta:mine`, or just grep.

---

## 8. Troubleshooting

| Symptom | First move |
|---------|-----------|
| `/warp:health` red anywhere | Fix before anything else |
| Hook blocking a legit command | `/hooks:disable <name>` temporarily |
| Lost context after `/clear` | `/session:resume` |
| Don't know what changed | `/session:history` — timestamped handoffs |
| Skill doing the wrong thing | `/skills:edit <name>` |
| Agent hanging | Check `.claude/runtime/logs/s-*` for last entries, restart terminal |
| Maps out of date | `/maps:all --refresh` |
| Events file massive | `/sleep:deep` compresses old entries |

---

## 9. When to Reach for What

**Stuck on a bug for > 15 min?** → `/fix:deep`. Not `/fix:fast` — that's for typos.

**Facing a non-obvious decision?** → `/reasoning:run`. It picks quick-triage vs deep-deliberate for you.

**About to ship?** → `/qa:check` → `/redteam:scan` → `/commit:both`. In that order.

**Starting a big feature?** → `/mode:adhoc` → `/preflight:run` → describe feature.

**Want to build a skeleton from scratch?** → `/mode:oneshot` → write spec → sleep.

**Feeling like "am I missing something?"** → `/maps:all`, then read `SYSTEMS-REFERENCE.md`.

**Long research question?** → Dedicated research terminal, `/research:deep`, come back in 20 min.

**Observed a pattern you want remembered?** → `/learn:conversation`.

---


### The Rules

1. **`main` / `master` stays stable and clean at all times.** Never commit exploratory work directly to it. It should always be a branch you can hand to a stranger.

2. **Every feature, fix, or experiment starts on its own branch.** Name it something you'll recognize in two days: `feat/resume-export`, `fix/auth-timeout`, `spike/new-prompt-pipeline`.

3. **Commit often. Push often.** Rule of thumb: any time you'd feel bad losing the work, commit. Any time you'd feel bad if your laptop died, push. Your commit terminal (Terminal 5) exists for this reason — `/commit:both` stages, commits with a smart message, and pushes in one go.

4. **Test on a branch, not on main.** When you're about to try a risky refactor or let oneshot run, be on a throwaway branch. If it goes sideways, `git checkout main` and your clean state is intact.

5. **Merge deliberately.** When a branch is good, open a PR (even to yourself), review what changed, then merge. Don't fast-forward random work into main.

### Practical Daily Pattern

```
# Start of day
git checkout main && git pull
git checkout -b feat/today-thing

# During work
/commit:both   # every milestone, multiple times per session

# End of feature
/qa:check && /redteam:scan
# if green: open PR or merge to main
# if red: fix on the branch, never bypass
```

### Why This Matters More With AI

When Alex or a builder agent writes 40 files in 10 minutes, you can't un-think that change by hand. Branches are your undo button. Commits are your save game. Without them, a bad agent run can nuke a week of work.

`/preflight:run` sets up branches with skeleton stubs correctly. Use it at the start of any non-trivial feature.

---

## Anti-Patterns

- **Don't work on main.** Always branch. `main` ships; branches explore.
- **Don't let work pile up uncommitted.** If terminal 5 hasn't fired `/commit:both` in an hour of active work, something is wrong.
- **Don't run team modes for solo tasks.** Agent overhead is real. Solo is fast.
- **Don't skip `/learn:conversation` after a hard fix.** You'll repeat the debugging.
- **Don't forget `/maps:all` after structural changes.** Stale maps mislead the next session.
- **Don't ignore `/warp:health` yellow items.** They compound.
- **Don't edit `events.jsonl`, `learnings.jsonl`, etc. directly.** The guard will block you; the system will drift.
- **Don't run oneshot without specs.** It'll build confidently in the wrong direction.

---

## Where To Go Next

- [README.md](README.md) — install and quick start
- [CLAUDE.md](CLAUDE.md) — Alex identity + autonomy rules
- [AGENTS.md](AGENTS.md) — agent system reference
- `.claude/project/reference/` — reasoning frameworks, operational loop, learning lifecycle
- `requirements/README.md` — spec templates (start filling these in with Alex's help)
- `patterns/` — engineering pattern library (Claude API integration recipes)
