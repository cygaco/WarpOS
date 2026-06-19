# AcmeLaunch — Data Flow & State Management

> **v3 (2026-04-23)** — Aligned with `_requirements/04-features/backend/PRD.md` v3. Synchronous same-origin `/api/*` flows have moved to the dedicated backend at `${API_BASE_URL}/*`. Long-running operations (launch research, asset-pack build) use the **ticket model** — the client posts an enqueue request, receives a `ticketId`, and polls `GET /tickets/{id}` for progress/result. Credit ledger is **Postgres-authoritative**; Redis stream is ops-UI cache only.

> **Scope:** Session state structure, data flow between steps, persistence layers. For pipeline stages and error handling, see `PIPELINES.md`. For data contracts between features, see `DATA-CONTRACTS.md`.

> **Source of truth for step ordering:** `_requirements/00-canonical/STEPS.json`. This doc reflects shipped state. Forward-looking changes go in the **Roadmap** section at the bottom.

---

## Central State: SessionData

All founder data across all 10 steps lives in a single `SessionData` object. This is the source of truth for the wizard.

### Key Properties

| Category         | Fields                                                         | Set By Step |
| ---------------- | -------------------------------------------------------------- | ----------- |
| **Navigation**   | currentStep, maxStep, schemaVersion                            | System      |
| **IdeaBrief**    | briefRaw, briefStructured, founder, background                 | 1           |
| **Context**      | context (launch goal, launch stage, etc.)                      | 1–2         |
| **Constraints**  | constraints (budget, timeline, channels, geography, deal breakers) | 2      |
| **FounderProfile** | founderProfile (positioning fit, readiness, audiences served, gaps, differentiators) | 1, 3 |
| **Research**     | generatedQueries, researchSource, researchResults, queryStats | 4           |
| **Landscape**    | landscapePrepReport, landscapeAnalysis                         | 5           |
| **Q&A**          | deepDiveQuestions, deepDiveResults, deepDiveChatMsgs           | 6           |
| **Segments**     | audienceSegments, rankedSegments                               | 5–6         |
| **Scope**        | exclusions                                                     | 7           |
| **AssetPacks**   | masterPlan, overviewPlan, segmentPlans                         | 8           |
| **Channels**     | launchChannels, channelAnswers                                 | 9           |
| **LaunchRun**    | runData (launch rules, consolePrompt, manualGuide)             | 10          |
| **Tracking**     | generatedAssetPacks                                            | 8           |

---

## State Management Pattern

### No State Library

AcmeLaunch uses React's built-in `useState` in the root `page.tsx` component. State is passed down via props (prop-drilling pattern). There is no Redux, Zustand, or Context API for wizard state.

### State Flow

```
page.tsx (owns SessionData)
  │
  ├─ passes session + callbacks to page composites
  │   ├─ OnboardingPage receives: session, complete(), go()
  │   ├─ PlanPage receives: session, complete(), go()
  │   ├─ PrepPage receives: session, complete(), go()
  │   └─ Step13Run receives: session, complete(), go()
  │
  └─ page composites pass relevant slices to step components
      └─ Step10Plans receives: session.founderProfile, session.landscapeAnalysis,
         session.exclusions, session.masterPlan, etc.
```

### State Updates

1. **complete(step, data)**: Merges partial data into SessionData, advances step, triggers save
2. **go(step)**: Navigates to step (snapshots before backward nav), no data merge
3. **reset()**: Clears all session data, returns to step 0

---

## Persistence

### Dual Storage

```
┌─────────────┐     save()      ┌──────────────────────┐
│  SessionData │ ──────────────► │ Encrypted localStorage │  (always)
│  (in memory) │                 └──────────────────────┘
│              │     save()      ┌──────────────────────────┐
│              │ ──────────────► │ POST ${API_BASE}/session │  (if authenticated)
└─────────────┘                 └──────────────────────────┘
```

### Load Priority

1. If authenticated: try server `GET ${API_BASE}/session` first
2. Fallback: decrypt from localStorage
3. If neither: start fresh (step 0)

### Save Triggers

- Every `complete()` call
- Every `go()` call (navigation)
- Explicit save after profile edit

See `PERSISTENCE.md` for encryption details.

---

## Data Flow Through the Wizard

### Step 1 → 3: Onboarding

```
Raw idea-brief text/file
  → POST ${API_BASE_URL}/claude (PARSE prompt) — anonymous endpoint
     ↪ First call per browser triggers Cloudflare Turnstile (invisible; <100ms)
  → BriefStructured (founder, product, audience hints, background)
  → User edits founder info, background, constraints
  → POST ${API_BASE_URL}/claude (PROFILE prompt) — anonymous endpoint, Turnstile applies
  → FounderProfile (positioning fit, readiness, audiences served, gaps, differentiators)
  → User reviews and confirms
```

### Step 4: Research (ticket-based — v3)

```
FounderProfile + Constraints
  → POST ${API_BASE_URL}/claude (QUERY_GEN prompt) — synchronous
  → generatedQueries[] (4–6 launch-landscape research strings)
  → POST ${API_BASE_URL}/research/run
     Headers: X-Idempotency-Key (UUID, generated by client; 5min dedup window)
     Body: { queries, geography, channels?, sourceTypes? }
  → { ticketId, status: "queued" }  — ticket is bound to userId at creation

  ─ (backend side: atomic transactional enqueue)
  ─   BEGIN;
  ─     INSERT INTO credits_ledger (LANDSCAPE_PREP cost, ticket_id);
  ─     SELECT graphile_worker.add_job('research.run', {ticketId});
  ─   COMMIT;
  ─   (if Postgres rolls back, ledger + job both absent — no orphan)

  → Client polls GET ${API_BASE_URL}/tickets/{ticketId} every 5s
     (ownership: JWT.sub must match ticket.ownerUserId else 403)
  → Progress updates: stage=RESEARCH_DISPATCH → RESEARCH_POLL → RESEARCH_RESULTS
     step/total reflect worker progress
  → Final: { status: "done", result: { results, queryStats, warnings } }
     OR if >256KB: { status: "done", result: { signedUrl, expiresAt } }
  → researchResults (LaunchResearchResult[] JSON)
```

### Step 5: Analyze (chain-based — v3)

```
researchResults + FounderProfile + Constraints
  → preprocessLandscapeData() — normalize, truncate to 30K chars (client-side)
  → buildLandscapePrepPayload() — compact research records, wrap in <untrusted_research_data nonce="..."> (shared package)

  → POST ${API_BASE_URL}/claude/chain
     Headers: X-Idempotency-Key
     Body: { promptChain: [{key: "LANDSCAPE_PREP", message}, {key: "LANDSCAPE", message: "<uses prior output>"}] }
  → { ticketId, status: "queued" }

  ─ (backend side: Prompt Caching wraps both calls — system prompt + PROMPT_RULES + canonical context cached ephemerally per §8.16)

  → Client polls GET ${API_BASE_URL}/tickets/{ticketId} every 3s
  → Progress: stage=LANDSCAPE_PREP_INPUT → LANDSCAPE_PREP_OUTPUT → LANDSCAPE_INPUT → LANDSCAPE_OUTPUT
  → Final: { landscapePrepReport, landscapeAnalysis }
  → LandscapeAnalysis (positioning language, audienceSegments, channelSignals, deepDiveQuestions)
```

### Step 6: Deep-Dive Q&A (Onboarding — shipped state)

```
deepDiveQuestions (from LandscapeAnalysis, produced during step 5)
  → Step 6 mounts after step 5 completes
  → Presented one at a time in DeepDiveAccordion
  → Founder answers in chat-like interface
  → deepDiveResults (per-question: answered/unanswered/not-relevant + text)
  → Step 6 completes → advances to step 7 (Scope)
```

Per `_requirements/00-canonical/STEPS.json`, Step 6 lives in the onboarding phase. See **Roadmap** section below for planned dashboard relocation (data contract identical; only host surface changes).

### Step 7: Scope

```
FounderProfile.priorities + LandscapeAnalysis.positioningLanguage + BriefStructured.scope_section
  → mergeScopeSources() — deduplicate, stem-match, categorize
  → ScopeEntry[] with sources, frequency, category
  → Founder toggles include/exclude
  → exclusions (final scope selection)
```

### Step 8: Plans & Assets (chain + R2 — v3)

```
FounderProfile + LandscapeAnalysis + deepDiveResults + exclusions
  → POST ${API_BASE_URL}/claude/chain (PLAN_GEN + per-segment SEGMENT_PLAN as chained)
  → { ticketId, status: "queued" }

  ─ (backend: worker runs PLAN_GEN → N × SEGMENT_PLAN → N × asset-pack render → N × PDF build)
  ─ Result bundle typically 1–5 MB; written to R2 at users/{userId}/tickets/{ticketId}/launch-plan.zip

  → Client polls GET /tickets/{ticketId}
  → Progress: step 1/N (master) → 2/N (overview) → 3/N..N+2/N (segment) → N+3/N (asset render) → N+4/N (PDF)
  → Final: { status: "done", result: { signedUrl, expiresAt } } — R2 signed URL, ≤15min TTL
  → Client fetches signed URL → binary ZIP → founder downloads
```

### Step 9: Channels

```
FounderProfile + Constraints + background + deepDiveResults + #1 segment
  → POST ${API_BASE_URL}/claude (CHANNELS prompt) — synchronous, Prompt Caching active
  → launchChannels (announcement copy, landing-page content, email sequence, community post, demo script)
  → channelAnswers (common-question field/value pairs for follow-up templates)
```

### Step 10: Launch Run

```
FounderProfile + LaunchPlan + channelAnswers + rankedSegments + exclusions + constraints
  → POST ${API_BASE_URL}/claude (LAUNCH_RUN prompt) — synchronous, Prompt Caching active
  → launch rules (publishIf, holdIf, unknownFieldFramework, follow-up guidance)
  → manualGuide (channels, publishIf, holdIf)

Code-assembled (not AI-generated):
  → buildLaunchRunPrompt(session, rules, generatedAssetPacks)
  → consolePrompt (markdown, ~3000 words)

Runner runtime (per launch action):
  → AcmeLaunch Runner fetches launch rules from SessionData (already generated)
  → Runner stages the launch action → pauses for founder approval (control: never auto-publish)
  → Founder clicks publish → runner posts the outcome:
     POST ${API_BASE_URL}/launch-console/outcomes
     Body: { outcomes: [{ actionId, targetUrl, actionTitle, channel, status, reason?, ruleVersion, executedAt, ticketId? }] }
  → Backend writes to Postgres launch_outcomes (authoritative) + audit_log + Redis stream (ops-UI)
  → Backend dedup: same {userId, targetUrl, status} within 24h collapses to one row
  → LaunchReadinessScore reads from Postgres launch_outcomes for the founder's real executed-action count
```

---

## Cross-Cutting Data Flows

### Launch Readiness Score

Computed client-side from SessionData completeness. Not stored — derived on every render.

Inputs: founderProfile existence, landscape analysis, Q&A completion, scope curated, plans generated, channels generated.

### Credit Economy (Postgres-authoritative — v3)

```
Founder action (e.g., generate segment plan)
  → Client checks: is this billable? (BILLABLE_PROMPTS list)
  → POST ${API_BASE_URL}/claude includes auth token + X-Idempotency-Key
  → Server (api process): checks Postgres credit_balances for sufficient balance
     If insufficient → 402 { error: "INSUFFICIENT_CREDITS", remaining, cost }
  → Transactional debit-before-run (for async jobs):
     BEGIN;
       INSERT INTO credits_ledger (user_id, delta: -cost, reason, ticket_id, request_id, stripe_event_id?);
       -- trigger updates credit_balances.balance
       (for async) SELECT graphile_worker.add_job('claude.chain', {ticketId});
     COMMIT;
  → Client updates displayed balance (from GET /credits → includes recentLedger[20])

On job failure (worker):
  → BEGIN;
      INSERT INTO credits_ledger (user_id, delta: +cost, reason: "REFUND:<original-reason>", ticket_id);
      -- trigger restores balance
    COMMIT;

Stripe webhook (credit purchase):
  → POST /stripe/webhook → signature verified
  → Three-state idempotency via Postgres stripe_webhook_idempotency table:
     queued → processing → done (atomic transitions)
     ON CONFLICT (event_id) DO NOTHING — replay-safe
  → BEGIN;
       UPDATE stripe_webhook_idempotency SET state = 'processing' WHERE event_id = $1 AND state = 'queued';
       INSERT INTO credits_ledger (user_id, delta: +packAmount, reason: "STRIPE:<session_id>", stripe_event_id: $event_id);
       UPDATE stripe_webhook_idempotency SET state = 'done' WHERE event_id = $1;
     COMMIT;
  → (if crash between processing and done, cron.stuck-processing-sweep re-claims after 5 min)
```

**Note:** Redis is NOT the ledger (v3 change — research F1). Redis retains:
- Ops-UI live-tail stream `credits:ledger:{userId}` (synchronized from Postgres writes but not authoritative)
- Rate-limit counters
- Scope cache (read-through from Postgres admin_users)

**See §8.13 in backend PRD** for the full split rationale.

### Invalidation

```
Founder navigates backward to step N and changes data
  → System snapshots current data for step N fields
  → Founder completes step N with new data
  → Compare: did anything change?
  → If changed: clear all downstream fields per INVALIDATION_MAP
  → If unchanged: skip invalidation, re-advance
```

---

## Ticket Lifecycle (v3 — new)

Every async job is represented by a ticket. Lifecycle:

```
  ┌──────────┐      enqueue       ┌──────────┐   worker pulls   ┌──────────┐
  │ (no row) │ ────────────────▶ │  queued  │ ───────────────▶ │ running  │
  └──────────┘                    └──────────┘                  └────┬─────┘
                                                                     │
                                                          ┌──────────┴──────────┐
                                                          ▼                     ▼
                                                   ┌──────────┐         ┌──────────┐
                                                   │   done   │         │  failed  │
                                                   └──────────┘         └──────────┘
```

**Fields:**

```typescript
Ticket {
  id: string            // UUIDv4 external (never expose UUIDv7 timestamps to clients)
  internalId: string    // UUIDv7 for sortable internal audit
  ownerUserId: string   // JWT.sub must match this on every GET /tickets/{id}
  kind: "research.run" | "claude.chain" | "assetpack.build" | ...
  status: "queued" | "running" | "done" | "failed"
  progress: { step: number, total: number, stage: string }  // worker updates
  result?: any | { signedUrl: string, expiresAt: number }   // R2 if >256KB
  error?: { code: string, message: string, requestId: string }  // sanitized via safeErrorMessage()
  idempotencyKey: string  // X-Idempotency-Key from client
  createdAt: Date
  updatedAt: Date
  checkpointedStep?: number   // for crash recovery — worker resumes from here
}
```

**Ownership enforcement:** every poll validates `JWT.sub === ticket.ownerUserId`. Mismatch → 403 with no metadata in response (prevents enumeration).

**Crash recovery:**
- Worker checkpoints progress to Postgres (via Graphile Worker's built-in job state) on every step.
- On QStash redelivery after a crash, worker checks `ticket.checkpointedStep` and resumes from there rather than restarting.
- Tickets stuck in `running` for >2× expected duration → `cron.stuck-ticket-sweep` transitions to `failed` + emits refund ledger entry.

---

## Idempotency Key Handling (v3 — new)

Every ticket-creating endpoint accepts `X-Idempotency-Key: <uuid>` header. Same key within a 5-minute window returns the same ticketId, no second debit, no second enqueue.

**Client-side (src/lib/api.ts):**

```typescript
async function runResearch(queries, geography) {
  const idempotencyKey = crypto.randomUUID();
  const res = await fetch(`${API_BASE}/research/run`, {
    method: "POST",
    headers: { "X-Idempotency-Key": idempotencyKey, "Content-Type": "application/json" },
    body: JSON.stringify({ queries, geography })
  });
  // On network error retry, same idempotencyKey is reused — backend returns the original ticketId
}
```

**Server-side:**

- Lookup `idempotency:{userId}:{key}` in Redis (5-min TTL)
- If present → return stored ticketId (no debit, no enqueue)
- If absent → transactional insert of idempotency record + ledger debit + job enqueue

**Client abort (RT-017):** if the client closes the TCP connection after the server received the request but before the response was sent, the handler checks `c.req.raw.signal` at each step. If aborted and debit already happened, the handler emits a refund ledger entry and cancels the QStash message.

---

## Job Queue Flow (v3 — new)

```
  API process                    Postgres (Graphile Worker queue)                Worker process
  ───────────                    ─────────────────────────────────                ─────────────

  POST /research/run
  debit + add_job ──────────────▶ credits_ledger   graphile_worker.jobs
                                  (atomic)         (payload: {ticketId})

                                                                                 worker polls Graphile Worker
                                                                                 OR QStash HTTP push
                                                                                 (QStash verifies signature — layer 11)

                                                                                 ┌─ BEGIN
                                                                                 │   UPDATE tickets SET status='running', checkpointedStep=0
                                                                                 │   (execute job steps)
                                                                                 │   UPDATE tickets SET progress=..., checkpointedStep=N
                                                                                 │   (wrapUntrustedData for any research-provider data)
                                                                                 │   (Prompt Caching on Claude calls)
                                                                                 │   ... (on success) UPDATE tickets SET status='done', result=...
                                                                                 │   (on failure) UPDATE tickets SET status='failed', error=... + refund ledger
                                                                                 └─ COMMIT

  GET /tickets/{id} ◀──────────── poll every 3-10s ─────────────────────────────
  (ownership check)              
```

**Why Graphile Worker for internal enqueue:** the debit + job-add live in a single SQL transaction (`BEGIN; INSERT INTO credits_ledger; SELECT graphile_worker.add_job; COMMIT`), eliminating the dual-write hazard of "debited but never queued." QStash remains in the stack for **egress** (webhooks out to analytics / downstream services), not for internal job dispatch.

**QStash signature verification (Layer 11):** every HTTP push to the worker endpoint verifies Upstash-Signature HMAC using `QSTASH_CURRENT_SIGNING_KEY` / `QSTASH_NEXT_SIGNING_KEY` before processing. Failure → 401, no state mutation. Double-rotation lockout guarded via `qstash:last_rotation_deployed_at` Redis flag.

---

## Ledger Updates (v3 — new)

Every movement in the credit economy writes a Postgres row (authoritative) + a Redis stream entry (ops-UI cache):

```
Event                                       Postgres credits_ledger                       Redis stream
─────                                       ───────────────────────                       ────────────
Debit before job                            delta: -cost, reason: "SEGMENT_PLAN:plan-3"  XADD credits:ledger:{userId}
Refund on job failure                       delta: +cost, reason: "REFUND:<original>"   XADD credits:ledger:{userId}
Refund on client abort                      delta: +cost, reason: "ABORT:<original>"    XADD credits:ledger:{userId}
Stripe top-up                               delta: +packAmount, reason: "STRIPE:..."     XADD credits:ledger:{userId}
Admin grant                                 delta: +amount, reason: "ADMIN:<adminUid>"   XADD audit:events + credits:ledger
Admin reset                                 delta: setTo(amount), reason: "ADMIN_RESET"  XADD audit:events + credits:ledger
```

**Postgres is the source of truth.** GET /credits reads balance + recentLedger[20] from Postgres; if the Redis cache diverges (which it can during a Redis failover — research F1), Postgres wins on next sync.

**Audit visibility:** every admin action additionally writes to the global `audit_log` Postgres table (partitioned monthly) + nightly archive to R2 with Object Lock.

---

## Roadmap

> Forward-looking changes that haven't shipped yet. The sections above describe the **shipped state**.

### Step 6: Deep-Dive Q&A → Dashboard relocation

Currently Step 6 (Deep-Dive Q&A) runs as part of onboarding, immediately after Step 5 (Landscape Analysis). The data contract — `deepDiveQuestions` produced in Step 5 → `deepDiveResults` produced in Step 6 — is identical. Planned change: move the host surface from onboarding to the Dashboard, where founders can launch Deep-Dive Q&A as an optional tier-jump activity at any time.

**Target flow:**

```
deepDiveQuestions (still produced during onboarding step 5)
  → Founder finishes onboarding and lands on the Dashboard
  → Founder clicks "Deep-Dive Q&A" Dashboard activity (optional)
  → Presented one at a time in DeepDiveAccordion (same component)
  → Founder answers in chat-like interface
  → deepDiveResults (per-question: answered/unanswered/not-relevant + text)
  → Founder returns to Dashboard at any time
```

**Why:** readiness scoring shouldn't gate on Q&A — it's an enhancement, not a blocker. Moving to Dashboard preserves the data flow while removing the onboarding chokepoint.

**STEPS.json change:** Step 6's `phase` field flips from `"onboarding"` to `"dashboard"`. The component file (`Step6QA.tsx`) stays the same — the host surface (where it's mounted) changes.

### Postgres-first founder data (per `user-data-production-plan.md`)

Currently the SessionData JSONB blob lives in Upstash Redis. Phase 1 of the user-data plan migrates this to Postgres (Neon) with Redis as cache only. Auth/payments/credits all become Postgres-authoritative. See `user-data-production-plan.md` for full phasing.

### Per-branch preview deploys

Currently `.github/workflows/backend.yml` deploys only on `main` push. Phase 2 of user-data plan adds `.github/workflows/fly-review.yml` to spawn a Fly review app + Neon branch + Vercel preview env per PR. End-to-end testable previews without merging to main.
