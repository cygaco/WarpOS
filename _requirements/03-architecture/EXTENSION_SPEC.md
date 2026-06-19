# AcmeLaunch — Launch Console Spec (Regen Spec)

The Launch Console is the in-app surface that runs a guided launch: it sequences queued launch actions, pauses for founder approval before every public action, and records the outcome of each. It is a normal authenticated module of the AcmeLaunch web app — there is no browser extension. All files in `src/launch-console/`.

---

## Module Identity

| Field                  | Value                                                              |
| ---------------------- | ------------------------------------------------------------------ |
| Module                 | Launch Console                                                     |
| Version                | 0.1.0                                                              |
| Surface                | In-app route `/launch-console` (authenticated)                     |
| Auth                   | Standard app session (JWT cookie) + scope `user`                   |
| Server endpoints       | `GET /launch-console/queue`, `POST /launch-console/outcomes`, `GET /launch-console/prompts/:queueItemId` |
| Channels               | One or more `LaunchChannel` providers (email, social, community, marketplace, ads, content) |

**Origin / session model:** Because the Launch Console is a first-party app module (not a cross-extension surface), it uses normal app auth, session, and CSRF protection — the same `X-Session-Nonce` + Origin/Referer allowlist that guards every other route. There is no `externally_connectable` allowlist and no cross-origin message bridge to maintain.

---

## Architecture

```
Launch Run page (LaunchRunPage.tsx)
  │  fetch GET /launch-console/queue   (load the next LaunchActionQueueItem[])
  ▼
Launch Console controller (launch-console/controller.ts)
  │  session store (run state + progress, via loadSession/saveSession)
  │  per-action: load prompt, evaluate run-rules, render for review
  ▼
Action Runner (launch-console/runner.ts)
  │  prepare each action (compose, target channel, stage assets)
  │  PAUSE for founder approval (review overlay)
  ▼
Outcome Reporter (launch-console/outcomes.ts)
     POST /launch-console/outcomes   (durable LaunchOutcome trail)
     reads status back into the Launch Console UI
```

---

## Run State (Session-Backed)

| Key                     | Type   | Contents                                                              |
| ----------------------- | ------ | -------------------------------------------------------------------- |
| `launchConsole_run`     | Object | Full payload: queue, profile, run-rules, assets, constraints         |
| `launchConsole_status`  | Object | Current state, stats, current action, timestamps                     |

### Run Shape

```javascript
{
  queue: [{ queueItemId, actionType, channel, target, assetRef, scheduledFor }],
  profile: { name, contact, links, ... },
  runRules: { runIf: [], holdIf: [], runThreshold, outreachGuidance },
  constraints: { channelScope, actionTypes, dealBreakers, budgetFloor, geography, preferredChannel },
  followUpTemplates: { questionLabel: value },  // Follow-up answer map
  assetPacks: [],
  outreachGuidance: "",
  runId: string,
  receivedAt: timestamp,
}
```

### Status Shape

```javascript
{
  state: 'idle' | 'preparing' | 'running' | 'paused' | 'complete' | 'error',
  currentAction: { actionType, channel, target } | null,
  stats: { succeeded: 0, skipped: 0, failed: 0, total: 0 },
  currentSegmentIndex: 0,
  currentPage: 1,
  error: null | string,
  startedAt: timestamp | null,
  updatedAt: timestamp | null,
}
```

---

## Queue & Outcome Protocol

### Request Authorization

Every Launch Console request is authorized by the standard app middleware before processing:

- **Session check:** the JWT cookie must be present and valid, scope `user`.
- **CSRF/origin check:** `X-Session-Nonce` bound to a server-side session record, plus the Origin/Referer allowlist (see `SECURITY.md` layers 4–5).
- Unauthorized requests receive the standard `{ error: 'AUTH_EXPIRED' | 'CSRF', ... }` envelope; no run state is mutated.

### Endpoints (App → Backend)

| Method + Path                              | Purpose                          | Response                                            |
| ------------------------------------------ | -------------------------------- | --------------------------------------------------- |
| `GET /launch-console/queue`                | Load next `LaunchActionQueueItem[]` | `{ status: 'ok', queue: [...] }`                 |
| `GET /launch-console/prompts/:queueItemId` | Load the `LaunchConsolePrompt` for an action | `{ status: 'ok', prompt }` or error     |
| `POST /launch-console/outcomes`            | Record a batch of `LaunchOutcome` | `{ status: 'ok', recorded }`                       |

### Run Control (UI → Controller, in-process)

| Action                 | Effect                                        |
| ---------------------- | --------------------------------------------- |
| `pause`                | Sets `isPaused = true`                        |
| `resume`               | Sets `isPaused = false`                       |
| `stop`                 | Sets `isStopped = true`, clears the run badge |
| `next_segment`         | Advance to the next ranked segment's actions  |
| `next_page`            | Advance to the next page of queued actions    |

### Outcome Reporting (Runner → Backend)

After each action resolves, the runner posts a `LaunchOutcome` to `POST /launch-console/outcomes`:

```javascript
{ queueItemId, status, reason, artifactRefs, reportedBy: 'console' | 'system' | 'user' }
```

`status` is one of `skipped | attempted | succeeded | failed | needs_manual`. Outcomes are durable (Postgres-backed audit trail) so a run can be reviewed and resumed across sessions.

---

## Channel Target Builder

`buildChannelTarget(channel, action)` resolves where a launch action lands per its `LaunchChannel` provider:

| Parameter   | Channel Field  | Values                                                                              |
| ----------- | -------------- | ----------------------------------------------------------------------------------- |
| Audience    | `segment`      | Free text (the ranked `AudienceSegment` name)                                       |
| Geography   | `geography`    | Only set if the channel is geo-targeted                                             |
| Cadence     | `sendOffset`   | `day0`, `day2`, `week1` (relative send schedule)                                     |
| Action type | `actionType`   | `publish`, `send`, `follow_up`, `export`, `research_review`                          |
| Channel     | `provider`     | `email`, `social`, `community`, `marketplace`, `ads`, `content`                     |
| Pacing      | `throttle`     | per-channel send/post pacing (default on)                                            |
| Pagination  | `cursor`       | batch offset for large send/post lists                                               |

---

## Action Runner: Launch Loop

### Flow

1. **Init:** Load the active run via `GET /launch-console/queue`
2. **Wait:** 2s for the page to settle
3. **Scan:** Walk the queued `LaunchActionQueueItem[]`, read each (actionType, channel, target, asset readiness)
4. **Filter:** Only ready actions, not already run, not already processed
5. **For each queued action:**
   a. Load the action detail + its `LaunchConsolePrompt` (`GET /launch-console/prompts/:queueItemId`)
   b. **Evaluate:** score against run-rules (see below)
   c. If `hold` → skip, report outcome
   d. Compose the action (assemble copy + stage assets), wait for the draft to settle
   e. **Stage the action** (email draft, social post draft, community post draft — up to 10 prep steps)
   f. **Pause for review** — show overlay, wait for founder approve/skip
   g. If approved → execute (publish/send), report `succeeded`
   h. If skipped → discard the draft, report `skipped`
6. **Paginate:** Request the next page (max 3 pages per segment), then the next segment
7. **Complete:** When all queued actions are exhausted

### Action Surfaces

Key surfaces the runner composes against (defined in the `SURFACES` map, controller.ts):

- **Queue items:** `LaunchActionQueueItem[]` loaded from `GET /launch-console/queue`
- **Action detail:** the action's channel, target audience, and `assetRef` into the staged `LaunchAssetPack`
- **Send/publish control:** the per-channel provider adapter (`email`, `social`, `community`, …)
- **Draft:** the composed-but-unpublished action body, shown in the review overlay
- **Form fields:** any provider-side fields the action must fill (subject, audience list, schedule)
- **Navigation:** "Stage next action", "Publish this action"

---

## Run-Rule Engine (controller.ts)

`evaluateAction(actionType, channel, body, runRules, segment, constraints)` returns `{ verdict, reason }`:

### Verdict Types

| Verdict  | Meaning                                   | Action              |
| -------- | ----------------------------------------- | ------------------- |
| `run`    | Strong match (runIf score >= threshold)   | Proceed to stage    |
| `review` | Partial match or no strong signal         | Show review overlay |
| `hold`   | Matched holdIf or deal-breaker            | Auto-skip           |

### Evaluation Order

1. **Channel filter:** Channel-scope preference vs the action's provider
2. **Deal-breakers:** `unbacked-claim`, `wrong-segment`, `off-brand`, `asset-not-ready`
3. **holdIf rules:** Each rule checked against combined text (actionType + channel + body). First match → `hold`
4. **runIf rules:** Each rule contributes weight to `runScore`. Score >= threshold (default 1) → `run`
5. **Default:** `review`

### Rule Format

Rules support both string and object format:

- String: `"requires backed proof"` — pattern matched against all text
- Object: `{ pattern, field, reason, weight }` — field-targeted matching

---

## Action Composition (runner.ts)

### Field Mapping

The runner maps action fields to profile + asset values:

| Field Pattern                | Source                              |
| ---------------------------- | ----------------------------------- |
| "from name"                  | `profile.founderName` or name split |
| "from / reply-to"            | `profile.contactEmail`              |
| "subject" / "headline"       | `assetPack.announcement`            |
| "body" / "post"              | `assetPack.landingCopy` excerpt     |
| "link" / "url"               | `profile.ventureUrl`                |
| "audience" / "list"          | `segment.name`                      |
| "schedule" / "send time"     | `channel.sendOffset`                |
| "cta" / "button"             | `assetPack.cta`                     |
| "footer" / "sign-off"        | `profile.signature`                 |

### Channel Defaults

| Field Pattern          | Default Value                          |
| ---------------------- | -------------------------------------- |
| "geography"            | "United States"                        |
| "format"               | "Plain + minimal HTML"                 |
| "consent"              | Yes/No from `constraints.audienceOptIn`|
| "sponsor" / "paid"     | Yes/No from `channel.paid`             |
| "from-domain"          | `profile.sendingDomain` or "(unset)"   |
| "unsubscribe"          | "Included (required for email)"        |
| "disclosure"           | "#ad where the channel requires it"    |
| "reply-to"             | `profile.contactEmail`                 |

### Auto-Checked Confirmations

Confirmations with labels containing "consent", "terms", or "acknowledge" are surfaced for explicit founder confirmation — never auto-accepted on the founder's behalf for a public action.

### Asset Attachment

Large asset binaries (PDF press kit, image variants) are referenced by `assetRef` into the staged `LaunchAssetPack` — the runner attaches the signed-URL reference; it does not inline blobs. Logged as a note when a provider requires manual upload.

### Field Filling Technique

Uses framework-compatible event dispatching for any in-app draft fields:

1. Set value via the controlled-input setter (state-managed draft body)
2. Dispatch `input`, `change`, `blur` events with `bubbles: true`

---

## Launch Console UI (LaunchRunPage.tsx)

### Tabs

| Tab          | Contents                                                                                  |
| ------------ | ----------------------------------------------------------------------------------------- |
| Status       | State label, stats (succeeded/skipped/failed/total), progress bar, Start/Pause/Stop buttons |
| Plan         | Profile summary, queued actions, editable runIf/holdIf rules, hard limits, Save button    |

### Connection Badge

- **Ready:** Active run loaded and < 24h old
- **Stale:** No active run or stale

### Refresh Button

Re-fetches the latest queue from `GET /launch-console/queue` → refreshes the staged action list.

### Status Polling

Re-reads run status from the session store every 3s + on session-change events.

---

## Human-in-the-Loop

The Launch Console **always pauses before any public action** (publish, send, post). The review overlay shows:

- Action type, target channel, and audience segment
- Run-rule verdict and reason
- "Skip" and "Approve & Run" buttons

**CRITICAL: The Launch Console MUST NOT publish, send, or post without explicit founder approval.** The "Run" action requires a founder click in the review overlay. No public action is taken without explicit founder approval. This is a compliance requirement, not a preference.

---

## Pacing

| Action                 | Delay                 |
| ---------------------- | --------------------- |
| Between actions        | 500-2000ms (random)   |
| After action select    | 1500ms                |
| After stage click      | 1500ms                |
| Between prep steps     | 800-1200ms            |
| After publish/send     | 2000ms                |
| Scroll per queue item  | 200ms                 |
| Generic random delay   | 500 + random(1500) ms |

All delays include +-500ms jitter so a paid/social channel never sees a burst that looks automated.
