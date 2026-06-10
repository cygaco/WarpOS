<!-- requirement-format-legacy -->
# Granular Stories — Mode-Lifecycle Registry keystone

**Sprint:** `S-LC-01`
**High-level stories:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\S-LC-01\high-level-stories.md`

> Granular stories use the `S-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`. Each granular story
> should produce roughly one ticket during `/sprint:design`.

## S-1 — TICKET-1 (FIRST, Beta): audit lib/mode#getMode callers (confirm higgsfield-spend-gate is the only external consumer; edit-watcher excluded as false cognate); add the sprint case + isSprint(); verify higgsfield behaves correctly under 'sprint'; re-run affected tests.

**As** the user
**I want** TICKET-1 (FIRST, Beta): audit lib/mode#getMode callers (confirm higgsfield-spend-gate is the only external consumer; edit-watcher excluded as false cognate); add the sprint case + isSprint(); verify higgsfield behaves correctly under 'sprint'; re-run affected tests.
**So that** Mode/team correctness stops depending on the model remembering prose: one registry is the SoT, a validator fails closed on drift, and sprint mode is correctly detected (not silently 'solo'). This is the foundation every Wave-1 gate in E-LIFECYCLE-001 reads - without it the gates would re-encode the same drift this epic is curing.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-1`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-2 — TICKET-2: create .claude/agents/_org/mode-lifecycle.json (per-mode roster/requires_team/bindings/tier/dispatch-profile/teardown) + register .claude/runtime/mode.json as a paths.* key in framework/paths.registry.json SOURCE, run build.js, VERIFY the key survived.

**As** the user
**I want** TICKET-2: create .claude/agents/_org/mode-lifecycle.json (per-mode roster/requires_team/bindings/tier/dispatch-profile/teardown) + register .claude/runtime/mode.json as a paths.* key in framework/paths.registry.json SOURCE, run build.js, VERIFY the key survived.
**So that** Mode/team correctness stops depending on the model remembering prose: one registry is the SoT, a validator fails closed on drift, and sprint mode is correctly detected (not silently 'solo'). This is the foundation every Wave-1 gate in E-LIFECYCLE-001 reads - without it the gates would re-encode the same drift this epic is curing.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-2`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-3 — TICKET-3: golden-snapshot BOTH team-guard suites; de-dup the hardcoded required-team-by-mode sites (session-start TEAM_MODES, team-guard inline check, mode-skill prose) to READ the registry; re-run both suites = identical pass.

**As** the user
**I want** TICKET-3: golden-snapshot BOTH team-guard suites; de-dup the hardcoded required-team-by-mode sites (session-start TEAM_MODES, team-guard inline check, mode-skill prose) to READ the registry; re-run both suites = identical pass.
**So that** Mode/team correctness stops depending on the model remembering prose: one registry is the SoT, a validator fails closed on drift, and sprint mode is correctly detected (not silently 'solo'). This is the foundation every Wave-1 gate in E-LIFECYCLE-001 reads - without it the gates would re-encode the same drift this epic is curing.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-3`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-4 — TICKET-4: build scripts/checks/mode-lifecycle-registry.js validator (every reader resolves from registry; planted wrong-roster fails) + wire report-only into /scan:full.

**As** the user
**I want** TICKET-4: build scripts/checks/mode-lifecycle-registry.js validator (every reader resolves from registry; planted wrong-roster fails) + wire report-only into /scan:full.
**So that** Mode/team correctness stops depending on the model remembering prose: one registry is the SoT, a validator fails closed on drift, and sprint mode is correctly detected (not silently 'solo'). This is the foundation every Wave-1 gate in E-LIFECYCLE-001 reads - without it the gates would re-encode the same drift this epic is curing.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-4`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-5 — TICKET-5 (close-out): reconcile DEFAULT-ON drift (logged Change Log entry on TRACKER + E-SYSTEM-ORG-001, code-authoritative); regen BOTH manifests; ff-merge to main; defer retro to epic close.

**As** the user
**I want** TICKET-5 (close-out): reconcile DEFAULT-ON drift (logged Change Log entry on TRACKER + E-SYSTEM-ORG-001, code-authoritative); regen BOTH manifests; ff-merge to main; defer retro to epic close.
**So that** Mode/team correctness stops depending on the model remembering prose: one registry is the SoT, a validator fails closed on drift, and sprint mode is correctly detected (not silently 'solo'). This is the foundation every Wave-1 gate in E-LIFECYCLE-001 reads - without it the gates would re-encode the same drift this epic is curing.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-5`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

