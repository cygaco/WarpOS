# Upgrade notes — 0.8.1 → 0.8.2

Patch release shipping the version-bump-guard hook + three previously-untracked script files. No breaking changes, no migrations.

After update, the `version-bump-guard` hook will warn (not block) when you stage framework-prefix files without bumping `version.json`. Soft-rollout through 2026-06-15; flips to block mode after. Bypass options documented in framework/releases/0.8.2/changelog.md.

## Pre-flight

1. Tag your current state: `git tag pre-warpos-0.8.2-update HEAD`.
2. Confirm clean working tree: `git status --porcelain` empty.

## Run the update

```bash
node scripts/warpos/update.js --to 0.8.2 \
  --source ../WarpOS \
  --target . \
  --dry-run

node scripts/warpos/update.js --to 0.8.2 \
  --source ../WarpOS \
  --target . \
  --apply
```

## Rollback

```bash
git reset --hard pre-warpos-0.8.2-update
```

(or restore from `.warpos/transactions/<latest>/backup/`).
