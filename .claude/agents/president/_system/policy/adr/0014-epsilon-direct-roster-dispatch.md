# ADR 0014 — ε summons the in-process roster directly (retiring the ED-041 α-only doctrine)

**Date:** 2026-06-18 (renumbered + landed 2026-06-19)
**Status:** accepted (operator auth 2026-06-19; was pending operator authorization of dispatch self-modification — E-DISPATCH-PERFECT-001 W5; the auto-mode classifier correctly gated the config edits 2026-06-18)
**Class:** B (architectural impact — the sprint dispatch hierarchy / who may call the harness Agent tool)

> **Numbering note:** this ADR was drafted as 0011 on a prior session's branch; the canonical 0011 slot is already taken by `0011-turbo-spend-ceiling-and-push-honesty.md`, so it is **renumbered to 0014** (the next free slot after 0013; 0015 is E-TEAMS-MIGRATION-001). The decision, evidence, and operator authorization are unchanged from the 0011 draft (`fe704238`).

---

## Decision

The in-process-agent roster (managers, leads, directors, design-quality, visual-review) is summonable **directly by the ε conductor in any spawn context** — top-level (α wearing the ε face) **or** a teammate-spawned ε — via the harness `Agent` tool, each spawn supplying a `scopeContract`. The prior "in-process-agent is α-only / a teammate-ε cannot call the Agent tool (ED-041)" doctrine is **retired**: it was a per-spec MISSTATEMENT. The spawn-hand stays with the conductor — a summoned roster member must not dispatch the build chain or cascade further.

## Context

ED-041 entered the system as "Agent is not available inside subagents," and hardened over several sprints into an enforced-by-doctrine rule: the `in-process-agent` shape was marked **α-only** (`mode_profiles.sprint.alpha_only_shapes`, commit `975ed5c`), `epsilon.md` told a teammate-ε it "CANNOT call the Agent tool," and the same claim propagated into the dispatch guide, `/mode:sprint`, `/sprint:full`, and the dispatch-contract `_note`s. The practical cost: a teammate-spawned ε could not conduct a full sprint autonomously — every design-phase manager/lead consult returned `requires-orchestrator` and had to be relayed through α, defeating the "ε orchestrates, α is the thin core" operating model.

Re-verified on 2026-06-18 with **3 agreeing probes plus the live conductor self-check**: a Claude subagent HAS the `Agent` tool **iff its agent-definition lists it**. `epsilon`/γ/δ/α/β list `Agent`; a `general-purpose`/`tools: *` subagent does not (the `*` catch-all excludes Agent). So a teammate-spawned ε **can** call `Agent` and **can** summon the in-process roster. The earlier "ED-041 HOLDS" conclusion (2026-06-17) was a category error — it probed `general-purpose`, not ε. (Independently re-confirmed 2026-06-19 by the E-TEAMS-MIGRATION-001 teammate-ε, which used the Agent tool for a builder dispatch + the β consults — a live, in-anger demonstration, not just a probe.)

This is partly a RESTORATION: ADR-0009 already framed in-process dispatch as done by "ε-the-agent ... via `Agent(subagent_type:<role>)`" — not α-only. The α-only overlay was added later and is what this ADR removes. The only genuine gate on a roster spawn is the `scope-contract-guard` (it requires a `scopeContract`/`allowedFiles`/`forbiddenFiles` block on the spawn prompt).

## Options considered

1. **Relax the doctrine — ε summons the roster directly in any context, supplying a scopeContract (chosen).**
2. **Keep α-only:** leave the doctrine as-is; teammate-ε keeps relaying every in-process consult through α.
3. **Build a transport bridge:** a node-side IPC so the runtime (not the agent) can reach in-process teammates.

## Decision criteria

| Criterion | (1) Relax doctrine | (2) Keep α-only | (3) Transport bridge |
|---|---|---|---|
| Matches verified capability | high | none (encodes a falsehood) | low |
| Unblocks autonomous teammate-ε sprints | high | none | medium |
| Simplicity / blast radius | high (doc + 1 empty-array + ADR) | high (no change) | low (new IPC surface) |
| Preserves the no-fake-green liveness floor | high (record path unchanged) | high | medium |
| Reversibility | high | n/a | low |

## Why this option won

Option (1) makes the doctrine match a re-verified, live-confirmed capability, and it is the smallest change that does so: empty the `alpha_only_shapes` array, correct the prose, add the no-cascade enforcer, write this ADR. It directly restores the "ε orchestrates, α is thin" operating model the company runs on. Option (2) keeps shipping a falsehood (the aspirational-vs-enforced anti-pattern, inverted — here the *prohibition* is the falsehood) and throttles every teammate-ε sprint. Option (3) solves a problem that does not exist — the agent can already call `Agent`; only a *node script* cannot, and the runtime already returns `requires-orchestrator` to hand that spawn to the ε-agent.

## Risks

1. **Deep cascade:** a summoned lead (some leads' specs DO list `Agent`) could spawn further agents, re-creating the "subprocess-of-subprocess" hierarchy problem.
2. **Missing scopeContract:** a roster spawn without a scopeContract is blocked by the scope-contract-guard (fail-closed) — correct, but a conductor that forgets it stalls.
3. **Re-verification scope:** the capability is proven for ε + general-purpose + director + lead + depth-3, not every roster role under load nor the Playwright-MCP reviewers cleanly.
4. **Stale citations:** ED-041 is referenced in ~7 docs; a partial sweep leaves contradictory guidance.

## Mitigations

1. **The spawn-hand-stays-with-the-conductor invariant**, enforced: the existing `dispatch-route-guard` already blocks in-process dispatch of build-chain roles; this ADR adds a no-deep-cascade enforcer + planted-violation fixture so a summoned roster consult cannot dispatch the build chain (ε remains the sole builder-dispatcher). The author-consults are read-only by tool-set (`Read/Grep/Glob`) and cannot dispatch at all.
2. The conductor doctrine (epsilon.md) makes the scopeContract mandatory + shows the read-only-consult form; the guard's failure message names the fix.
3. ε's STARTUP ROUTE SELF-CHECK verifies the `Agent` tool is actually callable at spawn and falls back to subprocess-only + α-relay if it is ever genuinely absent (self-healing if a future harness/spec change removes it).
4. This change sweeps every ED-041 citation in one changeset (epsilon.md, dispatch-contract.json + .js, agent-dispatch-guide.md, /mode:sprint, /sprint:full) keyed to this ADR; CODEX.md keeps its operational truth (a non-Claude orchestrator has no harness Agent tool at all — a different reason than ED-041) with the rationale corrected.

## Reversal plan

Re-add `"in-process-agent"` to `mode_profiles.sprint.alpha_only_shapes`, revert the prose, and set this ADR `superseded by ADR-NNNN`. Cost: one commit; no data migration. Reversal signal: a teammate-ε is observed cascading uncontrollably despite the no-cascade enforcer, or a harness change actually removes `Agent` from subagents (the self-check would surface it).

## References

- Retires the α-only overlay added in `975ed5c` (the `alpha_only_shapes` annotation) + the ED-041 prose across `epsilon.md`, `dispatch-contract.json`/`.js`, `agent-dispatch-guide.md`, `/mode:sprint`, `/sprint:full`.
- Extends ADR-0009 (ε sprint-runtime — "ε-the-agent dispatches the in-process roster," the framing this ADR restores) and ADR-0008 (derive-from-registry). Sibling of ADR-0015 (E-TEAMS-MIGRATION-001 — the v2.1.178 team-primitive migration that landed the doctrine base this builds on).
- Capability evidence: 3 agreeing probes + the live Epsilon conductor self-check, 2026-06-18; re-confirmed in-anger by the E-TEAMS-MIGRATION-001 teammate-ε 2026-06-19 (E-DISPATCH-PERFECT-001 W5; `DISPATCH-ERRORS.md` F5; memory `feedback_ed041_agent_tool_per_spec`).
- Real gate: `scripts/hooks/scope-contract-guard.js`. Cascade enforcer: `scripts/hooks/dispatch-route-guard.js` + the new no-deep-cascade check + planted-violation fixture (this changeset).
- Implementation: E-DISPATCH-PERFECT-001 W5 changeset (commit on land).
