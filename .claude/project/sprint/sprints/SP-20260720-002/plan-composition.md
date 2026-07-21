# SP-20260720-002 — Phase 4: Trusted enforcement adapter (WarpOS 1.0 finale)

**Conductor:** Alex ε (teammate). **Base:** `main` HEAD `270b85dc` (⊇ work-order's named `825269c4`; the delta is one benign tracker date-correction commit). **Source of truth:** `_planning/warpos-1.0-plan/RATIFIED-PLAN.md` §Phase 4 + gates G4.1–G4.6 + sol dispositions 1–3; `evidence/hardening-20260717/hardened-gates-draft.md`. **Do-not-reopen:** the ratified plan itself is a settled decision — this sprint IMPLEMENTS Phase 4, it does not re-litigate sequencing/scope.

## Composition (registry-confirmed via `epsilon-runtime.js plan`)
- **unit_types:** `[backend, security]` · **max_risk:** `critical` · **domains:** `[]` (kernel-infra; NO UI, NO marketing/copy)
- **Why critical:** this is the SOLE route into `main`; a false-green here integrates unverified/malicious work. Same non-dispositionable class as Phase 1/2/3 security-truth.
- **Roster:** plan → director-of-product + product-lead · design → product-lead(block) + director-of-engineering + quality-lead · build → backend-builder + security-builder · gauntlet → backend-reviewer + qa-reviewer + security-reviewer · release → qa-reviewer · retro → ops-analyst. (No frontend/UI/visual/design-quality/copy lanes — composition-correct.)

## Architecture (RATIFIED-PLAN §Phase 4)
`untrusted provider/worktree → exact proposed tree + ResultEnvelope → PINNED trusted checker (outside the candidate tree) → integration of exactly that checked tree`. One trusted controller is the ONLY route into main.

## Scope-guard (β-binding, sol-A1): ARTIFACT-ACCEPTANCE + INTEGRATION authority ONLY
Credential isolation / OS sandboxing / adversarial-helm containment stay OUT (operator ruling 2026-07-17, DROPPED not deferred). The gate catches MISTAKES and overclaims (false-greens, "done" without evidence, sloppy merges) — quality control, not security theater. The honest promise is provider-independent artifact acceptance + integration; anything beyond is named out-of-scope.

## agy hard-constraint (operator directive 2026-07-20)
agy / ED-060(c) / ED-230 / panel-3lab = DEFERRED-TO-PLAN-END. Do NOT touch/probe/debug agy. NEVER treat an agy route/default as served-model proof. sol-A3 aggregate runner honors profile required/optional-lane semantics: `panel-2family` is the operative interim floor; an absent OPTIONAL lane (agy) ≠ block; an optional lane that RAN and FAILED binds. Phase 4 is exitable NOW on the 2-family floor; the agy leg rides at plan-end.

## Existing-vs-needed gap map (build-on, not rebuild)
| Deliverable | Status | Gap |
|---|---|---|
| sol-A2 AcceptanceRecord library (`scripts/dispatch/acceptance-record.js`) | DONE, 5+ gauntlet rounds hardened | No orchestrating trusted-verifier CALLER exists — that caller is the core new deliverable |
| sol-A1(d) verdict binding + (e) atomic CAS (`commitIntegration` `git update-ref` CAS) | DONE as primitives | Never invoked live; add `check_suite_version` field |
| sol-A1(c) content-addressed pinned checker bundle + out-of-tree runner | **0% — biggest gap** | New: bundle hasher + run-from-outside-candidate runner |
| sol-A1(b) sole integration principal (controller) | Not built | New: the trusted controller module (the only route into main) |
| sol-A3 aggregate helm runner | Not built | New; reuse `panel-lanes.js` required/optional semantics + `support-matrix.json` |
| Shared check library (hooks / pre-commit / controller) | hooks/ & checks/ are separate codebases; pre-commit narrow + not installed | New: shared check-set require()'d 3 ways |
| G4.1–G4.6 fixtures | None exist | New; Phase-3 `scripts/dispatch/falsifiers/*.falsifier.test.js` is the pattern |
| ED-215 (trust boundary defined-but-unenforced) + CORE-2 conformance fixture `report_only:true` | Open | Phase 4 closes ED-215 + flips CORE-2 to binding |

## Unit decomposition (proposed → design phase authors the build_spec)
1. **CONTROLLER** (backend) — the trusted controller / sole integration principal: validates exact base+tree hashes, runs the pinned checker bundle from OUTSIDE the candidate tree, calls `produce()`→`authorizesIntegration()`→`commitIntegration(performRefUpdate)` as the ONLY route into main. Covers sol-A1(b), sol-A2 caller, G4.2 (no check→merge TOCTOU), G4.3 (fail-closed default-deny), G4.4 (prevention: protected ref refuses un-brokered merges).
2. **PINNED-CHECKER-BUNDLE** (security) — content-addressed bundle (helpers/deps/config/executable-resolution) with controlled promotion, evaluated from outside the candidate's writable domain. Covers sol-A1(c), G4.1 (checker-poisoning fixture), G4.6 (checker self-modification test).
3. **HELM-RUNNER** (backend) — sol-A3 aggregate fail-closed runner over contracted helms × profile required/optional semantics; supersedes G4.5. panel-2family floor; agy optional/absent.
4. **CHECK-LIBRARY + FIXTURES** (backend/security) — shared check-set consumed 3 ways; G4.1–G4.6 required-present falsifier fixtures; flip CORE-2 conformance to binding; honest-promise statement; close ED-215.

## Phase gates (β at all 4 boundaries via the PERSISTENT Beta teammate — ED-239)
plan→design (front-loaded) · design→build (design-lock BEFORE build) · gauntlet→release · release→retro. Design-phase record-trust gate is BLOCKING (choke-point + structural guard + same/cross-session partition + fail-open falsifier fixtures required-present).
