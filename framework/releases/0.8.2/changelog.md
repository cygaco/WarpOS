# WarpOS 0.8.2 — 2026-05-20

Patch release that ships the **version-bump-guard** hook (the enforcer the 2026-05-20 capsule-staleness audit recommended) and commits three already-registered-but-untracked script files that 0.8.1's capsule promised but git did not have.

This release also rolls in the substantive notes 0.8.1's auto-generated changelog never received.

## What's new since 0.8.0 (combined 0.8.1 + 0.8.2)

### New hooks

- **`version-bump-guard.js`** (PreToolUse Bash). Refuses git commits that stage framework-prefix files when `framework/releases/<version.json#version>/` already exists. Closes the gap that let 28 assets + 179 SHA drifts accumulate against 0.8.0 over 5 days without a bump. Mode: warn (soft rollout through 2026-06-15), then block. Bypass: `WARPOS_VERSION_GUARD=off` or sentinel `.warpos/version-bump-guard-disable` (both logged).
- **`ledger-presence-guard.js`** (PostToolUse Bash). Verifies ROADMAP.md / RELEASES.md rows actually get written after watched sprint commands (SP-20260519-001 R-5). Was registered in 0.8.1 but its source file was untracked — now committed.
- **`lint-hook-output.js`** (PreToolUse Edit|Write). Payload-shape validator for Edit/Write (SP-20260518-008 R-3). Was in settings.json but missing from registry — now properly registered.

### New skills (since 0.8.0)

- `/sprint:full` — autonomous sprint orchestrator chaining plan → design → execute → release-prep → retro
- `/check:ac-coverage` — verifies every AC has a `verified_by:` link
- `/check:node-procs` — session-side snapshot of leaked Node processes
- `/enforcement:log`, `/enforcement:list` — track policies that lack a named enforcer
- `/product:think` — reasoning helper for product-level decisions
- `/roadmap:add`, `/roadmap:cleanup` — direct ROADMAP.md row management
- `/session:dump` — generate a richer handoff snapshot

### New scripts

- `scripts/sprint/ledger.js` — shared writer for ROADMAP/RELEASES rows
- `scripts/sprint/backfill-ledgers.js` — historical backfill
- `scripts/sprint/full.js` — engine for `/sprint:full`
- `scripts/sprint/check-ac-coverage.js`, `scripts/sprint/append-decision.js`, `scripts/sprint/validate-autonomy-config.js`
- `scripts/sprint/test-plan-honors-registry-primary.js`, `scripts/sprint/test-sprint-full.js`

### New agent policy

- `ledger-presence.json`
- `sprint-full-autonomy.json`
- `version-bump-guard.json` (this release)

### New schemas

- `regression-fixture.schema.json`
- `sprint-full-autonomy.schema.json`

### Paths registry additions

- `paths.enforcementDebt`, `paths.roadmap`, `paths.releases`

### Doc/honesty improvements

- README.md, PROJECT.md, AGENTS.md, USER_GUIDE.md updated to reflect current agent inventory (retired `evaluator`/`auditor` removed; current agents `reviewer`, `req-reviewer`, `learner`, `stub-scaffold`, `test-runner`, `visual-review` properly listed).
- DICTIONARY.md expanded from 1 to 7 sprint-vocabulary entries.
- DUMP.md removed + added to `.gitignore`.

### 179 SHA-drifted assets

Updated skills, hooks, agents, references that had accumulated edits against the 0.8.0 label without a version bump.

## Breaking changes

None. Existing skills, hooks, and APIs unchanged.

## Schema changes

None.

## Migrations

None required.

## Bypass for the version-bump-guard

If the guard fires inconveniently during transitional work:

```powershell
# PowerShell (current process)
$env:WARPOS_VERSION_GUARD = 'off'; git commit -m "..."; Remove-Item Env:WARPOS_VERSION_GUARD
```

```bash
# Bash
WARPOS_VERSION_GUARD=off git commit -m "..."
```

Or write a sentinel file (gitignore-safe):

```
touch .warpos/version-bump-guard-disable
```

Both bypass mechanisms log to stderr so misuse is observable. The guard is in **warn mode through 2026-06-15** — won't block, only surfaces a stderr warning. After 2026-06-15, the declared `block` mode takes effect.

## Pinned commit

Captured at release-build time (recorded in release.json#commit after scripts/warpos/release-build.js runs).
