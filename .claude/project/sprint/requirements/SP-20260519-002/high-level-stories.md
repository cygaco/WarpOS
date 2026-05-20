# High-Level Stories — Polish public-facing repo surface for job-application audience

**Sprint:** `SP-20260519-002`
**PRD:** `.claude/project/sprint/requirements/SP-20260519-002/prd.md`

> High-level stories use the `H-N` id convention enforced by `scripts/hooks/requirement-format-guard.js`.

## H-1 — Coherent project identity in PROJECT.md

**As** a hiring manager opening `cygaco/WarpOS`
**I want** `PROJECT.md` to describe what WarpOS actually is in under 60 seconds
**So that** I am not confused by a doc that talks about a different product (Jobzooka)

Linked requirements: `R-1`.
Linked granular stories: `S-1`.

## H-2 — Honest version and capability counts in README

**As** a hiring manager evaluating WarpOS
**I want** the README to claim a version, a skill count, and a hook count that match the actual repo
**So that** I trust the doc — if the headline numbers are wrong, everything below is suspect

Linked requirements: `R-2`.
Linked granular stories: `S-2`.

## H-3 — No contradictory or obsolete framing docs at the root

**As** a recruiter scanning the repo file list
**I want** to not see a `WarpOS.md` that contradicts the README by claiming a Next.js + Supabase + Stripe stack
**So that** I get one consistent answer to "what is this thing"

Linked requirements: `R-3`, `R-4`.
Linked granular stories: `S-3`, `S-4`.

## H-4 — Clean repo root: no abandoned working artifacts

**As** a recruiter scanning the repo file list
**I want** to not see files that look like in-progress drafts or session dumps in the project root
**So that** the repo reads as a shipped product, not a scratch directory

Linked requirements: `R-5`.
Linked granular stories: `S-5`.

## H-5 — Honest metadata in machine-readable files too

**As** a maintainer (and any future user clicking through GitHub's file preview)
**I want** `version.json` to report the actual release date of the current version
**So that** automation, downstream consumers, and casual readers all see a consistent story

Linked requirements: `R-6`.
Linked granular stories: `S-6`.

## H-6 — USER_GUIDE.md is not blatantly out of date (optional)

**As** a recruiter who clicks into USER_GUIDE.md
**I want** the references to skills and modes to still match the codebase
**So that** the guide doesn't actively mislead

Linked requirements: `R-7`.
Linked granular stories: `S-7`.
