---
description: Catch transient state accidentally committed (.warpos/, qa-*.png, runtime/qa-*/, etc.)
---

# /scan:warpos-tracked-transients

Scans `git ls-files` for patterns that should never be tracked: `.warpos/` (per-install audit log), `qa-*.png` (regenerable QA screenshots), `runtime/qa-*/`, `runtime/research/`, `runtime/logs/`.

```bash
node scripts/checks/warpos-tracked-transients.js
```

**Why this exists:** the 2026-05-03 cleanup found 100+ `.warpos/transactions/` backup files committed by mistake; this check makes that regression impossible.

**Fix when failing:** `git rm --cached <file>` and verify `.gitignore` covers the pattern.
