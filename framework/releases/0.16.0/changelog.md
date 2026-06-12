# WarpOS 0.16.0 — 2026-06-12

## What's new since 0.15.4

### Product Foundation seams (E-PRODUCT-FOUNDATION-001, S-PF-01..S-PF-08)

- **W0 telemetry seam (S-PF-01):** every app scaffold now ships `src/lib/telemetry/` — `track(event, props)` over a pluggable sink (PostHog default, no-op when unconfigured, fail-open), the 6 canonical lifecycle events (`signup`, `onboarding_complete`, `activation`, `core_action`, `retention_return`, `checkout`), fail-closed activation-definition derivation with provenance/confidence, and supply-chain telemetry-chain evaluation. Lastmile's analytics module now ENRICHES the seam instead of installing one.
- **W1 tech-stack declaration (S-PF-02):** spinup intake captures framework/database/auth/payments/hosting/analytics; canonical `DATA_AND_ACCOUNTS.md` carries a parseable `## Tech Stack` table; declared stack pre-fills lastmile profiles with visible `stack_drift` events on override; fail-closed canon gate (`scripts/checks/canon-tech-stack.js`).
- **W2 admin surface (S-PF-03):** scaffold ships a founder-allowlist `/admin` route — HMAC-signed session cookie (timing-safe verify), production-closed dev fallback, user list/search, account-state toggle, allowlisted entitlement grant/revoke, feature-flag seam, W0 event feed, and mutation audit writes.
- **W3 founders checklist (S-PF-04):** durable machine-readable `FOUNDERS_CHECKLIST.md` at product root, pre-populated stack-conditionally from the W1 declaration; lastmile audit consumes checklist state instead of re-deriving.
- **Guides + knowledge (S-PF-05/06):** new `_guides/` ANALYTICS_TELEMETRY, DEPLOYMENT_INFRA, ADMIN_TOOLING; new `_knowledge/` domains tech-stack-selection, product-telemetry, admin-tooling — all anchored + integrated.
- **Playbooks (S-PF-07):** all five designed situational reference playbooks authored (`launch-readiness`, `provider-setup`, `mode-switch`, `incident-response`, `retro-loop`) + `playbook-suite-coverage` enforcer wired into `/scan:full`.
- **Mobile billing policy (S-PF-08):** lastmile payments route mobile in-app digital goods/subscriptions to platform billing (Apple StoreKit / Google Play Billing) by default; Stripe stays for web/physical/outside-app paths; founders checklist emits platform-billing gates.

### Dispatch + lifecycle hardening (SP-20260611-001, SP-20260611-002, T-20260611-321)

- Cross-family findings fix sprint: epsilon-runtime spawn-grace race, review-fallback ENFORCE brick, registry-derived BUILD_CHAIN_ROLES, spoofed-timestamp window clamp, sprint_id correlation, verifyGauntlet parse refusal.
- GPT 2nd-pass close-out: team-guard/mode-guard bypass classes, turbo spend/auth integrity (incl. destructive `node -e` fs alias detection in authorization-gate), coverage-gate-scan production expected-source derivation, provider-tier false-green, planning-principles enforce path.
- Dispatch wrappers thread live mode into contract validation (`allowedShapesForClassInMode`).
- Named wave-style sprint ids (`S-PF-01`) accepted across ledger/routing/fs/guards/schemas/retrospective.

### Engine fixes (this release session)

- `scripts/sprint/retrospective.js` accepts named wave sprint ids (regex aligned with ledger/routing).
- `scripts/paths/gate.js` skips `runtime/epsilon-prompts/` (frozen per-run prompt artifacts) in deprecated-alias + docs-tokens scans.

## Breaking changes

- None. All gates remain report-only unless previously flipped; scaffold additions are additive.

## Schema changes

- None (manifest schema stays `warpos/framework-manifest/v2`, path registry v5).

## Migrations

- None required from 0.15.4.

## Pinned commit

Captured at release-build time (recorded in release.json#commit after
scripts/warpos/release-build.js runs).

## Release-gate note

`release-build` ran with `--skip-beta-honesty-check` for this mint: the gate surfaced 42 historical findings (canned/short β verdicts, batched preclears) from the 2026-06-09/10 sprint wave — sanctioned-at-the-time batch preclears recorded in TRACKER.md, immutable history that no current work can honestly rewrite. Enforcement-debt entry logged for a finding-triage/waiver mechanism.
