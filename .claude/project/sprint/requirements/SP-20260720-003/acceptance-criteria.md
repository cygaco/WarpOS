# Acceptance Criteria — SP-20260720-003 (DoE-validated design, conf 0.85)

Architecture below is the director-of-engineering design consult's ruling (evidence:
runtime/sp20260720-003/consults/doe-design.md; completion record ok:true 6192B). Every AC names a
verified_by (the enforcer's own test/fixture) per G0.1 (name-the-enforcer).

## Architecture (locked)

### D1 — scripts/checks/meta-lockstep.js
- Extract `CROSS_PROVIDER_SCOPE = Object.freeze(["openai","antigravity"])` as a LEAF export in
  role-parity-scan.js; refactor its L538 shape-route filter to read the constant. meta-lockstep IMPORTS
  the same symbol — ONE source, two consumers (never regex the literal; a `.includes()` refactor would
  break a parser to a clean-zero false-negative).
- Invariant: SYMMETRY of CROSS-PROVIDER-ROUTING rules (rules whose derived class carries
  `subprocess-cross-provider`) across the in-scope providers — for a (tier/kind) that any in-scope
  provider routes cross-provider, every other in-scope provider with a LIVE registry role of that
  (tier/kind) must route it cross-provider too. REUSE role-parity-scan's `deriveClass` (L519) +
  `allowedShapes.includes("subprocess-cross-provider")` (L544) — do NOT reimplement.
- EXCUSED when no live registry role of that (tier/kind, provider) exists.
- WAIVED (explicit, documented) for deliberate deferrals: `{tier:director, provider:antigravity}`
  (ADR-0031 β-deferral; HARD CONSTRAINT 1 — do NOT re-add the rule; the waiver documents the deferral;
  role-parity is the live-role backstop).

### D2 — scripts/checks/security-binding-lane.js (two teeth)
- Tooth-A (ED-244), enforced WHILE ED-230 open — assert the PANEL BINDING invariant (NOT
  DEFAULT_PROVIDER ∈ {openai,claude} — that fights ADR-0031 point-3 + trips model-chain drift + misses
  the multi-pass path). Reuse the runtime's own functions:
  - P1: `provenance-verifier.servedModelUnverifiableFromRecord("antigravity") === true` (the choke-point
    forcing an agy record un-attestable; dispatch-review.js L369).
  - P2: the `panel-2family` floor profile requires ≥2 families, all verifiable (GPT+Claude), agy NOT a
    required floor lane (dispatch-review.js ~L415, `agyOperatorOwned:true`).
  - P3: `passesOf("security-reviewer")` contains ≥1 pass with provider ∈ {openai, claude}.
  - KNOWN LIMIT (document in .md): the raw SINGLE-PASS path (dispatch-agent security-reviewer →
    getProviderForRole=antigravity) is a latent hole not statically forbidden here; no SANCTIONED
    single-pass BINDING caller exists (audit: only test files reference it; the live gauntlet routes
    through dispatch-review.js's panel gate). Closes fully with ED-230.
- Tooth-B (RI-008) — DEFAULT_PROVIDER consistency INCLUDING alias keys (redteam):
  - (1) `catalog-raw[alias] === providers-raw[alias]` (raw-map agreement — the drift model-chain block-G
    misses, iterating registry NAMES only).
  - (2) `getProviderForRole(alias) === getProviderForRole(canonical)` (normalization intact).
  - The redteam raw key is a SHADOWED DEAD LITERAL (resolver normalizes first) — document the split as
    intentional (verifiable openai floor literal + live antigravity lab), enforce the invariants.
- ED-230 gate: read LAST-WRITE-WINS for id=ED-230 from paths.enforcementDebt (canonical; the ledger is
  gitignored/absent in the worktree). FAIL-CLOSED: unreadable/missing/malformed → assume OPEN → enforce
  strict. Relax ONLY on explicit parseable `status:"closed"` PLUS a non-empty closure receipt
  (closure_receipt/closed_ts). Relaxing does NOT authorize agy binding (panel gate + ED-060 govern).

### D3 — ED-244/RI-008 reconciliation = assert-only (NO source mutation)
Confirmed by DoE: mutating catalog/providers→openai trips model-chain drift + doesn't touch the
multi-pass path; registry-as-SoT rejects the point-2 literal mechanism. Close both by shipping the
enforcer + documenting. dispatch-contract.json untouched. Optional future diff (redteam from
SCRAPPED_PROVIDER_ALIASES, registry-roles.js L173/L181) flagged, gated on a consumer audit — NOT this
sprint, route through α if ever taken.

## Record-trust gate (design-phase, applied)
- Choke-point: the ED-230 gate reader in security-binding-lane.js (the one place a record gates the
  enforcer's strictness).
- Structural guard: FAIL-CLOSED + require a closure receipt (a settable `status:"closed"` alone can NOT
  relax). Same-vs-cross-session partition: N/A (local ledger status read, not a dispatch/lease record).
- Required-present adversarial falsifier MATRIX (AC-7a..7e): receipt-less/malformed-closed,
  last-write-ordering stale-closed, wrong-id contamination, empty/null receipt, and absent-record/empty-file
  — EACH must leave the scan enforcing strict. This 5-vector matrix (not a single fixture) is the
  load-bearing teeth of the gate (QL: AC-7 originally covered 1 of ~5 fail-open vectors).

## Acceptance Criteria

- AC-1 (D1 teeth): meta-lockstep FLAGS a pre-9db78fa3 asymmetry fixture (antigravity missing a
  `{tier:lead}` cross-provider rule WHILE a live antigravity lead role exists) → RED, AND the RED is
  attributed to the SYMMETRY reason (assert the reason-string), NOT role-parity-scan's own L545
  shape-route-conflict which co-fires on the same input. ADD a de-aliasing case: a fixture where
  role-parity-scan is GREEN yet meta-lockstep symmetry is still violated (proves the symmetry logic has
  independent teeth). verified_by: meta-lockstep.test.js#asymmetry-reason + #symmetry-violated-role-parity-green (required-present).
- AC-2 (D1 waiver): meta-lockstep does NOT flag `{tier:director, provider:antigravity}` (no live role →
  excused; also on the waiver list). verified_by: meta-lockstep.test.js#director-excused-and-waived.
- AC-3 (D1 green): meta-lockstep GREEN on the real HEAD registry + dispatch-contract.
  verified_by: meta-lockstep.test.js#current-head-green.
- AC-4 (D1 scope-source + DRIFT falsifier): role-parity-scan exports CROSS_PROVIDER_SCOPE and its L538
  filter READS it (not a re-inlined literal); meta-lockstep imports the SAME symbol; role-parity-scan
  stays GREEN after the refactor. TEETH (the false-green class DoE+QL flagged): a fixture that perturbs
  the shared constant and asserts the L538 filter's behavior CHANGES accordingly — a re-hardcoded literal
  at L538 makes this test FAIL. verified_by: meta-lockstep.test.js#scope-constant-is-read (perturb →
  behavior changes) + role-parity.test.js unchanged-green.
- AC-5 (D2-A teeth): security-binding-lane RED when injected state fails P1, P2, or P3 — one negative
  each. P1 negative MUST STUB `pv.servedModelUnverifiableFromRecord → false` and assert RED (proves the
  scan CALLS the shared choke-point; the fn is hardcoded `provider==="antigravity"` and reads no record,
  so injecting a "record" exercises nothing). P3 negative MUST zero ALL passes (primary+second+third),
  not just primary. P2 negative: floor profile with <2 verifiable families.
  verified_by: security-binding-lane.test.js#{p1-choke-point-stub,p2-underfloor,p3-no-verifiable-pass}-negative.
- AC-6 (D2-A green): GREEN on the real HEAD (passesOf + servedModelUnverifiable + panel-2family manifest).
  verified_by: security-binding-lane.test.js#current-head-green.
- AC-7 (D2-A record-trust falsifier MATRIX — the load-bearing addition; each vector → scan STILL strict):
  - 7a receipt-less / malformed "closed" ED-230 record → strict.
  - 7b LAST-WRITE ordering: JSONL [closed+receipt, …, {status:"open"|"reopened"}] → the reader takes the
    LAST ED-230 record (open) → strict (a first-match reader would fail-OPEN — the real vector).
  - 7c wrong-id contamination: {id:"ED-231",status:"closed",receipt} present → does NOT relax ED-230 → strict.
  - 7d empty/null receipt: closure_receipt:"" and :null → strict (distinct from absent).
  - 7e absent: no ED-230 record in a non-empty file, AND a missing/empty ledger file → assume OPEN → strict.
  verified_by: security-binding-lane.test.js#ed230-{7a..7e} (all required-present).
- AC-8 (D2-A relax): a valid `status:"closed"` + closure receipt → Tooth-A relaxes (non-gating).
  verified_by: security-binding-lane.test.js#ed230-closed-with-receipt-relaxes.
- AC-9 (D2-B alias raw): catches a disagreement between TWO INDEPENDENT injected raw maps
  (catalog-raw[redteam] ≠ providers-raw[redteam]) → RED; GREEN when consistent. The test MUST inject two
  separate map objects, NOT read the shared SCRAPPED_PROVIDER_ALIASES object (that would be a runtime
  tautology with no teeth). verified_by: security-binding-lane.test.js#alias-raw-two-maps.
- AC-10 (D2-B normalization): with the resolver/registry STUBBED so alias and canonical actually diverge,
  catches getProviderForRole(alias) ≠ getProviderForRole(canonical) → RED. verified_by:
  security-binding-lane.test.js#alias-normalization-stubbed-divergence.
- AC-11 (registration): both scans registered in .claude/commands/scan/full.md (own rows) + pass
  scripts/checks/scan-coverage.js self-inventory. verified_by: scan-coverage run GREEN.
- AC-12 (name-the-enforcer): ED-244 + RI-008 ledger entries updated at close to reference their new
  enforcer (security-binding-lane); meta-lockstep logged as the D1 enforcer. verified_by: ledger diff.
- AC-13 (P1 known-limit, documented not fixed): P1 is name-specific (`servedModelUnverifiableFromRecord`
  keys on `provider==="antigravity"`), so a NEW unverifiable provider or an agy rename would pass P1
  GREEN while the invariant ("no unverifiable provider binds") is violated. Out-of-scope to fix; NAME it
  as a documented known-limit in the .md + a regression-lock code comment at the P1 call site.
  verified_by: .md known-limits section present + comment at the call site.
- AC-14 (single-pass creep-back guard): a fixture/assertion that FAILS if any NON-TEST caller routes
  security-reviewer as a single-pass binding path (dispatch-agent security-reviewer bypassing
  dispatch-review's panel gate) — closes the "audit-has-no-enforcer" rot QL flagged.
  verified_by: security-binding-lane.test.js#no-nontest-single-pass-binding-caller.

## Placement (scan:full) — QL ruling
- meta-lockstep (D1): start REPORT-ONLY; flip to BLOCKING after one clean scan:full cycle (DoE: the
  symmetry algorithm can over-fire; novel + false-positive risk). Log the flip criterion (one green cycle)
  as an enforcement-debt entry so it does not live report-only forever.
- security-binding-lane (D2): BLOCKING (P1∧P2∧P3 + D2-B are deterministic + GREEN at HEAD; report-only on
  a live security invariant is false safety).
- FAIL-MODE distinction (must be explicit in code): the ED-230 fail-closed path resolves to
  STRICT-ENFORCE (exit 1 / findings), NEVER a suite-crashing exit 2, on the absent/unreadable CANONICAL
  ledger. Exit 2 is reserved for a genuinely UNPARSEABLE INJECTED test input. Otherwise every clean run in
  a ledger-absent env (e.g. a worktree) fails-closed-to-noise.

## Constraints
- Bite-tests INJECT reg/contract/ledger/manifest stubs (deterministic; the real ledger is absent in the
  worktree). Enforcers resolve paths.enforcementDebt to canonical + fail-closed at runtime.
- Source edits this sprint: role-parity-scan.js (mine, CROSS_PROVIDER_SCOPE extract), scan/full.md +
  scan-coverage.js (add-only-own-rows). NO catalog/providers/model-chain/dispatch-contract edits.
- Exit codes: 0 clean · 1 findings · 2 fail-closed (unreadable/unparseable input). Report-only vs
  blocking placement in scan:full = quality-lead/β call.
- β design→build (front-loaded) before build; I hand merge to α.
