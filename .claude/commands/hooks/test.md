---
description: Test all hooks with synthetic payloads and measure execution time
user-invocable: true
---

# /hooks:test — Test All Hooks

For each hook in settings.json:
1. Craft a synthetic JSON payload matching what Claude Code would send
2. Pipe it to the hook script
3. Report exit code and any output
4. Measure execution time per hook (flag anything >100ms)

Report results table.
