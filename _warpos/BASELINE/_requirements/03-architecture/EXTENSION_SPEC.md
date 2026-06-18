# Jobzooka — Extension Spec (Regen Spec)

Chrome extension for LinkedIn Easy Apply automation. All files in `extension/`.

---

## Manifest (manifest.json)

| Field                  | Value                                                              |
| ---------------------- | ------------------------------------------------------------------ |
| Manifest version       | 3                                                                  |
| Name                   | Jobzooka Launcher                                                  |
| Version                | 0.1.0                                                              |
| Permissions            | `activeTab`, `storage`, `tabs`, `scripting`                        |
| Host permissions       | `https://www.linkedin.com/*`                                       |
| Background             | Service worker: `background.js`                                    |
| Content scripts        | `content.js` on `https://www.linkedin.com/jobs/*`, `document_idle` |
| Action                 | Popup: `popup.html`, icons: 48px + 128px                           |
| Externally connectable | `https://*.jobzooka.io/*`                                          |

**Pre-publish checklist:** Remove `http://localhost/*` from `externally_connectable` before Chrome Web Store submission. Currently needed for dev/testing.

---

## Architecture

```
Web App (Step13Apply.tsx)
  │  chrome.runtime.sendMessage (external)
  ▼
Background (background.js) — service worker
  │  chrome.storage.local (session + status)
  │  chrome.tabs (navigate, create)
  ▼
Content Script (content.js) — injected on LinkedIn jobs pages
  │  DOM manipulation (scan, triage, fill, submit)
  │  chrome.runtime.sendMessage (internal)
  ▼
Popup (popup.html/js/css) — extension popup UI
     chrome.storage.local (read status)
     chrome.runtime.sendMessage (start/pause/stop)
```

---

## Storage Keys

| Key                | Type   | Contents                                                         |
| ------------------ | ------ | ---------------------------------------------------------------- |
| `jobzooka_session` | Object | Full payload: queries, profile, heuristics, resumes, preferences |
| `jobzooka_status`  | Object | Current state, stats, current job, timestamps                    |

### Session Shape

```javascript
{
  queries: [{ keywords, location, remote, datePosted, jobTypes, easyApply }],
  profile: { name, email, phone, location, ... },
  heuristics: { applyIf: [], skipIf: [], fireThreshold, coverLetterGuidance },
  preferences: { locationTypes, employmentTypes, dealBreakers, hourlyFloor, salaryFloor, preferredLocation },
  answers: { fieldLabel: value },  // Form answer map
  targetedResumes: [],
  coverLetterGuidance: "",
  originTabId: number,
  linkedInTabId: number,
  receivedAt: timestamp,
}
```

### Status Shape

```javascript
{
  state: 'idle' | 'scanning' | 'applying' | 'paused' | 'complete' | 'error',
  currentJob: { title, company } | null,
  stats: { applied: 0, skipped: 0, failed: 0, total: 0 },
  currentQueryIndex: 0,
  currentPage: 1,
  error: null | string,
  startedAt: timestamp | null,
  updatedAt: timestamp | null,
}
```

---

## Message Protocol

### Origin Validation

All message handlers validate the sender before processing:

**External messages** (`onMessageExternal`): `sender.origin` must match one of:

- `https://jobzooka.io`
- `https://www.jobzooka.io`
- `http://localhost:3000` (dev)
- `https://localhost:3000` (dev)

Unauthorized origins receive `{ status: 'error', error: 'Unauthorized origin' }`.

**Internal messages** (`onMessage`): If `sender.url` is present, it must start with `https://www.linkedin.com/` OR `sender.id` must equal `chrome.runtime.id` (the extension itself, e.g., popup). This prevents injected scripts on non-LinkedIn pages from sending commands.

### External Messages (Web App → Background)

| Type          | Payload              | Response                           |
| ------------- | -------------------- | ---------------------------------- |
| `ping`        | —                    | `{ status: 'ok', version }`        |
| `start_apply` | Full session payload | `{ status: 'ok', tabId }` or error |
| `get_status`  | —                    | `{ status: 'ok', data: Status }`   |
| `pause`       | —                    | `{ status: 'ok' }`                 |
| `resume`      | —                    | `{ status: 'ok' }`                 |
| `stop`        | —                    | `{ status: 'ok' }`                 |

### Internal Messages (Content Script / Popup → Background)

| Type                   | Payload                              | Response                                            |
| ---------------------- | ------------------------------------ | --------------------------------------------------- |
| `start_apply_internal` | Session or null                      | `{ status: 'ok', tabId }` or error                  |
| `get_session`          | —                                    | `{ status: 'ok', data: Session }`                   |
| `status_update`        | Status patch                         | `{ status: 'ok' }`                                  |
| `job_result`           | `{ result, title, company, reason }` | `{ status: 'ok' }`                                  |
| `next_query`           | —                                    | `{ status: 'ok', url }` or `{ status: 'complete' }` |
| `next_page`            | —                                    | `{ status: 'ok', page }` or complete                |

### Background → Content Script

| Type     | Effect                                        |
| -------- | --------------------------------------------- |
| `pause`  | Sets `isPaused = true`                        |
| `resume` | Sets `isPaused = false`                       |
| `stop`   | Sets `isStopped = true`, removes status badge |

### Background → Web App (Relay)

Status updates are relayed to the web app tab via `chrome.tabs.sendMessage` as `{ type: 'jobzooka_status_update', payload: Status }`.

---

## LinkedIn URL Builder

`buildLinkedInSearchUrl(query, page)` constructs LinkedIn Jobs search URLs:

| Parameter   | LinkedIn Param | Values                                                                              |
| ----------- | -------------- | ----------------------------------------------------------------------------------- |
| Keywords    | `keywords`     | Free text                                                                           |
| Location    | `location`     | Only set if NOT Remote                                                              |
| Date posted | `f_TPR`        | `r86400` (24h), `r604800` (week), `r2592000` (month)                                |
| Job type    | `f_JT`         | `F` (Full-time), `P` (Part-time), `C` (Contract), `T` (Temporary), `I` (Internship) |
| Remote      | `f_WT`         | `1` (On-site), `2` (Remote), `3` (Hybrid)                                           |
| Easy Apply  | `f_AL`         | `true` (default on)                                                                 |
| Pagination  | `start`        | `(page - 1) * 25`                                                                   |

---

## Content Script: Apply Loop

### Flow

1. **Init:** Check for active session via `get_session` message
2. **Wait:** 2s for page to settle
3. **Scan:** Scroll through job list, scrape all cards (title, company, location, Easy Apply status)
4. **Filter:** Easy Apply only, not already applied, not already processed
5. **For each card:**
   a. Open job detail (click card, wait for description)
   b. **Triage:** Evaluate against heuristics (see below)
   c. If `nogo` → skip, report result
   d. Click Easy Apply button, wait for modal
   e. **Fill form** (multi-step, up to 10 steps)
   f. **Pause for review** — show overlay, wait for user approve/skip
   g. If approved → click Submit, report `applied`
   h. If skipped → close modal, report `skipped`
6. **Paginate:** Request next page (max 3 pages per query), then next query
7. **Complete:** When all queries exhausted

### LinkedIn DOM Selectors

Key selectors (defined in `SEL` object, content.js lines 22-62):

- **Job cards:** `.jobs-search-results__list-item`, `.job-card-container`
- **Job detail:** `.jobs-description-content__text`, `#job-details`
- **Easy Apply button:** `.jobs-apply-button`, `button[aria-label*="Easy Apply"]`
- **Modal:** `.jobs-easy-apply-modal`, `.artdeco-modal[role="dialog"]`
- **Form fields:** `.jobs-easy-apply-form-section__grouping`, `.fb-dash-form-element`
- **Navigation:** `button[aria-label="Continue to next step"]`, `button[aria-label="Submit application"]`

---

## Triage Engine (content.js)

`triageJob(title, company, description, heuristics, jobLocation, preferences)` returns `{ verdict, reason }`:

### Verdict Types

| Verdict  | Meaning                                   | Action              |
| -------- | ----------------------------------------- | ------------------- |
| `fire`   | Strong match (applyIf score >= threshold) | Proceed to apply    |
| `review` | Partial match or no strong signal         | Show review overlay |
| `nogo`   | Matched skipIf or deal-breaker            | Auto-skip           |

### Evaluation Order

1. **Location filter:** Remote preference vs job location
2. **Deal-breakers:** `return-to-office`, `relocation`, `travel`, `unpaid`
3. **skipIf rules:** Each rule checked against combined text (title + company + description). First match → `nogo`
4. **applyIf rules:** Each rule contributes weight to `fireScore`. Score >= threshold (default 1) → `fire`
5. **Default:** `review`

### Rule Format

Rules support both string and object format:

- String: `"requires full-time"` — pattern matched against all text
- Object: `{ pattern, field, reason, weight }` — field-targeted matching

---

## Form Filling (content.js)

### Field Mapping

The extension maps form labels to profile values:

| Label Pattern                | Source                            |
| ---------------------------- | --------------------------------- |
| "first name"                 | `profile.firstName` or name split |
| "last name"                  | `profile.lastName` or name split  |
| "email"                      | `profile.email`                   |
| "phone" / "mobile"           | `profile.phone`                   |
| "city" / "location"          | `profile.location`                |
| "linkedin" / "profile url"   | `profile.linkedinUrl`             |
| "website" / "portfolio"      | `profile.website`                 |
| "years" + "experience"       | `profile.yearsExperience`         |
| "salary" / "compensation"    | `profile.desiredSalary`           |
| "headline" / "current title" | `profile.headline`                |

### Select Dropdowns

| Label Pattern          | Default Value                          |
| ---------------------- | -------------------------------------- |
| "country"              | "United States"                        |
| "degree" / "education" | "Bachelor's"                           |
| "authorized"           | Yes/No from `profile.workAuthorized`   |
| "sponsor" / "visa"     | Yes/No from `profile.needsSponsorship` |
| "gender"               | "Prefer not to say"                    |
| "race" / "ethnicity"   | "Prefer not to say"                    |
| "veteran"              | "I am not a veteran"                   |
| "disability"           | "I don't wish to answer"               |

### Auto-Checked Checkboxes

Checkboxes with labels containing "agree", "terms", or "acknowledge" are auto-checked.

### Resume Upload

Cannot be programmatically filled (browser security). Logged as a note — user must upload manually or use LinkedIn profile resume.

### Input Filling Technique

Uses React-compatible event dispatching:

1. Set value via `HTMLInputElement.prototype.value` setter (bypasses React controlled component)
2. Dispatch `input`, `change`, `blur` events with `bubbles: true`

---

## Popup UI (popup.html/js/css)

### Tabs

| Tab          | Contents                                                                                  |
| ------------ | ----------------------------------------------------------------------------------------- |
| Status       | State label, stats (applied/skipped/failed/total), progress bar, Start/Pause/Stop buttons |
| Instructions | Profile summary, search queries, editable applyIf/skipIf rules, hard limits, Save button  |

### Connection Badge

- **Connected:** Session exists and is < 24h old
- **Disconnected:** No session or stale

### Sync Button

Finds Jobzooka web app tab (localhost:3000 or jobzooka.io) → requests sync via `jobzooka_request_sync` message.

### Status Polling

Reads `jobzooka_status` from `chrome.storage.local` every 3s + on storage change events.

---

## Human-in-the-Loop

The extension **always pauses before submission**. The review overlay shows:

- Job title and company
- Triage verdict and reason
- "Skip" and "Approve & Submit" buttons

**CRITICAL: The extension MUST NOT auto-submit forms without explicit user approval.** The "Submit" action requires a user click in the extension popup or review overlay. No application is submitted without explicit user approval. This is a compliance requirement, not a preference.

---

## Pacing

| Action                 | Delay                 |
| ---------------------- | --------------------- |
| Between jobs           | 500-2000ms (random)   |
| After card click       | 1500ms                |
| After Easy Apply click | 1500ms                |
| Between form steps     | 800-1200ms            |
| After submit           | 2000ms                |
| Scroll per card        | 200ms                 |
| Generic random delay   | 500 + random(1500) ms |

All delays include +-500ms jitter for human-like behavior.
