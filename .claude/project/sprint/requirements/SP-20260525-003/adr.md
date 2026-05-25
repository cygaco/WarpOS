# ADR — /sprint:full Beta-consult honesty: halt-at-boundary

**Sprint:** `SP-20260525-003` (milestone 0.11.0 Sprint Workflow Honesty, sprint 1)
**Status:** Accepted
**Date:** 2026-05-25
**Deciders:** Alex α (recommendation) + Alex β (DECIDE, conf 0.87, `OPEN_ADR:true`) — beta event `EVT-sp-20260525-003-adr-beta-001`, precedent `EVT-sprint-wrap-1779146124174`
**Story:** S-1

## Context

`scripts/sprint/full.js#maybeConsultBeta` (≈line 472) emits `sprint_full_beta_consultation` events with a hardcoded `verdict: "DECIDE"` placeholder and **no real round-trip to Beta**. The orchestrator runs as `spawnSync`-d node and cannot reach in-process teammates — the `Agent`/`SendMessage` tool surface lives in the Claude Code runtime, not in node subprocesses. Result: `_docs/sprint/AUTONOMY.md`'s Beta-consultation cadence is *aspirational*, not enforced — the autonomy-ladder rungs are decorative. Milestone 0.11.0 exists to make them load-bearing.

## Options

**(a) Dispatch-from-subprocess bridge.** Orchestrator drops `consult-request-<phase>.json`; a runtime-side poller picks it up, dispatches Beta in-process, drops `consult-verdict-<phase>.json` back; orchestrator polls. Fully unattended.

**(b) Halt-at-each-Beta-boundary.** Orchestrator halts at each phase boundary with a `consult-pending` checkpoint and exits; Alpha-in-foreground runs the real `SendMessage` consult, records the verdict, and resumes with `--beta-verdict` / `--beta-message` / `--pending-phase`. Reuses existing halt/resume + checkpoint machinery.

## Decision

**Option (b) — halt-at-each-Beta-boundary.**

## Rationale

1. **(a)'s poller is architecturally homeless.** Claude Code has no persistent daemon; hooks are event-triggered, not timer-triggered. A file-drop watcher has nowhere clean to live without a perpetual side-effect on an existing hook or new long-running infra — high risk of a half-working bridge, which is the exact aspirational-vs-enforced anti-pattern this milestone kills.
2. **(b) is honest by construction.** The verdict is a real Alpha→β `SendMessage`. ESCALATE cannot be faked or silently timed-out back into a placeholder DECIDE. This sprint's own milestone-target + ADR consults (`EVT-milestone-0110-target-20260524-beta-001`, `EVT-sp-20260525-003-adr-beta-001`) are live proof the mechanism works.
3. **(b) is low-risk.** One checkpoint field + 3 CLI args on top of already-tested halt machinery, vs (a)'s 4+ new moving parts.
4. **Cost accepted:** /sprint:full becomes semi-interactive at β boundaries. This is aligned with adhoc mode (α+β collaboration is its defining property) and *is* the point of consultation honesty. Autonomy presets still govern all non-β decisions.

## Consequences

- `maybeConsultBeta` no longer auto-emits a fake DECIDE. In adhoc mode, at a β boundary with no supplied verdict, it halts with `halt_reason: beta_consult_pending`.
- New resume-path CLI args: `--beta-verdict <DECIDE|DIRECTIVE|ESCALATE>`, `--beta-message "<text>"`, `--pending-phase <boundary>`.
- New checkpoint field recording the pending β boundary.
- New `halt_reason: beta_consult_pending` documented in `_docs/sprint/CRASH_RECOVERY.md`.
- Verdict handling at every boundary: **ESCALATE** → `halt_reason: beta_escalate` (hard halt regardless of preset); **DIRECTIVE** → applied to downstream phase behavior; **DECIDE** → continue.
- Event subtype reconciled to `sprint_full_beta_consult` with `verdict + beta_message + latency_ms + model` (story S-5).
- Option (a)'s file-drop/poller story (S-3) is **not pursued**.
- Solo mode unchanged (skips Beta entirely).

## Enforcement

Made self-enforcing by SP-20260525-004 (sprint 2 of 0.11.0): `/check:sprint-beta-honesty` scans full-reports for placeholder vs real consults and closes the enforcement-debt entry. This ADR's decision is the precondition that makes that check meaningful.
