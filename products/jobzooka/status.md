# consumer product — Product Status

## Current State

- **Branch**: `pm-improvements` (11 commits ahead of master, NOT merged)
- **Stage**: Building MVP
- **Last sync**: 2026-03-19

## Recent Commits

```
7461c05 Add warp-init and warp-sync slash commands
fef9e98 Add shared slash commands: /dm, /lens, /deploy, /status, /step, /handoff
bb3fe31 Fix DM panel sizing and ProfileEditor z-index clipping
8554b98 40K Mechanicus theme for DM panel — brass/gold, resizable, bigger
18f23c9 Rename URL path to /?deusmechanicus, keep ?dummyplug as legacy alias
```

## Steps (11-step wizard)

1. Resume Upload
2. Preferences
3. Profile Verify
4. Search (R1)
5. Analyze (R2)
6. Deep Dive (A1)
7. Skills (A2)
8. Resumes (A3)
9. LinkedIn (A4)
10. Download (A5)
11. Launch (F)

## Infrastructure Contributed to Warp

- Deus Mechanicus (dev tools hub)
- Warp Profiles (cross-product test data)
- Encrypted client storage (AES-GCM)
- Two-phase AI pipeline (MARKET_PREP → MARKET)
- Pipeline tracing
- Claude Code hooks (8): format, typecheck, lint, secret-guard, session-start, session-stop, prompt-logger, compact-saver
- 11 slash commands (skills)
- Automatic session handoff (Stop → SessionStart chain)
- Concurrency-safe WarpOS sync protocol

## Known Issues

- BD returns annual salaries for contract roles (no hourly rate data)
- Component filenames don't match step numbers (off-by-2 from old architecture)
