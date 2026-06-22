<!-- SPEC-AHEAD-OF-CODE: In the target state, the onboarding phase ends at market analysis / category lock. Deep-Dive Q&A moves to a dashboard activity. Skills' placement is an open ambiguity (retained as onboarding Step 7 here). The sections below that describe "Step 6: Deep-Dive Q&A" as an onboarding step are spec-ahead annotated — they describe the shipped code's state and should be rewritten in the next skeleton build. -->
# Jobzooka — UX Flow Specification

This document defines the step-by-step user flow through the app: entry states, exit states, gates, and parallelism. Builders MUST read this before implementing any step component.

**Why this exists:** Agents repeatedly build onboarding as a sequential blocking flow (upload → wait for parse → review → preferences → profile). The correct architecture is parallel (upload → background parse → preferences → gate → profile). Without an explicit flow spec, agents infer flow from code structure and get it wrong.

---

## Flow Principles

1. **Never block the user on AI processing.** If AI work can run in background while the user does something else, it MUST.
2. **Ask resume-independent questions first.** Preferences (direction, work type, comp, location, demographics, deal-breakers) don't need parsed resume data. Ask them during parse.
3. **Every step has explicit entry states.** A step may be entered under multiple conditions (e.g., parse done vs. parse still running). All entry states must be enumerated and handled.
4. **Gates are synchronization points.** When a step needs data from a background task, it gates on that data with explicit loading/error/retry states.
5. **The Recon Sweep is ONE continuous screen.** Scrape loading → analysis loading → CTA, all on the same StepCollect component. The transition to Lock Your Targets (category selection) only happens when the user taps "View Your Targets." Do NOT add a screen change between scrape and analysis.
6. **Onboarding phase ends at the dashboard.** Target state: onboarding is 5 required steps (resume → preferences → profile → search → market analysis / category lock); Deep-Dive Q&A is a dashboard activity; Skills' placement is an open ambiguity (retained as onboarding Step 7 in this document pending follow-up). Spec-ahead-of-code: shipped code runs 7 onboarding steps ending at skills curation.

## Step Condensation Rules

Steps can be condensed (merged) when multiple steps share a screen. When this happens:

1. **Check feature boundaries.** Each step may map to a different feature in `_requirements/04-features/`. Condensing steps that cross feature boundaries means one component now implements parts of TWO features. The PRDs, stories, and data contracts for both features must be updated.
2. **Check INTEGRATION-MAP.md.** If Step A writes `fieldX` and Step B reads `fieldX`, condensing them doesn't remove the dependency — the data still needs to flow. Verify the merged component handles both writes.
3. **Check STEP_REQUIRES in constants.ts.** Navigation gates may reference a step that no longer exists as a separate screen. Update the gate to check the correct data condition.
4. **Check `.claude/manifest.json` build.phases and store.json features[*].files.** Agent build tasks are per-feature. If a condensation merges parts of two features into one component, the build phases and feature file-ownership entries need to reflect which agent builds what.
5. **Run `/eval:cross` after condensation.** Cross-layer audit catches spec-code drift from structural changes.

**Current condensations:**
- Onboarding steps 4-5 condensed into AimPage (3-substep architecture) — see Onboarding Steps 4-5 section below
- Onboarding steps 6-7: Deep Dive and Skills are sequential screens within the shipped onboarding flow (step 6 completes before step 7 unlocks). Target state: Deep Dive is relocated to a dashboard activity and no longer gates skills curation.

---

## Onboarding Flow (Steps 1–5 target; 1–7 shipped)

Target state: onboarding is 5 steps (resume upload → preferences → profile → search → market analysis / category lock). After category lock, the user lands on the dashboard. Deep-Dive Q&A is launched from the dashboard as an optional tier-jump activity.

Shipped state: onboarding is 7 steps (adds Deep Dive as Step 6 and Skills as Step 7 before dashboard). The auth gate appears at dashboard entry for unauthenticated users in both cases.

### IntroScreen → Step 2 (Parallel Parse)

```
User uploads resume
  ├── Save resumeRaw to session
  ├── Fire background PARSE API call (async, non-blocking)
  └── Advance immediately to Step 2 (Preferences)
```

**The user never waits for parsing.** Parsing runs concurrently with preference collection.

### Step 2: Preferences (6 substeps)

**Entry states:**
| State | Condition | Behavior |
|-------|-----------|----------|
| Fresh start | `resumeRaw` exists, `resumeStructured` missing | Show parsing banner, collect preferences |
| Parse completed mid-step | `resumeStructured` populated during substep | Banner turns green, no interruption |
| Parse failed | Parse API returned error | Banner turns red with retry, preferences continue |
| Returning user | Session has preferences partially filled | Resume at last completed substep |

**All 6 substeps are resume-independent.** None reads `resumeStructured`, `personal`, or `education`.

Substeps (6 total, all resume-independent): direction → worktype → comp → location → quickcheck → dealbreakers

> **Note:** Earlier versions of this spec listed 'profile' and 'aboutyou' as substeps of Step 2. Those are NOT substeps — Step 3 (Profile Generation, `Step4Profile.tsx`) is a separate step gated on parsed resume data. The 6 substeps above are the canonical list per the onboarding PRD.

**Exit state:** All preferences saved to session. `currentStep` advances to 3.

### Step 3: Profile Generation & Resume Verification

**Entry states:**
| State | Condition | Behavior |
|-------|-----------|----------|
| Parse done, prefs done | `resumeStructured` exists AND all prefs saved | Profile generation starts immediately |
| Parse still running | `resumeStructured` missing, parse in progress | Show "Waiting for resume parsing..." with progress |
| Parse failed | `resumeStructured` missing, parse errored | Show retry option + re-upload option |
| Returning with profile | `profile` exists in session | Show profile review (skip generation) |

**Gate:** Profile generation requires BOTH `resumeStructured` AND completed preferences.

**Exit state:** Profile confirmed, `currentStep` advances to 4.

---

## Onboarding Steps 4–5: Market Research

**Host component:** `AimPage.tsx` (naming debt: "Aim" page hosts onboarding steps 4-5)

**AimPage uses a 3-substep architecture:**

| Substep | Visible Component | Hidden Component | User Sees |
|---------|-------------------|------------------|-----------|
| 0 | StepCollect (queries + scrape) | — | Query editor, Launch Recon button, scrape progress |
| 1 | StepCollect (post-scrape, analysis progress) | Step6Analysis (runs analysis in `display: none`) | Analysis loading messages + "Analysis Complete" CTA |
| 2 | — | — → Step6Analysis (visible, categories mode) | Category selection cards, Lock Your Targets |

**Critical architectural rule:** Step6Analysis is a **single instance** across substeps 1-2 (uses `display: none` toggle, NOT conditional mount). This prevents re-mounting and duplicate API calls. The `initialViewPhase` prop syncs via `useEffect` when substep changes.

### Step 4: Search & Job Scraping (Substep 0)

**Entry states:**
| State | Condition | Behavior |
|-------|-----------|----------|
| Fresh from onboarding step 3 | Profile exists, no queries | Generate search queries from profile + preferences |
| Returning with queries | `generatedQueries` exist, no jobs | Show queries, allow edit, trigger scrape |
| Scrape in progress | Scrape triggered, no results yet | Resume polling |
| Scrape complete | `marketRaw` populated | Save data, advance to substep 1 (analysis) |

### Step 4→5 Transition: Analysis (Substep 1)

When scrape completes, AimPage sets substep to 1. StepCollect **stays mounted** and displays analysis progress via props from AimPage. Step6Analysis mounts hidden and auto-runs the two-phase pipeline. Analysis status is reported back to AimPage via `onStatusChange` callback, then forwarded to StepCollect.

**User experience:** Scrape loading → analysis loading → "Analysis Complete" CTA — all on the same screen, no page flash.

When user taps "View Your Targets", AimPage sets substep to 2.

### Step 5: Market Analysis — Category Selection (Substep 2)

**Entry states:**
| State | Condition | Behavior |
|-------|-----------|----------|
| Fresh from analysis | `marketAnalysis` + `jobTypes` populated | Show category cards for selection |
| Returning with analysis | `marketAnalysis` + `jobTypes` exist | Show category cards (skip to categories) |

**User actions:** Toggle categories on/off, review comp ranges and match strength. "Lock Your Targets" writes `rankedCategories = jobTypes.filter(jt => jt.selected)` and advances to Step 6.

**Gate:** At least 1 category must be selected to proceed.

---

## Deep-Dive Q&A (Dashboard Activity — Target State) + Skills (Onboarding Step 7, Shipped)

<!-- SPEC-AHEAD-OF-CODE: In the target state, Deep-Dive Q&A is launched from the Dashboard, not visited as onboarding Step 6. The entry states below describe the activity regardless of host; what changes is the entry point (dashboard launch vs onboarding step advance) and the exit state (return to dashboard, no forced advance to Step 7). -->

### Deep-Dive Q&A (Dashboard Activity)

**Entry states:**
| State | Condition | Behavior |
|-------|-----------|----------|
| Fresh | User launches from dashboard; `marketAnalysis` exists, no mining data | Start mining Q&A |
| Returning with data | Mining data exists | Show results |
| Returning with partial answers | Some Q&A answered, session has partial `miningResults` | Resume at next unanswered question |

Each answered question earns +5 pts competitiveness (max 8 = 40 pts). Skipped ("Skip") questions earn 0 pts. The per-answer +5 pts indicator is shown inline in the accordion alongside the global competitiveness meter.

**Exit state (target):** User returns to the Dashboard at any time — no forced advance. Answered/dismissed state persists. The deep-dive contribution to the competitiveness score is recalculated on return to dashboard.

**Exit state (shipped):** Mining Q&A complete → `currentStep` advances to 7 (Skills). Will be removed in the next skeleton build.

### Step 7: Skills Curation

**Entry states:**
| State | Condition | Behavior |
|-------|-----------|----------|
| Fresh | Mining Q&A complete, no skill curation | Show skill list |
| Returning with partial curation | Some skills toggled, session has partial `skillSelections` | Show skill list with previous selections preserved |

**Exit state:** Skills confirmed. `currentStep` advances to dashboard. Onboarding complete — celebration screen plays, then user enters the dashboard.

---

## Dashboard (Post-Onboarding)

After completing all 7 onboarding steps, the user enters the **Dashboard**. The auth gate appears here for unauthenticated users (not during onboarding).

The dashboard has four sections, accessible from the sidebar:

| Section | What it hosts |
|---------|---------------|
| **Command Console** | Competitiveness meter, score breakdown, quick-launch actions |
| **Resumes** | Master/general/targeted resume generation and download |
| **LinkedIn** | LinkedIn profile content + form answers generation |
| **Auto-Apply** | Extension setup + heuristic generation + launch |

### Dashboard Entry

**Entry states:**
| State | Condition | Behavior |
|-------|-----------|----------|
| First entry, unauthenticated | Onboarding complete, no JWT | Show auth gate modal |
| First entry, authenticated | Onboarding complete, JWT valid | Show Command Console |
| Returning, authenticated | Session + JWT valid | Show Command Console |
| Deus Mechanicus mode | DM active | Auth gate bypassed |

### Dashboard Section Entry States

**Command Console:**
| State | Condition | Behavior |
|-------|-----------|----------|
| Fresh | No resumes generated | Show score, guide to next action |
| Has score | Competitiveness calculated | Show meter with breakdown |

**Resumes:**
| State | Condition | Behavior |
|-------|-----------|----------|
| Fresh | No resumes | Show generation options, auto-trigger master resume generation |
| Has master resume | `masterResume` exists | Show master + generate targeted |
| Has targeted resumes | `targetedResumes` populated | Show all resumes |

**LinkedIn:**
| State | Condition | Behavior |
|-------|-----------|----------|
| Fresh | Master resume exists, no LinkedIn | Show generate button with rocket cost (75) |
| Has LinkedIn content | `linkedinContent` populated | Show content cards |

**Auto-Apply:**
| State | Condition | Behavior |
|-------|-----------|----------|
| Fresh | Resumes generated, no apply history | Show apply options (extension, Claude prompt, manual) |
| Has history | `applyHistory` exists | Show history + continue |

**Self-managing components:** Dashboard sections use `loadSession()`/`saveSession()` directly. After section completion, they MUST call `window.location.reload()` (Hygiene Rule 17).

---

## Session Persistence and Step Encoding

`src/lib/storage.ts` is the runtime authority for session persistence:

- Sessions are AES-GCM encrypted into `localStorage` under `jobSearchApp_session`.
- Authenticated users sync the same validated session to `/api/session`; `loadSession()` reads Redis first but returns the newer local copy when `lastUpdated` proves local storage is fresher.
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
4. Advance user to next interaction immediately
5. Gate on results only when the NEXT step actually needs them
```

This pattern eliminates idle wait time and makes the app feel instant.

---

## How Builders Should Use This Document

1. **Before implementing a step component**, read its entry states table. Handle ALL states, not just the happy path.
2. **Before implementing a "Continue" button**, check whether the next step has a gate. If so, verify the gate data is populated before advancing.
3. **Before implementing an AI call**, check whether it can run in background. If the next user interaction doesn't need the result, make it background.
4. **Self-managing components** (zero props from parent): always `window.location.reload()` after `saveSession()` with new `currentStep`.
5. **Dashboard sections** are fully self-managing — they read from and write to session directly, with no step-navigation parent.
