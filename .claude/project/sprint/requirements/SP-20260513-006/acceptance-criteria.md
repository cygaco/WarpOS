# Acceptance Criteria — Turbo as mode argument

**Sprint:** `SP-20260513-006`
**PRD:** `prd.md`

## S-1 — Inputs section in all three skill bodies

- **AC-1.1**: Given each of `.claude/commands/mode/{solo,adhoc,oneshot}.md`, when read, then it contains an `## Inputs` section that documents `--turbo`, `--scope <csv>|all`, `--ttl <duration>`, `--reason "<text>"` with the same wording.
- **AC-1.2**: Given the same three files, when `--turbo` is omitted, then the documented procedure equals the pre-change procedure verbatim (no regression).
- **AC-1.3**: Given a grep for `--turbo` across `.claude/commands/mode/`, when run, then exactly three matches are found (one per mode skill).

## S-2 — Default scope per mode

- **AC-2.1**: Given each `/mode:X` skill body, when read, then it explicitly lists the default scope set used when `--turbo` is passed without `--scope`.
- **AC-2.2**: Given the documented defaults, when audited against `scripts/turbo/apply.js`'s safety floor, then no default scope includes any irreversible action (push, deploy, branch deletion).
- **AC-2.3**: Given `/mode:oneshot --turbo`, when invoked, then the documented default TTL is 4h (matching a typical Delta run); for `/mode:solo` and `/mode:adhoc`, default TTL is whatever `apply.js` defaults to today (60m).

## S-3 — Skill-body procedure

- **AC-3.1**: Given each `/mode:X` skill body's Procedure section, when read, then it explicitly says "if `--turbo` is present, after `mode-set` succeeds invoke `node scripts/turbo/apply.js --scope <default> [...operator args]`".
- **AC-3.2**: Given operator-supplied `--scope` / `--ttl` / `--reason` in the same invocation, when the skill body is followed, then the operator args override the per-mode defaults (operator wins on every overlapping field).

## S-4 — Partial-state recovery

- **AC-4.1**: Given each `/mode:X` skill body, when read, then it includes a Recovery section saying "if `mode-set` succeeded but `turbo apply` failed, mode is active without turbo — re-run `/turbo` manually with the same args".
- **AC-4.2**: Given a synthetic dry-run that simulates a turbo-apply failure post-mode-set, when the documented recovery is followed, then the operator reaches a known-good state (mode active + turbo applied) with one extra command.
- **AC-4.3**: Given each `/mode:X` skill body's Recovery section, when read, then it documents the turbo-already-active case ("apply.js overwrites prior scope/TTL with the new one; no merge").

## S-5 — `/turbo.md` sibling note

- **AC-5.1**: Given `.claude/commands/turbo.md`, when read, then it contains a single paragraph (near the top, in the Reference or Description block) declaring "also invoked by `/mode:<solo|adhoc|oneshot>` when `--turbo` is passed; see those skill bodies for per-mode default scopes".
