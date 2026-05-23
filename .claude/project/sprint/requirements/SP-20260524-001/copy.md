<!-- requirement-format-legacy -->
# COPY Requirements — Install fixture CI matrix

**Sprint:** `SP-20260524-001`
**PRD:** `prd.md`

> CLI output strings. Test-tool internal use only — no end-user-facing UI copy.

## C-1 — Help text header (linked story `S-1`)

**Context:** Printed by `--help`.
**Text:**

> Usage: node scripts/warpos/test-install-matrix.js [--scenarios <list>] [--json] [--fixture-root <path>] [--keep-failed] [--inject-regression <name>] [--help]
>
> Runs the WarpOS install-fixture CI matrix. Spins up ephemeral fixture projects and exercises /warp:setup and /warp:update against 5 representative scenarios.

**Notes:** Scenarios list rendered below header.

## C-2 — Per-scenario start banner (linked story `S-1`)

**Context:** Printed at the start of each scenario run (human mode).
**Text:**

> [scenario <id>] <name> — fixture: <fixture-path>

**Notes:** Suppressed in `--json` mode.

## C-3 — Per-scenario pass line (linked story `S-1`)

**Context:** Printed when a scenario completes successfully.
**Text:**

> [scenario <id>] PASS (<duration>ms, <assertions> assertions)

## C-4 — Per-scenario fail line (linked story `S-1`)

**Context:** Printed when a scenario fails.
**Text:**

> [scenario <id>] FAIL — <assertion-name>: <detail>

## C-5 — Matrix summary (linked story `S-8`)

**Context:** Printed after all scenarios run.
**Text:**

> Results: <pass>/<total> passed (<duration>ms total)

## C-6 — Capsule resolution skip (linked story `S-5`)

**Context:** Scenario 4 when insufficient real capsules are found and helper synth is unavailable.
**Text:**

> [scenario 4] SKIP — INSUFFICIENT_CAPSULES: need >= 2 versions newer than baseline, found <n>. See <path> for capsule resolution detail.

## C-7 — Planted regression caught (linked story `S-10`)

**Context:** Meta-test mode — matrix runs against an injected regression and reports.
**Text:**

> [meta] injection <name> caught by scenario <id>: <expected-assertion>

## C-8 — Fixture cleanup moved-aside (linked story `S-1`)

**Context:** On scenario failure without `--keep-failed`, fixture moved aside for inspection.
**Text:**

> [scenario <id>] fixture preserved at <_failed-path> for inspection (re-run with --keep-failed to inhibit this move)
