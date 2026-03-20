# consumer product — Product Status

## Current State

- **Branch**: `master`
- **Total commits**: 41
- **Stage**: Building MVP
- **Last sync**: 2026-03-19

## Recent Commits

```
3b7df63 Remove dead code, add slash commands and hooks
60c7abd Security hardening: fix 8 audit findings, upgrade deps
7461c05 Add warp-init and warp-sync slash commands
fef9e98 Add shared slash commands: /dm, /lens, /deploy, /status, /step, /handoff
bb3fe31 Fix DM panel sizing and ProfileEditor z-index clipping
```

## Steps (11-step wizard)

| Step | Name      | Phase      | Route |
| ---- | --------- | ---------- | ----- |
| 1    | Resume    | Onboarding | 1     |
| 2    | Prefs     | Onboarding | 2     |
| 3    | Profile   | Onboarding | 3     |
| 4    | Search    | READY      | 4     |
| 5    | Analyze   | READY      | 5     |
| 6    | Deep Dive | AIM        | 6     |
| 7    | Skills    | AIM        | 7     |
| 8    | Resumes   | AIM        | 8     |
| 9    | LinkedIn  | AIM        | 9     |
| 10   | Download  | AIM        | 10    |
| 11   | Launch    | FIRE       | 11    |

## Slash Commands (12)

**Product-specific**: `/dm`, `/qa`, `/step`, `/security-log`
**Shared**: `/lens`, `/deploy`, `/status`, `/hooks`, `/handoff`, `/warp-init`, `/warp-sync`, `/warp-check`

## Infrastructure Contributed to Warp

- Deus Mechanicus (dev tools hub)
- Warp Profiles (cross-product test data)
- Encrypted client storage (AES-GCM)
- Two-phase AI pipeline (MARKET_PREP -> MARKET)
- Pipeline tracing
- Claude Code hooks (8): format, typecheck, lint, secret-guard, session-start, session-stop, prompt-logger, compact-saver
- 12 slash commands (skills)
- Automatic session handoff (Stop -> SessionStart chain)
- Concurrency-safe WarpOS sync protocol

## Known Issues

- BD returns annual salaries for contract roles (no hourly rate data)
- Component filenames don't match step numbers (off-by-2 from old architecture)
