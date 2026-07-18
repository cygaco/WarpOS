# ADR 0022 — The binding claude hunter is a REAL registered producer (`security_claude_hunter`)

**Date:** 2026-07-18
**Status:** accepted
**Class:** B (architectural + security impact)
**Sprint:** SP-20260718-003 (Phase 1 — routing + security truth) · post-PARK design ruling (the round-7 PARK's owed fresh-session design review)
**Amends:** ADR-0020 (two-tier claude lane contract — the hunter tier's PRODUCTION MODEL is now defined) · **Relies on:** ADR-0014 (conductor spawn-hand), ADR-0021 (Agent-tool channel is Claude-only)
**Answers:** ED-227's six design questions (ED-227 itself stays OPEN until the scoped build lands — see Consequences)
**β consult:** DECIDE B/0.89, 2026-07-18 (logged `paths.betaEvents`); α-ruled same day.

---

## Decision

**Option A: `security_claude_hunter` becomes a REAL role with a sanctioned writer-stamped production
path.** The two-tier claude contract (ADR-0020 §two-tier) stands; the binding panel-3lab claude lane
is produced, recorded, and verified as a first-class identity — not collapsed into the subprocess
floor lane. Five teeth are NORMATIVE (β's ruling; load-bearing, not polish) — they belong in the
registered route and its fixtures, not in doctrine prose:

1. **Writer-stamped, non-settable identity.** `security_claude_hunter` role+shape are writer-stamped
   by `record-inprocess` at production time. NEGATIVE fixture required as the falsifiability proof: a
   hunter record NOT stamped through `record-inprocess`, or one asserting the identity via any
   settable field → `provenance-verifier` BLOCKS. **No synthetic-record acceptance path.** (The
   settable-label-identity anti-pattern close — ED-225 root invariant applied to the hunter tier.)
2. **Single choke-point, delegation-COMPLETE.** The SR-020 close (`panel-lanes.js#
   isSanctionedInProcessLane` → `provenance-verifier`) extends the guard's CONSUMERS list; EVERY
   consumer of lane-identity routes through the ONE `provenance-verifier` — the guard must be
   delegation-complete, never enumerate-the-known-callers. The R6-BE-002 regex→AST guard upgrade
   rides this build.
3. **Producer-binding named IN THE ROUTE, fail-closed.** The registered route names who holds the
   Agent-tool hand at panel time: **the panel-run CONDUCTOR** — the top-level orchestrator (α-as-ε)
   OR a teammate-ε via SYNCHRONOUS in-process spawn, per **ADR-0014** (accepted 2026-06-19; the
   consult's "relaxation not landed" premise was STALE — ADR-0014 is on main and ε live-verified the
   Agent route in its 2026-07-18 startup self-check, noting bg-spawn hard-errors for a teammate-ε, so
   the route mandates `run_in_background:false` there). Fail-closed by construction: no conductor
   hand → no hunter record → the binding lane resolves **BLOCKS-INCONCLUSIVE** — never
   relabeled-floor, never synthetic.
4. **Observed diversity, not label.** The hunter counts toward 3-lab assurance IFF its record's
   ATTESTED provider+shape match the contract (in-process, opus@max-tier per the registry,
   role=`security_claude_hunter`, same-run, `fallback:false`). The family count derives from the
   observed record, never the manifest label (ADR-0020 diversity rule applied to the hunter tier).
5. **Registration is a hypothesis, not proof (P-055).** Role-registry presence proves nothing.
   Binding-green additionally requires ONE real same-run positive hunter record (`fallback:false`)
   plus teeth-1/teeth-3 negative fixtures observed landing BLOCKED. The producer path gets real
   burn-in only at 3lab activation (which is separately gated on agy — ED-060); no back-dated green
   from the registration commit.

**SR-019 close under this model:** `dispatch-review.js#applyPanelGate` binds the binding claude
lane's verdict to the same-run HUNTER record's verdict (through the choke-point), never the floor
subprocess pass's `l.verdict`; a missing/malformed hunter verdict BLOCKS.

## Rejected: Option B (collapse the two-tier contract)

panel-3lab claude = the subprocess floor lane, third-lab diversity from agy alone. Rejected on four
independent axes (β, position-stable): reverses a ratified ADR (do-not-reopen); descopes the
high-assurance in-process hunter tier during a declared hardening phase (P-064 forbids the shape);
reduces observed security diversity while leaning the third lab on a DOWN agy; discards the
rounds-6/7 writer-stamped-identity investment. Simplicity was B's only pull and does not beat a
mandatory-pass security criterion.

## Context

SP-20260718-003 parked at round 7 because the binding hunter was a PHANTOM: the attestor demanded an
in-process `security_claude_hunter` record, but no sanctioned writer could produce one —
absent from `role-registry.json`, refused by `record-inprocess` (SR-021/QA-018; ED-227). The
positive attestation test used a synthetic record: it proved the verifier would ACCEPT a
hypothetical hunter, not that the system can PRODUCE one. This ADR defines the production model so
the attestor verifies a real producer.

## Consequences

- **A scoped follow-up build (after the floor lands)** delivers: the role-registry entry + in-process
  route (conductor-bound per teeth-3), the `record-inprocess` writer-stamp path, the SR-019
  verdict-binding, the SR-020 consumer-routing + guard extension, the R6-BE-002 AST upgrade, and the
  teeth fixtures. ED-227 closes when that build lands with its fixtures green.
- Until then panel-3lab remains BLOCKED under the two-blocker fail-closed state (no producer + agy
  calibration) — never GREEN; the ADR-0020 reversion linkage re-binds 3lab to the hunter BY
  CONSTRUCTION once agy goes live, which is why this ruling precedes any agy calibration work.
- **Future-reader guard:** "simplifying" back to Option B silently reintroduces the phantom-identity
  class this sprint spent 7 gauntlet rounds closing. Don't.

## Enforcer

`scripts/dispatch/provenance-verifier.js` (the single choke-point) + `scripts/checks/
provenance-invariants.js` (delegation-complete guard; CONSUMERS extended by the build) + the
`record-inprocess` refusal path (unregistered/unstamped → no record) + the teeth-1/3/5 fixtures
(build deliverables). Until the build lands, enforcement is the existing fail-closed state itself:
panel-3lab cannot attest (SR-021 refusal), so the undesigned path cannot false-green. Debt tracked:
ED-227 (open until the build).
