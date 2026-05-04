---
description: Detect installed-version vs canonical-version drift (>7d stale)
---

# /check:warpos-staleness

Compares `.claude/framework-installed.json` against canonical `version.json`. Fails if installed < canonical for >7 days AND no pending `/warp:update` transaction.

```bash
node scripts/checks/warpos-staleness.js
```

Set `WARPOS_CANONICAL=/path/to/WarpOS` if the canonical repo isn't auto-discoverable from `installedSource`. Pass `--json` for machine-readable output.

**Fix when failing:** `/warp:update --to <canonical-version> --apply`
