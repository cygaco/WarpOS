# WarpOS 0.14.0 — 2026-06-05

## Theme — from a developer tool to a company

0.14.0 is the headline release of the **agent-system rewrite (ADR-0007)**: WarpOS stops
behaving like a single assistant with helper modes and starts behaving like an **organization**
— a department tree with directors, leads, and specialist workers, a shared institutional
brain, and a real, conductor-driven **sprint lifecycle**. Everything below landed and was
verified on `main` across the 2026-06-02 → 2026-06-05 sessions; this release cuts the capsule.

## What's new since 0.13.1

- **Department org tree (ADR-0007) — the "company" structure.** The old mode-shaped agent
  folders (`00-alex` / `01-adhoc` / `02-oneshot` / `03-managers`) are gone, replaced by a
  department tree: `president/`, `product/`, `engineering/`, `growth/`, `_system/`, `_org/`.
  Workers are **mode-agnostic** — the same builder/reviewer roles serve adhoc, oneshot, and
  sprint work. 33 real agent specs (no stubs): directors (product / engineering / growth / QA),
  leads (frontend / backend / security / quality / marketing / research / design / conversion /
  copy), and the specialist builder/reviewer/fixer roster.

- **`role-registry.json` keystone.** A single source of truth for role identity, model, authority,
  dispatch route, and reporting lines (`.claude/agents/_org/role-registry.json`, `paths.orgRoleRegistry`).
  Dispatch consumers (provider/effort/build-chain maps), skill→persona resolution, and the
  `scan:role-parity` / `scan:dispatch-routing-parity` enforcers all **derive from the registry**
  rather than hardcoding role names — adding an agent is a registry row, not a code edit
  (ADR-0008, ADR-0010).

- **`_knowledge/` — the shared institutional brain.** A new grounding layer (`_knowledge/{design,
  audience,copy}`) with a two-kind taxonomy: **library** domains (design guidance injected into
  consumer specs via marker blocks) and **store** domains (audience / copy, producer-owned with a
  contract README). `/knowledge:integrate` wires each domain into its consumers idempotently;
  `/knowledge:coverage` is a fail-closed enforcer wired into `/scan:full`.

- **Sprint mode (`/mode:sprint`) — the conductor-driven lifecycle.** A fourth mode alongside
  adhoc / oneshot / solo. The sprint deliver-face **ε (Alex Epsilon)** conducts the full lifecycle
  (**plan → design → build → gauntlet → release → retro**) by reading a declarative **hook-point
  registry** (`{role, step, condition, mode, order}`); managers self-dispatch their phases, β
  provides process judgment at the four phase boundaries, and the directors provide domain
  judgment at their hook-points. Adding an agent to a sprint = adding a registry row; ε is never
  edited.

- **ε sprint-runtime — REAL dispatch on both route classes (ADR-0009).** `scripts/sprint/
  epsilon-runtime.js` resolves the matched agent-set at each hook-point, derives each role's
  dispatch route from the registry, and writes **real** completion records:
  - **CLI-routable roles** (build-chain builders, cross-provider GPT/Gemini reviewers, claude-raw
    tools) dispatch through the node runtime; `ok` is derived from the real spawn outcome
    (a harness reap = 0-byte-on-exit-0 → `ok:false`).
  - **In-process roster** (managers / leads / directors, plus the Claude-pinned design-quality /
    visual-review reviewers) dispatch via ε-the-agent + the harness Agent tool, recorded with
    `record-inprocess --evidence <file>` whose `ok` is derived from the real returned bytes.
  - `recordAgentDispatch` **refuses** to write a completion record without a real boolean outcome
    — the fake-green guard that closes the "claimed done, never spawned" failure class.

- **New / hardened enforcers (all wired into `/scan:full`).** `scan:cutover-completeness`
  (greps raw deleted-tree literals + renamed-away roles across the imperative layer — catches the
  staleness alias resolution masks), `scan:role-parity` witnessed by the independent on-disk spec
  tree (non-vacuous), `scan:knowledge-coverage`, `scan:skill-hook-coverage`,
  `scan:sprint-hook-coverage` (bidirectional).

## Breaking changes

- **Agent-folder paths changed** (`00-alex/01-adhoc/02-oneshot/03-managers/` → department tree).
  This is internal framework structure; consumer projects receive the new tree via `/warp:update`.
  No consumer-authored content moves. A backup branch (`backup/pre-cutover-2026-06-04`) preserves
  the pre-cutover layout in canonical.

## Schema changes

- None. (Existing schemas — manifest v2, paths v5, hooks-registry v1, decision-policy v1,
  sprint/*/v1 — are unchanged. The role-registry keystone and `sprint-hook-points.json` /
  `skill-hook-points.json` registries are additive.)

## Migrations

- None requiring consumer action. The org-tree cutover and `_knowledge/` migration were
  completed in canonical; downstream products pick up the new structure through the normal
  `/warp:update` apply path.

## Known follow-ons (not blocking; tracked)

- The ε per-agent literal **spawn** increment under `--epsilon-dispatch` is the named ADR-0009
  follow-on; the runtime, invariants, and both dispatch-record paths are real on `main` today.
- Older framework backlog (ED-009/010/011/012/…; RI-001 Windows-CRLF false-RED, RI-004
  build-chain reap) remains ordinary backlog, surfaced through the standing tracker.

## Pinned commit

Captured at release-build time (recorded in release.json#commit after
`scripts/warpos/release-build.js` runs).
