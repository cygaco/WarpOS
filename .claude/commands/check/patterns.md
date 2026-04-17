---
description: Cross-run intelligence and automation proposals — diagnose recurring patterns or propose prevention
---

# /check:patterns — Pattern Intelligence

Single owner for "What patterns keep recurring across sessions and runs?" Mines learnings, traces, events, retros, and beta decisions to find repeat offenders and propose automation. Complements `/learn:events` (which discovers patterns from raw events) by focusing on **cross-run** recurrence.

## Input

`$ARGUMENTS` — Mode selection:
- No args — run both modes (diagnose then propose)
- `diagnose` — Cross-run analysis only (embedded in `/retro:full`)
- `propose` — Automation gap proposals only (embedded in `/sleep:deep`)
- `apply` — propose + auto-apply approved proposals (requires confirmation)
- `--since=7d` / `--since=30d` — time window (default: 14d)
- `--json` — raw JSON output

---

## Files to read (all modes)

All paths below are **keys in `paths.json`** — read the registry at `.claude/paths.json` first, then resolve:

- `paths.learningsFile` — validated learnings (cross-session)
- `paths.tracesFile` — reasoning episodes with quality scores
- `paths.eventsFile` — raw event log
- `paths.events/code.jsonl` — code-level events (under `paths.events` dir)
- `paths.betaEvents` — beta decision history (= `paths.betaSystem/events.jsonl`)
- `paths.systemsFile` — system changes over time
- `paths.maps/enforcements.jsonl` — current automation coverage (under `paths.maps` dir)
- `paths.handoffs/*.md` — session summaries
- `paths.reference/reasoning-frameworks.md` — quality scoring rubric
- Retro docs — resolve from `manifest.projectPaths.retro` if present; else skip

`paths.agentSystem`, `paths.betaSystem`, `paths.maps`, etc. are all keys in `paths.json`. If any are missing, warn — the registry should be complete.

`git log --since=<window>` for commit-level signals.

---

## Mode: diagnose — Cross-Run Analysis

Spawn one Explore agent (thoroughness: very thorough). Produces intelligence for the next run.

### Step 1: Load signals

- Learnings within window, grouped by category and tag
- Traces with `quality_score <= 2` (weak fixes — possible recurring issues)
- Beta DIRECTIVE decisions that repeated similar directives
- Event spikes (bursts of error events, repeated hook blocks)
- Git: files edited 3+ times in window → hotspots

### Step 2: Cluster

Group signals by theme:
- **Same root cause across sessions** — e.g. "Windows path bug" appears in 3 hooks (RT-004 archetype)
- **Same skill failing repeatedly** — e.g. `/fix:fast` re-escalated to `/fix:deep` N times
- **Same file edited for the same reason** — e.g. types file for the 5th rename this month
- **Hook blocks triggering same false positive** — e.g. memory-guard on `2>&1` redirects

### Step 3: Produce META-INTELLIGENCE report

Overwrites `paths.reference/META-INTELLIGENCE.md` (or a retro subpath if manifest has one):

```markdown
# Pattern Intelligence — {date}

## 1. Repeat Problem Areas

| Pattern | Occurrences | Window | Status | Root cause | Prevention |
|---------|-------------|--------|--------|------------|------------|

## 2. Rule Effectiveness Scorecard

| Rule / Learning | Added | Recurred? | Verdict | Suggested next step |
|-----------------|-------|-----------|---------|---------------------|

Verdicts: EFFECTIVE / NEEDS ENFORCEMENT / UNTESTED / DEPRECATED

## 3. Agent Performance Trends

| Agent | This window | Previous | Trend | Common failure mode |
|-------|-------------|----------|-------|---------------------|

## 4. Skill Usage Patterns

| Skill | Calls | Success rate | Chained-into | Chained-after |
|-------|-------|--------------|--------------|---------------|

## 5. Top 3 Prevention Proposals

Concrete, implementable actions. Each cites: pattern cluster, estimated friction reduction, implementation path, who implements (skill/hook/manifest edit).
```

### Token budget

~8-12 source files, ~600-1000 lines after filtering. ~6-8K tokens.

---

## Mode: propose — Automation Gap Proposals

Scan for patterns that are **recurring but not automated**, propose concrete fixes.

### Step 1: Load current automation

- `scripts/hooks/*.js` — hook scripts
- `.claude/settings.json` — hook wiring
- `.claude/commands/**/*.md` — all skills
- `paths.maps/enforcements.jsonl` — coverage map

### Step 2: Cross-reference with signals

For each recurring pattern found in diagnose mode:
- Is there a hook that prevents it? If no → propose
- Is there a skill that handles it? If no → propose
- Is there a learning without backing enforcement? → propose

For each file hotspot (edited 3+ times with similar intent):
- Propose a lint rule, a template, or a hook matcher

For each false-positive block pattern in hooks:
- Propose a refinement to the guard's regex/logic

### Step 3: Present

**Report mode** (default):

```
Proposal {N}: {one-line summary}
  Where: {file path to modify or create}
  Because: {pattern evidence — cite learning ID / bug cluster / trace ID}
  Implementation:
    - {exact change or new file to create}
  Expected impact: {qualitative}
  Confidence: {high | medium | low}
```

Wait for approval. Accept: "approve all", "approve 1,3,5", "skip 2", "edit 2" (user provides alternative).

**Apply mode** (`apply` arg):
- One git commit per approved proposal
- Never modifies more than 3 files per proposal without explicit confirmation
- Never removes existing checks — only adds
- Low-confidence proposals skipped by default (require `--include-low`)

### Step 4: Summary

```
| Proposal | Status | Commit |
|----------|--------|--------|
| {N} — {summary} | applied / skipped / rejected | {sha if applied} |
```

---

## Combined Mode (no args)

Runs `diagnose` first, then feeds its "Top 3 Prevention Proposals" into `propose` mode as additional sources. Full pipeline: **what recurs → what to automate → approved changes**.

---

## When to run

- **End of a multi-day work push** — `diagnose` to see what kept coming up
- **On `/sleep:deep`** — embedded automatically in Phase 5 (growth)
- **After a series of similar-looking bugs** — `diagnose --since=7d` to confirm the cluster
- **Monthly** — `propose` with `--since=30d` for bigger structural proposals

## Related

- `/learn:events` — pattern extraction from raw events (single-session)
- `/learn:combined` — conversation + event learning (single-session)
- `/retro:full` — session-level retrospective (feeds into this)
- `/hooks:friction` — specifically finds friction patterns suggesting missing hooks
- `/maps:enforcements` — current automation coverage (this skill proposes additions to it)
