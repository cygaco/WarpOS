# Product-lead design-phase consult — SP-20260720-003 (in-process, read-only, conf 0.85)

Role: product-lead. Step: design. via: epsilon-agent (Epsilon2). VERDICT: RATIFIED-WITH-ADDITIONS (2).
Additions live in the maintainer-first-experience / aspirational-vs-enforced class DoE+QL don't own.

## Q1 — scope coherence: COHERENT, right-sized for one sprint
Effectively 2 build artifacts (D3 folds into D2 assert-only). Same-layer, reuse existing seams
(deriveClass, panel gate, provenance-verifier), largely independent/parallelizable, medium-risk, no UI.
Nothing splits/defers; the mutating temptations (redteam from SCRAPPED_PROVIDER_ALIASES, dispatch-contract.json)
are already deferred/α-gated. No re-scope.

## Q2 — acceptance completeness: 2 maintainer-consumer gaps
- Discoverability GREEN (AC-11 registration + AC-12 ED→enforcer back-ref).
- GAP 1: the report-only→blocking flip criterion is described but NOT enforced (no verified_by for the
  ED logging) — the hollow-ladder/aspirational-vs-enforced class → AC-17.
- GAP 2: no AC asserts the failure message names the FIX (every AC verifies correct+teeth; none verifies
  a first-time maintainer can ACT on the RED) → AC-16.

## Q3 — sequencing/priority: correct
security-binding-lane BLOCKING now, meta-lockstep report-only→blocking: right (novel symmetry algorithm
over-fires → blocking a noisy new check trains --no-verify; report-only-first de-risks; the security
invariant is deterministic+green → report-only would be false safety). SHARP NUANCE: ED-244 is NOT a live
break (held by agy blocked-advisory) — it is P0-WHEN-agy-unblocks → the cold-start argument for shipping
it BLOCKING now (the enforcer must gate BEFORE the guarded condition, ED-230/ED-060, goes live). Land D2
first / protect it if the sprint truncates. The one regression surface = AC-4's shared-file refactor of
role-parity-scan (a live gauntlet gate) — already fenced by "role-parity stays GREEN after refactor."

## Q4 — product-lens gap eng+quality miss: maintainer LEGIBILITY (FTUE at execution altitude)
A maintainer's first encounter with a new RED (cold-start, zero context) IS the FTUE of this tooling; a
correct enforcer with a cryptic message loses that user to --no-verify. (The ledger-absent-worktree noise
path is already covered by QL's exit-2-vs-exit-1 + AC-7e.) Additions:

- AC-16 (failure-message legibility): each scan's RED finding self-orients — names (a) the invariant in
  plain language, (b) the offending (tier/kind/provider)/alias key, (c) a remediation pointer. Reuse the
  AC-1 reason-string seam (extend to require a remediation token), don't add a parallel mechanism.
- AC-17 (flip-criterion tracked not aspirational): at close, meta-lockstep's report-only→blocking flip
  criterion is logged as an enforcement-debt entry (named owner + explicit trigger), visible at
  /enforcement:list + /scan:full. Pairs with AC-12 (name-the-enforcer applied to the placement decision).

## Bottom line
With AC-16 + AC-17 folded in, READY to build from the product-execution lens. WOULD CHANGE MIND if a
consumer audit surfaces a SANCTIONED single-pass security-reviewer binding path (DoE's own would-change-mind,
tracked by AC-14) — reclassifies tooth-A from document-the-limit to must-statically-forbid. Within-sprint
execution call; no Director escalation.
