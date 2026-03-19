# consumer product — CLAUDE.md

## What This App Does

Job search assistant: resume → targeted resumes, LinkedIn content, form answers, auto-apply. 11-step wizard (3 screens + onboarding), Next.js 16 + React 19 + TypeScript, Chrome extension for LinkedIn Easy Apply.

## Architecture

- **Framework**: Next.js 16.1.6 (Turbopack), React 19, TypeScript
- **Hosting**: Vercel (Hobby plan — 60s function timeout)
- **AI**: Claude API via `/api/claude` route (server-side, key never exposed)
- **Job Data**: Bright Data LinkedIn Jobs Scraper API via `/api/jobs` route
- **Rate Limiting**: Upstash Redis (`@upstash/ratelimit`)
- **Storage**: Encrypted localStorage (AES-GCM via Web Crypto API)
- **Styling**: CSS custom properties (corporate light theme), no Tailwind

## Dev Commands

```bash
npm run dev          # Start dev server (Turbopack, port 3000)
npm run build        # Production build
npm run lint         # ESLint
```

## UX Flow (11 internal steps, 3 screens + onboarding)

- **Onboarding** (steps 1-3): Resume upload → Preferences → Profile verify
- **AIM** (steps 4-5): Search queries + BD API → Two-phase market analysis → Lock categories
- **READY** (steps 6-10): Mining Q&A + Skill curation → Resumes | LinkedIn | Download (tabbed arsenal)
- **FIRE** (step 11): Auto-apply via extension or Claude for Chrome prompt

Composite pages: `OnboardingPage.tsx` (1-3), `AimPage.tsx` (4-5), `ReadyPage.tsx` (6-10). Phase bar shows AIM/READY/FIRE pills, hidden during onboarding.

## Key Files

- `src/lib/prompts.ts` — All Claude prompt templates
- `src/lib/api.ts` — Client-side API helpers (`callClaude`, `fetchJobs`)
- `src/lib/types.ts` — All TypeScript interfaces
- `src/lib/constants.ts` — Phase/step definitions, PHASE_DISPLAY, `getScreen()`
- `src/lib/storage.ts` — Encrypted session persistence
- `src/lib/utils.ts` — Utility functions (`preprocessMarketData`, `buildMarketSummary`, `extractHourlyRates`, `buildMarketPrepPayload`)
- `src/lib/pipeline.ts` — Pipeline tracer (`[PIPELINE]` log prefix)
- `src/lib/dummy-data.ts` — `buildDummySession(step)` for testing
- `src/lib/apply-template.ts` — Chrome prompt builder (code-assembled)
- `src/lib/deus-mechanicus.ts` — Product-agnostic manifest interfaces
- `src/lib/deus-mechanicus-consumer-product.ts` — consumer product manifest factory + test suites
- `src/lib/warp-profiles.ts` — Cross-product profile schema, CRUD, converters
- `src/components/DeusMechanicus.tsx` — Dev tools hub shell
- `src/app/page.tsx` — Main wizard orchestrator

## Extension

Chrome extension in `extension/`. Manifest V3, LinkedIn Easy Apply automation. Files: `manifest.json`, `background.js`, `content.js`, `popup.html/css/js`.

## Deus Mechanicus (Dev Tools Hub)

Accessible via `/?dummyplug` or `/?deusmechanicus`. Protected by `NEXT_PUBLIC_DUMMY_PLUG_CODE` env var.

**CRITICAL**: `<DeusMechanicus>` wraps the entire app tree as a React context provider. Do NOT refactor it into a sibling — it must be the outermost wrapper so any child can call `useDM()`.

Modules: **DUMMY PLUG** (Warp Profiles), **QA SUITE** (test runner). Step definitions derived from `PHASE_DISPLAY` in `constants.ts` — single source of truth.

## Bright Data Integration

### BD API

- **Dataset**: `gd_lpfll7v5hcqtkxl6l` (LinkedIn Jobs Scraper, discovery mode)
- **Flow**: POST trigger → poll progress → GET snapshot
- **Valid `job_type`**: `"Full-time"`, `"Part-time"`, `"Contract"`, `"Temporary"`, `"Internship"`, `"Volunteer"`, `"Other"` (case-sensitive)
- **Valid `remote`**: `"Remote"` (capital R)
- Full BD docs in `docs/brightdata/` (8 files: overview, scraper API, MCP, browser, proxy, web access, agents, datasets)

### Known Issues (2026-03-18)

- BD returns annual salaries for contract roles (no hourly rate data in structured fields)
- Thin data yield for non-FT job types
- Hourly rates extracted from job description text via regex (`extractHourlyRates()`)

### Two-Phase Market Pipeline

MARKET_PREP (raw data → intelligence report) → MARKET (report → final analysis). Fallback: skip MARKET_PREP if it fails. Auto-rerun: detects old single-phase output and re-runs.

## Pipeline Tracing

Stages: `USER_INPUT` → `QUERY_GEN` → `BD_TRIGGER` → `BD_POLL` → `BD_RESULTS` → `MARKET_PREP_INPUT` → `MARKET_PREP_OUTPUT` → `MARKET_INPUT` → `MARKET_OUTPUT`

## Environment Variables

```
ANTHROPIC_API_KEY=        # Claude API
BRIGHTDATA_API_KEY=       # Bright Data scraper
BRIGHTDATA_DATASET_ID=    # Optional, defaults to gd_lpfll7v5hcqtkxl6l
UPSTASH_REDIS_REST_URL=   # Rate limiting
UPSTASH_REDIS_REST_TOKEN= # Rate limiting
ALLOWED_ORIGINS=          # CSRF protection
DAILY_JOB_REQUEST_LIMIT=  # Daily BD API budget (default 100)
```

## Testing

- **Dummy Plug**: `/?dummyplug` or `/?dummyplug&step=11` — fast-forward with test data
- **Test API**: `/api/test?check=all` — health, build, env, API connectivity
- **After code changes**: `npm run build` must pass clean

## Compliance

- Never auto-submit without user review — extension pauses for approval
- Prompt injection defense — external data in `<untrusted_job_data>` tags
- Rate limiting — per-IP (20/min) + global (60/min) + daily budget
- API keys server-side only

## Git Rules

- **Never kill or overwrite the backup branch** (`backup-2026-03-18`)
- Branch: `master`
