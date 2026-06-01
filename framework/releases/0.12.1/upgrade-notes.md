# Upgrade notes — 0.12.0 → 0.12.1

Additive, low-risk. No migrations, no breaking changes.

## What changes

- New dev-tooling skills under `.claude/commands/guides/`: `organize`, `integrate`, `coverage` (+ `scripts/guides/registry.js`, `scripts/checks/guides-coverage.js`).
- `_guides/` launch guides now carry guide-anchor frontmatter + a generated `_guides/registry.json`. Guides are wired into the bootstrap pipeline (`spinup`/`lastmile`) with a `.claude/project/maps/guide-integration.jsonl` ledger.
- Marketing/growth agent + skill refinements (text-only).

## Pre-flight

1. Tag your current state: `git tag pre-warpos-0.12.1-update HEAD`.
2. Confirm clean working tree: `git status --porcelain` empty.

## Run the update

```bash
node scripts/warpos/update.js --to 0.12.1 --source ../WarpOS --target . --dry-run
node scripts/warpos/update.js --to 0.12.1 --source ../WarpOS --target . --apply
```

## After updating

- If you maintain custom guides in `_guides/`, run `/guides:organize` then `/guides:integrate`, and `/guides:coverage` to verify everything is anchored + wired.

## Rollback

```bash
git reset --hard pre-warpos-0.12.1-update
```

(or restore from `.warpos/transactions/<latest>/backup/`).
