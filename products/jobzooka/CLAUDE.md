# consumer product — CLAUDE.md

## What This App Does

Job search assistant: resume → targeted resumes, LinkedIn content, form answers, auto-apply. 10-step wizard (3 screens + onboarding), Next.js 16 + React 19 + TypeScript, Chrome extension for LinkedIn Easy Apply.

## Architecture

- **Framework**: Next.js 16.2.0 (Turbopack), React 19, TypeScript
- **Hosting**: Vercel (Hobby plan — 60s function timeout)
- **AI**: Claude API via `/api/claude` route (server-side, key never exposed)
- **Job Data**: Bright Data LinkedIn Jobs Scraper API via `/api/jobs` route
- **Auth**: JWT + OAuth (Google/LinkedIn) + email/password via `/api/auth/*`
- **Payments**: Stripe checkout + webhook via `/api/stripe/*`, rocket credit economy
- **Rate Limiting**: Upstash Redis (`@upstash/ratelimit`)
- **Storage**: Encrypted localStorage (AES-GCM via Web Crypto API) + Redis server sessions
- **Styling**: CSS custom properties (corporate light theme), Tailwind imported for base reset only

## Dev Commands

```bash
npm run dev          # Start dev server (Turbopack, port 3000)
npm run build        # Production build
npm run test         # Playwright tests
```

## UX Flow (10 internal steps, 3 screens + onboarding)

- **Onboarding** (steps 1-3): Resume upload → Preferences → Profile verify
- **READY** (steps 4-5): Search queries + BD API → Two-phase market analysis → Lock categories
- **AIM** (steps 6-9): Mining Q&A + Skill curation → Resumes | LinkedIn
- **FIRE** (step 10): Auto-apply via extension or Claude for Chrome prompt

Composite pages: `OnboardingPage.tsx` (1-3), `AimPage.tsx` (4-5), `ReadyPage.tsx` (6-9), `Step13Apply.tsx` (10). Note: component names don't match phase names (AimPage hosts READY steps, ReadyPage hosts AIM steps — known naming debt). Phase bar shows READY/AIM/FIRE pills, hidden during onboarding.

## Key Files

### Core Logic (`src/lib/`)

- `prompts.ts` — All Claude prompt templates (server-only)
- `api.ts` — Client-side API helpers (`callClaude`, `fetchJobs`)
- `types.ts` — All TypeScript interfaces
- `constants.ts` — Phase/step definitions, PHASE_DISPLAY, `getScreen()`
- `storage.ts` — Encrypted session persistence (AES-GCM)
- `utils.ts` — Data processing (`preprocessMarketData`, `buildMarketSummary`, `extractHourlyRates`, `buildMarketPrepPayload`)
- `pipeline.ts` — Pipeline tracer (`[PIPELINE]` log prefix)
- `validators.ts` — Input sanitization and validation
- `competitiveness.ts` — 0-100 competitiveness scoring algorithm
- `rockets.ts` — Rocket credit economy (costs, packs, balance operations)
- `auth.ts` — JWT creation/verification, session management
- `auth-oauth.ts` — OAuth provider helpers (Google, LinkedIn)
- `apply-template.ts` — Chrome prompt builder (code-assembled)
- `docx-generator.ts` — Resume DOCX file generation
- `pdf-generator.ts` — Resume PDF file generation
- `download-helpers.ts` — File download utilities (blob triggers, ZIP bundling)
- `upload.ts` — Resume file upload handling
- `dummy-data.ts` — `buildDummySession(step)` for testing
- `test-harness.ts` — QA test suite runner
- `scraper-scripts.ts` — BD scraper page scripts
- `deus-mechanicus.ts` — Product-agnostic manifest interfaces
- `deus-mechanicus-consumer-product.ts` — consumer product manifest factory + test suites
- `warp-profiles.ts` — Cross-product profile schema, CRUD, converters

### Components

- `src/components/DeusMechanicus.tsx` — Dev tools hub shell
- `src/components/pages/` — Composite pages (OnboardingPage, AimPage, ReadyPage)
- `src/components/steps/` — Step components (Step1Resume through Step13Apply)
- `src/components/ui/` — Atomic UI components (Btn, Card, Inp, Sel, etc.)
- `src/app/page.tsx` — Main wizard orchestrator

### API Routes (`src/app/api/`)

- `claude/` — Claude LLM endpoint (rate-limited, rocket billing)
- `jobs/` — Bright Data job scraper (trigger, poll, results)
- `auth/` — Login, register, logout, OAuth (Google/LinkedIn), session check
- `session/` — Server-side session persistence (load/save/clear)
- `rockets/` — Rocket balance and usage queries
- `stripe/` — Checkout session creation + webhook handler
- `extension/` — Chrome extension file serving (ZIP builder)
- `test/` — Health & diagnostic checks (env-gated)

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

Stages: `USER_INPUT` → `QUERY_GEN` → `BD_TRIGGER` → `BD_POLL` → `BD_RESULTS` → `MARKET_PREP_INPUT` → `MARKET_PREP_OUTPUT` → `MARKET_INPUT` → `MARKET_OUTPUT` → `RESUME_INPUT` → `RESUME_OUTPUT`

## Environment Variables

```
# Required
ANTHROPIC_API_KEY=        # Claude API (fallback: JOBZOOKA_CLAUDE_KEY)
BRIGHTDATA_API_KEY=       # Bright Data scraper
UPSTASH_REDIS_REST_URL=   # Rate limiting, rockets, sessions
UPSTASH_REDIS_REST_TOKEN= # Rate limiting, rockets, sessions
ALLOWED_ORIGINS=          # CSRF protection (comma-separated origins)
JWT_SECRET=               # JWT signing key for auth

# Auth (optional — OAuth buttons hidden if not set)
GOOGLE_CLIENT_ID=         # Google OAuth
GOOGLE_CLIENT_SECRET=     # Google OAuth
LINKEDIN_CLIENT_ID=       # LinkedIn OAuth
LINKEDIN_CLIENT_SECRET=   # LinkedIn OAuth
NEXT_PUBLIC_OAUTH_GOOGLE= # Show Google OAuth button (any truthy value)
NEXT_PUBLIC_OAUTH_LINKEDIN= # Show LinkedIn OAuth button (any truthy value)

# Stripe (optional — rocket purchases disabled if not set)
STRIPE_SECRET_KEY=        # Stripe API
STRIPE_WEBHOOK_SECRET=    # Stripe webhook verification
STRIPE_PRICE_SCOUT=      # Price ID for Scout pack ($4.99/100 rockets)
STRIPE_PRICE_STRIKE=     # Price ID for Strike pack ($12.99/300 rockets)
STRIPE_PRICE_ARSENAL=    # Price ID for Arsenal pack ($24.99/750 rockets)

# Optional (with defaults)
BRIGHTDATA_DATASET_ID=    # Default: gd_lpfll7v5hcqtkxl6l
CLAUDE_MODEL=             # Default: claude-sonnet-4-20250514
DAILY_JOB_REQUEST_LIMIT=  # Daily BD API budget (default 100)
DAILY_REQUEST_LIMIT=      # Daily Claude requests (default 500)
DAILY_TOKEN_LIMIT=        # Daily Claude output tokens (default 2,000,000)
NEXT_PUBLIC_DUMMY_PLUG_CODE= # Dev tools access gate
ENABLE_TEST_API=          # Enable /api/test endpoint
```

## Testing

- **Dummy Plug**: `/?dummyplug` or `/?dummyplug&step=10` — fast-forward with test data
- **Test API**: `/api/test?check=all` — health, build, env, API connectivity
- **After code changes**: `npm run build` must pass clean

## Compliance

- Extension auto-applies based on user-defined heuristics (apply-if/skip-if signals)
- Prompt injection defense — external data in `<untrusted_job_data>` tags with nonce
- Rate limiting — per-IP (20/min Claude, 10/min BD) + global (60/min) + daily budget
- API keys server-side only — never exposed to client bundle
- Auth: JWT cookie-based, OAuth optional (Google/LinkedIn)

## Git Rules

- **Never kill or overwrite the backup branch** (`backup-2026-03-18`)
- Branch: `master`
