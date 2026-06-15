---
description: Open the roadmap "what's next" board — ranked next-action + in-flight sprints + blockers, at a glance. A thin /panel:* forwarder to the canonical roadmap-board generator — ZERO duplicated logic.
user-invocable: true
namespace: panel
reads: [framework/panel-registry.json, scripts/panel/roadmap.js]
---

# /panel:roadmap — forward to the roadmap "what's next" board

Thin forwarder. The panel registry (`framework/panel-registry.json`) row `roadmap` names the
canonical opener; this skill carries **zero** board-generation logic — it delegates by shelling
the generator:

```bash
node scripts/panel/roadmap.js
```

The board is **read-only**: it renders the ranked next-action (ROADMAP § Prioritized), the current
highest-priority next action (TRACKER), in-flight sprints (`active-sprints.yaml`), and open gaps —
sourced from the live files, never edited from here. All rendering logic lives in
`scripts/panel/roadmap.js`; `/panel:roadmap` is only the unified `panel:` entry verb. See
`/panel:list` for every panel.
