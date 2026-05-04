---
description: Smoke-dispatch one agent role (or all non-claude roles) with a tiny ping prompt.
user-invocable: true
namespace: agents
reads: [paths.manifest]
writes: []
---

# /agents:test

Verify cross-provider dispatch works for one or all roles by sending a ≤200-byte ping prompt and checking the response.

## Input

```
$ARGUMENTS  →  forwarded to: node scripts/agents/cli.js test
  <role>                test exactly one role (e.g. reviewer, redteam)
  --all                 test every role with manifest.agentProviders[role] !== "claude"
```

## Output

One line per tested role:

```
<role>: ok provider=<p> model=<m> reply=<first 40 chars>
<role>: FAIL <reason>
<role>: provider=claude — native dispatch (no test possible from CLI)
```

## Exit codes

- `0` all tested roles ok (claude roles count as ok — they don't dispatch via CLI)
- `1` one or more roles failed
- `2` usage error

## Empty-state behavior

If `manifest.agentProviders` is empty or absent, prints `no non-claude roles in agentProviders — nothing to test` and exits 0.

## Example

```bash
$ node scripts/agents/cli.js test reviewer
reviewer: ok provider=openai model=gpt-5.5 reply=PONG
```

## Implementation

Run:

```bash
node scripts/agents/cli.js test $ARGUMENTS
```

See: `tests/transcripts/agents-test.md`.

## Cost note

`--all` makes one API call per non-claude role (typically 4-5). Each is ≤200 bytes prompt + tiny output. Cost is negligible but not free; do not put in a hot loop.
