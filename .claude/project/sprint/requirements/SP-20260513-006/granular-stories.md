# Granular Stories — Turbo as mode argument

**Sprint:** `SP-20260513-006`
**High-level stories:** `high-level-stories.md`

## S-1 — Add Inputs section to all three `/mode:X` skill bodies

**As** a maintainer
**I want** each of `.claude/commands/mode/{solo,adhoc,oneshot}.md` to document `--turbo [--scope <csv>|all] [--ttl <duration>] [--reason "<text>"]` in an Inputs section
**So that** the operator can discover the flag from the skill itself, and the contract is consistent across all three.

AC: `AC-1.1`, `AC-1.2`, `AC-1.3`.
Linked: `H-1`, `R-2`.

## S-2 — Pick a default scope per mode and document it

**As** a maintainer
**I want** each `/mode:X` skill body to declare its default scope set when `--turbo` is passed without `--scope`, informed by mining `paths.eventsFile` for historical `/turbo` invocations
**So that** the shortcut actually fits each mode's typical workload (and never includes safety-floor-adjacent scopes like push-to-main).

Defaults (proposed; to be confirmed by data + Beta):
- `/mode:solo --turbo` → scope `safe-edit` (file edits, lint, tests; never push, never deploy).
- `/mode:adhoc --turbo` → scope `builder-friendly` (file edits, lint, tests, npm scripts, git commit; never push, never deploy).
- `/mode:oneshot --turbo` → scope `delta-friendly` (everything in `builder-friendly` plus dispatch-agent reads + Bash for npm/test; TTL bumped to 4h to match a typical Delta run; never push, never deploy).

AC: `AC-2.1`, `AC-2.2`, `AC-2.3`.
Linked: `H-2`, `R-1`.

## S-3 — Skill-body procedure: invoke `scripts/turbo/apply.js` after `mode-set`

**As** a maintainer
**I want** each `/mode:X` skill body to specify: after the `mode-set` CLI succeeds, if `--turbo` is present, invoke `scripts/turbo/apply.js` with the per-mode default scope merged with operator-supplied `--scope` / `--ttl` / `--reason`
**So that** the composition happens in the skill body (the operator-facing contract), not by mutating the underlying tools.

AC: `AC-3.1`, `AC-3.2`.
Linked: `H-1`, `R-2`.

## S-4 — Recovery section for `mode-set ok, turbo apply failed`

**As** an operator
**I want** each `/mode:X` skill body to include a recovery section explaining "mode is active without turbo; re-run `/turbo` manually with the same args"
**So that** I'm never stranded in a half-applied state.

AC: `AC-4.1`, `AC-4.2`.
Linked: `H-3`, `R-3`.

## S-5 — Sibling note in `/turbo.md`

**As** a future maintainer reading `/turbo` cold
**I want** a single paragraph at the top of `.claude/commands/turbo.md` stating "also invoked by `/mode:<solo|adhoc|oneshot>` when `--turbo` is passed; see those skill bodies for per-mode default scopes"
**So that** the composition surface is documented from both directions.

AC: `AC-5.1`.
Linked: `H-4`, `R-4`.
