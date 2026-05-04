---
description: Verify a fresh WarpOS install — manifest, paths, agents, hooks, version, settings.
user-invocable: true
namespace: check
reads: [paths.manifest]
writes: []
---

# /check:install

Run a full structural audit of a WarpOS install:

- `.claude/manifest.json`, `.claude/paths.json`, `.claude/settings.json` present
- `CLAUDE.md` present
- `.claude/agents/`, `.claude/commands/`, `scripts/hooks/` exist and non-empty
- `.claude/framework-manifest.json`, `version.json` present
- `manifest.warpos.installed === true`, `warpos.version` is semver
- At least one agent file under `agents/00-alex/`

## Input

```
$ARGUMENTS  →  forwarded to: node scripts/check/install.js
  --json    JSON output
```

## Output

```
OK    <check name>
FAIL  <check name>  (<detail>)
# <pass>/<total> passed
```

## Exit codes

- `0` install complete
- `1` install incomplete OR repo is not WarpOS (no manifest)
- `2` usage error

## Empty-state behavior (bail-out case)

If `.claude/manifest.json` does not exist, the skill bails immediately with:

```
not a WarpOS-installed repo (no .claude/manifest.json) — run /warp:setup first
```

…and exits 1. The skill does not cascade-fail every check; it makes one clear statement.

## Example (current repo, valid install)

```bash
$ node scripts/check/install.js | tail -3
OK    at least one agent under agents/00-alex
# 12/12 passed
```

## Example (synthetic, missing manifest)

```bash
$ cd /tmp && node /path/to/scripts/check/install.js
not a WarpOS-installed repo (no .claude/manifest.json) — run /warp:setup first
```

(Exit 1.)

## Implementation

```bash
node scripts/check/install.js $ARGUMENTS
```

See: `tests/transcripts/check-install.md` (covers both fixture cases).
