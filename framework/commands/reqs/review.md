---
description: "Batch review pending requirement drift entries — approve, reject, or defer spec updates caused by code changes"
---

# /reqs:review — Requirement Drift Review

Review pending requirement changes staged by edit-watcher. Code edits that affect feature specs are auto-staged; this skill lets you batch-review and commit them.

## Input

- `/reqs:review` — Review all pending entries
- `/reqs:review <feature>` — Review only entries for a specific feature (e.g., `onboarding`)
- `/reqs:review --compact` — One-line summary per entry for quick triage

## Procedure

### Step 1: Load pending entries

Read `.claude/events/requirements-staged.jsonl`. Parse all lines, apply last-write-wins resolution (if multiple entries share the same `id`, the latest one wins). Filter to `status === "pending"`.

If a feature argument was given, also filter by `feature`.

If no pending entries: report "No pending requirement changes." and exit.

### Step 2: Group and sort

1. Group entries by `feature`
2. Within each feature, group by `group` (changeset ID — edits within 60s)
3. Sort entries: `overwrite` first, then `extension`, then `new_behavior`, then `removal`
4. Sort confidence: `high` first, then `medium`, then `low`, then `timeout`

### Step 3: Present review

For each feature group, display:

```
## {feature} ({count} pending changes)

### Changeset {group} ({count} edits)
Context: "{edit_why}"

1. **{DRIFT_TYPE}** [{confidence}] in {spec_file}
   Code edit: {edit_how}
   File: {file}
   Spec says: "{spec_excerpt}"
   Suggested: {suggested_update}
```

If `--compact` flag: show one line per entry instead:
```
{feature} | {drift_type} | {confidence} | {file} → {spec_file} | {suggested_update}
```

### Step 4: Collect decisions

ESCALATE to the user for each entry (or batch). User chooses per entry:

- **approve** — Accept the suggested update, proceed to commit
- **reject** — Mark as intentionally different (code is right, spec stays as-is). Ask for a brief note.
- **defer** — Skip for now, entry persists for next review
- **edit** — User provides a custom update text before approving
- **batch approve low** — Approve all low-confidence entries at once (they're just "verify spec" reminders)
- **batch dismiss low** — Reject all low-confidence entries at once

### Step 5: Commit approved changes

For each approved entry:

1. Read the target spec file (`spec_file`)
2. If `spec_excerpt` is present, find it in the file (substring match, fuzzy fallback: strip whitespace + try first 40 chars)
3. Present the proposed Edit: show old text → new text
4. Execute the Edit on the spec file
5. If the spec file has a `<!-- STALE -->` marker referencing the same source file, remove it
6. Append status update to requirements-staged.jsonl:
   ```
   node -e "const fs=require('fs'); fs.appendFileSync('.claude/events/requirements-staged.jsonl', JSON.stringify({id:'ENTRY_ID', ts:new Date().toISOString(), type:'status_update', status:'approved', reviewed_at:new Date().toISOString(), reviewed_by:'user'}) + '\n')"
   ```

For rejected entries, append with `status: "rejected"` and include `review_note`.
For deferred entries, append with `status: "deferred"`.

Each decision is written immediately — if the session crashes mid-review, already-decided entries keep their status.

### Step 6: Summary

After all decisions:

```
/reqs:review complete

  Approved: {N} (spec files updated)
  Rejected: {N} (intentional divergence documented)
  Deferred: {N} (will appear in next review)
  Remaining: {N} pending entries

  Files updated: {list of spec files edited}
```

## Rules

- ALWAYS escalate to the user — never auto-approve or auto-reject
- Write status updates to JSONL immediately after each decision (crash safety)
- Use appendFileSync for JSONL writes (memory-guard requires this)
- Group related entries to reduce decision fatigue
- Show high-confidence overwrites first — these are the most important
- Low-confidence entries can be batch-dismissed
