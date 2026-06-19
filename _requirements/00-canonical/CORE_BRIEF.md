# AcmeLaunch — Core Brief

---

## One-Liner

AcmeLaunch turns your rough product idea into a launch-ready operating plan — audience-aware milestones, channel-ready assets, and a guided launch run, all driven by real launch-landscape research.

---

## What It Is

A 10-step guided wizard that takes a single idea brief and produces:

- Real-time landscape research from public audience, channel, and competitor signals
- A master launch plan, an overview plan, and segment-specific plan variants per audience segment
- Channel-ready launch assets (announcement copy, landing-page content, email sequences)
- Pre-filled follow-up templates for common customer questions
- A guided launch run via our companion runner (AcmeLaunch Runner)

The founder submits an idea brief and sets constraints. AcmeLaunch researches real launch signals, maps the landscape, asks clarifying questions, and generates a launch plan and assets tailored to what the market actually rewards.

---

## What It Is NOT

- **Not a project-management clone.** AcmeLaunch does not hand you an empty task board. It produces a research-grounded plan — milestones and tasks derived from your idea and the launch landscape.
- **Not a template library.** Plans and assets are generated from your idea and research, not filled-in templates. There is no drag-and-drop document editor.
- **Not a social scheduler.** There is no post queue and no conversational interface. The wizard is structured and linear; the launch run sequences real launch actions, not just scheduled posts.
- **Not a CRM.** AcmeLaunch captures launch-day leads and runs follow-up sequences, but it is not a system of record for ongoing customer relationships.
- **Not a black-box auto-launcher.** The runner can execute launch tasks, but the founder sets the heuristics that control what gets published and what gets held. Full transparency into every decision — it pauses before every public action.

---

## Vision

Take the guesswork and overwhelm out of launching. A founder should be able to go from "I have a rough idea" to "I have a launch-ready plan and I'm executing it" in a single focused session.

---

## Core Pillars

### 1. Research-Driven

Every output is grounded in real launch-landscape signals, not generic advice. Positioning language comes from real audience discussion. Audience segments reflect real demand. Channel choices come from where the audience actually is.

### 2. Segment-Specific, Not Generic

One plan does not fit every audience. AcmeLaunch generates segment-specific plan variants and asset packs that emphasize the message, channel, and proof each audience segment values most.

### 3. Founder Control

The founder reviews and approves everything. Profile data is editable. Milestones and tasks can be included or excluded. Segments can be selected. The runner pauses before every public action.

### 4. Speed

The goal is a single session from idea to launch-ready plan. The wizard is linear, each step feeds the next, and no step requires the founder to leave the app.

### 5. Privacy-First

- Plan and idea data encrypted at rest (AES-GCM in localStorage)
- API keys never exposed to the client
- No data shared with third parties beyond launch-signal research
- Founder can export and delete all data at any time

---

## Core Tensions

### Automation vs Control

AcmeLaunch automates heavily (landscape research, plan generation, asset drafting) but never removes the founder from the loop. The tension: every automation must feel like a shortcut, not a loss of agency.

### Depth vs Speed

The wizard is thorough (10 steps, deep-dive Q&A, scope curation) but must feel fast. The tension: gathering enough data to produce quality output without making the process feel like a chore.

### Free vs Paid

Free tier (150 rockets) covers core value: landscape research + 2 segment plans. Premium features (more segments, full asset packs, re-runs) require purchase. The tension: free tier must deliver real value without feeling crippled.

### Specificity vs Breadth

Landscape research produces up to 10 distinct audience segments. Segment plans are per-segment. The tension: being specific enough to be useful without overwhelming founders with too many options.

---

## Target Audience

Founders who:

- Have an early product idea (even a rough one)
- Are actively planning a launch or about to start
- Want their plan to reflect what the market actually rewards
- Are comfortable with AI-assisted tools
- Value speed over manual planning

**Default persona assumptions** (founder confirms or overrides during onboarding):

- Solo founder or small team, first launch (relaunch / beta / waitlist also supported)
- Operating on a fixed timeline and a limited budget
- Deal-breakers: vague positioning, no identified audience, channels they can't sustain, launch tactics that don't fit the product

See `USER_COHORTS.md` for detailed segmentation.

---

## Phase Model

The wizard uses a three-phase launch model after onboarding:

| Phase      | Steps | Metaphor          | Founder Mindset                          |
| ---------- | ----- | ----------------- | ---------------------------------------- |
| **PLAN**   | 4–5   | Landscape mapping | "Show me my launch landscape"            |
| **PREP**   | 6–9   | Preparation       | "Help me prepare my best plan and assets" |
| **LAUNCH** | 10    | Execution         | "Let's launch"                           |

Onboarding (steps 1–3) is pre-phase — gathering the inputs the wizard needs to operate.

---

## Success Metrics

A successful AcmeLaunch session means the founder:

1. Submitted an idea brief and it was correctly understood
2. Received landscape research grounded in real launch signals
3. Generated at least one segment-specific plan variant
4. Has launch materials ready (plan + assets + follow-up templates)
5. Optionally: started a guided launch run and executed launch tasks

---

## Current Limitations

- **Public-signal research only.** The research provider gathers public audience, channel, and competitor signals. No private analytics or paid market data.
- **US-focused.** Landscape data and benchmarks are US-centric (US audiences, USD benchmarks).
- **No real-time updates.** Landscape data is a snapshot at research time. No alerts or monitoring.
- **Single-session model.** No persistent launch tracking, run history, or long-term follow-up workflows.
- **Vercel Hobby plan.** 60-second function timeout limits complex operations.
- **Approximate benchmarks.** The research provider returns coarse figures; finer benchmarks (e.g., channel costs) are extracted from descriptions via regex — imprecise.
