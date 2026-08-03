# Red-Team Plan — Engine skeleton — plain-node Agent SDK app, MCP stdio server, four-core tool surface, job state machine, journal, permission-level config port, and the API-key model-access seam

**Sprint:** `S-VLADW1-01`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\S-VLADW1-01\prd.md`

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

- {{sprint_specific_threat_1}}
- {{sprint_specific_threat_2}}

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
