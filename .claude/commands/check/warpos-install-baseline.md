---
description: Verify a WarpOS install baseline exists (.claude/framework-installed.json present, installedVersion ≠ 0.0.0) before /warp:update may proceed.
---

# /check:warpos-install-baseline

Preflight gate composed by `scripts/warpos/preflight.js`. Closes failure-mode F-4 (missing per-machine snapshot turns update into a fresh install with massive ADD_SAFE).

`status: green` — `.claude/framework-installed.json` exists, `installedVersion` is real.
`status: red` — file missing OR `installedVersion === "0.0.0"` OR malformed JSON.
`status: yellow` — `--force-fresh` override accepted; apply will be treated as a fresh install.

```bash
node scripts/checks/warpos-install-baseline.js [--target <path>] [--force-fresh] [--json]
```

Linked: SP-20260513-005 / S-4 / AC-S-4.2 / R-4 / C-1 / failure-mining.md F-4.
