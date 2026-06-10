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
- **Current state:** Active
- **Percent completion:** ~10% — plan authored + Phase-0 grounded 2026-06-08; Wave-0 keystone S-LC-01 (Mode-Lifecycle Registry) LANDED 2026-06-09 @76da472 (1 of 12 planned sprints), gauntlet-clean. Conservative — the remaining 11 sprints (lifecycle-event registry, the Wave-1 mechanical gates, team manager, dispatch/turbo, planning+epic-suite, provider readiness, AC enforcement) carry the bulk of the DoD.

## Definition of Done
- [ ] Mode-Lifecycle Registry is the SOLE source of truth (all readers resolve from it; the `mode-lifecycle-registry` validator is green; the DEFAULT-ON drift reconciled) — proven by a planted wrong-roster fixture failing.
- [ ] `mode:init:gate` blocks dispatch/tool-use until the 14-item init checklist passes, for every mode, fail-closed, idempotent — proven by the planted fixtures (no-team, wrong-team, duplicate-call, dispatch-before-init).
- [ ] Mode switch + `/session:end` **best-effort** + project-scopedly tear down teams (request-shutdown→TeamDelete→reconcile; no guaranteed kill of a live in-process teammate) — proven by a planted wrong-PROJECT team surviving a kill + an orphan being detected.
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
- **S-LC-01 — Mode-Lifecycle Registry keystone (Wave 0)** — Completed 2026-06-09 @76da472 (gauntlet-clean). Sprint dir: `.claude/project/sprint/sprints/S-LC-01/`.
- The remaining 11 sprint candidates (S-LC-02 … S-LC-12 across 6 waves) are minted via `/sprint:plan` at execution time. See [../../_planning/warpos-lifecycle-plan.md](../../_planning/warpos-lifecycle-plan.md) § "Proposed Sprint Breakdown".

## Dependencies
- E-SYSTEM-ORG-001 (dispatch-shape north star, ~99%) — prerequisite; this epic builds on `dispatch-contract.json`, `dispatch-shape.js`, `safe-spawn.js`, `coverage-gate.js`. State: near-complete on `main`.
- E-DISPATCH-INTEGRITY-001 (coverage-honesty) — sibling; its run-ledger precondition work pairs with Wave 2's coverage-gate wiring. State: Active.
- Operator decisions on the § Human Approval Points (turbo push/spend default; provider funding/subscription detection method; mode-behavior backward-compat) before the affected waves flip to blocking. **RESOLVED 2026-06-09 (operator) — see Change log: all 6 §22 points ruled (turbo spend = $100 framework default, push per-action; provider = self-attestation + opt-in probe; mode-behavior backward-compat DEFERRED to the Wave-1 gate-flip).**

## Blockers
- None currently recorded (Active; Wave-0 keystone landed 2026-06-09 @76da472. The Wave-1 gate-flips remain operator-gated per the § Human Approval Points resolutions, but no blocker prevents S-LC-02 or the Wave-1 build work from starting).

## Risks
- Fail-closed bug bricks mode entry/dispatch — mitigate with the global fail-OPEN posture + kill-switch env/markers + bootstrap allow-list + canary report-only + the dry-run simulation plan.
- Mechanical teardown kills the wrong/another-project team — mitigate with a project-slug scope on every kill + verify-terminated + a planted wrong-project fixture + a `--keep-teams` default for one release.
- Registry generalization regresses the working sprint gate — mitigate by golden-snapshotting the current `team-guard` behavior + keeping `team-guard-gate.test.js` green + a per-mode report→block ramp.
- KNOWN DRIFT to reconcile in S-LC-01: E-SYSTEM-ORG-001 prose records S-12c as "ships DEFAULT-OFF," but the shipped code, `team-guard-gate.test.js`, the code comment, and the live `.team-gate-hard` marker all indicate DEFAULT-ON (read-only-verified 2026-06-08). The reconciliation is a logged Change Log entry, not a silent edit.

## Decisions
- 2026-06-08 — One epic (not split) — the spine (Mode-Lifecycle Registry → lifecycle-event registry → init-gate → team manager) is shared across all areas; splitting fragments the source of truth. Provider readiness (Wave 4) is the one cleanly-separable workstream and may fast-follow as E-PROVIDER-TIER-001 if it grows.
- 2026-06-08 — "25 hook events" reframed to 2 real PreToolUse guards + ~23 virtual registry-driven events logged to `paths.eventsFile` — the harness hook-event set is closed at 8 (read-only-verified).
- 2026-06-08 — Extend, don't reinvent: `dispatch-contract.json` IS the dispatch permission matrix; the provider-health stack already exists. The epic layers onto both.
- 2026-06-08 — Turbo default = highest autonomy (operator decision, β-escalated Class C): `/session:turbo` auto-grants the max autonomy short of the never-allowed hard ceilings. Deliberately overrides "Push = Ask first" for turbo sessions. **[DELIVERY CORRECTED 2026-06-08 — see the GPT-5.5 review decision below: push-to-main is NOT auto-grantable; the harness classifier sits above `permissions.allow` (which already grants `git push *`). Turbo auto-grants spend + commit + branch; push/merge-to-main stays per-action.]** (S-LC-07.)
- 2026-06-08 — β consult (5 calls, `EVT-lifecycle-epic-decomp-2026-06-08`, logged to `paths.betaEvents`): one epic [DECIDE 0.87] (provider readiness = candidate split evaluated at Wave-4 kickoff, not pre-committed); sequencing sound [DECIDE 0.90] (W1 slips with W0, never around it); epic suite design-10-build-2 [DECIDE 0.85] (other 8 explicitly gated as fast-follow); provider detection = self-attestation + opt-in probe, reject infer-from-dispatch [DECIDE 0.84]; turbo [ESCALATE] → operator decision above.
- 2026-06-08 — Post-authoring GPT-5.5 cross-provider review (cabinet, `ok:true`, model gpt-5.5) + α feasibility check CONVERGED → verdict NEEDS-REWORK on OVERCLAIMS (not the foundation); β-DECIDE 0.91 to fold doc-only honesty corrections. The 4 corrections (folded into the plan §1A/§8.3/§8.4/§8.8/§20/§22/§25): (1) turbo auto-push proven infeasible — `git push *` is already in `permissions.allow` yet the harness classifier still blocks push-to-main → push stays per-action; (2) mode-switch enforcement moves into `mode-set.js` as the single lifecycle-transaction writer, PreToolUse guard = BACKSTOP-ONLY; (3) team teardown downgraded mechanical→best-effort+reconcile; (4) blast-radius = fail-OPEN on parse, fail-CLOSED only on explicit bad states, report-only ramp. Evidence: `runtime/agent-system-plan/lifecycle-review/gpt55-review.out`. Foundation intact.

## Open questions
- Turbo auto-push/merge + spend default — RESOLVED 2026-06-08 (operator: "highest autonomy possible") — see § Decisions. Residual sub-call: the exact framework-default spend-ceiling value ($100 baseline recommended). **RESOLVED 2026-06-09 (operator): $100 framework-default ceiling (raisable per session); push/merge-to-main stays per-action. Encoded as DP-gap #39(a) in `paths.decisionPolicy`.**
- Provider funding/subscription detection method (self-attestation vs gated billing-API probe vs infer-from-dispatch) — likely not read-only-detectable — owner: operator. **RESOLVED 2026-06-09 (operator): self-attestation default + optional opt-in billing-API probe; REJECT infer-from-dispatch.**
- T3 tier subscription floor (`Max 5x` vs a lower hobbyist Claude sub — source's own open Q) — owner: operator. **DEFERRED 2026-06-09 (operator) to Wave 4 design.**
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

### 2026-06-09 — Session (adhoc)
- Changed: all 6 § Human Approval Points (plan §22) RESOLVED by the operator, and the 5 staged β recommendations PROMOTED into the judgment model. Specifically — #1 epic ID+title APPROVED; #2 turbo/spend APPROVED ($100 framework-default ceiling, raisable per session; auto-grants spend+commit+branch within the never-allowed hard ceilings; push/merge-to-main STAYS per-action because the harness classifier sits above `permissions.allow`); #3 provider detection APPROVED self-attestation default + optional opt-in billing-API probe, REJECT infer-from-dispatch (T3 tier-value DEFERRED to Wave 4); #4 backward-incompatible mode behavior DEFERRED to the Wave-1 gate-flip; #5 `epic:` command names APPROVED all 10, build `/epic:plan`+`/epic:fold` first; #6 Playbook direction APPROVED reference-procedures, design `/playbook:run` later. β recs PROMOTED: P-060 (review-discipline), P-061 (honesty-over-optimism), P-062 (autonomy-ceiling-resolves-upward), P-063 (procedure-integrity) → judgment-model.md; G-20 (pre-build review-gating) → judgment-model.md Reasoning/Heuristic; DP-gap #39(a) (turbo operator-declared override + autonomy-ESCALATE-resolves-upward) → decision-policy.md.
- Reason: the operator ruled on the §22 approval points and directed PROMOTE on all five staged β recommendations from the 2026-06-08→09 mining cycle.
- Affected: `_planning/warpos-lifecycle-plan.md` (§22 annotated with resolutions), `.claude/agents/president/_system/beta/judgement-model.md` (P-060..P-063 + G-20 + changelog rows), `.claude/agents/president/_system/policy/decision-policy.md` (DP-gap #39(a) § Autonomy-ceiling resolution), `.claude/agents/president/_system/beta/judgement-model-recommendations.md` (INTEGRATION STATUS marked operator-ruled), this file.
- Previous state: Planned, 0%, §22 approval points open (3 RESOLVED-2026-06-08 + 3 open); 5 β recs LEFT STAGED for operator ruling.
- New state: Planned, 0%, all §22 approval points resolved (4 APPROVED, #3 partial-defer of the T3 sub-call, #4 DEFERRED to Wave-1 gate-flip); 5 β recs promoted. Execution remains approval-gated (no code work started).

### 2026-06-09 — S-LC-01 (Wave-0 keystone) LANDED — epic Activated
- Changed: Wave-0 keystone sprint **S-LC-01 — Mode-Lifecycle Registry** executed and landed on branch `june-9` @ `76da472`, gauntlet-clean. Deliverables: new `.claude/agents/_org/mode-lifecycle.json` (per-mode SoT registry) + `scripts/hooks/lib/mode-lifecycle.js` (shape-validated reader, fail-open) + `scripts/checks/mode-lifecycle-registry.js` (fail-closed drift validator, wired report-only into `/scan:full`); `lib/mode.js#getMode()` sprint-case fix + new `isSprint()`; de-dup of `session-start.js` TEAM_MODES + `team-guard.js` FACE_TYPES to READ the registry (golden suites unchanged — team-guard-gate 13/13, team-guard-sprint 8/8); `mode.json` registered as the `modeMarker` paths key; the S-12c DEFAULT-ON drift reconciled in `TRACKER.md` + E-SYSTEM-ORG-001. Tests: mode-getmode 3/3, mode-lifecycle-registry 18/18. Gauntlet: backend-reviewer + qa-reviewer both PASS (gemini failover after a codex transient reap); 6 findings across 3 fix-cycles all resolved.
- Reason: operator-confirmed execution session for the Wave-0 keystone (the registry every downstream Wave-1 gate reads — it had to land first as the sole SoT).
- Affected: `.claude/agents/_org/mode-lifecycle.json` (new), `scripts/hooks/lib/mode-lifecycle.js` (new), `scripts/checks/mode-lifecycle-registry.js` (new), `lib/mode.js`, `scripts/hooks/session-start.js`, `scripts/hooks/team-guard.js`, the paths registry (`modeMarker` key); this file (Current state, Percent completion, Current next action), `.claude/project/sprint/sprints/S-LC-01/{current,progress}.yaml` (status→done), `ROADMAP.md` (epic Activated + S-LC-01 ledger row), `TRACKER.md` (Active reconciliation).
- Previous state: Planned, 0%, execution approval-gated (no code work started).
- New state: **Active, ~10%** — 1 of 12 planned sprints landed (the Wave-0 keystone); Wave-0 S-LC-02 + the Wave-1 gates are the open next steps.

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
S-LC-01 (Mode-Lifecycle Registry keystone, Wave 0) is DONE — landed 2026-06-09 @76da472, gauntlet-clean. Next execution step: **S-LC-02 — Lifecycle-Event Registry + logger + coverage enforcer** (the other Wave-0 sprint; parallel-safe with S-LC-01 and now unblocked since the registry keystone it pairs with has landed) **OR** open the **Wave-1 mechanical gates** (S-LC-03 mode-switch preflight guard · S-LC-04 generalized fail-closed `mode:init:gate` · S-LC-05 persistent-team lifecycle manager), each minted via `/sprint:plan`. The full plan remains at `../../_planning/warpos-lifecycle-plan.md` § "Proposed Sprint Breakdown".

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
