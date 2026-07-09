# Product Pipeline — Discovery Report (disc-product, 2026-07-09)

## Pipeline map

Idea→screen→launch is REAL end-to-end (scripts + tests); prose only at the seams.
- **spinup** — `scripts/bootstrap/spinup-orchestrate.js` + `phases/`, test `test-spinup-orchestrate.js`. setup→canon→roadmap→paint, idempotent/resumable. REAL, tested.
- **canon** — `scripts/canon/{generate,research,tech-stack,validate}.js` + `test-generate.js`. Degrade-proof AI synthesis, fail-closed. REAL.
- **lastmile** — `scripts/bootstrap/lastmile/` — `orchestrate.js`, 6 phases (audit/plan/inject/execute/handoff/preflight), 8 domain `modules/*.js` (auth/payments/security/database/analytics/deployment/website/crm), `lib/` (detect/score/render/profiles/approval-gates), `test-orchestrate.js`. REAL, module-structured.
- **readiness** — `scripts/scaffold/readiness-report.js` (shared data model; a JOIN of FOUNDERS_CHECKLIST + gates, `.test.js`) + `scripts/cockpit/readiness-board.js` (portfolio aggregator, `.test.js`, read-only/deterministic). REAL.
- **portfolio** — full real suite `scripts/portfolio/*` (new/clone/register/run/spawn/status/sync/adopt/new-lib +tests).
- **ponder** — exploratory prose skill only.

## Founder panel reality

NOT hand-authored HTML anymore — it is **template-generated**. `scripts/scaffold/app.js` (`scaffoldApp()`, `.test.js`) materializes PINNED templates from `_warpos/templates/app-scaffold/src/app/admin/`: `page.tsx`, `guides/[ref]/page.tsx` + `_content/*.md` (8 guides inlined), `readiness/{page,actions,ToggleControl}.tsx`, `lib/admin/{config,store,project-sections}.ts`, `lib/readiness/*`, `lib/telemetry/*`. Dev-preview harness is real: `scripts/admin/{preview,seed}.js` + `admin:*` skills + `framework/admin-panel-registry.json`.
Gaps vs v1 "app + store + generator": **app EXISTS** (frozen pinned template set). **No store** — `lib/admin/store.ts` is a data/telemetry STATE store, not a module marketplace. **No generator** — panel is one frozen template set copied verbatim; no per-product synthesis / add-remove-module generation. Store + generator = greenfield.

## Scanner existence (real grep results)

**NONE of the v1 security/launch scanners exist.** Filename search under `scripts/` for `*route-matrix* *rls* *api-boundary* *env-sep* *demo-data* *service-role*` = **zero hits**. `scripts/security/` contains ONLY `permissions.js` (auth classifier, not a product scanner). `scripts/launch/` **does not exist**. The one content grep hit (`scripts/bootstrap/lastmile/modules/database.js:12`) is a Supabase env-var name list (`SUPABASE_SERVICE_ROLE_KEY`), NOT a scanner. Closest `/scan:*` are `scan:privacy` + `scan:environment` — both framework-internal (WarpOS repo hygiene), NOT product-webapp RLS/route/boundary proofs. So **route-matrix, api-boundary-scan, rls-coverage, live-rls-proof, demo-data-clean, env-separation = 100% greenfield.**

## Guides

24 `_guides/*.md` (23 in `registry.json` + README index). Contract per guide (frontmatter): `guide/anchor/shape(walkthrough|checklist|notice)/timing(project-start|at-module|at-gate|reference)/lead_time`; anchors are `spinup:*` / `lastmile:module|gate/*`. Integrations recorded in `.claude/project/maps/guide-integration.jsonl` (23 records). Enforcer **`scripts/checks/guides-coverage.js` EXISTS** (fail-closed: every guide anchored, registry fresh, every anchor wired live, no phantom/orphan markers; exit 2 = runner error, not pass). **Liveness gap CONFIRMED:** it is NOT wired into `/scan:full` as a gate — no reference in `.claude/commands/scan/full.md` (only a doc mention in `knowledge/coverage.md`). Sibling `scan:admin-suite-coverage` is wired **REPORT-ONLY** (non-gating, per full.md:58). So the guide/anchor contract is enforceable but not enforced on the standing scan.

## Templates

Interim/unbuilt split has **resolved toward `_warpos/`, leaving `framework/templates` a DEAD EMPTY shell** (`find framework/templates -type f` = 0 files). Real content lives in `_warpos/templates/`: `app-scaffold/` (founder panel + Next baseline source), `canonical/`, `lastmile/`, `portfolio/`, `product-bootstrap/`, `product-clone/`, `product-import/`, `report/`, `sprint/`. Resolution via `paths.appScaffoldTemplates` with `_warpos/templates/app-scaffold` fallback (`scripts/scaffold/app.js:37`).

## Per-pack gap list

- **P-FOUNDER-PANEL — PARTIAL.** Exists: template-generated `/admin` app (page/readiness/guides sub-routes), dev-preview harness, readiness data model + cockpit board, FOUNDERS_CHECKLIST scaffold (`scripts/scaffold/founders-checklist.js`, CORE + CONDITIONAL items). Missing: **module store** (marketplace), **panel generator** (per-product synthesis vs frozen template), dynamic guide-set selection. Today = MECH-NEUTRAL scaffold; store/generator greenfield.
- **P-WEBAPP-PRODUCTION-BASELINE — PARTIAL.** Exists: `app-scaffold` ships Next App Router + Tailwind v4 + shadcn/ui + telemetry + admin store + auth/session concepts in `lib/`. Missing as ENFORCED artifacts: **route matrix**, **API-boundary** contract/scan, **session/cache** production proofs. Scaffold ships the code but nothing VERIFIES the baseline → SCAN-ONLY enforcers absent.
- **P-SUPABASE-NEXT-SECURITY — GREENFIELD.** No RLS proofs, no `service_role` scan, no live-RLS proof, no env-separation check anywhere. `scripts/security/` = permissions.js only. Entire pack net-new.
- **P-DEMO-MVP-LAUNCH-GATES — PARTIAL/PROSE.** Exists: readiness composite %, lastmile approval-gates (`scripts/bootstrap/lastmile/lib/approval-gates.js`), FOUNDERS_CHECKLIST gates, cockpit board. Missing: **demo-data-clean scanner**, hard **MVP/Demo/Launch gate mechanisms** (current gates are checklist-completion proxies + prose, not fail-closed proof gates). Today = SCAN-ONLY/PROSE; needs MECH-NEUTRAL gate scripts.

Cross-cutting enforcer note: guides enforcer exists-but-unwired (liveness gap); admin-suite-coverage report-only; NO product-security scanner class exists at all.
