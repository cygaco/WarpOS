<!-- EPIC TRACKER — spec §22. Linked from ../../TRACKER.md. Template: ../templates/EPIC_TEMPLATE.md
     States (§19): Planned | Ready | Active | Blocked | Paused | Review Needed | Completed | Cancelled | Superseded -->

# E-MC-READINESS-EXECUTION-001 — Masterconsole Release-Readiness: EXECUTION

- **Epic label and number:** E-MC-READINESS-EXECUTION-001
- **Title:** Masterconsole Release-Readiness: EXECUTION (burn down the findings)
- **Owner:** President Agent
- **Parent roadmap area:** [../../ROADMAP.md](../../ROADMAP.md) § Epics → Active epics (TOP, gated on ANALYSIS)
- **Goal:** Execute against ALL findings from E-MC-READINESS-ANALYSIS-001 — bulletproof every command/flow, land the triple-pass security fixes, close the predicted edge cases, harden the release pipeline (final fix for slip-through), reorganize the file/agents structure, and convert every prose-vs-reality gap into a named enforcer. End-state: masterconsole ships externally on a hardened, fully-enforced engine.
- **Background:** The second half of the operator's decide-then-do strategy (2026-06-07). Kept SEPARATE from analysis so the target is frozen during execution — no change-as-we-go.
- **Scope:** One execution sprint per analysis track, each scoped FROM the consolidated findings (not pre-guessed): hardening-exec · security-exec · edge-case-exec · release-pipeline-exec · file-org-exec (absorbs E-DISPATCH-INTEGRITY-001 F-4 + the ED-026 03-managers cutover-staleness) · prose-vs-reality-exec.
- **Out of scope:** re-analysis (that is the ANALYSIS epic). New scope discovered mid-execution loops back to ANALYSIS, not handled inline.
- **Current state:** Planned (blocked on E-MC-READINESS-ANALYSIS-001)
- **Percent completion:** 0% — gated; activates when ANALYSIS reaches Completed.

## Definition of Done
- [ ] Every consolidated ANALYSIS finding is either fixed-and-verified or explicitly deferred-with-reason (none silently dropped).
- [ ] Each execution sprint re-gauntlets (per the RE-GAUNTLET-after-fix learning) — a fix can open a new hole.
- [ ] Every prose-vs-reality gap has a named enforcer (or logged enforcement-debt); aspirational claims are made enforced or removed.
- [ ] A clean-room masterconsole-style consumer lifecycle passes end-to-end (the hardening exit criterion).
- [ ] Release pipeline cannot ship an incomplete capsule (the slip-through class is structurally closed).

## Related definitions
- Verification, Evidence, Validator, Wiring — see ../../TRACKER.md

## Related sprints
- hardening-exec · security-exec · edge-case-exec · release-pipeline-exec · file-org-exec · prose-vs-reality-exec — all Planned (scoped from ANALYSIS findings).

## Dependencies
- HARD: E-MC-READINESS-ANALYSIS-001 must be Completed (frozen findings) before this starts. Absorbs E-DISPATCH-INTEGRITY-001 (F-1..F-5) as execution inputs once analysis confirms.

## Blockers
- Blocked on E-MC-READINESS-ANALYSIS-001 (gate).

## Risks
- Execution re-opens analysis (scope creep) — mitigation: new findings loop back to ANALYSIS; execution only burns down the frozen set.
- A fix opens a new hole — mitigation: re-gauntlet after every fix cycle (cross-provider where it matters).

## Decisions
- 2026-06-07: gated execution (separate epic) per operator — do not start until analysis findings are frozen.

## Open questions
- Sprint granularity (one-per-track vs finer) — decided at activation from the findings volume.

## Session log
### 2026-06-07 — Session session/2026-06-07 (epic authored, Planned)
- Agent(s): President Agent (α) · Mode: solo/α-foreground
- Work performed: Authored this gated execution epic alongside the analysis epic at ROADMAP § Active epics TOP.
- Files changed: ../../ROADMAP.md; this tracker.
- State change: (new) → Planned (blocked on ANALYSIS) · Completion 0%.
- Next action: none (gated).
- Evidence/references: operator directive 2026-06-07; E-MC-READINESS-ANALYSIS-001.

## Change log
### 2026-06-07 — Epic created (President α)
- Changed: Created E-MC-READINESS-EXECUTION-001 (Planned, 0%, gated on ANALYSIS).
- Reason: the execution half of the operator's decide-then-do release-readiness strategy.
- Affected: ../../ROADMAP.md; this tracker; the analysis epic tracker.
- Previous → New: no execution epic existed → a gated execution epic that burns down the analysis findings.

## Evidence log
### 2026-06-07 — epic authored
- Evidence type: Existence confirmation.
- Detail/location: ROADMAP § Epics → E-MC-READINESS-EXECUTION-001; this file.
- Verified by: President Agent. Supports: the Planned/0% state.

## Verification log
| Item | Should exist? | State | Where | Proof | Checked | By |
| --- | --- | --- | --- | --- | --- | --- |
| This epic in ROADMAP | Yes | Verified Exists | ROADMAP § Active epics | authored 2026-06-07 | 2026-06-07 | President Agent |
| ANALYSIS gate | Yes | Verified Exists | E-MC-READINESS-ANALYSIS-001 | the hard dependency | 2026-06-07 | President Agent |

## Current next action
None — gated. Activates when E-MC-READINESS-ANALYSIS-001 reaches Completed and its findings are consolidated; then mint the per-track execution sprints from the findings.

## Completion record
- Final state: Not yet started (Planned, 0%, blocked on ANALYSIS)
- Percent completion: n/a
- Definition of done used: see Definition of Done above
- Evidence of completion: n/a — gated
- Session IDs / dates / agents: session/2026-06-07 / 2026-06-07 / President Agent
- Related completed sprints: None
- Remaining follow-up items: all execution sprints (post-analysis)
- Related untracked work: None
- ../../TRACKER.md updated: pending · Roadmap reconciled: Yes
