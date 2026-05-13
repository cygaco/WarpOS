# High-Level Stories — Harden /warp:update — preflight + transactional apply + postflight verify

**Sprint:** `SP-20260513-005`
**PRD:** `prd.md`

## H-1 — Preflight refuses unsafe updates before they touch the disk

**As** the operator running `/warp:update` on a downstream project
**I want** every relevant `check:warpos-*` gate to run BEFORE any file
write
**So that** unsafe updates (missing capsule, version-source drift, missing
install baseline, missing migrations, structure parity gaps, tracked
transients) are caught upfront with exact remediation, not after the apply
has half-trashed my install.

Linked granular stories: `S-1`, `S-2`, `S-3`, `S-4`, `S-10`.
Linked requirements: `R-1`..`R-12`.

## H-2 — Apply is transactional — mid-failure rolls back cleanly

**As** the operator
**I want** the apply phase to record what it intends to touch, back up
each affected file, and on ANY error during copy/migration restore the
backup AND remove any partial writes — then exit non-zero with the
transaction id
**So that** I never have to manually puzzle out what got half-written when
an apply died at file 87 of 412. My install is either fully old, fully
new, or in a known partial state I can diagnose by reading the transaction
record.

Linked granular stories: `S-5`, `S-6`.
Linked requirements: `R-13`..`R-18`.

## H-3 — Postflight emits structured evidence the operator can read

**As** the operator
**I want** after a successful apply, a postflight phase to run
`/warp:health` + path-resolution + manifest-honesty + applied-migrations
+ provider-smoke (when available), bundle the results into an evidence
package, and either green-light the install or surface specific
post-conditions that need attention
**So that** I see proof the install is sane, not just a "Update applied"
log line. If something is off, I have an evidence file with timestamps to
share when I ask for help.

Linked granular stories: `S-7`, `S-8`.
Linked requirements: `R-19`..`R-22`.

## H-4 — Recurring update failures get captured for prevention learning

**As** Alex (and as the operator who reviews learnings)
**I want** every preflight gate failure and every transaction rollback to
emit a structured event (`warpos.update.preflight`,
`warpos.update.transaction.rollback`, `warpos.update.postflight`) to
`events.jsonl` and the docs to update the troubleshooting section of
`/warp:update.md` with the mined catalog
**So that** repeated failure signatures surface in `/learn:deep` and
`/issues:scan` instead of getting re-encountered cold by future operators
on future updates.

Linked granular stories: `S-9`, `S-11`.
Linked requirements: `R-22`, `R-23`, `R-29`.
