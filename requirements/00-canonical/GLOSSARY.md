# [Project Name] — Glossary

Canonical terminology dictionary. Every product term used across all documentation is defined here. If a term is not listed, it is not a product term and should not be used without adding it here first.

---

## Product Identity

| Term | Definition |
|------|-----------|
| **[Product Name]** | <!-- One-sentence definition of the product --> |
| **[Core Flow Name]** | <!-- E.g., "The 7-step guided flow that takes a user from input through analysis to output" --> |
| **[Main View Name]** | <!-- E.g., "The post-onboarding command center with sections for each output type" --> |

---

## Steps / Screens

<!-- GUIDANCE: If your product has a multi-step flow, document every step with its canonical name, component file, and completion criteria:

| # | Display Name | Component File | Done When |
|---|-------------|---------------|-----------|
| 1 | [Name] | `ComponentName.tsx` | [Completion criteria] |
| 2 | [Name] | `ComponentName.tsx` | [Completion criteria] |

Note any naming debt (component file names that don't match logical step numbers).
-->

---

## Sections / Views

<!-- GUIDANCE: Post-flow sections. What's accessible from the main navigation?

| Section | What it hosts | Auth required |
|---------|--------------|---------------|
| **[Name]** | [Description] | Yes/No |
-->

---

## Composite Pages

<!-- GUIDANCE: Page components that host multiple steps or views:

| Term | Steps | Component File | Hosts |
|------|-------|---------------|-------|
| **[PageName]** | 1-3 | `PageName.tsx` | [What it contains] |
-->

---

## Feature-Specific Terminology

<!-- GUIDANCE: Terms that have specific, non-obvious meanings in your product. For each:
- The term
- Its scope (where it applies)
- What it means precisely
- Why it matters (common confusion to avoid)

Example:
| Term | Scope | What It Means |
|------|-------|---------------|
| **Recon Sweep** | Execution phase | The full scrape + analysis sequence. No user interaction. |
| **Analysis** | API calls only | Specifically the AI processing calls. A subset of the sweep. |
-->

---

## Data Types

<!-- GUIDANCE: Key data structures the product uses. For each:
- Name
- What it represents
- Key fields
- Where it lives (types.ts, schema, etc.)

| Type | Represents | Key Fields | Source |
|------|-----------|------------|--------|
| **SessionData** | All user state | personal, preferences, outputs... | `src/lib/types.ts` |
-->

---

## UI Components

<!-- GUIDANCE: Named UI components that appear in specs and code:

| Component | What it does | File |
|-----------|-------------|------|
| **[Name]** | [Purpose] | `Component.tsx` |
-->

---

## Naming Debt

<!-- GUIDANCE: Document any naming inconsistencies between code and product concepts. Component files with legacy numbering, renamed features that kept old file names, etc. This prevents confusion when specs reference "Step 3" but the component is called `Step5OldName.tsx`.

Example:
- `Step3Preferences.tsx` is actually step 2 (legacy numbering from before Step 2 was removed)
- `Step6Analysis.tsx` was originally step 6, now step 5 after renumbering
-->

---

## Rules

1. Every term used in specs MUST appear in this glossary
2. If code and glossary disagree on naming, update the glossary — then update the code
3. Component filenames in specs MUST match this glossary (not the filesystem if there's debt)
4. New terms must be added here BEFORE they appear in any spec
5. Deprecated terms stay in the glossary with a `[DEPRECATED]` tag and pointer to the replacement
