<!-- EPIC TRACKER — spec §22. Linked from ../../TRACKER.md. Template: ../templates/EPIC_TEMPLATE.md
     States (§19): Planned | Ready | Active | Blocked | Paused | Review Needed | Completed | Cancelled | Superseded -->

# E-MC-READINESS-ANALYSIS-001 — Masterconsole Release-Readiness: ANALYSIS (findings-only)

- **Epic label and number:** E-MC-READINESS-ANALYSIS-001
- **Title:** Masterconsole Release-Readiness: ANALYSIS (findings-only, no changes)
- **Owner:** President Agent
- **Parent roadmap area:** [../../ROADMAP.md](../../ROADMAP.md) § Epics → Active epics (⭐⭐ TOP)
- **Goal:** Produce ONE consolidated, evidence-grounded findings set across every release-readiness dimension BEFORE any hardening change, so the execution epic burns down a frozen target. Analysis-only — read/simulate/audit/predict/report; modify nothing.
- **Background:** Operator-directed 2026-06-07 to prep the external masterconsole launch. Strategy (operator): all analysis first (one pass per dimension) → consolidate into this epic; a SECOND epic (E-MC-READINESS-EXECUTION-001) executes the findings — so we never change things as we go.
- **Scope (6 analysis sprints, each → a findings doc):**
  1. Hardening simulation — intense simulation in an extremely isolated env; every command + every flow exercised; catalog breaks/fragilities. (Extends the sealed-capsule lifecycle to the full shipped-command surface.)
  2. Security hardening — TRIPLE-pass torture test, cross-checked: (a) planned (threat-model + redteam:full), (b) Director-of-Engineering's security team (DoE dispatches security-reviewer(s)), (c) α's own pass. Reconcile; divergence = signal.
  3. Advanced edge-case prediction — insanity-level enumeration of pathological/adversarial/rare inputs, states, races per flow.
  4. Release-pipeline analysis — root of why gaps slip through (WI-50 / tracker-gap / hand-maintained ASSET_DIRS); the final-fix design.
  5. Project/file-organization analysis — agents-folder de-dot (.system/_system/.system.md), the 13-file 03-managers cutover-staleness (ED-026), the two-manifest (ownership vs ship) reconciliation; target structure + migration plan.
  6. Expectations-vs-reality / prose-vs-enforcement audit — every policy/contract/claim vs what's actually enforced (aspirational-vs-enforced; CLAUDE.md Policy-&-Enforcement-Hygiene + enforcement-debt register); each gap → named enforcer or logged debt.
- **Out of scope:** ANY fix/change (that is E-MC-READINESS-EXECUTION-001).
- **Current state:** Active
- **Percent completion:** 0% — epic authored 2026-06-07; sprints not yet minted.

## Definition of Done
- [ ] All 6 analysis sprints complete, each with an evidence-grounded findings doc (no fixes applied).
- [ ] Findings consolidated into a single prioritized register the execution epic can burn down.
- [ ] Bundling resolved (via /roadmap:prioritize): which existing epics (E-DISPATCH-INTEGRITY-001, E-GOLDEN-FLOW-001, E-CONTENT-DELIVERY-001, E-TEST-SUITE-001) feed which findings track.
- [ ] No system changes made under this epic (analysis-only invariant held).

## Related definitions
- Verification, Evidence, Wiring, Validator — see ../../TRACKER.md

## Related sprints
- Hardening-simulation-analysis — Planned
- Security-triple-pass-analysis — Planned
- Edge-case-prediction-analysis — Planned
- Release-pipeline-analysis — Planned
- File-organization-analysis — Planned (absorbs the 03-managers/ED-026 + agents-folder de-dot survey)
- Prose-vs-reality/enforcement-audit — Planned

## Dependencies
- None. Consumes existing diagnoses as inputs: E-DISPATCH-INTEGRITY-001 (dispatch RCA, done), E-CONTENT-DELIVERY-001 (ship-coverage), E-GOLDEN-FLOW-001 (consumer-contract), E-TEST-SUITE-001 (regression seed).

## Blockers
- None currently recorded.

## Risks
- Analysis sprawl / never-converging — likelihood medium · mitigation: each sprint is time-boxed to a findings doc, not exhaustive perfection; the prose-vs-reality + hardening passes are the highest-signal, run first.
- Cross-provider/team passes diverge (security triple-pass) — that is the DESIGN (divergence = signal); reconcile on grounding, not vote.
- Analysis-only invariant violated (someone fixes as they go) — mitigation: the epic's DoD asserts no changes; fixes route to the execution epic.

## Decisions
- 2026-06-07: two-epic split (analysis → execution) per operator — freeze the target before changing it (decide-then-do).

## Open questions
- Bundling boundaries — deferred to /roadmap:prioritize (director-of-product) to confirm which existing epics fold in as analysis inputs vs stay standalone.

## Session log
### 2026-06-07 — Session session/2026-06-07 (epic authored)
- Agent(s): President Agent (α) · Mode: solo/α-foreground
- Work performed: Authored this analysis epic + the execution epic at ROADMAP § Active epics ⭐⭐ TOP, per operator's masterconsole-release-readiness directive + analysis-then-execution strategy. Captured the 6 analysis dimensions (incl. the operator's prose-vs-reality addition + security triple-pass).
- Files changed: ../../ROADMAP.md (2 epic entries + priority-ordering); this tracker + the execution tracker.
- State change: (new) → Active · Completion 0%.
- Next action: mint the 6 analysis sprints (start hardening-simulation + prose-vs-reality); run /roadmap:prioritize to bundle.
- Evidence/references: operator directive 2026-06-07; cross-session inbox "dispatch layer is the blocking hard-enforcement gate on 0.15.2 ship readiness."

## Change log
### 2026-06-07 — Epic created (President α)
- Changed: Created E-MC-READINESS-ANALYSIS-001 (Active, 0%, ⭐⭐ TOP).
- Reason: operator-directed masterconsole-release-readiness prep with an analysis-first (frozen-target) strategy.
- Affected: ../../ROADMAP.md; this tracker; the execution epic tracker.
- Previous → New: no release-readiness epic existed → a two-epic (analysis→execution) structure at the top.

## Evidence log
### 2026-06-07 — epic authored
- Evidence type: Existence confirmation.
- Detail/location: ROADMAP § Epics → E-MC-READINESS-ANALYSIS-001; this file.
- Verified by: President Agent. Supports: the 0% Active state.

## Verification log
| Item | Should exist? | State | Where | Proof | Checked | By |
| --- | --- | --- | --- | --- | --- | --- |
| This epic in ROADMAP | Yes | Verified Exists | ROADMAP § Active epics | authored 2026-06-07 | 2026-06-07 | President Agent |
| 6 analysis sprints | Yes (planned) | Missing But Required | trackers/sprints/ (to mint) | next action | 2026-06-07 | President Agent |

## Current next action
Mint the 6 analysis sprints (start with hardening-simulation + the prose-vs-reality/enforcement audit — highest signal). Run /roadmap:prioritize (director-of-product) to confirm bundling of E-DISPATCH-INTEGRITY-001 / E-GOLDEN-FLOW-001 / E-CONTENT-DELIVERY-001 / E-TEST-SUITE-001 as analysis inputs. Hold the analysis-only invariant — no fixes (those are E-MC-READINESS-EXECUTION-001).

## Completion record
- Final state: Not yet complete (Active, 0%)
- Percent completion: n/a
- Definition of done used: see Definition of Done above
- Evidence of completion: n/a — just authored
- Session IDs / dates / agents: session/2026-06-07 / 2026-06-07 / President Agent
- Related completed sprints: None
- Remaining follow-up items: the 6 analysis sprints
- Related untracked work: None
- ../../TRACKER.md updated: pending · Roadmap reconciled: Yes (⭐⭐ TOP entry + priority-ordering)
