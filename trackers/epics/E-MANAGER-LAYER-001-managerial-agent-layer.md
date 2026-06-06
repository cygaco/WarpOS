<!-- EPIC TRACKER — spec §22. Linked from ../../TRACKER.md. Template: ../templates/EPIC_TEMPLATE.md
     States (§19): Planned | Ready | Active | Blocked | Paused | Review Needed | Completed | Cancelled | Superseded -->

# E-MANAGER-LAYER-001 — Managerial Agent Layer

- **Epic label and number:** E-MANAGER-LAYER-001
- **Title:** Managerial Agent Layer
- **Owner:** President Agent
- **Parent roadmap area:** Epics → Planned epics — see [../../ROADMAP.md](../../ROADMAP.md) (detail in the deprecated `🟡 0.14.0 — Managerial Agent Layer` milestone block)
- **Goal:** Give the agent system a strategic managerial layer — Director personas, skill-scoped agent injection, and roadmap skills that consult a product lens — instead of a build-chain only (builder / reviewer / fixer / qa / redteam / compliance). Strategic judgment (sequencing, outcomes vs outputs, JTBD alignment, opportunity cost, cadence) becomes a documented, invokable, audited capability rather than Alex's implicit instinct.
- **Background:** Roadmap work was "Alex's best guess" rather than "Director-consulted." The agent system was build-chain only, with no higher-order persona to bring a product lens to sequencing and prioritization. **IMPORTANT — this epic is LARGELY SUPERSEDED by E-ADR0007 (Completed):** the ADR-0007 rewrite built the `president/product/engineering/growth` department tree with Director/Lead personas + the `role-registry.json` keystone, and the `/roadmap:*` skills already resolve a role-aware Product-Lead / Director-of-Product persona from the registry. The original milestone's `.claude/agents/03-managers/` directory shape was retired by that rewrite. What remains is the declarative injection mechanism + its audit trail.
- **Scope:** RESIDUAL only, after E-ADR0007 delivered the personas. (1) The declarative `temporary-agent: <persona-slug>` frontmatter injection mechanism — a skill spawns a scoped persona for the duration of the run, consultable via SendMessage, released on exit. (2) The `manager-consult` event audit trail in events.jsonl recording persona + lenses + decision rationale. The Director persona specs themselves already exist in the department tree.
- **Out of scope:** Re-building the Director personas (done by E-ADR0007 — the department tree + Director/Lead personas + `role-registry.json` keystone). The predictive roadmap skills `/roadmap:ideas` + `/roadmap:next` (they exist). Wiring the existing `/roadmap:*` skills through a Director persona (already done — the skills resolve a role-aware persona from the registry).
- **Current state:** Planned
- **Percent completion:** ~70% — delivered out-of-band by E-ADR0007 (the `president/product/engineering/growth` department tree, the Director/Lead personas, the `role-registry.json` keystone, and the registry-resolved role-aware `/roadmap:*` skills). The residual ~30% is the declarative `temporary-agent:` skill-scoped injection mechanism + the `manager-consult` audit trail in events.jsonl. Conservative per §20 — none of the residual mechanism is built yet.

## Definition of Done
<!-- Concrete, checkable criteria. Nothing reaches 100% until all are satisfied + evidenced (§20, §27). -->
- [ ] The declarative skill-scoped `temporary-agent: <persona-slug>` injection mechanism works for at least one skill — the persona is spawned for the run, consultable via SendMessage, and released on exit
- [ ] Consultation is observable in events.jsonl as `manager-consult` events carrying persona + lenses + decision rationale
- [ ] The pattern is documented so a future manager persona is a one-file + frontmatter addition
- [ ] Reconcile what E-ADR0007 already delivered against this epic so no duplicate manager layer is built

## Related definitions
- Agent — see ../../TRACKER.md
- President agent — see ../../TRACKER.md

## Related sprints
- SP-20260525-014 — Skill-scoped temporary agent injection mechanism — Planning — note: substrate largely delivered via E-ADR0007
- SP-20260525-015 — Director of Product Management agent spec — Planning — note: superseded by E-ADR0007's department-tree Director personas
- SP-20260525-016 — `/roadmap:create` skill (DoPM-grounded) — Planning — note: roadmap skills now resolve a role-aware persona via E-ADR0007's registry
- SP-20260525-017 — Wire existing `/roadmap:*` through DoPM — Planning — note: largely delivered via E-ADR0007 (registry-resolved roadmap skills)
- SP-20260528-003 — `/roadmap:ideas` (Director of Product agent) — Planning — note: skill exists; out of scope here
- SP-20260528-004 — `/roadmap:next` (Director of Product agent) — Planning — note: skill exists; out of scope here

## Dependencies
- E-ADR0007 (Agent-System Rewrite) — Completed — delivered the substrate (department tree + Director/Lead personas + `role-registry.json` keystone + registry-resolved roadmap skills); not blocking.

## Blockers
- None currently recorded.

## Risks
- Building a duplicate manager layer that E-ADR0007 already delivered — likelihood: medium / impact: medium / mitigation: reconcile what ADR-0007 shipped against this epic's residual scope before activating any sprint.

## Decisions
- None currently recorded.

## Open questions
- None currently recorded.

## Session log
<!-- Append-only (§24). One entry per meaningful session; use SESSION_LOG_TEMPLATE.md fields. -->
### 2026-06-06 — Session 2026-06-06-epic-migration (june-5)
- Agent(s): President Agent (via systems builder) · Mode: sprint
- Work performed: Created this epic tracker file during the T5 roadmap→epic migration (sprint T5 of E-TRACKER-001), capturing the Managerial Agent Layer as a Planned (residual) epic largely superseded by E-ADR0007.
- Files changed: trackers/epics/E-MANAGER-LAYER-001-managerial-agent-layer.md · Paths changed: none · Wirings changed: none
- Decisions: None · Issues discovered: None
- Definitions added/changed: None
- State change: (new) → Planned · Completion change: 0% → ~70% (reflecting E-ADR0007 out-of-band delivery; the file is newly authored)
- Verification performed: confirmed the file did not previously exist; matched EPIC_TEMPLATE.md structure · Validation run: `node scripts/trackers/validate.js` · Validation result: PASS
- Next action: None — Planned; first reconcile what ADR-0007 already delivered vs the residual injection mechanism before activating.
- Evidence/references: ../../ROADMAP.md (Epics → Planned epics; `🟡 0.14.0` deprecated block); E-ADR0007 in ../../TRACKER.md §Completed Epics.

## Change log
<!-- §25 -->
### 2026-06-06 — Session 2026-06-06-epic-migration
- Changed: Created E-MANAGER-LAYER-001 epic tracker file (Planned, ~70%).
- Reason: T5 roadmap→epic migration — capture the Managerial Agent Layer as a Planned residual epic, distinct from what E-ADR0007 already delivered.
- Affected: new trackers/epics/E-MANAGER-LAYER-001-managerial-agent-layer.md; linked from ../../ROADMAP.md.
- Previous state: No epic tracker file existed for the Managerial Agent Layer.
- New state: Planned epic file authored at ~70% (E-ADR0007 delivered the substrate; residual injection mechanism + audit trail remain).

## Evidence log
<!-- §26 — concrete enough that another agent can resume/verify without memory -->
### 2026-06-06 — Epic tracker file authored
- Evidence type: File changed
- Detail/location: trackers/epics/E-MANAGER-LAYER-001-managerial-agent-layer.md
- Verified by: President Agent · Supports: DoD item (4) — reconcile what E-ADR0007 already delivered against this epic

## Verification log
<!-- §10 states: Verified Exists | Verified Nonexistent | Verified Wired | Verified Not Wired | Exists But Stale | Exists But Incomplete | Exists But Miswired | Missing But Required | Present But Should Be Removed | Unknown -->
| Item | Should exist? | State | Where / wired where | Proof (cmd/inspection) | Checked | By |
| --- | --- | --- | --- | --- | --- | --- |
| Department tree + Director/Lead personas | Yes | Verified Exists | `.claude/agents/{president,product,engineering,growth}/` (E-ADR0007) | E-ADR0007 Completed in ../../TRACKER.md §Completed Epics | 2026-06-06 | President Agent |
| Registry-resolved role-aware `/roadmap:*` skills | Yes | Verified Exists | `.claude/commands/roadmap/*` → `role-registry.json` | E-ADR0007 deliverable; skills resolve Product-Lead / Director-of-Product | 2026-06-06 | President Agent |
| `temporary-agent:` skill-scoped injection mechanism | Yes | Missing But Required | (residual — not yet built) | Nonexistence inferred; DoD item (1) open | 2026-06-06 | President Agent |
| `manager-consult` event audit trail | Yes | Missing But Required | events.jsonl (residual — not yet built) | Nonexistence inferred; DoD item (2) open | 2026-06-06 | President Agent |

## Current next action
None — Planned; first reconcile what ADR-0007 already delivered vs the residual injection mechanism before activating, to avoid building a duplicate manager layer.

## Completion record
<!-- Fill only on completion (§15/§37). See COMPLETION_RECORD_TEMPLATE.md. -->
- Final state: Not yet complete
- Percent completion: n/a
- Completion timestamp: n/a
- Definition of done used: see Definition of Done section above (spec §37)
- Evidence of completion: n/a — Planned (residual); ~70% delivered out-of-band by E-ADR0007, residual injection mechanism + audit trail remain
- Session IDs / dates / agents: 2026-06-06-epic-migration / 2026-06-06 / President Agent (via systems builder)
- Related completed sprints: None
- Remaining follow-up items: residual `temporary-agent:` injection mechanism + `manager-consult` audit trail; reconcile vs E-ADR0007 before activating
- Related untracked work: None
- ../../TRACKER.md updated: No · Roadmap reconciled: Yes (linked from ../../ROADMAP.md Epics → Planned epics)
