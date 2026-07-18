# PRD — SP-20260718-003 (Phase 1: routing + security truth)

**Authored by:** product-lead (cross-provider consult, gpt-5.6-terra, design step) · **Conducted by:** Alex ε
**Max risk:** HIGH. **CORE PROPERTY:** NO false-green in the security/routing surface.

## Decision
`panel-3lab` is the binding Phase 1 exit; `panel-2family` is an explicit interim floor only. A down required lane blocks truthfully — never produces a green result.

**Status contract:** `BLOCKED-INCONCLUSIVE` for unprovable panel evaluation; `BLOCKED-ON-OPERATOR` for the Phase-1 `panel-3lab` exit awaiting agy liveness. Neither may be normalized to `PASS` or `GREEN`.

## Requirements
| ID | Requirement | Rationale |
|---|---|---|
| R-1 | Enforce the core no-false-green property across routing, panel evaluation, liveness, and attestation. | A binding security decision without trustworthy evidence must block. |
| R-2 | D1: Agent-tool spawns resolve Claude regardless of registry pin; CLI routing remains native-provider-bound. | Invocation-channel capability and logical role routing are distinct truths. |
| R-3 | D2: reconcile `antigravity` provider identity with `agy` tool identity in dispatch contracts. | A required lane cannot be evaluated if its routing contract rejects it. |
| R-4 | D3: support absolute `beta-consult --out` paths. | A valid output destination must not be corrupted by root-relative joining. |
| R-5 | D4 regression guard + docs only: native-provider `provider_model` semantics remain intact; explicit provider/model override remains available. | ED-205 is resolved; inventing a fix would create a phantom regression. |
| R-6 | D5: machine-readable `panel-3lab` lane contract, required `[gpt, claude, agy]`, degraded `panel-2family`, CLI-only panel routing, evidence-bound liveness. | The panel must not silently collapse to all-Claude or self-certify. |
| R-7 | D6: agy migration seam + surface its operator-owned account/tier dependency; until real agy evidence exists the binding exit stays `BLOCKED-ON-OPERATOR`. | The missing third-lab proof is real operational debt, not a greenable state. |
| R-8 | D7: five-case security canary corpus; fail closed for every absent/refused/malformed/loading-failed contracted lane. | Every known fail-open vector needs a fixture that proves it blocks. |
| R-9 | D8: attest the effective model from same-run CLI executable evidence, not wrapper claims. | Wrapper telemetry alone can falsely claim provider diversity. |
| R-10 | D9: ratify lane-contract + Agent-tool-channel ADRs + an executable ED-060 sunset enforcer. | Security semantics and expiry must be enforceable, not documentary. |
| R-11 | D10: flip skill-lane dispatch-shape enforcement only after bounded burn-in + no-widen proof. | The report-only→enforce transition must block violations without breaking sanctioned lanes. |
| R-12 | Release housekeeping: regen hash-tracked manifest state + reconcile cited EDs in the canonical ledger. | Release evidence must describe the code + outstanding operator dependency honestly. |

## High-level stories
| ID | Story | Traces |
|---|---|---|
| H-1 | Incomplete/invalid binding security evidence resolves to blocked — no security surface reports false green. | R-1 |
| H-2 | Agent-tool and CLI routing semantics are explicit + separately testable. | R-2 |
| H-3 | `antigravity` and `agy` resolve to one valid lane contract. | R-3 |
| H-4 | Absolute output paths preserved. | R-4 |
| H-5 | Resolved ED-205 semantics guarded without a non-bug rewrite. | R-5 |
| H-6 | Binding three-lab manifest, CLI-only lane execution, real liveness evidence. | R-6 |
| H-7 | agy operator dependency surfaced while the buildable interim floor stays usable. | R-7 |
| H-8 | Canaries prove each failure mode blocks rather than falls back. | R-8 |
| H-9 | Same-run proof of the executable provider/model result. | R-9 |
| H-10 | Enforceable ADR-backed lane + sunset rules. | R-10 |
| H-11 | Skill shape rule graduates safely report-only→enforce. | R-11 |
| H-12 | Regenerated manifests + reconciled enforcement debt. | R-12 |

## Granular stories
| ID | Story | Parent |
|---|---|---|
| S-1 | Closed verdict reducer: evidence defects / judge refusal / malformed verdicts / missing evidence → `BLOCKED-INCONCLUSIVE`; no judge fallback → `PASS`. | H-1,R-1 |
| S-2 | Encode + document the D1 channel rule: Agent-tool = Claude-only capability; CLI preserves registry/provider routing. | H-2,R-2 |
| S-3 | Normalize provider/tool identifiers so the security route accepts `antigravity` through `agy`. | H-3,R-3 |
| S-4 | Preserve absolute `--out` values in `beta-consult`. | H-4,R-4 |
| S-5 | Lock ED-205 native-provider binding + explicit override with a regression test + one doc line. | H-5,R-5 |
| S-6 | Publish a machine-readable lane manifest for `panel-3lab` + `panel-2family` (required/optional/fallback semantics). | H-6,R-6 |
| S-7 | Enforce every security-panel lane runs through `dispatch-agent.js` CLI subprocesses; reject in-process panel lanes. | H-6,R-6 |
| S-8 | Require real CLI ledger liveness evidence `fallback:false`; reject config echoes as proof. | H-6,R-6 |
| S-9 | Add agy invocation syntax + headless-dispatch support + an operator-action record for account/tier activation. | H-7,R-7 |
| S-10 | Honest close accounting: buildable work completes on `panel-2family`, but a no-agy `panel-3lab` exit stays `BLOCKED-ON-OPERATOR`. | H-7,R-7 |
| S-11 | Five-case canary corpus: kill-one-lane, contracted-but-down agy, judge-refusal, malformed-verdict, missing-evidence, loader-failure. | H-8,R-8 |
| S-12 | Bind attestation to same-run CLI return + invocation digest + code SHA + panel profile + evidence digest. | H-9,R-9 |
| S-13 | Ratify the two ADRs + make ED-060 sunset expiry fail `/scan:full`. | H-10,R-10 |
| S-14 | Burn in skill-lane shape reporting, then enforce with blocking + no-widen + sanctioned-suppression regressions. | H-11,R-11 |
| S-15 | Regen manifest state + reconcile ED-060/ED-221 before release validation. | H-12,R-12 |

## Acceptance criteria
| ID | Story | Criterion | verified_by |
|---|---|---|---|
| AC-1 | S-1 | Any binding panel eval with judge refusal / malformed verdict / missing evidence / absent required-lane proof / loader error → `BLOCKED-INCONCLUSIVE`; no fallback returns `PASS`. | panel-fail-closed test |
| AC-2 | S-2 | A non-Claude logical pin resolves to Claude via the harness Agent-tool channel, while the same role's CLI provider/model pin is unchanged. | harness-agent-channel test |
| AC-3 | S-2 | An ADR states "Agent-tool channel = Claude-only capability, distinct from registry role-routing" + names ED-208 resolved. | ADR grep `Agent-tool channel` + `ED-208` |
| AC-4 | S-3 | `dispatch-contract.js validate` exits 0 with `antigravity`/`agy` reconciled for security-reviewer routing. | dispatch-contract validate + test |
| AC-5 | S-4 | `beta-consult --out <absolute>` writes the exact absolute destination without prefixing the repo root. | beta-consult abs-path fixture test |
| AC-6 | S-5 | Native-provider `provider_model` + explicit `--provider X --model Y` override both pass; docs call ED-205 resolved/correct-by-design. | provider-model-semantics test + ED-205 doc grep |
| AC-7 | S-6/S-7 | Manifest declares `panel-3lab.required=[gpt,claude,agy]`, defines `panel-2family` degraded-only, and REJECTS any in-process Agent-tool panel lane as a contract violation. | panel-lane-contract test |
| AC-8 | S-8 | Required-lane liveness accepts only a real CLI ledger record `fallback:false`; a config echo is insufficient. | panel-liveness test + ledger fixture |
| AC-9 | S-10 | agy contracted but no real agy record → canary `BLOCKED-INCONCLUSIVE`; Phase-1 `panel-3lab` exit `BLOCKED-ON-OPERATOR`, never GREEN; every dependent gate reflects the lane down. | contracted-but-down fixture + sprint exit ledger |
| AC-10 | S-9 | `providers.js` supports agy invocation + headless dispatch; the critical-path tracker names the exact operator action (provision Antigravity account/tier, authenticate agy, produce one real no-fallback record). | dispatch-contract test + tracker grep ED-060/account-tier/fallback:false |
| AC-11 | S-11 | Canary corpus ≥5 cases; killing any contracted lane (incl. agy) → `BLOCKED-INCONCLUSIVE`, never a silent judge fallback. | panel-canary test |
| AC-12 | S-11 | Separate negative fixtures prove judge-refusal / malformed-verdict / missing-evidence each block. | panel-fail-closed test (per-vector) |
| AC-13 | S-11 | A lane error during LOADING fails closed at the loader boundary; evaluator-fail-closed vs loader-fail-open tested as distinct cases. | panel-loader-fail-closed test |
| AC-14 | S-12 | Attestation correlates one run's CLI executable return with sanitized invocation digest + code SHA + panel profile + evidence digest. | cert-attest test + same-run fixture |
| AC-15 | S-12 | A negative fixture where the wrapper claims agy but the executable returns Claude/absent FAILS attestation. | cert-attest claimed-agy/returned-claude fixtures |
| AC-16 | S-13 | The lane-contract ADR specifies required/optional lanes, fallback rules, sunset semantics, and both panel profiles. | ADR grep required/optional/fallback/sunset/panel-2family/panel-3lab |
| AC-17 | S-13 | `/scan:full` exits non-zero once ED-060's sunset date passes while unresolved. | sunset-date fixture through /scan:full |
| AC-18 | S-14 | After documented burn-in, a formerly report-only skill-shape violation blocks; each sanctioned lane retains a no-widen negative fixture; FIX-A3 sanctioned-lane suppression stays rejected. | dispatch-shape test + shape-door regression |
| AC-19 | S-15 | New scripts hash-tracked in regenerated manifest; non-strict manifest validate exit 0; ED-060/ED-221 reconciled in the canonical ledger pre-release. | manifest build + validate + ED-ledger reconcile |

## Note (ε)
Cross-provider route this time (gpt-5.6-terra via dispatch-agent.js) — no route deviation. `verified_by` cells name test intents; the qa-plan (quality-lead) turns them into concrete fixtures with teeth (esp. the fail-closed/negative-fixture per β tightening #3-4). AC-7 is the D1↔D5 false-green guard; AC-9 the honest panel-3lab-blocked accounting.
