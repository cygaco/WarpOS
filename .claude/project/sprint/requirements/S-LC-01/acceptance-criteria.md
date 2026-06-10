<!-- requirement-format-legacy -->
# Acceptance Criteria — Mode-Lifecycle Registry keystone

**Sprint:** `S-LC-01`
**PRD:** `.claude/project/sprint/requirements/S-LC-01/prd.md`

> Each AC is a testable statement, linked to its granular story + ticket.
> `verified_by:` forms: `<test-file>::<test-name>` (executable) or
> `not_applicable — <justification>` (doc/manifest verified by grep/scan).
> No `goal_verification` block in the Plan Contract, so the design-phase
> verified_by refusal does not fire; the linkage is carried as the build
> contract (the test files named below are what TICKET-N must produce).

## S-1 — getMode sprint-case fix + caller audit + isSprint

- AC-1.1: Given `.claude/runtime/mode.json` = `{mode:"sprint"}`, when `lib/mode.js#getMode()` is called, then it returns `"sprint"` (not the current `"solo"` fallthrough).
  verified_by: tests/regression/S-LC-01/mode-getmode.test.js::getMode-sprint-case
- AC-1.2: Given `lib/mode.js`, when `isSprint()` is called, then it returns `true` under sprint mode and `false` under every other mode; `isAdhoc/isOneshot/isSolo` are unchanged.
  verified_by: tests/regression/S-LC-01/mode-getmode.test.js::isSprint-export
- AC-1.3: Given `mode.json`="sprint" after the fix, when `higgsfield-spend-gate.js` evaluates, then its gating behavior matches intent (the audit confirms it gates on `oneshot`/is mode-insensitive — `"sprint"` does not regress it).
  verified_by: tests/regression/S-LC-01/mode-getmode.test.js::higgsfield-sprint-safe

## S-2 — mode-lifecycle.json registry + mode.json paths key

- AC-2.1: Given `.claude/agents/_org/mode-lifecycle.json`, when parsed, then it defines every live mode (`solo`,`adhoc`,`oneshot`,`sprint`) each with `roster`, `requires_team`, `bindings`, `provider_tier`, `dispatch_profile_ref`, `teardown` fields.
  verified_by: tests/regression/S-LC-01/mode-lifecycle-registry.test.js::registry-schema-complete
- AC-2.2: Given the new `modeMarker` key added to `framework/paths.registry.json` (SOURCE), when `scripts/paths/build.js` runs, then `.claude/paths.json` resolves `modeMarker` → `.claude/runtime/mode.json` (the key survived regeneration — source-vs-generated discipline).
  verified_by: tests/regression/S-LC-01/mode-lifecycle-registry.test.js::paths-key-survived-regen

## S-3 — de-dup the hardcoded required-team-by-mode sites to read the registry

- AC-3.1: Given the registry, when `session-start.js` and `team-guard.js` resolve required-team/roster-by-mode, then they READ the registry (no hardcoded `TEAM_MODES` map or inline ε-roster literal remains as the authoritative source).
  verified_by: tests/regression/S-LC-01/mode-lifecycle-registry.test.js::readers-resolve-from-registry
- AC-3.2: Given the de-dup, when `team-guard-gate.test.js` AND `team-guard-sprint.test.js` run, then they pass IDENTICALLY to the golden snapshot (gate 13/13, sprint-advisory 8/8) — no behavior regression.
  verified_by: scripts/hooks/team-guard-gate.test.js::all + scripts/hooks/team-guard-sprint.test.js::all

## S-4 — mode-lifecycle-registry drift validator (fail-closed)

- AC-4.1: Given a reader drifted from the registry OR a planted wrong-roster fixture, when `scripts/checks/mode-lifecycle-registry.js` runs, then it exits non-zero (fails closed; earn-it).
  verified_by: tests/regression/S-LC-01/mode-lifecycle-registry.test.js::planted-wrong-roster-fails
- AC-4.2: Given a consistent registry + readers, when the validator runs (standalone and via `/scan:full`), then it exits 0.
  verified_by: tests/regression/S-LC-01/mode-lifecycle-registry.test.js::clean-tree-passes

## S-5 — DEFAULT-ON drift reconciliation + manifest regen + fast-close

- AC-5.1: Given `TRACKER.md` and `trackers/epics/E-SYSTEM-ORG-001-*.md`, when read after the reconcile, then BOTH state the gate is DEFAULT-ON with a logged Change Log entry citing the code line + test + `.team-gate-hard` marker; no `DEFAULT-OFF` claim remains (P-057 two-surface).
  verified_by: not_applicable — documentation reconciliation; verified by grep (absence of the DEFAULT-OFF claim) + the Change Log entry present on both surfaces.
- AC-5.2: Given the new registry + scripts, when both manifests are regenerated, then `/scan:full` manifest-coverage/honesty checks (BC-02/BC-05) are green.
  verified_by: not_applicable — manifest regen; verified by `/scan:full` blocking gates green at close.
