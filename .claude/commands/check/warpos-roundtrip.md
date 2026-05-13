---
description: Verify that promoting changes from product to canonical and back to product preserves bytes (no silent transformation through the WarpOS promote/install pipeline) — stub implementation pending refinement.
tags: [check, warpos, promote, stub]
---

# /check:warpos-roundtrip — STUB

Stub script. Refine via:

```
/reasoning:run "Design a check that verifies the product↔canonical↔product round-trip preserves bytes for any FRAMEWORK_PREFIX file. Should it be a property test, integration test, or CI fixture? What's the failure-mode taxonomy (line-ending drift, YAML reordering, JSON whitespace, BOM, schema-coercion)?"
```

```bash
node scripts/checks/warpos-roundtrip.js
```
