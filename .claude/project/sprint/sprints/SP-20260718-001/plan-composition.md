# SP-20260718-001 — Phase 0 plan + composition (ε conductor record)

**Sprint:** WarpOS 1.0 Phase 0 — Kernel contract + trust boundary
**Conducted by:** Alex ε (teammate "Epsilon"), sprint mode, ADR-0009 registry-driven runtime.
**Authoritative scope:** `_planning/warpos-1.0-plan/RATIFIED-PLAN.md` § "Phase 0 — Kernel contract + trust boundary" + the binding testable gates (G0.1–G0.4) + the sol-Q2 gate addenda for G0.1/G0.3. Scope is RATIFIED (operator "Ok proceed" 2026-07-17) — the plan step confirms scope against that source, it does not re-derive it.
**Fold discipline:** the execution folds (`evidence/execution-folds-20260718.md`, F1–F6) LAND IN THEIR TARGET PHASES (F1/F4/F5→Phase 3, F2/F3→Phase 1, F6→β doctrine) — NONE are Phase-0 scope. The single Phase-0 touch point: Phase 0's support matrix must SEED the model×CHANNEL dimension (learn-mine addendum A) that F3 later refines in Phase 1.

## Composition
- `unit_types: [backend]` — the deliverables are contract/reference DOCS + two node enforcer scripts (G0.1 contract-lint, G0.3 conformance-matrix runner) + conformance fixtures. No FE/UI unit (no design-lead/visual/design-quality fire); no security-BUILD unit (Phase 0 DEFINES the trust boundary; the enforcement adapter is Phase 4).
- `max_risk: high` — kernel contract + trust-boundary definition is foundational; risk_min:high fires quality-lead at design and keeps the gauntlet's qa+security lanes binding. (Define-before-build: no live mutation path is created this phase, so not `critical`.)
- `domains: []` — no marketing/copy.

## Registry-resolved lifecycle roster (verified `epsilon-runtime plan`, invariants OK)
| step | roster (route) |
|---|---|
| plan | director-of-product (dispatch-agent), product-lead (dispatch-agent) — advisory |
| design | product-lead (dispatch-agent, BLOCK), director-of-engineering (claude-agent), quality-lead (claude-agent) |
| build | backend-builder (dispatch-claude, BLOCK) — ε sole dispatcher |
| gauntlet | backend-reviewer, qa-reviewer, security-reviewer (all dispatch-agent, BLOCK) |
| release | qa-reviewer (dispatch-agent, BLOCK) — release-diff |
| retro | ops-analyst (dispatch-agent) — advisory |

β at the 4 phase boundaries via HALT-AND-BRIDGE (team-lead/α relays; ε does not spawn β directly).

## Phase-0 deliverables → exit-gate trace (seed for the qa-reviewer traceability lane + G0.1/G0.3)
| # | Deliverable (RATIFIED-PLAN § Phase 0) | Primary gate(s) |
|---|---|---|
| D1 | ONE merged 04/16 **Top-Level Runtime Contract** doc — any provider proposes/orchestrates; a provider-independent TRUSTED layer owns capability grants, protected mutation, verification, integration into main | G0.1 (every policy block names `Enforcer:` or an ED; enforcer refs RESOLVE; cited EDs exist in ledger; core invariants non-debt-waivable) |
| D2 | **ADR** ratifying packet 03 "durable company, ephemeral executors" (company = durable on-disk state: tracker/registry/ledgers; models = interchangeable executors) | G0.2 (ADR committed + `/scan:references` clean) |
| D3 | Role-binding **precedence graph** — validated WorkOrder/CLI binding → explicit top-level runtime binding → UNBOUND fail-closed; repo prose can NEVER manufacture a binding | G0.1; feeds Phase-2 G2.1 |
| D4 | Provider × capability × **helm-level support matrix** + **addendum A** (model×CHANNEL: CLI vs harness/API per model id) — D-2 CONTRACTS all three helms (Claude, codex/GPT, agy/Antigravity) from the start | G0.3 (matrix seeded kernel-scope-only, runner executes; report-only through Phase 2 under a named ED, BINDING from Phase-3 exit) |
| D5 | Minimal **WorkOrder field set** | G0.1; feeds Phase-3 G3.1 |
| D6 | **Conformance fixtures** harvested from packet 13/15 (nonzero count; kernel-scope IN/OUT line per H-4) | G0.3 (mandatory fixture counts NONZERO) |
| D7 | Log/evidence **retention classes** (feeds SP-001 amendments; archive-not-delete per D-1) | G0.1 |
| D8 | H-1 **DoD preamble** present in the contract | G0.4 |

## Exit gates (binding — supersede prose "Exit:" lines)
- **G0.1** contract-lint (build-in-phase): every policy block names `Enforcer:` or an ED — missing = FAIL. sol-Q2: enforcer refs must RESOLVE (named script exists AND runs), cited EDs must exist in the ledger, mandatory fixture counts NONZERO, and the contract DESIGNATES which invariants are CORE/non-waivable (the ED escape-hatch is unavailable for those).
- **G0.2** ADR committed + `/scan:references` clean.
- **G0.3** conformance matrix seeded kernel-scope-only, runner executes (report-only through Phase 2 under an ED named at P0 exit; BINDING from Phase-3 exit — never a silent default). Enforcer refs resolve; fixture counts nonzero.
- **G0.4** H-1 DoD preamble present: *"1.0 is done when a clean installed product moves idea→canon→roadmap→sprint→build→gauntlet→launch-readiness→release→retro→learning-promotion without relying on chat memory, stale trackers, manual Alpha heroics, or unverified agent claims."*

## Policy-enforcer discipline (CLAUDE.md Policy & Enforcement Hygiene)
Every policy authored in the contract MUST name its enforcer at write-time or log an enforcement-debt entry. G0.1 mechanizes this (the ED-203–207 backfill lesson). The contract-lint enforcer is itself a Phase-0 deliverable (D1's gate) — it must exist AND run for G0.1 to pass.
