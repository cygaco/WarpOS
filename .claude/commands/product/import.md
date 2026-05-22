---
description: "[DEPRECATED] Use /portfolio:import instead. This alias will be removed in v0.10."
---

# /product:import — DEPRECATED

> ⚠  /product:import is deprecated. Use /portfolio:import instead. Aliases will be removed in v0.10. (This banner is shown once per session.)

This skill has moved to the `/portfolio:*` namespace. Invoking `/product:import` will call `/portfolio:import` with all arguments forwarded unchanged.

## Procedure

```bash
node scripts/portfolio/alias.js import $ARGUMENTS
```

All flags, outputs, and behavior are identical to `/portfolio:import`. See `.claude/commands/portfolio/import.md` for full documentation.
