# Red-Team Plan — Cross-family findings fix sprint — 6 gemini re-review findings (epsilon-runtime spawn race, fallback ENFORCE brick, hardcoded BUILD_CHAIN_ROLES, spoofed-ts window, sprint_id correlation, verifyGauntlet parse refusal)

**Sprint:** `SP-20260611-001`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260611-001\prd.md`

> Adversarial review plan. Diff-model review on redteam is declared in
> `paths.sprintRouting` (`redteam.diff_review: true`). Sprint v0.1 ships
> the checklist; downstream projects extend with project-specific
> personas via `/redteam:full`.

## Threat classes to cover

- [ ] Authentication / authorization bypass
- [ ] Input validation / injection
- [ ] Business-logic abuse (multi-step exploits)
- [ ] Secrets exposure (env vars, logs, error messages)
- [ ] External service abuse (ESD-related credential or quota misuse)
- [ ] Approval-boundary bypass (executing approval-required work without an approval)
- [ ] State-of-the-world bypass (acting on stale tracker state)
- [ ] Prompt-injection of the agent loop itself (sprint commands, Plan Contract content)

## Per-sprint additions

- False-green self-reference (β plan-phase risk #1): every fix lives IN the layer that polices dispatch honesty — attack each fix by asking "can a subtly-wrong version of this fix pass its own enforcer?" (BC-16)
- Spoofed-ts variants beyond 1970/2099: near-horizon outliers (created_at ± cap ± 1ms boundary), mixed valid/outlier event sets, all-outlier sets (must fail closed, not fail open)
- Cross-sprint record laundering: a concurrent sprint's record with a FORGED sprint_id matching this sprint (sprint_id preference must not become a new spoof vector — the record is semi-trusted; window clamp still applies as defense-in-depth)
- Sanctioned-lane over-breadth: verify the fix-2 registration covers ONLY the review-fallback lane shape, not a wildcard that would bless other mismatches under ENFORCE
- Registry poisoning (fix 3): an unreadable/tampered registry must degrade to the literal-Set fallback, never to "no gate"

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
