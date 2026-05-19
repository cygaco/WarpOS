# High-Level Stories — Consolidate ROADMAP.md and WARPOS_ROADMAP.md

**Sprint:** `SP-20260518-009`
**PRD:** `prd.md`

## H-1 — Single canonical roadmap

**As** the framework owner (canonical-repo maintainer)
**I want** exactly one roadmap file at canonical repo root
**So that** I don't maintain two parallel roadmap files (current `ROADMAP.md` scaffold + `WARPOS_ROADMAP.md` backlog) that can silently drift apart and require dual updates.

Linked granular stories: `S-1`, `S-2`, `S-4`.
Linked requirements: `R-1`, `R-3`.

## H-2 — Consumer behavior preserved

**As** a downstream WarpOS consumer
**I want** my project's `ROADMAP.md` to remain my product roadmap
**So that** `/warp:update` never overwrites it with framework backlog content. The consolidation is invisible to my install — I still receive a clean scaffold from `generate-roadmap-scaffold.js`, and `promote.js` continues to exclude `ROADMAP.md` from propagation.

Linked granular stories: `S-2`, `S-3`.
Linked requirements: `R-2`, `R-4`, `R-5`.
