---
description: "[DEPRECATED] Use /portfolio:ponder instead. This alias will be removed in v0.10."
---

# /product:ponder — DEPRECATED

> ⚠  /product:ponder is deprecated. Use /portfolio:ponder instead. Aliases will be removed in v0.10. (This banner is shown once per session.)

This skill has moved to the `/portfolio:*` namespace. Invoking `/product:ponder` will call `/portfolio:ponder` with all arguments forwarded unchanged.

## Procedure

```bash
node scripts/portfolio/alias.js ponder $ARGUMENTS
```

All flags, outputs, and behavior are identical to `/portfolio:ponder`. See `.claude/commands/portfolio/ponder.md` for full documentation.
