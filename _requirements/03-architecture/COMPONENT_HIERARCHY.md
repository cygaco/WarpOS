# AcmeLaunch — Component Hierarchy

<!-- SPEC-AHEAD-OF-CODE: Target state relocates DeepDiveAccordion (deep-dive) from OnboardingPage to the Dashboard as a tier-jump activity. Onboarding shrinks from 7 steps to 5 steps (deep-dive removed; scope placement retained pending follow-up). Shipped code still hosts deep-dive as onboarding Step 6. Both mappings are shown below. -->

---

## Step-to-Component Mapping

Canonical mapping from onboarding step number to actual component filename. Component filenames carry legacy numbering from refactoring — this table is the single source of truth.

### Onboarding Steps (Target State: 1–5; Shipped: 1–7)

| Step # | Component File | Screen | Status |
|---|---|---|---|
| 1 | Step1Brief.tsx (IntroScreen) | OnboardingPage | Both |
| 2 | Step3Constraints.tsx | OnboardingPage | Both |
| 3 | Step4Profile.tsx | OnboardingPage | Both |
| 4 | StepCollect.tsx | PlanPage (hosted within OnboardingPage routing) | Both |
| 5 | Step6Analysis.tsx | PlanPage (hosted within OnboardingPage routing) | Both |
| ~~6~~ | ~~(inline DeepDiveAccordion)~~ | Moved to Dashboard (target) | Shipped only |
| 7 | Step8Scope.tsx | OnboardingPage | Shipped; target placement TBD |

### Dashboard Sections & Activities (post-onboarding)

| Section / Activity | Component File | Notes |
|---|---|---|
| Command Console | Dashboard.tsx | Launch-readiness meter + quick actions; surfaces "next unlock" hints |
| Deep-Dive Q&A (activity) | DeepDiveAccordion (re-hosted from OnboardingPage) | Target state: optional tier-jump launched from Dashboard. Not present in shipped dashboard. |
| Plans | Step10Plans.tsx | Hosted in Dashboard Plans section |
| Channels | Step11Channels.tsx + Step12Download.tsx | Hosted in Dashboard Channels section |
| Launch Run | Step13Run.tsx | Hosted in Dashboard Launch Run section |

---

## Architecture Layers

**CRITICAL: `<DevConsole>` MUST be the outermost wrapper in the component tree. Do NOT refactor it into a sibling — it is a React context provider that any child can call via `useDevConsole()`.**

```
App Shell (page.tsx)
  └── DevConsole (context provider — MUST be outermost)
       └── ToastProvider (notification context)
            ├── Overlays (modals, gates, celebrations)
            │   ├── AuthModal
            │   ├── AuthGate (replaces SoftGate — shown at dashboard entry)
            │   ├── CreditStore
            │   ├── ProfilePage
            │   ├── HubScreen
            │   ├── OnboardingCelebration
            │   └── ConfettiBurst
            │
            ├── Persistent UI
            │   ├── Header (logo, auth, progress pill)
            │   ├── CreditBar (dashboard, authenticated)
            │   └── KeyboardNav (backspace, "?" shortcuts)
            │
            └── Screen Router (by step)
                 ├── No session: IntroScreen
                 ├── Onboarding steps 1–3: OnboardingPage
                 ├── Onboarding steps 4–5: PlanPage (within OnboardingPage routing)
                 ├── Onboarding step 7 (shipped — Scope): OnboardingPage (Step8Scope)
                 │   // Shipped also routes step 6 here via DeepDiveAccordion — removed in target state
                 └── Post-onboarding: Dashboard
                      ├── Command Console
                      ├── Deep-Dive Q&A activity (target state — DeepDiveAccordion re-hosted)
                      ├── Plans (Step10Plans)
                      ├── Channels (Step11Channels + Step12Download)
                      └── Launch Run (Step13Run)
```

---

## Page Composites

Page composites host multiple steps within a single page. They manage sub-step navigation and shared state.

| Component          | Steps | Contains                                                                                                                     |
| ------------------ | ----- | ---------------------------------------------------------------------------------------------------------------------------- |
| **OnboardingPage** | 1–5 (target) / 1–7 (shipped)   | Step1Brief, Step3Constraints, Step4Profile, PlanPage (4-5). Target state stops here. Shipped adds DeepDiveAccordion (step 6 — relocated to Dashboard in target) and Step8Scope (step 7). Sub-steps for step 2: goal, budget, timeline, channels, geography, dealbreakers |
| **PlanPage**       | 4–5   | StepCollect (query generation + research trigger), Step6Analysis (landscape intelligence). 3-substep architecture. |
| **Dashboard**      | —     | Command Console, Step10Plans, Step11Channels + Step12Download, Step13Run                                            |

**Note**: `PrepPage.tsx` is deleted. `PlanPage.tsx` still has its legacy name ("Plan" despite hosting landscape research steps).

---

## Step Components

Individual step implementations within page composites.

| Component            | Onboarding Step | Dashboard Section | Purpose                                                                                 |
| -------------------- | --------------- | ----------------- | --------------------------------------------------------------------------------------- |
| **Step1Brief**       | 1               | —                 | Idea-brief upload (drag-drop, file, paste), parsing, founder info, background, context  |
| **Step3Constraints** | 2               | —                 | Launch goal, geography, channels, budget, deal breakers                                 |
| **Step4Profile**     | 3               | —                 | AI-generated profile review: positioning fit, readiness, audiences served, gaps, differentiators |
| **StepCollect**      | 4               | —                 | Research query generation, avoid terms, research-provider trigger                       |
| **Step6Analysis**    | 5               | —                 | Two-phase landscape analysis display, segment discovery, channel signals                |
| **DeepDiveAccordion**| 6 (shipped)     | Deep-Dive Q&A activity (target state) | Deep-dive Q&A accordion. Shipped: inline in OnboardingPage as step 6. Target: re-hosted as an opt-in Dashboard tier-jump activity. |
| **Step8Scope**       | 7               | —                 | Scope curation with include/exclude toggles, category grouping                          |
| **Step10Plans**      | —               | Plans             | Master/overview/segment plan generation, PDF download, diff view                        |
| **Step11Channels**   | —               | Channels          | Launch channel assets, follow-up answers, copy buttons                                  |
| **Step12Download**   | —               | Channels          | Bulk download hub (ZIP + TXT) — thin pass-through                                        |
| **Step13Run**        | —               | Launch Run        | Runner launch, Launch Console prompt, launch-rules display                              |

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
| **MilestoneCard** | Milestone entry editor       | entry, index, onChange, onRemove                          |
| **LocCombo**      | Location autocomplete        | label, value, onChange                                    |
| **Toast**         | Toast notification system    | Provider + useToast() hook                                |
| **ErrorBoundary** | Error fallback wrapper       | children, fallback, onReset                               |
| **PrivacyModal**  | Data export/import/privacy   | onClose                                                   |

---

## Feature Components

| Component                 | Purpose                                                         |
| ------------------------- | --------------------------------------------------------------- |
| **Dashboard**             | Post-onboarding command center with sidebar + four sections     |
| **CreditBar**             | Persistent header: launch-readiness meter + credit balance + CTA |
| **ReadinessMeter**        | Arc visualization of 0–160+ score (compact + full)              |
| **GlazeToast**            | Score bracket transition celebration toast                      |
| **ConfettiBurst**         | Particle celebration animation                                  |
| **IntroScreen**           | Landing page with idea-brief upload CTA                         |
| **HubScreen**             | Mission Control — returning founder dashboard overlay           |
| **OnboardingProgress**    | Step header with title/subtitle/progress bar                    |
| **OnboardingCelebration** | Post-onboarding celebration overlay                             |
| **BriefDisplay**          | Idea-brief preview renderer                                     |
| **AuthModal**             | Sign-in/sign-up overlay                                         |
| **AuthGate**              | Dashboard entry auth prompt (replaces SoftGate)                 |
| **CreditStore**           | Credit pack purchase modal                                      |
| **ProfilePage**           | Founder profile viewer/editor                                   |
| **ProfileEditor**         | Profile field editor                                            |
| **KeyboardNav**           | Keyboard shortcut handler                                       |
| **DevConsoleBadge**       | Dev tools indicator badge                                       |

---

## Dev Console Modules (src/components/devconsole-modules/)

| Module                   | Purpose                              |
| ------------------------ | ------------------------------------ |
| **DummyPlugModule**      | Launch Profile CRUD, test data loading |
| **QAModule**             | Automated test suite runner          |
| **DataInspectorModule**  | Live session data field inspector    |
| **PipelineTracerModule** | Request timeline visualization       |
| **CreditsModule**        | Auth, credit balance, Stripe debug   |
