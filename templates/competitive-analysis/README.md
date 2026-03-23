# Competitive Analysis Template

Structured competitor teardown format. Extracted from consumer product's AIApply analysis (28 screenshots, full flow documentation).

## Process

1. **Sign up for competitor** — go through their full onboarding, screenshot every screen
2. **Extract screenshots** — if from a .docx, unzip and pull from `word/media/`
3. **Document the flow** — table with step #, screen name, what it asks
4. **Analyze strengths/weaknesses** — what they do well, what they miss
5. **Map the gap** — capability matrix (us vs them)
6. **Identify what to steal** — UX patterns worth adopting
7. **Identify what NOT to copy** — anti-patterns to avoid

## Template

```markdown
# [Product] Competitive Analysis — [Market] (Date)

## Executive Summary

[One paragraph: market state, our opportunity]

## Competitor Breakdown

### [Competitor Name] (domain)

- **Model:** [How it works]
- **Onboarding:** [Step count, time to value]
- **Intelligence:** [How smart is their matching]
- **Pricing:** [Tiers]
- **Strengths:** [What they do well]
- **Weaknesses:** [Where they fall short]

#### Onboarding Flow ([N] screens)

Screenshots: `docs/screenshots/[competitor]/step-1.png` through `step-N.png`

| #   | Screen | What it asks |
| --- | ------ | ------------ |
| 1   | ...    | ...          |

## Market Gap Analysis

| Capability | Competitor A | Competitor B | Us  |
| ---------- | ------------ | ------------ | --- |

## What to Steal

[UX patterns worth adopting]

## What NOT to Copy

[Anti-patterns to avoid]
```

## Screenshot Storage

```
docs/screenshots/
  [competitor-name]/
    step-1.png
    step-2.png
    ...
```
