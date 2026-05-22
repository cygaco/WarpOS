# High-Level Stories — /product:import

**Sprint:** `SP-20260520-002`
**PRD:** `.claude/project/sprint/requirements/SP-20260520-002/prd.md`

> High-level stories use the `H-N` id convention enforced by `scripts/hooks/requirement-format-guard.js`.

## H-1 — One skill that emits a portable interview

**As** an operator with a product trapped in another tool (ChatGPT thread, older repo, scattered notes)
**I want** one skill that emits a paste-friendly questionnaire I can hand to another AI session
**So that** the session that already knows the product can tell me what we're building, without me transcribing the whole interview by hand into a fresh Claude Code project

Linked requirements: `R-1`, `R-2`, `R-5`, `R-6`.
Linked granular stories: `S-1`, `S-2`, `S-3`, `S-5`.

## H-2 — Section parity so answers feed bootstrap losslessly

**As** an operator who is going to run `/product:bootstrap` next
**I want** the questionnaire to mirror `/product:bootstrap`'s section structure exactly
**So that** the answers ingest directly via `--answers-file` and the brief renders every section without manual JSON juggling

Linked requirements: `R-4`, `R-7`, `R-10`.
Linked granular stories: `S-4`, `S-6`, `S-7`.

## H-3 — Project context auto-seeded into the preamble

**As** an operator who has already typed the project name into `package.json` and `README.md`
**I want** the skill to read those files and pre-fill the questionnaire preamble with project name, stack hints, and recent activity
**So that** I don't repeat myself when handing the questionnaire to another session, and the answering session has grounding before answering

Linked requirements: `R-3`.
Linked granular stories: `S-2`.

## H-4 — Paste-back parsing instead of manual JSON authoring

**As** an operator who just got 8 paragraphs of answers back from ChatGPT
**I want** a `--parse` companion mode that converts that pasted markdown into the JSON `/product:bootstrap --answers-file` expects
**So that** I don't have to hand-write the JSON object myself — which is the friction that motivated this whole sprint

Linked requirements: `R-7`, `R-9`.
Linked granular stories: `S-7`, `S-8`.

## H-5 — Observability via telemetry and paths-registered output

**As** a maintainer auditing how `/product:import` gets used over time
**I want** lifecycle events in `paths.eventsFile` and the output directory registered in `paths.json`
**So that** downstream skills can find the questionnaire automatically and `/check:patterns` can spot recurring failure modes

Linked requirements: `R-8`, `R-9`.
Linked granular stories: `S-6`.
