# AcmeLaunch — Glossary

Canonical terminology dictionary. Every product term used across all documentation is defined here. If a term is not listed, it is not a product term and should not be used without adding it here first.

---

## Product Identity

| Term         | Definition                                                                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **AcmeLaunch** | The product. A launch-planning assistant that transforms a rough idea brief into segment-specific launch plans, channel-ready launch assets, follow-up sequences, and a guided launch run. |
| **Onboarding phase** | (Target state) The required, no-skip sequence before the dashboard: idea-brief intake, extraction, launch constraints, founder profile, landscape research, segment lock. Captures the profile inputs that unlock the dashboard. Spec-ahead-of-code: shipped code still includes Deep Dive + Skills inside onboarding. |
| **Dashboard phase** | (Target state) The dashboard itself + every optional activity founders opt into after completing onboarding: Deep-Dive Q&A (tier-jump), Asset Tuning, Launch Plans, Channel Kits, Launch Run. Activities can be launched in any order based on the dashboard's "next unlock" guidance. |
| **Dashboard** | The post-onboarding command center. Hosts the readiness meter, optional tier-jump activities (including Deep-Dive Q&A), and the core sections: Command Console, Launch Plans, Channel Kits, Launch Run. |

---

## Onboarding Steps (Target State)

<!-- SOURCE OF TRUTH: _requirements/00-canonical/STEPS.json — the onboarding-steps table and any dashboard-activities table below must mirror the registry. Propagation is manual until /maps:steps regenerates these tables automatically. -->


<!-- SPEC-AHEAD-OF-CODE: The target state moves Deep Dive out of onboarding into a dashboard activity. The table below reflects the target onboarding phase. Shipped code currently hosts 7 onboarding steps (including Deep Dive as Step 6 and Skills as Step 7). See the "Dashboard Activities" table below for the relocated/post-dashboard activities. -->

The target-state onboarding is 5 steps (idea brief → launch constraints → founder profile → research → landscape analysis). After the last onboarding step, the user enters the dashboard with a baseline launch-readiness score.

**Runtime constants note:** `src/lib/constants.ts` still defines the shipped router as `ONBOARDING_TOTAL = 7` with `Brief`, `Constraints`, `Profile`, `Research`, `Analysis`, `Deep Dive`, and `Skills`. The tables below describe the target-state registry from `_requirements/00-canonical/STEPS.json`; do not use them to infer the current shipped step count until the next skeleton rebuild lands the phase move.

<!-- maps:steps:START (region=glossary-onboarding) --- auto-generated from _requirements/00-canonical/STEPS.json; do not edit manually. Regenerate: /maps:steps or node scripts/generate-steps-maps.js -->

| Position | Step ID | Component | File |
| -------- | ------- | --------- | ---- |
| 1 | BRIEF | Step1Brief | src/components/steps/Step1Brief.tsx |
| 2 | CONSTRAINTS | Step3Constraints | src/components/steps/Step3Constraints.tsx |
| 3 | PROFILE | Step4Profile | src/components/steps/Step4Profile.tsx |
| 4 | RESEARCH | StepCollect | src/components/steps/StepCollect.tsx |
| 5 | LANDSCAPE_ANALYSIS | Step6Analysis | src/components/steps/Step6Analysis.tsx |

<!-- maps:steps:END (region=glossary-onboarding) -->

Component filenames carry legacy numbering that does NOT match logical step numbers. See **Naming Debt** below.

### Dashboard Activities (relocated / post-dashboard)

<!-- maps:steps:START (region=glossary-dashboard) --- auto-generated from _requirements/00-canonical/STEPS.json; do not edit manually. Regenerate: /maps:steps or node scripts/generate-steps-maps.js -->

| Activity | Component | File | Feature |
| -------- | --------- | ---- | ------- |
| DEEP_DIVE | DeepDiveQA | src/components/DeepDiveQA.tsx | deep-dive-qa |
| SKILLS | Step8Skills | src/components/steps/Step8Skills.tsx | scope-curation |
| LAUNCH_PLANS | Step10Plans | src/components/steps/Step10Plans.tsx | plan-generation |
| CHANNELS | Step11Channels | src/components/steps/Step11Channels.tsx | channels |
| LAUNCH_RUN | Step13Run | src/components/steps/Step13Run.tsx | launch-run |

<!-- maps:steps:END (region=glossary-dashboard) -->

**Spec-ahead-of-code:** Deep Dive's placement is the only phase move confirmed by the current spec revision. Skills' position (still-in-onboarding vs. relocated-to-dashboard) is marked as an open ambiguity — see "Outstanding Ambiguities" in the skeleton-build plan.

---

## Dashboard Sections

Post-onboarding. All sections are accessible from the dashboard sidebar.

| Section              | What it hosts                                        | Auth required |
| -------------------- | ---------------------------------------------------- | ------------- |
| **Command Console**  | Readiness meter, score breakdown, quick-launch       | Yes (auth gate on entry) |
| **Launch Plans**     | Master/overview/segment plan generation + download   | Yes           |
| **Channel Kits**     | Channel-ready launch assets + follow-up templates    | Yes           |
| **Launch Run**       | Runner setup, launch-rule generation, launch         | Yes           |

---

## Screens

Composite page components that host multiple steps.

| Term               | Steps | Component File       | Hosts                                   |
| ------------------ | ----- | -------------------- | --------------------------------------- |
| **OnboardingPage** | 1–7   | `OnboardingPage.tsx` | Idea brief, constraints, profile, landscape research, deep-dive, scope |
| **PrepPage**       | 4–5   | `PrepPage.tsx`       | Research queries + landscape analysis (3-substep: research → analysis → segments) |
| **Dashboard**      | —     | `Dashboard.tsx`      | Command Console, Launch Plans, Channel Kits, Launch Run |
| **Step13Run**      | —     | `Step13Run.tsx`      | Launch run (hosted in Dashboard Launch Run section) |

See **Naming Debt** section below for why component names don't match structure.

---

## Landscape Sweep — Key Terminology

Onboarding steps 4-5 use a launch-prep framing. These terms have specific meanings:

| Term | Scope | What It Means |
|------|-------|---------------|
| **Landscape Mission** | Screen name | The entire PrepPage experience (onboarding steps 4-5). User-facing heading for the research/landscape screen. |
| **Landscape Sweep** | Execution phase | Everything that happens after "Start Research": research run → LANDSCAPE_PREP → LANDSCAPE analysis → CTA. One continuous loading sequence, no user interaction. |
| **Start Research** | CTA button | Triggers the landscape sweep. User sees research phases then analysis phases on the same screen. |
| **Analysis** | API calls only | Specifically the LANDSCAPE_PREP + LANDSCAPE Claude API calls. A subset of the landscape sweep. |
| **Analysis Complete** | CTA bridge | The "landscape mapped" message + "View Your Segments" button that appears after the landscape sweep finishes. |
| **Lock Your Segments** | Screen name | The segment selection screen (onboarding step 5, PrepPage substep 2). User toggles segments on/off, then locks. |
| **Lock Segments** | CTA button | Confirms segment selection and advances to Deep Dive QA (onboarding step 6). Writes `rankedSegments`. |

**Why this matters:** "Analysis" is ambiguous. When the user says "analysis," they usually mean the whole landscape sweep. When specs say "analysis," they mean the LANDSCAPE API calls. Use "landscape sweep" for the full execution and "analysis" for the API calls specifically.

---

## Naming Debt

Known inversions — do NOT rename files, fix references to match reality.

| Debt                       | Details                                                                                                                                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Legacy step numbers**    | Component filenames don't match logical steps (e.g., `Step3Constraints.tsx` = step 2, `Step13Run.tsx` = launch run). The numbering reflects an earlier step sequence that was consolidated. |
| **PrepPage name**          | `PrepPage.tsx` hosts onboarding steps 4-5 (landscape research). The name was assigned before the current architecture existed.                                                            |
| **PlanPage target-state debt** | `PlanPage.tsx` still exists as the shipped Step 6 router host. Target-state specs move Deep-Dive Q&A to the dashboard and should delete or retire this page in the next skeleton rebuild. |
| **getScreen() routing**    | `getScreen()` in `constants.ts` returns `"onboarding"` for steps 1-7 and `"dashboard"` for post-onboarding. The old `"plan"` / `"prep"` / `"launch"` values are removed.                  |

---

## Build Phases

(from `.claude/manifest.json` build.phases, agent execution order):

| Phase | Name                  | Features                                                                         |
| ----- | --------------------- | -------------------------------------------------------------------------------- |
| 0     | Foundation            | types, constants, storage, validators, pipeline, api, utils, prompts, ui, layout |
| 1     | Auth + Credits        | auth, credits                                                                    |
| 2     | Onboarding            | onboarding (steps 1-7)                                                           |
| 3     | Landscape Research    | landscape-research (steps 4-5 within onboarding)                                 |
| 4     | Deep Dive + Scope + Scoring | deep-dive-qa, scope-curation, readiness                                   |
| 5     | Plan Generation       | plan-generation, channels                                                        |
| 6     | Launch Run            | launch-run, runner                                                               |
| 7     | Dev Tools             | dev-console                                                                      |

---

## Feature IDs

Kebab-case identifiers used in `store.json`, task manifest, and PRD folder names.

| Feature ID          | PRD Folder          | Task ID                   | Where                              |
| ------------------- | ------------------- | ------------------------- | ---------------------------------- |
| `auth`              | `auth`              | `build-auth`              | Dashboard entry (auth gate)        |
| `credits`           | `credits-economy`   | `build-credits`           | Cross-cut (dashboard header)       |
| `onboarding`        | `onboarding`        | `build-onboarding`        | Onboarding steps 1–7               |
| `landscape-research`| `landscape-research`| `build-landscape-research`| Onboarding steps 4–5               |
| `deep-dive-qa`      | `deep-dive-qa`      | `build-deep-dive-qa`      | Dashboard — optional tier-jump activity (target state). Currently shipped as onboarding step 6. |
| `scope-curation`    | `scope-curation`    | `build-scope-curation`    | Onboarding step 7 (shipped). Relocation to dashboard is an open ambiguity. |
| `readiness`         | `readiness`         | `build-readiness`         | Cross-cut (dashboard + deep-dive)  |
| `plan-generation`   | `plan-generation`   | `build-plan-generation`   | Dashboard — Launch Plans section   |
| `channels`          | `channels`          | `build-channels`          | Dashboard — Channel Kits section   |
| `launch-run`        | `launch-run`        | `build-launch-run`        | Dashboard — Launch Run section     |
| `runner`            | `runner`            | `build-runner`            | Dashboard — Launch Run (infra)     |
| `dev-console`       | `dev-console`       | `build-dev-console`       | Dev overlay                        |
| `shell`             | `shell`             | `build-shell`             | Cross-cut (IntroScreen + Dashboard)|
| `profile`           | `profile`           | `build-profile`           | Cross-cut (dashboard sidebar)      |

**Note:** Feature ID `credits` maps to PRD folder `credits-economy`. All other IDs match their folder name.

---

## Launch Plan Types

| Term                | Definition                                                                                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Master Plan**     | The full, unabridged launch plan containing all milestones, tasks, and positioning. Generated once from profile + landscape data + Q&A insights. Not published to audiences directly. |
| **Overview Plan**   | A condensed version of the master. The near-term milestones in full detail, later milestones summarized. Used when no segment variant exists for an audience segment.       |
| **Segment Plan**    | A master plan modified with segment-specific diffs: reordered milestones, rewritten positioning, adjusted messaging. One per audience segment. Costs credits to generate.   |
| **Plan Diff**       | The delta between a master plan and a segment variant. Includes: positioning replacement, milestone reorder, message rewrites/removals, section reorder, top-priority emphasis. |

---

## Launch Landscape Intelligence

| Term                         | Definition                                                                                                                                                                                                                                                              |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Landscape Analysis**       | The final structured output of the two-phase landscape pipeline. Contains: positioning keywords, channel-cost ranges, audience segments, mining questions, opportunity recommendations, exclusion tags, proof visibility.                                              |
| **Landscape Prep Report**    | The intermediate intelligence report from phase 1 (LANDSCAPE_PREP prompt). Raw landscape signals transformed into structured segments, channel intelligence, intermediary-channel detection, and demand signals.                                                       |
| **Audience Segment** (SegmentType) | A distinct audience grouping discovered in landscape data. Defined by: name, description, why it fits, channel-cost range, demand volume, match strength, research terms. NOT just a demographic — includes the buying context (e.g., "Indie Hackers — Product Hunt Launch Audience"). |
| **Opportunity Recommendation** | A non-obvious pivot segment or channel suggested by landscape analysis. 1–3 per analysis, with strong rationale for why the founder should consider it.                                                                                                              |
| **Mining Questions**         | 5–8 questions generated by landscape analysis to surface information not already in the idea brief. Consumed by the Deep-Dive QA dashboard activity (target state) — currently consumed by onboarding Step 6 in shipped code.                                            |

---

## Scoring & Economy

| Term                      | Definition                                                                                                                                                       |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Credits**               | The credit currency. Founders start with 150 free credits. Used to pay for premium operations (segment plans, channel-kit rewrites, landscape re-runs).          |
| **Launch-Readiness Score** | A flat-point score (0–160+ base) representing how launch-ready the founder's plan and assets are. Brackets: Rough (0-40), Forming (41-80), Strong (81-120), Launch-Ready (121-160), OVERKILL (161+). |
| **Readiness Meter**       | The arc-shaped visual component displaying the launch-readiness score. Compact (in CreditBar) and full-size variants. Glows at higher brackets.                    |
| **CreditBar**             | The persistent header bar visible on the dashboard for authenticated users. Shows readiness meter + credit balance + purchase CTA.                                 |
| **Auth Gate**             | The authentication prompt shown when the user first enters the dashboard after completing onboarding. Required to access credit-gated features.                    |
| **Free Tier**             | 150 credits granted on account creation. Enough for: landscape analysis (free first run) + 2 segment plans (100) + some buffer.                                  |
| **Bulk Pricing**          | Discounted per-segment credit cost for segment plans: 1–3 segments @ 50 each, 4–6 @ 35, 7+ @ 25.                                                                  |

---

## Credit Costs

| Operation                   | Cost | Code Key (`credits.ts`)        | Notes                               |
| --------------------------- | ---- | ------------------------------ | ----------------------------------- |
| Landscape analysis (first run) | Free | `LANDSCAPE` / `landscapeFirst` | Subsequent re-runs: 50 credits      |
| Landscape re-run            | 50   | `rerunLandscape` / `LANDSCAPE_PREP`  | After first free run          |
| Segment plan                | 50   | `SEGMENT` / `segmentPlan`      | Per segment (bulk discounts apply)  |
| Channel-kit rewrite         | 75   | `CHANNELS` / `channelRewrite`  | Full channel kit + follow-up templates |
| Launch run session          | 0    | `RUN` / `launchRun`            | Free                                |

---

## Credit Packs

| Pack    | Credits | Price  | Note         |
| ------- | ------- | ------ | ------------ |
| Starter | 100     | $4.99  | —            |
| Pro     | 300     | $12.99 | "Popular"    |
| Scale   | 750     | $24.99 | "Best Value" |

---

## Data & Pipeline

| Term                   | Definition                                                                                                                                                                                                                          |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SessionData**        | The central state object containing all founder data across all 10 steps. Persisted in encrypted localStorage and optionally synced to server.                                                                                      |
| **Launch Research adapter (LR)** | The research provider that gathers public launch signals from founder-approved sources. Provides audience, channel, and competitor signals via trigger → poll → snapshot flow.                                            |
| **Two-Phase Pipeline** | The landscape analysis flow: LANDSCAPE_PREP (raw signals → intelligence report) → LANDSCAPE (report → final analysis). Fallback: skip LANDSCAPE_PREP if it fails.                                                                  |
| **Pipeline Trace**     | In-memory log of data flow stages. Prefix: `[PIPELINE]`. Stages: USER_INPUT → QUERY_GEN → LR_TRIGGER → LR_POLL → LR_RESULTS → LANDSCAPE_PREP_INPUT → LANDSCAPE_PREP_OUTPUT → LANDSCAPE_INPUT → LANDSCAPE_OUTPUT → PLAN_INPUT → PLAN_OUTPUT. |
| **Invalidation Map**   | Rules for which downstream data must be cleared when a user edits an earlier step. E.g., editing step 1 (idea brief) clears everything from profile through runData.                                                                |

---

## UI Components

| Term              | Definition                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------- |
| **Dashboard**     | Post-onboarding command center. Sidebar navigation + four sections (Command Console, Launch Plans, Channel Kits, Launch Run). |
| **GlazeToast**    | Celebration toast shown when the launch-readiness score crosses a bracket threshold (Forming, Strong, Launch-Ready, OVERKILL). |
| **ConfettiBurst** | Particle animation shown on major celebrations (onboarding completion, score bracket transitions).       |
| **HubScreen**     | Overlay component shown to returning users with session data. Displays session summary and launch-plan options. |
| **AuthGate**      | Auth prompt modal shown on first dashboard entry for unauthenticated users. Replaces old "SoftGate".    |
| **Btn**           | Shared button component. Variants: primary, ghost, outline, danger.                                     |
| **Card**          | Shared container component with border, shadow, and radius.                                             |

---

## Authentication

| Term           | Definition                                                                                                                    |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Auth Gate**  | Auth prompt shown at dashboard entry after completing onboarding. Credit-consuming dashboard features require authentication. |
| **JWT**        | JSON Web Token used for server-side session verification. Cookie-based.                                                       |
| **Auth Modal** | The sign-in/sign-up overlay. Supports OAuth flows.                                                                            |

---

## Developer Tools

| Term                | Definition                                                                                         |
| ------------------- | -------------------------------------------------------------------------------------------------- |
| **Dev Console**     | Dev tools hub accessible via `/?devconsole`. Protected by env var. Env-gated dev overlay.          |
| **Dummy Plug**      | Test data system. Allows fast-forwarding to any step with synthetic data via `/?dummyplug&step=N`. |
| **QA Suite**        | Automated test runner within Dev Console. Server + client tests.                                   |
| **Warp Profiles**   | Saved test data snapshots for Dummy Plug. Named, saveable, loadable.                               |

---

## Launch Console

| Term                  | Definition                                                                                                                                                 |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AcmeLaunch Runner** | The companion runner that drives a guided launch run. Reads the launch action queue, executes launch tasks, and pauses for founder review before any public action. |
| **Launch Console**    | The in-app operational surface for the launch run: the launch action queue, outcome reporting, and the assembled run prompts. Endpoints under `/launch-console`. |
| **Launch Run**        | The execution flow: read the launch action queue → triage against launch rules → prepare each action → pause for founder review. Never publishes without approval. |
| **Launch Rules**      | Do / skip signal lists generated by the RUN prompt. Used by the runner and Claude to decide which launch actions to publish, send, or hold.                |
| **Run Prompt**        | A code-assembled markdown prompt (not AI-generated) containing all founder data, launch rules, and instructions. Used by the AcmeLaunch Runner.            |

---

## Security

| Term                         | Definition                                                                                                      |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Rate Limiting**            | Per-IP (20/min Claude, 10/min research), global (60/min Claude), daily budget caps. Powered by Upstash Redis.   |
| **Prompt Injection Defense** | External research data wrapped in `<untrusted_research_data>` tags with nonce to prevent injection attacks.      |
| **Session Nonce**            | UUID generated once per page load, sent as `X-Session-Nonce` header on every API call. Prevents replay attacks. |
| **Encrypted localStorage**   | AES-GCM encryption via Web Crypto API. PBKDF2 key derivation with 100K iterations and device fingerprint.       |
