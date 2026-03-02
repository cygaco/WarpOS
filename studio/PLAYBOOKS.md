# Playbooks

> Validated patterns. Copy, adapt, deploy. Don't reinvent.
> Every pattern here has been tested in a real product context.

---

## How to Use This File

When starting something new, check here first. If a playbook exists, follow it. If you learn something new, add it. This file compounds in value over time.

---

## Product Playbooks

### Rapid Validation Loop
**Use when:** Testing a new product idea before building anything.

1. Define the problem hypothesis in one sentence
2. Define the ICP (1 person, not a segment)
3. Identify the riskiest assumption
4. Design the cheapest test that would invalidate it
5. Run the test with a target (e.g. target: under 1 week, under $500)
6. Document result in `/research/experiments/`
7. Decision: kill, pivot, or proceed to build

**Kill criteria:** Less than 3 out of 10 target users say they'd pay for this today.

---

### MVP Scoping
**Use when:** Greenlit to build.

1. Write the "one job" — what does this product do, for whom, in one sentence?
2. List every feature you think it needs
3. Cross off everything that isn't required to deliver the one job
4. What remains is the MVP
5. Time-box: 2 weeks max for first deployable version

---

### New Product Onboarding to Warp
**Use when:** Starting a new product inside the studio.

1. Create `/products/[name]/` directory
2. Create `PRODUCT.md` (see template)
3. Wire to shared auth
4. Wire to shared DB (or create product schema in shared DB)
5. Set up product analytics feed to data warehouse
6. Add product to Warp's product inventory

---

## Technical Playbooks

### Adding a New Automation
1. Define: trigger → action → output
2. Define failure behavior (retry? alert? silent fail?)
3. Build in n8n (or equivalent)
4. Test with real data, not mocks
5. Add to Automation Inventory in WARP.md
6. Set up monitoring/alerting

---

### Adding a New Claude Integration
1. Define the prompt job in one sentence
2. Write the system prompt (use Warp system prompt conventions)
3. Define input/output contract (what goes in, what comes out)
4. Test with 10 real examples before shipping
5. Add to AI Orchestration Patterns in WARP.md
6. Set up token usage logging if high-frequency

---

## Ops Playbooks

### Hiring a Co-Founder
1. Write the role spec (use `/ops/hiring/` template)
2. Define: commitment level, equity tier, responsibilities
3. 2-week paid trial project before any equity conversation
4. Decision criteria: do they raise the average?

---

## Experiment Playbooks

### Structured Experiment Log
Every experiment gets a file in `/research/experiments/[date]-[name].md`:

```
Hypothesis: [one sentence]
Riskiest assumption: [what would kill this]
Test design: [what we did]
Success criteria: [defined before running]
Result: [what happened]
Learning: [what we now know]
Decision: [kill / pivot / proceed]
Cost: [$X, X days]
```

---

*Last updated: [DATE]*
