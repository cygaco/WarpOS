---
description: App structure — routes, components, libs, how they connect
---

# /maps:architecture — Architecture Map

Visualize the application structure: API routes, page components, library modules, and their connections.

## Input

`$ARGUMENTS` — optional flags:
- `--refresh` — re-scan src/, rebuild `.claude/reference/architecture-map.md`
- `--terminal` — render as ASCII art (default)
- `--file` — write to `.claude/maps/architecture.txt`
- `--html` — write styled HTML to `.claude/maps/architecture.html`

## Procedure

### Step 1: Scan directories

- `src/app/api/` — API routes (claude, jobs, auth, session, rockets, stripe, extension, test)
- `src/app/` — page.tsx (main orchestrator)
- `src/components/pages/` — composite pages (OnboardingPage, AimPage, ReadyPage)
- `src/components/steps/` — step components (Step1 through Step13)
- `src/components/ui/` — atomic UI (Btn, Card, Inp, Sel, etc.)
- `src/lib/` — core logic modules
- `extension/` — Chrome extension files

### Step 2: Map connections

- Which components import which lib modules
- Which API routes use which lib modules
- Which steps belong to which pages
- Client → API route call graph (from api.ts)

### Step 3: Render

Layered architecture:

```
┌─── Pages ──────────────────────────────┐
│ OnboardingPage  AimPage  ReadyPage     │
├─── Steps ──────────────────────────────┤
│ Step1..Step3  Step4..Step5  Step6..S10  │
├─── UI ─────────────────────────────────┤
│ Btn  Card  Inp  Sel  ...               │
├─── Lib ────────────────────────────────┤
│ api  prompts  types  storage  utils    │
├─── API Routes ─────────────────────────┤
│ /claude  /jobs  /auth/*  /session      │
└────────────────────────────────────────┘
```
