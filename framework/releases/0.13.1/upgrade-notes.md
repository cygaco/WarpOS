# Upgrade notes — 0.13.0 → 0.13.1

A tooling-only patch: it fixes the WarpOS release orchestrator (RI-003) so cutting a
release no longer needs a manual manifest-regen dance. No runtime/product behavior
changes, no breaking changes, no schema changes, no migrations — safe to take directly.

## Pre-flight

1. Tag your current state: `git tag pre-warpos-0.13.1-update HEAD`.
2. Confirm clean working tree: `git status --porcelain` empty.

## Run the update

```bash
node scripts/warpos/update.js --to 0.13.1 \
  --source ../WarpOS \
  --target . \
  --dry-run

node scripts/warpos/update.js --to 0.13.1 \
  --source ../WarpOS \
  --target . \
  --apply
```

## Rollback

```bash
git reset --hard pre-warpos-0.13.1-update
```

(or restore from `.warpos/transactions/<latest>/backup/`).
