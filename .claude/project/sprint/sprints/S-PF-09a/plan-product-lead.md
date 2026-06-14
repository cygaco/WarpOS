# S-PF-09a — Founders Launch-Readiness Panel · Plan (product-lead authored)

> Authored/owned by **product-lead** (WG-3 plan authoring), 2026-06-13. Program: **E-PRODUCT-FOUNDATION-001 (W3)**. Confidence 0.86.
> Authorship completion record: `dispatch-completions.jsonl` role=product-lead step=plan ok:true (dogfoods ED-051).
> Operator decision (settled 2026-06-13): build **BOTH surfaces** over ONE shared readiness data layer.
> **Status: planned — build teed up (keystone-first). NOT yet built.**

## Staging ruling
- **S-PF-09a (this sprint, do first):** R-1 shared readiness model + producer (keystone) + R-2 product-shipped founder panel + R-4 integration + R-5 deep-links + R-6 brand boundary. Low-risk reuse (data = S-PF-04 checklist, serve = S-PF-03 admin gate). Standalone founder value.
- **S-PF-09b (fast-follow):** R-3 operator cockpit portfolio board (gui.js loopback+token pattern, aggregates 09a `--json`). Carries the one greenfield risk + the one blocking open question (OQ-3).
- Keystone-first within 09a: **R-1 producer → R-2 panel → R-5/R-6**.

## Keystone — shared readiness data model `warpos/readiness/v1`
Producer (named): **`scripts/scaffold/readiness-report.js`** → `buildReadinessReport(repoRoot) → ReadinessReport`. A PURE JOIN over existing readers — never re-derives:
- `scripts/scaffold/founders-checklist.js#readFoundersChecklist(repoRoot)` — `{schema, items:[{checked,id,dim,source,label}], ...}`.
- `scripts/bootstrap/lastmile/lib/score.js` (composite + per-dim) + `lib/approval-gates.js` (the pending gates + `requires`/owner semantics).
- Two static maps: `LEAD_TIME_MAP` (Apple ~2d, Play 14d+12-tester, legal review-queue — grounded in `project_dev_setup_guide_day_zero`) + a deep-link resolver (`dim`→`_guides/registry.json` anchor, `id`→skill).

```
ReadinessReport { schema:"warpos/readiness/v1", product_id, generated_at, composite(0..100),
  source_refs{checklist,handoff}, items[ReadinessItem],
  summary{total,completed,open,blocked,owner_action,sprint_work,waiver} }
ReadinessItem { id, label, dim, status(done|open|blocked), owner_class(owner-action|sprint-work|waiver),
  lead_time{days,note}|null, blocker|null, deep_link{kind,ref}, source }
```
`owner_class` synthesis: checklist CORE+CONDITIONAL items → owner-action; lastmile buildable gaps → sprint-work; waivable approval gates → waiver.
CLI: `node scripts/scaffold/readiness-report.js --json [--root <path>]` (stable consumer contract the cockpit aggregates).

## Requirement areas (each names its enforcer)
- **R-1** model + producer. Enforcer: `readiness-report.test.js` — fixture product asserts every checklist item present w/ correct `owner_class`; planted blocked gate → `status:blocked` + non-null blocker; schema-shape; `--json` deterministic; **planted FALSE-GREEN (dropped/mis-joined item) must FAIL**.
- **R-2** product-shipped founder panel — new scaffold route reusing S-PF-03 admin pattern (`/admin/readiness`, founder-allowlist-gated, no new auth); check/uncheck writes back to `FOUNDERS_CHECKLIST.md` via the parser round-trip; renders owner-class/lead-time/blocker/deep-link; explicit **cold-start empty state**. Enforcer: extend `scripts/checks/scaffold-coverage-scan.js` (planted ungated-readiness FAILS + planted brand-leak FAILS).
- **R-3** operator cockpit board (09b) — gui.js GUI aggregating `--json` across products; read-only. Enforcer: gui-boundary test (403 non-loopback, 404 no-token, renders N fixture reports).
- **R-4** integration/serve — wire into `scripts/scaffold/app.js` + templates. Enforcer: `app.test.js` (fresh scaffold serves route + producer runs on materialized product).
- **R-5** deep-link resolution — every emitted guide ref exists in `_guides/registry.json` (no dangling). Enforcer: resolver test.
- **R-6** brand boundary — "WarpOS" NEVER product-facing (`project_masterconsole_branding_boundary`); schema id stays machine-layer. Enforcer: `scripts/checks/brand-leak-scan.js` (planted product-facing "WarpOS" FAILS) — closes standing branding-boundary debt.

## Acceptance criteria
AC-1 producer `--json` emits `warpos/readiness/v1`; item count = checklist items + distinct gates; valid owner_class. · AC-2 Stripe fixture → payments owner-action + lead_time + deep_link guide anchor. · AC-3 unmet gate → blocked + blocker; dropped-item false-green FAILS. · AC-A4 cold-start populated orientation (not blank). · AC-A5 warm-start completed-collapsed + what's-next. · AC-A6 write-back persists to .md. · AC-A7 route gated. · AC-A8 deep-links resolve. · AC-B9 cockpit 403/404 boundaries. · AC-B10 N reports → N products + drill-in. · AC-11 no product-facing "WarpOS"; planted-leak FAILS.

## Open questions
- **OQ-1** (non-blocking) panel route `/admin/readiness` (recommend — inherits S-PF-03 gate) vs `/readiness`. 09a design-lock.
- **OQ-2** (non-blocking) cockpit reads `--json` spawn-per-repo (recommend) vs cached json. 09b.
- **OQ-3** (**BLOCKING for 09b only**) cockpit portfolio-discovery source (local sibling product list). Resolve before 09b. Does NOT block 09a.
- **OQ-4** (non-blocking) LEAD_TIME_MAP seed values. Static seed fine for MVP.

## Escalations to Director of Product — RESOLVED (operator 2026-06-14)
- **(a) RESOLVED → retrofit AND new, via a runnable skill.** Existing products are covered by running a skill against them; new scaffolds get the in-app founder panel natively. The runnable skill is `/cockpit:readiness` (`scripts/cockpit/readiness-board.js`) — read-only, run against any product (registered or `--root <path>`), so a product needs no shipped panel code to be covered.
- **(b) RESOLVED → own `/cockpit` namespace** (NOT folded into `/models:router`). First skill shipped: `/cockpit:readiness` (the portfolio readiness board). The namespace is the seed of the Master Console cockpit. OQ-3 (portfolio discovery) is thereby resolved — the cockpit reads `~/.warpos/portfolio.json` as the product list.

## Layer + brand
Producer + schema = dev-tooling (internal). Founder panel = **PRODUCT layer (brand-clean, R-6 enforces)** — the FIRST net-new product-facing surface this epic ships. Cockpit = dev-tooling (Master Console brand only).

## Non-goals
RBAC; multi-tenant; live collab editing; server-persisted check state; new auth; cockpit write-ops; retrofit of existing products; notifications; analytics dashboards.

## Next action (build, keystone-first)
1. Ground `readFoundersChecklist` return-item shape + `score.js` public entry + `approval-gates.js` gate-list shape.
2. Build `scripts/scaffold/readiness-report.js` (R-1 producer) + `readiness-report.test.js` (incl. the planted false-green dropped-item fixture). Green it.
3. Then R-2 (founder panel templates + scaffold-coverage enforcer extension) → R-5/R-6.
4. Run /sprint:design for the AC/design-quality gate on the UI surface, β at boundaries.
