---
description: "[DEPRECATED] Use /portfolio:bootstrap instead. This alias will be removed in v0.10."
---

# /product:bootstrap — DEPRECATED

> ⚠  /product:bootstrap is deprecated. Use /portfolio:bootstrap instead. Aliases will be removed in v0.10. (This banner is shown once per session.)

This skill has moved to the `/portfolio:*` namespace. Invoking `/product:bootstrap` will call `/portfolio:bootstrap` with all arguments forwarded unchanged.

## Procedure

```bash
node scripts/portfolio/alias.js bootstrap $ARGUMENTS
```

All flags, outputs, and behavior are identical to `/portfolio:bootstrap`. See `.claude/commands/portfolio/bootstrap.md` for full documentation.
