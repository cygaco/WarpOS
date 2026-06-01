# Upgrade notes — 0.12.1 → 0.13.0

A low-risk, additive release: the `models:` skill suite + a model-catalog audit to
latest + a gemini key-precedence fix. No breaking changes, no schema changes, no
migrations. See `changelog.md` for the full list. If your project pins a gemini model,
note the new default is `gemini-3.1-pro-preview` (override with `GEMINI_MODEL`).

## Pre-flight

1. Tag your current state: `git tag pre-warpos-0.13.0-update HEAD`.
2. Confirm clean working tree: `git status --porcelain` empty.

## Run the update

```bash
node scripts/warpos/update.js --to 0.13.0 \
  --source ../WarpOS \
  --target . \
  --dry-run

node scripts/warpos/update.js --to 0.13.0 \
  --source ../WarpOS \
  --target . \
  --apply
```

## Rollback

```bash
git reset --hard pre-warpos-0.13.0-update
```

(or restore from `.warpos/transactions/<latest>/backup/`).
