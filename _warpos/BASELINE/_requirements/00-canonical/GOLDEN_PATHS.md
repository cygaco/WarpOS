# Jobzooka — Golden Paths

<!-- SPEC-AHEAD-OF-CODE: The Primary Path below reflects the target state the next skeleton build will realize. Deep-Dive Q&A moves from an onboarding step into the dashboard as an optional tier-jump activity. Shipped code still sequences deep-dive inside onboarding (between market analysis and skills). -->

Critical user journeys end-to-end. These are the paths that MUST work flawlessly. If any golden path breaks, the product is broken.

---

## Golden Path 1: Full Journey (Resume → Dashboard → Applications)

**The primary journey.** Active job seeker completes onboarding and then opts into dashboard activities to reach maximum competitiveness.

### Flow (Target State)

<!-- SOURCE OF TRUTH: _requirements/00-canonical/STEPS.json — the flow diagram below reflects the registry's phase ordering + step positions. Propagation is manual until /maps:steps regenerates this section automatically. -->


<!-- maps:steps:START (region=golden-paths-flow) --- auto-generated from _requirements/00-canonical/STEPS.json; do not edit manually. Regenerate: /maps:steps or node scripts/generate-steps-maps.js -->

**Onboarding phase (linear, required):**

```
UPLOAD → PREFERENCES → PROFILE → SEARCH → MARKET_ANALYSIS → [ENTER DASHBOARD]
```

**Dashboard phase (optional, user-ordered):**

```
dashboard → {DEEP_DIVE, SKILLS, RESUMES, LINKEDIN, AUTO_APPLY}
```

The user enters the dashboard after completing 5 onboarding steps. From the dashboard they opt into any of 5 optional activities in any order — each contributes to the competitiveness score.

<!-- maps:steps:END (region=golden-paths-flow) -->

The primary path changes from a linear `resume → parse → market → deep-dive → resume → linkedin → auto-apply` to `resume → parse → market → dashboard → (dashboard activities)`. Deep-Dive Q&A is no longer a forced gate before resume generation — users see their baseline dashboard first, then opt into deep-dive (and other activities) to tier-jump.

### Emotional Arc

| Phase      | Step / Activity | Emotion         | What Happens                           |
| ---------- | --------------- | --------------- | -------------------------------------- |
| Onboarding | 1               | Trust           | "It parsed my resume correctly"        |
| Onboarding | 2               | Control         | "I'm setting my terms"                 |
| Onboarding | 3               | Validation      | "It understood my career"              |
| Onboarding | 4 (prep)        | Anticipation    | "Let's see what's out there"           |
| Onboarding | 4 (sweep)       | Momentum        | Recon sweep runs — scrape + analysis, one screen |
| Onboarding | 4→5 (CTA)       | Satisfaction    | "Analysis complete — targets acquired" |
| Onboarding | 5 (select)      | Discovery       | "I didn't know about these categories" |
| —          | Dashboard entry | Orientation     | Baseline score visible, clear next unlocks |
| —          | Auth Gate       | Pause           | Auth prompt at dashboard entry (dismissible) |
| Dashboard  | Deep-Dive QA    | Depth           | "Now it really knows me" — optional tier-jump |
| Dashboard  | Skills          | Control → Trust | "These are my skills" → "It caught the bad ones" → "I'll add what I know" |
| Dashboard  | Resumes         | Tangible output | "I have real, downloadable resumes"    |
| Dashboard  | LinkedIn        | Completeness    | "LinkedIn is done too"                 |
| Dashboard  | Auto-Apply      | Momentum        | "Everything is ready. Let's apply."    |

### Recon Sweep Detail (Steps 4-5) — LOCKED FLOW

This flow took weeks to get right. **Do NOT restructure without user approval.**

```
RECON MISSION SCREEN (AimPage substep 0)
├── Query editor: 3-6 editable search vectors
├── No-fly zones: avoid terms as removable tags
└── [Launch Recon] button
        │
        ▼
RECON SWEEP (AimPage substep 0→1, same screen)
├── Scrape phases:
│   ├── "Deploying recon drones..."
│   ├── "Scanning the battlefield..."
│   ├── "Intercepting target data and comp intel..."
│   ├── "Sweeping remaining sectors..."
│   └── "Compiling recon report..."
├── Analysis phases (seamless continuation, no screen change):
│   ├── "Scanning for keywords..."
│   ├── "Mapping comp ranges..."
│   ├── "Identifying target categories..."
│   └── "Building targeting dossier..."
└── "Analysis complete — targets acquired"
    ├── N target categories identified
    ├── Comp range summary
    └── [View Your Targets] CTA
            │
            ▼
LOCK YOUR TARGETS SCREEN (AimPage substep 2)
├── Category cards: name, comp range, volume, match badge
├── Toggle on/off (NO ranking/reordering)
├── Discovery recommendations (add up to 10 total)
├── FOMO warning for deselected categories
├── [Refresh Analysis] re-runs without re-scraping
└── [Lock categories (N) →] writes rankedCategories, ends onboarding, enters dashboard
            │
            ▼
DASHBOARD (baseline competitiveness score visible)
├── Deep-Dive Q&A (optional tier-jump activity)
├── Skills / Resumes / LinkedIn / Auto-Apply (opt-in)
```

> **Target-state note:** Locking categories now advances directly to the **Dashboard** (with a baseline competitiveness score shown), not to a forced Deep Dive step. Deep-Dive Q&A is launchable from the dashboard as an optional tier-jump activity. Shipped code still routes the user directly into Deep Dive after category lock.

**Implementation:** AimPage uses 3-substep architecture with a single Step6Analysis instance (display:none toggle, NOT conditional mount). See FLOW_SPEC.md for the substep table and HYGIENE Rule 53 for why.

### Critical Moments

1. **Resume parsing must succeed** — if it fails, user has no path forward
2. **Recon sweep must feel continuous** — scrape → analysis → CTA on ONE screen, no flash
3. **Market analysis must return categories** — empty results = dead end
4. **Category selection must NOT include ranking** — toggle only, no reorder UI (HYGIENE Rule 52)
5. **Resume generation must produce valid DOCX** — this is the tangible deliverable
6. **Competitiveness score must increase** — flat score = no sense of progress

---

## Golden Path 2: Market Intelligence Only

**Passive looker or explorer.** User wants to understand their market position without committing to full job search.

### Flow

```
Upload resume → Set preferences → Generate profile
  → Generate queries → Scrape LinkedIn → Market analysis
  → Review categories, comp ranges, keywords
  → [STOP or continue to AIM]
```

### Emotional Arc

| Step | Emotion                                          |
| ---- | ------------------------------------------------ |
| 1–3  | Quick setup, low commitment                      |
| 4    | Curiosity                                        |
| 5    | Insight ("So THAT'S what the market looks like") |

### Critical Moments

1. **Must deliver value by step 5** — user may not go further
2. **Compensation data must feel real** — this is what passive lookers care about most
3. **Categories must feel actionable** — not abstract academic groupings
4. **Free tier must cover this path** — market analysis first run is free

---

## Golden Path 3: Resume Generation Sprint

**User who already knows their market.** Skips deep analysis, focuses on generating targeted resumes as fast as possible.

### Flow

```
Upload resume → Quick preferences → Profile
  → Generate queries → Quick market scan → Lock categories
  → Skip or fast Deep Dive → Quick skills review (4-substep flow) → Generate all resumes
  → Download DOCX files
```

**Current status:** The app supports this flow — all steps can be completed quickly with minimal input. Deep-Dive QA can be answered briefly or skipped (accordion collapse). Bulk resume generation with ZIP download is implemented.

### Critical Moments

1. **Bulk generation must work** — user wants 5+ targeted variants in one pass
2. **DOCX downloads must work** — the primary deliverable
3. **Bulk pricing must be clear** — user buying rockets for multiple categories
4. **Download All must bundle correctly** — ZIP with all variants

---

## Golden Path 4: Returning User

**User who started a session, left, and came back.** Data must persist and the experience must be seamless.

### Flow

```
Open app → Session loads from localStorage (or server)
  → HubScreen shows progress summary
  → User navigates to where they left off (or any completed step)
  → Continues wizard
```

### Critical Moments

1. **Session must load correctly** — encrypted localStorage decryption must succeed
2. **HubScreen must show accurate state** — which steps are done, current progress
3. **Backward navigation must work** — user may want to revisit earlier steps
4. **No data loss** — everything they entered must be there
5. **Schema migration must work** — if the app was updated since their last visit

---

## Golden Path 5: Rocket Purchase

**User hits a paid feature and needs to buy rockets.**

### Flow

```
User triggers billable operation (targeted resume, LinkedIn, market re-run)
  → Insufficient rockets → Soft prompt or modal
  → User clicks "Get Rockets" → RocketStore opens
  → Selects pack (Scout/Strike/Arsenal) → Stripe checkout
  → Returns with ?rockets=success → Balance updated
  → Retries original operation
```

### Critical Moments

1. **Cost must be clear BEFORE the action** — never surprise with a charge
2. **Stripe redirect must return cleanly** — `?rockets=success` must trigger balance reload
3. **Balance must update immediately** — no stale cache showing old balance
4. **Original operation must be retryable** — user shouldn't have to redo steps

---

## Golden Path 6: Auto-Apply via Extension

**User launches Chrome extension for LinkedIn Easy Apply automation.**

### Flow

```
User reaches step 10 → Reviews heuristics → Installs extension (if needed)
  → Launches auto-apply → Extension scans LinkedIn
  → For each job: evaluate heuristics → fill form → PAUSE for review
  → User approves or skips → Extension submits or moves on
  → Running log of applications
```

### Critical Moments

1. **Extension must detect correctly** — clear message if not installed
2. **Heuristics must be sensible** — apply-if/skip-if signals must match real listings
3. **NEVER auto-submit** — always pause for user approval
4. **Form answers must be accurate** — demographics, personal info, work auth
5. **Resume selection must match category** — right targeted variant for each job type

---

## Anti-Patterns (What Must NOT Happen)

1. **Dead ends** — User reaches a state where no action is possible and no guidance is given
2. **Silent failures** — Operation fails but UI doesn't update or show error
3. **Data loss** — Session data disappears or corrupts without warning
4. **Stale outputs** — Resume generated from old market data after user re-ran analysis
5. **Invisible costs** — Rockets deducted without clear prior notification
6. **Forced commitment** — User feels trapped in a step they can't exit
7. **Broken downloads** — DOCX file is corrupted or contains wrong content
8. **Dishonest defaults** — Skills the user doesn't have included by default (market-only skills must default to excluded)
9. **iOS toggle switches** — Not part of the design system. All boolean lists use card-row boxes (COMPONENT_LIBRARY.md)
10. **Colored source dots / star priorities** — Removed in Run 007. Must not reappear in any form
