---
description: Run the WarpOS system coherence graph across 15 drift types.
user-invocable: true
---

# /check:coherence

Run:

```bash
node scripts/system/coherence.js $ARGUMENTS
```

The command writes `paths.maps/system-coherence.graph.json` and reports green,
yellow, or red for spec, path, mode, agent, decision, provider, hook, memory,
config, install, security, test, runtime, pattern, and version drift.
