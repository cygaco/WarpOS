# ADR Index

Architecture Decision Records — settled decisions Beta consults to find precedent on prior tradeoffs.

---

## Where settled decisions live

**Pre-2026-04-29 settled decisions** are documented in `_requirements/03-architecture/`. Those files ARE this project's ADR archive — they capture what was chosen and why for the product's core stack and architecture, just not in numbered ADR format. When checking precedent, search there first:

- `_requirements/03-architecture/STACK.md` — framework, language, hosting, styling, state, AI provider, job-data source
- `_requirements/03-architecture/AUTH_SCHEMAS.md` — JWT + OAuth (Google/LinkedIn) + email/password
- `_requirements/03-architecture/EXTENSION_SPEC.md` — Chrome extension architecture
- `_requirements/03-architecture/API_SURFACE.md` — server route shape and contracts
- `_requirements/03-architecture/DATA_FLOW.md`, `PERSISTENCE.md` — encrypted localStorage + Redis sessions
- `_requirements/03-architecture/SECURITY.md` — security posture and boundaries
- `_requirements/03-architecture/THIRD_PARTY.md` — vendor list (Stripe, Bright Data, Upstash, Anthropic)
- `_requirements/03-architecture/PIPELINES.md`, `DATA-CONTRACTS.md` — data and pipeline contracts
- `_requirements/03-architecture/ENV_VARS.md`, `VALIDATION_RULES.md`, `ERROR_RECOVERY.md` — operational

These were not backfilled as numbered ADRs because doing so would duplicate documentation that already exists and is well-maintained.

---

## New ADRs

From 2026-04-29 onward, **new** Class B decisions that affect architecture, dependencies, data model, security, or deployment land here as numbered files:

```
NNNN-slug.md
```

Use `0000-template.md` as the starting point.

Naming:
- `NNNN` = monotonically increasing zero-padded integer (`0001`, `0002`, ...)
- `slug` = short kebab-case description (`add-zod-validation`, `move-to-postgres`)

When Beta returns DECIDE on a Class B decision with `OPEN_ADR: true`, Alpha drops a new ADR file here in the next cycle. Beta can then check this index for precedent on similar future decisions.

---

## Index

| ADR | Title | Date | Status | Supersedes |
|---|---|---|---|---|
| [0001](0001-warp-promote-location.md) | Build /warp:promote in the Product Repo First | 2026-05-01 | accepted | - |
| [0002](0002-multi-sprint-parallel-lanes.md) | Multi-sprint parallelism via per-sprint state + lanes | 2026-05-12 | accepted | - |
| [0003](0003-manager-principles-inheritance.md) | Manager-principles inheritance via slug registry + reject-scan | 2026-05-30 | accepted | - |
| [0004](0004-oneshot-arbitration-needed-state.md) | Oneshot arbitration-needed state + per-mode director participation | 2026-05-31 | accepted | - |
| [0005](0005-guides-root-ownership.md) | Root-level `_guides/` as owner=framework, shipped + /warp:update-managed | 2026-05-31 | accepted | - |
| [0006](0006-sealed-capsule-consumer-contract-gate.md) | Sealed-capsule executable consumer-contract gate | 2026-06-02 | accepted | - |
| [0007](0007-agent-system-org-rewrite.md) | Agent-system org rewrite: department tree · mode-agnostic workers · role-registry keystone · model-routing map | 2026-06-04 | accepted | - |
| [0008](0008-dispatch-consumers-derive-from-registry.md) | Dispatch consumers derive from the role-registry keystone (v0.2; registry = source-of-truth for role→provider/effort/build_chain/kind) | 2026-06-05 | accepted | - |
| [0009](0009-epsilon-sprint-runtime.md) | ε sprint-conductor runtime: registry-driven lifecycle engine with REAL dispatch (Phase D); closes ED-022 + ED-025 | 2026-06-06 | accepted | - |
| [0010](0010-orgmap-reporting-collapse.md) | Collapse org-map's reporting-line view into the role-registry; role-parity anchors on the registry, witnessed by the on-disk spec tree (ED-024) | 2026-06-05 | accepted | - |
| [0011](0011-turbo-spend-ceiling-and-push-honesty.md) | Turbo spend ceiling is source-vs-instance; push-to-main level pinned to confirm | 2026-06-10 | accepted | - |
| [0012](0012-envelope-validator-bury.md) | Bury the per-dispatch envelope-validation gate (the 36/36 dead gate) | 2026-06-16 | accepted | - |
| [0013](0013-two-dispatch-shape-gates.md) | Two dispatch gates (shape-door canonical-pick + contract gate full-contract), one authority each, defined precedence | 2026-06-16 | accepted | - |
| [0014](0014-epsilon-direct-roster-dispatch.md) | ε summons the in-process roster directly in any spawn context (top-level OR teammate-ε) with a scopeContract; retire the ED-041 α-only doctrine (per-spec misstatement); spawn-hand stays with the conductor (no deep cascade) | 2026-06-19 | accepted | - |
| [0015](0015-agent-teams-removed-implicit-session-teams.md) | Claude Code v2.1.178 removed agent-teams: migrate to implicit session-scoped teams, member-cwd project scoping, orphaned-subprocess reaper | 2026-06-19 | accepted | - |
| [0016](0016-dispatch-model-spread-provider-by-department.md) | Dispatch model-spread (GPT-5.6 / Claude-5 / Antigravity), provider-by-department routing, max/ultra ladder, fail-closed security panel; REVERSES the 2026-06-16 no-fable/opus-top/max-alpha-only directive (fable-5 top brain) — two-stage enforcer widen→narrow | 2026-07-16 | accepted | - |

When ADRs accrete, add a row here pointing at each file. Keep the table in sync with the filesystem; `/scan:references` will catch drift. (ADR 0009 is reserved for the parallel E7 ε-runtime sprint. ADR 0014 = E-DISPATCH-PERFECT-001 W5's roster-ADR — drafted as 0011 on a prior branch, renumbered to 0014 to avoid the collision with the existing 0011-turbo ADR; 0015 = E-TEAMS-MIGRATION-001.)
