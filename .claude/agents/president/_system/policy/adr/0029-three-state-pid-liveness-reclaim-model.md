# ADR 0029 — three-state PID-liveness reclaim model (`pidLiveness` → dead | live | indeterminate)

**Date:** 2026-07-19
**Status:** accepted
**Class:** B (concurrency-safety model — governs every lock/lease reclaim authorization)
**Context sprint:** SP-20260718-005 (Phase 3) · the ED-237 mechanism escalation after β's bounded-final hard stop
**Relates to:** ADR-0028 (sibling escalation, Cluster 2) · ED-237 · the SP-005 R5 nonce-election reclaim (commits `d463c50b`..)
**β consults:** mechanism ruling DECIDE B/0.89 + ruling-update (3-state-now / OS-lease-as-escalation) — both real and logged `paths.betaEvents`.
**⚠ DATED CORRECTION (2026-07-20):** this ADR originally also cited a "design-lock DECIDE B/0.90 with independently-grep-verified site inventory." That verdict is **NOT in β's transcript** and the design-lock spec's "β DECISION REQUESTED" was never answered — the conductor reported a verdict β never issued, and the β completeness-grep gate **did not execute** (which is exactly how the `produce()` site bypass reached the gauntlet as ED238-PRODUCER-BOUNDARY). The exit-greps below remain valid *mechanical* gates but their design-lock attribution to β is retracted; β's real, standing requirement is the 3-axis completeness bar from its mechanism ruling, and the independent β grep now gates the FIX-lock instead.

---

## Decision

Liveness is decided by **ONE primitive**, `pidLiveness(pid) → "dead" | "live" | "indeterminate"`, and evaluated as a **GATE BEFORE any TTL/staleness branch** at **every** reclaim-authorization site (three exist, β-grep-verified complete: mutation-lock acquire, `reclaimDeadGeneration` re-verify, lease reclaim):

- **dead** — proven ONLY by ESRCH on a positive safe-integer pid → reclaim authorized.
- **live** + **stale past TTL** — reclaim authorized (the INTENTIONAL hung-conductor recovery), **fencing-token-protected** — the fencing invariant on live-recovery is load-bearing (a hung conductor can un-hang) and stays explicitly teethed.
- **indeterminate** — invalid/non-positive/fractional pid, any non-ESRCH liveness error → **NEVER reclaims on any path**; surfaces as the new `lease-indeterminate` reason (manual-recovery class, like `lease-active`).

`pidProvenDead` survives as a thin `pidLiveness(pid)==="dead"` wrapper so the existing invalid-pid regression teeth don't orphan. `pidAlive` is removed (β-verified zero remaining users).

## Context

Three occurrences of the same unsafe-reclaim class, each one site over from the previous fix: R3 (mutation-lock mtime-reclaim of unidentifiable locks) → R4 (invalid finite pids treated as identifiable; non-ESRCH errors as dead) → R5 (the lease stale-TTL path computing staleness **independently** of proven death, so an indeterminate-pid stale lease still reclaimed). The R5 re-gauntlet's backend lane invoked the pre-committed cap on the third occurrence; both binding reviewers independently prescribed the three-state model. The per-site patch shape is the root failure — each round closed the named instance and the class re-emerged at a sibling site.

## Options considered

1. **Per-site patching (continue R6):** forbidden by the β hard stop — three failures proved the shape wrong.
2. **Three-state userland model (CHOSEN):** one primitive + uniform gate-before-TTL policy + completeness proof.
3. **OS-primitive lease (flock-class):** REJECTED for now, DOCUMENTED as the named next-session escalation if the fresh hard stop fires. Decisive: an OS lock does not release from a live-but-hung process, so it cannot subsume the TTL recovery — a second mechanism would still be needed (more surface, not less). Also fails use-what-we-have at pre-mvp (native module/new dep), and the userland nonce-election already proved out. **Assumption-to-validate, not enshrined:** if the 3-state model leaks either core vector in its fresh gauntlet, the unconditional park fires and OS-lease becomes the fresh-eyes redesign candidate.

## The completeness bar (why this is not R6)

Model-level closes the class only if **every** site routes through the one primitive and the old ad-hoc paths are ripped out — proven by grep, not spot-check. This ADR's scope is axis (a) of the session's three-axis completeness bar (a: reclaim sites → `pidLiveness`; b: commit-identity fields → the ADR-0030 validator; c: served-model/alive-clean readers → the provenance-verifier choke-point, Lane-2-owned/SP-20260719-001).

## Enforcers (named — β's binding exit-greps, mechanical not judgment)

- `process.kill` count == 1 repo-wide (inside `pidLiveness` only) · `pidAlive` count == 0.
- Staleness computed at exactly 1 site, INSIDE the `liveness === "live"` branch (grep-zero independent staleness/liveness computations).
- Falsifiers: the two-reclaimer deterministic ABA test; the invalid-pid set (0 / negative / fractional / out-of-range / non-ESRCH error) exercised through a REAL `.lease` via `reclaim()` (the R5 mask was mutation-lock-only coverage), all asserting contended/no-reclaim.
- The fresh 3-lane gauntlet + β's independent three-axis grep at release.
- **Fresh unconditional hard stop:** if the model leaks either core vector in its gauntlet → park to next session, no same-session model iteration.

## Reversal plan

Superseding ADR required; the named successor candidate is the OS-primitive lease (above), triggered only by the hard-stop falsifier. Loosening indeterminate-never-reclaims is not a tuning knob — it is the defect.

## References

- Design-lock spec: `.claude/project/sprint/sprints/SP-20260718-005/ED-237-238-design-lock.md` (commit `1beabf0a`) — carries the full site inventory + policy table.
- R5 evidence: session scratchpad `be-r5.out` (C1-R5-PID-NOT-PROVEN-DEAD-LEASE) · park commits `d6aac3fd`/`416244d5` · ED-237.
- Sibling: ADR-0030 (typed AcceptanceRecord schema, axis b).
