---
description: Detect already-applied WarpOS migration scripts left on disk in consumer projects
---

# /scan:warpos-applied-migrations

Migration scripts under `migrations/X-to-Y/` exist only in canonical WarpOS. Once a consumer project's `installedVersion >= Y`, the migration source is dead weight and should be removed.

```bash
node scripts/checks/warpos-applied-migrations.js
```

**Fix when failing:** `git rm -rf migrations/X-to-Y/` for each stale dir.
