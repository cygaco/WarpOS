<!-- STALE: docs/00-canonical/GLOSSARY.md changed at 2026-04-09T22:32:16 — review needed -->
<!-- STALE: .claude/agents/.system/agent-system.md changed at 2026-04-06T19:35:28 — review needed -->
# Task Manifest

The orchestrator reads this manifest to dispatch work. Features are grouped into phases. Within each phase, independent features can run in parallel.

> **Naming Convention:** Task IDs use `build-{feature}` prefix (e.g., `build-auth`). Store.json uses bare feature names (e.g., `auth`). The mapping is: `build-X` in manifest → `X` in store.json. Orchestrator must strip the `build-` prefix when updating store.json feature status.

---

## Build Order

### Phase 0: Foundation (sequential, must complete first)

| Task                    | Description                                          | Files                                                                                    | Depends on           |
| ----------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------- | -------------------- |
| `foundation-types`      | All TypeScript interfaces in `types.ts`              | `src/lib/types.ts`                                                                       | Nothing              |
| `foundation-constants`  | Step definitions, PHASE_DISPLAY, STEP_REQUIRES       | `src/lib/constants.ts`                                                                   | types                |
| `foundation-storage`    | Encrypted localStorage + server sync                 | `src/lib/storage.ts`                                                                     | types                |
| `foundation-validators` | Input sanitization, ATS sanitization                 | `src/lib/validators.ts`                                                                  | types                |
| `foundation-pipeline`   | Pipeline tracer                                      | `src/lib/pipeline.ts`                                                                    | types                |
| `foundation-api`        | callClaude(), fetchJobs(), retry logic               | `src/lib/api.ts`                                                                         | types, validators    |
| `foundation-utils`      | Data processing helpers                              | `src/lib/utils.ts`                                                                       | types                |
| `foundation-prompts`    | All Claude prompt templates                          | `src/lib/prompts.ts`                                                                     | types                |
| `foundation-ui`         | Atomic components (Btn, Card, Inp, Sel, Toast, etc.) | `src/components/ui/*`                                                                    | Nothing              |
| `foundation-layout`     | Root layout, globals.css, page.tsx shell, not-found  | `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `src/app/not-found.tsx` | types, constants, ui |

**Gate:** `npm run build` must pass clean after foundation phase.

---

### Phase 1: Auth + Rockets (parallel, no cross-dependency)

| Task            | Description                                    | Files                                   | Depends on |
| --------------- | ---------------------------------------------- | --------------------------------------- | ---------- |
| `build-auth`    | JWT, OAuth, login/register/logout, session API | See FILE-OWNERSHIP.md → Auth            | foundation |
| `build-rockets` | Credit economy, Stripe, balance API            | See FILE-OWNERSHIP.md → Rockets Economy | foundation |

**Gate:** `npm run build` clean. Auth endpoints return correct responses. Rocket balance operations work.

---

### Phase 2: Onboarding (sequential — depends on auth)

| Task               | Description                                              | Files                              | Depends on                |
| ------------------ | -------------------------------------------------------- | ---------------------------------- | ------------------------- |
| `build-onboarding` | Resume upload, preferences, profile analysis (steps 1-3) | See FILE-OWNERSHIP.md → Onboarding | auth, rockets, foundation |

**Gate:** `npm run build` clean. Resume upload parses correctly. Profile generates from dummy data.

---

### Phase 2.5: Shell & Navigation (parallel — depends on foundation + auth/onboarding)

| Task            | Description                                                                    | Files                                                                                                                                                                                                                            | Depends on             |
| --------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| `build-shell`   | Hub screen, intro screen, phase bar, side panel, keyboard nav, DM badge, toast | `src/components/HubScreen.tsx`, `src/components/IntroScreen.tsx`, `src/components/PhaseBar.tsx`, `src/components/SidePanel.tsx`, `src/components/KeyboardNav.tsx`, `src/components/DMBadge.tsx`, `src/components/GlazeToast.tsx` | foundation, auth       |
| `build-profile` | Profile page, profile editor, dummy profile editor modal                       | `src/components/ProfilePage.tsx`, `src/components/ProfileEditor.tsx`, `src/components/DummyProfileEditorModal.tsx`                                                                                                               | foundation, onboarding |

**Gate:** `npm run build` clean. All shell components render. Phase bar shows READY/AIM/FIRE. Side panel navigation works. IntroScreen has resume upload zone. Profile page displays session.profile data. Editing saves back to session.

---

### Phase 3: Market Research (sequential — depends on onboarding output)

| Task                    | Description                                               | Files                                   | Depends on             |
| ----------------------- | --------------------------------------------------------- | --------------------------------------- | ---------------------- |
| `build-market-research` | Query gen, BD integration, two-phase analysis (steps 4-5) | See FILE-OWNERSHIP.md → Market Research | onboarding, foundation |

**Gate:** `npm run build` clean. Queries generate from profile. Market analysis produces categories and keywords.

---

### Phase 4: Deep-Dive QA + Skill Curation + Competitiveness (parallel — with ReadyPage constraint)

| Task                    | Description                                       | Files                                   | Depends on      |
| ----------------------- | ------------------------------------------------- | --------------------------------------- | --------------- |
| `build-deep-dive-qa`    | Deep-Dive QA accordion (step 6) | See FILE-OWNERSHIP.md → Deep-Dive QA    | market-research |
| `build-skills-curation` | Skill toggle UI, exclusions (step 7)              | See FILE-OWNERSHIP.md → Skills Curation | market-research |
| `build-competitiveness` | Scoring algorithm, meter UI                       | See FILE-OWNERSHIP.md → Competitiveness | foundation      |

> **Note on competitiveness dependencies:** The weighted factors table in INTEGRATION-MAP.md shows competitiveness reads outputs from deep-dive-qa (15%), market-research (5%), skills-curation (5%), resume-generation (35%), linkedin (25%), auto-apply (10%), and form-answers (10%). However, competitiveness reads session fields populated by earlier features at runtime — it does not import their code. No build-order dependency is required beyond foundation. The scoring algorithm only needs the TypeScript interfaces (from foundation) and reads whatever data is available at runtime, returning a partial score when later-step data is missing.

**ReadyPage Coordination Rule:** `deep-dive-qa` and `skills-curation` both touch `ReadyPage.tsx`. They MUST be dispatched as a **single combined agent** (as was done successfully in Run 02) OR serialized (deep-dive-qa first, then skills-curation). Never dispatch them as parallel independent agents modifying ReadyPage simultaneously. `competitiveness` does NOT touch ReadyPage and can run in parallel with either.

**Gate:** `npm run build` clean. Mining questions render. Skills toggle works. Score calculates from session data.

---

### Phase 5: Content Generation (serial for ReadyPage, after Phase 4)

| Task                      | Description                                            | Files                                     | Depends on                             |
| ------------------------- | ------------------------------------------------------ | ----------------------------------------- | -------------------------------------- |
| `build-resume-generation` | Master, general, targeted resumes + download (steps 8) | See FILE-OWNERSHIP.md → Resume Generation | deep-dive-qa, skills-curation, rockets |
| `build-linkedin`          | LinkedIn content + form answers (step 9)               | See FILE-OWNERSHIP.md → LinkedIn          | deep-dive-qa, skills-curation, rockets |

**ReadyPage Coordination Rule:** Both `resume-generation` and `linkedin` render inside `ReadyPage.tsx`. Dispatch as a **single combined agent** OR serialize (resume-generation first, then linkedin). The Orchestrator MUST wire the step component import and render into ReadyPage after each builder completes — builders cannot modify ReadyPage directly (Run 02 BUG-013 lesson).

**Gate:** `npm run build` clean. Resumes generate from dummy data. LinkedIn content generates. Rocket billing works.

---

### Phase 6: Auto-Apply + Extension (sequential)

| Task               | Description                                         | Files                              | Depends on                             |
| ------------------ | --------------------------------------------------- | ---------------------------------- | -------------------------------------- |
| `build-extension`  | Chrome extension (Manifest V3, LinkedIn Easy Apply) | See FILE-OWNERSHIP.md → Extension  | foundation                             |
| `build-auto-apply` | Apply prompt, heuristics, hand-off UI (step 10)     | See FILE-OWNERSHIP.md → Auto-Apply | resume-generation, linkedin, extension |

**Gate:** `npm run build` clean. Extension ZIP generates. Apply prompt assembles from session data.

---

### Phase 7: Dev Tools (can run anytime after foundation)

| Task                    | Description                                       | Files                                   | Depends on |
| ----------------------- | ------------------------------------------------- | --------------------------------------- | ---------- |
| `build-deus-mechanicus` | Dev tools hub, dummy data, test harness, manifest | See FILE-OWNERSHIP.md → Deus Mechanicus | foundation |

**Gate:** `npm run build` clean. `/?dummyplug` renders. Dummy data generates at all steps.

---

## Parallelism Map

```
Phase 0: foundation (sequential)
  │
  ├── Phase 1: auth ──────────┐
  ├── Phase 1: rockets ───────┤ (parallel)
  │                           │
  ├── Phase 2: onboarding ────┤ (after auth)
  │                           │
  ├── Phase 2.5: shell ───────┤
  ├── Phase 2.5: profile ─────┤ (parallel, after auth/onboarding)
  │                           │
  ├── Phase 3: market-research┤ (after onboarding)
  │                           │
  ├── Phase 4: deep-dive-qa ──┤
  ├── Phase 4: skills-curation┤ (parallel, after market)
  ├── Phase 4: competitiveness┤
  │                           │
  ├── Phase 5: resume-generation ┤
  ├── Phase 5: linkedin ─────────┤ (parallel, after Phase 4)
  │                           │
  ├── Phase 6: extension ─────┤
  ├── Phase 6: auto-apply ────┤ (after resumes + linkedin + extension)
  │                           │
  └── Phase 7: deus-mechanicus (anytime after foundation)
```

---

## Task Template (what the orchestrator fills for each dispatch)

```json
{
  "id": "build-auth",
  "type": "build",
  "feature": "auth",
  "phase": 1,
  "spec": "docs/05-features/auth/PRD.md",
  "fileScope": [
    "src/lib/auth.ts",
    "src/lib/auth-oauth.ts",
    "src/app/api/auth/**/*",
    "src/app/api/session/route.ts"
  ],
  "dependencies": ["foundation"],
  "acceptanceCriteria": [
    "npm run build passes clean",
    "POST /api/auth/register creates user and returns JWT",
    "POST /api/auth/login returns JWT for valid credentials",
    "POST /api/auth/logout clears session",
    "GET /api/auth/me returns user for valid JWT",
    "OAuth routes redirect correctly (Google, LinkedIn)",
    "Session persists to Redis",
    "No API keys exposed to client bundle"
  ],
  "constraints": [
    "Do NOT modify foundation files",
    "Do NOT add dependencies without flagging in store",
    "Use requireAuth() pattern from auth.ts in all protected routes"
  ]
}

**Note:** `spec` paths use the PRD folder name, which matches the feature ID in all cases except `rockets` → `docs/05-features/rockets-economy/PRD.md`.

**Companion specs:** Each feature also has STORIES.md, COPY.md, and INPUTS.md (if user inputs exist) in the same directory. Builders receive all companion specs alongside the PRD. See PROMPT-TEMPLATES.md for the full read order.
```
