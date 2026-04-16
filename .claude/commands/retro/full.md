---
description: Full retro — context + git log + code diffs + cross-run analysis, all 9 categories
user-invocable: true
---

# /retro:full — Complete Retrospective

All 4 sources. All 9 categories. Includes cross-run pattern analysis.

## The 4 Sources

| Source | What It Catches | How |
|--------|----------------|-----|
| **Conversation context** | Bug reports, decisions, deferred items, UX feedback | Scan in-context (0 tool calls) |
| **Git log** | Reverts, hotspot files, orphan branches, commit patterns | `git log` + `git branch` |
| **Code diffs** | Bug fixes, new patterns, type changes, removed features | `git diff` |
| **Cross-run retro docs** | Recurring patterns, rule effectiveness, trends | Read prior run BUGS/HYGIENE/LEARNINGS |

## The 9 Categories

| # | Category | Doc | Primary Source |
|---|----------|-----|----------------|
| 1 | Process changes | RETRO.md | Context + git log |
| 2 | Tooling changes | TOOLING.md | Context + git log |
| 3 | Bugs | BUGS.md | Code diffs + context |
| 4 | New patterns | HYGIENE.md | Code diffs |
| 5 | Repeat problem areas | LEARNINGS.md | Cross-run docs + current findings |
| 6 | Hygiene rules | HYGIENE.md | Code diffs |
| 7 | Requirement propagation | (inline) | Event log (spec + code categories) |
| 8 | Agent performance | RETRO.md | Git log + context + cross-run trends |
| 9 | Prevention proposals | LEARNINGS.md | Synthesized from all sources |

## Procedure

### Phase A: Context Scan (0 tool calls)

Run `/retro:context` inline — scan the conversation for bug reports, decisions, deferred items, UX feedback, surprises, and patterns. Hold findings for Phase F.

### Phase B: Git Log Scan (~3 commands)

```bash
git log --oneline --since="3 days ago" --format="%h %ai %s" | head -30
git log --since="7 days ago" --name-only --format="" | sort | uniq -c | sort -rn | head -10
git branch --all | grep -E 'agent/|wt-|temp'
```

### Phase C: Code Diff Scan (~2 commands)

```bash
git log --oneline -1 -- 'the retro directory (check manifest.json projectPaths.retro for location)/'
git diff {baseline}..HEAD --stat -- 'src/' 'scripts/'
git diff {baseline}..HEAD -- 'src/' | head -500
```

### Phase C2: Requirement Propagation Check

Delegate to `/check:requirements drift`. This queries the event log for spec and code events, cross-references per feature, checks hierarchy propagation.

Add findings under REQUIREMENTS PROPAGATION:
```
REQUIREMENTS PROPAGATION:
  14. [STALE] onboarding/INPUTS.md — code removed "Edit resume text" but spec still references it
  15. [COMPLETE] skills-curation — all spec layers updated
  16. [UNMATCHED] page.tsx — layout change with no spec update
```

If no events exist, falls back to `git diff --name-only`.

### Phase D: Cross-Run Analysis

Delegate to `/check:patterns diagnose`. This spawns an Explore agent to read all prior retro docs and returns:
1. Repeat problem areas (grouped by root cause, with run counts and status)
2. Rule effectiveness scorecard (EFFECTIVE / NEEDS ENFORCEMENT / UNTESTED / DEPRECATED)
3. Agent performance trends (cross-run success/failure)
4. Run-over-run metrics (bugs, P0s, recurring, new rules per run)

### Phase E: Get next IDs

Grep current run's BUGS.md for last bug number. Grep HYGIENE.md for last rule number.

### Phase F: Classify and present

Merge findings from all 4 sources. Deduplicate. Present grouped by source:

```
/retro:full — {N} findings from 4 sources:

CONTEXT (conversation):
  1. [BUG] Domain pills vanish on deselect — user report, FIXED
  2. [DECISION] Auto-advance after recon — replaces Continue button
  3. [UX+] "Deploying recon drones" praised
  4. [DEFERRED] Manual URL input removed

GIT LOG:
  5. [HOTSPOT] StepCollect.tsx — 4 changes this session

CODE DIFFS:
  6. [BUG] Step4Profile — exclusion tracking fix
  7. [PATTERN] Rule 50: exclusion tracking for pills

CROSS-RUN:
  8. [REPEAT] BUG-012 class — recurrence 5
  9. [RULE EFFECTIVE] Rule 12 (mountedRef) — no recurrence
  10. [NEEDS ENFORCEMENT] Rule 25 — recurred
  11. [PREVENTION] PostToolUse lint for saveSession

Log which? (all / pick numbers / skip)
```

### Phase G: Write confirmed entries

Write to BUGS.md, HYGIENE.md, LEARNINGS.md, RETRO.md. For cross-run findings, also overwrite META-RETRO.md with repeat areas, rule scorecard, trends, metrics, and top 3 prevention proposals.

### Phase H: Summary table

```
/retro:full complete — {N} findings:

| Doc | Entries |
|-----|---------|
| BUGS.md | BUG-056, BUG-057 |
| HYGIENE.md | Rule 50, Rule 51 |
| LEARNINGS.md | 1 repeat area, 2 prevention proposals |
| RETRO.md | 2 decisions, 1 deferred, 2 UX notes |
| META-RETRO.md | Updated: 3 repeat areas, 4 rule scores, 3 proposals |
```

## Token Budget

~8-10K tokens total.
