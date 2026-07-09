# WebApp Production Baseline Pack

## Purpose

Every WarpOS-generated web app should inherit a production trust envelope by default. Doogle's consultant review and security audit should become framework defaults.

## Pack ID

```text
P-WEBAPP-PRODUCTION-BASELINE
P-SUPABASE-NEXT-SECURITY
```

## Default capabilities

### Auth/session/cache safety

Rules:

- signed-out users see public/landing surfaces only
- signed-out users cannot see settings/app surfaces
- logout clears user-bound local state
- local caches are namespaced by user_id
- user_id change clears in-memory stores
- demo data never hydrates into real signed-in accounts

Scans:

```text
/scan:auth-bound-cache
/scan:signed-out-route-access
/scan:demo-data-clean
```

### Route access matrix

Every app declares:

```yaml
routes:
  /:
    access: public
  /account:
    access: anon_or_authenticated_contextual
  /settings:
    access: authenticated
  /admin:
    access: role:admin
  /api/billing/webhook:
    access: verified_webhook
```

Generated tests probe:

- signed out
- wrong user
- owner
- role mismatch
- direct API call

### API boundary security

Every state-changing endpoint requires:

- server auth check
- server authorization/ownership/RBAC check
- schema validation
- rate limit
- CSRF/origin check when cookie-authenticated
- idempotency for payment/side-effect operations
- audit log for sensitive actions
- generic user error, detailed server log

Scans:

```text
/scan:api-boundary-security
/scan:api-route-authz
/scan:api-rate-limits
/scan:server-action-validation
/scan:service-role-reachability
```

### Supabase / Next.js security

Default scaffolds:

```text
utils/supabase/server.ts
utils/supabase/client.ts
utils/supabase/admin.server.ts
middleware.ts
scripts/launch/apply-migrations.js
scripts/launch/live-rls-proof.js
supabase/migrations/001_tables.sql
supabase/migrations/002_rls.sql
supabase/migrations/003_grants.sql
```

Rules:

- protected server routes do not trust browser client state
- `service_role` is server-only
- no service_role in client bundle
- RLS on every user-data table
- policies for SELECT/INSERT/UPDATE/DELETE
- explicit grants when applying migrations via direct DB connection
- storage RLS for private files
- roles not stored in user-writable metadata

Scans:

```text
/scan:rls-coverage
/scan:rls-policy-matrix
/scan:storage-rls
/scan:supabase-grants
/scan:rbac-server-enforcement
/scan:share-acl-coverage
```

### Env and secrets

Default environment plan:

```text
local
preview
demo
production
```

Rules:

- `.env.local` is canonical local key store
- copy from `.env.local` to deployment provider
- production and demo/test keys separated
- production OAuth client separated
- Stripe test/live separated
- secrets never in logs/commits/client bundle

Scans:

```text
/env:plan
/env:doctor
/env:vercel-sync
/scan:env-separation
/scan:secret-leakage
/scan:launch-credential-hygiene
```

### Observability

Every production app has:

- error monitoring
- uptime monitoring
- analytics/event tracking
- bug report path
- request/session correlation ids
- PII/token scrubbing
- incident runbook

Vendor adapters may include:

```text
Sentry
PostHog
BetterStack/Hyperping
Axiom/Vercel logs
```

### Legal/privacy/payment basics

Generate stage-appropriate tasks for:

- privacy policy
- ToS
- refund policy
- cookie consent
- data deletion process
- subscription cancellation
- app store privacy/data safety if applicable

## Demo/MVP/Launch gates

### Demo readiness

- OAuth provider not blocking invited users, or testers allowlisted
- demo data not visible to real signed-in users
- basic support/bug path exists
- minimal observability active

### MVP readiness

- route/API security checks pass
- live RLS proof passes
- analytics events exist
- founder panel active

### Launch readiness

- keys rotated
- prod/demo credentials separated
- live payment keys configured where relevant
- legal/privacy/payment docs published
- backups/incident response ready
- launch credential hygiene confirmed

## Done when

A generated Supabase/Next app cannot advance to demo/MVP/launch with missing RLS, exposed service_role, stale OAuth test mode, fake demo data for signed-in users, absent route matrix, or missing API security boundaries.
