---
description: Query the events log by type, time range, or regex match.
user-invocable: true
namespace: events
reads: [paths.eventsFile]
writes: []
---

# /events:query

Filter `paths.eventsFile` and print matching events.

## Input

```
$ARGUMENTS  →  forwarded to: node scripts/events/cli.js query
  --type=<str>          filter by event.type
  --since=<ISO>         events with ts >= ISO
  --until=<ISO>         events with ts <= ISO
  --grep=<regex>        match against JSON-serialized event
  --source=<file>       override events file (fixture testing)
  --json                emit one JSON per match (default text)
  --help                flag reference
```

## Output

Plain text (default): one match per line, `<ts>  <type>  <message>`.
With `--json`: one JSON object per match.
Match count goes to stderr (`# N match(es)`).

## Exit codes

- `0` success (zero matches is success — empty filter result is not failure)
- `1` events file missing/unreadable
- `2` usage error

## Empty-state behavior

If `paths.eventsFile` is empty, prints to stderr `events log is empty — start the system and try again` and exits 0.

If filters match zero events, stderr says `# 0 match(es)` and exits 0.

## Example

```bash
$ node scripts/events/cli.js query --type=prompt --source tests/fixtures/events/happy.jsonl
2026-05-02T10:00:00Z  prompt  hello
2026-05-02T10:03:00Z  prompt  goodbye
```

## Implementation

Run:

```bash
node scripts/events/cli.js query $ARGUMENTS
```

See: `tests/transcripts/events-query.md` for captured-output verification.
