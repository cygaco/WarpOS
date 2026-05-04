---
description: Validate .claude/manifest.json against the v1 schema.
user-invocable: true
namespace: manifest
reads: [paths.manifest]
writes: []
---

# /manifest:validate

Run static checks on the manifest:
- Required top-level keys (`$schema`, `project`, `warpos`, `agents`)
- Required project keys (`name`, `slug`)
- Required warpos keys (`version`, `installed`)
- `warpos.version` is semver
- `agentProviders[*]` is one of `claude|openai|gemini`

## Input

```
$ARGUMENTS  →  none
```

## Output

```
W <warning>
E <error>
OK manifest valid (<n> warnings)
FAIL manifest invalid (<n> errors)
```

## Exit codes

- `0` valid (warnings allowed)
- `1` invalid (errors present) OR manifest missing
- `2` usage error

## Example

```bash
$ node scripts/manifest/cli.js validate
OK manifest valid (0 warnings)
```

## Implementation

```bash
node scripts/manifest/cli.js validate
```

See: `tests/transcripts/manifest-validate.md`.
