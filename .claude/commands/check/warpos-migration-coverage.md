---
description: Verify every breaking change in a WarpOS release ships with a corresponding migration script under framework/migrations — stub implementation pending refinement.
tags: [check, warpos, migration, stub]
---

# /check:warpos-migration-coverage — STUB

Walk `framework/releases/*/changelog.md`, extract breaking-change markers, verify a corresponding `migrations/{prev}-to-{X}/` dir exists.

```bash
node scripts/checks/warpos-migration-coverage.js
```

Refine via:
```
/reasoning:run "What constitutes 'breaking' in a paths registry, hooks registry, agent spec, or skill? How do you machine-detect breaking changes from a changelog?"
```
