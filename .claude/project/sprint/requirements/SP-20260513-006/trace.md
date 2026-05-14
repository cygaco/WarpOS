# TRACE Requirements — Turbo as mode argument

**Sprint:** `SP-20260513-006`
**PRD:** `prd.md`

## Trace Map

| Source | Requirement | Story | COPY | INPUT | ESD | Ticket | Code | Test | Release | Learning |
|---|---|---|---|---|---|---|---|---|---|---|
| "turbo as mode arg" | R-1 | S-2 | C-2 | — | — | T-… | `.claude/commands/mode/{solo,adhoc,oneshot}.md` | manual + grep | next | LRN |
| "turbo as mode arg" | R-2 | S-1, S-3 | C-1 | IN-1, IN-2, IN-3, IN-4 | — | T-… | `.claude/commands/mode/{solo,adhoc,oneshot}.md` | manual + grep | next | LRN |
| "turbo as mode arg" | R-3 | S-4 | C-3 | — | — | T-… | `.claude/commands/mode/{solo,adhoc,oneshot}.md` | dry-run | next | LRN |
| "turbo as mode arg" | R-4 | S-5 | C-4 | — | — | T-… | `.claude/commands/turbo.md` | grep | next | LRN |

## TR-1 — Reuse existing `turbo-applied` event

**Event kind:** `turbo-applied` (already emitted by `scripts/turbo/apply.js`).
**When:** Each time `scripts/turbo/apply.js` succeeds — same as today.
**Captured fields:** Add `started_by: "/mode:<mode>"` to the event when the apply was invoked through a mode skill (recommended-scope, only if it costs no `apply.js` change — investigated during execution and **deferred** if it would require touching `apply.js`).
**Linked requirement:** `R-2`, `R-4`
**Linked story:** `S-3`, `S-5`
**Why we capture this:** Already captured today; this sprint only changes how the event was invoked, not the event surface. If the `started_by` enrichment requires modifying `apply.js`, that's out of scope per non-goals (no refactor of `apply.js`).

## TR-2 — `mode-set` event remains unchanged

**Event kind:** `mode-set`
**When:** `scripts/mode-set.js` writes the mode marker — same as today.
**Captured fields:** Unchanged.
**Linked requirement:** `R-2`
**Linked story:** `S-3`
**Why we capture this:** Mode entry must remain auditable independent of whether turbo was invoked alongside. The two events together (`mode-set` + `turbo-applied`) tell the full story of a `--turbo` invocation.
