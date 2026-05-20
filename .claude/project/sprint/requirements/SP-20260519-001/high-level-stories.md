# High-Level Stories — ROADMAP + RELEASES ledger discipline

**Sprint:** `SP-20260519-001`
**PRD:** `prd.md`

> `H-N` ids per `scripts/hooks/requirement-format-guard.js`.

## H-1 — Future Alex reads ROADMAP.md once

**As** a future Alex session resuming work after `/clear` or context compaction
**I want** to read `ROADMAP.md` once at repo root and understand every sprint that has run (id, title, status, dates, release link)
**So that** I don't have to `ls .claude/project/sprint/sprints/` + cat each `current.yaml` to reconstruct project history.

Linked granular stories: `S-1`, `S-5`, `S-6`, `S-9`, `S-11`, `S-12`.
Linked requirements: `R-1`, `R-2`, `R-4`, `R-7`.

## H-2 — Downstream consumer reads RELEASES.md Versions

**As** a downstream consumer maintainer running `/warp:update --to X.Y.Z`
**I want** to read the `RELEASES.md` Versions section in isolation and see what changed in the version I just upgraded to
**So that** I can decide whether the change requires any consumer-side action without reading framework engineering detail.

Linked granular stories: `S-2`, `S-8`, `S-9`, `S-11`, `S-12`.
Linked requirements: `R-1`, `R-2`, `R-4`, `R-6`, `R-7`.

## H-3 — Engineering reviewer audits RELEASES.md Sprints

**As** an engineering reviewer (Alex or human) auditing release cadence
**I want** to read the `RELEASES.md` Sprints section and see every `RL-*` with status (prepared / deployed / rolled_back) and a one-line outcome, linked to the full YAML+changelog
**So that** I can detect drift like "we tagged 0.7.1 without a capsule" or "SP-X shipped to internal-canary but never deployed to main" at a glance.

Linked granular stories: `S-2`, `S-3`, `S-7`, `S-9`, `S-11`, `S-12`.
Linked requirements: `R-1`, `R-2`, `R-3`, `R-4`, `R-7`.

## H-4 — Next operator of /sprint:release is reminded

**As** the next person running `/sprint:release` (Alex or human)
**I want** the skill body and a warn-mode hook to remind me to update `RELEASES.md`, and the writer script to do it for me by default
**So that** I don't depend on remembering the convention; convention drift surfaces as a `warn` instead of as a silent gap that an LRN catches a month later.

Linked granular stories: `S-4`, `S-5`, `S-6`, `S-7`, `S-8`, `S-10`, `S-11`.
Linked requirements: `R-2`, `R-5`, `R-7`.
