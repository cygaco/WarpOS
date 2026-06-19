# AcmeLaunch — Copy Surface Map

This document defines **every copy surface** in the AcmeLaunch product and the rules that apply to each.

Its purpose is to:

- Eliminate ambiguity about tone and structure per surface
- Prevent inconsistent writing across surfaces
- Encode "stakes" so the correct tone is applied automatically

This document works in combination with:

- Master Copy Strategy
- Copy Mechanics & Grammar Rules
- Surface-Specific Writing Rules

If a surface is not listed here, it must be added before copy is written.

---

## How to Read This Document

Each surface includes:

- **Intent**: what the copy is trying to do
- **Stakes**: low / medium / high
- **Structure**: fragment vs sentence, layout expectations
- **Tone range**: how expressive the copy may be

---

## TIER 0 — SYSTEM, TRUST & SAFETY (Highest Stakes)

These surfaces prioritize trust, clarity, and user safety. Personality must never override seriousness here.

### Payment & Credit Transactions

- **Intent:** Confirm cost, execute purchase
- **Stakes:** High
- **Structure:** Full sentences, explicit amounts
- **Tone range:** Neutral, factual

### Authentication & Account Access

- **Intent:** Build trust, enable secure access
- **Stakes:** High
- **Structure:** Full sentences, 1–2 lines max
- **Tone range:** Reassuring, transparent

### Data Privacy & Export

- **Intent:** Explain data handling, enable control
- **Stakes:** High
- **Structure:** Full sentences, bullet points allowed
- **Tone range:** Neutral, respectful

### Destructive Actions (Data Clearing, Reset)

- **Intent:** Prevent accidental loss
- **Stakes:** High
- **Structure:** Clear title + one sentence body + explicit action buttons
- **Tone range:** Serious, neutral

### Rate Limiting & Budget Exhaustion

- **Intent:** Explain limitation without frustration
- **Stakes:** High
- **Structure:** Short sentence
- **Tone range:** Calm, factual

---

## TIER 1 — CORE PRODUCT UI (Medium Stakes, High Frequency)

These surfaces make up most of the app. Clarity and consistency matter more than personality.

### Phase Pills (PLAN / PREP / LAUNCH)

- **Intent:** Orient the user in the flow
- **Stakes:** Medium
- **Structure:** Single word, ALL CAPS (structural convention)
- **Tone range:** Neutral

### Step Labels (Research, Analyze, Deep Dive, Scope, Plans, Channels, Launch)

- **Intent:** Name the current activity
- **Stakes:** Medium
- **Structure:** 1–2 words, sentence case
- **Tone range:** Neutral

### Section Headers (within steps)

- **Intent:** Set context for a section
- **Stakes:** Medium
- **Structure:** Fragment, 2–5 words
- **Tone range:** Neutral to lightly direct

### Button CTAs (Primary & Secondary)

- **Intent:** Trigger action
- **Stakes:** Medium
- **Structure:** Verb phrase, 1–3 words
- **Tone range:** Neutral, inviting

Notes:

- No personality flourishes
- No punctuation
- Verb-forward always

### Toggle Labels & Inline Controls

- **Intent:** Describe state or option
- **Stakes:** Medium
- **Structure:** Fragment
- **Tone range:** Neutral

### Progress Labels

- **Intent:** Show where the user is
- **Stakes:** Medium
- **Structure:** Fragment ("3 of 8", "Step 2 of 3")
- **Tone range:** Neutral

### Loading States

- **Intent:** Indicate progress, reduce anxiety
- **Stakes:** Medium
- **Structure:** Fragment + ellipsis
- **Tone range:** Calm, factual

Examples:

- "Analyzing landscape data..."
- "Generating plan..."
- "Gathering launch signals..."

### Success Messages (Toasts, Inline)

- **Intent:** Confirm completion
- **Stakes:** Low
- **Structure:** Short sentence or fragment
- **Tone range:** Positive, restrained

### Error Messages (Non-Critical)

- **Intent:** Recover from failure
- **Stakes:** Medium
- **Structure:** Short sentence, stacked lines allowed
- **Tone range:** Calm, non-blaming

---

## TIER 2 — STATES & DISCOVERY (Lower Stakes, Emotional Impact)

These surfaces influence perception of progress and momentum.

### Empty States

- **Intent:** Acknowledge absence, suggest next step
- **Stakes:** Low
- **Structure:** Fragment header + 1 sentence body
- **Tone range:** Calm, honest, encouraging

### Launch-Readiness Score Labels

- **Intent:** Contextualize the score
- **Stakes:** Medium
- **Structure:** 1–3 words
- **Tone range:** Neutral to encouraging
- **Labels (from code):** "Getting started" (0–39), "Building momentum" (40–69), "Strong plan" (70–89), "Launch-ready" (90–100), "OVERKILL" (>100)

### Celebration Messages (GlazeToast, ConfettiBurst)

- **Intent:** Acknowledge achievement
- **Stakes:** Low
- **Structure:** Short fragment or sentence
- **Tone range:** Positive, energetic (the ONE place for enthusiasm)

### Opportunity Recommendations

- **Intent:** Suggest non-obvious opportunities
- **Stakes:** Medium
- **Structure:** Title + short explanation
- **Tone range:** Informative, intriguing

### Landscape Intelligence Summaries

- **Intent:** Present data insights
- **Stakes:** Medium
- **Structure:** Structured data with labels
- **Tone range:** Factual, authoritative

### Launch-Readiness Gain Indicators

- **Intent:** Show score impact of pending actions (e.g., "+12%" next to a segment toggle)
- **Stakes:** Low
- **Structure:** Fragment with delta indicator ("+X%")
- **Tone range:** Neutral, motivating

### Segment Selection & Ranking

- **Intent:** Let user prioritize audience segments
- **Stakes:** Medium
- **Structure:** Segment name + short descriptor + toggle controls
- **Tone range:** Neutral, informative

### Deep-Dive QA (Mining Accordion)

- **Intent:** Surface hidden launch strengths through targeted questions
- **Stakes:** Medium
- **Structure:** Question (1–2 sentences) + text area for answer
- **Tone range:** Conversational, curious

---

## TIER 3 — ONBOARDING & EDUCATION

These surfaces teach without overwhelming.

### Onboarding Step Titles

- **Intent:** Orient users quickly
- **Stakes:** Medium
- **Structure:** Short fragment, 2–4 words
- **Tone range:** Friendly, simple

### Onboarding Subtitles / Helper Text

- **Intent:** Explain value or reassure
- **Stakes:** Medium
- **Structure:** One short sentence, ≤ 15 words
- **Tone range:** Encouraging, reassuring

### Tooltips & Helper Hints

- **Intent:** Explain non-obvious UI
- **Stakes:** Low
- **Structure:** Fragment or very short sentence
- **Tone range:** Neutral, helpful

Notes:

- Just-in-time only
- No personality unless it improves clarity

### Placeholder Text (Inputs)

- **Intent:** Guide input format
- **Stakes:** Low
- **Structure:** Example value or short instruction
- **Tone range:** Neutral

---

## TIER 4 — LAUNCH CONSOLE & LAUNCH RUN

### Runner Status Messages

- **Intent:** Communicate launch-run state
- **Stakes:** High
- **Structure:** Short status fragment
- **Tone range:** Neutral, factual

### Launch Rules Display

- **Intent:** Show do/skip reasoning
- **Stakes:** Medium
- **Structure:** Bullet list, short fragments
- **Tone range:** Factual, direct

### Run Prompt (Generated)

- **Intent:** Instruct the AcmeLaunch Runner
- **Stakes:** High
- **Structure:** Structured markdown, explicit instructions
- **Tone range:** Technical, precise (not user-facing)

---

## TIER 5 — DEV TOOLS (Dev Console)

### Dev Tool Labels & Status

- **Intent:** Developer information
- **Stakes:** Low
- **Structure:** Technical labels
- **Tone range:** Technical, unconstrained (developer-only surface)

Notes:

- Dev Console is the only surface where copy constraints are relaxed
- These are never shown to end users

---

## Hard Rules Across All Surfaces

1. No copy surface may contradict the Master Copy Strategy
2. Higher-stakes surfaces always take precedence over lower-stakes
3. If unsure which surface applies, default to the higher-stakes rule
4. New surfaces must be added to this map before copy is written
