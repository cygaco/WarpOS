# AcmeLaunch — UX Principles & Emotional Design

---

## Core UX Principles

### 1. Visibility of System Status

The user must always know:

- What step they're on (PhaseBar, SidePanel, progress pill)
- What's happening right now (loading states, progress indicators)
- What they've accomplished (launch readiness score, completed phases)
- What comes next (step labels, CTA buttons)

**Current implementation:**

- PhaseBar with PLAN/PREP/LAUNCH pills + step indicators
- ProgressSteps component during multi-phase operations
- Launch readiness meter showing cumulative progress
- Loading text with ellipsis during API calls

### 2. User Control & Freedom

The user must be able to:

- Go back to any previous step
- Edit any data they've entered
- Cancel any in-progress operation
- Export or delete all their data
- Skip optional features (Deep-Dive QA has a skip path)

**Current implementation:**

- Backward navigation via SidePanel/PhaseBar
- Invalidation system clears stale data when edits are made
- AbortController on long API calls
- PrivacyModal for export/import/delete
- Keyboard navigation (Backspace = back, "?" = hub)

### 3. Consistency & Standards

The UI should be predictable:

- Same action = same appearance everywhere
- Color meanings are stable (green = done, orange = action, red = error)
- Button patterns are consistent (Btn component with variants)
- Feedback patterns are consistent (toasts for confirmations, inline for errors)

**Current gaps (flagged for regen):**

- Button inconsistency (raw `<button>` vs Btn component in several places)
- Card padding inconsistency (`p-4` vs `p-5`)
- Icon alignment inconsistency (flex gap vs margin)

### 4. Error Prevention

The system should prevent errors before they happen:

- Validation before submission (input fields, file types)
- Confirmation dialogs before destructive actions (invalidation)
- Disabled states for actions that can't be taken yet
- Rate limiting feedback before hitting limits

### 5. Recognition Over Recall

The user shouldn't have to remember information:

- Step labels describe what each step does
- Landscape research surfaces audience segments and channels (founder selects, doesn't generate)
- Follow-up answers are pre-filled from earlier data
- FounderProfile is AI-generated from the idea brief (founder verifies, doesn't write from scratch)

### 6. Flexibility & Efficiency

Power users should be able to move faster:

- Keyboard shortcuts (Backspace, "?")
- Direct step navigation via SidePanel
- Bulk operations (Download All asset packs, Select All segments)
- Dirty tracking skips invalidation when nothing changed

### 7. Aesthetic & Minimalist Design

Every element should earn its place:

- Dark theme reduces visual noise
- Muted text for secondary information
- Progressive disclosure (expandable sections, tabs)
- No decorative elements that don't serve a function

---

## Emotional Design Framework

What the user should FEEL at each phase of the wizard.

### Onboarding (Steps 1–3): Confidence

**Target emotion:** "This is going to work."

- Idea-brief parsing should feel like magic (fast, accurate extraction)
- FounderProfile generation should validate the founder's idea ("It understood my product")
- Launch constraints should feel comprehensive but not overwhelming
- Celebration at onboarding completion reinforces commitment

**Design signals:**

- Quick progress through sub-steps
- AI badge on generated content (shows intelligence, not templates)
- Celebration overlay with confetti after step 3

### PLAN Phase (Steps 4–5): Curiosity

**Target emotion:** "Show me my launch landscape."

- Research queries should feel targeted (not generic)
- Landscape research should reveal insights the founder didn't know
- Audience segments should feel like real opportunities, not abstract groupings
- Channel and benchmark data should give context ("Where does my audience actually spend time?")

**Design signals:**

- Real signal count from real launch research (not synthetic)
- Segment descriptions explain WHY each is relevant to the founder
- Discovery recommendations spark "I hadn't thought of that"
- Launch readiness score gives a baseline ("Here's where I stand")

### PREP Phase (Steps 6–9): Control

**Target emotion:** "I'm in the driver's seat."

- Deep-Dive Q&A lets the founder add context the idea brief missed
- Scope curation gives direct control over which milestones and tasks are included
- Asset-pack generation produces tangible, downloadable output
- Channel-ready launch assets are ready to use immediately

**Design signals:**

- Toggle controls for every milestone and task (include/exclude)
- Segment selection (toggle on/off) at Step 5 lock
- Asset-pack export = real, usable artifact
- Launch readiness score climbing with each completed step
- Score celebrations reinforce progress

### LAUNCH Phase (Step 10): Momentum

**Target emotion:** "Let's go. I'm ready."

- Everything is assembled: asset packs, channel posts, follow-up sequences, launch rules
- The guided launch run path is clear and straightforward
- A manual checklist provides a fallback if the Launch Console isn't used
- The system has done the hard work; the founder just needs to execute

**Design signals:**

- The Launch Console handoff is one click to copy
- Launch rules are concrete (publish-if/hold-if lists)
- Asset-pack selection is automatic per segment
- Session summary shows everything that was generated

---

## Information Hierarchy

### Visual Weight (Highest to Lowest)

1. **Primary CTA** — Orange button, most visually prominent
2. **Headings** — Section orientation
3. **Active content** — Cards, data displays, form fields
4. **Secondary actions** — Ghost/outline buttons, text links
5. **Helper text** — Muted color, smaller font
6. **System chrome** — PhaseBar, CreditBar (credit balance), SidePanel (present but not attention-grabbing)

### Progressive Disclosure Pattern

- **Default visible:** Primary content, main CTA, current step
- **Expand to see:** Details, sub-sections, additional options
- **Modal/overlay:** Confirmations, settings, purchases, auth
- **Hidden:** Dev tools (Dev Console), keyboard shortcuts

---

## Accessibility

### Current Implementation

- Focus ring: `2px solid --primary`, `outline-offset: 2px` (global)
- Keyboard navigation: Backspace (back), "?" (hub toggle)
- Color contrast: Generally sufficient (white text on dark backgrounds)
- Screen reader: Basic support (standard HTML elements)

### Gaps (Flagged for Regen)

- No ARIA labels on custom components
- No skip-to-content link
- LaunchReadinessMeter (SVG arc) has no text alternative
- Color alone used for some state indicators (should add icons/text)
- Tab order not explicitly managed
- No reduced-motion media query support
