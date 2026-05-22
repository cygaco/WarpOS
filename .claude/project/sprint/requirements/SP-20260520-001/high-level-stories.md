# High-Level Stories — `/product:clone`

**Sprint:** `SP-20260520-001`
**PRD:** `.claude/project/sprint/requirements/SP-20260520-001/prd.md`

> High-level stories use the `H-N` id convention enforced by `scripts/hooks/requirement-format-guard.js`.

## H-1 — One skill turns competitor intake into a cloneable deliverable

**As** an operator targeting a competitor
**I want** one skill that turns a `--name`, `--url`, and/or `--video` into a complete competitive analysis under `_docs/clones/<slug>/`
**So that** I can stand up a competing build in hours instead of days, and feed the output straight into `/product:bootstrap` or `/sprint:plan`

Linked requirements: `R-1`, `R-7`, `R-8`.
Linked granular stories: `S-1`, `S-11`, `S-12`.

## H-2 — Every claim in the deliverable is auditable

**As** an operator who will act on the deliverable
**I want** every voc quote traceable to source URL + retrieval timestamp, and every feature row tied to evidence-source URL
**So that** I can verify any claim by clicking through before sharing the analysis or committing engineering time to a fabricated feature

Linked requirements: `R-5`, `R-6`, `R-9`.
Linked granular stories: `S-5`, `S-6`, `S-8`.

## H-3 — Partial-failure deliverables instead of all-or-nothing aborts

**As** an operator running the skill against a hostile or rate-limited target
**I want** the skill to degrade gracefully — emit a deliverable with `[GAP]` markers for failed sources instead of aborting
**So that** one blocked review site does not destroy an otherwise-good run, and I can manually fill the gaps without re-running everything

Linked requirements: `R-4`, `R-10`, `R-11`.
Linked granular stories: `S-4`, `S-14`.

## H-4 — Multi-source exploration with bounded blast radius

**As** an operator who does not want my IP rate-limited or my project to become a spider
**I want** crawl depth capped at one level, review sources capped at `--max-review-sources`, and retries bounded
**So that** a single skill invocation finishes in a predictable time/cost envelope and never recursively crawls a target

Linked requirements: `R-2`, `R-3`, `R-4`, `R-11`.
Linked granular stories: `S-2`, `S-3`, `S-4`.

## H-5 — Downstream-ready output and self-registering paths

**As** an operator who will hand the output to `/product:bootstrap` or `/sprint:plan` next
**I want** the deliverable to use stable section headings matching the bootstrap family, and `paths.clones` / `paths.clonesCurrent` registered automatically on first emit
**So that** downstream commands find the deliverable without me hand-wiring paths and the section parser can pick up where this skill left off

Linked requirements: `R-7`, `R-8`, `R-9`.
Linked granular stories: `S-11`, `S-12`, `S-13`.
