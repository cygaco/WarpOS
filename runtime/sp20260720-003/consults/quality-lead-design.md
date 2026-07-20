# Quality-lead design-phase consult — SP-20260720-003 (in-process, read-only, conf 0.82)

Role: quality-lead. Step: design. via: epsilon-agent (Epsilon2). Product-priority frame: these gate a
SECURITY binding verdict; a false-green silently lets an un-attestable provider (agy) carry a binding
verdict = P0/Vulnerable-cohort failure. Teeth-gaps on D2/ED-230 outrank D1 cosmetics.

## VERDICT: NOT yet adversarial enough to build against — 3 required additions + 2 strengtheners.

### Q1 — fixture adversariality (3 soft spots)
- AC-1 (D1 asymmetry): SOFT — RED-attribution ambiguity. A {tier:lead,provider:antigravity} live role
  with a non-cross-provider class ALSO trips role-parity-scan's OWN shape-route-conflict (L545) → the
  fixture goes RED for the wrong reason, not proving meta-lockstep's symmetry logic. STRENGTHEN: assert
  on the symmetry REASON-string + add a case where role-parity is GREEN yet symmetry is still violated.
- AC-5/p1 (P1): must MOCK, not inject a record. servedModelUnverifiableFromRecord is hardcoded
  `provider === "antigravity"` (provenance-verifier L116) — reads the provider string, not a record.
  The negative MUST stub pv.servedModelUnverifiableFromRecord → false + assert RED (proves the scan
  CALLS the shared choke-point).
- AC-5/p3, p2, AC-7, AC-9, AC-10: adversarial PROVIDED p3 zeros ALL passes (not just primary), AC-9
  injects TWO independent raw maps (not the shared SCRAPPED_PROVIDER_ALIASES object — else a tautology),
  AC-10 stubs resolver/registry so alias and canonical actually diverge.

### Q2 — coverage completeness (1 predicate NO teeth + 1 branch untested)
- NO falsifier: D1 SCOPE-DRIFT (the false-green class). Nothing proves L538 READS CROSS_PROVIDER_SCOPE
  vs a re-inlined literal. AC-4 only asserts the import exists (green). ADD a negative: perturb the
  shared constant + assert L538 behavior changes (a re-hardcoded literal fails the test).
- Untested branch: ED-230 ABSENT/empty → strict (the MOST LIKELY live path — ledger gitignored/absent
  in worktree). AC-7 covers receiptless/malformed-closed only. ADD.

### Q3 — ED-230 record-trust (guard right, falsifier 1-of-5). Add a falsifier MATRIX (load-bearing):
- last-write ordering: JSONL [closed+receipt, …, reopened/open] → first-match takes stale closed →
  fail-OPEN; must read LAST-write-wins → strict.
- wrong-id contamination: {id:ED-231,status:closed,receipt} must NOT relax ED-230.
- empty/null receipt: closure_receipt:"" and :null → strict (distinct from absent).
- no-ED-230-record-in-a-non-empty-file → assume OPEN → strict.

### Q4 — weak spots (green while invariant violated)
- D1 scope-drift (Q2) — headline.
- P1 name-specific not property-based (=== "antigravity"): a 2nd unverifiable provider / agy rename →
  P1 GREEN while invariant violated. Out-of-scope to FIX; NAME it as documented known-limit +
  regression-lock comment.
- single-pass known-limit rots silently: the "only test files reference dispatch-agent security-reviewer"
  audit has no enforcer. Cheap guard: a grep-fixture that FAILS if any NON-TEST caller routes
  security-reviewer as a single-pass binding path.

### Q5 — report-only vs blocking
- meta-lockstep (D1): start REPORT-ONLY, flip to blocking after one clean cycle (DoE: symmetry
  "over-fires"; novel algorithm + false-positive risk). Log the flip criterion as enforcement debt.
- security-binding-lane (D2): BLOCKING for P1∧P2∧P3 + D2-B (deterministic, green at HEAD). CAVEAT: the
  ED-230 gate must fail-closed to STRICT-ENFORCE (findings/exit-1), NOT a suite-crashing exit-2, on the
  absent-canonical-ledger path; reserve exit-2 for genuinely unparseable INJECTED test input. Make the
  distinction explicit or every clean run in a ledger-absent env fails-closed-to-noise.
