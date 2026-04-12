---
description: Cross-run intelligence and automation proposals — diagnose recurring patterns or propose prevention
---

# /check:patterns — Pattern Intelligence

Single owner for "What patterns keep recurring?" Replaces retro:meta and eval:automation.

## Input

`$ARGUMENTS` — Mode selection:
- No args — run both modes (diagnose then propose)
- `diagnose` — Cross-run analysis only (embedded in retro:full)
- `propose` — Automation gap proposals only (embedded in eval:all)
- `apply` — Propose + auto-apply approved proposals

---

## Mode: diagnose — Cross-Run Analysis

Spawn ONE Explore agent (thoroughness: very thorough). Produces intelligence for the next run.

### Files to Read

```
docs/09-agentic-system/retro/{each NN}/BUGS.md
docs/09-agentic-system/retro/{each NN}/HYGIENE.md
docs/09-agentic-system/retro/{each NN}/LEARNINGS.md
docs/09-agentic-system/retro/{latest}/RETRO.md
docs/09-agentic-system/retro/{latest}/DEPRECATED.md (if exists)
```

### Output: META-RETRO.md

Overwrites `docs/09-agentic-system/retro/META-RETRO.md` with 5 sections:

#### 1. Repeat Problem Areas

| Pattern | Runs | Count | Status |
|---------|------|-------|--------|
| React strict mode ref bugs | 01, 03, 06 | 8 | Declining (HYGIENE Rule 12 helping) |
| Stale closure / intermediate save | 03, 06 | 5 | Persistent (needs gate) |

#### 2. Rule Effectiveness Scorecard

| Rule | Added | Recurred? | Verdict |
|------|-------|-----------|---------|
| Rule 12 — mountedRef pattern | Run 01 | Yes (03), No (06) | EFFECTIVE |
| Rule 25 — saveSession before onComplete | Run 03 | Yes (06) | NEEDS ENFORCEMENT |

Verdicts: EFFECTIVE / NEEDS ENFORCEMENT / UNTESTED / DEPRECATED

#### 3. Agent Performance Trends

| Agent Type | Run 03 | Run 06 | Trend | Common Failure |
|-----------|--------|--------|-------|----------------|

#### 4. Run-Over-Run Metrics

| Metric | Run 01 | Run 02 | ... |
|--------|--------|--------|-----|
| Total bugs | | | |
| P0/P1 bugs | | | |
| New HYGIENE rules | | | |
| Repeat bugs | | | |

#### 5. Top 3 Prevention Proposals

Concrete, implementable actions. Each cites: bug class, estimated reduction, implementation path.

### Token Budget

~8-12 retro files, ~600-1000 lines. ~6-8K tokens.

---

## Mode: propose — Automation Gap Proposals

Scan for automation gaps and propose linter/hook/skill improvements.

### Step 1: Load Sources

1. `docs/09-agentic-system/retro/*/HYGIENE.md` — hygiene rules across runs (if they exist)
2. `docs/09-agentic-system/retro/*/BUGS.md` — bug entries across runs (if they exist)
3. `git log --since="7 days ago" --name-only` — file hotspots
4. `.claude/events/events.jsonl` — recent change events
5. `.claude/memory/learnings.jsonl` — recurring learnings

### Step 2: Load Current Automation

1. `scripts/lint-*.js` — linter checks
2. `scripts/hooks/*.js` — hook scripts
3. `.claude/settings.json` — hook wiring
4. `.claude/commands/**/*.md` — all skills

### Step 3: Cross-Reference

- For each HYGIENE rule: automated by linter/hook/skill? If not → propose
- For each recurring BUG pattern (same root cause 2+ runs): prevented? If not → propose
- For file hotspots (edited 3+ times): propose lint rule

### Step 4: Present or Apply

**Report mode** (default):
```
Proposal: [what to add/change]
Where: [file path]
Because: [HYGIENE Rule NN / BUG-NNN / observer pattern]
Code: [exact change]
```

Wait for approval. Accept: "approve all", "approve 1,3,5", "skip 2".

**Apply mode** (`apply` arg):
- One git commit per proposal
- Never modifies more than 3 files per proposal
- Never removes existing checks — only adds
- Low-confidence proposals skipped

### Step 5: Summary

Table of findings: proposed, applied, skipped.

---

## Combined Mode (no args)

Runs diagnose first, then feeds its Top 3 Prevention Proposals into propose mode as additional sources. This creates the full intelligence pipeline: what recurs → what to automate.
