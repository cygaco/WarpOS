---
description: Detect drift between the installed WarpOS version on disk and the latest canonical version, flagging installs that have been stale for more than seven days.
tags: [check, warpos, staleness]
---

# /check:warpos-staleness

Compares `.claude/framework-installed.json` against canonical `version.json`. Fails if installed < canonical for >7 days AND no pending `/warp:update` transaction.

```bash
node scripts/checks/warpos-staleness.js
```

Set `WARPOS_CANONICAL=/path/to/WarpOS` if the canonical repo isn't auto-discoverable from `installedSource`. Pass `--json` for machine-readable output.

**Fix when failing:** `/warp:update --to <canonical-version> --apply`
