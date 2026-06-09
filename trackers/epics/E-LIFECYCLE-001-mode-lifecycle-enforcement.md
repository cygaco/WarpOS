<!-- EPIC TRACKER — spec §22. Linked from ../../ROADMAP.md § Planned epics and ../../TRACKER.md header.
     States (§19): Planned | Ready | Active | Blocked | Paused | Review Needed | Completed | Cancelled | Superseded -->

# E-LIFECYCLE-001 — WarpOS Mode-Lifecycle Enforcement, Sprint Discipline, Dispatch-Shape Parallelism & Provider Readiness

- **Epic label and number:** E-LIFECYCLE-001
- **Title:** WarpOS Mode-Lifecycle Enforcement, Sprint Discipline, Dispatch-Shape Parallelism & Provider Readiness
- **Owner:** President Agent
- **Parent roadmap area:** [ROADMAP.md § Planned epics](../../ROADMAP.md) — the "dispatch-shape operating layer" theme (successor to E-SYSTEM-ORG-001).
- **Goal:** Make WarpOS mode/team/dispatch correctness MECHANICAL, not memory-dependent — a single Mode-Lifecycle Registry as the source of truth, a fail-closed `mode:init:gate` that blocks work until initialization passes, mechanical project-scoped team teardown, governed parallelism, disciplined turbo, tier-graded provider readiness, and a durable tracker-linked planning system.
- **Background:** WarpOS keeps re-living one failure class — sprint/adhoc modes "forget" to stand up the persistent team, `/mode:` switches leak the old team, dispatch shape is chosen by recall not by a gate (root-caused as RT-2026-06-08-dispatch-class-rca; operator corrections "where's the team?"/"where's epsilon?" on 2026-06-06 + 2026-06-08). The cure is mechanical enforcement, not more prose. The full plan + the grounded Phase-0 investigation (6 read-only surfaces) live at [../../_planning/warpos-lifecycle-plan.md](../../_planning/warpos-lifecycle-plan.md); the source prompt is [../../_planning/ingest/warpos-lifecycle.md](../../_planning/ingest/warpos-lifecycle.md).
- **Scope:** (1) Mode-Lifecycle Registry (`.claude/agents/_org/mode-lifecycle.json`) — per-mode roster/bindings/tier/dispatch-profile/teardown, de-duplicating the 3 hardcoded sites; (2) Lifecycle-event registry + logger + coverage enforcer (2 real PreToolUse guards + ~23 virtual events to `paths.eventsFile`); (3) generalized fail-closed `mode:init:gate` + mode-switch preflight guard; (4) project-scoped persistent-team lifecycle manager (spawn/verify/kill/teardown/orphan/resume) + a SessionEnd hook backstop; (5) dispatch parallelism axis (under/over-dispatch detection) + coverage-gate live wiring; (6) turbo hardening (spend ceiling + safe commit/push/merge profile); (7) provider-tier (T1/T2/T3) readiness + preferred-tier config layered on the existing health stack; (8) `_planning` lifecycle integration + an `epic:` suite (design 10, build `/epic:plan`+`/epic:fold`) + canonicalized planning principles + an acceptance-criteria enforcement system.
- **Out of scope:** inventing new harness hook events (the set is closed at 8); rebuilding the dispatch matrix / provider health stack / tracker validator (all are EXTENDED, not replaced); the org/GTM "product-studio" expansion (the separate `_planning/plans/*` epic — the cast, not the stage); building all 10 `epic:` commands now; any live provider auth/funding/trust mutation during planning; replacing `/session:end`'s rich teardown (a mechanical backstop is added, not a replacement).
- **Current state:** Planned
- **Percent completion:** 0% — plan authored + Phase-0 grounded 2026-06-08; no execution work started.

## Definition of Done
- [ ] Mode-Lifecycle Registry is the SOLE source of truth (all readers resolve from it; the `mode-lifecycle-registry` validator is green; the DEFAULT-ON drift reconciled) — proven by a planted wrong-roster fixture failing.
- [ ] `mode:init:gate` blocks dispatch/tool-use until the 14-item init checklist passes, for every mode, fail-closed, idempotent — proven by the planted fixtures (no-team, wrong-team, duplicate-call, dispatch-before-init).
- [ ] Mode switch + `/session:end` mechanically AND project-scopedly tear down teams — proven by a planted wrong-PROJECT team surviving a kill + an orphan being detected.
- [ ] The lifecycle-event registry fires in order with no secret leakage — proven by the coverage enforcer + planted out-of-order/missing-event/secret-in-payload fixtures.
- [ ] The dispatch parallelism axis flags under/over-dispatch AND `coverage-gate.js` has a live caller — proven by planted serial-when-safe + shared-file-collision fixtures.
- [ ] Turbo enforces its spend ceiling + safety profile (operator-approved default) — proven by planted over-spend + unsafe-push fixtures blocked.
- [ ] Provider-tier readiness checks the selected tier with a preferred-tier config — proven by a planted under-tier blocking the selected tier (value-free).
- [ ] `_planning` is a tracker-linked lifecycle store; `/epic:plan` emits a validate.js-passing epic file; `/epic:fold` folds with provenance + conflict detection.
- [ ] Every epic/sprint plan carries the 20 acceptance-criteria categories — proven by a planted omission caught by `/scan:ac-coverage`.
- [ ] Planning principles live in canonical homes with a named enforcer.
- [ ] `node scripts/trackers/validate.js` stays 20/20 + `/scan:full` blocking gates stay green; all § Human Approval Points resolved.

## Related definitions
- Mode — see ../../TRACKER.md (live enterable: solo/adhoc/oneshot/sprint).
- Dispatch, Wiring, Verification, Evidence, Completion — see ../../TRACKER.md.

## Related sprints
- None currently minted. 12 sprint candidates are defined in the plan (S-LC-01 … S-LC-12 across 6 waves); each is minted via `/sprint:plan` at execution time. See [../../_planning/warpos-lifecycle-plan.md](../../_planning/warpos-lifecycle-plan.md) § "Proposed Sprint Breakdown".

## Dependencies
- E-SYSTEM-ORG-001 (dispatch-shape north star, ~99%) — prerequisite; this epic builds on `dispatch-contract.json`, `dispatch-shape.js`, `safe-spawn.js`, `coverage-gate.js`. State: near-complete on `main`.
- E-DISPATCH-INTEGRITY-001 (coverage-honesty) — sibling; its run-ledger precondition work pairs with Wave 2's coverage-gate wiring. State: Active.
- Operator decisions on the § Human Approval Points (turbo push/spend default; provider funding/subscription detection method; mode-behavior backward-compat) before the affected waves flip to blocking.

## Blockers
- None currently recorded (Planned; execution is approval-gated per the plan's § Implementation-Phase Preflight Checklist).

## Risks
- Fail-closed bug bricks mode entry/dispatch — mitigate with the global fail-OPEN posture + kill-switch env/markers + bootstrap allow-list + canary report-only + the dry-run simulation plan.
- Mechanical teardown kills the wrong/another-project team — mitigate with a project-slug scope on every kill + verify-terminated + a planted wrong-project fixture + a `--keep-teams` default for one release.
- Registry generalization regresses the working sprint gate — mitigate by golden-snapshotting the current `team-guard` behavior + keeping `team-guard-gate.test.js` green + a per-mode report→block ramp.
- KNOWN DRIFT to reconcile in S-LC-01: E-SYSTEM-ORG-001 prose records S-12c as "ships DEFAULT-OFF," but the shipped code, `team-guard-gate.test.js`, the code comment, and the live `.team-gate-hard` marker all indicate DEFAULT-ON (read-only-verified 2026-06-08). The reconciliation is a logged Change Log entry, not a silent edit.

## Decisions
- 2026-06-08 — One epic (not split) — the spine (Mode-Lifecycle Registry → lifecycle-event registry → init-gate → team manager) is shared across all areas; splitting fragments the source of truth. Provider readiness (Wave 4) is the one cleanly-separable workstream and may fast-follow as E-PROVIDER-TIER-001 if it grows.
- 2026-06-08 — "25 hook events" reframed to 2 real PreToolUse guards + ~23 virtual registry-driven events logged to `paths.eventsFile` — the harness hook-event set is closed at 8 (read-only-verified).
- 2026-06-08 — Extend, don't reinvent: `dispatch-contract.json` IS the dispatch permission matrix; the provider-health stack already exists. The epic layers onto both.
- 2026-06-08 — Turbo default = highest autonomy (operator decision, β-escalated Class C): `/session:turbo` auto-grants spend + commit + push + merge-to-main + branch ops within the never-allowed hard ceilings, delivered via a durable operator-declared `permissions.allow` profile (NOT a self-grant the auto-mode classifier rejects, per `feedback_turbo_broad_scope_denied`). Deliberately overrides "Push = Ask first" for turbo sessions. (S-LC-07.)
- 2026-06-08 — β consult (5 calls, `EVT-lifecycle-epic-decomp-2026-06-08`, logged to `paths.betaEvents`): one epic [DECIDE 0.87] (provider readiness = candidate split evaluated at Wave-4 kickoff, not pre-committed); sequencing sound [DECIDE 0.90] (W1 slips with W0, never around it); epic suite design-10-build-2 [DECIDE 0.85] (other 8 explicitly gated as fast-follow); provider detection = self-attestation + opt-in probe, reject infer-from-dispatch [DECIDE 0.84]; turbo [ESCALATE] → operator decision above.

## Open questions
- Turbo auto-push/merge + spend default — RESOLVED 2026-06-08 (operator: "highest autonomy possible") — see § Decisions. Residual sub-call: the exact framework-default spend-ceiling value ($100 baseline recommended).
- Provider funding/subscription detection method (self-attestation vs gated billing-API probe vs infer-from-dispatch) — likely not read-only-detectable — owner: operator.
- T3 tier subscription floor (`Max 5x` vs a lower hobbyist Claude sub — source's own open Q) — owner: operator.
- Should provider readiness become its own epic (E-PROVIDER-TIER-001) now or stay Wave 4 — owner: President + operator.

## Session log
### 2026-06-08 — Session (adhoc)
- Agent(s): Alex α + β consult + 6 parallel Phase-0 investigators · Mode: adhoc
- Work performed: authored the full epic plan (`_planning/warpos-lifecycle-plan.md`, 26 sections) + cleaned planning principles (`_planning/principle.md`) from the source prompt `_planning/ingest/warpos-lifecycle.md`; ran a 6-surface read-only Phase-0 investigation (evidence under `runtime/agent-system-plan/lifecycle-phase0/`); created this epic tracker file; registered the epic in ROADMAP.md § Planned epics + the TRACKER.md header pointer.
- Files changed: `_planning/warpos-lifecycle-plan.md`, `_planning/principle.md`, this file, `ROADMAP.md`, `TRACKER.md` · Paths changed: created `trackers/epics/E-LIFECYCLE-001-mode-lifecycle-enforcement.md` · Wirings changed: ROADMAP epic registry + TRACKER header pointer.
- Decisions: see § Decisions (one epic; reframe 25→2+23; extend not reinvent). · Issues discovered: the DEFAULT-ON drift (see § Risks); `lib/mode.js#getMode()` has no sprint case; turbo default-scope drift; authorization-gate ordering drift.
- Definitions added/changed: None.
- State change: (new) → Planned · Completion change: — → 0%
- Verification performed: 6 read-only Phase-0 investigations (≥2-method absence checks) · Validation run: `node scripts/trackers/validate.js` (post-wiring) · Validation result: see Evidence log.
- Next action: see § Current next action.
- Evidence/references: `runtime/agent-system-plan/lifecycle-phase0/0{1..6}-*.md`; `_planning/warpos-lifecycle-plan.md`.

## Change log
### 2026-06-08 — Session (adhoc)
- Changed: created E-LIFECYCLE-001 (epic file + ROADMAP § Planned epics entry + TRACKER header pointer) from the authored plan.
- Reason: the operator directed turning `_planning/ingest/warpos-lifecycle.md` into an epic + sprint plan and representing it in the roadmap + tracker.
- Affected: ROADMAP.md (epic registry), TRACKER.md (header pointer), trackers/epics/ (new file), _planning/ (plan + principles).
- Previous state: not tracked (the work was named only in prose as the TRACKER header's "NEXT epic").
- New state: Planned, 0%, plan authored + Phase-0 grounded.

## Evidence log
### 2026-06-08 — Epic plan authored + Phase-0 grounded
- Evidence type: File changed.
- Detail/location: `_planning/warpos-lifecycle-plan.md` (26-section plan); `_planning/principle.md`; `runtime/agent-system-plan/lifecycle-phase0/0{1..6}-*.md` (6 grounded investigations).
- Verified by: Alex α · Supports: DoD scoping + § Scope (the plan exists and is grounded in real repo state).

## Verification log
| Item | Should exist? | State | Where / wired where | Proof (cmd/inspection) | Checked | By |
| --- | --- | --- | --- | --- | --- | --- |
| `_planning/warpos-lifecycle-plan.md` | Yes | Verified Exists | `_planning/` | Write confirmed 2026-06-08 | 2026-06-08 | Alex α |
| `.claude/agents/_org/mode-lifecycle.json` (registry keystone) | Yes (to be built — S-LC-01) | Missing But Required | `.claude/agents/_org/` | grep two ways → absent | 2026-06-08 | Phase-0 investigators |
| `mode:init:gate` (named) | Yes (to be built — generalize team-guard) | Missing But Required | `scripts/hooks/team-guard.js` (template exists) | grep → only planning docs | 2026-06-08 | Phase-0 investigators |
| `dispatch-contract.json` (the matrix) | Yes | Verified Exists | `.claude/agents/_org/` | read 2026-06-08 | 2026-06-08 | Phase-0 investigators |
| Provider-health stack | Yes | Verified Exists | `scripts/hooks/lib/provider-health.js` + 4 more | read 2026-06-08 | 2026-06-08 | Phase-0 investigators |
| Harness hook events = closed set of 8 | Yes | Verified Exists | `.claude/settings.json` | grep -o two ways | 2026-06-08 | Phase-0 investigators |

## Current next action
Execution is approval-gated. The first execution step is **S-LC-01 — Mode-Lifecycle Registry (keystone)**: create `.claude/agents/_org/mode-lifecycle.json`, de-duplicate the 3 hardcoded required-team-by-mode sites to read it, fix `lib/mode.js#getMode()`'s missing sprint case, register `mode.json` as a `paths.*` key, add the `mode-lifecycle-registry` validator, and reconcile the DEFAULT-ON drift — minted via `/sprint:plan` after the operator resolves the plan's § Human Approval Points and confirms a new execution session. Until then: review the plan at `../../_planning/warpos-lifecycle-plan.md`.

## Completion record
- Final state: Not yet complete.
- Percent completion: n/a
- Completion timestamp: n/a
- Definition of done used: the § Definition of Done above.
- Evidence of completion: n/a (Planned).
- Session IDs / dates / agents: n/a.
- Related completed sprints: None.
- Remaining follow-up items: all 12 sprint candidates (S-LC-01 … S-LC-12).
- Related untracked work: None.
- ../../TRACKER.md updated: Yes (header pointer) · Roadmap reconciled: Yes (§ Planned epics).
