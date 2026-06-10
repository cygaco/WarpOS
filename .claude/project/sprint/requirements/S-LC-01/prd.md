<!-- requirement-format-legacy -->
# PRD — Mode-Lifecycle Registry keystone

**Sprint:** `S-LC-01`
**Plan Contract:** `PC-20260609-0065`
**Status:** draft
**Documentation scale:** `m`

## Outcome

Mode/team correctness stops depending on the model remembering prose: one registry is the SoT, a validator fails closed on drift, and sprint mode is correctly detected (not silently 'solo'). This is the foundation every Wave-1 gate in E-LIFECYCLE-001 reads - without it the gates would re-encode the same drift this epic is curing.

## Context

### Original Request

> S-LC-01 - Mode-Lifecycle Registry keystone (Wave 0 of E-LIFECYCLE-001). Create .claude/agents/_org/mode-lifecycle.json (per-mode: roster, requires_team, bindings [sprint/epic/tracker/planning], provider tier, dispatch-profile ref, teardown policy). De-duplicate the 3 hardcoded required-team-by-mode sites (session-start.js TEAM_MODES, team-guard.js inline epsilon-check, mode-skill prose) to READ the registry. Fix scripts/hooks/lib/mode.js getMode() to handle the sprint case + add isSprint() (audit all getMode callers first). Register .claude/runtime/mode.json as a paths.* key (edit framework/paths.registry.json SOURCE then run scripts/paths/build.js). Add a mode-lifecycle-registry validator (every reader resolves from the registry; planted wrong-roster fails). Reconcile the DEFAULT-ON drift in TRACKER.md + E-SYSTEM-ORG-001 (shipped code is DEFAULT-ON; reconcile as a logged Change Log entry, not a silent edit). Architecture directive (GPT-5.5 correction, operator-confirmed 2026-06-09): mode-set.js is the single lifecycle-transaction writer that reads this registry; the PreToolUse guard is backstop-only (built in S-LC-03, not here). Gates: new validator green + team-guard-gate.test.js stays green (golden-snapshot first) + regen BOTH manifests last. Engine/tooling sprint - fast-close via ff-merge to main, defer retro to epic close (RI-001).

### Interpreted Intent

Convert mode->team/bindings correctness from 'remembered by hardcoded sites + prose' into ONE declarative registry that every reader resolves from, so the recurring mode/team drift becomes mechanically self-detecting. Fix the confirmed getMode() sprint->solo fallthrough and add isSprint(). Register mode.json as a paths.* key (source-vs-generated discipline). Establish mode-set.js as the single transaction writer that READS the registry; the gates that consume it (mode:switch preflight, mode:init:gate) are S-LC-03/04 and explicitly out of scope here.

### Current Behavior

Required-team-by-mode is HARDCODED + duplicated across session-start.js TEAM_MODES (~L535), team-guard.js inline check (~L166), and mode-skill prose - and already drifting (shipped code DEFAULT-ON vs E-SYSTEM-ORG-001 prose DEFAULT-OFF). getMode() in lib/mode.js has no sprint case -> sprint resolves to 'solo' (re-confirmed live this session). mode.json is referenced as a literal string, not a paths.* key. No mode-lifecycle registry, no drift validator. team-guard-gate.test.js golden baseline = 13/13 pass, exit 0 (captured 2026-06-09).

### Desired Behavior

One .claude/agents/_org/mode-lifecycle.json that all readers resolve from; getMode() returns 'sprint' for sprint mode + isSprint() exists; higgsfield-spend-gate verified correct under 'sprint'; mode.json is a paths.* key; a validator exits non-zero when any reader drifts from the registry or a planted wrong-roster is present; the DEFAULT-ON drift reconciled with a logged Change Log entry on BOTH tracker surfaces; mode-set.js reads the registry. No gate is built here (S-LC-03/04). team-guard-gate.test.js stays 13/13; both manifests regenerated.

## Requirements

> Use existing requirement ID conventions enforced by
> `scripts/hooks/requirement-format-guard.js`. PRDs in `_requirements/`
> use `R-N` ids — sprint-scope PRDs that link to a feature in
> `_requirements/04-features/<feature>/PRD.md` should reuse those ids,
> not invent new ones.

- `R-1` — mode-lifecycle.json registry schema + per-mode content
- `R-2` — de-dup the hardcoded required-team-by-mode sites to read the registry
- `R-3` — getMode sprint-case fix + isSprint + caller audit (higgsfield) 

## Non-Goals

- Building the mode-switch PreToolUse guard or the mode:init:gate (S-LC-03/04).

## Affected Surfaces

| Surface | Evidence Level |
|---|---|
| .claude/agents/_org/mode-lifecycle.json (NEW keystone registry) | verified_from_repo |

## External Service Dependencies

See `.claude/project/sprint/external-services/` for ESD records.

## Approval Boundaries

See Plan Contract `approval_boundaries`.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260609-0065.yaml`
- High-level stories: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\S-LC-01\high-level-stories.md`
- Granular stories: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\S-LC-01\granular-stories.md`
- COPY: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\S-LC-01\copy.md`
- INPUTS: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\S-LC-01\inputs.md`
- TRACE: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\S-LC-01\trace.md`
- Acceptance criteria: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\S-LC-01\acceptance-criteria.md`
- QA plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\S-LC-01\qa-plan.md`
- Redteam plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\S-LC-01\redteam-plan.md`
- Release plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\S-LC-01\release-plan.md`
