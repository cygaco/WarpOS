# Jobzooka — User Cohorts

This document defines the user segments Jobzooka serves, their needs, behaviors, and what success looks like for each.

---

## Primary Audience

Job seekers with an existing resume who want AI-assisted, market-driven application materials.

**Common traits:**

- Have at least a rough resume (even outdated)
- Are in the US job market (or targeting US roles)
- Are comfortable using web-based tools
- Want speed and quality over manual crafting
- Value data-driven decisions over gut feeling

---

## Cohort 1: Active Searchers

### Who They Are

Currently job hunting. May be unemployed, in notice period, or actively interviewing. High urgency.

### Needs

- Speed: "I need materials ready NOW"
- Volume: "I need to apply to many jobs quickly"
- Targeting: "I want each application to be tailored, not generic"
- Market awareness: "What are companies actually looking for?"

### Behaviors

- Will complete the full wizard in one session if the flow is smooth
- Most likely to purchase rocket packs (need targeted resumes for multiple categories)
- Most likely to use auto-apply (step 10)
- Will revisit to re-run market analysis as their search evolves

### Success

- Completed wizard in under 60 minutes
- Generated 3+ targeted resume variants
- Launched auto-apply or manually applied with generated materials
- Feels confident their materials match market demand

### Pain Points

- "I've been sending the same resume to every job"
- "I don't know which keywords to use"
- "Applying takes forever — I spend 30 minutes per application"
- "I have no idea if my resume is competitive"

---

## Cohort 2: Career Changers

### Who They Are

Currently employed but looking to shift roles, industries, or seniority levels. Medium urgency. Often insecure about positioning.

### Needs

- Positioning: "How do I frame my experience for a different field?"
- Validation: "Is this career move realistic?"
- Gap analysis: "What am I missing for this new direction?"
- Confidence: "Am I competitive in this new market?"

### Behaviors

- Spend more time in onboarding (career direction is the key decision)
- Engage deeply with Deep-Dive QA (step 6) — their answers bridge the gap between old and new careers
- Value discovery recommendations highly (non-obvious pivots)
- May generate fewer targeted resumes but spend more time customizing skills

### Success

- Market analysis reveals viable categories they hadn't considered
- Competitiveness score shows they're more competitive than expected
- Targeted resume successfully repositions their experience for the new direction
- Mining Q&A surfaced transferable experience they forgot to highlight

### Pain Points

- "I don't know how to translate my experience to a new field"
- "My resume screams [old field] — I need it to say [new field]"
- "I feel like I'm starting over even though I have 10 years of experience"
- "Am I qualified for this, or am I dreaming?"

---

## Cohort 3: Passive Lookers

### Who They Are

Employed and not urgently searching, but curious about their market position. Low urgency. Exploratory mindset.

### Needs

- Market intelligence: "What's out there for someone like me?"
- Benchmarking: "Am I being paid fairly?"
- Preparedness: "I want materials ready in case something comes up"
- Low commitment: "I don't want to spend hours on this"

### Behaviors

- May complete onboarding + READY phase and stop
- Engage with market analysis and competitiveness scoring more than resume generation
- Less likely to use auto-apply
- May return weeks later to continue the wizard
- Free tier is often sufficient for their needs

### Success

- Got market intelligence in under 15 minutes
- Understands their compensation position
- Has a general resume ready if needed
- Didn't feel pressured to buy rockets

### Pain Points

- "I haven't updated my resume in years"
- "I have no idea what my market value is"
- "I want to be ready to jump if the right opportunity appears"
- "I don't want to commit to a full job search right now"

---

## Cohort 4: Specialists & Niche Roles

### Who They Are

Highly specialized professionals (engineers, data scientists, niche consultants) whose resumes need precise keyword matching and technical accuracy.

### Needs

- Keyword precision: "Generic keywords won't work — I need exact tech stack matches"
- Technical accuracy: "Don't dumb down my experience"
- Category clarity: "Contract data engineering is NOT the same as full-time data engineering"
- ATS optimization: "My resume gets filtered out before a human sees it"

### Behaviors

- Spend significant time in Skills Curation (step 7) — toggling specific technical skills
- Value the keyword frequency data from market analysis
- Generate more targeted resume variants (different tech stacks = different variants)
- Most likely to re-run market analysis with refined queries

### Success

- Keywords match actual job listings, not generic industry terms
- Each targeted resume emphasizes the right technical stack for that category
- ATS-safe formatting passes automated screening
- Skills they excluded don't appear in generated materials

### Pain Points

- "AI resume tools make me sound like a generalist"
- "They keep adding buzzwords I don't actually know"
- "My resume should say 'Kubernetes' not 'container orchestration'"
- "I need different versions for different tech stacks"

---

## Cohort 5: Recent Graduates / Early Career

### Who They Are

0–3 years of experience. Limited resume content. May not know their market well.

### Needs

- Content amplification: "I don't have much experience — help me make the most of what I have"
- Market education: "What roles am I actually qualified for?"
- Guidance: "What should I even be applying to?"
- Confidence: "Do I have a chance?"

### Behaviors

- Shorter resumes mean faster parsing and simpler profiles
- Discovery recommendations are highly valuable (they don't know what's out there)
- Mining Q&A is crucial — surfaces projects, coursework, and skills they undervalue
- Less likely to need many targeted variants (narrower focus)
- Most price-sensitive — free tier matters most to this cohort

### Success

- Discovered job categories they didn't know existed
- Mining Q&A surfaced internship projects and coursework worth highlighting
- Resume positions them as a strong entry-level candidate
- Competitiveness score gave them confidence to start applying

### Pain Points

- "I only have one internship and a few projects"
- "Every job listing wants 3+ years of experience"
- "I don't know what employers actually look for in new grads"
- "My resume is half a page"

---

## Cross-Cohort Design Principles

1. **The wizard must work for all cohorts.** No cohort-specific branching in the flow.
2. **Speed scales with urgency.** Active searchers should be able to blast through. Passive lookers can stop after READY.
3. **Free tier is meaningful.** Every cohort gets real value from 150 rockets. The gate is on volume, not core functionality.
4. **No patronizing.** Specialists know their field. Don't over-explain. Don't suggest irrelevant keywords.
5. **Mining Q&A is the equalizer.** It surfaces hidden strengths for career changers and early career. It refines positioning for specialists. It's optional for those who don't need it.
