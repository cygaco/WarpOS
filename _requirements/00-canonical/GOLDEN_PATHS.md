# AcmeLaunch — Golden Paths

<!-- SPEC-AHEAD-OF-CODE: The Primary Path below reflects the target state the next skeleton build will realize. Deep-Dive Q&A moves from an onboarding step into the dashboard as an optional tier-jump activity. Shipped code still sequences deep-dive inside onboarding (between landscape analysis and scope). -->

Critical user journeys end-to-end. These are the paths that MUST work flawlessly. If any golden path breaks, the product is broken.

---

## Golden Path 1: Full Journey (Idea Brief → Dashboard → Launch)

**The primary journey.** A founder preparing a launch completes onboarding and then opts into dashboard activities to reach maximum launch-readiness.

### Flow (Target State)

<!-- SOURCE OF TRUTH: _requirements/00-canonical/STEPS.json — the flow diagram below reflects the registry's phase ordering + step positions. Propagation is manual until /maps:steps regenerates this section automatically. -->


<!-- maps:steps:START (region=golden-paths-flow) --- auto-generated from _requirements/00-canonical/STEPS.json; do not edit manually. Regenerate: /maps:steps or node scripts/generate-steps-maps.js -->

**Onboarding phase (linear, required):**

```
BRIEF → CONSTRAINTS → PROFILE → RESEARCH → LANDSCAPE_ANALYSIS → [ENTER DASHBOARD]
```

**Dashboard phase (optional, user-ordered):**

```
dashboard → {DEEP_DIVE, SKILLS, LAUNCH_PLANS, CHANNELS, LAUNCH_RUN}
```

The user enters the dashboard after completing 5 onboarding steps. From the dashboard they opt into any of 5 optional activities in any order — each contributes to the launch-readiness score.

<!-- maps:steps:END (region=golden-paths-flow) -->

The primary path changes from a linear `brief → extract → landscape → deep-dive → plan → channels → launch-run` to `brief → extract → landscape → dashboard → (dashboard activities)`. Deep-Dive Q&A is no longer a forced gate before plan generation — founders see their baseline dashboard first, then opt into deep-dive (and other activities) to tier-jump.

### Emotional Arc

| Phase      | Step / Activity | Emotion         | What Happens                           |
| ---------- | --------------- | --------------- | -------------------------------------- |
| Onboarding | 1               | Trust           | "It understood my idea correctly"      |
| Onboarding | 2               | Control         | "I'm setting my constraints"           |
| Onboarding | 3               | Validation      | "It understood my product"             |
| Onboarding | 4 (prep)        | Anticipation    | "Let's see what the landscape looks like" |
| Onboarding | 4 (sweep)       | Momentum        | Landscape sweep runs — research + analysis, one screen |
| Onboarding | 4→5 (CTA)       | Satisfaction    | "Analysis complete — landscape mapped" |
| Onboarding | 5 (select)      | Discovery       | "I didn't know about these segments"   |
| —          | Dashboard entry | Orientation     | Baseline score visible, clear next unlocks |
| —          | Auth Gate       | Pause           | Auth prompt at dashboard entry (dismissible) |
| Dashboard  | Deep-Dive QA    | Depth           | "Now it really knows my product" — optional tier-jump |
| Dashboard  | Scope           | Control → Trust | "These are my angles" → "It caught the weak ones" → "I'll add what fits" |
| Dashboard  | Launch Plans    | Tangible output | "I have real, downloadable launch plans" |
| Dashboard  | Channel Kits    | Completeness    | "My channel assets are done too"       |
| Dashboard  | Launch Run      | Momentum        | "Everything is ready. Let's launch."   |

### Landscape Sweep Detail (Steps 4-5) — LOCKED FLOW

This flow took weeks to get right. **Do NOT restructure without user approval.**

```
LANDSCAPE MISSION SCREEN (PrepPage substep 0)
├── Query editor: 3-6 editable research vectors
├── Exclusions: avoid terms as removable tags
└── [Start Research] button
        │
        ▼
LANDSCAPE SWEEP (PrepPage substep 0→1, same screen)
├── Research phases:
│   ├── "Gathering launch signals..."
│   ├── "Scanning the landscape..."
│   ├── "Collecting audience and channel intel..."
│   ├── "Sweeping remaining sources..."
│   └── "Compiling landscape report..."
├── Analysis phases (seamless continuation, no screen change):
│   ├── "Extracting positioning keywords..."
│   ├── "Mapping channel costs..."
│   ├── "Identifying audience segments..."
│   └── "Building targeting dossier..."
└── "Analysis complete — landscape mapped"
    ├── N audience segments identified
    ├── Channel-cost range summary
    └── [View Your Segments] CTA
            │
            ▼
LOCK YOUR SEGMENTS SCREEN (PrepPage substep 2)
├── Segment cards: name, channel-cost range, demand volume, match badge
├── Toggle on/off (NO ranking/reordering)
├── Opportunity recommendations (add up to 10 total)
├── FOMO warning for deselected segments
├── [Refresh Analysis] re-runs without re-researching
└── [Lock segments (N) →] writes rankedSegments, ends onboarding, enters dashboard
            │
            ▼
DASHBOARD (baseline launch-readiness score visible)
├── Deep-Dive Q&A (optional tier-jump activity)
├── Scope / Launch Plans / Channel Kits / Launch Run (opt-in)
```

> **Target-state note:** Locking segments now advances directly to the **Dashboard** (with a baseline launch-readiness score shown), not to a forced Deep Dive step. Deep-Dive Q&A is launchable from the dashboard as an optional tier-jump activity. Shipped code still routes the user directly into Deep Dive after segment lock.

**Implementation:** PrepPage uses 3-substep architecture with a single Step6Analysis instance (display:none toggle, NOT conditional mount). See FLOW_SPEC.md for the substep table and HYGIENE Rule 53 for why.

### Critical Moments

1. **Idea-brief extraction must succeed** — if it fails, user has no path forward
2. **Landscape sweep must feel continuous** — research → analysis → CTA on ONE screen, no flash
3. **Landscape analysis must return segments** — empty results = dead end
4. **Segment selection must NOT include ranking** — toggle only, no reorder UI (HYGIENE Rule 52)
5. **Plan generation must produce valid exports** — this is the tangible deliverable
6. **Launch-readiness score must increase** — flat score = no sense of progress

---

## Golden Path 2: Landscape Intelligence Only

**Explorer.** Founder wants to understand the launch landscape without committing to a full launch plan.

### Flow

```
Submit idea brief → Set constraints → Generate profile
  → Generate queries → Research landscape → Landscape analysis
  → Review segments, channel-cost ranges, positioning keywords
  → [STOP or continue to PREP]
```

### Emotional Arc

| Step | Emotion                                          |
| ---- | ------------------------------------------------ |
| 1–3  | Quick setup, low commitment                      |
| 4    | Curiosity                                        |
| 5    | Insight ("So THAT'S what a launch here looks like") |

### Critical Moments

1. **Must deliver value by step 5** — user may not go further
2. **Channel-cost data must feel real** — this is what explorers care about most
3. **Segments must feel actionable** — not abstract academic groupings
4. **Free tier must cover this path** — landscape analysis first run is free

---

## Golden Path 3: Plan Generation Sprint

**Founder who already knows their market.** Skips deep analysis, focuses on generating segment plans as fast as possible.

### Flow

```
Submit idea brief → Quick constraints → Profile
  → Generate queries → Quick landscape scan → Lock segments
  → Skip or fast Deep Dive → Quick scope review (4-substep flow) → Generate all plans
  → Download plan files
```

**Current status:** The app supports this flow — all steps can be completed quickly with minimal input. Deep-Dive QA can be answered briefly or skipped (accordion collapse). Bulk plan generation with ZIP download is implemented.

### Critical Moments

1. **Bulk generation must work** — user wants 5+ segment variants in one pass
2. **Plan downloads must work** — the primary deliverable
3. **Bulk pricing must be clear** — user buying credits for multiple segments
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

## Golden Path 5: Credit Purchase

**User hits a paid feature and needs to buy credits.**

### Flow

```
User triggers billable operation (segment plan, channel kit, landscape re-run)
  → Insufficient credits → Soft prompt or modal
  → User clicks "Get Credits" → CreditStore opens
  → Selects pack (Starter/Pro/Scale) → Stripe checkout
  → Returns with ?credits=success → Balance updated
  → Retries original operation
```

### Critical Moments

1. **Cost must be clear BEFORE the action** — never surprise with a charge
2. **Stripe redirect must return cleanly** — `?credits=success` must trigger balance reload
3. **Balance must update immediately** — no stale cache showing old balance
4. **Original operation must be retryable** — user shouldn't have to redo steps

---

## Golden Path 6: Launch Run via Runner

**User launches the AcmeLaunch Runner to execute their launch actions.**

### Flow

```
User reaches step 10 → Reviews launch rules → Connects the runner (if needed)
  → Starts the launch run → Runner reads the launch action queue
  → For each action: evaluate launch rules → prepare action → PAUSE for review
  → User approves or skips → Runner publishes/sends or moves on
  → Running log of launch actions
```

### Critical Moments

1. **Runner must connect correctly** — clear message if not connected
2. **Launch rules must be sensible** — do/skip signals must match real launch actions
3. **NEVER auto-publish** — always pause for user approval
4. **Follow-up answers must be accurate** — audience details, links, offer terms
5. **Plan selection must match segment** — right segment plan for each audience

---

## Anti-Patterns (What Must NOT Happen)

1. **Dead ends** — User reaches a state where no action is possible and no guidance is given
2. **Silent failures** — Operation fails but UI doesn't update or show error
3. **Data loss** — Session data disappears or corrupts without warning
4. **Stale outputs** — Plan generated from old landscape data after user re-ran analysis
5. **Invisible costs** — Credits deducted without clear prior notification
6. **Forced commitment** — User feels trapped in a step they can't exit
7. **Broken downloads** — Plan file is corrupted or contains wrong content
8. **Dishonest defaults** — Angles the user doesn't have proof for included by default (research-only angles must default to excluded)
9. **iOS toggle switches** — Not part of the design system. All boolean lists use card-row boxes (COMPONENT_LIBRARY.md)
10. **Colored source dots / star priorities** — Removed in Run 007. Must not reappear in any form
