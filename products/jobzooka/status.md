# consumer product — Product Status

**Last synced:** 2026-03-23
**Branch:** master
**Latest commit:** ebfeb44
**Total commits:** 46

## Recent Commits

- `ebfeb44` Security hardening + resume UX overhaul from e2e walkthrough
- `ede6c90` Audit fixes + onboarding UX polish
- `909f1c0` Redesign onboarding: resume-first landing, one-question-per-screen, smart defaults
- `d9f3d54` Merge pull request #2 — editable dummy profile
- `1dcd09b` Add editable dummy profile with persistent overrides in DM mode

## Current Step Definitions

| Step | Phase      | Name                                                   |
| ---- | ---------- | ------------------------------------------------------ |
| O1   | Onboarding | Resume (landing dropzone)                              |
| O2   | Onboarding | Preferences (7 sub-steps)                              |
| O3   | Onboarding | Profile verify + confirm defaults                      |
| R1   | READY      | Search (BD API job collection)                         |
| R2   | READY      | Analyze (two-phase market pipeline)                    |
| A1   | AIM        | Deep Dive (mining Q&A — progressive disclosure)        |
| A2   | AIM        | Skills (curation + title filtering)                    |
| A3   | AIM        | Resumes (master + smart general + targeted, streaming) |
| A4   | AIM        | LinkedIn & Forms                                       |
| A5   | AIM        | Download                                               |
| F    | FIRE       | Auto-apply (Chrome extension)                          |

## Key Changes This Sync

- Security hardening: email regex, console log gating, extension manifest, Stripe metadata validation
- Resume UX overhaul: collapsed cards, copy hero buttons, streaming generation, smart General (skip when master is short)
- Deep Dive progressive disclosure: show 3 questions, expand for more
- Skills filter: job titles excluded from recommended keywords (prompt + code)
- Soft gate bypassed in DM mode for unblocked e2e testing
- Security audit score: 8.5/10, no critical vulns
