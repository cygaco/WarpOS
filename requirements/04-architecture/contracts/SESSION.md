<!-- WarpOS framework template. Generic Session contract. -->

# Contract: SESSION

- **id:** SESSION
- **version:** 1.0.0
- **changeType:** none
- **owner:** framework
- **used by:** auth, audit-log

## 1. Shape

```ts
interface Session {
  id: string;        // opaque session identifier
  userId: string;    // → USER.id
  createdAt: string; // ISO 8601 UTC
  expiresAt: string; // ISO 8601 UTC; absolute, not refreshed-on-use
  revokedAt?: string;// set when the session was explicitly invalidated
}
```

## 2. Invariants

- `expiresAt` > `createdAt`.
- `revokedAt` (if set) is between `createdAt` and `now`.
- A revoked or expired session never grants access, even within the
  same request lifetime.

## 3. Lifecycle

- Created on successful authentication (login, magic-link, SSO).
- Read on every authenticated request via the session middleware.
- Revoked on explicit logout, password change, or admin action.
- Pruned from primary store after `expiresAt + 30 days` (audit window).

## 4. Breaking changes

Removing or renaming `id` / `userId` / `expiresAt` is breaking. Adding
session metadata (e.g. device fingerprint) is non-breaking.

## 5. Consumers

- `auth` — read + write.
- `audit-log` — reads `id`, `userId`, `createdAt`, `revokedAt`.

## 6. Examples

```json
{
  "id": "sess_0193b7d4abcd",
  "userId": "0193b7d1-2ad6-7a8b-9d3c-1e8f4b9a7c6d",
  "createdAt": "2026-01-01T00:00:00Z",
  "expiresAt": "2026-01-08T00:00:00Z"
}
```

## 7. Versioning and compatibility

Semver. Major bumps require the deprecation cycle in
`DEPRECATION_POLICY.md`. Consumers in §5 are notified on every minor
or major bump.
