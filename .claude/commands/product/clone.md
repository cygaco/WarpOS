---
description: "[DEPRECATED] Use /portfolio:clone instead. This alias will be removed in v0.10."
---

# /product:clone — DEPRECATED

> ⚠  /product:clone is deprecated. Use /portfolio:clone instead. Aliases will be removed in v0.10. (This banner is shown once per session.)

This skill has moved to the `/portfolio:*` namespace. Invoking `/product:clone` will call `/portfolio:clone` with all arguments forwarded unchanged.

## Procedure

```bash
node scripts/portfolio/alias.js clone $ARGUMENTS
```

All flags, outputs, and behavior are identical to `/portfolio:clone`. See `.claude/commands/portfolio/clone.md` for full documentation.
