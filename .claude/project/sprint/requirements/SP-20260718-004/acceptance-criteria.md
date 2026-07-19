# SP-20260718-004 — Acceptance Criteria (Phase 2: Identity + host portability)

Keystone = R1 (derived-binding runtime). The guarantee is STRUCTURAL (derived-not-settable → ambient authority text inert-by-construction); the scan is honest-scoped defense-in-depth — do NOT invert that (β spine, R6 completeness ceiling).

| Req | Gate / ED | Statement | verified_by |
|---|---|---|---|
| **R1** | G2.1 / ED-216 / CORE-1+3 | Derived role-binding runtime: `role-binding.json` wired into dispatch + bootstrap; role DERIVED from channel+contract; **no settable role field exists**. | live (not seed) binding-precedence + no-root-alpha-poison + worker-helm-category-error fixtures; **BLOCKING FIXTURE (i)**; cold(unbound→FAIL_CLOSED) AND warm(bound-helm) paths both asserted |
| **R2** | ED-220 | Binding VALUE validation (not just presence). | unknown/malformed/out-of-registry role value → BLOCK fixture |
| **R3** | G2.2 | Canonical neutral source + per-provider projections + deterministic regen/drift. | `git diff --exit-code` clean AND semantic-fidelity fixture (canonical rule X appears in projection Y) |
| **R4** | G2.3 | Authority-pollution STANDING scan over the EFFECTIVE graph. | exits non-zero, wired scan:full/CI, self-detects re-introduction; **BLOCKING FIXTURE (ii)** |
| **R5** | G2.4 | President-leak closed in worktree instruction sets; reviewer stops slurping the 14KB router. | scan-asserted no-leak + scoped reviewer-context fixture |
| **R6** | G2.6 | Operator-voice projected helm-only. | scan-asserted operator-audience helm-only only |
| **R7** | G2.5 | Per-provider cwd/sandbox tests BEFORE any cwd change. | tests green pre-merge; cwd-change-without-tests → blocked |
| **R8** | ED-231 residuals | Whole-ledger sig extended to `gauntlet-verify` liveness readers + (B)-lite artifact-binding + sign-the-verdict. | forged UNSIGNED `ok:true` → rejected; same-user FAIL→PASS flip invalidates sig. **MISTAKE-CLASS priority, not defense-in-depth** |
| **R9** | ED-221 | Gitignored-ledger durability resolution ADR. | ADR committed + `/scan:references` clean; `OPEN_ADR:true` (α ratifies resolution direction) |

## The two REQUIRED-PRESENT blocking fixtures (design INCOMPLETE without either — β doctrine)
- **(i) derived-not-settable NEGATIVE** (on R1): a worker that SETS `role:"President"`/authority in its OWN context/record/handoff → STILL resolves UNBOUND (dispatched) or alex-alpha-only-via-helm (top-level). The settable field is never read as authority.
- **(ii) default-binding PLANT** (on R4): rule-#5-STYLE text ("default top-level human-facing role = alpha") planted in a NEUTRAL file → proven CAUGHT. NOT the bare "you are Alpha" identity string — the default-binding leak class is the one that matters.

## Ship gate
Both REQUIRED-PRESENT fixtures green + standing enforcer wired non-zero into scan:full/CI + 2-family cross-provider gauntlet PASS (GPT + Claude binding floor; agy optional/DOWN, never gates) + no binding reviewer FAIL. A binding FAIL is not overridable.

## Cold-vs-warm (kernel altitude, must-follow)
The kernel's "new user" = a fresh host / unbound worker. Cold-start IS fixture (i) (unbound → fail-closed); warm-start = a bound top-level-helm session restoring. R1 asserts BOTH paths.
