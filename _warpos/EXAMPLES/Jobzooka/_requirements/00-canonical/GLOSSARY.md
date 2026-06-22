# Jobzooka — Glossary

Canonical terminology dictionary. Every product term used across all documentation is defined here. If a term is not listed, it is not a product term and should not be used without adding it here first.

---

## Product Identity

| Term         | Definition                                                                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Jobzooka** | The product. A job search assistant that transforms a resume into targeted resumes, LinkedIn content, form answers, and auto-apply capabilities. |
| **Onboarding phase** | (Target state) The required, no-skip sequence before the dashboard: resume upload, parse, preferences, profile, market research, category lock. Captures the profile inputs that unlock the dashboard. Spec-ahead-of-code: shipped code still includes Deep Dive + Skills inside onboarding. |
| **Dashboard phase** | (Target state) The dashboard itself + every optional activity users opt into after completing onboarding: Deep-Dive Q&A (tier-jump), Skills, Resumes, LinkedIn, Auto-Apply. Activities can be launched in any order based on the dashboard's "next unlock" guidance. |
| **Dashboard** | The post-onboarding command center. Hosts the competitiveness meter, optional tier-jump activities (including Deep-Dive Q&A), and the core sections: Command Console, Resumes, LinkedIn, Auto-Apply. |

---

## Onboarding Steps (Target State)

<!-- SOURCE OF TRUTH: _requirements/00-canonical/STEPS.json — the onboarding-steps table and any dashboard-activities table below must mirror the registry. Propagation is manual until /maps:steps regenerates these tables automatically. -->


<!-- SPEC-AHEAD-OF-CODE: The target state moves Deep Dive out of onboarding into a dashboard activity. The table below reflects the target onboarding phase. Shipped code currently hosts 7 onboarding steps (including Deep Dive as Step 6 and Skills as Step 7). See the "Dashboard Activities" table below for the relocated/post-dashboard activities. -->

The target-state onboarding is 5 steps (resume → preferences → profile → search → market analysis). After the last onboarding step, the user enters the dashboard with a baseline competitiveness score.

**Runtime constants note:** `src/lib/constants.ts` still defines the shipped router as `ONBOARDING_TOTAL = 7` with `Upload`, `Preferences`, `Profile`, `Search`, `Analysis`, `Deep Dive`, and `Skills`. The tables below describe the target-state registry from `_requirements/00-canonical/STEPS.json`; do not use them to infer the current shipped step count until the next skeleton rebuild lands the phase move.

<!-- maps:steps:START (region=glossary-onboarding) --- auto-generated from _requirements/00-canonical/STEPS.json; do not edit manually. Regenerate: /maps:steps or node scripts/generate-steps-maps.js -->

| Position | Step ID | Component | File |
| -------- | ------- | --------- | ---- |
| 1 | UPLOAD | Step1Resume | src/components/steps/Step1Resume.tsx |
| 2 | PREFERENCES | Step3Preferences | src/components/steps/Step3Preferences.tsx |
| 3 | PROFILE | Step4Profile | src/components/steps/Step4Profile.tsx |
| 4 | SEARCH | StepCollect | src/components/steps/StepCollect.tsx |
| 5 | MARKET_ANALYSIS | Step6Analysis | src/components/steps/Step6Analysis.tsx |

<!-- maps:steps:END (region=glossary-onboarding) -->

Component filenames carry legacy numbering that does NOT match logical step numbers. See **Naming Debt** below.

### Dashboard Activities (relocated / post-dashboard)

<!-- maps:steps:START (region=glossary-dashboard) --- auto-generated from _requirements/00-canonical/STEPS.json; do not edit manually. Regenerate: /maps:steps or node scripts/generate-steps-maps.js -->

| Activity | Component | File | Feature |
| -------- | --------- | ---- | ------- |
| DEEP_DIVE | DeepDiveQA | src/components/DeepDiveQA.tsx | deep-dive-qa |
| SKILLS | Step8Skills | src/components/steps/Step8Skills.tsx | skills-curation |
| RESUMES | Step10Resumes | src/components/steps/Step10Resumes.tsx | resume-generation |
| LINKEDIN | Step11LinkedIn | src/components/steps/Step11LinkedIn.tsx | linkedin |
| AUTO_APPLY | Step13Apply | src/components/steps/Step13Apply.tsx | auto-apply |

<!-- maps:steps:END (region=glossary-dashboard) -->

**Spec-ahead-of-code:** Deep Dive's placement is the only phase move confirmed by the current spec revision. Skills' position (still-in-onboarding vs. relocated-to-dashboard) is marked as an open ambiguity — see "Outstanding Ambiguities" in the skeleton-build plan.

---

## Dashboard Sections

Post-onboarding. All sections are accessible from the dashboard sidebar.

| Section              | What it hosts                                        | Auth required |
| -------------------- | ---------------------------------------------------- | ------------- |
| **Command Console**  | Competitiveness meter, score breakdown, quick-launch | Yes (auth gate on entry) |
| **Resumes**          | Master/general/targeted resume generation + download | Yes           |
| **LinkedIn**         | LinkedIn profile content + form answers              | Yes           |
| **Auto-Apply**       | Extension setup, heuristic generation, launch        | Yes           |

---

## Screens

Composite page components that host multiple steps.

| Term               | Steps | Component File       | Hosts                                   |
| ------------------ | ----- | -------------------- | --------------------------------------- |
| **OnboardingPage** | 1–7   | `OnboardingPage.tsx` | Resume upload, preferences, profile, market research, deep-dive, skills |
| **AimPage**        | 4–5   | `AimPage.tsx`        | Search queries + market analysis (3-substep: scrape → analysis → categories) |
| **Dashboard**      | —     | `Dashboard.tsx`      | Command Console, Resumes, LinkedIn, Auto-Apply |
| **Step13Apply**    | —     | `Step13Apply.tsx`    | Auto-apply launch (hosted in Dashboard Auto-Apply section) |

See **Naming Debt** section below for why component names don't match structure.

---

## Recon Sweep — Key Terminology

Onboarding steps 4-5 use military-themed naming. These terms have specific meanings:

| Term | Scope | What It Means |
|------|-------|---------------|
| **Recon Mission** | Screen name | The entire AimPage experience (onboarding steps 4-5). User-facing heading for the search/scrape screen. |
| **Recon Sweep** | Execution phase | Everything that happens after "Launch Recon": BD scrape → MARKET_PREP → MARKET analysis → CTA. One continuous loading sequence, no user interaction. |
| **Launch Recon** | CTA button | Triggers the recon sweep. User sees scrape phases then analysis phases on the same screen. |
| **Analysis** | API calls only | Specifically the MARKET_PREP + MARKET Claude API calls. A subset of the recon sweep. |
| **Analysis Complete** | CTA bridge | The "targets acquired" message + "View Your Targets" button that appears after the recon sweep finishes. |
| **Lock Your Targets** | Screen name | The category selection screen (onboarding step 5, AimPage substep 2). User toggles categories on/off, then locks. |
| **Lock Categories** | CTA button | Confirms category selection and advances to Deep Dive QA (onboarding step 6). Writes `rankedCategories`. |

**Why this matters:** "Analysis" is ambiguous. When the user says "analysis," they usually mean the whole recon sweep. When specs say "analysis," they mean the MARKET API calls. Use "recon sweep" for the full execution and "analysis" for the API calls specifically.

---

## Naming Debt

Known inversions — do NOT rename files, fix references to match reality.

| Debt                       | Details                                                                                                                                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Legacy step numbers**    | Component filenames don't match logical steps (e.g., `Step3Preferences.tsx` = step 2, `Step13Apply.tsx` = auto-apply). The numbering reflects an earlier step sequence that was consolidated. |
| **AimPage name**           | `AimPage.tsx` hosts onboarding steps 4-5 (market research). The name was assigned before the current architecture existed.                                                                 |
| **ReadyPage target-state debt** | `ReadyPage.tsx` still exists as the shipped Step 6 router host. Target-state specs move Deep-Dive Q&A to the dashboard and should delete or retire this page in the next skeleton rebuild. |
| **getScreen() routing**    | `getScreen()` in `constants.ts` returns `"onboarding"` for steps 1-7 and `"dashboard"` for post-onboarding. The old `"ready"` / `"aim"` / `"fire"` values are removed.                    |

---

## Build Phases

(from `.claude/manifest.json` build.phases, agent execution order):

| Phase | Name                  | Features                                                                         |
| ----- | --------------------- | -------------------------------------------------------------------------------- |
| 0     | Foundation            | types, constants, storage, validators, pipeline, api, utils, prompts, ui, layout |
| 1     | Auth + Rockets        | auth, rockets                                                                    |
| 2     | Onboarding            | onboarding (steps 1-7)                                                           |
| 3     | Market Research       | market-research (steps 4-5 within onboarding)                                    |
| 4     | Deep Dive + Skills + Scoring | deep-dive-qa, skills-curation, competitiveness                            |
| 5     | Content Generation    | resume-generation, linkedin                                                      |
| 6     | Auto-Apply            | auto-apply, extension                                                            |
| 7     | Dev Tools             | deus-mechanicus                                                                  |

---

## Feature IDs

Kebab-case identifiers used in `store.json`, task manifest, and PRD folder names.

| Feature ID          | PRD Folder          | Task ID                   | Where                              |
| ------------------- | ------------------- | ------------------------- | ---------------------------------- |
| `auth`              | `auth`              | `build-auth`              | Dashboard entry (auth gate)        |
| `rockets`           | `rockets-economy`   | `build-rockets`           | Cross-cut (dashboard header)       |
| `onboarding`        | `onboarding`        | `build-onboarding`        | Onboarding steps 1–7               |
| `market-research`   | `market-research`   | `build-market-research`   | Onboarding steps 4–5               |
| `deep-dive-qa`      | `deep-dive-qa`      | `build-deep-dive-qa`      | Dashboard — optional tier-jump activity (target state). Currently shipped as onboarding step 6. |
| `skills-curation`   | `skills-curation`   | `build-skills-curation`   | Onboarding step 7 (shipped). Relocation to dashboard is an open ambiguity. |
| `competitiveness`   | `competitiveness`   | `build-competitiveness`   | Cross-cut (dashboard + deep-dive)  |
| `resume-generation` | `resume-generation` | `build-resume-generation` | Dashboard — Resumes section        |
| `linkedin`          | `linkedin`          | `build-linkedin`          | Dashboard — LinkedIn section       |
| `auto-apply`        | `auto-apply`        | `build-auto-apply`        | Dashboard — Auto-Apply section     |
| `extension`         | `extension`         | `build-extension`         | Dashboard — Auto-Apply (infra)     |
| `deus-mechanicus`   | `deus-mechanicus`   | `build-deus-mechanicus`   | Dev overlay                        |
| `shell`             | `shell`             | `build-shell`             | Cross-cut (IntroScreen + Dashboard)|
| `profile`           | `profile`           | `build-profile`           | Cross-cut (dashboard sidebar)      |

**Note:** Feature ID `rockets` maps to PRD folder `rockets-economy`. All other IDs match their folder name.

---

## Resume Types

| Term                | Definition                                                                                                                                                                  |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Master Resume**   | The full, unabridged resume containing all roles, skills, and education. Generated once from profile + market data + Q&A insights. Not sent to employers directly.          |
| **General Resume**  | A condensed ~2-page version of the master. Recent 2–3 roles in full detail, older roles summarized. Used when no targeted variant exists for a category.                    |
| **Targeted Resume** | A master resume modified with category-specific diffs: reordered skills, rewritten bullets, adjusted summary. One per job category. Costs rockets to generate.              |
| **Resume Diff**     | The delta between a master resume and a targeted variant. Includes: summary replacement, competency reorder, bullet rewrites/removals, section reorder, top-third keywords. |

---

## Market Intelligence

| Term                         | Definition                                                                                                                                                                                                                                                              |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Market Analysis**          | The final structured output of the two-phase market pipeline. Contains: keywords, compensation ranges, job categories, mining questions, discovery recommendations, exclusion tags, education visibility.                                                               |
| **Market Prep Report**       | The intermediate intelligence report from phase 1 (MARKET_PREP prompt). Raw job data transformed into structured categories, comp intelligence, staffing agency detection, and market signals.                                                                          |
| **Job Category** (JobType)   | A distinct employment arrangement discovered in market data. Defined by: name, description, why it fits, comp range, volume, match strength, search terms. NOT just a domain — includes the employment arrangement (e.g., "Contract AI PM — Staffing Agency Pipeline"). |
| **Discovery Recommendation** | A non-obvious pivot category suggested by market analysis. 1–3 per analysis, with strong rationale for why the candidate should consider it.                                                                                                                            |
| **Mining Questions**         | 5–8 questions generated by market analysis to surface information not already on the resume. Consumed by the Deep-Dive QA dashboard activity (target state) — currently consumed by onboarding Step 6 in shipped code.                                                   |

---

## Scoring & Economy

| Term                      | Definition                                                                                                                                                       |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Rockets**               | The credit currency. Users start with 150 free rockets. Used to pay for premium operations (targeted resumes, LinkedIn rewrites, market re-runs).                |
| **Competitiveness Score** | A flat-point score (0–160+ base) representing how competitive the user's application materials are. Brackets: Rookie (0-40), Contender (41-80), Strong (81-120), Elite (121-160), OVERKILL (161+). |
| **Competitiveness Meter** | The arc-shaped visual component displaying the competitiveness score. Compact (in RocketBar) and full-size variants. Glows at higher brackets.                     |
| **RocketBar**             | The persistent header bar visible on the dashboard for authenticated users. Shows competitiveness meter + rocket balance + purchase CTA.                           |
| **Auth Gate**             | The authentication prompt shown when the user first enters the dashboard after completing onboarding. Required to access rocket-gated features.                    |
| **Free Tier**             | 150 rockets granted on account creation. Enough for: market analysis (free first run) + 2 targeted resumes (100) + some buffer.                                  |
| **Bulk Pricing**          | Discounted per-category rocket cost for targeted resumes: 1–3 categories @ 50 each, 4–6 @ 35, 7+ @ 25.                                                            |

---

## Rocket Costs

| Operation                   | Cost | Code Key (`rockets.ts`)        | Notes                               |
| --------------------------- | ---- | ------------------------------ | ----------------------------------- |
| Market analysis (first run) | Free | `MARKET` / `marketFirst`       | Subsequent re-runs: 50 rockets      |
| Market re-run               | 50   | `rerunMarket` / `MARKET_PREP`  | After first free run                |
| Targeted resume             | 50   | `TARGETED` / `targetedResume`  | Per category (bulk discounts apply) |
| LinkedIn rewrite            | 75   | `LINKEDIN` / `linkedinRewrite` | Full profile + form answers         |
| Auto-apply session          | 0    | `APPLY` / `autoApply`          | Free                                |

---

## Rocket Packs

| Pack    | Rockets | Price  | Note         |
| ------- | ------- | ------ | ------------ |
| Scout   | 100     | $4.99  | —            |
| Strike  | 300     | $12.99 | "Popular"    |
| Arsenal | 750     | $24.99 | "Best Value" |

---

## Data & Pipeline

| Term                   | Definition                                                                                                                                                                                                                          |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SessionData**        | The central state object containing all user data across all 10 steps. Persisted in encrypted localStorage and optionally synced to server.                                                                                         |
| **Bright Data (BD)**   | Third-party LinkedIn Jobs Scraper API. Dataset: `gd_lpfll7v5hcqtkxl6l`. Provides job listings via trigger → poll → snapshot flow.                                                                                                   |
| **Two-Phase Pipeline** | The market analysis flow: MARKET_PREP (raw jobs → intelligence report) → MARKET (report → final analysis). Fallback: skip MARKET_PREP if it fails.                                                                                  |
| **Pipeline Trace**     | In-memory log of data flow stages. Prefix: `[PIPELINE]`. Stages: USER_INPUT → QUERY_GEN → BD_TRIGGER → BD_POLL → BD_RESULTS → MARKET_PREP_INPUT → MARKET_PREP_OUTPUT → MARKET_INPUT → MARKET_OUTPUT → RESUME_INPUT → RESUME_OUTPUT. |
| **Invalidation Map**   | Rules for which downstream data must be cleared when a user edits an earlier step. E.g., editing step 1 (resume) clears everything from profile through applyData.                                                                  |

---

## UI Components

| Term              | Definition                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------- |
| **Dashboard**     | Post-onboarding command center. Sidebar navigation + four sections (Command Console, Resumes, LinkedIn, Auto-Apply). |
| **GlazeToast**    | Celebration toast shown when competitiveness score crosses a bracket threshold (Contender, Strong, Elite, OVERKILL). |
| **ConfettiBurst** | Particle animation shown on major celebrations (onboarding completion, score bracket transitions).       |
| **HubScreen**     | Overlay component shown to returning users with session data. Displays session summary and resume options. |
| **AuthGate**      | Auth prompt modal shown on first dashboard entry for unauthenticated users. Replaces old "SoftGate".    |
| **Btn**           | Shared button component. Variants: primary, ghost, outline, danger.                                     |
| **Card**          | Shared container component with border, shadow, and radius.                                             |

---

## Authentication

| Term           | Definition                                                                                                                    |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Auth Gate**  | Auth prompt shown at dashboard entry after completing onboarding. Rocket-consuming dashboard features require authentication. |
| **JWT**        | JSON Web Token used for server-side session verification. Cookie-based.                                                       |
| **Auth Modal** | The sign-in/sign-up overlay. Supports OAuth flows.                                                                            |

---

## Developer Tools

| Term                | Definition                                                                                         |
| ------------------- | -------------------------------------------------------------------------------------------------- |
| **Deus Mechanicus** | Dev tools hub accessible via `/?deusmechanicus`. Protected by env var. Warhammer 40K themed.       |
| **Dummy Plug**      | Test data system. Allows fast-forwarding to any step with synthetic data via `/?dummyplug&step=N`. |
| **QA Suite**        | Automated test runner within Deus Mechanicus. Server + client tests.                               |
| **Warp Profiles**   | Saved test data snapshots for Dummy Plug. Named, saveable, loadable.                               |

---

## Chrome Extension

| Term                  | Definition                                                                                                                                                 |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Jobzooka Launcher** | The Chrome extension (Manifest V3) that automates LinkedIn Easy Apply. Located in `extension/` directory.                                                  |
| **Auto-Apply**        | The automation flow: scan job listings → triage against heuristics → fill forms → pause for user review. Never auto-submits without approval.              |
| **Heuristics**        | Apply-if / skip-if signal lists generated by the APPLY prompt. Used by the extension and Claude for Chrome to decide which jobs to apply to.               |
| **Chrome Prompt**     | A code-assembled markdown prompt (not AI-generated) containing all user data, heuristics, and instructions. Used with Claude for Chrome browser extension. |

---

## Security

| Term                         | Definition                                                                                                      |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Rate Limiting**            | Per-IP (20/min Claude, 10/min BD), global (60/min Claude), daily budget caps. Powered by Upstash Redis.         |
| **Prompt Injection Defense** | External job data wrapped in `<untrusted_job_data>` tags with nonce to prevent injection attacks.               |
| **Session Nonce**            | UUID generated once per page load, sent as `X-Session-Nonce` header on every API call. Prevents replay attacks. |
| **Encrypted localStorage**   | AES-GCM encryption via Web Crypto API. PBKDF2 key derivation with 100K iterations and device fingerprint.       |
