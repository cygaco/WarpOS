# ADR: Durable Company, Ephemeral Executors

## Status

Proposed for WarpOS 1.0.

## Context

The previous architecture leaned toward persistent live agent teams. In practice, live agents can stall, lose wake events, inherit wrong model settings, miss completion records, or die without usable liveness evidence. Doogle exposed stale worktrees, false liveness signals, tiny fake-green prompts, missing completion/death records, tracker drift, and founder-launch gaps.

The desired jobs remain valid:

- Alpha as the smartest top-level architect and orchestrator.
- Beta as a judgment/decision system that approximates Vlad's preferences.
- Epsilon/Gamma/Delta as mode conductors.
- Workers and reviewers as a company-like execution hierarchy.
- Model routing that can move work to Codex/Gemini/Claude intelligently.

The mistake is treating live model processes as the durable company.

## Decision

WarpOS will use:

```text
Persistent:
  RoleSpec
  StateCard
  SprintRoom
  WorkOrder ledger
  ResultEnvelope ledger
  DecisionRecord
  Event streams
  Trackers
  Handoffs
  Founder Panel store

Ephemeral or leased:
  Claude sessions
  Codex runs
  Gemini runs
  reviewers
  builders
  fixers
  lane pods
  live conductors
```

The company lives in WarpOS state. Model runtimes are executors.

## Consequences

### Positive

- Any AI can be the top-level runtime if it can read/write repo state and call the dispatch bridge.
- Agents can be killed/replaced without losing truth.
- Claude-specific, Codex-specific, and Gemini-specific behavior moves behind adapters.
- Sprint resumption becomes file/state-based.
- Token use improves because context can be scoped per WorkOrder.
- False-green claims become easier to detect.

### Negative

- More schemas and validators are required.
- Some existing Claude-specific assumptions must be refactored.
- The first implementation phase is kernel-heavy and less visually exciting.
- Top-level portability requires a neutral Master Console or wrapper if the top-level AI is not Claude Code.

## Persistence policy

Live agents may persist only under leases:

```text
one_shot: one WorkOrder, expires at ResultEnvelope
wave: several related WorkOrders in one lane, checkpoint after each
phase: conductor/reviewer/security/research role for one sprint phase
session: top-level Alpha session, writes handoff on end
```

Killing a live agent must lose convenience only, never truth.

## Reaper policy

Never reap a worker on process absence alone. Reaper uses:

- started event
- lease state
- heartbeat
- output growth
- ledger updates
- branch commits
- provider status
- elapsed time
- hard timeout
- ping/nudge attempts

## Role identity

Role identity is provider-neutral:

```text
role_id: frontend-builder
provider: openai | claude | gemini | future
runtime: codex-cli | claude-code | gemini-cli | api | wrapper
```

Provider/routing can change without rewriting role identity.

## Non-decision

This ADR does not ban live Claude teams or subagents. It demotes them from durable architecture to tactical runtime options.
