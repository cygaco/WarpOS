# Oneshot Token Guide

> Reference for managing the orchestrator's (Delta's) context budget across a multi-hour skeleton build. Companion to `agent-dispatch-guide.md`.
>
> Last revised: 2026-04-28 (post run-12, completed 14-feature build in ~5h with ~1M ctx headroom remaining)

---

## TL;DR

The orchestrator (Delta) is the dominant ongoing token cost in a long oneshot. Every notification adds ~500–2K tokens to its context; every tool result is held in conversation. Without explicit guardrails, a 14-feature run will OOM the orchestrator midway. With them, the run finishes with headroom to spare.

The 5 tactics below are **non-negotiable** for runs > 2 hours.

---

## Tactic 1: Bash subprocess for build-chain dispatch

**The single biggest lever.** See `agent-dispatch-guide.md` for the full architecture. Summary: the in-process `Agent` tool returns 50–100K tokens of agent prose into the orchestrator's conversation. Bash subprocess writes to a file; orchestrator reads only the parsed JSON envelope (~1–3KB).

**Tokens saved per build-chain dispatch:** ~50–95K
**Run-12 estimate:** ~1.5M tokens saved across the full run (16 reviewers × multiple gauntlet rounds + 14 builders × initial + retry dispatches)

If you find yourself reaching for `Agent({subagent_type: "builder"})` or `Agent({subagent_type: "reviewer"})` — STOP. Use the Bash dispatch pattern instead.

---

## Tactic 2: `wc -c` before reading any output file

```bash
# Don't:
cat .claude/runtime/dispatch/builder-output.json     # could be 100KB

# Do:
wc -c .claude/runtime/dispatch/builder-output.json   # always 1 line
# Then conditionally read if size is meaningful
```

A 1-byte output means the agent never produced an envelope (typically maxTurns hit or auth failure). Reading the file in that case wastes context for no information gain.

For peeking, use `head -c 300` to see the first 300 bytes — usually enough to tell if it's a real envelope, an error, or a truncation.

---

## Tactic 3: Aggregate via Node scripts, never via in-context reading

Reading 16 reviewer envelopes one-by-one to figure out pass/fail = ~200KB of orchestrator context per gauntlet aggregation. Running a Node script that returns a 30-line table = ~800 bytes.

Existing scripts:
- `scripts/delta-aggregate-reviews.js [features...]` — pass/fail per feature × role
- `scripts/delta-build-fix-brief.js <feature>` — unified fix brief from 4 reviewer envelopes
- `scripts/delta-show-findings.js <feature> <role>` — peek at one envelope's inner JSON

Pattern: **whenever you'd be tempted to read multiple files into context to "see what's there", write a Node script that returns a one-line summary instead.**

---

## Tactic 4: Code lives on agent branches, never in orchestrator context

Builders write 30–100K tokens of code per dispatch. The orchestrator never reads that code. It only reads the JSON envelope (which lists files modified + commit SHA).

When merging:
- `git merge --no-ff agent/<feature>` does the actual work; orchestrator just sees the merge commit count.
- For conflicts, use `git checkout --theirs <file>` or `--ours <file>` for unambiguous picks; only Read the conflicted file when semantic resolution is needed.
- Never `git diff` the full feature into context — it's 1000s of lines. Use `git show --stat <sha>` (file count + insertion/deletion summary, ~10 lines).

---

## Tactic 5: Maintain state in store.json, not in conversation

The store at `.claude/agents/02-oneshot/.system/store.json` tracks every feature's status, commit SHA, gate-check results, fix attempts, and heartbeat. Use it.

- After each phase, `node scripts/delta-mark-built.js <feature> <sha> <typecheck>` and `delta-mark-done.js <feature>` update the store.
- `node scripts/delta-heartbeat.js '{...}'` updates `store.heartbeat` for external monitoring.
- The orchestrator's "memory" is the store, not conversation history.

This means you can `/clear` between phases and the next phase resumes from `store.json`. Each phase becomes context-bounded.

---

## When orchestrator context starts to bloat

Signs:
- Tool results returning > 5K tokens you don't need
- Re-reading the same file multiple times
- Holding raw reviewer outputs in conversation across phases
- Responses to the user describing more than the immediate next action

Recovery:
1. Write current state to `store.heartbeat` with a checkpoint note.
2. Tell the user: "Context bloat detected. Saving state. Recommend `/clear` and resume in fresh session."
3. The user runs `/clear` then `/oneshot:start` (or `/oneshot:resume`) — Delta reboots from store.json with a clean conversation.

---

## What NOT to do (mistakes from run-12)

| Mistake | Cost |
|---|---|
| `git checkout -- .` (no path filter) reverted my own tooling edits to scripts/ | Phase 5–6 builders reverted to opus-4-7+max instead of sonnet+max — ~$20–40 of unnecessary Anthropic spend |
| Reading full 11K-byte reviewer outputs into context to "see findings" before aggregating | ~150K tokens of conversation bloat across the gauntlet round |
| Re-reading store.json's bug dataset section (1100+ lines) when only counts were needed | ~30K tokens that a `node -e "console.log(...)"` script could have returned in 50 bytes |

---

## Token budget per role (orchestrator-side, observed run-12)

These are tokens the **orchestrator** processes. Subprocess token usage is separate (charged to provider but not against orchestrator's context limit).

| Activity | Orchestrator tokens / event |
|---|---|
| Background task notification | ~300–800 |
| Reading a small JSON envelope (1–3KB) | ~500–1500 |
| `wc -c` size check | ~50 |
| Running `delta-aggregate-reviews.js` | ~200–800 |
| Running `delta-build-fix-brief.js` | ~100 (it writes to a file, doesn't return content) |
| Reading a build's commit log (`git log --oneline -10`) | ~600 |
| `git merge` output (clean) | ~200 |
| `git merge` conflict (with marker grep) | ~500–2000 (don't read the file unless resolving) |
| TaskUpdate / TaskCreate | ~100 each |
| `npm run build` final verification output | ~600–1500 |

**Run-12 total orchestrator-side context use:** estimated 600K–800K tokens across 5 hours. Well within 1M ctx. Without the tactics above, would have been 5–10M+ — a hard fail.

---

## Quick checklist for a new oneshot run

- [ ] Verify `manifest.agentProviders` matches recommended assignment (see agent-dispatch-guide.md)
- [ ] Run `/oneshot:preflight` — it runs the canonical-dispatch smoke test, validates manifest ↔ store, checks for stale worktrees
- [ ] Verify `delta-dispatch-builder.js` uses sonnet-4-6 (default since run-12)
- [ ] Use `run_in_background: true` for ALL builder/reviewer/fixer Bash dispatches
- [ ] After each phase complete, evaluate orchestrator context use; consider `/clear` if approaching 500K tokens
- [ ] Skip per-phase gauntlets if budget-constrained; final gauntlet on merged code is more efficient anyway
- [ ] Commit tooling changes (script edits) immediately after making them — before any cleanup operations
- [ ] Use specific paths in `git checkout --` and `git clean` — NEVER bare `.`
