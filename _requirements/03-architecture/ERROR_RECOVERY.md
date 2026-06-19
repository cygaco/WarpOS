# AcmeLaunch — Error Recovery (Regen Spec)

> **v3 (2026-04-23)** — Aligned with `_requirements/04-features/backend/PRD.md` v3. The existing client-side + server-side recovery patterns below remain correct; **new sections at the bottom** cover the async ticket model: idempotency-key deduplication, worker redelivery after crash, client abort after debit, stuck-ticket sweep cron, and Redis connection failures during idempotency checks.

Fallback logic, retry strategies, and graceful degradation patterns across the pipeline. A regen agent needs these to reproduce the same resilience behavior.

---

## Client-Side API Retry (src/lib/api.ts)

### callClaude()

| Trigger                         | Behavior                        | Max Retries |
| ------------------------------- | ------------------------------- | ----------- |
| HTTP 429 (rate limit)           | Wait 3s \* (attempt + 1), retry | 2           |
| HTTP 502 + "overloaded"         | Wait 3s \* (attempt + 1), retry | 2           |
| Network error (TypeError)       | Wait 2s \* (attempt + 1), retry | 2           |
| HTTP 402 (insufficient credits) | Throw immediately, no retry     | 0           |
| HTTP 401 (auth error)           | Throw immediately, no retry     | 0           |
| Caller abort (signal)           | Throw "Cancelled" immediately   | 0           |
| Client timeout (100s)           | Throw "Request timed out"       | 0           |
| All retries exhausted           | Throw "Failed after retries"    | —           |

### fetchResearch() (Launch Research adapter)

| Phase   | Timeout    | Behavior                                                  |
| ------- | ---------- | --------------------------------------------------------- |
| Trigger | —          | Fire all queries in parallel; collect errors per-source   |
| Poll    | 360s total | Poll every 10s                                            |
| Force   | After 180s | Set `force: true` — accept partial results                |
| Timeout | After 360s | Throw "Launch research timed out"                         |

Progress callback: `onProgress(pending, total)` called each poll cycle.

**Integrity note:** A forced or timed-out run returns whatever signals were gathered and marks the rest as failed sources — it never fills the gap with synthesized evidence.

---

## Error Message Sanitization (src/lib/api.ts)

### safeErrorMessage()

Prevents internal details from leaking to founders:

1. **Safe patterns** (pass through): rate limit, timeout, cancelled, usage limit, overloaded, auth, credit/billing, file errors, parse failures
2. **Block patterns** (return fallback): messages > 200 chars, or containing `stack`, `trace`, `at \w`, `/api/`, `key`, `token`, `secret`
3. **Fallback:** "Something went wrong. Please try again."

---

## Two-Phase Landscape Pipeline (Step6Analysis.tsx)

### Phase 1: RESEARCH_PREP

```
try runResearchPrep(data)
  → success: prepReport string (feeds into Phase 2)
  → failure: log warning, return null (Phase 2 runs without prep)
```

### Phase 2: LANDSCAPE

```
try callClaude("LANDSCAPE", input)
  → failure: retry with smaller input (slim profile only, no raw data)
    → failure: throw to founder
```

### buildResearchSummary Fallback

```
try JSON.parse(data) → buildResearchSummary()
  → failure: silently skip summary (/* ignore */)
```

### Founder-Facing

On error: error card with retry button + hint "If this keeps failing, go back and try narrowing your research queries."

---

## Research Adapter Error Handling (src/app/api/research/route.ts)

### Trigger Phase

- Individual source failures don't block others
- Failed sources return an error message, successful ones return their signal batch
- If zero sources succeed → error returned to client

### Poll Phase

- Each source polled independently
- Failed-source records separated from result records (`include_errors=true`)
- Error codes and samples logged for debugging

### Force-Complete

When `force: true` (client sends after 3 min):

- Pending sources skipped with warning: `"X source(s) timed out and were skipped"`
- Ready sources processed normally
- All warnings surfaced in response `warnings[]` array

### Thin Data Warnings

- Failed-source records → `"source": N signals returned errors (error_code)`
- Timeout skips → `"N source(s) timed out and were skipped"`
- Deduplication applied to all results

---

## Claude API Route (src/app/api/claude/route.ts)

### Server-Side Timeout

90s timeout via `AbortController`. Distinguished from network errors:

- Timeout → HTTP 504 + "Request timed out. Please try again."
- Network error → HTTP 502 + "Failed to reach AI service. Please try again."

### Anthropic Error Mapping

| Anthropic Status | Mapped Status | Founder Message                                                       |
| ---------------- | ------------- | --------------------------------------------------------------------- |
| 400              | 502           | "Bad request to AI service. Try going back and re-running this step." |
| 401              | 502           | "AI service authentication failed. Check your API key."               |
| 403              | 502           | "AI service access denied. Check your API key permissions."           |
| 429              | 429           | "AI service is rate-limited. Wait a moment and retry."                |
| 500              | 502           | "AI service internal error. Please retry."                            |
| 503              | 502           | "AI service is temporarily overloaded. Please retry in a moment."     |
| 529              | 502           | "AI service is overloaded. Please retry in a moment."                 |

**Special case:** If Anthropic error contains credit/balance/billing keywords, the raw message is passed through (it's actionable).

### JSON Parse Fallback

```
try await request.json()
  → failure: HTTP 400 "Invalid JSON body"
```

---

## Credit Debit Atomicity (src/lib/credits.ts)

### Atomic Debit via Lua Script

The `debitCredits()` function uses a Lua script executed atomically in Redis to prevent race conditions where concurrent requests could debit more credits than available:

```lua
local bal = tonumber(redis.call('GET', KEYS[1]))
if bal == nil then return -1 end        -- no account
if bal < tonumber(ARGV[1]) then return -2 end  -- insufficient
return redis.call('DECRBY', KEYS[1], ARGV[1])  -- new balance
```

Return codes: `-1` = no account (needs init), `-2` = insufficient balance, positive number = new balance after debit.

The in-memory fallback (dev without Redis) uses simple check-then-subtract since concurrency isn't an issue locally.

---

## Stripe Webhook Idempotency (v3 — Postgres-backed, three-state)

**v2** used Redis `SET NX` for atomic claim + 30-day TTL. **v3** migrates this to Postgres per research F1 (Redis eventual consistency is unsuitable for payment-bearing state). The pattern remains functionally three-state but leverages Postgres transactional semantics + `INSERT ... ON CONFLICT` for race-free idempotency.

### Three-state model (Postgres)

```sql
-- stripe_webhook_idempotency table
-- PRIMARY KEY (event_id)
-- state: enum('queued' | 'processing' | 'done')
-- claimed_at, finished_at: timestamps

BEGIN;
  -- Atomic claim: insert as 'processing', OR update only if state = 'queued' or stale
  INSERT INTO stripe_webhook_idempotency (event_id, state, claimed_at)
  VALUES ($1, 'processing', now())
  ON CONFLICT (event_id) DO UPDATE
    SET claimed_at = now()
    WHERE stripe_webhook_idempotency.state = 'queued'
       OR (stripe_webhook_idempotency.state = 'processing'
           AND EXTRACT(EPOCH FROM (now() - stripe_webhook_idempotency.claimed_at)) > 60);
  -- If no rows affected, another deliverer is processing → return 200 with note

  -- Do the actual side effects inside the same transaction
  INSERT INTO credits_ledger (user_id, delta: $2, reason: $3, stripe_event_id: $1);
  -- trigger updates credit_balances

  UPDATE stripe_webhook_idempotency SET state = 'done', finished_at = now() WHERE event_id = $1;
COMMIT;
```

**Key guarantees:**
- Atomic claim via `ON CONFLICT` — no race window between check and write.
- **Stale-claim steal at 60s** — if a deliverer claimed `processing` but crashed before completing, the next delivery can steal the claim and re-process.
- Ledger + idempotency-state transitions happen in **one Postgres transaction** — crash mid-way aborts cleanly; next delivery sees `queued` or stale `processing` and recovers.
- Replay safety: `ON CONFLICT (stripe_event_id) DO NOTHING` on the ledger insert prevents double-credit even in edge cases.

### Stuck-processing sweep

`cron.stuck-processing-sweep` runs every minute. Any row stuck in `processing` for >5 min (e.g., after a worker crash) is transitioned back to `queued`; next webhook delivery re-processes cleanly.

### Audit

Every Stripe event + outcome is audit-logged: `INSERT INTO audit_log (type: 'STRIPE_WEBHOOK', user_id, detail)`. Durable per §8.2 Layer 9.

---

## Session Persistence (src/lib/storage.ts)

### Save Strategy

```
1. Encrypt → localStorage (always, catch errors silently)
2. If authenticated → POST /api/session (fire-and-forget, catch errors silently)
```

Neither save failure blocks the UI.

### Load Strategy

```
1. Try server (GET /api/session)
   → success + data: decrypt and return
   → success + no data: fall through
   → failure: fall through
2. Try localStorage
   → success: decrypt and return
   → failure: return null
3. Size guard: if raw > 5MB, clear and return null
```

---

## Launch Asset Generation (Step10Assets.tsx)

### Base Asset Failure

```
try callClaude("ASSET_GEN", ...)
  → success: set master + general, move to "selecting" phase
  → failure: show error message, move to "done" phase (founder can retry)
```

### Segment Variant Failure

```
try callClaude("VARIANT", ...)
  → success: apply diffs, set segment asset packs
  → failure: show "Segment-specific assets failed. Your base launch assets are ready."
```

Partial success: base assets are preserved even if segment-variant generation fails.

### Download Failure

```
try generatePdfBlob() / generateZipBlob()
  → failure: "Download failed — try again." (non-destructive, can retry)
```

### Credit Balance Fetch

```
try fetch("/api/credits")
  → failure: silent fallback to initial balance (150)
```

---

## Idea-Brief Parsing (Step1IdeaBrief.tsx)

### File Extraction

```
try extractText(file)
  → failure: "File extraction failed. Please try a different file."
```

### Claude Parse

```
try callClaude("PARSE", text) → JSON.parse(cleanJson(r))
  → failure: "Idea-brief parsing failed. Please try again."
  → cancel: "Cancelled. You can try again."
```

Both errors are surfaced inline with the idea-brief form.

---

## Profile Generation (Step4Profile.tsx)

```
try callClaude("PROFILE", ...)
  → failure: safeErrorMessage(err, "Profile generation failed. Try again or go back to edit your idea brief.")
```

---

## Launch Run Prompt (Step13LaunchRun.tsx)

### Prompt Generation

```
try callClaude("RUN_RULES", ...)
  → failure: "Launch run setup failed. Please try again."
```

### Launch Console Communication

```
try fetch("/launch-console/queue")
  → response not ok: show response.error
  → catch: "Couldn't load the launch queue. Please refresh and try again."

try fetch("/launch-console/outcomes", { method: "POST", body })
  → timeout: "Saving the outcome timed out. We'll retry on the next action."
  → catch: "Could not record the outcome. Check your connection and retry."
```

---

## Data Truncation Fallbacks (src/lib/utils.ts)

### preprocessResearchData()

```
1. Try JSON.parse → build summary header + concat objects
   → If total > 30,000 chars: truncate (stop adding objects), set truncated=true
2. Catch: treat as plain text
3. If text > 30,000 chars: substring truncate
```

### buildResearchPrepPayload()

```
1. Build compact results with 300-char snippet excerpts
2. If payload > 35,000 chars: retry with 150-char excerpts
```

---

## Reach-Signal Extraction (src/lib/utils.ts)

### extractReachSignals()

Workaround for sources mixing organic-reach and paid-spend figures:

- Regex: `$XX-$YY test`/CPM/per-lead patterns from research-snippet text
- Filters: $15-$5000 range (rejects unreasonable values)
- Source: `buildResearchPrepPayload()` passes these as `reachSignalsFound` to RESEARCH_PREP prompt

---

## Launch Console Error Recovery (runner.ts)

### Per-Action Error

```
try processAction(item)
  → catch: reportOutcome('failed', { reason: err.message }), discardDraft()
```

Individual action failures don't stop the loop — processing continues with the next queued action.

### Page-Level

```
try waitForQueue(15000)
  → timeout: updateStatus({ state: 'error', error: 'No launch actions found' })
```

### Loop Completion

```
runLaunchLoop().catch(err => {
  updateStatus({ state: 'error', error: err.message })
  showStatusBadge('Error — check console', '#ff4444')
})
```

### Draft Cleanup

On any error during action processing, `discardDraft()` is called to dismiss any open compose/preview draft, including handling the "Discard this draft?" confirmation dialog.

---

## Summary: Recovery Hierarchy (v3)

| Layer                | Strategy                                                                  |
| -------------------- | ------------------------------------------------------------------------- |
| Network              | 2x retry with exponential backoff + X-Idempotency-Key (dedup on retry)    |
| Claude API           | Retry on 429/502, immediate fail on 401/402. Prompt Caching on every call |
| Research Adapter     | Async ticket; force-complete after 3 min; warnings for skipped sources     |
| Landscape Pipeline   | `/claude/chain` async; worker checkpoints after RESEARCH_PREP; resume on crash |
| Credit Debit         | **Postgres transactional** — ledger + job enqueue in one BEGIN/COMMIT      |
| Stripe Webhook       | Postgres three-state idempotency + stale-claim steal + stuck-sweep cron   |
| Session              | Server → localStorage → null (never blocks UI)                             |
| Asset Gen            | Base preserved if segment variants fail; async ticket with R2 signed URL   |
| Ticket Failure       | Refund ledger entry, audit log, stuck-sweep transition                    |
| Worker Crash         | SIGTERM drain (270s) + Postgres checkpoint + QStash redelivery            |
| Client Abort         | Abort signal checked post-debit; refund + QStash cancel                   |
| Redis Failure        | Worker returns non-200 to QStash (retry) if idempotency check unconfirmed |
| Launch Console       | Per-action error isolation; draft cleanup; `/launch-console/outcomes` for durable trail |
| Founder Messages     | safeErrorMessage() contract: code + short message + requestId only        |

---

## Ticket Idempotency (v3 — new)

Every ticket-creating endpoint accepts `X-Idempotency-Key: <uuid>` header. The backend dedups in Redis (`idempotency:{userId}:{key}`, 5-min TTL).

**Flow:**

```
POST /research/run with X-Idempotency-Key: k1
  → Redis GET idempotency:{userId}:k1
     If exists → return stored {ticketId}  (no debit, no enqueue)
     If absent → continue
  → BEGIN;
     INSERT idempotency record (Redis SET with NX + 5min TTL)
     INSERT INTO credits_ledger (debit)
     SELECT graphile_worker.add_job(...)
    COMMIT
  → Return {ticketId}
```

Client-side retry on network error uses the **same idempotency key**, so the second attempt hits the dedup path and returns the original ticketId. No second debit, no second job.

---

## Worker Redelivery & Recovery (v3 — new)

### QStash redelivery settings

- Minimum 30-second delay between retries
- Maximum 3 retries before dead-letter
- Dead-letter messages land in Redis stream `qstash:dlq` for admin-panel review

### Worker crash recovery

1. Worker process crashes mid-job (e.g., OOM kill, Fly machine restart)
2. QStash redelivers the message after the retry delay
3. Worker reads `ticket.checkpointedStep` from Postgres
4. Resumes from the last checkpoint rather than restarting — prevents duplicate Claude calls
5. Debit is keyed by ticketId — if already debited, skip the debit step (idempotent)

### Stuck-ticket sweep

`cron.stuck-ticket-sweep` runs every minute. Tickets in `running` status for >2× expected duration → transitioned to `failed`, refund ledger entry emitted, founder sees ticket failed.

---

## Client Abort After Debit (v3 — new, RT-017 fix)

**Scenario:** Client calls `POST /research/run`; server receives request, debits credits, enqueues job; before the response is sent, the client closes the TCP connection (network partition, tab closed, etc.). Client never receives ticketId → retries → double-debit.

**Fix:**

1. Handler generates idempotency record + debit + enqueue inside a single transaction.
2. After COMMIT, before sending response, handler checks `c.req.raw.signal.aborted`.
3. If aborted: emit refund ledger entry + cancel QStash message via Graphile Worker's `remove_job`.
4. If not aborted: send response normally.

**Belt-and-braces:** idempotency key from §Ticket Idempotency above means that a retry with the same key also wouldn't double-debit — the abort path is the backup.

---

## Redis Connection Failure During Idempotency Check (v3 — new, RT-022 fix)

**Scenario:** Worker receives a QStash message. Before processing, it must check the idempotency key to avoid double-execution. Redis is transiently unreachable (network blip, Upstash failover).

**Rule: worker must NOT proceed without a confirmed idempotency check.**

```
1. Worker receives QStash POST, signature verified
2. try: redis.GET idempotency-key
   catch (ECONNREFUSED / timeout):
     return 500 to QStash (triggers redelivery after delay)
     // Do NOT proceed with job execution
3. If result is "running" or "done" → return 200 to QStash (idempotent no-op)
4. If result is null → claim it (SET NX with TTL), proceed with job
```

Dead-letter after 3 retries. Alert to admin panel dashboard if dead-letter depth >10.

---

## QStash Signing-Key Double-Rotation Guard (v3 — new, F5 fix)

**Scenario (per Upstash verbatim docs):** "Rolling your keys twice without updating your applications will cause your apps to reject all requests, because both the current and next keys will have been replaced."

**Fix:**

1. Admin-panel "Rotate QStash key" button sets `qstash:last_rotation_deployed_at` in Redis.
2. Second click of the same button checks the flag: if missing or >24h old → 409 Conflict with "Confirm prior rotation deployed first."
3. Flag is cleared automatically after a successful deploy that re-reads both `QSTASH_CURRENT_SIGNING_KEY` + `QSTASH_NEXT_SIGNING_KEY` from secrets.

---

## Error Sanitization Contract (v3)

Every error response body and every `ticket.error` field goes through `safeErrorMessage()` in `packages/shared/errors.ts`. Output:

```typescript
{
  error: string,          // enum code, e.g. "AUTH_EXPIRED", "RATE_LIMITED"
  message: string,        // short human-readable
  requestId: string       // for log correlation
}
```

**Never:** stack traces, file paths, Redis key names, Postgres error messages, Anthropic API details, founder emails, internal IDs.
