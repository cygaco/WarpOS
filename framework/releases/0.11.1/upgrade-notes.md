# Upgrade notes — 0.11.0 → 0.11.1

**Low-risk patch.** No breaking changes, no migrations, no schema-structure changes.
Version-coherence + release-integrity hardening only (see `changelog.md`). Safe to
apply directly.

## Pre-flight

1. Tag your current state: `git tag pre-warpos-0.11.1-update HEAD`.
2. Confirm a clean working tree: `git status --porcelain` empty.

## Run the update

```bash
node scripts/warpos/update.js --to 0.11.1 \
  --source ../WarpOS \
  --target . \
  --dry-run

node scripts/warpos/update.js --to 0.11.1 \
  --source ../WarpOS \
  --target . \
  --apply
```

## After updating

Run `node scripts/checks/version-coherence.js` (or `/scan:version-coherence`) — the new
enforcer this release ships. It verifies your install's version + schema labels all agree.
A consumer whose `paths.json` still carries a `v4` label while its content is v5 will see it
flagged; re-run `node scripts/paths/build.js` after the update to re-stamp the derived label.

## Rollback

```bash
git reset --hard pre-warpos-0.11.1-update
```

(or restore from `.warpos/transactions/<latest>/backup/`).
