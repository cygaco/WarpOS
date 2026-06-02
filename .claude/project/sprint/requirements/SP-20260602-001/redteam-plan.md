# Red-Team Plan — Sealed-capsule executable consumer-contract gate (keystone)

**Sprint:** `SP-20260602-001`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260602-001\prd.md`

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

## Per-sprint additions (the enforcer-class attack surface — "can the gate be made to lie?")

- **False-green via fake isolation:** can the sealed payload still reach canonical (relative `../../` escape from the temp dir, an un-scrubbed env var, a hardcoded canonical abs path, a `require` that resolves to canonical node_modules)? If reach-back is possible but the gate still greens, that is the headline vulnerability.
- **Fail-OPEN on error:** does any runner-error / spawn failure / timeout / missing binary cause the gate to exit 0 (or skip a cell) instead of failing closed? Probe every `catch`, every `spawnSync` status check, every `||` default.
- **Telemetry forgery / Golden-Ticket:** can a stale or far-future or injected completion record satisfy `verifyTyped` for a step that never ran? Confirm canonical-anchored ledger + window/skew clamps are actually applied (not bypassed by the gate passing the wrong ledger path).
- **Manifest-staleness bypass:** can the gate run against a stale manifest (the `--check` skipped or its non-zero status ignored)?
- **Matrix cell silently skipped:** can a role/path cell be dropped (e.g. repo-role override not threaded, so both cells resolve to the same role) while the gate still reports 4/4?
- **Negative tests that don't actually fail:** verify the planted-reach-back / fault-injection tests genuinely drive a non-zero gate exit, not a no-op that passes regardless.

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
