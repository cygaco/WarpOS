<!-- WarpOS framework template. Generic User contract. Each project MAY
extend the shape but MUST keep id+email+createdAt as required fields. -->

# Contract: USER

- **id:** USER
- **version:** 1.0.0
- **changeType:** none
- **owner:** framework
- **used by:** auth, profile, sessions, billing

## 1. Shape

```ts
interface User {
  id: string;            // opaque identifier (UUID v4 by default)
  email: string;         // RFC 5322; case-insensitive uniqueness
  createdAt: string;     // ISO 8601 UTC
  displayName?: string;  // user-supplied; max 80 chars
  locale?: string;       // BCP 47 (e.g. "en-US")
}
```

## 2. Invariants

- `id` is immutable for the lifetime of the user.
- `email` is unique per workspace; case folded for comparison.
- `createdAt` ≤ now at all times.

## 3. Lifecycle

- Created by signup or admin invite.
- Updated by user (display name, locale) or admin (email under privacy
  rules).
- Soft-deleted by user request (`deleted_at` set), purged after the
  retention window in DISASTER_RECOVERY.md.

## 4. Breaking changes

A change is breaking if it removes a required field, changes the type
of a required field, or tightens an invariant in a way that existing
data could violate. Loosening invariants and adding optional fields
are non-breaking.

## 5. Consumers

- `auth` — reads `id`, `email`, `createdAt`.
- `profile` — reads + writes `displayName`, `locale`.
- `sessions` — reads `id`.
- `billing` — reads `id`, `email`.

## 6. Examples

```json
{
  "id": "0193b7d1-2ad6-7a8b-9d3c-1e8f4b9a7c6d",
  "email": "alex@example.com",
  "createdAt": "2026-01-01T00:00:00Z",
  "displayName": "Alex",
  "locale": "en-US"
}
```

## 7. Versioning and compatibility

This contract follows semver. Major bumps require a deprecation cycle
per `DEPRECATION_POLICY.md` (minimum 1 minor release before removal).
Consumers listed in §5 are notified on every minor or major bump.
