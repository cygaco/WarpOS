# Skeleton Repo Checklist

The skeleton is the instrumented starting point that all agents build against. It compiles and runs with zero features. Agents fill in implementation; the skeleton tells them if they got it wrong.

---

## Config Files

### tsconfig.json

- `strict: true` — all strict checks active
- `isolatedModules: true`
- `noEmit: true`
- Path alias: `@/*` maps to `./src/*`
- Target: ES2017, module: esnext, jsx: react-jsx
- Plugins: `[{ name: "next" }]`
- Excludes: `node_modules`, `backups`, `protected`

### next.config.ts

- `serverExternalPackages: ["jspdf"]`
- Security headers on all routes:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `X-DNS-Prefetch-Control: off`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()`
  - CSP with conditional `unsafe-eval` for dev HMR
  - `worker-src 'self' blob:` (for pdf.js)
  - HSTS: `max-age=31536000; includeSubDomains`

### postcss.config.mjs

- Plugin: `@tailwindcss/postcss`

### playwright.config.ts

- Test dir: `./e2e`
- Fully parallel
- Projects: chromium (desktop), mobile (375x812)
- Web server: `npm run dev` on port 3000
- Base URL: `http://localhost:3000`

### .gitignore

- `node_modules/`, `.next/`, `out/`, `build/`
- `.env*` (all env files)
- `test-results/`, `playwright-report/`, `blob-report/`
- `backups/`, `protected/`, `.claude/*`
- `*.tsbuildinfo`, `next-env.d.ts`
- `.vercel`, `.DS_Store`

---

## Dependencies (package.json)

### Framework

- `next` at 16.2.0+
- `react` at 19.2.3
- `react-dom` at 19.2.3
- `typescript` at 5+

### AI / API

- `@upstash/redis` at 1.37.0+
- `@upstash/ratelimit` at 2.0.8+
- `stripe` at 20.4.1+
- `@stripe/stripe-js` at 8.11.0+
- `arctic` at 3.7.0+ (OAuth)

### Document Generation

- `docx` at 9.6.1+ (DOCX write)
- `jspdf` at 4.2.0+ (PDF write)
- `pdfjs-dist` at 5.5.207+ (PDF read)
- `mammoth` at 1.12.0+ (DOCX read)

### Utilities

- `jszip` at 3.10.1+
- `lucide-react` at 0.577.0+
- `@vercel/analytics` at 2.0.1+

### Dev

- `@playwright/test` at 1.58.2+
- `tailwindcss` at 4+, `@tailwindcss/postcss` at 4+
- `@types/node` at 20+, `@types/react` at 19+, `@types/react-dom` at 19+, `@types/chrome` at 0.1.38+

### Scripts

- `dev` — next dev
- `build` — next build
- `start` — next start
- `test` — npx playwright test
- `lint:prds` — node scripts/lint-prds.js

---

## Folder Structure

```
src/
  app/
    api/
      auth/          (login, register, logout, me, oauth/*)
      claude/        (LLM endpoint)
      jobs/          (BD scraper)
      session/       (server-side session)
      rockets/       (balance, debit, grant)
      stripe/        (checkout, webhook)
      extension/     (ZIP builder)
      test/          (health checks)
    globals.css
    layout.tsx
    page.tsx
    not-found.tsx
  components/
    DeusMechanicus.tsx  (outermost app wrapper)
    pages/              (OnboardingPage, AimPage, ReadyPage)
    steps/              (Step1Resume, Step3Preferences, Step4Profile, StepCollect,
                         Step6Analysis, Step8Skills, Step10Resumes, Step11LinkedIn,
                         Step12Download, Step13Apply)
    dm-modules/         (DummyPlug, QA, DataInspector, PipelineTracer, Rockets)
    ui/                 (Btn, Card, Inp, Sel, Toast, Spinner, Modal)
  lib/
    types.ts            — all interfaces
    api.ts              — callClaude(), fetchJobs()
    prompts.ts          — Claude prompt templates
    constants.ts        — PHASE_DISPLAY, STEP_REQUIRES
    storage.ts          — encrypted persistence
    utils.ts            — data processing
    pipeline.ts         — tracer
    validators.ts       — sanitization
    competitiveness.ts  — scoring
    rockets.ts          — credit economy
    auth.ts             — JWT, sessions
    auth-oauth.ts       — OAuth helpers
    apply-template.ts   — chrome prompt builder
    docx-generator.ts   — DOCX export
    pdf-generator.ts    — PDF export
    download-helpers.ts — blob download, ZIP
    upload.ts           — file upload
    dummy-data.ts       — test data
    test-harness.ts     — QA runner
    scraper-scripts.ts  — BD page scripts
    deus-mechanicus.ts  — manifest interfaces
    deus-mechanicus-consumer-product.ts — manifest factory
    warp-profiles.ts    — cross-product profiles

extension/
  manifest.json
  background.js
  content.js
  popup.html
  popup.css
  popup.js

e2e/                    — Playwright tests
scripts/                — lint-prds.js
public/                 — favicon.ico, pdf.worker.min.mjs
```

---

## Environment Variables

The skeleton ships with a `.env.local.example` listing all required and optional env var NAMES (no values).

**Required:** Anthropic API key, Bright Data API key, Upstash Redis URL and token, JWT secret, allowed origins.

**Auth (optional):** Google OAuth client ID and secret, LinkedIn OAuth client ID and secret, public OAuth toggle flags.

**Stripe (optional):** Stripe secret key, webhook secret, three price IDs (scout, strike, arsenal).

**Optional with defaults:** BD dataset ID, Claude model, daily limits (job requests, Claude requests, token budget), dummy plug code, test API toggle.

---

## Instrumentation (what the skeleton enforces)

1. **TypeScript strict mode** — type mismatches caught at compile time with exact file and line
2. **Security headers** — CSP, HSTS, X-Frame-Options baked into next.config.ts
3. **Foundation types** — SessionData and all sub-interfaces pre-defined in types.ts
4. **Pipeline tracing** — [PIPELINE] prefix logging built into pipeline.ts
5. **Schema validation** — validators.ts provides sanitization at all boundaries
6. **Rate limiting** — Upstash ratelimit configured in API routes
7. **Rocket pre-flight** — debitRockets() enforced before billable Claude calls

### Missing (to be added)

- ESLint with architectural rules (no direct localStorage, all Claude calls through callClaude, all API routes validate origin)
- Build-time structural checks (every API route exports rate-limited handler)
- Placeholder tests per feature (acceptance criteria as test stubs)
