# Requirement Review Process

<!-- GUIDANCE: How specs get reviewed and approved before implementation begins. Prevents building the wrong thing. -->

## Review Stages

### 1. Self-Review Checklist

Before requesting review, verify:

- [ ] All required PRD sections are filled (no empty sections without `n/a`)
- [ ] JTBDs are platform-neutral
- [ ] Feature Description stands alone (no references to "current state")
- [ ] Every HL story has acceptance criteria
- [ ] Every granular story has Given/When/Then + edge cases
- [ ] INPUTS matches the data model (types.ts or equivalent)
- [ ] COPY covers all user-facing strings (buttons, toasts, errors, empty states)
- [ ] Cross-references are valid (PRD ↔ Stories ↔ Glossary)

### 2. Peer Review

<!-- GUIDANCE: Who reviews? What are they checking? How do they signal approval? -->

### 3. Spec Drift Detection

<!-- GUIDANCE: How do you detect when code and specs diverge? Automated checks? Manual review cadence? -->
