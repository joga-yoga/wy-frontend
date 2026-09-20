import { expect, test } from "@playwright/test";

test.describe("studio marketing page", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "wy.cookie_consent.v1",
        JSON.stringify({ analytics: false, marketing: false, decided: true }),
      );
    });
  });

  test("switches schedule tabs and exposes the matching panel content", async ({ page }) => {
    await page.goto("/system-dla-studiow-jogi");
    await expect(page).toHaveTitle("System do prowadzenia studia jogi");

    const participantTab = page.getByRole("tab", { name: "Dla uczestnika" });
    const studioTab = page.getByRole("tab", { name: "Dla studia" });

    await expect(participantTab).toHaveAttribute("aria-selected", "true");
    await expect(
      page.getByRole("heading", { name: "Pełna informacja o zajęciach przed zapisem" }),
    ).toBeVisible();

    await studioTab.click();
    await expect(studioTab).toHaveAttribute("aria-selected", "true");
    await expect(
      page.getByRole("heading", { name: "Grafik i zapisy w jednym miejscu" }),
    ).toBeVisible();
  });

  test("opens only the first FAQ initially and toggles items independently", async ({ page }) => {
    await page.goto("/system-dla-studiow-jogi");

    const faqButtons = page.getByRole("heading", { level: 3 }).getByRole("button");
    await expect(faqButtons).toHaveCount(11);
    await expect(faqButtons.nth(0)).toHaveAttribute("aria-expanded", "true");
    await expect(faqButtons.nth(1)).toHaveAttribute("aria-expanded", "false");

    await faqButtons.nth(1).press("Enter");
    await expect(faqButtons.nth(0)).toHaveAttribute("aria-expanded", "true");
    await expect(faqButtons.nth(1)).toHaveAttribute("aria-expanded", "true");

    await faqButtons.nth(0).press("Space");
    await expect(faqButtons.nth(0)).toHaveAttribute("aria-expanded", "false");
  });

  test("uses the required CTA destinations", async ({ page }) => {
    await page.goto("/system-dla-studiow-jogi");

    await expect(
      page.getByRole("link", { name: "Dodaj lub potwierdź studio" }).first(),
    ).toHaveAttribute("href", "/studio/dodaj");

    await expect(page.getByRole("link", { name: "Dodaj swoje studio" }).first()).toHaveAttribute(
      "href",
      "/studio/dodaj",
    );
    await expect(page.getByRole("link", { name: "Zobacz pełny cennik" })).toHaveAttribute(
      "href",
      "/cennik",
    );
    await expect(
      page.getByRole("link", { name: "Zobacz, jak łatwo przenieść dane →" }),
    ).toHaveAttribute("href", "/account/login");
    await expect(page.getByRole("link", { name: "Napisz do nas" })).toHaveAttribute(
      "href",
      "/contact",
    );
  });

  test("uses a full-width mobile hero CTA and a single tappable first-step row", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 403, height: 850 });
    await page.goto("/system-dla-studiow-jogi");

    const heroCta = page.getByRole("link", { name: "Dodaj swoje studio" }).last();
    const heroCtaBounds = await heroCta.boundingBox();
    const heroActionsBounds = await heroCta.locator("xpath=..").boundingBox();
    expect(heroCtaBounds).not.toBeNull();
    expect(heroActionsBounds).not.toBeNull();
    expect(heroCtaBounds!.width).toBeCloseTo(heroActionsBounds!.width, 0);
    await expect(heroCta).toHaveAttribute("href", "/studio/dodaj");

    const firstStep = page.getByRole("link", {
      name: "Dodaj lub potwierdź studio. Podaj najważniejsze dane i sprawdź podgląd profilu",
    });
    await expect(firstStep).toHaveAttribute("href", "/studio/dodaj");
    await expect(firstStep.locator("a, button")).toHaveCount(0);
    await expect(
      page
        .getByRole("heading", { name: "Ułóż pierwszy grafik" })
        .locator("xpath=ancestor::li")
        .locator("a, button"),
    ).toHaveCount(0);
    await expect(
      page
        .getByRole("heading", { name: "Zapraszaj i rozwijaj" })
        .locator("xpath=ancestor::li")
        .locator("a, button"),
    ).toHaveCount(0);

    await firstStep.focus();
    await firstStep.press("Enter");
    await expect(page).toHaveURL(/\/studio\/dodaj$/);
  });

  for (const width of [320, 403, 768, 1440]) {
    test(`has no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 850 });
      await page.goto("/system-dla-studiow-jogi");
      const hasOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      );
      expect(hasOverflow).toBe(false);
    });
  }
});
