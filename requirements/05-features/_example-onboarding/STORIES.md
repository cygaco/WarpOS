# Granular Stories: Onboarding Wizard

## Step 1: Data Import

### S-ONBOARD-1: File upload via drag-and-drop

**Given** user is on the onboarding start screen
**When** user drags a file (PDF, DOCX, or TXT, under 10MB) onto the drop zone
**Then** file is accepted, parsing begins in background, user advances to Step 2

**Edge cases:**
- File is not PDF/DOCX/TXT → show error "Please upload a PDF, Word, or text file"
- File is > 10MB → show error "File too large (max 10MB)"
- File is 0 bytes → show error "This file appears to be empty"

**Refs:** PRD §8 (Step 1), HL-ONBOARD-1

### S-ONBOARD-2: File upload via click-to-browse

**Given** user is on the onboarding start screen
**When** user clicks the upload area and selects a file from the file picker
**Then** same behavior as drag-and-drop (S-ONBOARD-1)

**Refs:** PRD §8 (Step 1), HL-ONBOARD-1

### S-ONBOARD-3: Text paste fallback

**Given** user is on the onboarding start screen
**When** user pastes text into the text input area and clicks Continue
**Then** text is saved as raw input, parsing begins, user advances to Step 2

**Edge cases:**
- Empty paste → Continue button disabled
- Paste > 50,000 characters → show warning "Text is very long, parsing may take longer"

**Refs:** PRD §8 (Step 1), HL-ONBOARD-1

### S-ONBOARD-4: Background parsing status

**Given** parsing is running in background
**When** parsing completes (success or failure)
**Then** status banner updates: green for success, red with retry for failure

**Edge cases:**
- Parsing times out after 30 seconds → show "Processing is taking longer than expected. Retry?"
- User is on Step 2 when parsing completes → banner updates silently, no interruption

**Refs:** PRD §8 (Parallel Processing), HL-ONBOARD-1

## Step 2: Preferences

### S-ONBOARD-5: Preference substep navigation

**Given** user is on any preference substep
**When** user completes the substep and clicks Continue
**Then** data is saved to session, next substep loads

**Edge cases:**
- User clicks Back → returns to previous substep with data preserved
- User refreshes → resumes at current substep with all data intact

**Refs:** PRD §8 (Step 2), HL-ONBOARD-2

### S-ONBOARD-6: Preference validation

**Given** user is on a preference substep with required fields
**When** user clicks Continue without filling required fields
**Then** validation errors shown inline, Continue blocked

**Refs:** PRD §8 (Step 2), HL-ONBOARD-2

## Step 3: Profile Generation

### S-ONBOARD-7: Generate profile from data + preferences

**Given** user has completed Step 2 and parsing has succeeded
**When** user arrives at Step 3
**Then** AI generates a structured profile, displayed for review within 15 seconds

**Edge cases:**
- Parsing failed → show "We need your data to generate a profile. Please retry the upload."
- AI generation fails → show "Profile generation failed. Retry?" with retry button
- AI returns incomplete profile → show what's available with "Some fields couldn't be determined" note

**Refs:** PRD §8 (Step 3), HL-ONBOARD-3

### S-ONBOARD-8: Edit generated profile

**Given** user is viewing the generated profile
**When** user clicks any editable field
**Then** field becomes editable inline, changes save on blur

**Refs:** PRD §8 (Step 3), HL-ONBOARD-3

### S-ONBOARD-9: Confirm profile and proceed

**Given** user is viewing the generated profile
**When** user clicks "Looks good" / Confirm
**Then** profile is saved to session, user advances to next product phase

**Refs:** PRD §8 (Step 3), HL-ONBOARD-3

## Session Persistence

### S-ONBOARD-10: Resume onboarding after refresh

**Given** user has completed substeps 1-N and refreshes the page
**When** onboarding page loads
**Then** user is placed at substep N+1 with all previous data intact

**Edge cases:**
- Session data is corrupt → reset to Step 1, show "Your previous progress couldn't be restored"
- Session expired → same as corrupt, clean restart

**Refs:** PRD §8 (session auto-save), HL-ONBOARD-4
