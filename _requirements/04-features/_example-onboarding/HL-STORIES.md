# High-Level Stories: Onboarding

> **Agent Instructions**
>
> These stories define INTENT and OUTCOMES, not implementation details.
> Granular stories (STORIES.md) break each HL story into atomic behaviors.

---

### HL-ONB-01: Idea-Brief Import (MVP)

> As a Founder, I want to import my existing idea brief (file or text), so the system can understand my product without me typing everything from scratch.

**Success:** Founder provides input and sees a structured preview of their parsed idea brief within 30 seconds.

**Granular stories:** GS-ONB-01 (file upload), GS-ONB-02 (size validation), GS-ONB-03 (text paste), GS-ONB-04 (AI parsing)

---

### HL-ONB-02: Launch Constraints (MVP)

> As a Founder, I want to tell the system my launch constraints, so it can personalize everything downstream.

**Success:** Founder completes all constraint sections and data persists across refresh.

**Granular stories:** GS-ONB-05 (constraint collection)

---

### HL-ONB-03: FounderProfile Generation (MVP)

> As a Founder, I want to see an AI-generated FounderProfile that summarizes my product and launch goals, so I can verify the system understands me before proceeding.

**Success:** FounderProfile is generated, displayed, and the founder confirms it's accurate.

**Granular stories:** GS-ONB-06 (profile generation)

---

### HL-ONB-04: Session Persistence (MVP)

> As a Founder, I want my progress saved automatically, so I can close the browser and come back later without losing anything.

**Success:** Refresh at any step → resume exactly where left off with all data intact.

**Granular stories:** GS-ONB-07 (session persistence)
