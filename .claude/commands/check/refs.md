---
description: Cross-file reference integrity — broken links, orphans, stale SPEC_GRAPH edges
---

# /check:refs — Reference Integrity

Validates that every file path reference across `.claude/`, `docs/`, and `scripts/hooks/` resolves to a real file on disk.

## Input

`$ARGUMENTS` — Mode selection:
- No args — full scan, show summary
- `--json` — full scan, raw JSON output
- `--fix` — remove broken STALE banners (not yet implemented)

## Step 1: Run the Scanner

```bash
node scripts/hooks/ref-checker.js --summary
```

Read the output. This scans all `.md`, `.js`, `.json`, `.jsonl`, `.ts`, `.tsx` files in `.claude/`, `docs/`, and `scripts/hooks/`.

## Step 2: Triage Results

For each category:

### Broken References
- **High priority**: skill/agent `.md` files referencing moved/deleted hooks or stores
- **Medium**: doc cross-references pointing to renamed files
- **Low**: bare path mentions in prose (may be examples, not live refs)

For each broken ref, check if the target was renamed (grep for the filename) or truly deleted.

### SPEC_GRAPH Issues
- Edges pointing to nonexistent files mean staleness propagation is broken for that path.
- Fix by updating `docs/00-canonical/SPEC_GRAPH.json`.

### Orphaned Files
- Not all orphans are dead weight — entry points (CLAUDE.md, top-level configs) and event logs are excluded automatically.
- Review orphans by directory. Files in `retros/`, `research/`, and `audit-reports/` are often standalone records.
- True orphans (abandoned skills, dead hooks, stale maps) should be deleted or re-linked.

## Step 3: Report

Summarize findings:
- Total files / refs scanned
- Broken refs with suggested fixes
- Orphans worth investigating
- SPEC_GRAPH edges to update

If `$ARGUMENTS` contains `--json`, run with no `--summary` flag and return raw JSON instead.
