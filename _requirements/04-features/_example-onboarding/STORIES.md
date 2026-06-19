# Granular Stories: Onboarding

> **Agent Instructions**
>
> 1. Each story = one code path you implement as a unit — do not combine stories
> 2. Check `Depends on:` before starting — if a dependency story isn't built, stop and report
> 3. The `Data:` field tells you exactly which interfaces and fields to read/write
> 4. Your output will be evaluated against criteria you cannot see — build to the spec, not to assumed tests
> 5. If a story's acceptance criteria conflict with another story, escalate — do not guess

---

## Parent: HL-ONB-01 — Idea-Brief Import (MVP)

<!-- parallel-safe: GS-ONB-01, GS-ONB-02 can be implemented independently -->

### GS-ONB-01: File Upload Acceptance

> As a Founder, I want to provide my idea brief as a PDF, DOCX, TXT, or MD file, so that the system can extract structured information from my existing document.

**Depends on:** none
**Data:** `SessionData.rawInput` → `src/lib/types.ts`
**Entry state:** Fresh — first arrival at Step 1, no idea brief uploaded yet
**Verifiable by:** Upload a `.pdf` → file accepted and `rawInput` populated; upload a `.exe` → error message displayed naming accepted formats.
**Inherits:** CS-003

**Acceptance Criteria:**

- Files with extensions `.pdf`, `.docx`, `.txt`, and `.md` are accepted
- Files with any other extension are rejected with an error naming accepted formats
- The system cannot silently ignore an unsupported file type

---

### GS-ONB-02: File Size Validation

> As a System, I want to reject files exceeding 10MB, so that processing resources are not consumed by unreasonably large uploads.

**Depends on:** none
**Data:** none (validation before the idea brief enters the model)
**Entry state:** Any
**Verifiable by:** Upload an 11MB file → error message with size limit; upload a 5MB file → accepted.

**Acceptance Criteria:**

- Files > 10MB are rejected with a message: "File too large. Maximum size is 10MB."
- The size check happens before any AI processing

---

### GS-ONB-03: Text Paste Alternative

> As a Founder, I want to paste my idea brief directly instead of uploading a file, so that I can use the system even if I don't have a file handy.

**Depends on:** none
**Data:** `SessionData.rawInput` → `src/lib/types.ts`
**Entry state:** Fresh — no idea brief uploaded or pasted yet
**Verifiable by:** Paste 500 words of text → rawInput populated; paste empty string → validation error.

**Acceptance Criteria:**

- A text area is available as an alternative to file upload
- Pasted text is trimmed and validated (minimum 50 characters)
- Empty or whitespace-only input is rejected
- After pasting, the same parsing pipeline runs as for file upload

---

### GS-ONB-04: AI Parsing

> As a Founder, I want my uploaded idea brief to be automatically parsed into structured fields, so I don't have to manually enter everything.

**Depends on:** GS-ONB-01 or GS-ONB-03
**Data:** `SessionData.rawInput` → `SessionData.parsed` → `src/lib/types.ts`
**Entry state:** rawInput populated (file uploaded or text pasted)
**Verifiable by:** Upload valid file → parsed object contains expected fields; upload gibberish → graceful error with retry option.

**Acceptance Criteria:**

- Raw input is sent to AI for structured extraction
- AI returns a typed object matching the expected interface
- Loading state shown during parsing (with progress indicator)
- Parse errors show a retry button and option to paste text manually
- Parsed data is displayed for user review before proceeding
**Inherits:** CS-002

---

## Parent: HL-ONB-02 — Launch Constraints (MVP)

### GS-ONB-05: Constraint Collection

> As a Founder, I want to set my launch constraints through a guided form, so the system knows how I want to launch.

**Depends on:** GS-ONB-04
**Data:** `SessionData.preferences` → `src/lib/types.ts`
**Entry state:** Returning — parsed idea brief exists, constraints not yet set
**Verifiable by:** Complete all constraint sections → constraints object fully populated in session.

**Acceptance Criteria:**

- All constraint sections are presented sequentially
- Each section auto-saves on completion
- Founder can navigate back to previous sections
- All fields persist across browser refresh
**Inherits:** CS-001

---

## Parent: HL-ONB-03 — FounderProfile Generation (MVP)

### GS-ONB-06: FounderProfile Generation

> As a Founder, I want the system to generate a comprehensive FounderProfile from my idea brief and launch constraints, so I can verify it understands me correctly.

**Depends on:** GS-ONB-05
**Data:** `SessionData.parsed` + `SessionData.preferences` → `SessionData.profile` → `src/lib/types.ts`
**Entry state:** Returning — constraints complete, FounderProfile not yet generated
**Verifiable by:** Click generate → FounderProfile displayed with all expected sections; profile fields are derived from the parsed idea brief (not hallucinated).

**Acceptance Criteria:**

- FounderProfile generated from parsed idea brief + launch constraints via AI call
- FounderProfile displayed in a reviewable card format
- Founder can regenerate if unsatisfied (with usage tracking)
- Generated FounderProfile is verified against the input idea brief (no hallucinated fields)
- Loading state during generation
**Inherits:** CS-002

---

### GS-ONB-07: Session Persistence Across Refresh

> As a Founder, I want my onboarding progress to survive a page refresh, so I don't lose my work.

**Depends on:** none
**Data:** All SessionData fields → encrypted localStorage
**Entry state:** Any — applies at every step
**Verifiable by:** Complete Step 1, refresh browser → Step 1 data intact, user returns to Step 1 completed state.

**Acceptance Criteria:**

- All session data is persisted to encrypted storage after every state change
- On page load, existing session data is loaded and the user resumes at their last step
- No flash of empty state before session loads
**Inherits:** CS-001
