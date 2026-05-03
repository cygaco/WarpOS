# Analytics

> WarpOS framework template. Generic event taxonomy. Each project picks
> a provider (PostHog / Segment / Mixpanel / etc.) and maps these names
> to its own event schema.

The framework reserves a small set of event names so consumers,
A/B test runners, and dashboards have a stable contract.

## Reserved events

### `user_signed_up`

A new user account was created. Fires once per user, the first time
they complete signup. Properties: `source`, `referrer`, `plan`.

### `workspace_created`

A new workspace / team / project (whichever the app calls it) was
created by the user. Properties: `workspace_id`, `seat_count`.

### `invite_sent`

A user invited a teammate. Properties: `workspace_id`, `recipient_role`.

### `checkout_started`

User initiated a paid checkout flow. Properties: `plan`, `interval`,
`currency`, `amount_cents`.

### `feature_completed`

A user completed a notable, named feature flow (e.g. "first resume
generated", "onboarding finished"). Properties: `feature`, `duration_ms`.

### `error_seen`

User-visible error rendered. Properties: `category`, `code`,
`route`. PII scrubbed.

## Conventions

- Event names: snake_case verbs in past tense.
- Properties: snake_case. No PII unless the property is named
  `user_id` (which is itself an opaque identifier).
- Timestamps: server-side, ISO 8601 UTC.
- Funnels: the framework's funnels are defined in terms of these
  reserved events; product-specific events live in a separate
  namespace per the project's own analytics doc.
