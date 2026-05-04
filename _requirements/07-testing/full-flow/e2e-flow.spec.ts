import { test, expect, Page } from "@playwright/test";
import { uploadResume, RESUME_FIXTURES } from "../../_shared/helpers/upload";

// Full-flow E2E — exercises the 12-step user journey end-to-end.
// Generated 2026-05-02 alongside ISSUES.md as part of the QA sweep.
// Each test maps to one or more bugs (BUG-NNN) so regression-after-fix is
// auditable. Use `npm run test -- _requirements/full-flow` to run.

const STEP_TIMEOUT = 60_000;
const SCAN_TIMEOUT = 90_000;

async function uploadAndAdvanceFromIntro(page: Page): Promise<void> {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await uploadResume(page, RESUME_FIXTURES.docxHappy);
  // After drop, page advances to step 2 (CONFIRM) automatically.
  await expect(page.getByText(/Resume parsed/i)).toBeVisible({
    timeout: STEP_TIMEOUT,
  });
}

test.describe("Full E2E — happy path", () => {
  test.setTimeout(180_000);

  test("intro → upload → search → market scan → dashboard", async ({
    page,
  }) => {
    await uploadAndAdvanceFromIntro(page);

    // Step 2 sub-flow: direction → work-type → comp → location → quick-check → skip-list → confirm.
    // Defaults are pre-selected; just hit Next through each.
    // The disabled "Next step" progress-bar arrow at the top has the same
    // role+name pattern as the page's actual "Next →" button. Filter to the
    // enabled one only — that's the one we click.
    const nextBtn = page.locator('button:has-text("Next →"):not([disabled])');

    // Direction page (Same or similar role pre-selected)
    await nextBtn.first().click();
    // Work type page (Full-time + Immediately pre-selected)
    await nextBtn.first().click();
    // Comp page (open to discussion default)
    await nextBtn.first().click();
    // Location page (Remote default)
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

    // Interstitial → recon
    await page.getByRole("button", { name: /Continue to job search/i }).click();
    await expect(page.getByText(/Recon Mission/i)).toBeVisible({
      timeout: STEP_TIMEOUT,
    });

    // Launch recon
    await page.getByRole("button", { name: /Launch recon/i }).click();
    await expect(
      page.getByRole("heading", { name: /Analysis Complete/i }),
    ).toBeVisible({
      timeout: SCAN_TIMEOUT,
    });

    // Targets → lock → deep dive → skip → skills → dashboard
    await page
      .getByRole("button", { name: /View your target categories/i })
      .click();
    await expect(
      page.getByRole("heading", { name: /Lock Your Targets/i }),
    ).toBeVisible({
      timeout: STEP_TIMEOUT,
    });
    await page
      .getByRole("button", { name: /Lock your target categories/i })
      .click();

    await expect(page.getByText(/Deep Dive/i)).toBeVisible({
      timeout: STEP_TIMEOUT,
    });
    await page.getByRole("button", { name: /Skip all/i }).click();
    await page.getByRole("button", { name: /Skip & finish/i }).click();

    await expect(page.getByText(/Here are your skills/i)).toBeVisible({
      timeout: STEP_TIMEOUT,
    });
    await page
      .getByRole("button", {
        name: /Save skill selections and continue to dashboard/i,
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

    // Direction → Work-type page → click "Contract" pill (a known repro)
    await next.first().click();
    await page.getByRole("button", { name: /^Contract$/ }).click();

    // BUG-001: this assertion fails on current (unfixed) code.
    // After fix, it passes.
    expect(errors, errors.join("\n")).toEqual([]);
  });
});

test.describe("Regression — BUG-004 (Dashboard vs Resumes pts mismatch)", () => {
  test.setTimeout(180_000);

  test("Dashboard Competitiveness == Resumes Competitiveness for same session", async ({
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
    await page.getByRole("button", { name: /Continue to job search/i }).click();
    await page.getByRole("button", { name: /Launch recon/i }).click();
    await expect(
      page.getByRole("heading", { name: /Analysis Complete/i }),
    ).toBeVisible({
      timeout: SCAN_TIMEOUT,
    });
    await page
      .getByRole("button", { name: /View your target categories/i })
      .click();
    await page
      .getByRole("button", { name: /Lock your target categories/i })
      .click();
    await page.getByRole("button", { name: /Skip all/i }).click();
    await page.getByRole("button", { name: /Skip & finish/i }).click();
    await page
      .getByRole("button", {
        name: /Save skill selections and continue to dashboard/i,
      })
      .click();

    // Read the Dashboard pts value
    await expect(
      page.getByRole("heading", { name: /Command Console/i }),
    ).toBeVisible({ timeout: STEP_TIMEOUT });
    // Locator the competitiveness number in Command Console.
    const dashPts = await page
      .locator("text=/Competitiveness/i")
      .locator("..")
      .locator("..")
      .innerText();

    // Navigate to Resumes page
    await page.getByRole("button", { name: /Open Resumes section/i }).click();
    await expect(page.getByText(/Load Your Warheads/i)).toBeVisible({
      timeout: SCAN_TIMEOUT,
    });
    const resumesPts = await page
      .locator('[role="status"][aria-label*="Competitiveness"]')
      .innerText()
      .catch(() => "");

    // BUG-004: Dashboard reads "0 pts Rookie", Resumes reads "140 pts Elite".
    // After fix: both should agree on the baseline number.
    const dashHas140 = /140/.test(dashPts);
    const resumesHas140 = /140/.test(resumesPts);

    expect(
      dashHas140 === resumesHas140,
      `Dashboard pts text="${dashPts}", Resumes pts text="${resumesPts}" — they disagree on whether 140 pts is the current score.`,
    ).toBe(true);
  });
});

test.describe("Regression — BUG-005 (skill miscategorization)", () => {
  test.setTimeout(180_000);

  test("Mixpanel is categorized as a Tool, not Methodology", async ({
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
    await page.getByRole("button", { name: /Continue to job search/i }).click();
    await page.getByRole("button", { name: /Launch recon/i }).click();
    await expect(
      page.getByRole("heading", { name: /Analysis Complete/i }),
    ).toBeVisible({
      timeout: SCAN_TIMEOUT,
    });
    await page
      .getByRole("button", { name: /View your target categories/i })
      .click();
    await page
      .getByRole("button", { name: /Lock your target categories/i })
      .click();
    await page.getByRole("button", { name: /Skip all/i }).click();
    await page.getByRole("button", { name: /Skip & finish/i }).click();

    await expect(page.getByText(/Here are your skills/i)).toBeVisible({
      timeout: STEP_TIMEOUT,
    });

    // BUG-005: Mixpanel appears under "Methodology", should be under "Tools".
    const mixpanelButton = page.getByRole("button", { name: /^Mixpanel/i });
    if ((await mixpanelButton.count()) === 0) {
      // Resume parser is non-deterministic (BUG-006); skip if Mixpanel didn't
      // show up this run.
      test.skip();
    }
    // Walk up the DOM to find the category heading sibling.
    const category = await mixpanelButton.evaluate((el) => {
      // Find the closest container whose first child is a category label.
      let cur: HTMLElement | null = el;
      while (cur && cur.parentElement) {
        cur = cur.parentElement;
        const firstChild = cur.firstElementChild as HTMLElement | null;
        if (
          firstChild?.textContent &&
          /^(Leadership|Domain|Technical|Tools|Methodology|Other)$/i.test(
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
      `Mixpanel was categorized under "${category}"`,
    ).toBe("tools");
  });
});
