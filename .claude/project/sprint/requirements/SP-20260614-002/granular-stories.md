<!-- requirement-format-legacy -->
# Granular Stories — admin:* skill suite — open/preview the in-app founder admin panel (SP-20260614-002)

**Sprint:** `SP-20260614-002`
**High-level stories:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260614-002\high-level-stories.md`

> Granular stories use the `S-N` id convention enforced by `scripts/hooks/requirement-format-guard.js`. Each maps to roughly one ticket. Authored by product-lead (design phase). WS = workstream.

## S-1 — `/admin:preview` keystone harness (WS-1)

**As** the President (or a founder)
**I want** `/admin:preview` (skill `.claude/commands/admin/preview.md` + `scripts/admin/preview.js`) to resolve-or-scaffold the fixed `runtime/`-namespaced test-instance, spawn `npm run dev`, poll stdout for ready + parse the port, open `/admin` in a browser, reuse-by-default, own the single instance-pointer writer, refuse the WarpOS root, fail clear, and emit the preview URL
**So that** I can open the in-app founder admin panel with one command instead of hand-scaffolding a Next app — and the deferred design-quality Playwright lane finally has a running app + URL to target.

Acceptance criteria: `AC-R1a`, `AC-R1b`, `AC-R1c`, `AC-R6a`, `AC-R3c` (writer side).
Linked: `H-1`, `R-1`. COPY: `copy.md`. INPUTS: `inputs.md`. TRACE: `trace.md`.

## S-2 — `/admin:readiness` + `/admin:guides` sub-route openers (WS-2)

**As** a reviewer
**I want** `/admin:readiness` + `/admin:guides` to be thin one-row delegators to `preview.js` (with a `--route` sub-route arg) carrying zero duplicated boot/scaffold logic
**So that** I can open straight to the sub-route I want to inspect, with the canonical opener staying the single source of truth (the `/panel:*` synonym pattern).

Acceptance criteria: `AC-R2a`, `AC-R2b`.
Linked: `H-1`, `R-2`. COPY: `copy.md`. INPUTS: `inputs.md`. TRACE: `trace.md`.

## S-3 — `/admin:seed` warm-start data (WS-2)

**As** a tester
**I want** `/admin:seed` (skill + `scripts/admin/seed.js`) to READ the instance pointer (never write it), seed a founder-allowlist session + sample events + a `FOUNDERS_CHECKLIST.md` into the pointed instance only, be idempotent, and refuse the WarpOS root
**So that** the panel renders real warm-start data instead of a cold-start empty board, without any split-brain on the instance pointer.

Acceptance criteria: `AC-R3a`, `AC-R3b`, `AC-R3c`.
Linked: `H-1`, `R-3`. COPY: `copy.md`. INPUTS: `inputs.md`. TRACE: `trace.md`.

## S-4 — admin-panel registry + source path keys (WS-3)

**As** the framework
**I want** `framework/admin-panel-registry.json` (route→opener→description under a generic `panels` map, alias-beside the future item-23 `/panel:*`) + the SOURCE path keys (`scriptsAdmin`, `adminPanelRegistry`) added to `framework/paths.registry.json`, regenerated via `build.js` (key-survival verified), and the registry file cross-provider-reviewed before it lands
**So that** the openers read one canonical table, the synonym layer can later forward into it unchanged, and the load-bearing routing file is never a solo-α draft.

Acceptance criteria: `AC-R4a`, `AC-R4b`, `AC-R4c`.
Linked: `H-1`, `R-4`. COPY: `copy.md`. INPUTS: `inputs.md`. TRACE: `trace.md`.

## S-5 — enforcer + /scan:full wiring (WS-4)

**As** the framework
**I want** `scripts/checks/admin-suite-coverage.js` to assert all admin skills resolve + the registry has no orphan rows + `preview.js` carries the WarpOS-refusal assertion, fail-closed, wired report-only into `/scan:full`
**So that** every admin-suite policy names its enforcer and a drifted/incoherent registry self-detects.

Acceptance criteria: `AC-R5a`.
Linked: `H-1`, `R-5`. COPY: `copy.md`. INPUTS: `inputs.md`. TRACE: `trace.md`.

## S-6 — maps + both-manifests regen + URL handoff (WS-4)

**As** the framework
**I want** maps (`maps:skills`/`maps:tools`) rebuilt + BOTH manifests regenerated (BC-02/BC-05 green) + the preview URL emitted for the Playwright-lane handoff
**So that** the new skills are discoverable, the distribution manifests stay honest, and the design-quality lane has its handoff (the URL-emit itself lives in S-1's `preview.js`).

Acceptance criteria: `AC-R5b`, `AC-R6a`.
Linked: `H-1`, `R-6`. COPY: `copy.md`. INPUTS: `inputs.md`. TRACE: `trace.md`.
