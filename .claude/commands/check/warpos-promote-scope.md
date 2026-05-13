---
description: Verify scripts/warpos/promote.js FRAMEWORK_PREFIXES list covers every framework-owned top-level directory, so structural changes propagate cleanly to canonical WarpOS.
tags: [check, warpos, promote]
---

# /check:warpos-promote-scope

Reads `scripts/warpos/promote.js` and verifies all known framework-owned top-level directories are in `FRAMEWORK_PREFIXES`. Catches the silent-drop bug fixed 2026-05-03 where `_requirements/`, `_docs/`, `framework/` weren't in scope so structural changes never propagated.

```bash
node scripts/checks/warpos-promote-scope.js
```

**Fix when failing:** add the missing prefix(es) to the `FRAMEWORK_PREFIXES` array.
