---
description: STUB — flag commits to FRAMEWORK_PREFIXES that were never promoted
---

# /check:warpos-promote-coverage — STUB

For every recent product-repo commit touching FRAMEWORK_PREFIXES paths, verify it was promoted (or marked do-not-promote).

```bash
node scripts/checks/warpos-promote-coverage.js
```

Refine via:
```
/reasoning:run "Design a check for 'I edited the framework but forgot to promote.' Source of truth for promotion records: .warpos/transactions/? Canonical's commit log? A locally-cached promotion ledger? How to handle bug-fix cherry-picks from canonical?"
```
