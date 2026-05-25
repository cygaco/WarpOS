---
description: "From WarpOS, run the idea→on-screen on-ramp against a registered product: dispatches /bootstrap:spinup into the product's repo. Thin wrapper over bootstrap:spinup (the real implementation)."
user-invocable: true
---

# /portfolio:spinup — On-ramp a product from WarpOS

`/portfolio:spinup <slug> [--clone <target>] [--phase <name>] [--resume]` — the
from-WarpOS entry point to the product on-ramp. It dispatches the real
implementation, **`/bootstrap:spinup`**, into the registered product's working
tree, without leaving or retargeting the WarpOS session.

> **One implementation, two entry points.** `bootstrap:spinup` (in-project) is
> the source of truth; this wrapper just runs it against a chosen product from
> WarpOS. Both deliver the same result: canonical docs + roadmap-with-sprints +
> the core loop on screen.

## Input

`$ARGUMENTS` — `<slug> [--clone <target>] [--phase <intent|canon|roadmap|onscreen>] [--resume]`

- **slug** — a registered product slug (see `/portfolio:list`). Exits 1 if not found.
- All other flags pass through verbatim to `/bootstrap:spinup`.

## Procedure

Dispatch `/bootstrap:spinup` into the product via the portfolio cross-repo
dispatcher (`/portfolio:run`, engine `scripts/portfolio/dispatch.js`) — a fresh
subprocess with `CLAUDE_PROJECT_DIR` set to the product's `repo_path`; the parent
WarpOS session is never retargeted:

```bash
node scripts/portfolio/dispatch.js <slug> /bootstrap:spinup [--clone <target>] [--phase <name>] [--resume]
```

Target subprocess stdout/stderr pipes to the caller; exit code propagates. See
`/portfolio:run` for the dispatch contract, input gating, and TRACE.

## Relationship

- `/bootstrap:spinup` — the real implementation (run it directly when you're
  already inside the project).
- `/portfolio:run` — the general cross-repo dispatcher this wraps.
- `/portfolio:new <slug>` — scaffold the product first; then `portfolio:spinup <slug>`.
