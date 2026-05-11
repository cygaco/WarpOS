---
description: "Drain the warpos-to-update.md flag ledger written by /warp:flag — mark entries promoted/blocked/deferred, record canonical SHAs, archive, and produce a promotion report."
user-invocable: true
---

# /warp:promote-flags — Drain the flag ledger

This skill is the second half of the flag workflow. `/warp:flag` writes
entries; `/warp:promote-flags` consumes them.

This is NOT the same engine as `/warp:promote` (which propagates
framework FILES from a source repo into the canonical WarpOS clone). The
two share a name but not a contract — they live in separate scripts so
rollback is easy.

## Default behaviour

Dry-run summary. Reads `warpos-to-update.md`, groups entries by status
and category, prints the summary, exits.

```bash
node scripts/warpos/promote-flags.js
```

## Marking an entry

```bash
node scripts/warpos/promote-flags.js \
     --mark "dispatch-route guard" \
     --to promoted \
     --canonical-sha abcdef1234567890 \
     --apply
```

`--mark` matches against the entry **title** as a case-insensitive
substring. Multiple matches are all updated.

Recognised statuses: `open`, `in_progress`, `promoted`, `blocked`,
`deferred`, `needs_decision`, `duplicate`, `abandoned`.

When `--to promoted` is applied, the engine also stamps
`- Promoted-At: <ISO timestamp>` on the entry.

## Archiving promoted entries

```bash
node scripts/warpos/promote-flags.js --archive-promoted --apply
```

Moves every entry whose `Status: promoted` into
`warpos-promoted-archive.md` under a fresh `## Archived <ISO>` heading
and removes those entries from the live ledger. The archive is created
on first archive run with a managed header.

## Promotion report

`--apply` runs write a markdown report to
`.warpos/promote-reports/<ISO>-flags.md` (path resolved via
`paths.warposPromoteReports`). The report records the summary at the
moment of the run plus every mutation applied. Reports are useful for
post-mortems and for `/warp:release` notes.

## Combining flags

```bash
node scripts/warpos/promote-flags.js \
     --mark "stale gemini catalog" --to promoted --canonical-sha 12abc34 \
     --archive-promoted --apply --json
```

Single-pass mark + archive + machine-readable output.

## What this command does NOT do

- It does NOT modify code, hooks, or specs.
- It does NOT call out over the network.
- It does NOT silently drop entries — unresolved items stay in the
  ledger with `Status: open` / `blocked` / `deferred` /
  `needs_decision` / `duplicate` / `abandoned`.

## Failure modes

- No ledger at the expected path → exit 0 with a one-line "nothing to
  drain" message.
- `--mark` with no matching entry → exit 2.
- `--to <bad-status>` → exit 2.

## See also

- `/warp:flag` — write entries to the ledger.
- `/warp:promote` — separate engine for framework-file propagation.
- `paths.warposFlagLedger`, `paths.warposPromotedArchive`,
  `paths.warposPromoteReports`.
