# DoE design consult — SP-20260720-003 (in-process, read-only, confidence 0.85)

Role: director-of-engineering. Step: design. via: epsilon-agent (Epsilon2).

## Q1 — meta-lockstep mechanism
- REJECT coupled-checksum (rots to "bump the hash to green"; can't say what drifted).
- Symmetry+waiver directionally right BUT must be ROLE-GROUNDED, not whole-rule-table (pure table
  symmetry over-fires: openai legitimately has a {tier:face} rule antigravity never needs → waiver bloat).
- Assert symmetry of CROSS-PROVIDER-ROUTING rules only (rules whose derived class carries
  subprocess-cross-provider), EXCUSED when no real registry role of that (tier/kind, provider) exists;
  WAIVER reserved for deliberate deferrals ({tier:director, provider:antigravity}).
- REUSE role-parity-scan.js's deriveClass (L519) + allowedShapes.includes("subprocess-cross-provider")
  (L544) — do NOT reimplement the derivation (that fork is the next drift).
- Scope source: do NOT parse the L538 literal (regex over it = #1 silent false-negative; a refactor to
  .includes() breaks the parser to a clean zero). EXTRACT a shared frozen export
  CROSS_PROVIDER_SCOPE = ["openai","antigravity"] in role-parity-scan.js; L538 reads it, meta-lockstep
  imports the same symbol. One source, both consumers. Keep it a leaf export (no import cycle).
- Do NOT derive scope from dispatch-contract.json (tautological / derived-vs-derived trap).

## Q2 — binding-pass semantics (the critical refinement)
- "The binding pass" is NOT passesOf's primary. For security-reviewer, binding = merged.ok after
  applyPanelGate (dispatch-review.js L250-262); operative floor = panel-2family (GPT+Claude) L410-419;
  the antigravity lane is STRUCTURALLY un-attestable via provenance-verifier
  servedModelUnverifiableFromRecord("antigravity") L369-379. An antigravity pass cannot produce a
  binding PASS today by construction — two layers deep.
- Assert (c) BOTH, but REDEFINE (a): do NOT assert DEFAULT_PROVIDER ∈ {openai,claude}. That alone is
  wrong 3 ways: (i) fights ADR-0031 point-3 (registry keeps security-reviewer.provider=antigravity as
  the ratified google-lab); (ii) mutating map→openai trips model-chain block-G [DRIFT] catalog≠registry
  L170; (iii) doesn't fix the multi-pass path (passesOf reads registry, not the map).
- NON-SPOOFABLE predicate set (reuse runtime's own functions), while ED-230 open:
  - P3: passesOf("security-reviewer") contains >=1 pass with provider ∈ {openai,claude} (verifiable lane
    that CAN bind). GREEN today: second_pass=openai, third_pass=claude (role-registry L57).
  - P1: servedModelUnverifiableFromRecord("antigravity") === true (choke-point; regression-lock it).
  - P2: panel-2family floor requires families ⊆ verifiable and min_families >= 2 (never requires agy).
- "antigravity pass treated as binding" = an agy lane can flip floor_pass/merged.ok; P1∧P2 static
  guarantee it can't, P3 that a verifiable lane exists to carry the verdict.
- RESIDUAL to NAME (don't try to statically forbid): the SINGLE-PASS path
  (dispatch-agent security-reviewer → getProviderForRole=antigravity → agy) is the genuine latent hole,
  today caught only by blocked-advisory + cross-family-fallback; closes with ED-230 (which this enforcer
  gates on → auto-covers). Flag it in the .md as a known limit.

## Q3 — ED-230 gate
- YES: status on the LATEST ED-230 record in enforcement-debt.jsonl (paths.enforcementDebt) is the
  canonical machine-readable gate. Hardening: (1) append-only JSONL → read LAST-write-wins for id=ED-230,
  not first match; (2) FAIL-CLOSED — unreadable/missing/malformed → assume OPEN → keep enforcing strict
  (a malformed input that relaxes a security check is the textbook false-green).
- Relax ONLY on explicit parseable status:"closed" PLUS a non-empty closure_receipt/closed_ts (bare status
  flip w/o receipt must not relax). Note in .md: relaxing this enforcer does NOT authorize agy binding
  (panel gate P1/P2 + ED-060 still govern).

## Q4 — source-vs-enforcer
- CONFIRMED: assert-the-invariant CLOSES ED-244 + RI-008; NO source mutation required.
- Any mutation of catalog/providers security-reviewer default→openai trips model-chain block-G AND
  doesn't touch the multi-pass path. Registry-as-SoT actively REJECTS the point-2 literal mechanism —
  encode point-2's INTENT (binding-on-verifiable) via the Q2 panel invariant.
- RI-008 "split" is SEMANTIC not behavioral: catalog-raw["redteam"]=openai and providers-raw["redteam"]
  =openai AGREE (both from SCRAPPED_PROVIDER_ALIASES). The "disagreement" is raw-map-read (openai) vs
  getProviderForRole("redteam") which normalizes redteam→security-reviewer→antigravity. The raw redteam
  key is a SHADOWED DEAD LITERAL (resolver never reads it). Tooth-B asserts 2 invariants GREEN today:
  (1) catalog-raw[alias] === providers-raw[alias] (future raw-map drift; the gap model-chain block-G
  misses — it iterates registry NAMES only, L166); (2) getProviderForRole(alias) ===
  getProviderForRole(canonical) (normalization break). Close RI-008 by documenting the split intentional
  + shipping alias-key coverage.
- OPTIONAL future source diff (NOT this sprint, gated on consumer audit): remove redteam from
  SCRAPPED_PROVIDER_ALIASES registry-roles.js L173 (provider) + L181 (effort). dispatch-contract.json
  stays HOLD regardless.

## Overall
PRD sound to build with TWO required design changes: (1) D1 extract shared CROSS_PROVIDER_SCOPE + ground
symmetry in real roles (reuse deriveClass), not whole-table; (2) D2 Tooth-A assert the panel binding
invariant (P3 ∧ P1 ∧ P2), NOT DEFAULT_PROVIDER∈{openai,claude}. No source mutation to close ED-244/RI-008.
WOULD CHANGE MIND on Q2 if a consumer audit shows a sanctioned SINGLE-PASS security-reviewer binding
dispatch path (bypassing dispatch-review's panel gate) — route that back before build.

## Operational catch
enforcement-debt.jsonl + recurring-issues.jsonl are CANONICAL, ABSENT in the worktree
(.claude/project/memory/ is gitignored). The enforcer must resolve paths.enforcementDebt to canonical +
fail-closed; the .test.js must INJECT ledger stubs (deterministic), not read the real file.
