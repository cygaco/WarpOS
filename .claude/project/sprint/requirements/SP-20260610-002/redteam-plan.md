# Red-Team Plan — Lane B — dispatch/registry coherence (WARPOS.md sweep 2026-06-10)

**Sprint:** `SP-20260610-002`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-002\prd.md`

> Adversarial review plan. Diff-model review on redteam is declared in
> `paths.sprintRouting` (`redteam.diff_review: true`). Sprint v0.1 ships
> the checklist; downstream projects extend with project-specific
> personas via `/redteam:full`. Scope: this sprint's surfaces only —
> registry, dispatch-contract, agent specs, check scripts.

## Threat classes to cover

- [ ] Authentication / authorization bypass (n/a — no auth surface in this sprint)
- [ ] Input validation / injection (malformed registry/contract/ledger JSON must fail checks CLOSED, not crash-green or skip)
- [ ] Business-logic abuse (multi-step exploits — e.g. rule-order edit downstream of TICKET-3 silently rerouting leads)
- [ ] Secrets exposure (env vars, logs, error messages — check-script diagnostics must not echo env values)
- [ ] External service abuse (n/a — payload declares zero ESDs)
- [ ] Approval-boundary bypass (executing approval-required work without an approval — push stays per-action operator-cadence)
- [ ] State-of-the-world bypass (acting on stale tracker state)
- [ ] Prompt-injection of the agent loop itself (sprint commands, Plan Contract content — epsilon.md/dispatch-guide are agent-loop instructions; review the rewritten conduct/stall blocks as injectable surface)

## Per-sprint additions

- Enforcer false-green (BC-16 class): role-parity-scan or epsilon-liveness greening on input it could not actually verify — malformed registry, missing role-registry entry, unreadable ledger, runner error. Every unverifiable path must exit non-zero; cross-provider qa has previously caught exactly this class in a 0.17.0 enforcer.
- Fixture theater: planted-violation fixtures that the check doesn't actually load (test passes because nothing ran). Verify each fixture run proves the FAIL path by asserting the non-zero exit AND the named diagnostic, not just "command completed".
- Liveness spoof (ED-028 class): a fabricated ok:true ledger record without real evidence satisfies epsilon-liveness silently — confirm the check pairs evidence with a WELL-FORMED matching record (recordAgentDispatch-guard semantics), not mere record presence.
- Rule-shadowing regression: the new cross-provider-lead rule placed or later moved AFTER `{tier:lead}→manager` is dead code — first-match shadows it and design-lead silently re-derives manager. The shape-vs-route parity FAIL (AC-3.3) must catch this configuration, making the ordering self-detecting.
- Layer bypass (P-058 class): pins edited only in the generated `.claude` view get silently discarded on next regen, resurrecting `model: inherit` while parity scan ran green pre-regen — confirm views-fresh + post-regen re-grep are in the close sequence.

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
