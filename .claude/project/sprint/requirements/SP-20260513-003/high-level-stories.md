# High-Level Stories — Organic skill use by agents — research + mechanism

**Sprint:** `SP-20260513-003`
**PRD:** `.claude/project/sprint/requirements/SP-20260513-003/prd.md`

> High-level stories use the `H-N` id convention enforced by `scripts/hooks/requirement-format-guard.js`.

## H-1 — Alpha as organic skill user

**As** Alex α (and, where applicable, β / γ / δ)
**I want** to recognize when a user's request matches an existing skill's purpose and invoke that skill instead of re-deriving the procedure inline
**So that** the ~120-skill library becomes high-leverage by default, my output quality is consistent across sessions, and known-good procedures aren't silently replaced by ad-hoc reasoning

Linked granular stories: `S-1`, `S-2`, `S-3`, `S-4`.
Linked requirements: `R-1`, `R-2`, `R-3`, `R-4`, `R-7`.

## H-2 — User no longer has to remember slash commands

**As** the user
**I want** Alex to pick the right skill when my natural-language request matches one, without me typing the slash command
**So that** my manual-prompting overhead drops, I don't need to memorize the skill catalog, and the operating system feels like an operating system — not a command-line cheat sheet

Linked granular stories: `S-2`, `S-3`, `S-4`.
Linked requirements: `R-2`, `R-3`, `R-4`, `R-6`, `R-8`.

## H-3 — Operator as telemetry consumer

**As** the operator (running `/check:patterns`, reviewing adherence, tuning the system)
**I want** to see — for every prompt — which skills were suggested by the ranker and which were actually invoked by the agent
**So that** I can measure adherence rate, detect regressions when CLAUDE.md or the ranker drifts, and feed data back into skill-description audits and ranker-weight tuning over time

Linked granular stories: `S-5`, `S-6`.
Linked requirements: `R-5`, `R-8`.
