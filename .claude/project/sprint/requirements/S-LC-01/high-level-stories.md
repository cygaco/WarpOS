<!-- requirement-format-legacy -->
# High-Level Stories — Mode-Lifecycle Registry keystone

**Sprint:** `S-LC-01`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\S-LC-01\prd.md`

> High-level stories use the `H-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`.

## H-1 — As the orchestrator, every mode reader resolves required-team/bindings from ONE registry, so the 3-site drift can't recur.

**As** the user
**I want** As the orchestrator, every mode reader resolves required-team/bindings from ONE registry, so the 3-site drift can't recur.
**So that** Mode/team correctness stops depending on the model remembering prose: one registry is the SoT, a validator fails closed on drift, and sprint mode is correctly detected (not silently 'solo'). This is the foundation every Wave-1 gate in E-LIFECYCLE-001 reads - without it the gates would re-encode the same drift this epic is curing.

Linked granular stories: see `granular-stories.md`.
Linked requirements: `R-1`.

## H-2 — As the system, sprint mode is correctly detected (getMode returns 'sprint'), so sprint gates/routing stop silently behaving as 'solo'.

**As** the user
**I want** As the system, sprint mode is correctly detected (getMode returns 'sprint'), so sprint gates/routing stop silently behaving as 'solo'.
**So that** Mode/team correctness stops depending on the model remembering prose: one registry is the SoT, a validator fails closed on drift, and sprint mode is correctly detected (not silently 'solo'). This is the foundation every Wave-1 gate in E-LIFECYCLE-001 reads - without it the gates would re-encode the same drift this epic is curing.

Linked granular stories: see `granular-stories.md`.
Linked requirements: `R-2`.
