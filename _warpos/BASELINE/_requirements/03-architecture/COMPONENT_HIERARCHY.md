# Jobzooka — Component Hierarchy

<!-- SPEC-AHEAD-OF-CODE: Target state relocates MiningAccordion (deep-dive) from OnboardingPage to the Dashboard as a tier-jump activity. Onboarding shrinks from 7 steps to 5 steps (deep-dive removed; skills placement retained pending follow-up). Shipped code still hosts deep-dive as onboarding Step 6. Both mappings are shown below. -->

---

## Step-to-Component Mapping

Canonical mapping from onboarding step number to actual component filename. Component filenames carry legacy numbering from refactoring — this table is the single source of truth.

### Onboarding Steps (Target State: 1–5; Shipped: 1–7)

| Step # | Component File | Screen | Status |
|---|---|---|---|
| 1 | Step1Resume.tsx (IntroScreen) | OnboardingPage | Both |
| 2 | Step3Preferences.tsx | OnboardingPage | Both |
| 3 | Step4Profile.tsx | OnboardingPage | Both |
| 4 | StepCollect.tsx | AimPage (hosted within OnboardingPage routing) | Both |
| 5 | Step6Analysis.tsx | AimPage (hosted within OnboardingPage routing) | Both |
| ~~6~~ | ~~(inline MiningAccordion)~~ | Moved to Dashboard (target) | Shipped only |
| 7 | Step8Skills.tsx | OnboardingPage | Shipped; target placement TBD |

### Dashboard Sections & Activities (post-onboarding)

| Section / Activity | Component File | Notes |
|---|---|---|
| Command Console | Dashboard.tsx | Competitiveness meter + quick actions; surfaces "next unlock" hints |
| Deep-Dive Q&A (activity) | MiningAccordion (re-hosted from OnboardingPage) | Target state: optional tier-jump launched from Dashboard. Not present in shipped dashboard. |
| Resumes | Step10Resumes.tsx | Hosted in Dashboard Resumes section |
| LinkedIn | Step11LinkedIn.tsx + Step12Download.tsx | Hosted in Dashboard LinkedIn section |
| Auto-Apply | Step13Apply.tsx | Hosted in Dashboard Auto-Apply section |

---

## Architecture Layers

**CRITICAL: `<DeusMechanicus>` MUST be the outermost wrapper in the component tree. Do NOT refactor it into a sibling — it is a React context provider that any child can call via `useDM()`.**

```
App Shell (page.tsx)
  └── DeusMechanicus (context provider — MUST be outermost)
       └── ToastProvider (notification context)
            ├── Overlays (modals, gates, celebrations)
            │   ├── AuthModal
            │   ├── AuthGate (replaces SoftGate — shown at dashboard entry)
            │   ├── RocketStore
            │   ├── ProfilePage
            │   ├── HubScreen
            │   ├── OnboardingCelebration
            │   └── ConfettiBurst
            │
            ├── Persistent UI
            │   ├── Header (logo, auth, progress pill)
            │   ├── RocketBar (dashboard, authenticated)
            │   └── KeyboardNav (backspace, "?" shortcuts)
            │
            └── Screen Router (by step)
                 ├── No session: IntroScreen
                 ├── Onboarding steps 1–3: OnboardingPage
                 ├── Onboarding steps 4–5: AimPage (within OnboardingPage routing)
                 ├── Onboarding step 7 (shipped — Skills): OnboardingPage (Step8Skills)
                 │   // Shipped also routes step 6 here via MiningAccordion — removed in target state
                 └── Post-onboarding: Dashboard
                      ├── Command Console
                      ├── Deep-Dive Q&A activity (target state — MiningAccordion re-hosted)
                      ├── Resumes (Step10Resumes)
                      ├── LinkedIn (Step11LinkedIn + Step12Download)
                      └── Auto-Apply (Step13Apply)
```

---

## Page Composites

Page composites host multiple steps within a single page. They manage sub-step navigation and shared state.

| Component          | Steps | Contains                                                                                                                     |
| ------------------ | ----- | ---------------------------------------------------------------------------------------------------------------------------- |
| **OnboardingPage** | 1–5 (target) / 1–7 (shipped)   | Step1Resume, Step3Preferences, Step4Profile, AimPage (4-5). Target state stops here. Shipped adds MiningAccordion (step 6 — relocated to Dashboard in target) and Step8Skills (step 7). Sub-steps for step 2: direction, worktype, comp, location, quickcheck, dealbreakers |
| **AimPage**        | 4–5   | StepCollect (query generation + BD trigger), Step6Analysis (market intelligence). 3-substep architecture. |
| **Dashboard**      | —     | Command Console, Step10Resumes, Step11LinkedIn + Step12Download, Step13Apply                                |

**Note**: `ReadyPage.tsx` is deleted. `AimPage.tsx` still has its legacy name ("Aim" despite hosting market research steps).

---

## Step Components

Individual step implementations within page composites.

| Component            | Onboarding Step | Dashboard Section | Purpose                                                                                 |
| -------------------- | --------------- | ----------------- | --------------------------------------------------------------------------------------- |
| **Step1Resume**      | 1               | —                 | Resume upload (drag-drop, file, paste), parsing, personal info, education, demographics |
| **Step3Preferences** | 2               | —                 | Career direction, location, employment types, compensation, deal breakers               |
| **Step4Profile**     | 3               | —                 | AI-generated profile review: discipline, seniority, skills, gaps, differentiators       |
| **StepCollect**      | 4               | —                 | Search query generation, avoid terms, BD scraper trigger                                |
| **Step6Analysis**    | 5               | —                 | Two-phase market analysis display, category discovery, comp ranges                      |
| **MiningAccordion**  | 6 (shipped)     | Deep-Dive Q&A activity (target state) | Deep-dive Q&A accordion. Shipped: inline in OnboardingPage as step 6. Target: re-hosted as an opt-in Dashboard tier-jump activity. |
| **Step8Skills**      | 7               | —                 | Skill curation with include/exclude toggles, category grouping                          |
| **Step10Resumes**    | —               | Resumes           | Master/general/targeted resume generation, DOCX download, diff view                     |
| **Step11LinkedIn**   | —               | LinkedIn          | LinkedIn profile content, form answers, copy buttons                                    |
| **Step12Download**   | —               | LinkedIn          | Bulk download hub (ZIP + TXT) — thin pass-through                                       |
| **Step13Apply**      | —               | Auto-Apply        | Extension launch, Chrome prompt, heuristics display                                     |

**Note**: Step component numbers don't match wizard step numbers (historical artifact from refactoring).

---

## Atomic UI Components (src/components/ui/)

| Component         | Purpose                      | Props                                                     |
| ----------------- | ---------------------------- | --------------------------------------------------------- |
| **Btn**           | Button with variants         | variant (primary/ghost/outline/danger), loading, disabled |
| **Card**          | Container with border/shadow | className, style                                          |
| **Inp**           | Text input / textarea        | label, value, onChange, error, rows, required             |
| **Sel**           | Select dropdown              | label, value, onChange, options, required                 |
| **Spin**          | Loading spinner (SVG)        | size                                                      |
| **TabBar**        | Tab navigation               | tabs, active, onChange                                    |
| **ProgressSteps** | Step progress indicator      | steps, active                                             |
| **MultiSelect**   | Multi-option button group    | label, options, selected, onChange                        |
| **CopyBtn**       | Copy to clipboard            | text, label                                               |
| **CharCount**     | Character counter            | text, limit                                               |
| **AutoBadge**     | AI-generated indicator       | source                                                    |
| **EduCard**       | Education entry editor       | entry, index, onChange, onRemove                          |
| **LocCombo**      | Location autocomplete        | label, value, onChange                                    |
| **Toast**         | Toast notification system    | Provider + useToast() hook                                |
| **ErrorBoundary** | Error fallback wrapper       | children, fallback, onReset                               |
| **PrivacyModal**  | Data export/import/privacy   | onClose                                                   |

---

## Feature Components

| Component                 | Purpose                                                         |
| ------------------------- | --------------------------------------------------------------- |
| **Dashboard**             | Post-onboarding command center with sidebar + four sections     |
| **RocketBar**             | Persistent header: competitiveness meter + rocket balance + CTA |
| **CompetitivenessMeter**  | Arc visualization of 0–160+ score (compact + full)              |
| **GlazeToast**            | Score bracket transition celebration toast                      |
| **ConfettiBurst**         | Particle celebration animation                                  |
| **IntroScreen**           | Landing page with resume upload CTA                             |
| **HubScreen**             | Mission Control — returning user dashboard overlay              |
| **OnboardingProgress**    | Step header with title/subtitle/progress bar                    |
| **OnboardingCelebration** | Post-onboarding celebration overlay                             |
| **ResumeDisplay**         | Resume preview renderer                                         |
| **AuthModal**             | Sign-in/sign-up overlay                                         |
| **AuthGate**              | Dashboard entry auth prompt (replaces SoftGate)                 |
| **RocketStore**           | Rocket pack purchase modal                                      |
| **ProfilePage**           | User profile viewer/editor                                      |
| **ProfileEditor**         | Profile field editor                                            |
| **KeyboardNav**           | Keyboard shortcut handler                                       |
| **DMBadge**               | Dev tools indicator badge                                       |

---

## Deus Mechanicus Modules (src/components/dm-modules/)

| Module                   | Purpose                              |
| ------------------------ | ------------------------------------ |
| **DummyPlugModule**      | Warp Profile CRUD, test data loading |
| **QAModule**             | Automated test suite runner          |
| **DataInspectorModule**  | Live session data field inspector    |
| **PipelineTracerModule** | Request timeline visualization       |
| **RocketsModule**        | Auth, rocket balance, Stripe debug   |
