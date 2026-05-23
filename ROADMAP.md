# WarpOS Roadmap

<!-- Dual identity:
     - In canonical WarpOS (this repo), ROADMAP.md is the framework backlog.
     - In downstream consumer projects, ROADMAP.md is the consumer's product
       roadmap. Consumers receive a clean scaffold from
       `scripts/warpos/generate-roadmap-scaffold.js` (which encodes the
       scaffold as an inline JS string, independent of this file).
     - Sync is ONE-WAY (canonical → product) via /warp:setup + /warp:update.
       Products never push back to canonical. The consumer's ROADMAP.md is
       owned by the consumer; canonical ROADMAP.md is never propagated. -->

## Strategy

WarpOS exists to help the maintainer ship real products faster while extracting reusable open-source automation as a byproduct. The near-term roadmap prioritizes **trust and distribution integrity**: never leak product data, never ship broken installs, and reduce friction across portfolio repos. Work that does not unblock product shipping or public framework reliability stays parked.

**Architectural framing (2026-05-22).** WarpOS is a **managed configuration layer over the host project's `.claude/` interface**, not a content blob. The framework's source-of-truth lives at `_warpos/` in every installed product; `.claude/` is the *compiled runtime interface* Claude Code consumes. Ownership is declared by `_warpos/MANIFEST.json`, not by path prefix. Sync is **one-way**: canonical WarpOS → products via `/warp:setup` + `/warp:update`. Products never push back — there is no upstream channel of any kind (no `/warp:promote`, no `/warp:flag`, no `warpos-to-update.md` ledger). Discoveries flow into canonical exclusively through the maintainer's own judgment: read the products you maintain, act in canonical directly via `/roadmap:add`. *(Origin: 2026-05-22 codex consults on identity simplification + tool-mandated paths.)*

**Cadence rule.** After two consecutive WarpOS infrastructure sprints, the next sprint must ship product value in a real portfolio product (Jobzooka, DreamTeam, future). Any framework work must name the product blocker it removes; framework work without a named product blocker goes to Later. *(Origin: 2026-05-21 codex product-lead review — 8 framework sprints / 0 product-delivery sprints in the prior 10 days was the warning sign that prompted the rule.)*

**Reading the backlog.** Sections are ordered by urgency, not by phase: **Now** = current sprint window (boundary + identity and install integrity are the trust-blockers; everything else waits); **Next** = ready when Now empties; **Later** = parked with named conditions for revival; **Archive Index** = research notes + postmortems that informed decisions but are not active backlog. The legacy `Phase 1/2/3/4` structure was retired 2026-05-21 — historical items either shipped (preserved in version-history sections) or were absorbed into Now / Next / Later.

**Lifecycle tags** on backlog entries: `[open]`, `[in-progress]`, `[fixed-local]`, `[shipped]`, `[duplicate]`, `[blocked]`, `[deferred]`, `[parked]`. *(2026-05-22: `[promote-ready]` and `[promoted]` retired alongside `/warp:promote` deletion — fixes now move directly from `[fixed-local]` to `[shipped]` via canonical release, not via product→canonical promote.)*

---

## 🎯 Sprint Pickup Queue (next session)

Three closed sprints (SP-20260522-001/002/003) shipped the architectural core: schema v1 + generator + validator + regenerator + settings compiler + 3 structural gate skills + canonical pre-commit hook + full `/warp:promote` purge. Mechanically the new ownership model works end-to-end against canonical; 183 tests passing across the new path. See "Shipped in SP-20260522-001/002/003" block below for the per-piece breakdown.

**The cadence rule fires next.** Three consecutive framework-infrastructure sprints just closed. Per Strategy line 19, **Sprint 4 MUST be a product-delivery sprint** — shipping concrete user-facing value in a real portfolio product (aiweb, Jobzooka, DreamTeam). No more framework sprints until a product ships.

### Sprint 4 candidates (PRODUCT — cadence-rule required)

Pick ONE at planning. Operator-scoped; the framework cannot self-select.

- **[open] aiweb product-delivery ticket — operator pick.** SP-20260522-003 used a placeholder ("JSON-LD structured-data block for AI-assistant discoverability"). The operator confirmed they're running "several aiweb sprints in parallel" — pick the actual top-priority aiweb feature from that backlog.
- **[open] Jobzooka next-priority feature.** Operator-scoped from the Jobzooka backlog.
- **[open] DreamTeam Phase 1 rebrand sprint** — scoped in SP-20260521-001; was the original product-cadence candidate.

### Sprint 5 candidates (FRAMEWORK — once cadence-rule satisfied)

Once Sprint 4 ships, these are the highest-leverage framework picks:

- **[open] Migration bootstrap script (`scripts/warpos/manifest/bootstrap.js`).** Converts an existing install (Jobzooka, DreamTeam, canonical-as-workspace) to the new architecture: creates `_warpos/`, copies framework-owned content in, generates initial `MANIFEST.json`, updates `settings.json` hook references to `_warpos/hooks/`. Needs canonical-vs-product detection + safe-copy semantics. **Unblocks:** rolling out the new manifest to real products and exercising the regenerator/validator under real load. *(Sprint 1 architecture-core's last mechanical piece.)*
- **[open] Maintainer canonical scrub orchestration.** The maintainer must create a new PRIVATE GitHub repo for WarpOS-as-product specs, move `_requirements/00-canonical/*`, product-titled `_requirements/03-architecture/*`, `_docs/research|briefs|clones|imports/*` into it. Framework can't self-execute (GitHub repo creation + cross-repo file moves require maintainer judgment), but a `/portfolio:new --slug warpos-as-product` followed by a documented checklist would scaffold it. Once done, flip `ROOT_LEAK_PENDING_SCRUB=false` in `framework-purity.js` and the gate starts blocking `_requirements/`/`_docs/` at canonical root entirely.
- **[open] Install & release reliability batch.** Remaining items from SP-20260522-002's "Install & Release Integrity" backlog that didn't ship in this round: rollback snapshot for `/warp:update`, `/warp:update --dry-run + diff` gating writes in all paths, install fixture CI matrix (5 scenarios), idempotent install with per-file status, versioned migrations + user-override tracking wiring into the new schema's `userModified` field, `release-build.js` refuses stale manifest (T-183 deferred), `.claude/manifest.json` always-present + graceful absence in 4 hardcoded callers.

### Sprint 6 candidates (FRAMEWORK polish)

- **[open] `/sprint:full` Beta consultation honesty.** Orchestrator emits placeholder `DECIDE` events without actual `SendMessage` round-trip. Designs needed: either dispatch-from-subprocess pattern (orchestrator runs as `spawnSync`-d node; can't easily reach in-process teammates), or halt-at-each-Beta-boundary with operator-driven consult between phases.
- **[open] `current.yaml#status` lag after `/sprint:full` Phase 5.** Sprint stays at `status: designing`/`releasing` even after the full pipeline runs through retrospective. Probably the `retrospective.js` fall-through (skeleton exit 3) is the missed update site.
- **[open] Three-layer settings compiler — `_warpos/settings/defaults.json` source migration.** Compiler is shipped + 31 tests pass, but `_warpos/settings/defaults.json` doesn't actually exist in canonical yet. Migration: split current canonical `.claude/settings.json` into a defaults layer (framework-shipped) and a local layer (operator-edited), wire `compile.js` into `/warp:setup` + `/warp:update`.
- **[open] `/warp:update --status` wires the validator.** Validator (`validate.js --json`) is ready to consume; need to add `--status` to `scripts/warpos/update.js` and surface the JSON output as a per-file table.
- **[open] Installer ownership manifest hook into `/warp:setup`.** `/warp:setup` should refuse to write any path not enumerated in `_warpos/MANIFEST.json` (or write it and flag as unmanifested coverage gap). Conceptually this IS the manifest generator + validator pair already shipped — needs the actual `/warp:setup` integration.

### Sprint backlog (parked / next-after-next)

See "Next: Skill Reliability" + "Later: Platform Bets" sections later in this file. Nothing in those moves until the cadence rule rotation re-allows infrastructure sprints (so: after Sprint 4 ships product value, Sprint 5 is allowed; after Sprint 5 ships, Sprint 6 needs another product-delivery in between).

### How to pick up

```
/mode:adhoc --turbo                    # spawn fresh team
/sprint:plan "<pick from above>"       # auto-fills SP-id
# read the plan-contract, edit if needed, then:
/sprint:full --sprint <new SP-id> --autonomy aggressive --mode adhoc
```

`/sprint:full` is now honest about halts — it WILL stop after the design scaffold and demand ticket-minting before advancing. That's the correct cadence; don't fight it.

---

## Sprints

Every sprint that has been planned, executed, released, or retrospected — one row per `SP-id`. Sorted reverse chronological. Backed by `.claude/project/sprint/active-sprints.yaml` and per-sprint subdir under `.claude/project/sprint/sprints/<SP-id>/`. See `paths.sprintReference#ledger-discipline` for what writes here.

| Sprint | Title | Status | Started | Closed | Release |
|---|---|---|---|---|---|
| [SP-20260522-005](.claude/project/sprint/sprints/SP-20260522-005/) | /warp:update --status wires manifest validator into per-file table | planning | 2026-05-23T03:34:44.633Z |  |  |
| [SP-20260522-004](.claude/project/sprint/sprints/SP-20260522-004/) | Migration bootstrap script — convert existing WarpOS installs to _warpos/ architecture | planning | 2026-05-23T03:24:38.488Z |  |  |
| [SP-20260522-003](.claude/project/sprint/sprints/SP-20260522-003/) | Maintainer &amp; Product Workflow — .vscode/tasks.json from portfolio registry, /portfolio:open --spawn VS Code preference, aiweb product-delivery ticket (cadence rule) | retrospected | 2026-05-22T05:46:59.393Z | 2026-05-22T23:14:30.000Z |  |
| [SP-20260522-002](.claude/project/sprint/sprints/SP-20260522-002/) | Install &amp; Release Integrity — manifest coverage, dry-run + rollback, idempotent install, framework-views-fresh + framework-purity gates | retrospected | 2026-05-22T05:43:50.057Z | 2026-05-22T23:14:25.000Z |  |
| [SP-20260522-001](.claude/project/sprint/sprints/SP-20260522-001/) | Framework Boundary &amp; Identity — _warpos/ zone, MANIFEST.json, full purge of /warp:promote suite | retrospected | 2026-05-22T05:27:29.796Z | 2026-05-22T23:14:20.000Z |  |
| [SP-20260521-001](.claude/project/sprint/sprints/SP-20260521-001/) | DreamTeams portfolio onboarding — recommended scope (side-by-side repos with manifest) | retrospected | 2026-05-21T20:29:19.656Z | 2026-05-21T22:07:06.127Z |  |
| [SP-20260520-002](.claude/project/sprint/sprints/SP-20260520-002/) | /product:import — generate a Claude/Codex/ChatGPT/Gemini-portable questionnaire to mine product context from another session, then feed /product:bootstrap | planning | 2026-05-21T02:51:01.927Z |  |  |
| [SP-20260520-001](.claude/project/sprint/sprints/SP-20260520-001/) | /product:clone — explore a competitor product across video/web/reviews and emit cloneable requirements (JTBDs, scored features, voc, gaps, opportunities) | planning | 2026-05-21T02:50:56.013Z |  |  |
| [SP-20260519-002](.claude/project/sprint/sprints/SP-20260519-002/) | Polish public-facing repo surface for job-application audience | planning | 2026-05-20T01:04:20.281Z |  |  |
| [SP-20260512-001](.claude/project/sprint/sprints/SP-20260512-001/) | Multi-sprint parallelism for Sprint Workflow | retrospected | 2026-05-12T22:06:32.222Z | 2026-05-13T20:51:59.736Z |  |
| [SP-20260513-001](.claude/project/sprint/sprints/SP-20260513-001/) | /product:bootstrap skill — guided product brief in MD/HTML/DOCX | retrospected | 2026-05-13T06:27:46.887Z | 2026-05-13T22:44:51.964Z |  |
| [SP-20260513-002](.claude/project/sprint/sprints/SP-20260513-002/) | WarpOS install/update provider smoke test + RCA | retrospected | 2026-05-13T06:27:46.887Z | 2026-05-13T22:46:02.308Z |  |
| [SP-20260513-003](.claude/project/sprint/sprints/SP-20260513-003/) | Organic skill use by agents — research + mechanism | retrospected | 2026-05-13T06:27:46.887Z | 2026-05-13T22:47:16.070Z |  |
| [SP-20260513-004](.claude/project/sprint/sprints/SP-20260513-004/) | /sprint:retrospective skill — close-of-sprint reflection | retrospected | 2026-05-13T06:27:46.887Z | 2026-05-13T22:00:13.075Z |  |
| [SP-20260513-005](.claude/project/sprint/sprints/SP-20260513-005/) | Harden /warp:update — preflight + transactional apply + postflight verify | retrospected | 2026-05-13T06:27:46.887Z | 2026-05-13T22:49:26.947Z |  |
| [SP-20260513-006](.claude/project/sprint/sprints/SP-20260513-006/) | Turbo as mode argument — compose /turbo into /mode:{solo,adhoc,oneshot} | closed | 2026-05-14T00:13:27.723Z | 2026-05-14T09:38:36.130Z |  |
| [SP-20260514-001](.claude/project/sprint/sprints/SP-20260514-001/) | Harden WarpOS update pipeline — content-hash + sha256 un-truncation + operator-override + release/apply separation | closed | 2026-05-14T03:58:38.838Z | 2026-05-14T09:48:59.624Z |  |
| [SP-20260514-002](.claude/project/sprint/sprints/SP-20260514-002/) | Enforce sprint routing policy — reviewers, gauntlets, diff_review are aspirational, not enforced | retrospected | 2026-05-14T21:00:14.671Z | 2026-05-14T21:59:47.870Z |  |
| [SP-20260518-001](.claude/project/sprint/sprints/SP-20260518-001/) | /sprint:full — autonomous sprint orchestrator chaining plan→design→execute→release-prep→retro | retrospected | 2026-05-18T17:03:07.054Z | 2026-05-18T20:04:45.397Z |  |
| [SP-20260518-007](.claude/project/sprint/sprints/SP-20260518-007/) | Sprint Goal Verification — regression corpus, AC linkage, ship-gate, /check:ac-coverage | retrospected | 2026-05-18T21:10:30.163Z | 2026-05-19T02:01:42.457Z |  |
| [SP-20260518-008](.claude/project/sprint/sprints/SP-20260518-008/) | Hook & Process Hygiene — format.js prettier spawn fix, lint-hook-output PreToolUse validation, /check:node-procs diagnostic | retrospected | 2026-05-18T21:30:40.942Z | 2026-05-19T02:01:51.007Z |  |
| [SP-20260518-009](.claude/project/sprint/sprints/SP-20260518-009/) | Consolidate ROADMAP.md and WARPOS_ROADMAP.md into single canonical ROADMAP.md (scaffold still shipped from generator) | closed | 2026-05-19T02:32:56.764Z | 2026-05-19T03:10:20.680Z |  |
| [SP-20260519-001](.claude/project/sprint/sprints/SP-20260519-001/) | ROADMAP + RELEASES ledger discipline — repo-root sprint+release ledgers with skill+hook enforcement | planning | 2026-05-19T06:54:10.028Z |  |  |
<!-- ledger:sprints — auto-managed by scripts/sprint/ledger.js. Manual edits are valid but may be overwritten on next /sprint:* invocation. -->

---

## ✅ Shipped in SP-20260522-004/005 (2026-05-23)

Two framework sprints closed via `/sprint:full` in adhoc + aggressive mode. Plus the cadence-rule product sprint (DreamTeam) was verified already-shipped from a prior session.

**Sprint 4 — DreamTeam SP-20260522-001..010 (cadence-rule product sprint, verified already-shipped):**

- **[shipped — verified by background dreamteam dispatch]** DreamTeam's full 10-sprint series (Model + Routing through Docs + Outreach) was implemented in a prior session — commit `8bc1e51` (Model + Routing Tables) + 9 sibling commits land all 10 sprints on the `vlad` branch. `npm test` shows 91/91 passing in `app/app/lib/recommend.test.ts` with the full 8-roles × 4-tiers = 32-cell routing matrix covered with explicit assertions (`recommend.test.ts:54-352`). Cadence rule satisfied. Side finding to surface: dreamteam's `/sprint:full` orchestrator is broken in that repo (missing `paths.sprintFullAutonomy` + `paths.sprintSchemas` keys in `.claude/paths.json`); orchestration infra wasn't installed/promoted into dreamteam during the v0.8.2 push — worth a follow-up to wire those path keys + create the autonomy bundle + schemas dir.

**Sprint 5 — Migration bootstrap script (1 done):**

- **[shipped — SP-20260522-004/T-20260523-193+T-20260523-194]** `scripts/warpos/manifest/bootstrap.js` (~350 lines, no npm deps) — converts a pre-`_warpos/` install (Jobzooka, DreamTeam, canonical-as-workspace) into the new architecture. Mode detection branches on `_warpos/MANIFEST.json` + `framework/` (canonical) vs `_warpos/` absent + `.claude/` present + (`scripts/hooks/` OR `framework-installed.json`) (product). Source canonical-clone discovery: `--source` flag > `framework-installed.json#source` > sibling-clone heuristic (`../WarpOS`, `../warpos`, `../Warpos`). Safe-copy: never overwrites without `--force`; missing files always copied. Settings.json hook-path rewriter substitutes `scripts/hooks/` → `_warpos/hooks/` while preserving permissions/env/matchers/etc. Subprocess invocations of `build.js` (initial MANIFEST.json gen) + optional `regenerate.js` (views) + `validate.js --strict` (clean-state attestation). Exit codes: 0 ok / 1 refused / 2 cli / 3 no-source / 4 copy-fail / 5 manifest-fail / 6 validate-fail. `--dry-run` and `--json` modes. Sibling `scripts/warpos/manifest/test-bootstrap.js`: 47/47 tests pass (canonical refuse, unknown refuse, product happy path, `--force` overwrite, `--dry-run` writes nothing, `--json` emits parseable JSON, `--source` flag honored, sibling-clone discovery, source-discovery failure, settings rewriter idempotency + non-path field preservation, `--skip-views`/`--skip-validate`, `detectMode` pure function tests). Sprint 1 architecture-core's last mechanical piece. *(Plan Contract: PC-20260523-0026.)*

**Sprint 6 — `/warp:update --status` wires manifest validator (1 done):**

- **[shipped — SP-20260522-005/T-20260523-195+T-20260523-196]** `scripts/warpos/update.js` gained `runStatusCli()` + `--status` early branch alongside `--rollback`. Spawns `scripts/warpos/manifest/validate.js --json` as subprocess; renders per-class findings table (`DRIFT` / `MISSING` / `UNMANIFESTED` / `USER_MODIFIED` / `SCHEMA_VIOLATION`) with each item's path. Header shows manifest path + root + pathCount + ownerCounts. `--json` mode passes through validator JSON augmented with `mode: "status"`. `--target` flag overrides the audit root. `--strict` passes through to validate.js. `--status` exits 0 when total findings == 0, exits 1 otherwise (CI-friendly: any finding wakes up the gate, not just strict-class). Canonical-fallback: if target lacks `scripts/warpos/manifest/validate.js`, falls back to invoking the canonical install's copy. Usage message updated. `runStatusCli` exported. Sibling `scripts/warpos/test-status-cli.js`: 19/19 tests pass (clean fixture human + JSON, drifted fixture human + JSON, `--target` flag, `--strict`, canonical-fallback when target lacks validate.js, ownerCounts surfaced, findings table renders). *(Plan Contract: PC-20260523-0027.)*

**Bonus hygiene (this session, orthogonal to the two sprints):**

- **[shipped]** `_warpos/MANIFEST.json` regenerated 1939 → 1997 paths (includes new bootstrap.js + test-bootstrap.js + test-status-cli.js + sprint artifact entries). `validate.js --strict` reports 0 findings.
- **[shipped]** `.claude/project/sprint/active-sprints.yaml` manually patched: SP-20260522-004 + SP-20260522-005 status updated from `planning` → `retrospected` to reflect actual sprint completion (this is the documented "current.yaml#status lag" bug — orchestrator doesn't update active-sprints registry on phase 5; manual fix until that bug is addressed).
- **[open — discovered this session]** DreamTeam product repo lacks `/sprint:full` orchestration infrastructure — `.claude/paths.json` missing `sprintFullAutonomy` + `sprintSchemas` keys; `paths.sprintFullAutonomy` config not installed; full-reports/checkpoints/plan-contracts/approvals/releases/history/routing dirs absent. Likely a `/warp:update` capsule didn't include the SP-005-era orchestrator. Workaround: dreamteam sprints execute inline. Fix: include orchestrator infra in next capsule.

---

## ✅ Shipped in SP-20260522-001/002/003 (2026-05-22)

Three sprints retrospected. Total: 10 tickets done, 3 deferred (carried into open items below).

**Sprint 1 — Framework Boundary & Identity** (7 done, 0 deferred):

- **[shipped]** Full purge of the upstream-discovery surface — `/warp:promote`, `/warp:promote-flags`, `/warp:flag`, `warpos-to-update.md`, `.warpos-sync.json`, `.warpos-sync-commit-msg.txt`, supporting scripts (`promote.js`, `promote-flags.js`, `flag.js`, `warpos-promote-scope.js`, `test-warp-flag.js`), 3 obsolete check skills (`warpos-promote-coverage`, `warpos-roundtrip`, `hooks:sync`), and the path-registry keys `warposFlagLedger`/`warposPromotedArchive`/`warposPromoteReports`. Reference sweep across active code + canonical docs. `release-canonical.js` Stage 1 retired as no-op (preserves `--resume-from` numbering). Manifest regenerated; downstream artifacts regenerated. Commits `b82d3b6` + `0abf663`.
- **[shipped]** `_warpos/MANIFEST.json` schema v1 (`schemas/warpos-manifest.schema.json`) — four-class ownership (framework/generated/project/runtime); conditional-required fields via JSON Schema if/then; drift tracking via sha256/installedSha/currentSha/userModified; semantic file classes (fillable/reference/guide/code/config/data). Commit `cb00213`.
- **[shipped]** Manifest generator (`scripts/warpos/manifest/build.js`) — 25 classification rules; refuses unclassified paths by default; computes sha256 for every framework entry; `--root`/`--out`/`--source-prefix`/`--dry-run`/`--json`/`--allow-unclassified` CLI. Self-references in canonical mode (`sourcePrefix=framework`), `_warpos/` source pointers in product mode (`sourcePrefix=_warpos`). 19/19 tests. First-cut manifest at `_warpos/MANIFEST.json` — 1930 paths, 0 unmanifested. Commit `cb00213`.
- **[shipped]** Manifest validator (`scripts/warpos/manifest/validate.js`) — surfaces `missing` / `unmanifested` / `drift` / `user_modified` / `schema_violation` findings; `--strict` upgrades soft findings to exit 1; backs `/check:warpos-manifest-coverage`. 18/18 tests. Commit `bebc79e`.
- **[shipped]** View regenerator (`scripts/warpos/views/regenerate.js`) — copies `_warpos/` sources to `.claude/` views byte-identically; `--check` read-only mode backs `/check:framework-views-fresh`. Canonical-mode self-references handled correctly. 26/26 tests. Commit `b401f74`.
- **[shipped]** Three-layer `settings.json` compiler (`scripts/warpos/settings/compile.js`) — merges `_warpos/settings/defaults.json` + `.claude/settings.local.json` → `.claude/settings.json` with fail-loud conflict detection (`allow_vs_deny`, `hook_command_conflict`); `--check` stale detection ignoring the volatile `_compiledAt` field. 31/31 tests. Commit `74f26fa`.
- **[shipped]** Three structural gates as user-invocable skills: `/check:framework-views-fresh`, `/check:framework-purity`, `/check:warpos-manifest-coverage`. Plus the `framework-purity-guard` PreToolUse Bash hook (registered in `framework/hooks.registry.json`) which intercepts `git commit` commands and exits 2 on violations. Detectors: `root_leak` (`_requirements/`/`_docs/` at canonical root — gated by `ROOT_LEAK_PENDING_SCRUB` until scrub runs), `client_slug` (Jobzooka/DreamTeam/aiweb/companycam with allow-list), `abs_path` (maintainer-home paths with runtime-file allow-list), `promote_relic` (reintroduction of any purged path/token). Commits `74f26fa` + `3f8e58b`.

**Sprint 2 — Install & Release Integrity** (2 done, 1 deferred):

- **[shipped]** GITIGNORE runtime-leak block extended (`scripts/warp-setup.js#runtimeBlock` + canonical `.gitignore`) — `.claude/.session-checkpoint.json`, `.claude/.session-start-commit`, `.claude/project/builds/`. Existing tracked instances untracked via `git rm --cached` (caught by the new purity gate on first run — proof it works).
- **[shipped]** `/check:warpos-manifest-coverage` skill wraps `validate.js --strict` (delivered cross-sprint via Sprint 1's T-192).
- **[open]** `release-build.js` refuses stale manifest — have `release-build.js` run `generate-framework-manifest.js --check` before snapshotting into a capsule. *(Deferred from SP-20260522-002 / T-183.)*

**Sprint 3 — Maintainer & Product Workflow** (1 done, 2 deferred):

- **[shipped]** `/portfolio:open --spawn` `code -n` VS Code preference — when `TERM_PROGRAM=vscode` and `code` is on PATH, prefer `code -n <repoPath>` over `wt`/iTerm/gnome-terminal. New `spawnCodeNewWindow(repoPath)` (Windows uses `cmd /c code -n <path>` to resolve the .cmd shim with `shell:false`); `CODE_ENTRY` inserted at index 0 of all three platform arrays with `requiresEnv: { TERM_PROGRAM: 'vscode' }`; `probeBinary` extended with `envSatisfies` short-circuit. 35 spawn smoke tests including live AC-3.1 verification. *(Shipped by Gamma γ-4 via team dispatch.)*
- **[open]** Generate `.vscode/tasks.json` from portfolio registry — see "Next: Maintainer & Product Workflow" section below for the full spec. *(Deferred from SP-20260522-003 / T-185.)*
- **[open]** aiweb product-delivery ticket — operator pick required. SP-20260522-003 used a placeholder ("JSON-LD structured-data block for AI-assistant discoverability") per the cadence rule but the real aiweb feature should be operator-scoped. *(Deferred from SP-20260522-003 / T-187.)*

**Bonus fixes shipped this session (orthogonal to the three sprints):**

- **[shipped]** `/sprint:full` honest halts — Phase 2 (design) halts `tickets_pending` after the scaffold; Phase 3 (execute) halts `no_tickets_ready` when zero tickets are ready AND none done/deferred; Phase 4 (release-prep) halts `no_tickets_done`. Resume-aware (Phase 2 skips when tickets exist). The orchestrator can no longer claim sprint=done on a hollow run. 54 sprint-full integration tests pass. Ghost release `RL-20260522-017` from the hollow run marked `status: aborted` with `rollback_reason` (audit trail preserved).
- **[shipped]** `design.js` scaffold no longer truncates `granular_story_candidates` — extracted `buildGranularStoriesBody()` to iterate the full candidates array; template uses `{{granular_stories_body}}`. *(Beta β-4.)*
- **[shipped]** `/sprint:full` final-report ticket counts read from `current.yaml#tickets.*` instead of empty in-memory `state.tickets`. Reports now enumerate IDs (e.g. `Done: 1 (T-20260522-186)`). Added Released line + `tickets_released` field to the `sprint_full_done` emit. 6 new test assertions. *(Gamma γ-4.)*
- **[open]** `/sprint:full` Beta consultations are still placeholder `DECIDE` events — the orchestrator emits the event without actually `SendMessage`-ing Beta. Honest halt approach pending a dispatch-from-subprocess design (orchestrator runs as `spawnSync`-d node, can't easily message in-process teammates). Until then the Beta consultation cadence in `_docs/sprint/AUTONOMY.md` is aspirational, not enforced. *(Discovered during SP-20260522-001 orchestrator hardening; file as a follow-up to honest_halts work.)*
- **[open]** `current.yaml#status` lags `/sprint:full`'s actual phase completion — sprint stays at `status: designing` even after the full pipeline runs through Phase 5. The retrospective.js fall-through (skeleton exit 3) is probably the missed update site. *(Discovered during SP-20260522-001/002/003 retros.)*
- **[open]** Migration bootstrap script for `_warpos/` zone in existing products (`scripts/warpos/manifest/bootstrap.js`) — converts an existing install (Jobzooka, DreamTeam, canonical-as-workspace) to the new architecture by creating `_warpos/`, copying framework-owned content in, generating initial `MANIFEST.json`, and updating `settings.json` hook references to point at `_warpos/hooks/`. Needs careful canonical-vs-product detection + safe-copy semantics; best done in a dedicated session. *(Sprint 1 scope; intentionally not in T-180-T-192 batch.)*

---

## Now: Framework Boundary & Identity

Sprint-1 target. Reason: WarpOS today has no enforced shape that distinguishes "framework files" from "product files" inside a single checkout, and `/warp:promote` enables a bidirectional sync that has already leaked maintainer product data (Jobzooka-titled files) into the publicly-pushed canonical clone. The fix is structural, not procedural: delete bidirectional sync, adopt a managed-config-layer architecture, declare ownership in a manifest, and physically separate the maintainer's product-thinking from canonical. *(Origin: 2026-05-22 codex consults on identity simplification + tool-mandated paths; supersedes the prior `.framework/` co-located-mirror plan.)*

> **Status note (post-SP-20260522-001):** The mechanical core of this section is shipped — schema v1, generator, validator, regenerator, settings compiler, two structural gates, the canonical pre-commit guard. See the "✅ Shipped in SP-20260522-001/002/003 (2026-05-22)" block above for the per-piece breakdown. The remaining work is (a) the migration bootstrap script that populates `_warpos/` in installed products, (b) wiring `installer ownership manifest` into `/warp:setup`, (c) wiring `/warp:update --status` consumption of the validator, and (d) the maintainer's canonical scrub — moving WarpOS-as-product specs into a new private repo. Items (a)-(c) are framework code; (d) is a maintainer action that the framework cannot self-execute.

**The new model in one sentence.** Canonical WarpOS contains only framework source. Installed products treat `_warpos/` as the framework source-of-truth zone and `.claude/` as the compiled runtime interface; `_warpos/MANIFEST.json` declares per-path ownership. Sync is one-way (canonical → product) with **no upstream channel of any kind** — `/warp:promote`, `/warp:promote-flags`, `/warp:flag`, and `warpos-to-update.md` are all being purged. Discoveries reach canonical exclusively through the maintainer reading the products they maintain and writing into canonical ROADMAP via `/roadmap:add`.

**[shipped — SP-20260522-001/T-180, commits `b82d3b6`+`0abf663`] Full purge of the upstream-discovery surface — `/warp:promote`, `/warp:promote-flags`, `/warp:flag`, `warpos-to-update.md`.** All four are relics of the pre-canonical era when WarpOS was developed *inside* a product workspace and product→canonical propagation was the only path back. With WarpOS now in its own canonical clone, there is no upstream channel — discoveries flow into canonical through the maintainer's own judgment (read the products, act in canonical directly via `/roadmap:add`). Strip the surface from EVERYWHERE: canonical repo, GitHub, all installed products (purge propagates via `/warp:update` once the manifest drops the paths).
>
> **A. Skills to delete (canonical `.claude/commands/warp/`):**
> - `promote.md`
> - `promote-flags.md`
> - `flag.md`
>
> **B. Scripts to delete (canonical `scripts/`):**
> - `scripts/warpos/promote.js`
> - Anything else under `scripts/warpos/` that exists solely to support promote (audit `release-canonical.js` — keep the framework-snapshot stages, drop any promote calls; inline what's needed for canonical-side `/warp:release`).
>
> **C. Root files to delete:**
> - `warpos-to-update.md` (the deprecated-but-still-tracked flag ledger)
> - `warpos-promoted-archive.md` (if present — never propagated)
> - `.warpos-sync.json`, `.warpos-sync-commit-msg.txt` (promote-era sync stamps written by `promote.js`)
> - `.warpos/promote-reports/` directory (per-run promote output, runtime-only but exists on disk)
>
> **D. Path registry cleanup:**
> - Remove keys from `framework/paths.registry.json`: `warposFlagLedger`, `warposPromotedArchive`, `warposPromoteReports`.
> - Regenerate downstream artifacts: `.claude/paths.json`, `scripts/hooks/lib/paths.generated.js`, `schemas/paths.schema.json`, the `lintRules` block in the registry. Drop any `path-lint` warn/critical entries that pointed at these keys.
> - Drop the corresponding rows from `_requirements/03-architecture/PATH_KEYS.md` (or remove the doc entirely if `_requirements/03-architecture/` itself is being lifted into `_warpos/reference/` per the canonical scrub).
>
> **E. Reference sweep (audit + clean — grep for `warp:promote`, `warp:flag`, `warp:promote-flags`, `warpos-to-update.md`, `warposFlagLedger`, `warposPromote*`, `FRAMEWORK_PREFIXES`, `EXCLUDE_PREFIXES`, `TEMPLATE_REVIEW_PATHS`):**
> - Root docs: `CLAUDE.md`, `AGENTS.md`, `PROJECT.md`, `README.md`, `USER_GUIDE.md`, `DICTIONARY.md`, `RELEASES.md`.
> - All remaining `.claude/commands/**/*.md` (skill docs that reference these slash commands in passing).
> - All `scripts/hooks/**/*.js` (any hook that lints or guards promote-era patterns).
> - All `.claude/agents/**/*.md` (agent specs mentioning promote/flag).
> - All `.claude/project/reference/**/*.md` (cross-reference docs).
> - All hook docs under `scripts/hooks/` README-style or commentary.
> - `.gitignore` — drop entries that exist only because of promote-era artifacts (`.warpos/promote-reports/`, etc.).
>
> **F. Products (Jobzooka, DreamTeam, future) — purge via `/warp:update`:**
> - The manifest-driven `/warp:update` removes any installed path no longer present in canonical's `_warpos/MANIFEST.json`. Once canonical drops `flag.md`, `promote.md`, `promote-flags.md`, the next product update deletes them automatically. Same for `warposFlagLedger`/`warposPromote*` keys in the regenerated `.claude/paths.json`.
> - **`warpos-to-update.md` in products is treated as user data, not framework data.** Some products may have local notes in this file. `/warp:update` does NOT silently delete it. On the first update post-purge, print a one-time deprecation notice: "`warpos-to-update.md` is deprecated. The framework no longer reads or writes this file. Move any content you want to keep into your own notes; delete the file when ready." On subsequent updates, leave it alone if still present.
>
> **G. GitHub (canonical):**
> - Delete `warpos-to-update.md` in a normal commit (no history rewrite — the file's content is the deprecation header plus some migrated entries that already moved into ROADMAP.md).
> - Push. After the commit lands, the file is gone from `main` and from any further `/warp:setup` of canonical into a new product checkout.
> - No filter-repo / no force-push. The historical commits where promote/flag existed stay in history (they're not secrets, just relics).
>
> **H. Pre-commit / canonical guard (closing the door):**
> - `/check:framework-purity` (already on the Install & Release Integrity backlog) refuses any future commit that reintroduces files named `promote.js`, `flag.md`, `promote-flags.md`, `warpos-to-update.md`, or that adds skill/doc bodies referencing those slash commands. Deletion is also a contract.
>
> **Acceptance criteria for the purge sprint:**
> - `grep -rn "warp:promote\|warp:flag\|warpos-to-update" .` in canonical returns zero hits outside `ROADMAP.md` (Archive Index reference) and the version-history sections.
> - `find . -name "warpos-to-update.md" -o -name "promote.js" -o -name "promote.md" -o -name "promote-flags.md" -o -name "flag.md"` in canonical returns zero hits.
> - First-install of post-purge canonical into a fresh product writes zero promote/flag files.
> - `/warp:update` of an existing product (Jobzooka) removes the promote/flag files automatically.

**[shipped — SP-20260522-001/T-188+T-189+T-190, commits `cb00213`+`bebc79e`+`b401f74`] `_warpos/` source-of-truth zone + `MANIFEST.json` ownership.** Schema v1, generator (`build.js`), validator (`validate.js`), and regenerator (`regenerate.js`) all shipped with 63 tests. First-cut MANIFEST emitted to `_warpos/MANIFEST.json` (1939 paths, 25 rules, 0 unmanifested). Migration bootstrap script for existing installs is the last remaining piece — see "Sprint 5 candidates" in Pickup Queue at top. ORIGINAL SPEC PRESERVED BELOW for the bootstrap script's reference. Installed products gain one new top-level directory: `_warpos/`. It holds the framework's source-of-truth and the manifest. Tool-mandated paths (`.claude/commands/`, `.claude/agents/`, `.claude/settings.json`) become compiled views generated from `_warpos/` at install/update time.
>
> **End state — installed product layout:**
> ```
> Jobzooka/
>   src/, package.json                 ← product code
>   _requirements/                     ← PRODUCT-owned content (filled CORE_BRIEF, etc.)
>   _docs/                             ← PRODUCT-owned docs
>   _warpos/                           ← FRAMEWORK source-of-truth
>     MANIFEST.json                    (per-path owner/source/sha256/class)
>     commands/                        (source of skills)
>     agents/                          (source of agent specs)
>     hooks/                           (hook JS code, referenced by path)
>     schemas/
>     templates/                       (master templates for _requirements/, _docs/)
>     settings/defaults.json           (framework default settings layer)
>     reference/                       (framework reference docs)
>     BASELINE/                        (frozen install-time copies for 3-way diff)
>       _requirements/
>       _docs/
>   .claude/                           ← COMPILED RUNTIME INTERFACE
>     settings.json                    (GENERATED from defaults + local.json — never edit)
>     settings.local.json              (per-project override layer — edit THIS)
>     commands/                        (regenerated views of _warpos/commands/)
>     agents/                          (regenerated views, except project+runtime files below)
>       00-alex/
>         .system/
>           policy/decision-policy.md  (project-owned per MANIFEST; seeded once, never overwritten)
>           beta/events.jsonl          (runtime-owned per MANIFEST; never touched on update)
> ```
>
> **End state — canonical WarpOS layout (this repo, post-scrub):**
> ```
> WarpOS/
>   framework/                         (framework source — commands, hooks, agents, templates, schemas, reference, settings)
>   scripts/                           (release/build tooling — not shipped to products as framework)
>   tests/
>   CLAUDE.md  AGENTS.md  ROADMAP.md  RELEASES.md  README.md
>   ❌ NO _requirements/ at root
>   ❌ NO _docs/ at root
> ```
> If a contributor adds a file to canonical's `_requirements/`, the canonical pre-commit guard refuses the commit. Different shape = different role; you can `ls` and know in one second whether a repo is canonical or installed.
>
> **`_warpos/MANIFEST.json` schema (sketch):**
> ```json
> {
>   "paths": {
>     ".claude/commands/fix/fast.md": {
>       "owner": "framework", "managed": true,
>       "source": "_warpos/commands/fix/fast.md", "sha256": "abc..."
>     },
>     ".claude/agents/00-alex/.system/policy/decision-policy.md": {
>       "owner": "project", "managed": false,
>       "seeded_from": "_warpos/templates/policy/decision-policy.md"
>     },
>     ".claude/agents/00-alex/.system/beta/events.jsonl": {
>       "owner": "runtime"
>     },
>     ".claude/settings.json": {
>       "owner": "generated",
>       "compiled_from": ["_warpos/settings/defaults.json", ".claude/settings.local.json"]
>     },
>     "_requirements/00-canonical/CORE_BRIEF.md": {
>       "owner": "project", "managed": false,
>       "seeded_from": "_warpos/BASELINE/_requirements/00-canonical/CORE_BRIEF.md",
>       "class": "fillable"
>     }
>   }
> }
> ```
> Ownership classes — `framework` (managed copy, byte-identical to source), `generated` (compiled from layered inputs), `project` (seeded once, then user-owned), `runtime` (written by hooks/sessions, never touched on update).

**[shipped — SP-20260522-001/T-190, commit `b401f74`] Generated-view discipline for tool-mandated paths.** `scripts/warpos/views/regenerate.js` reads `_warpos/MANIFEST.json` and rebuilds `.claude/commands` + `.claude/agents` byte-identical from `source` pointers (or no-ops in canonical mode where source === path). `/check:framework-views-fresh` wraps `--check`. 26/26 tests. Claude Code reads from `.claude/commands/`, `.claude/agents/`, `.claude/settings.json` — paths WarpOS cannot relocate. Approach: source-of-truth in `_warpos/`, **byte-identical generated copies** at the tool-mandated paths, both committed to git.
> - **Git policy:** commit both `_warpos/commands/foo.md` AND `.claude/commands/foo.md`. PRs show the actual runtime surface; reviewers can diff what Claude Code will read.
> - **CI gate `/check:framework-views-fresh`:** regenerates from `_warpos/` and fails the build if `.claude/commands/` or `.claude/agents/` is stale.
> - **Documented:** "human edits to `.claude/commands/` and `.claude/agents/` are overwritten by `/warp:update`" — predictable, surfaced in skill docs.
> - **Hooks need no view.** `scripts/hooks/*.js` becomes `_warpos/hooks/*.js`; `.claude/settings.json` references hooks by path. No duplication needed because hooks are invoked-by-path, not read-as-content.

**[shipped — SP-20260522-001/T-191, commit `74f26fa`] Three-layer `settings.json` compiler.** `scripts/warpos/settings/compile.js` ships with fail-loud conflict detection (allow_vs_deny, hook_command_conflict), `--check` stale detection, 31/31 tests. `_warpos/settings/defaults.json` source migration is Sprint 6+ work (current canonical `.claude/settings.json` needs to split into defaults+local layers). `.claude/settings.json` is the file Claude Code reads, but its defaults are framework-shipped and its overrides are per-project. Compile deterministically at install/update time:
> 1. Read `_warpos/settings/defaults.json` (framework defaults for this WarpOS version).
> 2. Read `.claude/settings.local.json` (project overrides — user edits THIS).
> 3. Produce `.claude/settings.json` (generated effective state — do not edit).
> 4. Preserve unknown user-override keys only in the override file, never by editing generated output.
> 5. **Fail loudly** on conflicts where two layers define incompatible hook commands or permissions; do not silently pick a winner.

**[open] Canonical scrub: move WarpOS-as-product specs to a private workspace.** Public canonical WarpOS (`github.com/cygaco/WarpOS`) is framework source ONLY. The maintainer's clone today doubles as a Jobzooka/DreamTeam product workspace — that's how `_requirements/03-architecture/API_SURFACE.md` titled "Jobzooka — API Surface" ended up in the publicly-pushed repo. Required moves:
> 1. Create new **private** repo for "WarpOS-as-product" — the maintainer's own filled product brief about WarpOS-the-tool. Same structure as Jobzooka/DreamTeam (uses `/warp:setup` to install the framework into itself).
> 2. Move from canonical → new private workspace: `_requirements/00-canonical/*` (filled product content), `_requirements/03-architecture/*` (anything titled "Jobzooka — *" or product-specific), `_docs/research/*` (product research), `_docs/briefs/*`, `_docs/clones/*`, `_docs/imports/*`, anything else with client slugs or product-instance content.
> 3. What canonical KEEPS at `_requirements/` and `_docs/`: **nothing.** Those directories don't exist at root after scrub. Their roles split into `_warpos/templates/` (master seeds shipped to products) and `_warpos/reference/` (framework reference docs).
> 4. Maintainer workflow changes: framework dev in canonical; product-thinking about WarpOS-the-tool in private workspace. Same separation Jobzooka and DreamTeam already have.

**[in-progress — 3 of 5 shipped in SP-20260522-001, commits `74f26fa`+`3f8e58b`] Five structural gates (manifest-driven).** Shipped: (1) canonical pre-commit guard (`framework-purity-guard` PreToolUse Bash hook), (2) `/check:framework-purity` (4 detectors), (5) `/check:framework-views-fresh`. Plus `/check:warpos-manifest-coverage`. Pending: (3) installer ownership manifest hook into `/warp:setup` (the manifest generator + validator pair already exists; needs `/warp:setup` integration), (4) `/warp:update --status` consumption of `validate.js --json` output as a per-file table. All five gates consult `_warpos/MANIFEST.json` as ownership source-of-truth; path prefix alone is insufficient.
> 1. **Canonical pre-commit guard** — refuses any `git add` to `_requirements/` or `_docs/` in canonical. Hard block. Refuses any reintroduction of `scripts/warpos/promote.js` or `FRAMEWORK_PREFIXES`/`EXCLUDE_PREFIXES` patterns.
> 2. **Canonical CI poison scanner (`/check:framework-purity`)** — rejects commits/PRs containing client slugs (`Jobzooka`, `DreamTeam`, future products), maintainer abs paths, product spec titles. Last line of defense against human-typed leaks.
> 3. **Installer ownership manifest** — every file `/warp:setup` writes is listed in the new install's `_warpos/MANIFEST.json` with explicit owner. Install fails if it would write a path outside the manifest.
> 4. **Update drift check (`/warp:update --status`)** — `.claude/` generated views match `_warpos/` sources (sha256 from manifest); `_warpos/BASELINE/` matches the seed-manifest from canonical; project-owned files flagged for review only when their seed has changed.
> 5. **Generated-views freshness CI gate (`/check:framework-views-fresh`)** — regenerates `.claude/commands/` and `.claude/agents/` from `_warpos/`; fails if the on-disk copies don't match. Catches "edited generated view, forgot to update source."

**[open — Sprint 5 candidate] Migration plan (existing installed products).** Jobzooka, DreamTeam, and the maintainer's current canonical-as-workspace need a one-time migration. **Implementation note:** all infrastructure to support this migration is now in place — `scripts/warpos/manifest/build.js` will produce the MANIFEST, `validate.js` will check coverage, `regenerate.js` will materialize views. The missing piece is the bootstrap orchestrator (`scripts/warpos/manifest/bootstrap.js` per Pickup Queue § Sprint 5).
> 1. Create `_warpos/` directory at product root.
> 2. Move framework-owned content into `_warpos/`: copy `scripts/hooks/` → `_warpos/hooks/`; treat `.claude/commands/` and `.claude/agents/` as committed generated views (don't move, regenerate).
> 3. Generate initial `_warpos/MANIFEST.json` from current install state.
> 4. Migrate any pre-existing `_requirements/.framework/` content (if Pattern C′ had been partially rolled out) → `_warpos/BASELINE/_requirements/`.
> 5. Update `.claude/settings.json` references: hooks now at `_warpos/hooks/foo.js`, not `scripts/hooks/foo.js`.
> 6. Run `/check:framework-views-fresh` and `/check:framework-purity` to verify the migration.

**[deferred] Pattern C′ (`_requirements/.framework/` hidden mirror).** Earlier proposed approach using a hidden `.framework/` sibling inside `_requirements/`. Superseded by the `_warpos/`-zone design above. The 3 file classes (`fillable`/`reference`/`guide`) and the staleness-classification UX (`STALE`/`DRIFT`/`LOCAL-DRIFT`/`CURRENT`/`MISSING`) are reused inside `_warpos/BASELINE/`, but the storage moves from the hidden sibling to the visible `_warpos/` zone. Codex (2026-05-22 simplification consult) verdict: "`.framework/` inside `_requirements/` is too clever; preserves the ambiguity at the exact place you're trying to remove it." Frozen here for traceability; do not implement.

---

## Now: Install & Release Integrity

Sprint-2 target. Reason: dreamteam's first sprint hit a manifest gap that broke `/mode:adhoc --turbo` despite `framework-installed.json` claiming a complete install. The pattern recurs — installs claim completeness, manifest snapshots get stale, capsules drift from source. **Make WarpOS installs boring.** *(Codex stay-simple consult 2026-05-21: per-product install reliability is the bottleneck, not control-plane architecture. Central-mode is a second-order optimization — see Later: Platform Bets.)*

> **Status note (post-SP-20260522-002):** Manifest infrastructure shipped (generator + validator + coverage check). GITIGNORE runtime-leak shipped. Remaining items below (release-build stale-manifest refusal, dry-run + diff, rollback snapshot, install fixture CI matrix, idempotent install with per-file status, versioned migrations wiring, `.claude/manifest.json` always-present, release-build provenance) are the "Install & release reliability batch" referenced in the Sprint Pickup Queue at top — Sprint 5+ candidates once the cadence-rule product sprint ships.

**[fixed-local] Manifest generator missed 15 `scripts/` subdirs + `mode-set.js`.** Root cause: `scripts/generate-framework-manifest.js#ASSET_DIRS` enumerated only 18 of 35 `scripts/` subdirs. The 15 missing back installed skills: `check/`, `docs/`, `events/`, `fix-deep/`, `learn/`, `lib/`, `linters/`, `manifest/`, `maps/`, `portfolio/`, `product/`, `research/`, `schemas/`, `system/`, `turbo/`. Plus `scripts/mode-set.js` missing from `TOP_LEVEL_SCRIPTS`. Plus dead `{ src: "requirements", kind: "requirement" }` entry pointing at a directory renamed long ago to `_requirements/`. Symptom: dreamteam `/mode:adhoc --turbo` failed despite `framework-installed.json` claiming complete install. Fix shipped 2026-05-21 in `scripts/generate-framework-manifest.js`; manifest regenerated 604 → 670 assets. dreamteam manually patched same-day. The two intentionally-excluded dirs (`one-off/`, `products/`) are framework-dev artifacts and should NOT ship. **Ship with next release** (promote-ready tag retired alongside `/warp:promote`).

**[shipped — SP-20260522-001/T-192, commit `3f8e58b`] Manifest-coverage regression check.** `/check:warpos-manifest-coverage` skill wraps `validate.js --strict`; surfaces `unmanifested`, `missing`, `drift`, `user_modified`, `schema_violation` findings. 18/18 validator tests; --strict promotes soft findings to exit 1.

**[open] `release-build.js` refuses stale manifest.** Have `release-build.js` itself run `generate-framework-manifest.js --check` before snapshotting into a capsule; refuse if stale. Closes the "capsule artifacts get out of sync with source-of-truth" bug family originally seen during the 0.1.2 cut. `release-canonical.js` stage 4 covers the product-driven flow but direct `node scripts/warpos/release-build.js <v>` does not.

**[open] `.claude/manifest.json` always-present at install + graceful absence in callers.** `paths.manifest` resolves to `.claude/manifest.json`; four CLIs hardcode it (`scripts/agents/cli.js test --all`, `scripts/manifest/cli.js`, `scripts/dispatch/manifest-patch.js`, `scripts/delta-canonical-dispatch-smoke.js`) and exit 1 with `manifest.json missing or unreadable`. Live dispatch survives via `DEFAULT_AGENT_PROVIDERS` fallback in `providers.js`, but audit CLIs are dead. Fix: (1) generate minimal manifest at install-time seeded from `DEFAULT_AGENT_PROVIDERS`; (2) tolerate absence in the four callers, warn + fall through to defaults. *(DISCOVERED-2026-05-11)*

**[open] `release-build` post-update check provenance.** Resolve the 0.1.4-era bug class: capsule `release.json#postUpdateChecks` references files the consumer's `update.js` doesn't actually copy. Three hypotheses to triage (old update.js with brittle `../..` resolution / status-mapping mismatch `degraded` vs `failed` / capsule-vs-source provenance gap where capsule snapshots manifest but not source). Pick one, ship a fix, regression test. *(REPORTED-2026-05-02)*

**[shipped — SP-20260522-002/T-184, commit `74f26fa`] Runtime-leak `.gitignore` gap.** `scripts/warp-setup.js#runtimeBlock` extended with `.claude/.session-checkpoint.json`, `.claude/.session-start-commit`, `.claude/project/builds/`; mirrored into canonical `.gitignore`. Existing tracked instances untracked via `git rm --cached` (caught by the new purity gate on first run — proof it works).

**[open] Idempotent install with per-file status reporting.** *(Codex stay-simple must-have.)* Running `/warp:setup` twice produces no destructive changes and reports per-file: `unchanged / repaired / added / conflict`. Today the installer reports counts but not per-file state — a user can't tell which files were touched without `git diff`.

**[open] Update dry-run + diff.** *(Codex stay-simple must-have.)* `/warp:update --dry-run` shows exactly what will change before applying: framework files, project-local files, user-owned files, conflicts. Today `--dry-run` is parsed but doesn't gate writes in all paths (already partial — see also Skill Reliability `--dry-run` follow-ups).

**[open] Versioned migrations + user-override tracking in `_warpos/MANIFEST.json`.** *(Codex stay-simple must-have.)* Record installed WarpOS version, schema version, migration history, **and per-file dirty/local-override flags**. The current `framework-installed.json` partially covers version + installedAt + counts but lacks override tracking — a file modified by the user gets silently overwritten on next update because we don't know it was customized. New manifest unifies this with ownership declarations: each path entry carries `owner`, `managed`, `installedSha`, `currentSha`, `userModified` so `/warp:update` can refuse to overwrite drift without explicit confirmation.

**[shipped — SP-20260522-001/T-188+T-189, commits `cb00213`+`bebc79e`] `_warpos/MANIFEST.json` generator + validator.** `scripts/warpos/manifest/build.js` (25 rules, 19/19 tests) + `scripts/warpos/manifest/validate.js` (18/18 tests, 5 finding classes, --strict mode). First-cut canonical manifest: 1939 paths, 0 unmanifested.

**[shipped — SP-20260522-001/T-190, commit `b401f74`] Generated-views regenerator.** `scripts/warpos/views/regenerate.js` ships with `--check` read-only mode (backs `/check:framework-views-fresh`). Canonical-mode self-references handled correctly. 26/26 tests. Still needs to be wired INTO `/warp:setup` and `/warp:update` (currently the regenerator works standalone; the install pipeline doesn't yet call it). That wiring is the "Installer ownership manifest hook" Sprint 5+ item.

**[shipped — SP-20260522-001/T-191, commit `74f26fa`] Three-layer `settings.json` compiler.** `scripts/warpos/settings/compile.js` deterministic merge with fail-loud conflict detection (allow_vs_deny, hook_command_conflict). 31/31 tests. Still needs the `_warpos/settings/defaults.json` source migration (split current canonical settings.json into defaults+local) — Sprint 6+ work; see Pickup Queue.

**[shipped — SP-20260522-001/T-191, commit `74f26fa`] `/check:framework-views-fresh` CI gate.** Skill wraps `scripts/warpos/views/regenerate.js --check`. Fails when any owner=framework entry's on-disk content diverges from its `source` pointer. CI integration (running this on every PR) is still a wiring task.

**[shipped — SP-20260522-001/T-191+T-192, commits `74f26fa`+`3f8e58b`] `/check:framework-purity` canonical gate.** `scripts/checks/framework-purity.js` with 4 detectors (`root_leak`, `client_slug`, `abs_path`, `promote_relic`) and 3 allow-lists (`ALLOW_CLIENT_SLUG_PATHS`, `ALLOW_ABS_PATH_PATHS`, `ALLOW_PROMOTE_RELIC_PATHS`). `--diff` mode (default; pre-commit) + `--full` mode (inventory). Wired into pre-commit as the `framework-purity-guard` PreToolUse Bash hook (registered in `framework/hooks.registry.json`). Gate's first real fire was on its own commit — caught by design. `root_leak` is currently gated by `ROOT_LEAK_PENDING_SCRUB=true` until the maintainer scrub runs; flip to `false` after Sprint 5's canonical scrub orchestration to start blocking `_requirements/`/`_docs/` at canonical root entirely.

**[open] Rollback snapshot for `/warp:update`.** *(Codex stay-simple must-have.)* Update creates a restorable snapshot of touched framework files (not git-only — assume users have messy repos with unstaged work). `/warp:rollback <update-id>` reverts framework files to pre-update state without touching user files.

**[open] Install fixture CI matrix.** *(Codex stay-simple must-have.)* Install and update are tested against: clean repo, existing repo with prior WarpOS install, dirty repo with uncommitted changes, old-version repo upgrading multiple versions, repo with intentional user overrides. Today install is tested manually after each release; failures surface in product repos days later.

---

## Next: Maintainer & Product Workflow

Sprint-3 target (closed 2026-05-22). Reason: with privacy + install integrity solid, throughput is the next constraint — the maintainer iterating WarpOS while running product sprints in parallel without context-switching pain. **Per cadence rule, Sprint 3 must also ship at least one product-side delivery in a portfolio product.**

> **Status note (post-SP-20260522-003):** spawn.js `code -n` VS Code preference shipped via Gamma γ-4 dispatch (T-186). VS Code tasks generator + `/portfolio:tasks` skill + auto-hook into portfolio mutation skills deferred to a future sprint window. Aiweb cadence-rule deliverable used a placeholder (JSON-LD structured-data) — the real aiweb feature is a Sprint 4 product-pick candidate (see Pickup Queue at top).

**[open] Generate `.vscode/tasks.json` from portfolio registry.** New `scripts/portfolio/generate-vscode-tasks.js` reads `~/.warpos/portfolio.json`, writes one task per product:

```json
{ "label": "Claude: <slug>", "type": "shell", "command": "claude",
  "options": { "cwd": "<repo_path>" },
  "presentation": { "panel": "new", "reveal": "always", "focus": true } }
```

Hook into `/portfolio:register`, `/portfolio:new`, `/portfolio:adopt` so tasks regenerate after registry mutations. New `/portfolio:tasks` skill for manual regeneration. Result: `Ctrl+Shift+P` → "Run Task" → "Claude: dreamteam" opens an integrated VS Code terminal pane cd'd to the product, with `claude` running — 3 keystrokes per new product session. Single VS Code window stays anchored to WarpOS source while N panes scope to N products.

**[shipped — SP-20260522-003/T-186, commit pushed via Gamma γ-4 dispatch] `/portfolio:open --spawn` prefer `code -n <path>` inside VS Code.** `spawnCodeNewWindow(repoPath)` (Windows uses `cmd /c code -n` to resolve the .cmd shim), `CODE_ENTRY` at index 0 of all three platform arrays with `requiresEnv: { TERM_PROGRAM: 'vscode' }`, `probeBinary` extended with `envSatisfies` short-circuit. 17 new assertions in `scripts/one-off/smoke-spawn.js` (35/35 total) including live AC-3.1 verification on a Windows host with `code` on PATH + `TERM_PROGRAM=vscode`.

**[open] Product-delivery sprint (cadence rule).** Per Strategy cadence rule, Sprint 3 must include at least one product-shipping ticket. Candidates: DreamTeam Phase 1 (rebrand sprint scoped in SP-20260521-001) or Jobzooka next-priority feature. Choose at sprint planning based on which is most blocking. **Refuse to start Sprint 3 without naming a product-delivery ticket.**

**[deferred] VS Code extension `warpos-vscode`.** Sidebar listing portfolio products with status (warpos version, dirty count, last sync, current sprint), click-to-open-terminal pane, file watcher on `portfolio.json` to auto-refresh, optional URI handler `vscode://warpos/openTerminal?slug=X`. ~2-4 hours. Polish layer on top of `.vscode/tasks.json` — defer until the tasks workflow proves itself.

---

## Next: Skill Reliability

Slot for cleaning up skills with known papercuts. Pull into a sprint only when the cadence rule allows another framework sprint.

**[open] `/research:deep` env-file fallback.** Phase 0 prereq check and all 3 engine bash blocks load API keys only from `.env.local`; projects that use `.env` get false-negative "key missing" errors. Fix: load `.env.local` first, fall back to `.env`. Affected: `.claude/commands/research/deep.md`.

**[open] `/research:deep` end-to-end validation OR deprecation.** 728-line skill, untested at this scale, model versions stale. Either validate end-to-end OR deprecate in favor of `/research:simple`.

**[open] `/research:simple` synthesis phase.** Merge per-provider reports into a single `SYNTHESIS.md` deliverable.

**[open] Gemini catalog hygiene.** Remove ghost models `gemini-3.1-flash` and `gemini-3.1-flash-lite` from `scripts/dispatch/catalog.js` (HTTP 404 against v1beta API) and the mirror doc `_requirements/09-integrations/PROVIDER/03-google-gemini.md`. Add a catalog-validation check that periodically pings declared models with a 1-token prompt and flags 404s. *(DISCOVERED-2026-05-11)*

**[open] Redteam default to `gemini-2.5-flash`** with pro-preview as opt-in. `gemini-3.1-pro-preview` hits `TerminalQuotaError` after 1-2 real redteam scans on typical accounts. Either (a) swap default + opt-in flag for pro-preview, OR (b) catch `TerminalQuotaError` in `dispatch-agent.js` and retry on 2.5-flash before falling back to Claude. Diversity preserved either way (both Google). *(DISCOVERED-2026-05-11)*

**[open] `/ui:review` genericize.** Remove hardcoded product names; parameterize design-system path.

**[open] `/retro:context` + `/retro:code` → `/retro:full` modes.** Merge into one skill with mode args.

**[open] `/fav:list` + `/fav:search` → `/fav`.** Merge into one skill with args.

**[open] `/paths:validate` skill.** Verify every key resolves on disk; flag hardcoded paths; suggest consolidations. (`/paths:add` already shipped per skill catalog.)

**[open] Migrate ~80 prose path literals to `paths.*` references.** Skills/agents/docs that mention paths as prose (e.g., "Write to `.claude/project/memory/learnings.jsonl`") → reference `paths.learningsFile` semantically. Long tail; chip away.

**[open] Events retention policy.** `events.jsonl` crosses ~6MB in real-world usage. Compress / roll above threshold. `sleep:deep` handles manually today.

**[open] `--branch` default for installer.** Create `warp/install-<timestamp>` branch, run install there. Refuse install on `main` by default; require `--branch <name>` or explicit `--yes-install-on-main`. Pre-install state snapshot (`git status`, branch, uncommitted count) written into the backup dir.

**[open] Same-name agent collision detection at install.** Scan target `.claude/agents/` for basenames matching WarpOS agent roles (`builder`, `reviewer`, `fixer`, `qa`, `redteam`, `compliance`, `alpha`, `beta`, `gamma`, `delta`); prompt user on collision: keep / rename to `<name>-custom.md` / replace.

**[open] team-guard tiered allowlist.** Alpha can spawn research agents (Explore, Plan, general-purpose); build-chain agents (builder, reviewer, fixer, compliance, redteam, qa, learner) Gamma-only. Currently permissive.

**[open] Spec-propagation closer.** Walk dependent spec nodes via SPEC_GRAPH on `/check:requirements drift`; surface downstream specs that MUST update; fail gauntlet until propagation attested. Design separately before implementation.

**[in-progress] Tracker hygiene — superseded by full purge.** Earlier plan was to deprecate `warpos-to-update.md` in canonical and keep it in products as a local `/warp:flag` ledger. 2026-05-22 decision: full purge instead — `warpos-to-update.md`, `/warp:flag`, `/warp:promote`, `/warp:promote-flags` are all being deleted from canonical and from products. See **Now: Framework Boundary & Identity → "Full purge of the upstream-discovery surface"** for the comprehensive deletion plan. Only remaining hygiene work here: `/roadmap:add` matures into the canonical-side discovery surface (write directly to the relevant ROADMAP subsection with lifecycle tags).

---

## Later: Platform Bets

Items parked until specific conditions change. Listed for orientation, not as a queue. Each entry names its revival trigger.

**[parked] Central-WarpOS multi-product architecture (opt-in only).** User decision 2026-05-21: park until pull-forward trigger fires. *Trigger to pull forward* (codex stay-simple consult 2026-05-21): (1) updating WarpOS across products regularly costs more than 30-60 min/week, OR (2) bugs are repeatedly caused by version drift between product installs, OR (3) maintainer needs cross-product orchestration / reporting / shared memory, OR (4) new-product setup remains painful AFTER install/update reliability work (Sprint 2) ships. Until then, the per-product install model is correct. Codex's design verdict: viable-with-major-caveats; ship as opt-in only, never default. Prerequisite chain (replaces the prior promote-era prerequisites): the `_warpos/`-zone migration must be complete in canonical and at least 2 portfolio products, the `_warpos/MANIFEST.json` schema must be stable across one minor release, and install/update reliability must be measurably boring. Hidden cost curve per codex: per-product cheap at 1-3 products, noticeable at 5, hurts at 8-12 if WarpOS changes weekly, ops problem at 15-20. Real multiplier: `active products × framework change frequency × install drift × debugging ambiguity` — stabilize WarpOS and 20 installs are fine. Captured as frozen RFC at `_docs/research/2026-05-21-central-warpos-rfc.md`; no sprint cycles until trigger fires.

**[parked] npm distribution as forcing function.** Stand up `@warpos/cli` as a parallel distribution path. Building it makes "which current sprints would be wasted under the npm shape?" unavoidable. Three integration paths (cleanest → fallback): Claude Code plugin system, symlinks (Windows-fragile), managed-mirror copy. *Trigger to pull forward:* enumerate current sprints and ask "which would be unnecessary under the npm shape?" — if "most of the meta-work" (release ledger, capsule presence, manifest honesty, ghost cleanup, the now-removed promote dance), npm has signal; if "few", canonical-clone is correct. Full essay archived at `_docs/research/2026-05-19-npm-forcing-function.md`. *(DISCUSSED-2026-05-19.)*

**[blocked] Persistent team UI + TeamCreate --force-replace (upstream Anthropic).** Claude Code does not expose a TeamCreate primitive or persistent team UI panel. `/mode:adhoc` was rewritten 2026-05-14 for honest per-call dispatch. *Trigger to pull forward:* Anthropic ships (a) team-management primitive that creates visible persistent teammates AND (b) `TeamCreate --force-replace` for refresh semantics. See `_docs/phase0/adhoc-primitive-limits.md` § "Future primitive asks". Severity: feature-gap, not a bug.

**[parked] Session recovery improvements.** Crash-recovery contract covers sprint flow but not ambient session resumption (post-`/clear`, harness restart, context compaction). *Trigger to pull forward:* a concrete failure case to anchor the design. *(DEFERRED-2026-05-18.)*

**[parked] Treat WarpOS as a product-in-WarpOS (deep dogfooding gate).** Write PRDs for installer, session-lifecycle, paths-resolution, hook-pipeline. Spec the Alex agent team as a feature with stories. Run `/preflight:run` + `/qa:audit` + `/redteam:full` on WarpOS itself. *Trigger to pull forward:* product cadence is healthier per Strategy cadence rule. Defer until then; otherwise this is the framework eating itself. **Note:** distinct from the "WarpOS-as-product boundary" sprint task in Now: Framework Boundary & Identity — that's about creating a *private workspace* to hold maintainer product-thinking outside canonical, this is about *spec-ing the framework itself* as a product. Boundary first; deep dogfooding much later.

**[parked] Observability + UX polish.** `agent-dashboard.js` as a real browser UI (currently CLI), skill usage counter for pruning, `/warp:tour` v2 interactive walkthrough, `USER_GUIDE.md` split into tutorial + reference. *Trigger to pull forward:* maintainer hits real friction with current observability, OR onboards a second user.

**[parked] Token usage optimization.** Per-agent token tracking, per-provider cost dashboard, prompt compression for cross-provider, prompt cache for system-identity portion, tiered fallback `gpt-5.4 → mini → claude`, per-agent model env-var override. *Trigger to pull forward:* monthly provider spend exceeds a threshold the maintainer cares about, OR cost-sensitive consumer asks for it.

---

## Archive Index

Discoveries, postmortems, and research notes that informed roadmap decisions but are not active backlog. Pointers, not content.

- **`/product:clone` companycam.com run — 16 methodology gaps.** First end-to-end run 2026-05-21. Full postmortem at `_docs/research/2026-05-21-product-clone-companycam-postmortem.md`. The 3 highest-leverage fixes (Capterra pagination, App Store/Play Store reviews, raise internal-URL cap to 12) graduate into Next: Skill Reliability when prioritized.
- **npm-package distribution forcing-function essay.** Archived at `_docs/research/2026-05-19-npm-forcing-function.md`. Decision criterion preserved inline in Later: Platform Bets entry above.
- **Central-WarpOS architecture (frozen RFC).** `_docs/research/2026-05-21-central-warpos-rfc.md` — captures the 2026-05-21 codex consult design. No sprint cycles until the Later: Platform Bets trigger fires.
- **Adhoc primitive limits.** `_docs/phase0/adhoc-primitive-limits.md` § "Future primitive asks" — tracks upstream Anthropic dependencies (persistent team UI, etc).
- **Codex consults from 2026-05-21.** Inputs to the structure-and-park decisions reflected throughout this doc.
    - Multi-product architecture: `.claude/runtime/consult-codex-centralized-warpos.js`
    - Multi-user / privacy (10 leak vectors): `.claude/runtime/consult-codex-multiuser-privacy.js`
    - Roadmap consolidation: `.claude/runtime/consult-codex-roadmap-consolidation.js`
    - Product-lead review: `.claude/runtime/consult-codex-roadmap-product-lead.js`
    - Stay-simple sanity check: `.claude/runtime/consult-codex-stay-simple.js`
- **Codex consults from 2026-05-22 (drove the Now: Framework Boundary & Identity rewrite).**
    - WarpOS identity simplification (`_warpos/`-zone vs Pattern C′): `.claude/runtime/consult-codex-warpos-identity-simplification.js`
    - Tool-mandated paths (generated views + manifest): `.claude/runtime/consult-codex-warpos-tool-mandated-paths.js`
    - Earlier sibling consults that converged on the design: `consult-codex-requirements-colocated.js`, `consult-codex-requirements-framework-folder.js`, `consult-codex-requirements-template-versioning.js`
- **Promote-era / flag-era artifacts preserved for traceability.** `/warp:promote`, `/warp:promote-flags`, `/warp:flag`, and `warpos-to-update.md` are being fully purged in Sprint-1 (Now: Framework Boundary & Identity → "Full purge of the upstream-discovery surface"). The dual `FRAMEWORK_PREFIXES`/`EXCLUDE_PREFIXES` model, the 10-vector pre-promote checklist, `/check:warpos-privacy-leak` design, the privacy fixture-test design, and the per-product local-ledger model are NOT being implemented because the underlying surface they defended/supported no longer exists. Sync is one-way (canonical → products); upstream discovery is the maintainer reading products and writing into canonical ROADMAP via `/roadmap:add`. Reasoning trace at `paths.tracesFile` entry `RT-2026-05-22-warpos-identity-zones`.
- **`production_baseline` + `contract_versioning` gates** — resolved in 0.1.4 by adding generic framework templates to `_requirements/03-architecture/`. Preserved here for traceability.
- **Requirements system templates audit (2026-04-18).** Followed-up by the 0.2.0 rename pass — see Shipped sections below.

---

## ✅ Shipped in v0.2.0 (2026-05-03)

Structural rename pass closing the docs/requirements/warpos naming-confusion class identified in the 2026-05-03 audit.

- **`requirements/` → `_requirements/`**, **`docs/` → `_docs/`**, **`warpos/` → `framework/`** — top-level renames for project-root visibility (underscore-meta sorts to top alongside `.claude/`) and JTBD-clear naming for the distribution capsules.
- **Renumbered requirements chapters**: deleted duplicate `03-requirement-standards/`, slid 04→03, 05→04, …, 09→08, 99-audits→`_audits/`. New chapter `09-integrations/` from the merged docs.
- **Merged `docs/*` framework dirs back into `_requirements/*`** (00-canonical, 01-design-system, 02-copy-system, 04-architecture, audit-reports). `_docs/` now holds only the three project carve-outs: user-communication, research, karpathy-auto-research.
- **`scripts/warpos/promote.js` FRAMEWORK_PREFIXES** expanded to include `_requirements/`, `_docs/`, `framework/` — closes the silent-drop bug that blocked all prior `requirements/`-shape changes from reaching consumers.
- **6 new paths.json keys**: `architectureRoot`, `designSystemRoot`, `auditsRoot`, `integrationsRoot`, `docsRoot`, `frameworkRoot`.
- **paths schema v4 → v5**.
- **4 forward migration scripts** at `migrations/0.1.x-to-0.2.0/` (idempotent — detect already-applied state and no-op).
- **10 new `/check:warpos-*` skills** (5 mechanical fully implemented, 5 reasoned-stubs designed for `/reasoning:run` refinement) so this regression class is impossible going forward.
- **`.gitignore` template additions**: `.warpos/`, `qa-*.png`, `runtime/qa-*/`, `runtime/research/`, `runtime/logs/`, `.claude/.session-start-commit`, `.claude/agents/store.json`, `.claude/project/maps/.stale.json`.
- **Release gates**: 10 green · 3 yellow · 0 red · 1 manual · overall PASS.

## ✅ Shipped in v0.1.4 (2026-05-02)

Cleanup release that closes the gate-blocker chain:

- Generic framework templates added to `_requirements/03-architecture/`:
  PRODUCTION_BASELINE, ACCESSIBILITY_BASELINE, ANALYTICS,
  DISASTER_RECOVERY, RELEASE_READINESS, DEPRECATION_POLICY.
- 3 generic contract templates added to
  `_requirements/03-architecture/contracts/`: USER, SESSION, ROUTING.
  Each declares `id`/`version`/`changeType`/section §7 per
  `contract-versioning.js` requirements.
- First release cut end-to-end via the new product-side
  `/warp:release` skill (all 11 stages green).

## ✅ Shipped in v0.1.3 (2026-05-02)

- Product-side `/warp:release` driver
  (`scripts/warpos/release-canonical.js`).
- `framework-manifest-guard.js` false-positive fix: runs
  `generate-framework-manifest.js --check` before blocking; allows
  multi-stage commits where manifest at HEAD already covers staged
  content.
- `scripts/paths/gate.js` now skips `.warpos/transactions/` (transaction
  records are append-only event logs, not framework code).

## ✅ Shipped in v0.1.2 (2026-05-01)

Patch release closing the architecture-drift loop:

- Installer derives `.claude/paths.json` and per-project warpos version from
  `framework/paths.registry.json` + `version.json` instead of hardcoding.
- New `framework/hooks.registry.json` is the single source of truth for hooks.
  `scripts/hooks/build.js` derives `.claude/settings.json` (hooks block) and
  `scripts/hooks/hook-manifest.json` from the registry. `warp-setup.js` and
  `scripts/hooks/test.js` consume the registry.
- `/warp:update` rewritten: cross-repo aware (`--source`/`--target`),
  robust source-tree-root walk, real migration runner (via
  `migrations-loader.applyAll`), real post-update check execution,
  transaction record + per-file backup, `MERGE_SAFE` no longer pretends a
  merge (customized files are now `MERGE_CONFLICT`).
- `/warp:promote` no longer hardcodes a source-repo name; detects it from
  `manifest.json#project.slug` or `package.json#name`.
- `path-lint.js` extension coverage extended to `ts/tsx/sh/ps1/yml/yaml`
  (was md/js/json only). New `path-literal-allowed` per-line escape.
- `spec-test-staleness.js` reads `paths.specsRoot` (was hardcoded
  <!-- path-literal-allowed: roadmap naming the deprecated literal -->
  `_requirements/04-features` — silent no-op since the rename).
- `release-gates.js` reference-integrity gate marked `manual` (was lying as
  `green`).
- README + USER_GUIDE list `/warp:update` as the primary inbound command;
  `/warp:sync` documented as deprecated alias.

## ✅ Shipped in v0.1.1 (2026-04-18)

The install-hardening batch. Every item below was a ROADMAP entry from 2026-04-17 or 04-18 that now ships in production.

### Installer foundation
- [x] **Ship-manifest system** — `.claude/framework-manifest.json` declares every shippable asset; installer iterates the manifest instead of hand-coded `copyDir` calls. Generator: `scripts/generate-framework-manifest.js`. (205 assets + 9 generated.)
- [x] **Framework-installed snapshot** — target projects get `.claude/framework-installed.json` at install; uninstall walks it exhaustively; re-install diffs old vs new for ghost-file detection.
- [x] **Ghost-file cleanup on re-install** — installer detects files declared by prior install but removed/renamed upstream; `--clean-ghosts` flag removes them.
- [x] **`--dry-run` actually works** — flag was parsed but unused; now prints the full plan (per-kind counts, would-skip existing, would-generate, ghost count) and exits without writes.
- [x] **Installer copy-scope gap closed** — first-install on aiweb missed 46 files (requirements + patterns + maps + top-level scripts). Manifest makes this impossible: if it's in the manifest, the installer sees it.
- [x] **Top-level scripts ship too** — `path-lint.js`, `dispatch-agent.js`, `generate-maps.js`, `generate-framework-manifest.js`.

### Installer UX
- [x] **CLAUDE.md auto-merge** — if target has existing `CLAUDE.md`, installer appends Alex identity with `---` separator; backup kept.
- [x] **AGENTS.md auto-merge** — same pattern; prior behavior silently kept user's AGENTS.md without Alex system, breaking γ dispatch.
- [x] **Restart banner handles both paths** — "already have Claude Code open? close + reopen. not open yet? just open" — replaces the old "YOU MUST RESTART NOW" that confused first-time users.
- [x] **`WARPOS_NEXT_STEPS.md` written at project root** — user references it in the fresh session.
- [x] **`/warp:init` → `/warp:setup`** — resumable state-machine skill; 5 signals checked, only missing steps run. Safe to re-run. `/warp:uninstall` shipped.
- [x] **Pre-install backup** — `.warpos-backup/<ts>/` captures CLAUDE.md, AGENTS.md, .gitignore, .claude/, scripts/hooks/ before any write.

### Hook correctness
- [x] **Hook schema: `type:"command"` required** — installer was writing just `{command}`; Claude Code's validator rejected at launch. Fixed via `cmd()` helper.
- [x] **Single-event keys** — `"Stop|SessionEnd|StopFailure"` pipe-joined was "Unknown hook event"; split into three top-level keys.
- [x] **Per-matcher hook merge** — if user has any pre-existing hook in an event, old logic skipped WarpOS's whole set. Now: append WarpOS hooks into matching matcher, dedup by command string. User's hooks preserved.
- [x] **merge-guard catches `+refspec` force-push** — was only catching `--force` and `-f`; `git push origin +main` bypassed the guard. Fixed.
- [x] **Framework-manifest guard** — PreToolUse Bash hook blocks commits that stage tracked assets without re-staging the manifest. Enforces "regenerate before commit." β DECIDE: block, don't mutate.

### Skills + docs
- [x] **`/discover:systems`** — 6-angle discovery (declarative/structural/behavioral/refgraph/convention/historical).
- [x] **`/warp:uninstall`** — clean removal with restore from `.warpos-backup/`; consumes `framework-installed.json` for exhaustive file list.
- [x] **Attestation events schema** — `cat: "attestation"` in events.jsonl tracks learning → enforcement provenance. One-shot emitters: `scripts/tools/emit-attestation-events.js`, `emit-integrate-events.js`.
- [x] **USER_GUIDE §2 clarity** — modes are project-wide and persistent; adhoc still probes β with just α + user; oneshot is end-to-end-rebuild from requirements.
- [x] **USER_GUIDE §5.6 preflight ELI5** — 7-pass breakdown; ONLY for oneshot.
- [x] **`/sleep:deep` Phase 4 painting MANDATORY** — several cycles had skipped the ASCII art step; now self-check-gated.

### Privacy + public release
- [x] **Repo transitioned private → public** — `cygaco/WarpOS` now public.
- [x] **History scrub via git-filter-repo** — 68 commits rewritten; zero references to private product/repo names in any commit.
- [x] **Redteam audit (4 parallel scans)** — 0 credentials, 0 PII, 0 tracked-but-ignored. IP hygiene scrub landed in 20+ files.
- [x] **smart-context Haiku timeout + payload caps** — was 8000ms on unbounded context; now 15000ms + per-source caps (60 learnings, 20 traces, 20 decisions).
