<!-- WarpOS framework template. Generic Routing contract — public URL +
auth boundary shape. -->

# Contract: ROUTING

- **id:** ROUTING
- **version:** 1.0.0
- **changeType:** none
- **owner:** framework
- **used by:** auth, analytics, monitoring

## 1. Shape

```ts
interface Route {
  path: string;            // e.g. "/dashboard"
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  authRequired: boolean;
  rateLimit?: {            // see PRODUCTION_BASELINE.md#rate-limiting
    windowSec: number;
    maxRequests: number;
  };
  category: "page" | "api" | "asset" | "webhook";
}
```

## 2. Invariants

- `path` is unique per `(method, category)` pair.
- `authRequired: false` routes are explicitly enumerated; new routes
  default to `authRequired: true`.
- `webhook` routes verify the signature header before any business
  logic runs.

## 3. Lifecycle

- Defined at framework boot time (Next.js / Express / equivalent
  router config).
- Read by middleware on every request to enforce auth, rate limit,
  and observability tagging.
- Removed only via the deprecation cycle in `DEPRECATION_POLICY.md`.

## 4. Breaking changes

Removing a route, changing its method, or flipping `authRequired:
false → true` without notice are breaking. Adding routes and
tightening rate limits are non-breaking with a soak window.

## 5. Consumers

- `auth` — reads `authRequired`.
- `analytics` — reads `path`, `category`.
- `monitoring` — reads `path`, `method` for golden-signal labels.

## 6. Examples

```json
{
  "path": "/api/sessions",
  "method": "POST",
  "authRequired": false,
  "rateLimit": { "windowSec": 60, "maxRequests": 5 },
  "category": "api"
}
```

## 7. Versioning and compatibility

Semver. Removing or renaming routes requires the deprecation cycle
in `DEPRECATION_POLICY.md`. Consumers in §5 are notified on every
minor or major bump.
