# Red-Team Plan — Lanes C+D — sprint-pipeline truth + research:deep runnability (WARPOS.md sweep 2026-06-10)

**Sprint:** `SP-20260610-003`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-003\prd.md`

> Adversarial review plan. Diff-model review on redteam is declared in
> `paths.sprintRouting` (`redteam.diff_review: true`). Sprint v0.1 ships
> the checklist; downstream projects extend with project-specific
> personas via `/redteam:full`. Scope: this sprint's surfaces only —
> sprint engine/skill, design scaffold, status/checkpoint, research runner.

## Threat classes to cover

- [ ] Authentication / authorization bypass (n/a — no auth surface; provider credentials handled via the existing auth-resolver only)
- [ ] Input validation / injection (malformed mode marker, plan-contract YAML, checkpoint file, or provider response must fail SAFE — never default epsilon ON, never scaffold a placeholder R-list, never green an unvalidated checkpoint)
- [ ] Business-logic abuse (multi-step exploits — e.g. editing requirement artifacts AFTER the design→designed transition to dodge the roster-record enforcer window)
- [ ] Secrets exposure (env vars, logs, error messages — quota-probe diagnostics and deep-run.js output must show auth-resolver labels only, NEVER key values; payload complexity driver #3)
- [ ] External service abuse (probe loops or retries burning paid credit — token cap ≤5 per probe, one probe per provider per run, total spend ≤ cents within the $5 floor)
- [ ] Approval-boundary bypass (executing approval-required work without an approval — push stays per-action operator-cadence; ff-merge is local only)
- [ ] State-of-the-world bypass (acting on stale tracker state — checkpoint.js validating existing checkpoints closes the AL-W-006 stale-return path)
- [ ] Prompt-injection of the agent loop itself (sprint commands, Plan Contract content — the rewritten full.md conduct sections and the thin deep.md wrapper are agent-loop instructions; review the rewritten blocks as injectable surface, incl. requirement_areas strings flowing into scaffolded R-ids)

## Per-sprint additions

- Enforcer false-green (BC-16 class): the trace-integrity check or design-transition enforcer greening on input it could not verify — missing PRD file, unreadable ledger, malformed stories/trace. Every unverifiable path must exit non-zero/flag loudly; cross-provider qa has previously caught exactly this class in a 0.17.0 enforcer.
- Legacy-waive scope abuse: the design-transition enforcer's legacy-sprint exemption (and any trace-integrity new-scaffold scoping) used as a bypass — a NEW sprint mis-tagged as legacy slips the check. Verify the new/legacy discriminator is derived from scaffold provenance, not from an attacker-editable field in the bundle.
- Default-flip blast radius: `isSprint()` returning true outside a real sprint session (stale mode marker from a crashed session) silently flips epsilon dispatch ON in solo/adhoc work. Confirm the mode marker has lifecycle hygiene (S-LC-01) and the planted non-sprint test covers the stale-marker case.
- Fixture theater: planted-violation fixtures the checks never actually load (test passes because nothing ran). Each fixture run must assert the non-zero exit AND the named diagnostic (orphan R-id named, provider label named), not just "command completed".
- Blocked-primitive laundering: deep-run.js is the sanctioned standalone runner precisely because it does fs-writes + network internally — confirm it is scoped to the research pipeline (fixed output dirs under runtime/, no arbitrary-path write argument, no arbitrary-command execution) so it cannot become a generic classifier-bypass shell.
- Probe misclassification: a transient 5xx/network error classified as `insufficient_quota` permanently skips a healthy provider (silent capability loss), or a real quota error classified transient burns the async submission anyway. Both directions must be covered by the mocked-response fixtures.

## Stop-the-bus signals

If any of these surface during redteam, halt `/sprint:execute` and
escalate:

- Any path to bypassing approval gates
- Any path to exfiltrating `secret: true` env values from tracker files
- Any path to running production deploys without approval
- Any path to silently changing TRACE while behavior changes
- Any path to a Ralph loop that doesn't reach a stop condition

## Documentation scaling

This file is mandatory for `documentation_scale: m | l | xl`. For xs/s
it can be a single checklist inlined in the QA plan.
