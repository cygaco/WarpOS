<!-- requirement-format-legacy -->
# Acceptance Criteria — admin:* skill suite — open/preview the in-app founder admin panel (SP-20260614-002)

**Sprint:** `SP-20260614-002`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260614-002\prd.md`
**Authored by:** product-lead (design phase, ε-conducted) · **Architecture pressure-test:** director-of-engineering · **β:** DECIDE 0.90 (HOW folded in)

> Each AC is a testable statement with a `verified_by:` line. Layer = dev-tooling (skills + node scripts) → AC scoped to behavior + enforcers, not visual design. Tests are node assertions over the harness modules with injected seams (scaffold/dev-server seam-injected — no real `npm run dev` in the corpus). `verified_by` root: `tests/regression/SP-20260614-002/`. Two AC are `not_applicable` process/release gates with a named manual probe + non-empty justification.

## S-1 — `/admin:preview` keystone harness (R-1)

- AC-R1a: Given `/admin:preview` is invoked and **no resolvable test-instance exists** (cold path), when `preview.js` runs, then it (i) emits an **upfront ETA banner** naming the cold-scaffold cost before any long step, (ii) scaffolds the fixed `runtime/`-namespaced instance via the proven `scaffoldProductApp()` callable (`portfolio/new-lib.js`), and (iii) **polls the dev-server stdout for the ready line** (`/started server on|Ready in|- Local:/i`) and **parses the actual port** from it, opening the browser **only after** ready — never open-then-hope.
  verified_by: tests/regression/SP-20260614-002/preview-boot-detection.test.js::cold-path-emits-eta-then-waits-for-ready-before-open
- AC-R1b: Given a test-instance **already exists** (warm path), when `/admin:preview` runs, then it **reuses the existing instance** (reuse-default — no re-scaffold, no second `npm install`) and boots/opens against it; a run that re-scaffolds or spawns a second instance when one is live FAILS.
  verified_by: tests/regression/SP-20260614-002/preview-reuse-default.test.js::existing-instance-reused-not-rescaffolded
- AC-R1c: Given preconditions are unmet, when `/admin:preview` runs, then it **fails CLEAR with the exact missing step** (`{no Next app / app scaffold absent, npm install failed, dev server not ready/port}`), naming the remediation, and exits non-zero (no silent hang, no open against a dead server, no orphaned dev-server child). AND if the resolved target is the **WarpOS canonical root** (detected via `.claude/manifest.json` `project.slug==="warpos"` OR the `warpos:` self-block), it refuses as an **asserted precondition** (`refuseIfTargetIsWarpOS`) before any scaffold/boot.
  verified_by: tests/regression/SP-20260614-002/preview-failclear.test.js::missing-precondition-exact-message-nonzero AND ::resolved-target-warpos-root-refused-precondition

## S-2 — `/admin:readiness` + `/admin:guides` sub-route openers (R-2)

- AC-R2a: Given `/admin:readiness` (resp. `/admin:guides`) is invoked, when it runs, then it **delegates to the canonical `preview.js`** with the target sub-route and contains **no duplicated boot/scaffold logic** — a one-row delegation (the `/panel:*` synonym pattern). A copy of the harness logic in the opener FAILS.
  verified_by: tests/regression/SP-20260614-002/openers-delegate.test.js::sub-route-openers-delegate-no-duplicated-logic
- AC-R2b: Given either sub-route opener runs against a booted instance, when it completes, then the opened URL carries the correct sub-route path (`.../admin/readiness` | `.../admin/guides`), proving the route arg threads through the delegation.
  verified_by: tests/regression/SP-20260614-002/openers-delegate.test.js::route-arg-threads-to-opened-url

## S-3 — `/admin:seed` warm-start data (R-3)

- AC-R3a: Given `/admin:seed` is invoked, when `seed.js` runs, then it **READS the single instance pointer** (written by the R-1 writer) and seeds **into that same reused instance only** — a founder-allowlist session cookie + sample events + a `FOUNDERS_CHECKLIST.md` — so the panel renders **warm-start**; `seed.js` **never writes its own pointer**. With no live pointer it fails clear ("run `/admin:preview` first"), never scaffolding a second instance.
  verified_by: tests/regression/SP-20260614-002/seed-reads-pointer.test.js::seed-reads-pointer-writes-only-into-pointed-instance
- AC-R3b: Given `/admin:seed` is run twice, when the second run executes, then it is **idempotent** (no duplicate checklist, no duplicate founder session) and writes **only inside the throwaway instance** (the `refuseIfTargetIsWarpOS` guard applies to the seed target).
  verified_by: tests/regression/SP-20260614-002/seed-idempotent.test.js::seed-twice-idempotent-confined-to-instance
- AC-R3c (single-writer invariant): Given the full suite, when any two of `{preview, seed}` resolve the instance, then **exactly ONE module owns the pointer write** (the mode-set.js single-writer pattern) and a static assertion confirms **no second writer** of the instance pointer exists across `scripts/admin/*` — a planted second writer FAILS.
  verified_by: tests/regression/SP-20260614-002/single-writer-invariant.test.js::exactly-one-instance-pointer-writer-across-admin-scripts

## S-4 — admin-panel registry + source path keys (R-4)

- AC-R4a (path-key-survived-regen): Given new keys (`scriptsAdmin`, `adminPanelRegistry`) are added to the **SOURCE** `framework/paths.registry.json` and `scripts/paths/build.js` is run, when the generated views are read back, then **both keys are present** in `.claude/paths.json` AND `scripts/hooks/lib/paths.generated.js`; a key added only to the generated view (the orphan bug) FAILS.
  verified_by: tests/regression/SP-20260614-002/pathkey-roundtrip.test.js::admin-keys-survive-source-to-generated-regen
- AC-R4b (registry shape + alias-beside): Given the admin-panel registry, when validated, then every row is `{ route → opener → description }` under a generic `panels` map, it sits **alias-BESIDE** the eventual item-23 `/panel:*` registry (additive — does not fork/shadow the synonym layer), and is forward-compatible (a `/panel:admin` forwarder could read the same file unchanged).
  verified_by: tests/regression/SP-20260614-002/registry-shape.test.js::rows-well-formed-and-alias-beside-not-forking-panel
- AC-R4c (cross-provider review gate): Given the routing/registry file is load-bearing, when it lands, then it carries evidence of a **cross-provider review** via `dispatch-agent.js <reviewer>` (a review record under `runtime/` referencing `framework/admin-panel-registry.json`) — never a solo-alpha draft.
  verified_by: not_applicable — process gate; named manual probe: the cross-provider reviewer record at `runtime/sp002-*/registry-review.*` references `framework/admin-panel-registry.json`. The orchestrator attaches the review artifact before merge.

## S-5 — enforcer + coverage + regen (R-5)

- AC-R5a (skill-resolution + registry-freshness enforcer): Given the admin suite, when `scripts/checks/admin-suite-coverage.js` runs, then it asserts (i) each admin skill **resolves** via `dispatch-skill.js --resolve --skill admin:<name>` (`found:true`), (ii) the admin-panel registry has **no orphan rows / phantom openers** (every row's opener resolves to a real skill/script), and (iii) `preview.js` contains the `refuseIfTargetIsWarpOS` assertion. It is **fail-CLOSED** (incoherent registry → non-zero, mirroring `skill-hook-coverage`) and wired **REPORT-ONLY** into `/scan:full`.
  verified_by: tests/regression/SP-20260614-002/admin-suite-coverage.test.js::resolves-all-skills-no-orphan-rows-asserts-warpos-guard-failclosed
- AC-R5b (both-manifests regen): Given framework files were added (skills + scripts + registry + path keys), when the manifests are regenerated, then **BOTH** `generate-framework-manifest.js` AND `scripts/warpos/manifest/build.js` are re-run and **BC-02/BC-05 stay green**; maps (`maps:skills`/`maps:tools`) are rebuilt so the four `admin:*` skills appear. A stale single-manifest state FAILS.
  verified_by: not_applicable — release-gate check; named manual probe: `/scan:full` shows BC-02 + BC-05 green and `maps:skills` lists the four `admin:*` skills post-regen (BC-02/BC-05 are the standing manifest enforcers; this AC binds them to the new surface).

## S-6 — Playwright-lane enablement (R-6, documented not a live run)

- AC-R6a: Given `/admin:preview` boots successfully, when it reports success, then it **emits the live preview URL** (`http://localhost:PORT/admin`) in a stable, machine-readable form so the deferred design-quality/visual-review Playwright lane can target a running Next app; the skill body **documents the handoff**. The blocking design-quality flip stays deferred/operator-gated (non-goal — not flipped this sprint).
  verified_by: tests/regression/SP-20260614-002/preview-emits-url.test.js::success-emits-stable-localhost-admin-url-for-playwright-handoff
