# Production Baseline

> WarpOS framework template. Generic skeleton. Each project MUST fill in
> the specifics or document accepted exceptions in their own ADR.

A WarpOS-generated app is not production-ready until every area below has
an explicit implementation, documented exception, or accepted ADR.

## Auth and sessions

How are users authenticated, how long do sessions last, what happens on
expiry, how is logout invalidated everywhere?

## Authorization

Who can do what. Resource-level vs role-level. Where the policy is
evaluated. How a denial is rendered.

## Data ownership

Who owns each row. Tenant boundary. Soft-delete vs hard-delete. Export
on request.

## Migrations

Schema migrations are forward-only and reversible-by-restore. CI runs
every migration on a fresh DB before merge.

## Error handling

User-visible vs internal. Never leak stack traces. Sentry / equivalent
captures internal errors with PII scrubbed.

## Logging and observability

Structured logs (JSON), correlation ID per request, metrics on the four
golden signals (latency, traffic, errors, saturation).

## Security headers

CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy. Set
at the edge, audited per release.

## Secrets management

No secrets in source control. Per-env secret store (Vault / SSM /
1Password). Rotation policy documented.

## Backup and restore

See DISASTER_RECOVERY.md. Backups tested at least quarterly by
restoring to staging and running a smoke test.

## Test strategy

See TEST_STRATEGY.md (project-level). Unit + integration + e2e + at
least one fixture-based regression for every fix.

## Accessibility

See ACCESSIBILITY_BASELINE.md. WCAG 2.1 AA minimum.

## Deployment and rollback

Deploy is one click; rollback is one click. Rollback rehearsed on staging
each quarter. Database migrations decoupled from app deploy.

## Rate limiting

Per-IP and per-user. Documented per endpoint. Returns 429 with
Retry-After.

## Privacy and retention

Per-data-class retention policy. Subject access request workflow. Data
deletion within statutory window.
