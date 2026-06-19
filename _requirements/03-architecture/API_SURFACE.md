# AcmeLaunch — API Surface

> **v3 (2026-04-23)** — Aligned with `_requirements/04-features/backend/PRD.md` v3. Every route has moved from same-origin `/api/*` on Vercel to the dedicated backend service on Fly.io (`${API_BASE_URL}/...`). Legacy `/api/*` routes remain deployed for a 7-day rollback window behind `LEGACY_ROUTES_ENABLED=true`, with full new-backend security-layer parity during the window (see backend PRD §8.11). The section headings below use the new paths (no `/api` prefix) since that is the post-cutover canonical form.

---

## Route Overview

| Method | Route                                 | Purpose                             | Auth Required                  | Security layers (ref §8.2) |
| ------ | ------------------------------------- | ----------------------------------- | ------------------------------ | --------------------------- |
| POST   | `/claude`                             | Synchronous Claude (PARSE, PROFILE, LANDSCAPE) | Optional (required for billable) | 0,2,3,4,5,7,8,10 |
| POST   | `/claude/chain`                       | Async chained Claude (returns ticketId) | Yes (JWT user)             | 0,2,3,4,5,6,7,8,9,10 |
| POST   | `/research/run`                       | Async launch research (returns ticketId) | Yes (JWT user)              | 0,2,3,4,5,6,7,8,9,10 |
| GET    | `/tickets/{id}`                       | Poll async ticket (ownership-checked) | Yes (JWT user; sub = ticket.ownerUserId) | 0,2,3,4,5,6,7,8,10 |
| GET    | `/session`                            | Load server session                 | Yes (JWT)                      | 0,2,3,4,5,6,7,10 |
| POST   | `/session`                            | Save server session                 | Yes (JWT)                      | 0,2,3,4,5,6,7,10 |
| DELETE | `/session`                            | Clear server session                | Yes (JWT)                      | 0,2,3,4,5,6,7,10 |
| POST   | `/auth/login`                         | Email/password login                | No                             | 0,2,3,4,7,8,9,10 |
| POST   | `/auth/register`                      | Create account                      | No                             | 0,2,3,4,7,8,9,10 |
| POST   | `/auth/logout`                        | Clear auth cookie                   | No                             | 0,2,3,4,7,10 |
| GET    | `/auth/me`                            | Check current auth                  | Cookie-based JWT               | 0,2,3,4,6,10 |
| POST   | `/auth/reset`                         | Password reset request              | No                             | 0,2,3,4,7,8,9,10 |
| PUT    | `/auth/reset`                         | Password reset token redemption     | No (token-gated)               | 0,2,3,4,7,8,9,10 |
| GET    | `/auth/oauth/google`                  | Start Google OAuth                  | No                             | 0,2,3,4,10 |
| GET    | `/auth/oauth/google/callback`         | Google OAuth callback               | No (state-gated)               | 0,2,3,4,7,9,10 |
| GET    | `/channels`                           | List connected launch channels      | Yes (JWT user)                 | 0,2,3,4,6,10 |
| GET    | `/channels/connect/{provider}`        | Start channel OAuth (linkedin, x, reddit, ...) | Yes (JWT user)        | 0,2,3,4,10 |
| GET    | `/channels/connect/{provider}/callback` | Channel OAuth callback            | Yes (state-gated)              | 0,2,3,4,7,9,10 |
| GET    | `/credits`                            | Balance + usage + ledger tail       | Yes (JWT)                      | 0,2,3,4,6,10 |
| POST   | `/credits/debit`                      | Debit credits (server-initiated)    | Yes (JWT)                      | 0,2,3,4,6,7,8,9,10 |
| POST   | `/credits/grant`                      | Grant credits                       | **Yes (JWT admin scope)**      | 0,2,3,4,6,7,9,10 |
| GET    | `/stripe/config`                      | `{configured: boolean}` for UI gating | No                           | 0,2,3,4,10 |
| POST   | `/stripe/checkout`                    | Create checkout session             | Yes (JWT)                      | 0,2,3,4,6,7,9,10 |
| POST   | `/stripe/webhook`                     | Stripe webhook handler              | Stripe signature               | 0,3,4,7,9,10 |
| GET    | `/launch-console/queue`               | Runner pulls the launch action queue | Yes (JWT user)                | 0,2,3,4,6,7,8,10 |
| GET    | `/launch-console/prompts/{queueItemId}` | Runner fetches the action prompt for one queue item | Yes (JWT user)  | 0,2,3,4,6,7,8,10 |
| POST   | `/launch-console/outcomes`            | Runner reports launch-action outcomes | Yes (JWT user)               | 0,2,3,4,6,7,8,9,10 |
| GET    | `/health`                             | Liveness (returns `{ok:true}` only) | No                             | — |
| GET    | `/admin`                              | Admin panel HTML                    | Yes (JWT admin scope + passkey)| 0,2,3,4,6,9,10 |
| GET    | `/admin/status`                       | Ops metrics (queue depth, worker lag, Redis ping, `is_claude_healthy`) | Yes (admin) | 0,2,3,4,6,9,10 |
| GET    | `/admin/tickets`                      | Ticket list (filterable)            | Yes (admin)                    | 0,2,3,4,6,9,10 |
| GET    | `/admin/tickets/{id}`                 | Full ticket state                   | Yes (admin)                    | 0,2,3,4,6,9,10 |
| POST   | `/admin/tickets/{id}/replay`          | Re-enqueue stuck ticket (write)     | Yes (admin + fresh passkey)    | 0,2,3,4,6,7,9,10 |
| GET    | `/admin/ledger`                       | Ledger search                       | Yes (admin)                    | 0,2,3,4,6,9,10 |
| GET    | `/admin/users/{email}`                | User lookup                         | Yes (admin)                    | 0,2,3,4,6,9,10 |
| POST   | `/admin/users/{id}/grant`             | Grant credits (write)               | Yes (admin + fresh passkey)    | 0,2,3,4,6,7,9,10 |
| GET    | `/admin/outcomes`                     | LAUNCH_OUTCOME stream live-tail     | Yes (admin)                    | 0,2,3,4,6,9,10 |
| GET    | `/admin/diagnostics`                  | Port of `/api/test` check modes     | Yes (admin)                    | 0,2,3,4,6,9,10 |
| POST   | `/admin/webauthn/register`            | Passkey enrollment (≥2 required)    | Yes (admin bootstrap flow)     | 0,2,3,4,6,9,10 |
| POST   | `/admin/webauthn/challenge`           | Generate WebAuthn challenge         | Yes (admin)                    | 0,2,3,4,6,9,10 |
| POST   | `/admin/webauthn/verify`              | Verify assertion (step-up, action-digest-bound) | Yes (admin)       | 0,2,3,4,6,9,10 |

**On the Vercel frontend (not the backend):**

| Method | Route                       | Purpose                                     |
| ------ | --------------------------- | ------------------------------------------- |
| GET    | `/.well-known/api-config`   | **Deprecation banner only** (per §16 decision 12). Returns `{ok: true}` in steady state, or `{deprecated: true, newUrl: "..."}` during a cutover. The AcmeLaunch Runner reads its backend URL from its connection record on pairing; this endpoint is **not** primary discovery. |

**Deprecated in v3 (no longer exists):**

- `GET /api/test` — ported to `/admin/diagnostics` (admin-scoped). The legacy `NEXT_PUBLIC_DUMMY_PLUG_CODE` gate is **removed** (per backend PRD §16 decision 16; the env var was exposed in the client bundle per SECURITY.md pre-publish action item).
- `GET /extension` — the standalone browser-extension download is **removed**. Launch execution now runs through the first-party **AcmeLaunch Runner**, which authenticates as a normal app session (no separate ZIP, no extension origin). Its queue/outcome/prompt surface lives under `/launch-console/*`.

---

## Async API (the ticket model)

All long-running operations (launch research, chained Claude, plan + asset-pack/PDF build) return a ticket rather than blocking on the response. The client polls `GET /tickets/{id}` for status/result.

### POST /research/run (example)

```
Headers:
  X-Idempotency-Key: <uuid>   // required — same key within 5min → same ticket, no double debit
  Authorization: Bearer <jwt> // or cookie
Body:
  { queries: string[1-6], geography: string, channels?: string[], sourceTypes?: string[] }
Response 200:
  { ticketId: string, status: "queued" }
Errors:
  400 (schema), 401, 429, 503 { error: "QUEUE_UNAVAILABLE" }  // QStash down → no ticket written
```

`sourceTypes` selects which approved research sources the run may use (`web_search`, `public_url`, `directory`, `social_public`, `marketplace`, `uploaded_file`, `crm_import`); each source on the run carries its own consent record (`approvedBy`, `scope`, `allowedUse`, `credentialMode`, `provenanceUrl`).

### POST /claude/chain (example)

```
Body:
  { promptChain: [{key, message}, ...], sharedContext?: {...} }
Response 200:
  { ticketId, status: "queued" }
```

### GET /tickets/{id}

```
Headers:
  Authorization: Bearer <jwt>
Response 200:
  { status: "queued"|"running"|"done"|"failed",
    progress: { step: number, total: number, stage: string },
    result?: any | { signedUrl: string, expiresAt: number },  // R2 signed URL if payload > 256KB
    error?: { code: string, message: string, requestId: string } }
Errors:
  401 (missing/expired JWT), 403 (JWT.sub !== ticket.ownerUserId — no ticket metadata returned), 404
```

**Ownership enforcement:** `ticket.ownerUserId` is checked on every poll. External ticket IDs use UUIDv4 (internal audit uses UUIDv7 for sortability — never exposed to clients).

**Blob store:** result payloads >256KB are written to R2 at `{userId}/{ticketId}/result.{ext}`; ticket returns a signed URL with ≤15-min TTL. Bucket is private.

---

## POST /claude (synchronous)

Used for single-shot prompts that fit inside the 60s window: `PARSE`, `PROFILE`, `LANDSCAPE` (unless known to exceed 60s, in which case route to `/claude/chain`).

### Request

```typescript
Headers:
  X-Session-Nonce: string  // UUID, bound to server-side session record (tightened from v2's format-only check)
  Cookie: session token    // Optional; required for billable prompt keys
Body: {
  promptKey: string   // Must exist in PROMPTS
  message: string     // Max 50,000 chars
  maxTokens?: number  // Default 4096, range 1–8192
}
```

### Validation + rate limits

Unchanged from v2 in shape; enforcement has moved to Hono middleware on the Fly backend. Per-IP, global, per-user, per-ASN, daily request + daily token budgets all present.

### Prompt Caching (v3 — P1, F14)

Every call is wrapped in the shared `callClaude()` helper that applies `cache_control: {type: "ephemeral"}` on the system prompt + PROMPT_RULES + canonical context region. Cache hit rate exposed via `/admin/status` cache_hit_rate. Alert fires if cache hit rate drops <80% over 1h — indicates cached region is drifting (spec drift signal).

### Credit Billing

Billable prompt keys: `LANDSCAPE_PREP`, `SEGMENT_PLAN`, `CHANNELS`, `LAUNCH_RUN`. Debit-before-run via Postgres transactional enqueue (see §8.13 in backend PRD). Response schemas unchanged; 402 error now includes `remaining` and `cost` as before.

---

## POST /launch-console/outcomes (new in v3)

The AcmeLaunch Runner reports every launch-action attempt back to the backend for durable counts + admin visibility + readiness scoring.

```
Headers:
  Authorization: Bearer <jwt>   // user scope — normal first-party app session
Body: {
  outcomes: Array<{
    actionId: string
    targetUrl: string
    actionTitle: string
    channel: string        // email | social | community | marketplace | ads | content
    status: "succeeded" | "skipped" | "failed" | "needs_manual"
    reason?: string        // required if skipped, failed, or needs_manual
    ruleVersion: string
    executedAt: number     // unix ms
    ticketId?: string      // if originated from a launch-run ticket
  }>
}
Response 200:
  { received: number, duplicates: number }
Rate limit: 100 outcomes per user per minute
```

**Dedup:** Same `{userId, targetUrl, status}` within 24h is counted as duplicate; returns in `duplicates` count but does not produce a second row. Prevents runner retry loops from inflating counts.

**Persistence:** written atomically (single Postgres INSERT + Redis XADD) to:
1. Postgres `launch_outcomes` (authoritative, monthly partitions)
2. Postgres `audit_log` with `type=LAUNCH_OUTCOME` (durable audit)
3. Redis stream `launch:outcomes:{userId}` (ops-UI cache only)

**Readiness linkage:** `src/lib/readiness.ts` reads the founder's `launch_outcomes` count (via a thin backend endpoint or denormalized in session state).

---

## /credits — schema change

### GET /credits (superset schema — v3)

```typescript
Response 200: {
  credits: number,       // legacy field (backward-compat during rollback window)
  balance: number,       // canonical v3 field (same value as `credits`)
  recentLedger: Array<{ ts, delta, reason, balanceAfter, ticketId? }>,  // last 20 entries
  usage: { ... },
  costs: CREDIT_COSTS,
  packs: CREDIT_PACKS
}
```

### POST /credits/grant — **gating change**

**v3:** Gated by `scope=admin` JWT only. The legacy `NEXT_PUBLIC_DUMMY_PLUG_CODE` gate is **removed** (client-bundle-exposed env var was flagged in SECURITY.md pre-publish action and migrated in backend PRD §16 decision 16). Dev grants now go through a server-side seed script or local admin CLI.

```
Headers: Authorization: Bearer <admin-jwt>
Body: { userId: string, amount: number (0-10000), action: "grant" | "reset" }
Response 200: { success: true, balance: number }
Errors: 400, 401, 403 (not admin scope), 429
```

**Admin-panel write actions additionally require a fresh (<2 min) WebAuthn passkey assertion bound to the action's content digest** (verify-only step-up — see backend PRD §8.9).

---

## /stripe/webhook — three-state idempotency

`queued → processing → done` tracked in **Postgres** `stripe_webhook_idempotency` table (v3 — was Redis in v2; moved for durability per F1). Lua-script CAS pattern in backend PRD §8.13 / research F3. Stuck-processing sweep cron recovers keys stuck > 5 min.

- Idempotent on `event.id` — first write claims `queued` → `processing`, transaction completes with `done`, full Postgres transaction covers: idempotency-state update + ledger insert + any side effects.
- Cross-row durability: if the machine crashes between `processing` claim and ledger insert, the Postgres transaction aborts entirely — next delivery re-processes cleanly.
- Signature verification via `stripe-signature` header remains primary auth.

---

## Client-Side API Helpers (src/lib/api.ts)

### callClaude(promptKey, message, maxTokens?, signal?)

- **Prefix:** every fetch is `${API_BASE_URL}/claude` (or legacy `/api/claude` if `API_BASE_URL` is empty, for rollback compat)
- Generates session nonce once per page load; posted as `X-Session-Nonce`
- **Generates `X-Idempotency-Key` UUID on every call** (v3 — for replay safety)
- Retry: 2 retries for transient errors (network, 502, 504); 429 waits `3000ms × (attempt + 1)`
- Client timeout: 100 seconds
- For billable prompts: throws `CreditError` on 401/402

### runResearch(queries, geography, channels?, onProgress?, sourceTypes?)

- **Now ticket-based:** calls `POST ${API_BASE_URL}/research/run` → receives ticketId → polls `GET /tickets/{id}` every 5s
- Progress callback fires on every poll
- Result: `{ results, total, queryStats, warnings }`
- No longer re-implements research-provider trigger/poll in the client — that lives in the worker

### cleanJson(raw)

Unchanged — strips markdown fences, validates JSON, throws if invalid.

---

## Defense-in-depth layer annotations

Every route handler in `services/backend/src/routes/` MUST carry a JSDoc block like:

```typescript
/**
 * @route POST /credits/debit
 * @security-layers [0,2,3,4,6,7,8,9,10]
 * @notes Layer 11 does not apply (this is an API route, not a worker route).
 */
```

CI script `scripts/check-security-layers.js` rejects the build if any file in `services/backend/src/routes/` lacks the annotation or references a layer outside 0–11. Waivers take the form `@security-layers: [waived: N, reason: "..."]` with a mandatory reason string. (Per backend PRD §16 decision 11.)

---

## See also

- **Source of truth** for all contracts above: `_requirements/04-features/backend/PRD.md` (v3)
- **Security layers explained:** `_requirements/03-architecture/SECURITY.md` (defense-in-depth section)
- **Async/ticket data flow:** `_requirements/03-architecture/DATA_FLOW.md` (Ticket Lifecycle)
- **Persistence split (Postgres vs Redis):** `_requirements/03-architecture/PERSISTENCE.md` (Backend Persistence)
- **Error responses + recovery:** `_requirements/03-architecture/ERROR_RECOVERY.md`
