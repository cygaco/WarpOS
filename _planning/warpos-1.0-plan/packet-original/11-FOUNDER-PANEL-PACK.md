# Founder Panel Pack

## Purpose

Founder setup should not live in chat. Every product should receive an interactive founder panel that explains what the founder must do, tracks completion, collects evidence, and gives Alpha a machine-readable store.

## Pack ID

```text
P-FOUNDER-PANEL
```

## Target shape

```text
_warpos/panel/
  app/
  store/
    founder-state.json
    checklist-items.json
    evidence/
  generated/
    panels/auth.json
    panels/database.json
    panels/payments.json
    panels/analytics.json
    panels/email.json
    panels/legal.json
    panels/app-store.json
    panels/domain.json
    panels/launch.json

_guides/founder-panel/
  README.md
  database.md
  auth.md
  payments.md
  analytics.md
  email.md
  legal.md
  app-store.md
  domain.md
  launch.md
```

Adapt paths to live registry.

## Panel item schema

```json
{
  "id": "supabase-rls-grants",
  "title": "Apply Supabase migrations and verify RLS",
  "panel": "database",
  "stage": "demo|mvp|launch",
  "status": "blocked|ready|done|verified",
  "owner": "founder|agent|alex",
  "why_it_matters": "...",
  "instructions": "...",
  "what_to_give_alex": "...",
  "what_never_to_paste": "...",
  "verify_by": "node scripts/launch/live-rls-proof.js",
  "evidence_required": ["command_output", "screenshot_optional"],
  "evidence": [],
  "last_verified_at": null
}
```

## Generator inputs

The panel generator should scan:

- `FOUNDERS_CHECKLIST.md`
- `_guides/registry.json`
- declared stack
- env var usage: `process.env.*`
- `.env*.example`
- `src/app/api/**/route.ts`
- `supabase/migrations/*`
- `supabase/activation/*`
- launch scripts
- product stage
- known risks/gaps

## Generator outputs

- hub page
- panel store JSON
- guide files
- checklist coverage map
- env var map
- route map
- migration map
- verification commands

## UX rules

- founder-facing language
- one clear next action per item
- secrets handling always explicit
- “what to paste to Alex” separated from “what never to paste”
- progress states simple: blocked, ready, done, verified
- subpanels for detail
- evidence-backed status
- no invented env vars

## High-value default panels

### Database / Supabase

- create project
- fill `.env.local`
- map publishable key → anon env var
- map secret key → service role env var
- apply migrations
- explicit grants step
- run live RLS proof

### Auth / OAuth

- configure Site URL and redirects
- Google OAuth client
- consent screen status
- Supabase provider toggles
- secret placement: Google client secret stays in Supabase, not env/chat
- demo/MVP publish status

### Payments

- Stripe test/live mode
- price IDs
- webhook route
- webhook secret
- refund policy
- subscription cancellation

### Analytics/Monitoring

- PostHog or equivalent
- Sentry or equivalent
- uptime monitor
- PII/token scrubbing
- bug report path

### Legal/Privacy

- privacy policy
- ToS
- refund policy
- cookie consent
- data deletion
- incident response

## Commands

```text
/guides:founder-panel
/bootstrap:lastmile --scaffold-panel
node scripts/panel/generate-founder-panel.js --check
node scripts/panel/panel-coverage.js
node scripts/panel/panel-store-doctor.js
```

## Gates

- Every human-only `FOUNDERS_CHECKLIST.md` item has a panel item.
- Every panel item has `verify_by` or explicit human evidence.
- Every panel env var exists in the product env scan or is marked `to_create`.
- Panel store is readable by Alpha.
- Launch cannot pass if required panel items are not verified or explicitly deferred with reason.
