# consumer product — CLAUDE.md

## What This App Does
consumer product is a job search assistant that takes a user's resume and generates targeted resumes, LinkedIn content, form answers, and auto-applies to jobs. It's an 11-step wizard built with Next.js 16 + React 19 + TypeScript, with a Chrome extension for LinkedIn Easy Apply automation.

## Architecture
- **Framework**: Next.js 16.1.6 (Turbopack), React 19, TypeScript
- **Hosting**: Vercel (Hobby plan — 60s function timeout)
- **AI**: Claude API via `/api/claude` route (server-side, key never exposed)
- **Job Data**: Bright Data LinkedIn Jobs Scraper API via `/api/jobs` route
- **Rate Limiting**: Upstash Redis (`@upstash/ratelimit`)
- **Storage**: Encrypted localStorage (AES-GCM via Web Crypto API)
- **Styling**: CSS custom properties (corporate light theme), no Tailwind config — just utility classes

## Dev Commands
```bash
npm run dev          # Start dev server (Turbopack, port 3000)
npm run build        # Production build
npm run lint         # ESLint
```

## UX Flow (11 internal steps, 3 screens + onboarding)
- **Onboarding** (steps 1-3): Resume upload → Preferences → Profile verify — one-time setup, no phase bar
- **AIM** (steps 4-5): Search queries + BD API → Two-phase market analysis → Lock categories
- **READY** (steps 6-10): Mining Q&A + Skill curation → Resumes | LinkedIn | Download (tabbed arsenal)
- **FIRE** (step 11): Auto-apply via extension or Claude for Chrome prompt

### Composite Pages
Internal step routing (1-11) unchanged. Three composite page components wrap the step components:
- `src/components/pages/OnboardingPage.tsx` — steps 1-3 with progress dots, completed section summaries
- `src/components/pages/AimPage.tsx` — steps 4-5 with search completion summary
- `src/components/pages/ReadyPage.tsx` — steps 6-7 (prep) then 8-10 (tabbed arsenal: Resumes/LinkedIn/Download)
- Phase bar shows 3 pills (AIM/READY/FIRE), hidden during onboarding

## Key Files
- `src/lib/prompts.ts` — All Claude prompt templates (PARSE, PROFILE, MARKET_PREP, MARKET, QUERY_GEN, RESUME_GEN, TARGETED, LINKEDIN, APPLY)
- `src/lib/api.ts` — Client-side API helpers (`callClaude`, `fetchJobs`)
- `src/lib/pipeline.ts` — Pipeline tracer for debugging data flow
- `src/lib/types.ts` — All TypeScript interfaces
- `src/lib/utils.ts` — Utility functions including `preprocessMarketData`, `buildMarketSummary`
- `src/lib/storage.ts` — Encrypted session persistence
- `src/lib/apply-template.ts` — Chrome prompt builder (code-assembled, not LLM-generated)
- `src/lib/dummy-data.ts` — Dummy Plug Mode: `buildDummySession(step)` for testing
- `src/lib/constants.ts` — Phase/step definitions, PHASE_DISPLAY array, `getScreen()` helper
- `src/lib/deus-mechanicus.ts` — Product-agnostic manifest interfaces (ProductManifest, DMModule)
- `src/lib/deus-mechanicus-consumer-product.ts` — consumer product manifest factory + test suite runners
- `src/lib/warp-profiles.ts` — Cross-product profile schema, CRUD, converters
- `src/components/DeusMechanicus.tsx` — Dev tools hub shell: bubble + panel + DP bar + tab routing
- `src/components/dm-modules/DummyPlugModule.tsx` — Warp Profiles module (save/load/edit/import/export)
- `src/components/dm-modules/QAModule.tsx` — QA test runner module (server + client suites)
- `src/components/ProfileEditor.tsx` — Full profile edit modal (mounted inside DummyPlugModule)
- `src/components/pages/OnboardingPage.tsx` — Composite: steps 1-3
- `src/components/pages/AimPage.tsx` — Composite: steps 4-5
- `src/components/pages/ReadyPage.tsx` — Composite: steps 6-10 (prep + tabbed arsenal)
- `src/app/api/jobs/route.ts` — Bright Data API integration
- `src/app/api/claude/route.ts` — Claude API proxy with rate limiting
- `src/app/page.tsx` — Main wizard orchestrator (routes to composite pages)

## consumer product Launcher Extension
Chrome extension for LinkedIn Easy Apply automation. Located in `extension/`.
- `manifest.json` — Manifest V3, LinkedIn host permissions, externally connectable
- `background.js` — Service worker: session management, query queue, status relay
- `content.js` — Content script: job scanner, triage engine, form filler, review overlay
- `popup.html/css/js` — Status UI with live stats
- Test: `chrome://extensions/` → Developer mode → Load unpacked → select `extension/`

## Deus Mechanicus (Dev Tools Hub)
Unified dev tools panel accessible via `/?dummyplug`. Protected by `NEXT_PUBLIC_DUMMY_PLUG_CODE` env var.

**Architecture**: Product manifest pattern — each Warp product exports a `ProductManifest` describing its schema, steps, test suites, and state accessors. Deus Mechanicus reads this to generate UI.

**CRITICAL**: `<DeusMechanicus>` wraps the entire app tree as a React context provider. It is NOT a sibling component — it must be the outermost wrapper in the return JSX so that any child can call `useDM()`. Do not refactor it into a sibling.

**Components**:
- **DP Bar**: Draggable fast-forward bar at bottom with step buttons (derived from `manifest.steps`) + DM toggle
- **Panel**: Opens via DM button, has tabbed modules:
  - **DUMMY PLUG**: Warp Profiles — save/load/edit/import/export test profiles
  - **QA SUITE**: Server + client test runner (auto-runs on first activation)

**Data flow**: `page.tsx` creates manifest with `getState`/`setState` closures → `<DeusMechanicus>` wraps the app tree → provides `DMContext` to all children → DP bar fast-forward calls `manifest.buildSession()` + `manifest.setState()` internally (no `onFastForward` prop) → modules call `manifest.setState()` to inject data

**Bidirectional context** (`useDM()` hook): Any component can import `useDM` from `@/lib/deus-mechanicus` to read DM state (active, panelOpen, activeModule, modules, manifest) or command DM (openPanel, closePanel, setModule, fastForward, runTests).

**Step definitions**: Manifest steps are derived from `PHASE_DISPLAY` in `constants.ts` — single source of truth. Do NOT duplicate step labels.

**Adding new modules**: Implement `DMModule` interface, add to `MODULES` array in `DeusMechanicus.tsx`

## Dummy Plug Mode
URL param for dev/testing: `/?dummyplug` (defaults to step 1) or `/?dummyplug&step=11`.
- Protected by `NEXT_PUBLIC_DUMMY_PLUG_CODE` env var (set in `.env.local`, not in production)
- Loads realistic AI PM profile with redacted PII
- Data populates progressively based on target step
- URL cleaned after activation

## Competitive Intelligence
See `docs/competitive-analysis.md` for AIApply, LazyApply, Sonara, Simplify analysis.
Key finding: AIApply ($49-99/mo) does server-side auto-apply to external career pages only — they don't touch LinkedIn Easy Apply. That's consumer product's gap.

## Bright Data Integration — KNOWN ISSUES

### The Core Problem (as of 2026-03-18)
The market research pipeline produces **wrong categories and inflated comp ranges** for non-full-time searches. When user selects Part-time/Contract/Temporary:

1. **BD returns annual salaries even for contract roles** — `base_salary` field is always annual (e.g., $180K-$250K/yr), not hourly. The old Chrome plugin report showed $60-$120/hr for the same roles.

2. **MARKET prompt produces full-time domain categories** instead of employment-arrangement categories. Expected: "Contract AI PM (Staffing Agency)", "Interim Product Manager", "Fractional CPO". Got: "AI/ML Product Manager", "Director of Product Management".

3. **Thin data yield** — Even with `limit_per_input=50`, many queries return 0-7 results for Temporary/Part-time filters. "product manager contract [Contract]" returns 50, but "product strategy consultant [Temporary]" returns 0.

4. **No hourly rate data** — BD's LinkedIn scraper doesn't return hourly rates. The `base_salary` and `job_base_pay_range` fields contain annual figures or are null. Contract/hourly comp data would need to come from job descriptions (text parsing).

### BD API Details
- **Dataset**: `gd_lpfll7v5hcqtkxl6l` (LinkedIn Jobs Scraper)
- **Mode**: `type=discover_new&discover_by=keyword`
- **Input format**: `{keyword, location, country, job_type, remote, ...}` — all fields required, empty string for unused
- **Valid `job_type` values**: `"Full-time"`, `"Part-time"`, `"Contract"`, `"Temporary"`, `"Internship"`, `"Volunteer"`, `"Other"` (case-sensitive)
- **Valid `remote` value**: `"Remote"` (capital R, not "yes"/"true")
- **Trigger**: POST → returns `{snapshot_id}`
- **Poll**: GET `/snapshot/{id}?format=json` → 202 = pending, 200 = data array
- **Key response fields**: `job_title`, `company_name`, `job_location`, `job_summary` (plain text), `job_description_formatted` (HTML), `job_employment_type`, `job_seniority_level`, `base_salary` (annual, often null), `job_industries`, `job_function`, `job_num_applicants`, `apply_link`, `is_easy_apply`

### Two-Phase Market Analysis Pipeline (REBUILT 2026-03-18)
The pipeline now runs two Claude calls for API-sourced data:

1. **MARKET_PREP** (Phase 1): Takes raw BD job listings + user profile → produces structured market intelligence report:
   - Hourly rate extraction from job descriptions (regex pre-extracted client-side, fed as input)
   - Staffing agency detection (high-volume companies identified client-side via `buildMarketPrepPayload`)
   - Employment-arrangement categories (Contract via Agency, Fractional/Advisory, Interim, Direct-Hire)
   - Comp intelligence with correct units ($/hr for non-FT, $/yr for FT)
   - Search term performance analysis
   - Market signals

2. **MARKET** (Phase 2): Takes the MARKET_PREP report + profile → produces final analysis (keywords, jobTypes, miningQuestions, discoveryRecs). The MARKET prompt now checks for a `marketPrepReport` field and uses it as primary source.

**Fallback**: If MARKET_PREP fails, Step6Analysis falls back to sending raw data directly to MARKET (old behavior).

**Auto-rerun**: If sessionData has API-sourced data but no `marketPrepReport`, the component detects the old pipeline output and re-runs analysis with the new two-phase pipeline.

**Key utilities** (`src/lib/utils.ts`):
- `extractHourlyRates()` — regex extraction of hourly rates from job descriptions
- `buildMarketPrepPayload()` — builds compact payload with job metadata, description excerpts, hourly rates, and high-volume company detection

## Pipeline Tracing
The app has a pipeline tracer (`src/lib/pipeline.ts`) that logs structured data at each stage. Search for `[PIPELINE]` in:
- Server logs: `preview_logs` with search `PIPELINE`
- Client logs: `preview_console_logs`

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

## Bright Data Documentation Reference
Full BD docs are ingested in `docs/brightdata/`. Key files:

| File | Contents | When to Reference |
|------|----------|-------------------|
| `00-overview.md` | Platform overview, auth methods, account API | Setting up BD integration, auth issues |
| `01-web-scraper-api.md` | Trigger/poll/download endpoints, LinkedIn scraper details | Modifying job search pipeline (Steps 4-6) |
| `02-mcp-server.md` | MCP tools (80+), free/pro tiers, browser tools | Building auto-apply, AI agent features |
| `03-browser-api.md` | Scraping Browser, Puppeteer/Playwright, session mgmt | Auto-apply implementation, form filling |
| `04-proxy-infrastructure.md` | Proxy types, geo-targeting, connection details | Debugging network/IP issues |
| `05-web-access-apis.md` | Unlocker, SERP, Crawl APIs, Scraper Studio | Alternative data sources, custom scrapers |
| `06-ai-agents.md` | Agent architecture, auto-apply blueprint, MCP integration | Planning auto-apply feature |
| `07-datasets-marketplace.md` | Datasets API, Web Archive, marketplace | Bulk data access, dataset filtering |

### Key BD Facts for This App
- **LinkedIn Jobs Dataset**: `gd_lpfll7v5hcqtkxl6l` (discovery mode, keyword-based)
- **Async pattern**: POST `/datasets/v3/trigger` → poll `/datasets/v3/progress/{id}` → GET `/datasets/v3/snapshot/{id}`
- **Data retention**: Snapshots 30 days, downloads 16 days
- **Rate limits**: ≤20 inputs = 1,500 concurrent; >20 inputs = 100 concurrent
- **MCP free tier**: 5,000 req/month (search + scrape)
- **Browser API via MCP**: `&groups=browser` or `&pro=1` — enables `scraping_browser_*` tools
- **Auto-apply path**: MCP browser tools → navigate to apply URL → ARIA snapshot → fill fields → submit

## Testing & Development Tools

### Dummy Plug Mode
URL param for dev/testing: `/?dummyplug` (defaults to step 1) or `/?dummyplug&step=11`.
- Protected by `NEXT_PUBLIC_DUMMY_PLUG_CODE` env var
- Floating fast-forward panel (DP bar) at bottom: click any step button to jump with full data
- URL cleaned after activation

### Test API (`/api/test`)
- `GET /api/test` — server health check
- `GET /api/test?check=build` — verifies prompts + dummy data modules load
- `GET /api/test?check=env` — checks required env vars
- `GET /api/test?check=api` — tests Claude API connectivity (uses haiku for speed)
- `GET /api/test?check=all` — runs all checks
- Only available when `NEXT_PUBLIC_DUMMY_PLUG_CODE` is set

### E2E Test Harness (`src/lib/test-harness.ts`)
Browser-side test runner. Run via preview_eval:
```javascript
const { runTests } = await import('/src/lib/test-harness');
await runTests(); // all suites
await runTests('smoke'); // just smoke tests
await runTests('dummyplug'); // dummy plug flow tests
```
Suites: `smoke`, `dummyplug`, `hub`, `sidebar`, `fastforward`

### After ANY Code Change
1. Run `npm run build` — must pass clean
2. Run `/api/test?check=build` — verify modules intact
3. Test affected step via dummy plug fast-forward
4. If step components changed, verify the `buildDummySession(step)` still has matching data

### Claude API TOS Compliance
- **Never auto-submit applications without user review** — extension always pauses for approval
- **Prompt injection defense** — all external data wrapped in `<untrusted_job_data>` tags
- **Rate limiting** — per-IP (20/min) + global (60/min) + daily budget (500 req/day)
- **No credential exposure** — API keys are server-side only, never sent to client
- **Content safety in prompts** — PROMPT_RULES includes injection defense instructions
- **User consent** — privacy notice on landing page and resume upload step

## Git Rules
- **Never kill or overwrite the backup branch**
- Branch: `master`
- Backup: `backup-2026-03-18`
