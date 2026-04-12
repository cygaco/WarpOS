# File Ownership Table

Every file in the codebase has exactly one owner. You may ONLY modify files owned by your assigned feature. All other files are read-only. If you need a change to a foundation file, flag it in the store as a `foundation-update` request.

---

## Foundation (read-only for all feature agents)

These files are shared infrastructure. No feature agent may modify them.

```
src/lib/types.ts            — all TypeScript interfaces
src/lib/api.ts              — callClaude(), fetchJobs(), retry logic
src/lib/storage.ts          — encrypted persistence (AES-GCM + server sync)
src/lib/constants.ts        — PHASE_DISPLAY, STEP_REQUIRES, getScreen()
src/lib/pipeline.ts         — pipeline tracer ([PIPELINE] prefix)
src/lib/validators.ts       — input sanitization, ATS sanitization
src/lib/utils.ts            — shared data processing helpers
src/lib/prompts.ts          — all Claude prompt templates (server-only)
src/app/page.tsx            — main wizard orchestrator
src/app/layout.tsx          — root layout
src/app/globals.css         — global styles, CSS custom properties
src/app/not-found.tsx       — 404 page
CLAUDE.md                   — project instructions
AGENTS.md                   — agent instructions
docs/04-architecture/DATA-CONTRACTS.md — wiring rules for field-to-consumer connections
docs/04-architecture/AGENT_GUIDE.md   — builder read-order quick reference
docs/03-requirement-standards/INPUTS_TEMPLATE.md — control type decision framework
docs/DECISIONS.md            — decision log (spec change rationale)
docs/05-features/*/INPUTS.md — input field specs (one per feature, read-only for all agents)
tsconfig.json               — TypeScript config
next.config.ts              — Next.js config + security headers
package.json                — dependencies
playwright.config.ts        — test config
postcss.config.mjs          — PostCSS config
.gitignore                  — git exclusions
```

---

## Feature Ownership

> **Note:** Component filenames carry legacy step-numbering (e.g., `Step3Preferences.tsx` is logical step 2). This doc lists actual filenames. See `docs/00-canonical/GLOSSARY.md` → Steps section for the full mapping.

### Auth

```
src/lib/auth.ts                                    — JWT, password hashing, session management
src/lib/auth-oauth.ts                              — OAuth provider helpers (Google, LinkedIn)
src/lib/csrf.ts                                    — CSRF origin validation (validateOrigin())
src/app/api/auth/login/route.ts                    — email/password login
src/app/api/auth/register/route.ts                 — registration
src/app/api/auth/logout/route.ts                   — logout
src/app/api/auth/me/route.ts                       — current user check
src/app/api/auth/oauth/google/route.ts             — Google OAuth initiator
src/app/api/auth/oauth/google/callback/route.ts    — Google OAuth callback
src/app/api/auth/oauth/linkedin/route.ts           — LinkedIn OAuth initiator
src/app/api/auth/oauth/linkedin/callback/route.ts  — LinkedIn OAuth callback
src/app/api/session/route.ts                       — server-side session CRUD
```

### Auto-Apply

```
src/components/steps/Step13Apply.tsx     — auto-apply UI (resume selection, tabs, stats, fire log)
src/lib/apply-template.ts               — buildApplyPrompt() chrome prompt assembler
src/app/api/extension/route.ts          — ZIP builder serving extension files
```

### Competitiveness

```
src/lib/competitiveness.ts              — 0-100 scoring algorithm, weighted factors
src/components/CompetitivenessMeter.tsx  — circular progress meter UI
src/components/ConfettiBurst.tsx         — celebration animation
```

### Deep-Dive QA

```
(inline in ReadyPage.tsx — MiningAccordion component)
```

Note: Mining Q&A logic is inline in ReadyPage.tsx. The deep-dive-qa builder owns the mining question/answer rendering within ReadyPage, following the shared-foundation rules (see Composite Pages section below — ReadyPage shared-foundation rule). Builders may add `import` statements and `{step === N && <Component />}` render blocks only; do not modify existing logic, layout, or state management.

### Deus Mechanicus

```
src/components/DeusMechanicus.tsx                   — dev tools hub shell (outermost app wrapper)
src/lib/deus-mechanicus.ts                          — product-agnostic manifest interfaces
src/lib/deus-mechanicus-consumer-product.ts                 — consumer product manifest factory + test suites
src/lib/dummy-data.ts                               — buildDummySession(step) test data
src/lib/test-harness.ts                             — QA test suite runner
src/lib/warp-profiles.ts                            — cross-product profile schema
src/components/dm-modules/DummyPlugModule.tsx        — fast-forward UI
src/components/dm-modules/QAModule.tsx               — test runner UI
src/components/dm-modules/DataInspectorModule.tsx    — state inspection panel
src/components/dm-modules/PipelineTracerModule.tsx   — pipeline logging viewer
src/components/dm-modules/RocketsModule.tsx          — rocket management/testing
```

### Extension

```
extension/manifest.json     — Manifest V3 config
extension/background.js     — service worker
extension/content.js        — LinkedIn page manipulation + form filling
extension/popup.html        — popup UI
extension/popup.css         — popup styles
extension/popup.js          — popup logic
```

### LinkedIn

```
src/components/steps/Step11LinkedIn.tsx  — 5-tab interface (profile, experience, skills, education, forms)
```

### Market Research

```
src/components/steps/StepCollect.tsx     — query generation UI (step 4)
src/components/steps/Step6Analysis.tsx   — two-phase market analysis UI (step 5)
src/components/pages/AimPage.tsx         — composite page hosting steps 4-5
src/app/api/jobs/route.ts               — Bright Data API integration
src/lib/scraper-scripts.ts              — BD scraper page-function scripts
```

Note: `utils.ts` contains market-specific helpers (`preprocessMarketData`, `buildMarketSummary`, `extractHourlyRates`, `buildMarketPrepPayload`) but is foundation-owned. Request a foundation-update if you need changes.

### Onboarding

```
src/components/steps/Step1Resume.tsx         — resume upload + parse
src/components/steps/Step3Preferences.tsx    — preferences form
src/components/steps/Step4Profile.tsx        — profile analysis
src/components/pages/OnboardingPage.tsx      — composite page (7 sub-steps)
src/components/OnboardingProgress.tsx        — progress indicator
src/components/OnboardingCelebration.tsx     — celebration screen
src/lib/upload.ts                            — file upload handling
```

### Resume Generation

```
src/components/steps/Step10Resumes.tsx   — resume generation UI (phases, category selection, pricing)
src/components/steps/Step12Download.tsx  — bulk download (ZIP + TXT)
src/lib/docx-generator.ts               — DOCX generation
src/lib/pdf-generator.ts                 — PDF generation
src/lib/download-helpers.ts              — blob download, ZIP bundling, linkedInToText()
```

### Rockets Economy (feature ID: `rockets`)

```
src/lib/rockets.ts                       — balance ops, cost table, pack definitions, calculateBulkCost()
src/app/api/rockets/route.ts             — GET balance + usage + costs
src/app/api/rockets/debit/route.ts       — POST debit rockets
src/app/api/rockets/grant/route.ts       — POST add rockets (admin/webhook)
src/app/api/claude/route.ts              — rocket debit enforcement (shared with foundation)
src/app/api/stripe/checkout/route.ts     — Stripe checkout session creation
src/app/api/stripe/webhook/route.ts      — Stripe webhook → addRockets (idempotent)
src/components/RocketBar.tsx             — header balance display
src/components/RocketStore.tsx           — pack selection + purchase modal
```

### Skills Curation

```
src/components/steps/Step8Skills.tsx     — skill toggle UI (search, categories, include/exclude)
```

Note: Step8Skills.tsx is the primary component (builder-owned). ReadyPage imports and renders it via a `{step === N && <Step8Skills />}` render block, following the shared-foundation rules (see Composite Pages section below).

---

### Shell & Navigation (feature ID: `shell`)

```
src/components/HubScreen.tsx            — returning-user dashboard (post-onboarding landing)
src/components/IntroScreen.tsx          — first-visit landing page (resume upload CTA)
src/components/PhaseBar.tsx             — READY/AIM/FIRE phase pills (post-onboarding nav)
src/components/SidePanel.tsx            — desktop sidebar navigation
src/components/KeyboardNav.tsx          — keyboard shortcuts handler
src/components/DMBadge.tsx              — dev tools indicator badge
src/components/GlazeToast.tsx           — score milestone toast notification
```

### Auth (additional UI)

```
src/components/AuthModal.tsx            — login/register overlay modal
src/components/SoftGate.tsx             — post-step-5 auth prompt (nudge, not block)
```

### Profile (feature ID: `profile`)

```
src/components/ProfilePage.tsx          — profile viewer (read-only display)
src/components/ProfileEditor.tsx        — profile editor (inline editing)
src/components/DummyProfileEditorModal.tsx — dev tools profile editor modal
```

### Resume Generation (additional UI)

```
src/components/ResumeDisplay.tsx        — resume preview component
```

---

## Composite Pages (shared ownership)

These files host multiple features. Builders working on features within these pages MUST coordinate.

| File                                      | Features hosted                                     | Coordination rule                                                   |
| ----------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------- |
| `src/components/pages/OnboardingPage.tsx` | Onboarding (steps 1-3)                              | Onboarding agent owns this                                          |
| `src/components/pages/AimPage.tsx`        | Market Research (steps 4-5)                         | Market Research agent owns this                                     |
| `src/components/pages/ReadyPage.tsx`      | Deep-Dive QA, Skills, Resumes, LinkedIn (steps 6-9) | **Shared-foundation** — ReadyPage.tsx is foundation-maintained but builders may ADD import lines and conditional renders for their step components. Builders MUST NOT modify existing logic, layout, or state management. Allowed modifications: adding `import` statements and `{step === N && <Component />}` render blocks only. |
| `src/app/page.tsx`                        | All steps (orchestrator)                            | Foundation-owned — no feature agent modifies this                   |

---

## UI Components (shared, foundation-owned)

```
src/components/ui/Btn.tsx       — button component
src/components/ui/Card.tsx      — card container
src/components/ui/Inp.tsx       — text input
src/components/ui/Sel.tsx       — select dropdown
src/components/ui/Toast.tsx     — GlazeToast notifications
src/components/ui/Spin.tsx      — loading spinner
src/components/ui/PrivacyModal.tsx — data export/import/privacy modal
src/components/ui/LocCombo.tsx  — location autocomplete combo box
src/components/ui/EduCard.tsx   — education entry display card
src/components/ui/AutoBadge.tsx — AI-generated content indicator badge
src/components/ui/CharCount.tsx — character counter
src/components/ui/CopyBtn.tsx   — copy to clipboard button
src/components/ui/MultiSelect.tsx — multi-option button group
src/components/ui/ProgressSteps.tsx — step progress indicator
src/components/ui/TabBar.tsx   — tab navigation
src/components/ui/Toast.tsx    — toast notification system
src/components/ui/ErrorBoundary.tsx — error fallback wrapper
src/components/ui/index.ts     — barrel export
```

These are atomic UI components used by all features. Foundation-owned, read-only for feature agents.
