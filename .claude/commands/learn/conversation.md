---
description: Conversation learning — extract learnings from conversation, then review and maintain learning quality
---

# /learn:conversation — Conversation Learning Scan + Review

Two phases: extract new learnings from the conversation, then maintain learning quality.

---

## PHASE A: Extract Learnings

Analyze the current conversation. You're looking for three things:

## 1. Corrections

Things the user told you to do differently:
- "No, don't do X" / "Stop doing Y" / "That's wrong because..."
- Wrong assumptions you made
- Approaches the user rejected

## 2. Effective Patterns

Approaches that worked well (confirmed by user or by outcome):
- "Yes, exactly" / "Perfect" / accepted without pushback
- Unusual choices that the user validated
- Techniques that solved a problem efficiently

## 3. Discoveries

Non-obvious things learned about the codebase, tools, or environment:
- API behavior that surprised you
- Tool quirks (CLI flags, auth flows, error codes)
- Codebase patterns not documented elsewhere

## Process

1. Scan the full conversation chronologically
2. For each finding, draft a learning entry
3. Read `.claude/project/memory/learnings.jsonl` — check for duplicates
4. For each new learning, append using **one of these methods only** (memory-guard blocks everything else):
   - **Node.js appendFileSync** (preferred for batch): `node -e "const fs=require('fs'); const path=require('path'); fs.appendFileSync(path.join(process.env.CLAUDE_PROJECT_DIR||'.', '.claude/project/memory/learnings.jsonl'), JSON.stringify(entry)+'\\n')"`
   - **Edit tool** for updating existing entries (score bumps, status changes)
   - **NEVER** use: `writeFileSync` (blocked), bash `>>` redirects (fragile), `echo >>` (blocked by echo guard)

Entry format:
```json
{"ts":"YYYY-MM-DD","intent":"<category>","tip":"<max 300 chars>","status":"logged","score":0,"source":"learn:conversation"}
```

Categories: `bug_fix`, `build`, `spec_work`, `audit`, `refactor`, `deployment`, `testing`, `security_audit`, `meta`, `external_learning`

5. Report what was found and logged:

```
/learn:conversation complete — {N} learnings extracted:

| # | Type | Category | Learning |
|---|------|----------|----------|
| 1 | Correction | bug_fix | ... |
| 2 | Pattern | build | ... |
| 3 | Discovery | meta | ... |

{N} new, {M} duplicates skipped, {K} existing entries updated.
```

## Rules (Phase A)

- Never self-rate (`effective: null` always)
- Cap tips at 300 chars
- Include **Why** context — not just "do X" but "do X because Y"
- Skip trivial findings (typo corrections, one-off commands)
- Update existing entries if a new finding refines a prior learning

---

## PHASE A.5: Learnings Status Audit

Before extracting new learnings, audit the status of existing learnings in this session.

### Three Statuses (these are different things)

| Status | What it means | How to detect |
|--------|---------------|---------------|
| **Implemented** | Has actual code enforcement — a hook blocks violations, a lint rule catches it, or a CLAUDE.md rule mandates it | Learning has `implemented_by` field (e.g., `"hook:excalidraw-guard"`, `"rule:CLAUDE.md§5"`, `"hygiene:Rule52"`) |
| **Informed** | You actively referenced it to make a decision this session | Trace back through conversation: did this learning change what you did? |
| **Injected** | Context-enhancer surfaced it in RECENT LEARNINGS, but you didn't actively reference it | It appeared in the context but didn't drive any decision |

**Injected ≠ Informed ≠ Implemented.** Being in the context window is passive. Informing a decision is active but advisory. Implementation is enforcement.

### Process

1. Read `.claude/project/memory/learnings.jsonl`
2. For each learning, determine its status this session:
   - **Implemented**: Check `implemented_by` field — list these first
   - **Informed**: Did you consciously use this learning to make a decision? Be honest — only count if you can point to the specific decision
   - **Injected**: Was it in the RECENT LEARNINGS context block?
3. For informed learnings: bump `score` by +0.1 (cap at 1.0)
4. Flag learnings that are high-score (>0.7) but NOT implemented — candidates for promotion to hooks/rules
5. Report:

```
LEARNINGS STATUS:
  Implemented: #NN [category] tip → enforced by: hook/rule/lint
  Informed:    #NN [category] tip → decision it guided
  Injected:    N learnings surfaced by smart-context
  Dormant:     N learnings not surfaced this session
  
  Promotion candidates (high score, not implemented):
    #NN [category] tip → suggest: hook/rule/lint
```

---

## PHASE B: Review & Maintain Learnings

After extracting new learnings, review the entire learnings file for quality.

### B.1 Validate Pending Learnings

For each entry with `status: "logged"`:
1. Check if the tip references files/patterns that exist in the current codebase
2. Check if the learning has been applied in practice (search conversation history or recent commits for evidence)
3. If verified useful with evidence: set `status: "validated"`
4. If stale or irrelevant: remove the entry
5. If uncertain: leave as `"logged"` — don't advance without evidence

For each entry with `status: "validated"` and high score (>0.7):
- Check if enforcement exists (hook, rule, lint) — if so, set `status: "implemented"` and add `implemented_by`
- If no enforcement but should have one: flag as promotion candidate

**Critical: Only advance status with evidence. "Sounds right" is not evidence.**

### B.2 Prune

1. Remove duplicate tips (same meaning, different wording)
2. Remove stale learnings (reference files/functions that no longer exist — verify by checking filesystem)
3. Rewrite `.claude/project/memory/learnings.jsonl` with cleaned entries

### B.3 Check Self-Modifications

Read `.claude/project/memory/modifications.jsonl` (if it exists). For each entry with `status: "untested"`:
1. Check if the modified file still contains the change
2. Assess: did the expected outcome materialize?
3. Update status to `validated` or `reverted`

### B.4 Report

```
/learn:conversation complete

LEARNINGS STATUS:
  Implemented: N (enforced by hooks/rules/lint)
  Informed:    N (actively guided decisions this session)
  Injected:    N (surfaced by smart-context, passive)
  Dormant:     N (not surfaced)
  
  Promotion candidates: N (high score, not yet implemented)

EXTRACTION:
  {N} new, {M} duplicates skipped, {K} updated

REVIEW:
  Total:     {N} entries
  Effective: {N}
  Pending:   {N}
  Promoted:  {N} (with evidence)
  Pruned:    {N} ({N} stale, {N} duplicate)
```
