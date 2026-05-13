# High-Level Stories — /product:bootstrap skill — guided product brief in MD/HTML/DOCX

**Sprint:** `SP-20260513-001`
**PRD:** `prd.md`

> High-level stories use the `H-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`.

## H-1 — Founder runs one command, walks away with a thorough brief

**As** a founder starting a brand-new project
**I want** to invoke `/product:bootstrap`, answer a short bounded discussion, and walk away with a complete product brief in MD + HTML (+ DOCX if pandoc is installed)
**So that** I have a durable, shareable strategic foundation before sprint planning, designer handoff, or stakeholder review — without having to re-derive structure every time I start something new

Linked granular stories: `S-1`, `S-2`, `S-3`, `S-4`, `S-5`.
Linked requirements: `R-1`, `R-2`, `R-3`, `R-4`, `R-5`, `R-6`.

## H-2 — Strategist re-runs the skill without losing the old version

**As** a strategist iterating on a brief as the product sharpens
**I want** to re-run `/product:bootstrap` for the same slug and have the prior brief preserved under `<slug>/history/<ISO>/`
**So that** I can update the live brief safely, diff revisions, and walk back if a new direction doesn't hold up — without manually backing up files

Linked granular stories: `S-6`.
Linked requirements: `R-9`.

## H-3 — Teammate reads the brief in the format that fits the channel

**As** a teammate (PM, eng lead, investor) consuming the brief
**I want** Markdown for review-in-editor, HTML for sharing-as-link, and DOCX for editing-with-track-changes
**So that** the brief lives in the format each channel expects without me having to manually export — and any downstream skill (sprint planning, onboarding) can find the canonical brief via `paths.briefs*`

Linked granular stories: `S-3`, `S-4`, `S-5`, `S-7`, `S-8`.
Linked requirements: `R-4`, `R-5`, `R-6`, `R-8`.
