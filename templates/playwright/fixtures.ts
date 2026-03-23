import { test as base, expect, type Page } from "@playwright/test";

/**
 * Warp product test fixtures.
 *
 * `dummyPage(step)` fast-forwards via ?deusmechanicus&step=N so tests
 * don't need to grind through the whole wizard/flow.
 *
 * Requires: Deus Mechanicus integration with buildDummySession(step).
 */

export { expect };

export const test = base.extend<{
  dummyPage: (step: number) => Promise<Page>;
}>({
  dummyPage: async ({ page }, use) => {
    const loader = async (step: number) => {
      await page.goto(`/?deusmechanicus&step=${step}`);
      // Wait for React hydration — session loads, URL rewrites to /
      await page.waitForFunction(
        () => {
          return (
            !document.querySelector('[class*="Restoring"]') &&
            !document.body.textContent?.includes("Restoring your session")
          );
        },
        { timeout: 10_000 },
      );
      await page.waitForTimeout(300);
      return page;
    };
    await use(loader);
  },
});
