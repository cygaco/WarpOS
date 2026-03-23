# consumer product — Product Status

**Last synced:** 2026-03-23
**Branch:** master
**Latest commit:** 909f1c0

## Recent Commits

909f1c0 Redesign onboarding: resume-first landing, one-question-per-screen, smart defaults
d9f3d54 Merge pull request #2 from cygaco/claude/editable-dummy-profile-plFhr
1dcd09b Add editable dummy profile with persistent overrides in DM mode
3b7df63 Remove dead code, add slash commands and hooks
60c7abd Security hardening: fix 8 audit findings, upgrade deps

## Current Step Definitions

| Step | Phase | Name |
|------|-------|------|
| O1 | Onboarding | Resume (landing dropzone) |
| O2 | Onboarding | Preferences (7 sub-steps: direction, work type, comp, location, profile, dealbreakers, about you) |
| O3 | Onboarding | Profile verify + confirm defaults |
| R1 | READY | Search (BD API job collection) |
| R2 | READY | Analyze (two-phase market pipeline) |
| A1 | AIM | Deep Dive (mining Q&A) |
| A2 | AIM | Skills (curation) |
| A3 | AIM | Resumes (master + targeted) |
| A4 | AIM | LinkedIn & Forms |
| A5 | AIM | Download |
| F | FIRE | Auto-apply (Chrome extension) |

## Key Changes This Sync

- Onboarding redesigned: resume-first landing, one-question-per-screen (7 sub-steps)
- Background resume parsing while user answers preference screens
- Smart comp adaptation (salary slider for FT, hourly for PT/Contract)
- Target persona defaults (5 dealbreakers + 7 EEO demographics pre-filled)
- AIApply competitive analysis documented (28 screenshots)
- /flag skill for quick requirement capture
- Playwright: 53 tests passing
- Credits/Stripe scaffolding committed (needs price IDs)
