<!-- requirement-format-legacy -->
# PRD — Lane B — dispatch/registry coherence (WARPOS.md sweep 2026-06-10)

**Sprint:** `SP-20260610-002`
**Plan Contract:** `PC-20260610-0066`
**Status:** draft
**Documentation scale:** `m`

## Outcome

Sub-agents stop silently running on the session model; shape-based enforcers stop contradicting the registry; every future product install gets a conduct loop that is actually implementable; ε stalls become loud events instead of 25-minute silent waits. Downstream products (doogle proved all four live) inherit the fixes on next release.

## Context

### Original Request

> Lane B — dispatch/registry coherence fixes from the 2026-06-10 WARPOS.md sweep (runtime/notes/warpos-md-sweep-2026-06-10.md §Lane B): (1) doogle WG-2: replace model: inherit with registry-derived pins in the 6 role specs (director-of-engineering, copy-lead, cabinet, ops-analyst, director-of-product, product-lead) + fix president/beta.md sonnet-vs-registry-opus drift + extend role-parity enforcer (scripts/checks/role-parity-scan.js) to FAIL when spec frontmatter model differs from role-registry model incl. the inherit case; (2) doogle WG-5: add dispatch-contract.json class_derivation rule routing cross-provider leads (provider openai/gemini) before the generic tier:lead→manager rule, so design-lead's derived shape matches its registry route; extend parity scan to FAIL on shape-vs-route contradictions; (3) doogle WG-4: rewrite epsilon.md + agent-dispatch-guide.md so subprocess dispatch (claude -p --agent for non-build roles, dispatch-claude.js for build-chain, dispatch-agent.js cross-provider) is the SANCTIONED conduct route for teammate-spawned epsilon (operator-ratified in doogle 2026-06-09) + epsilon startup self-check that records which conduct route is active; (4) doogle WG-6: add teammate stall rules to epsilon.md (never idle awaiting background returns, dispatch blocking, report-before-idle) + a fail-closed epsilon-stalled liveness check (evidence files without matching ledger record after N minutes = loud event).

### Interpreted Intent

Make the role-registry the enforced single routing source (model pins + shape derivation), make the documented teammate-ε conduct path match what the harness actually permits (subprocess routes, ED-041), and make conductor stalls self-detecting instead of operator-babysat. All four are coherence repairs to existing architecture, no new architecture (Beta OPEN_ADR false).

### Current Behavior

6 specs + frontmatter-guide carry model: inherit → in-process Agent spawns inherit the session model, bypassing role-registry routing; beta.md pins sonnet vs registry opus. dispatch-contract first-match {tier:lead}→manager forces in-process-agent for design-lead vs registry subprocess/gpt-5.5 (live advisory observed in doogle SP-20260609-001). epsilon.md documents an Agent-tool conduct loop a teammate-ε cannot execute (ED-041) and a heartbeat/circuit-breaker that does not run for teammate-ε; no stall rules → conductor idled 25 min on returned work, recurrence ×3 in doogle.

### Desired Behavior

No registry-routed spec carries model: inherit; claude-provider specs' frontmatter model == registry model (beta.md = opus); role-parity-scan FAILS on any spec-vs-registry model mismatch and on any contract-shape-vs-registry-route contradiction; dispatch-contract derives subprocess shape for cross-provider leads; epsilon.md + dispatch guide document subprocess as the sanctioned teammate-ε conduct route with a startup route self-check; epsilon.md carries the stall rules; epsilon-liveness check exits non-zero on evidence-without-record staleness. Both manifests regenerated; framework-views-fresh green.

## Requirements

> Use existing requirement ID conventions enforced by
> `scripts/hooks/requirement-format-guard.js`. PRDs in `_requirements/`
> use `R-N` ids — sprint-scope PRDs that link to a feature in
> `_requirements/04-features/<feature>/PRD.md` should reuse those ids,
> not invent new ones.

- `R-1` — **Model pins + frontmatter-guide scoping (WG-2).** The 6 `model: inherit` role specs (director-of-engineering, copy-lead, cabinet, ops-analyst, director-of-product, product-lead) carry registry-derived model pins; `president/beta.md` pin corrected sonnet → registry opus; `_system/frontmatter-guide.md` stops documenting `inherit` as valid for registry-routed roles (scoped to non-registry agents only, or removed).
- `R-2` — **Role-parity model + shape-vs-route enforcement (WG-2/WG-5 enforcers).** `scripts/checks/role-parity-scan.js` FAILs (non-zero exit) when a registry-routed spec's frontmatter model differs from the role-registry model — including the `inherit` case — and when the dispatch-contract's derived shape contradicts the registry route. Planted-violation fixtures prove each FAIL path; existing checks stay green; legitimately non-registry agents do not false-positive.
- `R-3` — **Dispatch-contract cross-provider-lead derivation rule (WG-5).** `.claude/agents/_org/dispatch-contract.json` `class_derivation.rules` gains a rule routing cross-provider leads (provider != claude, tier/kind lead) to subprocess shape, inserted BEFORE the generic `{tier:lead}→manager` rule, so design-lead's derived shape matches its registry route (openai/gpt-5.5 subprocess) while claude leads still derive manager.
- `R-4` — **Epsilon conduct-route documentation + startup self-check (WG-4).** `epsilon.md` + `agent-dispatch-guide.md` document subprocess dispatch (`claude -p --agent` for non-build roles, `dispatch-claude.js` for build-chain, `dispatch-agent.js` cross-provider) as the SANCTIONED conduct route for teammate-spawned ε (ED-041-consistent, operator-ratified doogle 2026-06-09), plus an ε startup self-check that records which conduct route is active.
- `R-5` — **Epsilon stall rules + liveness enforcer (WG-6).** `epsilon.md` carries the teammate stall-rules block (never idle awaiting background returns; dispatch blocking; report-before-idle); NEW `scripts/checks/epsilon-liveness.js` exits non-zero on evidence-files-without-matching-ledger-record staleness after N minutes (fail-closed per P-053, deterministic fixture — no wall-clock flake), wired report-only into `/scan:full`.
- `R-6` — **Source-vs-view regen + both manifests.** Any edited `.claude` view that is a generated view of a `_warpos` source is edited at the SOURCE layer and regenerated; BOTH manifests are regenerated as the last step before close; `scan:framework-views-fresh` and BC-02/BC-05 stay green.

## Non-Goals

- Flipping any report-only gate to blocking (E-LIFECYCLE §22 #4, operator-gated, codex-blocked).
- Lane C's epsilon-dispatch default flip (β-gated on this lane's WG-6 landing first — happens in Lane C, not here).
- Touching Lane A surfaces (generate-framework-manifest.js, release.js, warpos-install-baseline.js, scaffold payload).
- Re-architecting the harness teammate wake seam (the real WG-6c fix is upstream-harness, out of WarpOS control).
- Pushing to remote (α owns merge; push is per-action operator-cadence).

## Affected Surfaces

| Surface | Evidence Level |
|---|---|
| .claude/agents/engineering/director-of-engineering.md, growth/copy-lead.md, president/cabinet.md, president/ops-analyst.md, product/director-of-product.md, product/product-lead.md (model: inherit → registry-derived pin) | verified_from_repo |
| .claude/agents/president/beta.md (model: claude-sonnet-4-6 vs registry claude-opus-4-8) | verified_from_repo |
| .claude/agents/_system/frontmatter-guide.md (documents model: inherit as a valid value) | verified_from_repo |
| .claude/agents/_org/dispatch-contract.json class_derivation.rules (insert cross-provider-lead rule before {tier:lead}→manager) | verified_from_repo |
| scripts/checks/role-parity-scan.js (extend: spec-model-vs-registry FAIL incl. inherit; shape-vs-route contradiction FAIL) | verified_from_repo |
| .claude/agents/president/epsilon.md (WG-4 sanctioned subprocess conduct route + WG-6 teammate stall rules) | verified_from_repo |
| .claude/agents/_system/guides/agent-dispatch-guide.md (teammate-ε conduct route section) | verified_from_repo |
| NEW scripts/checks/epsilon-liveness.js (fail-closed: evidence files without matching ledger record after N minutes = loud epsilon-stalled event) | inferred_from_repo |
| _warpos sources for any edited .claude view + BOTH manifests (regen last, BC-02/BC-05) | verified_from_repo |

## External Service Dependencies

See `.claude/project/sprint/external-services/` for ESD records.

## Approval Boundaries

See Plan Contract `approval_boundaries`.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260610-0066.yaml`
- High-level stories: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-002\high-level-stories.md`
- Granular stories: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-002\granular-stories.md`
- COPY: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-002\copy.md`
- INPUTS: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-002\inputs.md`
- TRACE: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-002\trace.md`
- Acceptance criteria: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-002\acceptance-criteria.md`
- QA plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-002\qa-plan.md`
- Redteam plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-002\redteam-plan.md`
- Release plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-002\release-plan.md`
