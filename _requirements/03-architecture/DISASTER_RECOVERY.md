# Disaster Recovery

> WarpOS framework template. Generic. Each project fills in concrete
> RPO/RTO and the on-call/contact list.

## Backup scope

What is backed up: primary database (full daily, transaction log every
5 min), object storage (versioned bucket with 30-day soft delete),
secret store (per-vendor backup or replication).

What is NOT backed up: build artifacts, ephemeral runtime state,
search indexes (rebuildable), CDN cache.

## Restore procedure

Documented runbook. Exercised at least quarterly on staging. Steps:

1. Provision a clean target environment.
2. Restore the database from the most recent backup that pre-dates
   the incident.
3. Replay transaction log up to the chosen recovery point.
4. Restore object storage if affected.
5. Run the smoke-test suite.
6. Cut traffic over once smoke passes.

## RPO

Recovery Point Objective — maximum acceptable data loss.
**Default: 5 minutes** for primary data; longer is acceptable for
analytics tables. Each project SHOULD document its own number.

## RTO

Recovery Time Objective — maximum acceptable time to restore service.
**Default: 1 hour** for stateless services, **4 hours** for primary
database restore. Each project SHOULD document its own number.

## Data deletion

How user data is deleted on request: immediate logical delete (set
`deleted_at`), within 30 days the row is removed from primary store,
within 90 days it is removed from backups via key-rotation or
backup-window expiry.

## Incident contact

Primary on-call: documented in the runbook (PagerDuty / Opsgenie).
Secondary: engineering lead. Status communication: status page +
incident Slack channel. Post-incident review within 5 business days.
