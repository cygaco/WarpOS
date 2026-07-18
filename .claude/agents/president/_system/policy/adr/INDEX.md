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
| [0017](0017-retention-contain-via-archive-over-atomic-delete.md) | Retention/rotation contain-via-archive-rename (never delete) instead of an atomic-delete guard; F-RET-1 CRIT closed (deletion left the outcome set), TOCTOU residual re-classed MED-LOW/tracked (root cause: Node lacks portable openat/renameat) — SP-20260717-001 | 2026-07-17 | accepted | - |
| [0018](0018-durable-company-ephemeral-executors.md) | Durable company, ephemeral executors: RoleSpec/StateCard/SprintRoom/ledgers/trackers/handoffs ARE the company; live model runtimes are leased executors — ratifies packet-03's Persistence/Reaper/Role-identity policies, feeds the Top-Level Runtime Contract's CORE-1/CORE-2/CORE-3 — SP-20260718-001 Phase 0 | 2026-07-18 | accepted | - |
| [0019](0019-compactor-whole-file-archive-over-slice-rewrite.md) | Event compactor archives the WHOLE file + reseeds a bounded tail (not slice-archive+hot-log-rewrite): dissolves the slice model's lost-append race by reusing rotate.js's atomic whole-file rename, makes AC-4 no-unlink pass by construction, keeps logger.js untouched; never-lose-raw (CORE-4) by construction — SP-20260718-002 D-1 | 2026-07-18 | accepted | - |
| [0020](0020-security-panel-lane-contract.md) | Security panel lane contract: panel-3lab (BINDING, required[gpt,claude,agy]) + panel-2family (degraded floor); machine-readable manifest DERIVED from passesOf(security-reviewer)+support-matrix (no 4th source); CLI-only cross-provider labs, positive-scoped claude-hunter exemption, ED-060 dated sunset — SP-20260718-003 Phase 1 | 2026-07-18 | accepted | - |
| [0021](0021-agent-tool-channel-claude-only.md) | Agent-tool channel = Claude-only capability, distinct from registry role-routing: harnessSpawnModel(role) always resolves a Claude model for the in-process channel (tier-coerced), CLI routing untouched; the precondition for CLI-only cross-provider panel labs — resolves ED-208 — SP-20260718-003 Phase 1 | 2026-07-18 | accepted | - |
| [0022](0022-security-claude-hunter-real-producer.md) | Binding claude hunter = REAL registered producer (`security_claude_hunter`): writer-stamped identity + delegation-complete choke-point + conductor-bound production (ADR-0014) + observed-diversity + registration-is-hypothesis; Option B (collapse two-tier) rejected on 4 axes; answers ED-227's design questions (β DECIDE B/0.89) — SP-20260718-003 post-PARK design ruling; amends ADR-0020 | 2026-07-18 | accepted | - |
| [0023](0023-agy-payload-transport-carveout.md) | agy code-review payload transport: the `-p` argv value-slot carve-out (agy 1.1.4 has no stdin/--prompt-file, help-verified; safe under shell:false + native-exe + discrete-argv). Positive per-tool allow scoped to agy `-p` ONLY (denylist intact); four binding riders (assembled-cmdline oversize→BLOCKED never truncate; leading-dash structural discrete-argv bind VERIFIED; shell:false single-element; bidirectional fixtures); served-model §7 resolved via agy --log-file capture. β DECIDE B/0.90 OPEN_ADR — SP-20260718-003 Unit G / D6-ARGV-POLICY-003; amends ADR-0020 | 2026-07-18 | accepted | - |

When ADRs accrete, add a row here pointing at each file. Keep the table in sync with the filesystem; `/scan:references` will catch drift. (ADR 0009 is reserved for the parallel E7 ε-runtime sprint. ADR 0014 = E-DISPATCH-PERFECT-001 W5's roster-ADR — drafted as 0011 on a prior branch, renumbered to 0014 to avoid the collision with the existing 0011-turbo ADR; 0015 = E-TEAMS-MIGRATION-001.)
