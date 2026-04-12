# PRD Template

<!-- GUIDANCE: This template defines the structure for every Product Requirements Document. PRDs define WHAT a feature is, WHAT it does, and HOW to build it. User stories live in separate files. -->

## Resolution Cascade

PRDs are written top-down across all features before drilling into stories:

1. **PRDs** (all features) — full feature spec, context, implementation map
2. **High-Level Stories** (all features) — intent and outcomes
3. **Granular Stories** (all features) — atomic behaviors and acceptance criteria

## File Structure

```
requirements/05-features/{feature-slug}/
  PRD.md          # Full feature spec (this template)
  COPY.md         # Microcopy companion (buttons, toasts, empty states, errors)
  HL-STORIES.md   # High-level stories (written in second pass)
  STORIES.md      # Granular stories (written in third pass)
  INPUTS.md       # Data inputs and validation rules
```

## Required Sections

Every PRD must include all of the following. Use `n/a` when a section does not apply.

### 1. Title + Classification

<!-- GUIDANCE: Feature name. MVP or Post-MVP. -->

### 2. Screen

<!-- GUIDANCE: Which page, screen, or phase this feature lives on. Include component names matching the GLOSSARY. -->

### 3. Context

<!-- GUIDANCE: Why this feature exists. The problem it solves. Who benefits and why it matters. -->

### 4. JTBD (Jobs To Be Done)

<!-- GUIDANCE: Use the format: "When [situation], I want to [motivation], so I can [expected outcome]." JTBDs must be platform-neutral — describe the outcome, not the delivery mechanism. -->

### 5. Emotional Framing

<!-- GUIDANCE: How the user should FEEL at each stage:
- Entry: How they feel arriving (anxious? eager? overwhelmed?)
- During: How the feature sustains engagement (progress? discovery? control?)
- Exit: How they feel leaving (confident? empowered? relieved?)
This guides UX decisions — loading states, celebrations, error handling. -->

### 6. Goals

<!-- GUIDANCE: Concrete, measurable outcomes. Each goal must be verifiable: "yes it was met" or "no it wasn't." -->

### 7. Assumptions

<!-- GUIDANCE: What we're taking as given without validation. User behavior, technical, business, and data assumptions. These become bugs when proven false. -->

### 8. Feature Description

<!-- GUIDANCE: The COMPLETE target state of the feature. Write as if building from scratch — no "before" or "after." A reader should understand the entire feature from this section alone. Describe: what it does (user perspective), complete behavior (inputs, processing, outputs), how it fits the product flow, key interactions and state changes, edge cases. -->

### 9. Dependencies / Blockers

<!-- GUIDANCE: What must exist before this feature can be built. Other features, APIs, data prerequisites, services. n/a if none. -->

### 10. UI Reference

<!-- GUIDANCE: ASCII wireframe, screenshot, or mockup reference. Include multiple views for complex features: default, loading, error, empty states. -->
