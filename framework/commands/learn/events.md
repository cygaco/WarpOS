---
description: Mine the event log for learnings — patterns, anomalies, and insights from tool/prompt/spec/audit events
---

# /learn:events — Event Log Mining

Reads `.claude/events/events.jsonl` and extracts learnings from behavioral patterns. The event log captures everything — tool calls, prompts, spec changes, audit actions, modifications, inbox messages. This skill finds the signal in that noise.

## Input

`$ARGUMENTS` — Optional focus: a category (`tool`, `prompt`, `spec`, `audit`, `modification`, `inbox`), a time range (`--since 2d`), or a topic keyword. Default: all categories, last 3 days.

## Procedure

### Step 1: Load events

Read `.claude/events/events.jsonl`. Filter by arguments if provided. Get a count per category to understand the data shape.

```bash
# Category breakdown
grep -oP '"cat":"[^"]*"' .claude/events/events.jsonl | sort | uniq -c | sort -rn

# Recent events (last N lines for quick scan)
tail -50 .claude/events/events.jsonl
```

### Step 2: Analyze by category

#### Tool events (`cat: tool`)
- **Hotspot files**: Which files get the most Read/Edit/Write actions? Frequent edits = unstable code or unclear ownership.
- **Tool patterns**: Ratio of Read vs Edit (high reads = exploration, high edits = churn). Grep frequency = searching for something unclear.
- **Failed actions**: Any tool errors or denied permissions — what was being attempted?

#### Prompt events (`cat: prompt`)
- **Vague prompts**: Short, no file context, no scope — correlated with longer resolution times?
- **Effective prompts**: Specific, outcome-focused — what made them work?
- **Correction patterns**: "no not that", "wrong", "stop" — what preceded these?

#### Spec events (`cat: spec`)
- **STALE markers**: Which specs are stale and for how long? Persistent staleness = spec debt.
- **Propagation gaps**: Spec changed but no corresponding code change (or vice versa).
- **Churn**: Same spec edited multiple times — requirements unclear?

#### Audit events (`cat: audit`)
- **Hook triggers**: Which hooks fire most? Any blocked actions?
- **Guard patterns**: What's being caught by gates/guards?

#### Modification events (`cat: modification`)
- **Self-modification frequency**: How often is infrastructure changing? High = system not settled.
- **What's changing**: Skills, hooks, CLAUDE.md, memory stores?

#### Inbox events (`cat: inbox`)
- **Cross-session patterns**: What are other sessions communicating about?

### Step 3: Extract learnings

For each pattern found, draft a learning:
- **What**: The pattern observed (with evidence — event counts, file names, timestamps)
- **Why it matters**: What this suggests about the workflow, codebase, or process
- **Actionable**: A concrete tip, rule, or change to propose

### Step 4: Present

```
/learn:events — {N} patterns from {M} events ({time range}):

  1. [tool] StepCollect.tsx edited 12x in 3 sessions — unstable component
  2. [prompt] 40% of prompts under 10 words — correlated with 2x more corrections
  3. [spec] 8 STALE markers older than 7 days — spec debt in onboarding
  4. [audit] gate-check blocked 3 builder agents — false positives on skeleton gutting

Save as learnings? (all / pick numbers / skip)
```

### Step 5: Save confirmed learnings

Append confirmed entries to `.claude/memory/learnings.jsonl`:
```json
{"ts":"ISO","intent":"event_analysis","tip":"...","conditions":{"source":"events.jsonl","category":"...","evidence":"..."},"fix_quality":null,"score":0,"source":"learn:events","status":"logged"}
```
