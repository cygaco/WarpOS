<!-- requirement-format-legacy -->
# High-Level Stories — /warp:update --status wires manifest validator into per-file table

**Sprint:** `SP-20260522-005`
**PRD:** `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260522-005\prd.md`

> High-level stories use the `H-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`.

## H-1 — As a maintainer auditing a product install, I run node scripts/warpos/update.js --status --target /path/to/dreamteam and see a per-class findings table (drift / missing / unmanifested / user_modified / schema_violation).

**As** the user
**I want** As a maintainer auditing a product install, I run node scripts/warpos/update.js --status --target /path/to/dreamteam and see a per-class findings table (drift / missing / unmanifested / user_modified / schema_violation).
**So that** Maintainers gain a single command to audit any WarpOS install's manifest honesty against its on-disk state — for Jobzooka, DreamTeam, or canonical itself. CI can wire this in as a release gate. Today the audit requires manually running validate.js with the right --root flag; the new wrapper is one canonical entry point.

Linked granular stories: see `granular-stories.md`.
Linked requirements: `R-1`.

## H-2 — As a CI gate, I run /warp:update --status --json --target $REPO and parse the output for non-zero exit + findings counts.

**As** the user
**I want** As a CI gate, I run /warp:update --status --json --target $REPO and parse the output for non-zero exit + findings counts.
**So that** Maintainers gain a single command to audit any WarpOS install's manifest honesty against its on-disk state — for Jobzooka, DreamTeam, or canonical itself. CI can wire this in as a release gate. Today the audit requires manually running validate.js with the right --root flag; the new wrapper is one canonical entry point.

Linked granular stories: see `granular-stories.md`.
Linked requirements: `R-2`.
