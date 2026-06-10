<!-- requirement-format-legacy -->
# Acceptance Criteria — Lane B — dispatch/registry coherence (WARPOS.md sweep 2026-06-10)

**Sprint:** `SP-20260610-002`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-002\prd.md`

> Each AC is a testable statement. Link from the relevant granular story
> + the ticket that implements it.
>
> **`verified_by:` linkage convention (SP-20260518-007).** When the Plan
> Contract carries a `goal_verification` block, each AC MUST be
> linked by adding a `verified_by:` line directly under the AC. Two
> accepted forms:
>
> - `verified_by: <test-file>::<test-name>` (executable — ship-gate
>   runs this test under paths.sprintRegressionCorpus/<sprint-id>/)
> - `verified_by: not_applicable — <justification>` (skipped; only
>   valid when `goal_verification.reproduction = not_applicable` in
>   the Plan Contract; justification must be non-empty)
>
> `/sprint:design` refuses to advance the sprint to `designed` if any
> AC lacks a `verified_by:` line while `goal_verification.reproduction
> = executable`. `/sprint:release` ship-gate runs every cited test.

## S-1 — TICKET-1: Pin 6 model:inherit specs + beta.md from role-registry (right layer + regen) + frontmatter-guide scoping

- AC-1.1: Given the 6 named role specs carried `model: inherit`, when TICKET-1 lands, then `grep -rn "^model: inherit"` over the registry-routed role specs under `.claude/agents/` returns 0 matches (re-grep is part of the ticket's done-proof).
  verified_by: scripts/checks/role-parity-scan.js::inherit-treated-as-mismatch-on-registry-routed-roles
- AC-1.2: Given role-registry.json is the routing SoT (ADR-0008), when the pins land, then each of the 6 specs' frontmatter `model:` equals its role-registry model, and `president/beta.md` frontmatter model equals the registry model (claude-opus-4-8, not sonnet). Open question resolved at design: openai-routed roles (cabinet, ops-analyst) pin per the design decision (registry model vs claude fallback with comment) and the enforcer rule follows that decision.
  verified_by: scripts/checks/role-parity-scan.js::spec-model-equals-registry-model
- AC-1.3: Given agent specs may be generated views of `_warpos` sources (P-058 class), when the pins land, then the edit is at the SOURCE layer (with regen) — never the view alone — and `/scan:framework-views-fresh` is green afterward.
  verified_by: not_applicable — layer-discipline proof is the framework-views-fresh scan run recorded at the QA gate; no sprint-local regression test.
- AC-1.4: Given `_system/frontmatter-guide.md` documented `model: inherit` as a valid value, when TICKET-1 lands, then the guide no longer presents `inherit` as valid for registry-routed roles (either scoped explicitly to non-registry agents or removed) — grep of the guide shows the scoping language.
  verified_by: not_applicable — doc-presence AC; proven by the grep named in the AC text during the QA gate (no runtime behavior to test).

## S-2 — TICKET-2: role-parity-scan FAILs on spec-model ≠ registry-model (incl. inherit), planted fixtures both ways

- AC-2.1: Given a planted fixture spec whose frontmatter model differs from its role-registry model, when `node scripts/checks/role-parity-scan.js` runs against the fixture, then it exits non-zero and names the role plus both models (spec vs registry).
  verified_by: scripts/checks/role-parity-scan.js::planted-spec-model-mismatch-fixture-fails
- AC-2.2: Given a planted fixture spec carrying `model: inherit` on a registry-routed role, when the scan runs, then it exits non-zero (inherit is a mismatch, not a pass-through).
  verified_by: scripts/checks/role-parity-scan.js::planted-inherit-fixture-fails
- AC-2.3: Given the real tree after TICKET-1, when the scan runs, then it exits 0 and every pre-existing parity check remains green (no regression in the existing check set).
  verified_by: scripts/checks/role-parity-scan.js::clean-tree-passes
- AC-2.4: Given legitimately non-registry agents exist, when the scan runs, then they produce no model-parity false positive (scoping matches the frontmatter-guide decision from AC-1.4).
  verified_by: scripts/checks/role-parity-scan.js::non-registry-agents-not-flagged

## S-3 — TICKET-3: dispatch-contract cross-provider-lead derivation rule + shape-vs-route parity FAIL (planted fixtures)

- AC-3.1: Given the new `class_derivation` rule inserted BEFORE the generic `{tier:lead}→manager` rule, when shape is derived for design-lead (provider openai, tier lead), then the derived shape is subprocess — matching its registry route (openai/gpt-5.5 subprocess) instead of in-process-agent.
  verified_by: scripts/checks/role-parity-scan.js::design-lead-derives-subprocess-fixture
- AC-3.2: Given claude-provider leads, when shape is derived after the rule insertion, then they STILL derive manager (in-process-agent) — the rule keys on provider != claude and does not reroute claude leads (planted fixture proves both directions; insertion position is load-bearing).
  verified_by: scripts/checks/role-parity-scan.js::claude-leads-still-derive-manager-fixture
- AC-3.3: Given a planted contract-shape-vs-registry-route contradiction fixture, when `node scripts/checks/role-parity-scan.js` runs, then it exits non-zero naming the role, the derived shape, and the registry route.
  verified_by: scripts/checks/role-parity-scan.js::planted-shape-vs-route-contradiction-fails

## S-4 — TICKET-4: epsilon.md + dispatch-guide sanctioned subprocess conduct route + startup self-check + WG-6 stall rules

- AC-4.1: Given epsilon.md documented an Agent-tool conduct loop a teammate-ε cannot execute (ED-041), when TICKET-4 lands, then epsilon.md's conduct-loop section documents subprocess dispatch as the SANCTIONED teammate-ε route — `claude -p --agent` for non-build roles, `dispatch-claude.js` for build-chain, `dispatch-agent.js` cross-provider — consistent with the already-updated /mode:sprint ED-041 language.
  verified_by: not_applicable — doc-presence AC; proven by grep of epsilon.md for the three sanctioned routes at the QA gate.
- AC-4.2: Given agent-dispatch-guide.md lacked a teammate-ε section, when TICKET-4 lands, then the guide carries the teammate-ε conduct-route section aligned with epsilon.md (no contradiction between the two docs).
  verified_by: not_applicable — doc-presence AC; proven by grep of agent-dispatch-guide.md at the QA gate.
- AC-4.3: Given conduct routes differ by spawn context, when TICKET-4 lands, then epsilon.md instructs a startup self-check that detects and RECORDS which conduct route is active (top-level Agent-tool vs teammate subprocess) to the events ledger before conducting.
  verified_by: not_applicable — instruction-presence AC; the recorded route event is exercised live in the next ε-conducted sprint (monitoring item in release-plan.md).
- AC-4.4: Given no stall rules existed, when TICKET-4 lands, then epsilon.md contains the stall-rules block: never idle awaiting background returns, dispatch blocking instead, report-before-idle.
  verified_by: not_applicable — doc-presence AC; proven by grep of epsilon.md for the stall-rules block at the QA gate.

## S-5 — TICKET-5: epsilon-liveness fail-closed check + /scan:full wiring + regen both manifests + ff-merge close

- AC-5.1: Given a planted evidence-without-record fixture (evidence files present, no matching ledger record, fixture timestamps older than threshold N), when `node scripts/checks/epsilon-liveness.js` runs against it, then it exits non-zero and emits a loud `epsilon-stalled` event.
  verified_by: scripts/checks/epsilon-liveness.js::planted-evidence-without-record-fixture-fails
- AC-5.2: Given a clean fixture (evidence with matching ledger record, or evidence fresher than N), when the check runs, then it exits 0 — and the threshold is evaluated against fixture-supplied timestamps deterministically (no wall-clock flake; N default decided at design, ~10 min).
  verified_by: scripts/checks/epsilon-liveness.js::clean-fixture-passes-deterministic-threshold
- AC-5.3: Given malformed or missing ledger input, when the check runs, then it fails CLOSED (non-zero) — never green on an unverifiable signal (P-053 / BC-16 semantics).
  verified_by: scripts/checks/epsilon-liveness.js::malformed-ledger-fails-closed
- AC-5.4: Given the close discipline, when TICKET-5 lands, then epsilon-liveness is wired report-only into `/scan:full`, BOTH manifests are regenerated as the LAST step, and `scan:framework-views-fresh` + BC-02/BC-05 are green at sprint close.
  verified_by: not_applicable — wiring + regen discipline proven by the /scan:full and manifest --check runs recorded at the release gate; no sprint-local regression test.
