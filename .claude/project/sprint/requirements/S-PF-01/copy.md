# COPY Requirements - E-PRODUCT-FOUNDATION-001 W0 telemetry seam

**Sprint:** `S-PF-01`
**PRD:** `.claude/project/sprint/requirements/S-PF-01/prd.md`

## C-1 - Telemetry seam comments and errors

- `track()` comments must name the fail-open contract: telemetry must never block app boot.
- Any scan failure for the seam must name the missing file or unsafe sink shape directly.

## C-2 - Lifecycle events

- Scan output must say "lifecycle event set mismatch" when the exact six-event set drifts.
- Event names in docs/tests must use the canonical literals: `signup`, `onboarding_complete`, `activation`, `core_action`, `retention_return`, `checkout`.

## C-3 - Activation definition

- Placeholder activation failures must say "activation definition present but undefined".
- Lastmile revise output must name `activation_definition_change`.

## C-4 - Lastmile enrichment

- Lastmile plan copy must describe funnel/A-B events as enrichment over the seam, not a second tracker install.
- No user-facing or scaffold docs may imply W0 has a live analytics provider.

## C-5 - Chain telemetry

- Broken-chain output must name the correlation id and the stage where the chain stopped.
- Stage labels must stay stable: `intent`, `executed`, `committed`, `delivered`, `observed`.

## C-6 - Enforcer and shipping proof

- Scaffold-coverage failures must be actionable and path-specific.
- Manifest/shipping failures must mention that new telemetry templates would not ship downstream.
