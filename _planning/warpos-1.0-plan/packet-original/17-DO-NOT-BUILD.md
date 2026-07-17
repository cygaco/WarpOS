# Do Not Build / Do Not Do

This file prevents scope creep and dangerous shortcuts.

## Do not build first

Do not start with:

- a polished Master Console UI
- a full Founder Panel app UI
- native/mobile scaffolding
- a giant rewrite of all agents
- a new product example
- a new release before truth gates are fixed

Start with truth, interop, WorkOrder/ResultEnvelope, SprintRoom, and dispatch/liveness.

## Do not assume

- README is current
- manifest is current
- gap registers are current
- `/research:deep` is broken just because old gap text says so
- dispatch is done just because some waves merged
- Claude team behavior is stable enough to be the durable company
- process absence means worker death
- a ResultEnvelope is true without evidence

## Do not put this in root AGENTS.md

```text
You are Alpha.
```

That poisons every worker.

## Do not raw-call providers

Do not use ad hoc:

```text
claude -p "..."
codex exec "..."
gemini "..."
```

Use wrappers/adapters.

## Do not close known-reds silently

Known-reds must be:

- fixed with evidence
- left open with exact status
- marked stale after verification
- or converted into a new explicit debt

## Do not let Alpha do everyone's job

Alpha may plan, route, reconcile, and make small edits. But sprint artifacts/build/review should use the roster when the sprint mode requires it.

## Do not trust internal-only tracker validity

A tracker can be internally valid and externally stale. Tracker fidelity must compare to sprint state and git.

## Do not build doc-only policies

Every policy needs an enforcer:

- hook
- scan
- test
- CI gate
- founder panel item
- explicit human approval gate

## Do not confuse launch setup with launch readiness

A product can be “configured” but not launch-safe. WarpOS must separately check:

- demo data clean
- OAuth published/tester allowlist
- key rotation
- prod/demo separation
- monitoring
- legal/privacy/payment
- backups/incident runbook

## Do not turn WorkOrders into mini-sprints

A WorkOrder is a coherent execution unit. If it crosses multiple roles/domains/reviewers, split it.

## Do not keep live workers around without leases

Live persistence must be bounded:

- one_shot
- wave
- phase
- session

No immortal builder processes.
