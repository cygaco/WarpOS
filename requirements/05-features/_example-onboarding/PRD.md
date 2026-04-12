# PRD: Onboarding Wizard

> **Agent Instructions**
>
> 1. Read this entire PRD before writing any code — Section 8 is your primary implementation guide
> 2. The acceptance criteria in linked stories are your contract
> 3. Check Section 9 (Dependencies) — if a dependency isn't built yet, stop and report
> 4. If something is ambiguous, escalate — do not guess

## 1. Title + Classification

**Onboarding (Data Import, Preferences, Profile Generation)** — MVP

## 2. Screen

Onboarding, Steps 1–3. Composite component: `OnboardingPage`. The entire multi-step flow is self-contained.

## 3. Context

Onboarding is the foundation of the entire product. Every downstream feature depends on the data collected here. A user who abandons onboarding produces zero value. The flow must feel fast, low-friction, and progressively rewarding: import data, set preferences, and receive an AI-generated profile — all in under 5 minutes.

## 4. JTBD (Jobs To Be Done)

> When I start using a new tool, I want to quickly import my existing data and set my preferences, so I can get personalized results without manually entering everything.

> When I see my AI-generated profile, I want to verify it understands my situation and goals, so I can trust the system to work for me downstream.

> When I have a non-standard background, I want the tool to capture that context, so I get advice that accounts for my real situation, not a generic template.

## 5. Emotional Framing

- **Entry**: Hopeful but skeptical — "Will this actually work for me?" They've tried tools before. They need to feel this one is different within 60 seconds.
- **During**: Progressive confidence — each completed sub-step builds trust. Data import should feel like magic ("it got everything right"). Preferences should feel empowering ("I'm in control"). Profile generation should feel validating ("it really understands me").
- **Exit**: Energized and ready — "My setup is complete. Let's go."

## 6. Goals

- User completes full onboarding (import → preferences → profile) in under 5 minutes
- Data import succeeds on 95%+ of well-formatted inputs
- Zero data loss — every field the user fills is persisted to session
- Profile generation produces actionable output on first attempt for 90%+ of users
- Preferences capture enough signal to drive relevant downstream features

## 7. Assumptions

- Users have existing data in a common format (PDF, DOCX, TXT, or plain text they can paste)
- AI parsing handles 95%+ of well-formatted inputs without hallucination
- 10MB file limit is sufficient for any reasonable upload
- Session state auto-saves at each sub-step boundary

## 8. Feature Description

Onboarding is a 3-step wizard that transforms raw user data into a structured profile with preferences.

**Step 1: Data Import**

User provides their data via: drag-and-drop file upload (PDF, DOCX, TXT — 10MB limit) or paste. System triggers AI parsing as a background task and advances to Step 2. User does NOT wait for parsing.

A persistent status banner shows parsing progress:
- During: "Processing your data..." (yellow)
- Success: "Data processed ✓" (green)
- Failure: "Processing failed. Retry?" (red) — does NOT block Step 2

**Parallel Processing Principle:** Data parsing and preference collection run concurrently. User never waits idle. Only Step 3 (profile generation) requires parsed data.

**Step 2: Preferences**

Multiple substeps collecting user intent — independent of imported data. Each substep auto-saves to session. Substeps are ordered and cannot be skipped. Going back preserves entered data.

**Step 3: Profile Generation**

AI generates a structured profile from imported data + preferences. User reviews, edits if needed, and confirms. This is the synchronization point where parsed data and preferences merge.

Session auto-saves at each boundary. Refresh/return resumes where the user left off.

## 9. Dependencies / Blockers

- AI parsing API (must be available for Step 1)
- Session storage (localStorage or server-side)
- File upload handling (client-side validation + server processing)

## 10. UI Reference

```
┌─────────────────────────────────┐
│  Step 1    Step 2    Step 3     │  ← Progress indicator
│  ●─────────○─────────○          │
├─────────────────────────────────┤
│                                 │
│   Drop your file here           │
│   ┌───────────────────┐        │
│   │   📄 drag & drop  │        │
│   │   or click to     │        │
│   │   browse           │        │
│   └───────────────────┘        │
│                                 │
│   Or paste text below:          │
│   ┌───────────────────┐        │
│   │                   │        │
│   └───────────────────┘        │
│                                 │
│              [Continue →]       │
└─────────────────────────────────┘
```
