# Jobzooka — Core Brief

---

## One-Liner

Jobzooka turns your resume into a targeted job search machine — market-aware resumes, LinkedIn content, and one-click applications, all driven by real job market data.

---

## What It Is

A 10-step guided wizard that takes a single resume and produces:

- Real-time market intelligence from LinkedIn job listings
- A master resume, a general resume, and targeted resume variants per job category
- Optimized LinkedIn profile content (headline, about, experience)
- Pre-filled form answers for common application questions
- An auto-apply workflow via our Chrome extension (Jobzooka Launcher)

The user uploads a resume and sets preferences. Jobzooka scrapes real job listings, analyzes the market, asks clarifying questions, and generates application materials tailored to what the market actually demands.

---

## What It Is NOT

- **Not a job board.** Jobzooka does not host job listings. It uses Bright Data to scrape LinkedIn and processes the data for intelligence.
- **Not a resume template tool.** Resumes are generated from content, not templates. There is no drag-and-drop editor.
- **Not an AI chatbot.** There is no conversational interface. The wizard is structured and linear.
- **Not a black box.** The extension can auto-apply but the user sets the heuristics that control what gets applied to and what gets skipped. Full transparency into every decision.

---

## Vision

Eliminate the manual grind of job searching. A job seeker should be able to go from "I have a resume" to "I'm applying to the right jobs with tailored materials" in a single focused session.

---

## Core Pillars

### 1. Market-Driven

Every output is grounded in real job listing data, not generic advice. Resume keywords come from actual postings. Job categories reflect real market demand. Compensation ranges come from real listings.

### 2. Targeted, Not Generic

One resume does not fit all. Jobzooka generates category-specific resume variants that emphasize the skills, experience, and keywords each market segment values most.

### 3. User Control

The user reviews and approves everything. Profile data is editable. Skills can be included or excluded. Categories can be ranked. The extension pauses before every submission.

### 4. Speed

The goal is a single session from resume to applications. The wizard is linear, each step feeds the next, and no step requires the user to leave the app.

### 5. Privacy-First

- Resume data encrypted at rest (AES-GCM in localStorage)
- API keys never exposed to the client
- No data shared with third parties beyond job scraping
- User can export and delete all data at any time

---

## Core Tensions

### Automation vs Control

Jobzooka automates heavily (market analysis, resume generation, form pre-fill) but never removes the user from the loop. The tension: every automation must feel like a shortcut, not a loss of agency.

### Depth vs Speed

The wizard is thorough (10 steps, deep-dive Q&A, skill curation) but must feel fast. The tension: gathering enough data to produce quality output without making the process feel like a chore.

### Free vs Paid

Free tier (150 rockets) covers core value: market analysis + 2 targeted resumes. Premium features (more categories, LinkedIn, re-runs) require purchase. The tension: free tier must deliver real value without feeling crippled.

### Specificity vs Breadth

Market analysis produces up to 10 distinct job categories. Targeted resumes are per-category. The tension: being specific enough to be useful without overwhelming users with too many options.

---

## Target Audience

Job seekers who:

- Have an existing resume (even a rough one)
- Are actively searching or about to start
- Want their materials to reflect what the market actually wants
- Are comfortable with AI-assisted tools
- Value speed over manual crafting

**Default persona assumptions** (user confirms or overrides during onboarding):

- US citizen, authorized to work in the US, no sponsorship needed
- Has a driver's license
- Deal-breakers: unpaid/spec work, no benefits, return-to-office mandate, required relocation, required travel

See `USER_COHORTS.md` for detailed segmentation.

---

## Phase Model

The wizard uses a military-themed three-phase model after onboarding:

| Phase     | Steps | Metaphor       | User Mindset                        |
| --------- | ----- | -------------- | ----------------------------------- |
| **READY** | 4–5   | Reconnaissance | "Show me what's out there"          |
| **AIM**   | 6–9   | Preparation    | "Help me prepare my best materials" |
| **FIRE**  | 10    | Execution      | "Let's apply"                       |

Onboarding (steps 1–3) is pre-phase — gathering the inputs the wizard needs to operate.

---

## Success Metrics

A successful Jobzooka session means the user:

1. Uploaded a resume and it was correctly parsed
2. Received market analysis grounded in real job data
3. Generated at least one targeted resume variant
4. Has materials ready to apply (resume + LinkedIn + form answers)
5. Optionally: launched auto-apply and submitted applications

---

## Current Limitations

- **LinkedIn-only job data.** Bright Data scrapes LinkedIn only. No Indeed, Glassdoor, or other sources.
- **US-focused.** Location data and market intelligence are US-centric (US metros, USD compensation).
- **No real-time updates.** Market data is a snapshot at search time. No alerts or monitoring.
- **Single-session model.** No persistent job tracking, application history, or follow-up workflows.
- **Vercel Hobby plan.** 60-second function timeout limits complex operations.
- **Contract salary data.** BD returns annual salaries for contract roles. Hourly rates extracted via regex from descriptions — imprecise.
