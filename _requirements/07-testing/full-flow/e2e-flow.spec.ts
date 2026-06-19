import { test, expect, Page } from "@playwright/test";
import {
  uploadIdeaBrief,
  IDEA_BRIEF_FIXTURES,
} from "../../_shared/helpers/upload";

// Full-flow E2E — exercises the 12-step founder journey end-to-end.
// Generated 2026-05-02 alongside ISSUES.md as part of the QA sweep.
// Each test maps to one or more bugs (BUG-NNN) so regression-after-fix is
// auditable. Use `npm run test -- _requirements/full-flow` to run.

const STEP_TIMEOUT = 60_000;
const SCAN_TIMEOUT = 90_000;

async function uploadAndAdvanceFromIntro(page: Page): Promise<void> {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await uploadIdeaBrief(page, IDEA_BRIEF_FIXTURES.docxHappy);
  // After drop, page advances to step 2 (CONFIRM) automatically.
  await expect(page.getByText(/Idea brief parsed/i)).toBeVisible({
    timeout: STEP_TIMEOUT,
  });
}

test.describe("Full E2E — happy path", () => {
  test.setTimeout(180_000);

  test("intro → upload → research → landscape scan → dashboard", async ({
    page,
  }) => {
    await uploadAndAdvanceFromIntro(page);

    // Step 2 sub-flow: direction → audience → budget → geography → quick-check → skip-list → confirm.
    // Defaults are pre-selected; just hit Next through each.
    // The disabled "Next step" progress-bar arrow at the top has the same
    // role+name pattern as the page's actual "Next →" button. Filter to the
    // enabled one only — that's the one we click.
    const nextBtn = page.locator('button:has-text("Next →"):not([disabled])');

    // Direction page (First launch pre-selected)
    await nextBtn.first().click();
    // Audience page (Early adopters + Soon pre-selected)
    await nextBtn.first().click();
    // Budget page (open to discussion default)
    await nextBtn.first().click();
    // Geography page (US default)
    await nextBtn.first().click();
    // Quick-check page
    await page.getByRole("button", { name: /Looks good, let's go/i }).click();
    // Skip-list page
    await page.getByRole("button", { name: /^Looks good$/ }).click();
    // Confirm profile page
    await expect(page.getByText(/Confirm your info/i)).toBeVisible({
      timeout: STEP_TIMEOUT,
    });
    await page
      .getByRole("button", { name: /Confirm profile and continue/i })
      .click();

    // Interstitial → launch research
    await page
      .getByRole("button", { name: /Continue to launch research/i })
      .click();
    await expect(page.getByText(/Research Run/i)).toBeVisible({
      timeout: STEP_TIMEOUT,
    });

    // Launch research run
    await page.getByRole("button", { name: /Start research run/i }).click();
    await expect(
      page.getByRole("heading", { name: /Analysis Complete/i }),
    ).toBeVisible({
      timeout: SCAN_TIMEOUT,
    });

    // Segments → lock → deep dive → skip → scope → dashboard
    await page
      .getByRole("button", { name: /View your audience segments/i })
      .click();
    await expect(
      page.getByRole("heading", { name: /Lock Your Segments/i }),
    ).toBeVisible({
      timeout: STEP_TIMEOUT,
    });
    await page
      .getByRole("button", { name: /Lock your audience segments/i })
      .click();

    await expect(page.getByText(/Deep Dive/i)).toBeVisible({
      timeout: STEP_TIMEOUT,
    });
    await page.getByRole("button", { name: /Skip all/i }).click();
    await page.getByRole("button", { name: /Skip & finish/i }).click();

    await expect(page.getByText(/Here is your launch scope/i)).toBeVisible({
      timeout: STEP_TIMEOUT,
    });
    await page
      .getByRole("button", {
        name: /Save scope selections and continue to dashboard/i,
      })
      .click();

    // Dashboard — Command Console visible
    await expect(
      page.getByRole("heading", { name: /Command Console/i }),
    ).toBeVisible({ timeout: STEP_TIMEOUT });
  });
});

test.describe("Regression — BUG-001 (toggle pill style shorthand)", () => {
  // Reproduces a React style-shorthand vs longhand console warning that
  // fires whenever a Btn pill toggles between selected/unselected.
  test.setTimeout(60_000);

  test("clicking a toggle pill produces no React style warning", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error" && /shorthand/i.test(msg.text())) {
        errors.push(msg.text());
      }
    });

    await uploadAndAdvanceFromIntro(page);
    const next = page.locator('button:has-text("Next →"):not([disabled])');

    // Direction → Audience page → click "Beta" pill (a known repro)
    await next.first().click();
    await page.getByRole("button", { name: /^Beta$/ }).click();

    // BUG-001: this assertion fails on current (unfixed) code.
    // After fix, it passes.
    expect(errors, errors.join("\n")).toEqual([]);
  });
});

test.describe("Regression — BUG-004 (Dashboard vs Assets pts mismatch)", () => {
  test.setTimeout(180_000);

  test("Dashboard Readiness == Assets Readiness for same session", async ({
    page,
  }) => {
    await uploadAndAdvanceFromIntro(page);
    const next = page.locator('button:has-text("Next →"):not([disabled])');

    // Drive through onboarding with defaults, skip deep dive.
    await next.first().click();
    await next.first().click();
    await next.first().click();
    await next.first().click();
    await page.getByRole("button", { name: /Looks good, let's go/i }).click();
    await page.getByRole("button", { name: /^Looks good$/ }).click();
    await page
      .getByRole("button", { name: /Confirm profile and continue/i })
      .click();
    await page
      .getByRole("button", { name: /Continue to launch research/i })
      .click();
    await page.getByRole("button", { name: /Start research run/i }).click();
    await expect(
      page.getByRole("heading", { name: /Analysis Complete/i }),
    ).toBeVisible({
      timeout: SCAN_TIMEOUT,
    });
    await page
      .getByRole("button", { name: /View your audience segments/i })
      .click();
    await page
      .getByRole("button", { name: /Lock your audience segments/i })
      .click();
    await page.getByRole("button", { name: /Skip all/i }).click();
    await page.getByRole("button", { name: /Skip & finish/i }).click();
    await page
      .getByRole("button", {
        name: /Save scope selections and continue to dashboard/i,
      })
      .click();

    // Read the Dashboard pts value
    await expect(
      page.getByRole("heading", { name: /Command Console/i }),
    ).toBeVisible({ timeout: STEP_TIMEOUT });
    // Locator the readiness number in Command Console.
    const dashPts = await page
      .locator("text=/Readiness/i")
      .locator("..")
      .locator("..")
      .innerText();

    // Navigate to Assets page
    await page
      .getByRole("button", { name: /Open Asset Packs section/i })
      .click();
    await expect(page.getByText(/Load Your Launch Assets/i)).toBeVisible({
      timeout: SCAN_TIMEOUT,
    });
    const assetsPts = await page
      .locator('[role="status"][aria-label*="Readiness"]')
      .innerText()
      .catch(() => "");

    // BUG-004: Dashboard reads "0 pts Rookie", Assets reads "140 pts Elite".
    // After fix: both should agree on the baseline number.
    const dashHas140 = /140/.test(dashPts);
    const assetsHas140 = /140/.test(assetsPts);

    expect(
      dashHas140 === assetsHas140,
      `Dashboard pts text="${dashPts}", Assets pts text="${assetsPts}" — they disagree on whether 140 pts is the current score.`,
    ).toBe(true);
  });
});

test.describe("Regression — BUG-005 (launch-item miscategorization)", () => {
  test.setTimeout(180_000);

  test("Email sequence is categorized as a Channel, not Operations", async ({
    page,
  }) => {
    await uploadAndAdvanceFromIntro(page);
    const next = page.locator('button:has-text("Next →"):not([disabled])');
    // Skip onboarding fast
    for (let i = 0; i < 4; i++) {
      await next.first().click();
    }
    await page.getByRole("button", { name: /Looks good, let's go/i }).click();
    await page.getByRole("button", { name: /^Looks good$/ }).click();
    await page
      .getByRole("button", { name: /Confirm profile and continue/i })
      .click();
    await page
      .getByRole("button", { name: /Continue to launch research/i })
      .click();
    await page.getByRole("button", { name: /Start research run/i }).click();
    await expect(
      page.getByRole("heading", { name: /Analysis Complete/i }),
    ).toBeVisible({
      timeout: SCAN_TIMEOUT,
    });
    await page
      .getByRole("button", { name: /View your audience segments/i })
      .click();
    await page
      .getByRole("button", { name: /Lock your audience segments/i })
      .click();
    await page.getByRole("button", { name: /Skip all/i }).click();
    await page.getByRole("button", { name: /Skip & finish/i }).click();

    await expect(page.getByText(/Here is your launch scope/i)).toBeVisible({
      timeout: STEP_TIMEOUT,
    });

    // BUG-005: "Email sequence" appears under "Operations", should be under "Channels".
    const emailSequenceButton = page.getByRole("button", {
      name: /^Email sequence/i,
    });
    if ((await emailSequenceButton.count()) === 0) {
      // Idea-brief parser is non-deterministic (BUG-006); skip if the email
      // sequence task didn't show up this run.
      test.skip();
    }
    // Walk up the DOM to find the category heading sibling.
    const category = await emailSequenceButton.evaluate((el) => {
      // Find the closest container whose first child is a category label.
      let cur: HTMLElement | null = el;
      while (cur && cur.parentElement) {
        cur = cur.parentElement;
        const firstChild = cur.firstElementChild as HTMLElement | null;
        if (
          firstChild?.textContent &&
          /^(Positioning|Audience|Channels|Assets|Operations|Other)$/i.test(
            firstChild.textContent.trim(),
          )
        ) {
          return firstChild.textContent.trim();
        }
      }
      return "";
    });

    expect(
      category.toLowerCase(),
      `Email sequence was categorized under "${category}"`,
    ).toBe("channels");
  });
});
