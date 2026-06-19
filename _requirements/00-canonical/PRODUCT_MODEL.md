# AcmeLaunch — Canonical Product Model

<!-- SPEC-AHEAD-OF-CODE: This document defines the TARGET product model the next skeleton build will realize. A key change: Deep-Dive Q&A moves from the onboarding phase (currently Step 6) to the dashboard phase as an optional tier-jump activity. Shipped code still positions deep-dive as a required onboarding step. See "Phase Vocabulary" below. -->

This document defines the structural primitives, Jobs to Be Done, and invariant truths of the product.

---

## Phase Vocabulary (Canonical)

- **Onboarding phase** = all steps before the dashboard. The required, no-skip sequence that captures profile inputs: idea-brief intake, extraction, launch constraints, founder profile, landscape research, segment lock. The user cannot reach the dashboard until these complete.
- **Dashboard phase** = the dashboard itself + every optional activity founders launch from there (on first arrival or on return visits). Includes: Deep-Dive Q&A (tier-jump unlock), segment/master/overview plan generation, channel kits, launch run, and any future readiness-boosting activities. All are opt-in after the founder sees their baseline dashboard.

**Key invariant:** Deep-Dive Q&A is a dashboard activity, not an onboarding step. Founders see a baseline launch-readiness score on first dashboard entry; answering deep-dive questions is one of the optional ways to push the score into a higher tier.

---

## Product Primitives

These are the fundamental building blocks of AcmeLaunch. Every feature is composed of these primitives.

### 1. The Wizard

A 10-step linear flow organized into 3 phases (PLAN / PREP / LAUNCH) plus onboarding. Each step:

- Receives input from previous steps
- Produces output consumed by later steps
- Has explicit completion criteria (see PHASE_DISPLAY)
- Can be revisited, with downstream invalidation

**Structural truths:**

- Steps are strictly ordered. You cannot skip ahead.
- Going backward and changing data invalidates all downstream outputs per the INVALIDATION_MAP in `page.tsx`. Dirty tracking: if re-completing a step with no actual changes, invalidation is skipped.
- Each step has a `needsData` prerequisite (STEP_REQUIRES) — the sidebar enforces this.
- The wizard state is a single `SessionData` object, persisted in encrypted localStorage.

### 2. Launch Landscape Intelligence

Real launch-landscape data powers every downstream output. The pipeline:

1. Founder sets launch constraints (timeline, budget, channels, geography, audience)
2. AI generates 4–6 research queries
3. The Launch Research adapter gathers ~50 public signals per query
4. Two-phase Claude analysis: raw signals → intelligence report → structured analysis
5. Output: positioning keywords, audience segments, channel-cost ranges, mining questions

**Structural truths:**

- Landscape data is real, not synthetic. Everything downstream is grounded in actual public launch signals.
- Segments are buying contexts, not just demographics (e.g., "Indie Hackers — Product Hunt Launch Audience" is distinct from "Enterprise Buyers — Direct Sales").
- The intelligence report (LANDSCAPE_PREP) is an intermediate artifact — the founder never sees it directly.
- If LANDSCAPE_PREP fails, the system falls back to single-phase analysis.

### 3. Credits (Credit Economy)

A virtual currency gating premium operations.

**Structural truths:**

- Free tier: 150 credits on signup.
- Every billable operation has a fixed cost (segment plan: 50, channel kit: 75, landscape re-run: 50).
- Bulk discounts exist for segment plans (50 → 35 → 25 per segment at higher volumes).
- Launch run is free (0 credits) during launch phase. May become a billable operation later.
- Landscape analysis first run is free.
- Credits are never refunded on failure — the operation is retried instead.

### 4. Launch-Readiness Scoring

A 0–100+ score reflecting how launch-ready the founder's plan and assets are. Score is **uncapped** — generating segment plans for all segments pushes toward 100%, and bonus segments can exceed it.

**Structural truths:**

- Score increases as founders complete steps and add data.
- Score is computed client-side from session data completeness + quality signals (`readiness.ts`).
- Visual thresholds: 40 (baseline), 70 (forming), 90 (strong), 100 (launch-ready).
- Crossing a threshold triggers a celebration (GlazeToast + optional ConfettiBurst).
- The meter is always visible in the CreditBar (compact) and available in full-size.

**Weight breakdown (sums to 100% base):**

| Component              | Weight | Notes                                  |
| ---------------------- | ------ | -------------------------------------- |
| Deep-Dive QA (batch 1) | 5%     | First set of mining questions answered |
| Deep-Dive QA (batch 2) | 10%    | Bonus batch answered                   |
| Segments selected      | 5%     | At least one ranked segment            |
| Scope curated          | 5%     | Exclusions/inclusions reviewed         |
| Master plan            | 10%    | Generated                              |
| Overview plan          | 5%     | Generated                              |
| Segment plans          | 25%    | Per-segment, proportional — UNCAPPED   |
| Channel kit            | 15%    | Generated                              |
| Launch run connected   | 10%    | Runner configured                      |
| Follow-up reviewed     | 10%    | Follow-up sequences ready              |

**Labels:** "Getting started" (0–39), "Building momentum" (40–69), "Strong plan" (70–89), "Launch-ready" (90–100), "OVERKILL" (>100)

### 5. Launch Plan Generation

Three-tier plan system: Master → Overview → Segment.

**Structural truths:**

- Master is generated once, contains everything. It is the source of truth.
- Overview is a condensed version. Only generated if master is long; otherwise master serves as both.
- Segment is a diff applied to the master for a specific audience segment. One per segment.
- Diffs never fabricate — they reorder, rewrite, and remove, but never add false claims about the product.
- Export safety: ASCII only, straight quotes, hyphens (not em-dashes).

---

## Jobs to Be Done

### Primary JTBD

> **When** I'm preparing to launch, **I want to** quickly produce a launch plan and assets that match what the market actually rewards, **so that** I spend less time guessing and more time launching — and with the runner, less time executing too.

### Supporting JTBDs

| JTBD                                                                  | Where                                            |
| --------------------------------------------------------------------- | ------------------------------------------------ |
| "I want to understand what the landscape looks like for my idea"      | Onboarding 4–5 (Research + Analyze)              |
| "I want my plan to use the right positioning for each audience"       | Dashboard activities: Deep-Dive QA + Scope + Plan Gen |
| "I want different versions of my plan for different audience segments" | Dashboard: Segment Plan Gen                      |
| "I want my channel assets to reflect my strongest positioning"        | Dashboard: Channel Kits                          |
| "I want to run my launch quickly without losing control"              | Dashboard: Launch Run                            |
| "I want to know what I'm missing so I can fill in the gaps"           | Dashboard: Deep-Dive QA (tier-jump activity)     |
| "I want to see how launch-ready I am before I start"                  | Cross-cutting (Launch-Readiness Score — visible starting at dashboard entry) |
| "I want to control what scope and proof are emphasized"               | Dashboard: Scope Curation                        |

---

## The 10-Step Model (Target State)

<!-- SOURCE OF TRUTH: _requirements/00-canonical/STEPS.json — the step list, phase membership, positions, and requires_data/produces_data edges below must mirror the registry. Propagation is manual until /maps:steps regenerates this table automatically. -->

> **Spec-ahead-of-code:** In the target state, Deep Dive is not a wizard step — it is a dashboard activity. The table below uses the activity-ID shape for clarity. Shipped code currently positions Deep Dive as Step 6 inside onboarding.

<!-- maps:steps:START (region=product-model-onboarding) --- auto-generated from _requirements/00-canonical/STEPS.json; do not edit manually. Regenerate: /maps:steps or node scripts/generate-steps-maps.js -->

**Onboarding phase (required, strictly linear):**

| # | Phase | Step ID | Component | Requires | Produces |
| - | ----- | ------- | --------- | -------- | -------- |
| 1 | Onboarding | BRIEF | Step1Brief | — | briefRaw |
| 2 | Onboarding | CONSTRAINTS | Step3Constraints | — | constraints |
| 3 | Onboarding | PROFILE | Step4Profile | briefRaw | profile |
| 4 | Onboarding | RESEARCH | StepCollect | profile | landscapeRaw |
| 5 | Onboarding | LANDSCAPE_ANALYSIS | Step6Analysis | landscapeRaw | landscapeAnalysis |

Completing the last onboarding step drops the user at the **Dashboard** with a baseline launch-readiness score.

<!-- maps:steps:END (region=product-model-onboarding) -->

Historical-context columns (Name / Input / Output / Cost) live in feature PRDs — this table is the structural core only.

<!-- maps:steps:START (region=product-model-dashboard) --- auto-generated from _requirements/00-canonical/STEPS.json; do not edit manually. Regenerate: /maps:steps or node scripts/generate-steps-maps.js -->

**Dashboard phase (optional activities, user opts in from dashboard):**

| Activity | Component | Requires | Produces |
| -------- | --------- | -------- | -------- |
| DEEP_DIVE | DeepDiveQA | landscapeAnalysis | miningResults |
| SKILLS | Step8Skills | miningResults | exclusions |
| LAUNCH_PLANS | Step10Plans | profile | masterPlan |
| CHANNELS | Step11Channels | masterPlan | channels |
| LAUNCH_RUN | Step13Run | masterPlan | run_actions |

Dashboard activities have dependency edges (see Requires column), but the user chooses the order. The dashboard surfaces a recommended "next unlock" based on highest point-gain, not a forced sequence.

<!-- maps:steps:END (region=product-model-dashboard) -->

**Cost signals (hand-maintained, reference only):** Launch Plans 50/segment; Channel Kits 75; Deep Dive / Scope / Launch Run Free. See individual feature PRDs for authoritative pricing.

**Note on Scope:** The position of Scope (onboarding vs. dashboard activity) is NOT explicitly changed by this revision. The user scope for this spec change covered deep-dive only. Flagged as an open ambiguity — see the deep-dive-qa PRD and the Golden Paths doc for the interim "dashboard activity" placement used here.

---

## Data Dependency Chain

```
Idea Brief (1) → Profile (3) → Queries (4) → Landscape Signals (4)
                                              ↓
                                        Landscape Prep (5a)
                                              ↓
                                        Landscape Analysis (5b)
                                              ↓
                                    ┌─── Mining Questions (6)
                                    │         ↓
                                    │    Mining Results (6)
                                    │         ↓
                                    ├─── Scope Curation (7)
                                    │         ↓
                                    ├─── Master + Overview Plan (8)
                                    │         ↓
                                    ├─── Segment Plans (8, per segment)
                                    │         ↓
                                    ├─── Channel Kits + Follow-Up Templates (9)
                                    │         ↓
                                    └─── Launch Rules + Run Prompt (10)
```

---

## Invalidation Rules

Editing an earlier step clears all downstream data. The map:

| If You Edit Step... | First Field Cleared | Through...     |
| ------------------- | ------------------- | -------------- |
| 1 (Idea Brief)      | profile             | runData        |
| 2 (Constraints)     | profile             | runData        |
| 3 (Profile)         | generatedQueries    | runData        |
| 4 (Research)        | landscapeRaw        | runData        |
| 5 (Analyze)         | miningResults       | runData        |
| Dashboard: Deep Dive | exclusions         | runData        |
| Dashboard: Scope     | masterPlan          | runData        |

**Note:** Step 5 does NOT clear `miningQuestions` (those come from landscape analysis itself). See `INVALIDATION_MAP` in `page.tsx` for the exact field list per step. In the target state, the "Deep Dive" invalidation row fires when the user re-enters the Deep-Dive Q&A dashboard activity and changes answers — not when re-visiting an onboarding step.

**Dirty tracking:** Before backward navigation, the system snapshots current data. If the user re-completes the step with no changes, invalidation is skipped.

---

## Phase System

### Phase Transitions

- **Onboarding → PLAN**: Automatic after step 3 completion. Celebration overlay shown.
- **PLAN → PREP**: Automatic after step 5 completion. Soft gate may appear (auth prompt).
- **PREP → LAUNCH**: Automatic after step 9 completion.

### Phase Bar Behavior

- Hidden during onboarding (steps 1–3)
- Shows PLAN / PREP / LAUNCH pills on steps 4+
- Each pill: Active (orange), Done (green), Disabled (gray)
- Step indicators within each phase: Done (checkmark), Active (highlighted), Pending (dot)
- On desktop (≥ 1024px), the SidePanel provides step-level navigation alongside the PhaseBar
- On mobile (< 1024px), the PhaseBar is the primary navigation (SidePanel hidden)

---

## Structural Invariants

These truths must hold in any implementation:

1. **The wizard is strictly linear.** No step can be entered without completing all prior steps.
2. **Landscape data is real.** No synthetic or placeholder data in production.
3. **Founder controls the rules.** The runner can execute launch actions, but the founder defines the launch rules (do/skip signals) that govern every decision.
4. **No fabrication.** AI-generated content never invents traction, metrics, or claims.
5. **Encryption at rest.** All session data in localStorage is AES-GCM encrypted.
6. **API keys are server-side only.** Claude and research-provider keys never reach the client.
7. **External data is untrusted.** Research signal content is wrapped in injection-defense tags.
8. **Backward navigation triggers invalidation.** Changed inputs always clear stale downstream outputs.
9. **Free tier delivers real value.** 150 credits = landscape analysis + 2 segment plans minimum.
10. **DevConsole wraps the entire app tree.** It is the outermost React context provider.
