# AcmeLaunch — Third-Party Integrations

> **v3 (2026-04-23)** — Four new integrations added for the backend split: Fly.io (hosting), Cloudflare (edge + WAF + R2 + AOP mTLS), Upstash QStash (job queue egress), Cloudflare R2 (blob store). Anthropic usage gains Prompt Caching requirements per research F14.

---

## Launch Research Adapter (Landscape Gathering)

### Overview

| Field      | Value                                                 |
| ---------- | ----------------------------------------------------- |
| Service    | Launch Research adapter (public launch-landscape sources) |
| Source set | `web_search`, `public_url`, `directory`, `social_public`, `marketplace`, `uploaded_file`, `crm_import` |
| Mode       | Founder-approved sources only, keyword-driven         |
| Base URL   | Per-source adapter endpoint (configured per provider) |
| Auth       | Per-source credential mode (`none` / `oauth` / `api_key`), set on the `ResearchSource` |

### Consent & Integrity

Every `LaunchResearchRun` queries only sources the founder approved. Each `ResearchSource` carries `approvedBy`, `scope`, `allowedUse`, `credentialMode`, and `provenanceUrl`. On partial failure the run persists what it gathered, marks the failed sources, and applies a bounded retry — it NEVER synthesizes missing evidence to fill a gap. Failed sources surface to the founder, they are not silently dropped.

### Adapter Flow

```
1. TRIGGER: POST /research/run with { launchPlanId, sources[], querySet[] }
   → creates LaunchResearchRun → Returns: { runId: "lrr_..." }

2. POLL: GET /research/run/{runId}?format=json
   → 202: Still gathering
   → 200 (array): LaunchResearchResult[] ready (+ ResearchSnapshot refs)
   → 200 (object with status): Gathering or failed (per-source errors[])
```

### Query Schema (per source)

```json
{
  "query": "landscape probe",
  "geography": "US",
  "country": "US",
  "time_range": "",
  "sourceType": "web_search",
  "depth": "",
  "scope": "public",
  "exclude": "",
  "freshness": ""
}
```

### Valid Values

| Field      | Valid Values (case-sensitive)                                                                                      |
| ---------- | ------------------------------------------------------------------------------------------------------------------ |
| sourceType | `"web_search"`, `"public_url"`, `"directory"`, `"social_public"`, `"marketplace"`, `"uploaded_file"`, `"crm_import"` |
| scope      | `"public"` (public sources only; the adapter never scrapes gated/private content)                                  |
| country    | `"US"`                                                                                                              |

### Output Fields (Flexible Mapping)

Sources return inconsistent field names. AcmeLaunch maps each `LaunchResearchResult` flexibly:

| Our Field      | Source Field(s)                                                              |
| -------------- | --------------------------------------------------------------------------- |
| signal         | `signal` or `headline`                                                       |
| channel        | `channel` or `source_name`                                                  |
| geography      | `geography` or `region`                                                     |
| snippet        | `snippet` > `excerpt_formatted` (HTML stripped) > `description`             |
| reach          | `reach` (JSON stringified) > `audience_range` > `estimated_reach`           |
| segment        | `segment_label`                                                             |
| signalType     | `signal_type` or `result_type` (opportunity / channel / competitor / audience / pricing) |
| confidence     | `confidence` or `score`                                                     |
| url            | `provenance_url` > `source_url` > `url`                                     |
| topics         | `topics`                                                                    |
| intent         | `intent`                                                                    |
| engagement     | `engagement_count`                                                          |
| observedDate   | `observed_date` (first 10 chars → YYYY-MM-DD)                              |

### Known Issues

1. **Mixed reach units**: Source reach fields can mix organic-audience figures and paid-CPM figures. Paid spend signals must not be read as organic reach; spend ranges are extracted from snippet text via regex when needed.
2. **Thin niche data**: Narrow segments, new categories, and small communities yield significantly fewer signals.
3. **Hub/aggregator noise**: Hubs and large communities surface high volumes across different queries, inflating segment counts. Detected by: channels with 3+ signals across different queries.
4. **Rate limiting**: Some sources have their own rate limits beyond AcmeLaunch's budget. Very rare in practice with current usage levels.

### Reach-Signal Extraction

`extractReachSignals()` in `src/lib/utils.ts`:

```
Pattern: $XX–$YY test spend (or CPM, /lead, per-click, etc.)
Range: $15–$5000 test spend (outside this range = filtered out)
Context: ±80 characters around match
```

Returns: `{ signal, channel, reach, context }[]`

---

## Anthropic Claude API (AI Processing)

### Overview

| Field      | Value                                            |
| ---------- | ------------------------------------------------ |
| Service    | Anthropic Messages API                           |
| Endpoint   | `https://api.anthropic.com/v1/messages`          |
| Model      | `claude-sonnet-4-20250514` (env: `CLAUDE_MODEL`) |
| Auth       | `x-api-key` header (`ANTHROPIC_API_KEY`)         |
| Max tokens | 4,096 default, 8,192 max                         |

### Request Format

```json
{
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 4096,
  "system": "System prompt from PROMPTS[key]",
  "messages": [{ "role": "user", "content": "User message" }]
}
```

### Timeout & Retry

| Parameter               | Value                                |
| ----------------------- | ------------------------------------ |
| Server timeout          | 90 seconds                           |
| Vercel function timeout | 60 seconds (limiting factor)         |
| Client timeout          | 100 seconds                          |
| Client retries          | 2 (for transient: network, 502, 504) |
| Rate limit retry        | Wait `3000ms × (attempt + 1)`        |

### Error Codes

| Status | Meaning      | AcmeLaunch Handling  |
| ------ | ------------ | -------------------- |
| 200    | Success      | Extract text content |
| 429    | Rate limited | Retry with backoff   |
| 500    | Server error | Retry (transient)    |
| 502    | Bad gateway  | Retry (transient)    |
| 504    | Timeout      | Retry (transient)    |
| 400    | Bad request  | Fail (prompt issue)  |
| 401    | Auth error   | Fail (key issue)     |

---

## Upstash Redis (Rate Limiting & Sessions)

### Overview

| Field   | Value                                                 |
| ------- | ----------------------------------------------------- |
| Service | Upstash Redis                                         |
| SDK     | `@upstash/ratelimit`, `@upstash/redis`                |
| Auth    | `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` |

### Usage

1. **Rate limiting**: Sliding window algorithm for per-IP and global limits
2. **Daily budgets**: Atomic increment/check for daily request and token counts
3. **Credit balances**: `credits:{userId}` key for credit counts
4. **Usage tracking**: `usage:{userId}` key for operation counts
5. **Server sessions**: `session:{userId}` key for SessionData (authenticated founders)

### Fallback

If Redis is unavailable:

- Rate limiting: In-memory fallback (Map-based, resets on deploy)
- Credits: In-memory fallback (development only)
- Sessions: Falls back to localStorage only

---

## Stripe (Payments)

### Overview

Used for credit pack purchases. Integration details:

- Checkout flow: Server creates Stripe Checkout Session → redirect to Stripe → callback
- Return URL: `?credits=success` query param triggers balance reload
- Webhook: Verifies Stripe signature for payment confirmation; **three-state idempotency now in Postgres** (v3 — see ERROR_RECOVERY.md Stripe section)
- Products: Starter ($4.99 / 100), Pro ($12.99 / 300), Scale ($24.99 / 750)
- **v3 staging policy:** production + test-mode keys are separated by the `ENVIRONMENT` flag (staging / production). CI enforces that production keys are never in staging secrets or GitHub Actions.

---

## Fly.io (Backend Hosting — v3)

### Overview

| Field      | Value                                                           |
| ---------- | --------------------------------------------------------------- |
| Service    | Fly Machines                                                    |
| Runtime    | Node 22 LTS                                                     |
| Image      | One multi-stage Dockerfile, two CMD entrypoints (`api`, `worker`) |
| Topology   | Single `fly.toml` with `[processes]` stanza: `api = "node dist/api.js"` + `worker = "node dist/worker.js"` |
| Region     | Primary region closest to user base; no multi-region in MVP     |
| Cost model | Per-active-minute for Machines; stopped machines ~$0/mo         |
| No free tier | Credit card required (as of late 2024)                        |

### Required fly.toml hardening (research F4)

```toml
kill_timeout = 300        # was default 5s — SIGTERM drain needs time
kill_signal = "SIGTERM"   # was default SIGINT
auto_stop_machines = false  # for worker process only — keep warm
```

**Dockerfile must use exec form:** `CMD ["node", "dist/api.js"]` (not `npm start`, not `./start.sh`). Shell wrappers swallow signals → deploy cuts in-flight Claude calls.

### Postgres (Fly)

- Separate Fly app `acmelaunch-pg` (Fly-managed Postgres).
- Connection string via `DATABASE_URL` Fly secret.
- Two DB roles: `api_role` (ledger/session/admin read-write), `worker_role` (tickets + audit write-only).
- Daily backups + point-in-time recovery.
- MVP cost: ~$15-30/mo.

### Cost at scale

| Tier        | API + Worker | Postgres | Notes                            |
| ----------- | ------------ | -------- | -------------------------------- |
| <1k DAU     | $5–15/mo     | $15-30/mo | Idle machines stop; $0 when stopped |
| 10k DAU     | $30–60/mo    | Same     | Egress $0.02/GB NA-EU; watch streaming |

### Origin pinning (AOP mTLS — research F2)

- Cloudflare presents a **per-zone custom client certificate** on every origin request.
- Fly accepts the connection via **Nginx sidecar** in the same image (no published all-Hono+Fly+AOP example as of April 2026).
- Nginx `ssl_verify_client on` + pinned certificate fingerprint → proxy plaintext to Hono on localhost:3000.
- Direct TCP connections to Fly origin (bypassing Cloudflare) → rejected by Nginx.

---

## Cloudflare (Edge, WAF, R2 — v3)

### Overview

| Feature         | Plan         | Notes                                                                      |
| --------------- | ------------ | -------------------------------------------------------------------------- |
| DNS             | Free         | Apex + obscure API subdomain (rotatable via admin-panel Ops)               |
| WAF             | Free         | Rule-based filtering on Bot Fight Mode + custom rules                      |
| DDoS protection | Free         | Unmetered at L3/L4/L7                                                      |
| Bot Fight Mode  | Free         | Blocks known bot signatures; configurable severity                         |
| Always Use HTTPS | Free        | HTTP→HTTPS upgrade at edge (no unencrypted leg reaches Fly)                |
| Turnstile       | Free         | Invisible CAPTCHA on anonymous `/claude` endpoints (PARSE, PROFILE)        |
| HSTS preload    | Free         | `acmelaunch.app` submitted to hstspreload.org                              |
| ASN blocklist   | Free         | Cloudflare firewall rules blocking Tor / residential-proxy / flagged ASNs  |
| Country blocklist | Free       | Rule-based (per-country block if needed)                                   |
| **AOP mTLS**    | Free         | Per-zone custom cert upload; origin verifies fingerprint (research F2)     |
| Geofencing (Pro) | $20/mo      | **Not active in MVP** — per-ASN blocklist on free tier is sufficient       |

### R2 (Blob Store)

| Field            | Value                                                                    |
| ---------------- | ------------------------------------------------------------------------ |
| Bucket           | Private (no public ACL)                                                  |
| Key format       | `{userId}/{ticketId}/result.{ext}` for per-user scoping                  |
| Signed URL TTL   | ≤15 min                                                                  |
| API key scope    | Scoped to single bucket with object read/write only (no account-level)   |
| Object Lock      | Enabled for audit-log archive prefix (`audit-log/YYYY/MM/*.jsonl.gz`)    |
| Egress           | **Free** — huge win vs S3 at scale                                       |

### Turnstile integration

- Frontend includes Turnstile widget (invisible) on AuthModal + idea-brief-submit page.
- On first anonymous `/claude` call, the frontend attaches the Turnstile token in a `CF-Turnstile-Response` header.
- Backend validates the token with Cloudflare's Siteverify API before processing.
- Upgrades v2's "accepted risk" on anonymous endpoint abuse → MVP requirement.

---

## Upstash QStash (Job Queue — v3)

### Overview

| Field      | Value                                                                  |
| ---------- | ---------------------------------------------------------------------- |
| Purpose    | Egress job queue (internal job queue is Graphile Worker inside Postgres) |
| Delivery   | HTTP push to worker endpoint                                           |
| Signing    | HMAC via `QSTASH_CURRENT_SIGNING_KEY` / `QSTASH_NEXT_SIGNING_KEY`      |
| Free tier  | 500 msg/day                                                            |
| Paid       | Per-message pricing; cap via per-account daily limit                   |

### Worker signature verification (Layer 11)

Every inbound POST to the worker endpoint **MUST** verify `Upstash-Signature` header using `QSTASH_CURRENT_SIGNING_KEY` (and `QSTASH_NEXT_SIGNING_KEY` during rotation windows). Failure → 401, no state mutation. Per backend PRD §16 decision 3.

### Double-rotation lockout (research F5)

Verbatim from Upstash docs: "Rolling your keys twice without updating your applications will cause your apps to reject all requests, because both the current and next keys will have been replaced."

**Guard:** Redis flag `qstash:last_rotation_deployed_at` is set by the deploy pipeline after a rotation. The admin-panel rotate button returns 409 Conflict if the flag is missing or >24h old.

### Redelivery

- Min 30s delay between retries
- Max 3 retries before dead-letter
- Dead-letter lands in Redis stream `qstash:dlq` for admin-panel review

---

## Anthropic Claude API — v3 additions

### Prompt Caching (mandatory from day 1, research F14)

Every Claude call is wrapped in `packages/shared/prompt-caching.ts` which applies `cache_control: {type: "ephemeral"}` on the cached region:

- System prompt
- `PROMPT_RULES` preamble
- Canonical feature context (per prompt key)

Expected input-token cost reduction: ~90% on cached portions. Cache hit rate exposed via `/admin/status` cache_hit_rate; alert fires if <80% over 1 hour.

### Batch API (non-interactive chains)

Async jobs that are not founder-interactive (asset generation chain, landscape analysis chain) use Anthropic's Batch API for a further 50% discount.

### Security (research F7 — blast-radius containment)

- Worker gets a **scoped Upstash ACL token** that cannot touch ledger, scope cache, or admin keys.
- Claude output is parsed as **action proposals**, validated against Zod schemas, routed to main API for authorization — no direct Stripe writes / no direct ledger debits / no direct public launch actions from Claude output.
- All Claude inputs + outputs audit-logged to Postgres `audit_log`.
- Optional second-pass Haiku 4.5 classifier on output for high-privilege actions.
