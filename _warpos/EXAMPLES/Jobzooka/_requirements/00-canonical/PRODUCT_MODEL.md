# Jobzooka — Canonical Product Model

<!-- SPEC-AHEAD-OF-CODE: This document defines the TARGET product model the next skeleton build will realize. A key change: Deep-Dive Q&A moves from the onboarding phase (currently Step 6) to the dashboard phase as an optional tier-jump activity. Shipped code still positions deep-dive as a required onboarding step. See "Phase Vocabulary" below. -->

This document defines the structural primitives, Jobs to Be Done, and invariant truths of the product.

---

## Phase Vocabulary (Canonical)

- **Onboarding phase** = all steps before the dashboard. The required, no-skip sequence that captures profile inputs: resume upload, parse, preferences, profile, market research, category lock. The user cannot reach the dashboard until these complete.
- **Dashboard phase** = the dashboard itself + every optional activity users launch from there (on first arrival or on return visits). Includes: Deep-Dive Q&A (tier-jump unlock), target/master/general resume generation, LinkedIn content, auto-apply, and any future score-boosting activities. All are opt-in after the user sees their baseline dashboard.

**Key invariant:** Deep-Dive Q&A is a dashboard activity, not an onboarding step. Users see a baseline competitiveness score on first dashboard entry; answering deep-dive questions is one of the optional ways to push the score into a higher tier.

---

## Product Primitives

These are the fundamental building blocks of Jobzooka. Every feature is composed of these primitives.

### 1. The Wizard

A 10-step linear flow organized into 3 phases (READY / AIM / FIRE) plus onboarding. Each step:

- Receives input from previous steps
- Produces output consumed by later steps
- Has explicit completion criteria (see PHASE_DISPLAY)
- Can be revisited, with downstream invalidation

**Structural truths:**

- Steps are strictly ordered. You cannot skip ahead.
- Going backward and changing data invalidates all downstream outputs per the INVALIDATION_MAP in `page.tsx`. Dirty tracking: if re-completing a step with no actual changes, invalidation is skipped.
- Each step has a `needsData` prerequisite (STEP_REQUIRES) — the sidebar enforces this.
- The wizard state is a single `SessionData` object, persisted in encrypted localStorage.

### 2. Market Intelligence

Real job market data powers every downstream output. The pipeline:

1. User sets preferences (location, employment type, compensation)
2. AI generates 4–6 LinkedIn search queries
3. Bright Data scrapes ~50 listings per query
4. Two-phase Claude analysis: raw data → intelligence report → structured analysis
5. Output: keywords, job categories, compensation ranges, mining questions

**Structural truths:**

- Market data is real, not synthetic. Everything downstream is grounded in actual listings.
- Categories are employment arrangements, not just domains (e.g., "Contract AI PM — Staffing Agency" is distinct from "Full-time AI PM").
- The intelligence report (MARKET_PREP) is an intermediate artifact — the user never sees it directly.
- If MARKET_PREP fails, the system falls back to single-phase analysis.

### 3. Rockets (Credit Economy)

A virtual currency gating premium operations.

**Structural truths:**

- Free tier: 150 rockets on signup.
- Every billable operation has a fixed cost (targeted resume: 50, LinkedIn: 75, market re-run: 50).
- Bulk discounts exist for targeted resumes (50 → 35 → 25 per category at higher volumes).
- Auto-apply is free (0 rockets) during launch phase. May become a billable operation later.
- Market analysis first run is free.
- Rockets are never refunded on failure — the operation is retried instead.

### 4. Competitiveness Scoring

A 0–100+ score reflecting how competitive the user's materials are. Score is **uncapped** — generating targeted resumes for all categories pushes toward 100%, and bonus categories can exceed it.

**Structural truths:**

- Score increases as users complete steps and add data.
- Score is computed client-side from session data completeness + quality signals (`competitiveness.ts`).
- Visual thresholds: 40 (baseline), 70 (competitive), 90 (strong), 100 (maximum).
- Crossing a threshold triggers a celebration (GlazeToast + optional ConfettiBurst).
- The meter is always visible in the RocketBar (compact) and available in full-size.

**Weight breakdown (sums to 100% base):**

| Component              | Weight | Notes                                  |
| ---------------------- | ------ | -------------------------------------- |
| Deep-Dive QA (batch 1) | 5%     | First set of mining questions answered |
| Deep-Dive QA (batch 2) | 10%    | Bonus batch answered                   |
| Categories selected    | 5%     | At least one ranked category           |
| Skills curated         | 5%     | Exclusions/inclusions reviewed         |
| Master resume          | 10%    | Generated                              |
| General resume         | 5%     | Generated                              |
| Targeted resumes       | 25%    | Per-category, proportional — UNCAPPED  |
| LinkedIn package       | 15%    | Generated                              |
| Auto-apply connected   | 10%    | Extension configured                   |
| Form answers reviewed  | 10%    | Q&A answers ready                      |

**Labels:** "Getting started" (0–39), "Building momentum" (40–69), "Strong arsenal" (70–89), "Maximum firepower" (90–100), "OVERKILL" (>100)

### 5. Resume Generation

Three-tier resume system: Master → General → Targeted.

**Structural truths:**

- Master is generated once, contains everything. It is the source of truth.
- General is a condensed version (~2 pages). Only generated if master exceeds 2 pages; otherwise master serves as both.
- Targeted is a diff applied to the master for a specific job category. One per category.
- Diffs never fabricate — they reorder, rewrite, and remove, but never add false information.
- ATS safety: ASCII only, straight quotes, hyphens (not em-dashes).

---

## Jobs to Be Done

### Primary JTBD

> **When** I'm looking for a job, **I want to** quickly produce application materials that match what the market wants, **so that** I spend less time crafting and more time applying — and with auto-apply, less time applying too.

### Supporting JTBDs

| JTBD                                                                  | Where                                            |
| --------------------------------------------------------------------- | ------------------------------------------------ |
| "I want to understand what the market looks like for my skills"       | Onboarding 4–5 (Search + Analyze)                |
| "I want my resume to use the right keywords for each type of role"    | Dashboard activities: Deep-Dive QA + Skills + Resume Gen |
| "I want different versions of my resume for different job categories" | Dashboard: Targeted Resume Gen                   |
| "I want my LinkedIn to reflect my strongest positioning"              | Dashboard: LinkedIn                              |
| "I want to apply to many jobs quickly without losing quality"         | Dashboard: Auto-Apply                            |
| "I want to know what I'm missing so I can fill in the gaps"           | Dashboard: Deep-Dive QA (tier-jump activity)     |
| "I want to see how competitive I am before I start applying"          | Cross-cutting (Competitiveness Score — visible starting at dashboard entry) |
| "I want to control what skills and experience are highlighted"        | Dashboard: Skills Curation                       |

---

## The 10-Step Model (Target State)

<!-- SOURCE OF TRUTH: _requirements/00-canonical/STEPS.json — the step list, phase membership, positions, and requires_data/produces_data edges below must mirror the registry. Propagation is manual until /maps:steps regenerates this table automatically. -->

> **Spec-ahead-of-code:** In the target state, Deep Dive is not a wizard step — it is a dashboard activity. The table below uses the activity-ID shape for clarity. Shipped code currently positions Deep Dive as Step 6 inside onboarding.

<!-- maps:steps:START (region=product-model-onboarding) --- auto-generated from _requirements/00-canonical/STEPS.json; do not edit manually. Regenerate: /maps:steps or node scripts/generate-steps-maps.js -->

**Onboarding phase (required, strictly linear):**

| # | Phase | Step ID | Component | Requires | Produces |
| - | ----- | ------- | --------- | -------- | -------- |
| 1 | Onboarding | UPLOAD | Step1Resume | — | resumeRaw |
| 2 | Onboarding | PREFERENCES | Step3Preferences | — | preferences |
| 3 | Onboarding | PROFILE | Step4Profile | resumeRaw | profile |
| 4 | Onboarding | SEARCH | StepCollect | profile | marketRaw |
| 5 | Onboarding | MARKET_ANALYSIS | Step6Analysis | marketRaw | marketAnalysis |

Completing the last onboarding step drops the user at the **Dashboard** with a baseline competitiveness score.

<!-- maps:steps:END (region=product-model-onboarding) -->

Historical-context columns (Name / Input / Output / Cost) live in feature PRDs — this table is the structural core only.

<!-- maps:steps:START (region=product-model-dashboard) --- auto-generated from _requirements/00-canonical/STEPS.json; do not edit manually. Regenerate: /maps:steps or node scripts/generate-steps-maps.js -->

**Dashboard phase (optional activities, user opts in from dashboard):**

| Activity | Component | Requires | Produces |
| -------- | --------- | -------- | -------- |
| DEEP_DIVE | DeepDiveQA | marketAnalysis | miningResults |
| SKILLS | Step8Skills | miningResults | exclusions |
| RESUMES | Step10Resumes | profile | masterResume |
| LINKEDIN | Step11LinkedIn | masterResume | linkedin |
| AUTO_APPLY | Step13Apply | masterResume | extension_runs |

Dashboard activities have dependency edges (see Requires column), but the user chooses the order. The dashboard surfaces a recommended "next unlock" based on highest point-gain, not a forced sequence.

<!-- maps:steps:END (region=product-model-dashboard) -->

**Cost signals (hand-maintained, reference only):** Resumes 50/category; LinkedIn 75; Deep Dive / Skills / Auto-Apply Free. See individual feature PRDs for authoritative pricing.

**Note on Skills:** The position of Skills (onboarding vs. dashboard activity) is NOT explicitly changed by this revision. The user scope for this spec change covered deep-dive only. Flagged as an open ambiguity — see the deep-dive-qa PRD and the Golden Paths doc for the interim "dashboard activity" placement used here.

---

## Data Dependency Chain

```
Resume (1) → Profile (3) → Queries (4) → Job Listings (4)
                                              ↓
                                        Market Prep (5a)
                                              ↓
                                        Market Analysis (5b)
                                              ↓
                                    ┌─── Mining Questions (6)
                                    │         ↓
                                    │    Mining Results (6)
                                    │         ↓
                                    ├─── Skill Curation (7)
                                    │         ↓
                                    ├─── Master + General Resume (8)
                                    │         ↓
                                    ├─── Targeted Resumes (8, per category)
                                    │         ↓
                                    ├─── LinkedIn + Form Answers (9)
                                    │         ↓
                                    └─── Apply Heuristics + Chrome Prompt (10)
```

---

## Invalidation Rules

Editing an earlier step clears all downstream data. The map:

| If You Edit Step... | First Field Cleared | Through...     |
| ------------------- | ------------------- | -------------- |
| 1 (Resume)          | profile             | applyData      |
| 2 (Preferences)     | profile             | applyData      |
| 3 (Profile)         | generatedQueries    | applyData      |
| 4 (Search)          | marketRaw           | applyData      |
| 5 (Analyze)         | miningResults       | applyData      |
| Dashboard: Deep Dive | exclusions         | applyData      |
| Dashboard: Skills    | masterResume       | applyData      |

**Note:** Step 5 does NOT clear `miningQuestions` (those come from market analysis itself). See `INVALIDATION_MAP` in `page.tsx` for the exact field list per step. In the target state, the "Deep Dive" invalidation row fires when the user re-enters the Deep-Dive Q&A dashboard activity and changes answers — not when re-visiting an onboarding step.

**Dirty tracking:** Before backward navigation, the system snapshots current data. If the user re-completes the step with no changes, invalidation is skipped.

---

## Phase System

### Phase Transitions

- **Onboarding → READY**: Automatic after step 3 completion. Celebration overlay shown.
- **READY → AIM**: Automatic after step 5 completion. Soft gate may appear (auth prompt).
- **AIM → FIRE**: Automatic after step 9 completion.

### Phase Bar Behavior

- Hidden during onboarding (steps 1–3)
- Shows READY / AIM / FIRE pills on steps 4+
- Each pill: Active (orange), Done (green), Disabled (gray)
- Step indicators within each phase: Done (checkmark), Active (highlighted), Pending (dot)
- On desktop (≥ 1024px), the SidePanel provides step-level navigation alongside the PhaseBar
- On mobile (< 1024px), the PhaseBar is the primary navigation (SidePanel hidden)

---

## Structural Invariants

These truths must hold in any implementation:

1. **The wizard is strictly linear.** No step can be entered without completing all prior steps.
2. **Market data is real.** No synthetic or placeholder data in production.
3. **User controls the rules.** The extension can auto-apply, but the user defines the heuristics (apply-if/skip-if signals) that govern every decision.
4. **No fabrication.** AI-generated content never invents experience, metrics, or credentials.
5. **Encryption at rest.** All session data in localStorage is AES-GCM encrypted.
6. **API keys are server-side only.** Claude and BD keys never reach the client.
7. **External data is untrusted.** Job listing content is wrapped in injection-defense tags.
8. **Backward navigation triggers invalidation.** Changed inputs always clear stale downstream outputs.
9. **Free tier delivers real value.** 150 rockets = market analysis + 2 targeted resumes minimum.
10. **DeusMechanicus wraps the entire app tree.** It is the outermost React context provider.
