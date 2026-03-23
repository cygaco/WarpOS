# Playwright E2E Test Template

Reusable Playwright setup for Warp products. Extracted from consumer product (53 tests, 18s full suite).

## Setup

```bash
npm install -D @playwright/test
npx playwright install chromium
```

## Files

- `playwright.config.ts` — Config with chromium + mobile projects, auto-start dev server
- `e2e/fixtures.ts` — Custom fixtures with `dummyPage(step)` for DM fast-forward

## Usage Pattern

Every Warp product with Deus Mechanicus can use the `dummyPage(step)` fixture to jump to any step with test data, bypassing the real flow. This makes tests fast and deterministic.

```typescript
import { test, expect } from "./fixtures";

test("step 5 renders market analysis", async ({ dummyPage }) => {
  const page = await dummyPage(5);
  await expect(page.getByText("Market Analysis")).toBeVisible();
});
```

## Config Template

Adapt `baseURL`, `webServer.command`, and `webServer.url` for your product's dev server.

## Test Organization

```
e2e/
  fixtures.ts          — shared fixtures (dummyPage, etc.)
  intro.spec.ts        — landing/intro screen
  onboarding.spec.ts   — onboarding flow
  [phase].spec.ts      — per-phase tests
  responsive.spec.ts   — mobile/tablet viewport tests
  api.spec.ts          — API route tests
  session-persistence.spec.ts — storage/reload tests
```
