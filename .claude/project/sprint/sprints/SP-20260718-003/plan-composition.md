# SP-20260718-003 — plan + composition (ε conductor record)

**Sprint:** WarpOS 1.0 **Phase 1 — Routing + security truth** (the live routing/dispatch bugs + the security-panel lane contract).
**Conducted by:** Alex ε (teammate "Epsilon"), sprint mode, ADR-0009 runtime.
**Authoritative scope:** `_planning/warpos-1.0-plan/RATIFIED-PLAN.md` Phase 1 (§ "Phase 1 — Routing + security truth" + G1.1–G1.7 + the ⚑ FLAGGED OPERATOR RULING resolved to FULL panel-3lab + D-5 skill-lane). Verify-don't-inherit: several items are ALREADY resolved/reclassified — verify against live code, don't re-derive.
**Precedes:** Phase 2 (per-helm trusted bindings / identity). Follows D-1 (SP-002, merged @65c9ecc4).

## THE CORE PROPERTY (non-negotiable)
**No false-green in the security/routing surface.** A binding gate that demands GREEN from a structurally-down lane, or an attestation that self-certifies from wrapper telemetry alone, is the exact class this phase kills. Security floor = cross-provider diversity (≥2 model families); fail-closed on judge-refusal/malformed-verdict/missing-evidence → BLOCKED-INCONCLUSIVE, never PASS, no silent judge fallback.

## Deliverables → exit-gate trace (G1.x)
| # | Deliverable | Gate |
|---|---|---|
| D1 | **Harness-spawn model rule** — harness Agent-tool spawns ALWAYS resolve to a Claude model regardless of the logical role's registry pin (separate role routing from invocation-channel capability). Hit twice live (β `gpt-5.6-sol`, product-lead `gpt-5.6-terra`). | G1.1: non-Claude pin resolves to Claude on the Agent-tool channel; CLI pin UNTOUCHED. |
| D2 | **I-2 provider-id/tool-id reconcile** — `antigravity` (provider) vs `agy` (tool-id) mismatch trips dispatch-contract on security-reviewer. | G1.2: `dispatch-contract.js validate` exit 0 with I-2 reconciled. |
| D3 | **I-3 beta-consult abs-path** — `beta-consult.js --out` crashes on an absolute path (`path.join(ROOT,outArg)`). | G1.3: absolute-path regression test. |
| D4 | **ED-205 regression guard** — RESOLVED (correct-by-design: spec `provider_model` is native-provider-bound; `--provider X --model Y` is the explicit path, dispatch-agent.js:742-746). Reduce to a regression guard on the intended semantics + one doc line (verify the code still matches before writing the guard). | G1.4: regression guard green; no silent pass on a phantom. |
| D5 | **Security-panel lane contract (panel-3lab BINDING)** — operator ruling: GPT+Claude+Antigravity ALL REQUIRED. Machine-readable **lane manifest** (`required:[gpt,claude,agy]`) consumed by G1.5+G1.6; `panel-2family` stays DEFINED as the degraded interim profile but 1.0 cannot EXIT Phase 1 on it. | G1.5: a REQUIRED lane proves liveness with a real ledger record (`fallback:false`; config echoes NEVER count). |
| D6 | **Antigravity migration seam (ED-060)** — IN-SCOPE (panel-3lab is binding). Build: I-2 fix + `providers.js` agy invocation syntax + the headless-dispatch contract. Lane liveness = one real agy ledger record via dispatch-agent.js with `fallback:false`. **PARTLY OPERATOR-OWNED** (Antigravity account/tier) — ε builds the SEAM + surfaces exactly what the operator must do; work continues around the blocked step (interim builds use `panel-2family`). | Contracted lane proves liveness OR the operator-action item is surfaced + the interim `panel-2family` floor is explicit. |
| D7 | **Security canary corpus + kill-one-lane→BLOCKED** — 5 canary cases; killing one CONTRACTED lane → BLOCKED (never a silent judge fallback). | G1.6. |
| D8 | **Effective-model attestation self-check** — attestation correlates SAME-RUN to the actual executable return (sanitized invocation digest + code SHA + panel profile + evidence digest); wrapper telemetry alone does NOT count. | G1.7: attestation self-check green. |
| D9 | **Lane-contract ADR** — ratify required/optional + fallback + sunset semantics + `panel-2family`/`panel-3lab` profiles (β OPEN_ADR 0.88). | ADR written; sunset-date enforcer (a /scan:full check reads ED-060's sunset date, fails once it passes unresolved) named. |
| D10 | **Skill-lane dispatch-shape enforce flip (ED-057 / D-5)** — the shape resolver's SKILL lane is still report-only. Per-skill dispatch-shape declaration + enforce after burn-in (same ramp as the agent-side flip). | Skill lane flips report-only→enforce; heavy skills get subprocess+lean-envelope by contract. |
| — | Manifest regen (new scripts hash-tracked) + ED-ledger reconcile at release (ED-221 gitignored seam; sunset-dated ED-060). | non-strict validate exit 0; cited EDs in canonical ledger pre-merge. |

## Composition
- `unit_types: [backend, security]` — dispatch/routing scripts (dispatch-agent.js, dispatch-contract.js, providers.js, dispatch-shape.js, beta-consult.js) + the security-panel lane contract/manifest/canary corpus + attestation. No FE/UI.
- `max_risk: high` — the security-panel false-green class + routing-truth are load-bearing for the whole 1.0 gauntlet; a wrong routing/attestation lets a false-green ship. Keeps qa+security gauntlet lanes binding + quality-lead at design.
- `domains: []`.

## Sequencing (ratified — contract→routing→identity→WorkOrder→adapter; Phase 1 = routing+security)
Within Phase 1: (1) the pure routing-truth fixes (D1 harness-spawn rule, D2 I-2, D3 I-3, D4 ED-205 guard) are independent + parallelizable; (2) the security-panel lane contract (D5 manifest + D7 kill-one-lane + D8 attestation) builds on D2 (I-2 must reconcile so agy resolves); (3) D6 agy migration seam runs alongside but its LIVENESS is operator-gated; (4) D9 ADR + D10 skill-flip are additive.

## Verify-don't-inherit findings (what's already resolved vs NEW)
- **ED-205 = correct-by-design** (ε code-trace 2026-07-17): verify dispatch-agent.js:742-746 still matches before writing only a regression guard + doc line — do NOT "fix" a non-bug.
- **agy lane = audit-correct, DUMP/TRACKER were stale** (ED-060 stands): zero agy ledger records ever; `providers.js` has NO agy syntax; a live probe was contract-BLOCKED (reproduces I-2). The third lane is a real MIGRATION, not a reconcile.
- **panel-3lab is the ratified 1.0 binding profile** (operator 2026-07-17) — ADR-0016 + registry 3-lab claims need NO supersession; Phase 1 makes them TRUE. `panel-2family` = the DEFINED degraded interim profile only.

## Applied lessons (from SP-001/SP-002)
- Mint fresh SP-id (done: SP-003 primary) — never reuse a closed sprint. Savepointed builders in isolated worktrees; WARPOS_SPRINT_ID on all CLI dispatches; 2-family gauntlet (agy DOWN); sol→terra on security shapes; ED-ledger reconcile before merge; merge-to-main through α (operator-gated).
- Fix a class defect at ALL occurrences (grep the pattern); every fix ships its own teeth test the same round; re-run full suite + re-gauntlet, never self-attest (SP-002 gauntlet caught an incomplete fix + a self-regression across 4 rounds).
- β at all 4 boundaries (direct consults). The retention `--apply` sweep stays OPERATOR-GATED (never run).

## β plan→design tightenings (DECIDE B/0.88, OPEN_ADR — BINDING for design)
1. **HONEST PHASE-1-CLOSE ACCOUNTING (headline false-green kill):** the panel-3lab-BINDING EXIT on a down-agy lane records as **BLOCKED-ON-OPERATOR** (agy liveness, ED-060) — NEVER GREEN, never "3-lab green" on a 2-family run. Phase 1 closes its BUILDABLE scope (D1-D10 on the explicit `panel-2family` interim floor) with the panel-3lab EXIT explicitly marked BLOCKED. A lane resolved DOWN is reflected in EVERY gate that assumed it UP. Roll up to the 1.0 milestone tracker.
2. **D1↔D5 (sharpest false-green — the load-bearing design constraint):** D1 makes the harness Agent-tool channel resolve Claude REGARDLESS of registry pin → the security-panel cross-provider lanes MUST dispatch via **CLI (dispatch-agent.js subprocess), NEVER an in-process Agent-tool spawn** (in-process silently coerces to Claude → all-Claude panel masquerading as cross-provider). The lane contract states EXPLICITLY: panel lanes route via CLI, attestation binds to the CLI executable return, in-process panel lane = contract violation.
3. **LIVENESS teeth (evidence-bound):** liveness = one real CLI ledger record `fallback:false`; config echo NEVER counts. D8 attestation correlates SAME-RUN (invocation digest + code SHA + panel profile + evidence digest) to the ACTUAL executable return. NEGATIVE fixture: wrapper CLAIMS agy but the executable return is Claude/absent → attestation self-check FAILS (else unfalsifiable).
4. **FAIL-CLOSED teeth (one negative fixture per fail-open vector):** judge-refusal→BLOCKED, malformed-verdict→BLOCKED, missing-evidence→BLOCKED. PLUS the eval-fail-closed vs **loader-fail-open SPLIT** (a lane that ERRORS while LOADING must not drop to PASS — the loader fail-closes too). D7 canary MUST include the **contracted-but-DOWN-lane→BLOCKED** binding test (agy today IS that case): agy contracted + zero agy record → assert `BLOCKED-INCONCLUSIVE`; the test FAILS if the panel ever returns PASS with a contracted lane absent. Anti-false-green backbone.
5. **D10 skill-lane enforce-flip — mirror the agent-side ramp:** (a) negative fixture (a report-only-flagged violation now BLOCKS); (b) no-widen proof (negative fixtures per sanctioned lane); (c) re-check the FIX-A3 sanctioned-lane-suppression landmine; (d) burn-in before the flip.
6. **ADRs (OPEN_ADR):** D9 lane-contract ADR (required/optional + fallback + sunset + panel-2family/panel-3lab profiles). SEPARATELY home the D1 harness-spawn-channel rule in an ADR ("Agent-tool channel = Claude-only capability, distinct from registry role-routing" — resolves ED-208). The ED-060 sunset-date enforcer is a REAL /scan:full check (exits non-zero once the sunset passes), not a doc note.

**SURFACE (operator-action, at Phase-1 START):** surface the exact Antigravity migration steps the operator must perform (account/tier → make the agy lane live) on the 1.0 critical-path tracker NOW. Alex is structurally barred from the sign-up step; the build proceeds identically either way (seam + interim floor). Operator may revisit 2-vs-3-family given the agy timeline (one-line call) — does NOT block design.
