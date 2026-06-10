<!-- requirement-format-legacy -->
# Granular Stories — Lane B — dispatch/registry coherence (WARPOS.md sweep 2026-06-10)

**Sprint:** `SP-20260610-002`
**High-level stories:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-002\high-level-stories.md`

> Granular stories use the `S-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`. Each granular story
> should produce roughly one ticket during `/sprint:design`.

## S-1 — TICKET-1: Pin 6 model:inherit specs + beta.md from role-registry (right layer + regen) + frontmatter-guide scoping

**As** the dispatcher (α)
**I want** the view-vs-source layer verified for the agent specs first (P-058 class), then the 6 `model: inherit` specs (director-of-engineering, copy-lead, cabinet, ops-analyst, director-of-product, product-lead) + president/beta.md pinned from role-registry at the correct layer with regen, the frontmatter-guide's `inherit` documentation scoped to non-registry agents, and a re-grep confirming zero `model: inherit` on registry-routed roles
**So that** in-process Agent spawns stop inheriting the session model and the registry-declared model (beta = opus) is what actually runs.

Acceptance criteria:
- AC-1.1 – AC-1.4: see `acceptance-criteria.md` §S-1 (set at design; minted into TICKET-1).

Linked: `H-1`, `R-1`, `R-6`.
COPY: see `copy.md` (none — engine sprint).
INPUTS: see `inputs.md` (`IN-1`).
TRACE: see `trace.md`.

## S-2 — TICKET-2: role-parity-scan FAILs on spec-model ≠ registry-model (incl. inherit), planted fixtures both ways

**As** an enforcer author
**I want** `scripts/checks/role-parity-scan.js` extended to FAIL (non-zero) when a registry-routed role's spec frontmatter model differs from the role-registry model — treating `model: inherit` as a mismatch — proven by a planted-violation fixture each way (mismatch FAILs, clean tree passes), with all existing parity checks kept green and no false positives on legitimately non-registry agents
**So that** the WG-2 drift class is self-detecting instead of grep-audited by hand (named enforcer per CLAUDE.md Policy & Enforcement Hygiene).

Acceptance criteria:
- AC-2.1 – AC-2.4: see `acceptance-criteria.md` §S-2 (set at design; minted into TICKET-2).

Linked: `H-1`, `R-2`.
COPY: see `copy.md` (none — engine sprint).
INPUTS: see `inputs.md` (`IN-1`).
TRACE: see `trace.md`.

## S-3 — TICKET-3: dispatch-contract cross-provider-lead derivation rule + shape-vs-route parity FAIL (planted fixtures)

**As** an enforcer author
**I want** a `class_derivation` rule inserted in `dispatch-contract.json` BEFORE the generic `{tier:lead}→manager` rule, keying on provider != claude for tier/kind lead and deriving subprocess shape, plus the parity scan extended to FAIL on any contract-shape-vs-registry-route contradiction — with planted fixtures proving both directions (design-lead resolves subprocess; claude leads still resolve manager)
**So that** first-match derivation agrees with the registry route and shape-based gates stop contradicting the routing SoT (rule insertion position is load-bearing — fixtures guard the ordering).

Acceptance criteria:
- AC-3.1 – AC-3.3: see `acceptance-criteria.md` §S-3 (set at design; minted into TICKET-3).

Linked: `H-2`, `R-2`, `R-3`.
COPY: see `copy.md` (none — engine sprint).
INPUTS: see `inputs.md` (`IN-2`).
TRACE: see `trace.md`.

## S-4 — TICKET-4: epsilon.md + dispatch-guide sanctioned subprocess conduct route + startup self-check + WG-6 stall rules

**As** a teammate-spawned ε
**I want** the epsilon.md conduct-loop section and the agent-dispatch-guide.md teammate-ε section rewritten so subprocess dispatch is the SANCTIONED conduct route (ED-041-consistent, aligned with the already-updated /mode:sprint language), a startup route self-check instruction that records which conduct route is active, and the WG-6 stall-rules block (never idle awaiting background returns; dispatch blocking; report-before-idle) added to epsilon.md
**So that** my documented conduct path matches what the harness actually permits, and the route in effect is recorded at startup instead of assumed.

Acceptance criteria:
- AC-4.1 – AC-4.4: see `acceptance-criteria.md` §S-4 (set at design; minted into TICKET-4).

Linked: `H-3`, `H-4`, `R-4`, `R-5`.
COPY: see `copy.md` (none — engine sprint).
INPUTS: see `inputs.md` (`IN-3`).
TRACE: see `trace.md` (`TR-1`).

## S-5 — TICKET-5: epsilon-liveness fail-closed check + /scan:full wiring + regen both manifests + ff-merge close

**As** the team lead
**I want** NEW `scripts/checks/epsilon-liveness.js` built fail-closed (evidence files without a matching ledger record after N minutes = non-zero exit + loud `epsilon-stalled` event; deterministic fixture, no wall-clock flake; malformed input fails closed per P-053), wired report-only into `/scan:full`, then BOTH manifests regenerated and the sprint closed via local ff-merge
**So that** conductor stalls become loud events within N minutes, and the sprint lands with views-fresh + BC-02/BC-05 green per the regen-last discipline.

Acceptance criteria:
- AC-5.1 – AC-5.4: see `acceptance-criteria.md` §S-5 (set at design; minted into TICKET-5).

Linked: `H-4`, `R-5`, `R-6`.
COPY: see `copy.md` (none — engine sprint).
INPUTS: see `inputs.md` (`IN-3`).
TRACE: see `trace.md` (`TR-2`).
