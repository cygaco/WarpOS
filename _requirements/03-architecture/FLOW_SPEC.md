<!-- SPEC-AHEAD-OF-CODE: In the target state, the onboarding phase ends at landscape analysis / segment lock. Deep-Dive Q&A moves to a dashboard activity. Scope curation's placement is an open ambiguity (retained as onboarding Step 7 here). The sections below that describe "Step 6: Deep-Dive Q&A" as an onboarding step are spec-ahead annotated — they describe the shipped code's state and should be rewritten in the next skeleton build. -->
# AcmeLaunch — UX Flow Specification

This document defines the step-by-step founder flow through the app: entry states, exit states, gates, and parallelism. Builders MUST read this before implementing any step component.

**Why this exists:** Agents repeatedly build onboarding as a sequential blocking flow (idea brief → wait for parse → review → constraints → profile). The correct architecture is parallel (idea brief → background parse → constraints → gate → profile). Without an explicit flow spec, agents infer flow from code structure and get it wrong.

---

## Flow Principles

1. **Never block the founder on AI processing.** If AI work can run in background while the founder does something else, it MUST.
2. **Ask brief-independent questions first.** Constraints (launch goal, timeline, budget, channels, geography, audience, deal-breakers) don't need parsed idea-brief data. Ask them during parse.
3. **Every step has explicit entry states.** A step may be entered under multiple conditions (e.g., parse done vs. parse still running). All entry states must be enumerated and handled.
4. **Gates are synchronization points.** When a step needs data from a background task, it gates on that data with explicit loading/error/retry states.
5. **The Landscape Sweep is ONE continuous screen.** Research loading → analysis loading → CTA, all on the same StepCollect component. The transition to Lock Your Segments (segment selection) only happens when the founder taps "View Your Landscape." Do NOT add a screen change between research and analysis.
6. **Onboarding phase ends at the dashboard.** Target state: onboarding is 5 required steps (idea brief → constraints → profile → research → landscape analysis / segment lock); Deep-Dive Q&A is a dashboard activity; scope curation's placement is an open ambiguity (retained as onboarding Step 7 in this document pending follow-up). Spec-ahead-of-code: shipped code runs 7 onboarding steps ending at scope curation.

## Step Condensation Rules

Steps can be condensed (merged) when multiple steps share a screen. When this happens:

1. **Check feature boundaries.** Each step may map to a different feature in `_requirements/04-features/`. Condensing steps that cross feature boundaries means one component now implements parts of TWO features. The PRDs, stories, and data contracts for both features must be updated.
2. **Check INTEGRATION-MAP.md.** If Step A writes `fieldX` and Step B reads `fieldX`, condensing them doesn't remove the dependency — the data still needs to flow. Verify the merged component handles both writes.
3. **Check STEP_REQUIRES in constants.ts.** Navigation gates may reference a step that no longer exists as a separate screen. Update the gate to check the correct data condition.
4. **Check `.claude/manifest.json` build.phases and store.json features[*].files.** Agent build tasks are per-feature. If a condensation merges parts of two features into one component, the build phases and feature file-ownership entries need to reflect which agent builds what.
5. **Run `/eval:cross` after condensation.** Cross-layer audit catches spec-code drift from structural changes.

**Current condensations:**
- Onboarding steps 4-5 condensed into PrepPage (3-substep architecture) — see Onboarding Steps 4-5 section below
- Onboarding steps 6-7: Deep Dive and Scope Curation are sequential screens within the shipped onboarding flow (step 6 completes before step 7 unlocks). Target state: Deep Dive is relocated to a dashboard activity and no longer gates scope curation.

---

## Onboarding Flow (Steps 1–5 target; 1–7 shipped)

Target state: onboarding is 5 steps (idea brief → constraints → profile → research → landscape analysis / segment lock). After segment lock, the founder lands on the dashboard. Deep-Dive Q&A is launched from the dashboard as an optional readiness-jump activity.

Shipped state: onboarding is 7 steps (adds Deep Dive as Step 6 and Scope Curation as Step 7 before dashboard). The auth gate appears at dashboard entry for unauthenticated users in both cases.

### IntroScreen → Step 2 (Parallel Parse)

```
Founder submits idea brief
  ├── Save ideaBriefRaw to session
  ├── Fire background PARSE API call (async, non-blocking)
  └── Advance immediately to Step 2 (Constraints)
```

**The founder never waits for parsing.** Parsing runs concurrently with constraint collection.

### Step 2: Constraints (6 substeps)

**Entry states:**
| State | Condition | Behavior |
|-------|-----------|----------|
| Fresh start | `ideaBriefRaw` exists, `ideaBriefStructured` missing | Show parsing banner, collect constraints |
| Parse completed mid-step | `ideaBriefStructured` populated during substep | Banner turns green, no interruption |
| Parse failed | Parse API returned error | Banner turns red with retry, constraints continue |
| Returning founder | Session has constraints partially filled | Resume at last completed substep |

**All 6 substeps are brief-independent.** None reads `ideaBriefStructured`, `venture`, or `traction`.

Substeps (6 total, all brief-independent): goal → launchtype → budget → geography → quickcheck → dealbreakers

> **Note:** Earlier versions of this spec listed 'profile' and 'aboutyou' as substeps of Step 2. Those are NOT substeps — Step 3 (Profile Generation, `Step4Profile.tsx`) is a separate step gated on parsed idea-brief data. The 6 substeps above are the canonical list per the onboarding PRD.

**Exit state:** All constraints saved to session. `currentStep` advances to 3.

### Step 3: Profile Generation & Idea-Brief Verification

**Entry states:**
| State | Condition | Behavior |
|-------|-----------|----------|
| Parse done, constraints done | `ideaBriefStructured` exists AND all constraints saved | Profile generation starts immediately |
| Parse still running | `ideaBriefStructured` missing, parse in progress | Show "Waiting for idea-brief parsing..." with progress |
| Parse failed | `ideaBriefStructured` missing, parse errored | Show retry option + re-submit option |
| Returning with profile | `profile` exists in session | Show profile review (skip generation) |

**Gate:** Profile generation requires BOTH `ideaBriefStructured` AND completed constraints.

**Exit state:** Profile confirmed, `currentStep` advances to 4.

---

## Onboarding Steps 4–5: Launch Research

**Host component:** `PrepPage.tsx` (naming debt: "Prep" page hosts onboarding steps 4-5)

**PrepPage uses a 3-substep architecture:**

| Substep | Visible Component | Hidden Component | Founder Sees |
|---------|-------------------|------------------|-----------|
| 0 | StepCollect (queries + research) | — | Query editor, Launch Research button, research progress |
| 1 | StepCollect (post-research, analysis progress) | Step6Analysis (runs analysis in `display: none`) | Analysis loading messages + "Analysis Complete" CTA |
| 2 | — | — → Step6Analysis (visible, segments mode) | Segment selection cards, Lock Your Segments |

**Critical architectural rule:** Step6Analysis is a **single instance** across substeps 1-2 (uses `display: none` toggle, NOT conditional mount). This prevents re-mounting and duplicate API calls. The `initialViewPhase` prop syncs via `useEffect` when substep changes.

### Step 4: Research & Landscape Gathering (Substep 0)

**Entry states:**
| State | Condition | Behavior |
|-------|-----------|----------|
| Fresh from onboarding step 3 | Profile exists, no queries | Generate research queries from profile + constraints |
| Returning with queries | `generatedQueries` exist, no results | Show queries, allow edit, trigger research |
| Research in progress | Research triggered, no results yet | Resume polling |
| Research complete | `researchRaw` populated | Save data, advance to substep 1 (analysis) |

### Step 4→5 Transition: Analysis (Substep 1)

When research completes, PrepPage sets substep to 1. StepCollect **stays mounted** and displays analysis progress via props from PrepPage. Step6Analysis mounts hidden and auto-runs the two-phase pipeline. Analysis status is reported back to PrepPage via `onStatusChange` callback, then forwarded to StepCollect.

**Founder experience:** Research loading → analysis loading → "Analysis Complete" CTA — all on the same screen, no page flash.

When the founder taps "View Your Landscape", PrepPage sets substep to 2.

### Step 5: Landscape Analysis — Segment Selection (Substep 2)

**Entry states:**
| State | Condition | Behavior |
|-------|-----------|----------|
| Fresh from analysis | `landscapeAnalysis` + `audienceSegments` populated | Show segment cards for selection |
| Returning with analysis | `landscapeAnalysis` + `audienceSegments` exist | Show segment cards (skip to segments) |

**Founder actions:** Toggle segments on/off, review reach ranges and match strength. "Lock Your Segments" writes `rankedSegments = audienceSegments.filter(seg => seg.selected)` and advances to Step 6.

**Gate:** At least 1 segment must be selected to proceed.

---

## Deep-Dive Q&A (Dashboard Activity — Target State) + Scope Curation (Onboarding Step 7, Shipped)

<!-- SPEC-AHEAD-OF-CODE: In the target state, Deep-Dive Q&A is launched from the Dashboard, not visited as onboarding Step 6. The entry states below describe the activity regardless of host; what changes is the entry point (dashboard launch vs onboarding step advance) and the exit state (return to dashboard, no forced advance to Step 7). -->

### Deep-Dive Q&A (Dashboard Activity)

**Entry states:**
| State | Condition | Behavior |
|-------|-----------|----------|
| Fresh | Founder launches from dashboard; `landscapeAnalysis` exists, no deep-dive data | Start deep-dive Q&A |
| Returning with data | Deep-dive data exists | Show results |
| Returning with partial answers | Some Q&A answered, session has partial `deepDiveResults` | Resume at next unanswered question |

Each answered question earns +5 pts launch readiness (max 8 = 40 pts). Skipped ("Skip") questions earn 0 pts. The per-answer +5 pts indicator is shown inline in the accordion alongside the global launch-readiness meter.

**Exit state (target):** Founder returns to the Dashboard at any time — no forced advance. Answered/dismissed state persists. The deep-dive contribution to the launch-readiness score is recalculated on return to dashboard.

**Exit state (shipped):** Deep-dive Q&A complete → `currentStep` advances to 7 (Scope Curation). Will be removed in the next skeleton build.

### Step 7: Scope Curation

**Entry states:**
| State | Condition | Behavior |
|-------|-----------|----------|
| Fresh | Deep-dive Q&A complete, no scope curation | Show scope list (milestones / tasks / channels) |
| Returning with partial curation | Some items toggled, session has partial `scopeSelections` | Show scope list with previous selections preserved |

**Exit state:** Scope confirmed. `currentStep` advances to dashboard. Onboarding complete — celebration screen plays, then the founder enters the dashboard.

---

## Dashboard (Post-Onboarding)

After completing all 7 onboarding steps, the founder enters the **Dashboard**. The auth gate appears here for unauthenticated users (not during onboarding).

The dashboard has four sections, accessible from the sidebar:

| Section | What it hosts |
|---------|---------------|
| **Command Console** | Launch-readiness meter, score breakdown, quick-launch actions |
| **Assets** | Master/general/segment launch-asset generation and download |
| **Channels** | Channel kit (announcement, landing copy, email, social) + follow-up template generation |
| **Launch Run** | Launch Console setup + run-rule generation + start |

### Dashboard Entry

**Entry states:**
| State | Condition | Behavior |
|-------|-----------|----------|
| First entry, unauthenticated | Onboarding complete, no JWT | Show auth gate modal |
| First entry, authenticated | Onboarding complete, JWT valid | Show Command Console |
| Returning, authenticated | Session + JWT valid | Show Command Console |
| Dev Console mode | Dev Console active | Auth gate bypassed |

### Dashboard Section Entry States

**Command Console:**
| State | Condition | Behavior |
|-------|-----------|----------|
| Fresh | No assets generated | Show score, guide to next action |
| Has score | Launch readiness calculated | Show meter with breakdown |

**Assets:**
| State | Condition | Behavior |
|-------|-----------|----------|
| Fresh | No assets | Show generation options, auto-trigger master asset generation |
| Has master asset | `masterAsset` exists | Show master + generate segment variants |
| Has segment variants | `segmentAssets` populated | Show all asset packs |

**Channels:**
| State | Condition | Behavior |
|-------|-----------|----------|
| Fresh | Master asset exists, no channel kit | Show generate button with credit cost (75) |
| Has channel kit | `channelKit` populated | Show content cards |

**Launch Run:**
| State | Condition | Behavior |
|-------|-----------|----------|
| Fresh | Assets generated, no run history | Show run options (Launch Console, Claude prompt, manual) |
| Has history | `runHistory` exists | Show history + continue |

**Self-managing components:** Dashboard sections use `loadSession()`/`saveSession()` directly. After section completion, they MUST call `window.location.reload()` (Hygiene Rule 17).

---

## Session Persistence and Step Encoding

`src/lib/storage.ts` is the runtime authority for session persistence:

- Sessions are AES-GCM encrypted into `localStorage` under `acmeLaunchApp_session`.
- Authenticated founders sync the same validated session to `/api/session`; `loadSession()` reads Redis first but returns the newer local copy when `lastUpdated` proves local storage is fresher.
- `schemaVersion` is currently `1`; each save stamps the current version.
- `currentStep` and `maxStep` currently remain numeric in shipped routing, but validation also accepts future `Step` enum strings from `_requirements/00-canonical/STEPS.json`.
- The integer-to-enum migration is present behind `STEP_MIGRATION_V2 = false`; do not enable it without updating router comparisons that still expect numeric steps.

---

## Background Task Pattern

When any step triggers a background AI task:

```
1. Save input data to session
2. Fire async API call (DO NOT await in UI thread)
3. Show persistent status banner:
   - Active: "{task} in progress..." (yellow/olive)
   - Done: "{task} complete ✓" (green)
   - Error: "{task} failed. Retry?" (red)
4. Advance founder to next interaction immediately
5. Gate on results only when the NEXT step actually needs them
```

This pattern eliminates idle wait time and makes the app feel instant.

---

## How Builders Should Use This Document

1. **Before implementing a step component**, read its entry states table. Handle ALL states, not just the happy path.
2. **Before implementing a "Continue" button**, check whether the next step has a gate. If so, verify the gate data is populated before advancing.
3. **Before implementing an AI call**, check whether it can run in background. If the next founder interaction doesn't need the result, make it background.
4. **Self-managing components** (zero props from parent): always `window.location.reload()` after `saveSession()` with new `currentStep`.
5. **Dashboard sections** are fully self-managing — they read from and write to session directly, with no step-navigation parent.
