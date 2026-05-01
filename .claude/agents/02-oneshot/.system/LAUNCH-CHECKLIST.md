# Launch Checklist — Agent Regen

Do these steps before hitting go. Don't skip any.

---

## Pre-Flight

### 1. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in values. See `ENV-SETUP.md` for details on each one.

**Minimum required for agents to test features:**

```
ANTHROPIC_API_KEY=your-key-here     # Claude API calls
BRIGHTDATA_API_KEY=your-key-here    # Job scraper
UPSTASH_REDIS_REST_URL=your-url     # Rate limiting, rockets, sessions
UPSTASH_REDIS_REST_TOKEN=your-token # Same
JWT_SECRET=any-random-string-here   # Auth signing
ALLOWED_ORIGINS=http://localhost:3000
```

**Optional (features degrade gracefully without these):**

- Google/LinkedIn OAuth keys — OAuth buttons just won't appear
- Stripe keys — Rocket purchases disabled, free tier still works
- `NEXT_PUBLIC_DUMMY_PLUG_CODE` — Dev tools panel won't activate

### 2. Install Dependencies

```bash
npm install
```

### 3. Verify Build

```bash
npm run build
```

Must pass clean. If it doesn't, something is wrong with the skeleton — fix before launching agents.

### 4. Verify Git State

```bash
git status
git branch
```

You should be on the `skeleton` branch with a clean working tree (no uncommitted changes).

---

## Launch

### Option A: Claude Code (recommended for first run)

Open Claude Code in the project directory and paste:

```
Read and execute .claude/agents/02-oneshot/.system/protocol.md
```

That's it. The oneshot orchestrator reads the system docs, dispatches builders, runs evaluators, and orchestrates the whole build.

### Option B: Manual Phase-by-Phase

If you want to watch each phase:

1. Tell Claude Code: "Run Phase 0 (foundation) from .claude/manifest.json build.phases"
2. Wait for it to complete and verify `npm run build` passes
3. Tell it: "Run Phase 1 (auth + rockets)"
4. Continue phase by phase

This gives you more control but takes longer.

---

## Monitoring

### Check Progress

The store tracks everything:

```bash
cat .claude/agents/store.json | python -m json.tool
```

Look at `features` — each one shows its status:

- `not_started` → hasn't been dispatched yet
- `in_progress` → builder is working on it
- `built` → code written, awaiting evaluation
- `eval_pass` → passed evaluator checks
- `security_pass` → passed security scan
- `done` → fully complete

### Check Git Branches

```bash
git branch -a
```

Active builder agents create branches like `agent/auth`, `agent/rockets`, etc. These get merged after the phase gate passes.

### Check Build Health

```bash
npm run build
```

Run anytime to see if the current state compiles.

---

## If It Breaks

### Circuit Breaker Tripped (auto-halt)

The system halts after:

- 3 consecutive failures on the same step
- 5 total failures across the run
- API key issues (401/402)

To resume, start a new Claude Code session and paste:

```
You are the Oneshot orchestrator for Jobzooka. A previous run was halted.

Read .claude/agents/02-oneshot/.system/store.json to see current state (features[<name>].files + feature statuses).
Read .claude/manifest.json → build.phases for the full build plan.

Resume from where the previous run stopped. Features marked "done" are complete.
Features marked "eval_fail" or "security_fail" need fix agents.
Features marked "not_started" or "in_progress" need builders.

Follow the same rules as .claude/agents/02-oneshot/.system/protocol.md. Do not re-build completed features.
```

### Session Timeout

Same as above — the store has the state, just resume.

### Merge Conflict

If the boss reports a merge conflict: the lead agent analyzes it. If it can't resolve, you'll get an escalation message with options. Pick one and paste your choice back.

---

## What NOT To Do While Agents Are Running

1. **Don't edit files in `src/`** — agents own those files during the build. Editing causes merge conflicts.
2. **Don't switch branches** — stay on `skeleton`.
3. **Don't run `git reset` or `git clean`** — you'll destroy agent work.
4. **Don't kill the process casually** — use the eject protocol (Ctrl+C) so state is saved. If you do kill it, you can still resume from the store.
5. **Don't worry about intermediate build failures** — agents fix their own code. The evaluator catches issues and spawns fix agents.

---

## After Completion

When all features show `done` in the store:

1. Run `npm run build` — final verification
2. Run `npm run dev` — manual smoke test
3. Check the store for any skipped features
4. If everything looks good: merge `skeleton` into `master` (or rename it)

---

## Quick Reference

| What               | Command / File                                                               |
| ------------------ | ---------------------------------------------------------------------------- |
| Start the build    | "Read and execute .claude/agents/02-oneshot/.system/protocol.md"             |
| Check progress     | `cat .claude/agents/02-oneshot/.system/store.json`                           |
| Resume after halt  | Paste resume prompt (see above)                                              |
| Verify build       | `npm run build`                                                              |
| See agent branches | `git branch -a`                                                              |
| Feature specs      | `requirements/05-features/*/PRD.md`                                                  |
| Agent system rules | `.claude/agents/.system/agent-system.md`                                     |
| File ownership     | `.claude/agents/02-oneshot/.system/store.json → features[<name>].files`      |
| Build order        | `.claude/manifest.json → build.phases`                                       |
| Env var guide      | `docs/09-agentic-system/ENV-SETUP.md`                                        |
