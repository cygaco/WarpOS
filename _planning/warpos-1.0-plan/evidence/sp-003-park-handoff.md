# SP-20260718-003 (Phase 1: routing + security truth) — PARK handoff

**Status:** PARKED UNMERGED at gauntlet round-7 (α true-terminal + dual reviewer PARK_UNMERGED). Full park, no split (α: SR-019 means the binding path could false-green once agy calibration lands → the floor must not merge with the broken binding path attached).
**Branch (preserved on origin):** `session/2026-07-18-phase1` @ `dbd4b653` (18 commits ahead of main; nothing false-green merged).
**Owner of resume:** a FRESH-SESSION DESIGN REVIEW of the panel-3lab binding-hunter production model, then a scoped build.

## What is GREEN and landable (do NOT rebuild)
- **panel-2family FLOOR** — the operative meta-gauntlet gate — attests; **all 19 ACs PASS** (qa round-7), incl. AC-14 (the profile-aware resolver closed the round-6 false-red).
- **D1–D10** delivered + verified; local teeth suite green (~18 files). Evidence-provenance closed across rounds 1–6: observed-provider stamping (C2), panel_run_id run-identity (SR-011/014), code_sha provenance via `scripts/dispatch/git-head.js` (SR-013/QA-012/R6-BE-001), the two-tier claude contract (SR-015, ADR-0020/0016 amended), the single choke-point `scripts/dispatch/provenance-verifier.js` + the delegation-complete structural guard `scripts/checks/provenance-invariants.js`.
- **Root invariant banked:** identity/liveness derive from the execution CHANNEL (`shape`, writer-stamped) + the dispatch CONTRACT (`role`), NEVER a client-settable record field. See ED-225 `root_invariant`.

## Why it parked — the panel-3lab binding-hunter model is undesigned
Everything below is in the BINDING panel-3lab exit (BLOCKED-ON-OPERATOR/CALIBRATION anyway) or guard robustness — not the shipped floor. Full detail: **ED-227** (design_questions) + the round-7 reviewer findings.

| id | the gap | design question / fix |
|----|---------|-----------------------|
| **SR-021 / QA-018** (the deep one) | `security_claude_hunter` has NO producer — absent from `role-registry.json` (only `security-reviewer`); `epsilon-runtime.js` record-inprocess resolves it unresolved + refuses to record it. The attestor verifies against a phantom (positive test = synthetic record). | Either add `security_claude_hunter` as a real role + an in-process route + a record-inprocess path that WRITER-STAMPS role+shape; OR collapse the two-tier contract (panel-3lab claude = subprocess-claude, 3rd-lab diversity from agy only) — reverses α's ADR-0016 amendment, needs α. |
| **SR-019** | dispatch-review `applyPanelGate` binds the binding lane's `verdict: l.verdict` (the subprocess floor pass), not the hunter's → hunter-fail can read binding-PASS. | Bind the binding claude lane's verdict to the same-run HUNTER record; missing/malformed hunter verdict must block. |
| **SR-020** | `panel-lanes.js#isSanctionedInProcessLane` still accepts `sanctioned_lane_id === security_claude_hunter` (settable label) — the THIRD identity consumer, excluded from the choke-point. | Route it through `provenance-verifier` (writer-stamped identity) + extend the guard's CONSUMERS list to it. |
| **R6-BE-002** | the structural guard is regex — still evades on `=== pv.IN_PROCESS_SHAPE`, `Object.is(...)`, destructuring. | Upgrade the guard from regex to AST (β's stated call). |
| **R7-BE-001** | `provenance-verifier.laneContract` defaults any non-`panel-3lab` profile to the floor contract → a typo'd profile false-greens. | Whitelist recognized profiles; unknown/absent → fail closed. |

## Operator-owned, folds with the above
- **agy transport is LIVE** (operator signed in; `cert-attest --provider antigravity` probe exit 0). Remaining: agy output doesn't echo the model id → attestation honestly fail-closed → panel-3lab is BLOCKED-ON-CALIBRATION (a small header-capture calibration), not BLOCKED-ON-OPERATOR. Artifact: `runtime/cert-attest/gemini-3.1-pro-high-2026-07-18T17-58-27-473Z.json`.
- **D6-ARGV-POLICY-003** (accepted-deferred): agy `-p` rejects code-review chars → the transport (STDIN/prompt-file) rework folds with agy liveness. ED-060.

## Process lesson (log to learnings at the design review)
The 7-round arc (4C+6H → 2C+2H → 4C → SR-016 → SR-017 → SR-019/020/021) was the gauntlet + β's falsification design WORKING: it caught a foundational model weakness (identity verified from settable labels; then an unproducible identity) with **zero false-green shipped**. Two meta-lessons: (1) never verify identity/liveness from a client-settable record field — derive from channel + contract; (2) a lease/claim-file is owed — the start-time duplicate-fire guard can't catch a LATER-firing prior conductor (the round-6 stale-record collision).

## β / autonomy trail
β boundary rulings this conduct: round-5 cap DECIDE B/0.90 (bounded fix) → round-5 comprehensive-sweep DECIDE B/0.87 (+ terminal condition) → round-6 escalate-to-α (terminal fired) → teeth-4 guard DIRECTIVE. α: option-B claude ruling, choke-point authorization (true-terminal), full-PARK confirmation. Merge stays operator-gated; nothing shipped.
