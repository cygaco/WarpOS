# ADR 0021 — Agent-Tool Channel is a Claude-Only Capability (ED-208 resolved)

**Date:** 2026-07-18
**Status:** accepted
**Class:** B (dispatch architecture impact)
**Sprint:** SP-20260718-003 (Phase 1 — routing + security truth) · **Traces:** R-2 · AC-2, AC-3
**Resolves:** ED-208 (**resolved**)

---

## Decision

**Agent-tool channel = Claude-only capability, distinct from registry role-routing.**

The harness Agent tool (the in-process spawn channel used by α/β/ε and the in-process roster) can
spawn ONLY Claude models. This is an INVOCATION-CHANNEL CAPABILITY, a truth distinct from a role's
LOGICAL ROUTING (which provider/model it is pinned to in the role-registry for cross-provider review
diversity). The two must never be conflated:

- **Logical role routing** — owned by the role-registry keystone + `getProviderForRole`/`passesOf`
  (the CLI dispatch path). A role pinned to `openai`/`antigravity`/`gemini` routes to that real
  provider when dispatched via `dispatch-agent.js`. UNCHANGED by this ADR.
- **Invocation-channel capability** — when the SAME role is summoned in-process via the harness Agent
  tool, the channel resolves a CLAUDE model regardless of the registry pin. `harnessSpawnModel(role)`
  (`scripts/dispatch/harness-spawn-model.js`) is the resolver: a native-Claude role keeps its own
  model; a non-Claude pin is tier-coerced to a Claude model (face/director/lead → claude-opus-4-8,
  worker/tool → claude-sonnet-5); an unknown role fails safe to the face model. It ALWAYS returns a
  Claude model — never the registry's non-Claude pin.

This replaces the manual `model:"opus"` workaround that every harness spawn of a non-Claude-pinned
role had to hand-pass. The channel model is now DERIVED from the role's tier, structurally.

## Context

ED-208: harness Agent-tool spawns fail on non-Claude registry pins — a `security-reviewer`
(antigravity) or `product-lead` (openai/gpt) spawned in-process would silently fail, or worse, resolve
a Claude clone that MASQUERADES as the pinned provider. This is the D1↔D5 false-green backbone: an
in-process gpt/agy "lane" is a silent Claude clone, so an all-Claude set could pass as cross-provider
diversity. Making the channel's Claude-only nature EXPLICIT (and separate from CLI routing) is the
precondition for the panel lane contract (ADR 0020): the cross-provider labs MUST be CLI subprocesses
precisely because the in-process channel cannot run them as their native provider.

## Consequences

- The security panel's cross-provider labs (gpt, agy) are CLI-only by necessity, not merely by policy
  (ADR 0020's CLI-only tooth). The claude hunter is the one legal in-process lane.
- `harnessSpawnModel` governs ONLY the Agent-tool channel; the CLI path (`getProviderForRole`,
  `passesOf`) is untouched — the two truths stay separate and separately testable (AC-2 asserts both
  halves: a non-Claude pin resolves Claude on the channel while its CLI provider is unchanged).
- ED-208 is **resolved**: the channel-model resolution is structural, and the harness-vs-CLI channel
  divergence is recorded in `support-matrix.json` Addendum A (gpt-5.6-terra harness proven:false /
  CLI proven:true).

## Enforcer

`scripts/dispatch/harness-spawn-model.js` + `harness-spawn-model.test.js` (9 assertions incl. the live-
registry channel invariant: every role's harness model is a Claude model). The ADR 0020 CLI-only tooth
is the downstream structural guard that a cross-provider lane never rides the in-process channel.
