# TRACE Requirements — Polish public-facing repo surface for job-application audience

**Sprint:** `SP-20260519-002`
**PRD:** `.claude/project/sprint/requirements/SP-20260519-002/prd.md`

> TRACE captures observability and provenance for the changes shipped in this sprint. Doc sprints have light TRACE — the `git log` IS the trace for content changes. We only need explicit TRACE entries for things that won't be visible by reading the diff.

## Trace Map

| Source | Requirement | Story | COPY | INPUT | ESD | Ticket | Code/File | Test | Release | Learning |
|---|---|---|---|---|---|---|---|---|---|---|
| User request 2026-05-19 | R-1 | S-1 | C-1 | IN-1 | — | T-…(S-1) | `PROJECT.md` | grep validation | sprint-close commit | "PROJECT.md drifted from product for 6 weeks before catch" |
| User request 2026-05-19 | R-2 | S-2 | C-2 | IN-2 | — | T-…(S-2) | `README.md` | manual count recheck | sprint-close commit | "README headline numbers drifted by 3 minor versions" |
| User request 2026-05-19 | R-3 | S-3 | C-3 | IN-3 | — | T-…(S-3) | `WarpOS.md` (deleted) | grep IN-3 | sprint-close commit | — |
| Post-S-1 read | R-4 | S-4 | — | — | — | T-…(S-4) | `AGENTS.md` | manual link follow | sprint-close commit | — |
| User request 2026-05-19 | R-5 | S-5 | C-5 | — | — | T-…(S-5) | 4 root files | visual `ls` review | sprint-close commit | "Working-doc accumulation pattern at repo root" |
| RELEASES.md cross-check | R-6 | S-6 | — | IN-4 | — | T-…(S-6) | `version.json` | cross-check IN-4 | sprint-close commit | "release-canonical.js skipped releasedAt on 0.8.0 — investigate" |
| Optional | R-7 | S-7 | — | — | — | T-…(S-7) | `USER_GUIDE.md` | spot-check | sprint-close commit | — |

## TR-1 — PROJECT.md rewrite provenance

**Event:** `git commit` touching `PROJECT.md`
**When:** S-1 ticket lands
**Captured fields:** commit hash, file diff (verifies content rewrite, not patch)
**Linked requirement:** `R-1`
**Linked story:** `S-1`
**Why we capture this:** PROJECT.md is shipped to downstream installs via the CLAUDE.md scaffold reference. The first non-Jobzooka version of this file is a load-bearing event for downstream consumer experience.

## TR-2 — README sync provenance

**Event:** `git commit` touching `README.md` AND `version.json` consistency
**When:** S-2 ticket lands
**Captured fields:** commit hash, version string in README matches `version.json#version` at HEAD
**Linked requirement:** `R-2`
**Linked story:** `S-2`
**Why we capture this:** Future README drift becomes detectable by re-running the same cross-check.

## TR-3 — version.json releasedAt fix + recurring-issue log

**Event:** `paths.recurringIssuesFile` append + `version.json` edit, both in same commit
**When:** S-6 ticket lands
**Captured fields:** issue id, version, old/new date, root-cause hypothesis
**Linked requirement:** `R-6`
**Linked story:** `S-6`
**Why we capture this:** The recurring-issue is the contract that someone will investigate why `release-canonical.js` skipped the field on the 0.8.0 cut. Without the log, the symptom recurs silently on 0.8.1.
