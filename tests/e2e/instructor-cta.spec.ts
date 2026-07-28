import { expect, type Locator, test } from "@playwright/test";

function getHeadingTypography(locator: Locator) {
  return locator.evaluate((element) => {
    const style = window.getComputedStyle(element);
    return {
      color: style.color,
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      letterSpacing: style.letterSpacing,
      lineHeight: style.lineHeight,
    };
  });
}

test.describe("instructor CTA landing", () => {
  test("renders the public landing without a header and with the main footer", async ({ page }) => {
    await page.setViewportSize({ width: 402, height: 900 });
    await page.goto("/instruktor/dodaj");

    await expect(
      page.getByRole("heading", { name: "Tworzenie strony nauczyciela jogi" }),
    ).toBeVisible();
    await expect(page.getByRole("banner")).toHaveCount(0);
    await expect(page.getByRole("contentinfo")).toBeVisible();
    await expect(page.getByRole("link", { name: "Kontakt" })).toBeVisible();
  });

  test("keeps Anna first and does not render empty-state copy", async ({ page }) => {
    await page.goto("/instruktor/dodaj");

    const examples = page.getByRole("region", { name: "Strony innych nauczycieli" });
    await expect(examples.getByRole("heading", { name: "Anna Kowalska" })).toBeVisible();
    await expect(examples.getByRole("link")).toHaveCount(1);
    await expect(page.getByText(/wkrótce/i)).toHaveCount(0);
  });

  for (const viewportWidth of [320, 375, 402]) {
    test(`aligns the examples copy at 32px on a ${viewportWidth}px viewport`, async ({ page }) => {
      await page.setViewportSize({ width: viewportWidth, height: 812 });
      await page.goto("/instruktor/dodaj");

      const examples = page.getByRole("region", { name: "Strony innych nauczycieli" });
      const heading = examples.getByRole("heading", { name: "Strony innych nauczycieli" });
      const description = examples.getByText("Poczuj inspirację");
      const propertiesHeading = page.getByRole("heading", { name: "Co zawiera Twoja strona" });
      const card = examples.locator('a[href="/instruktor/anna-kowalska"]');
      const image = examples.getByRole("img", { name: "Anna Kowalska" });

      const headingBox = await heading.boundingBox();
      const descriptionBox = await description.boundingBox();
      const cardBox = await card.boundingBox();
      const imageBox = await image.boundingBox();

      expect(headingBox).not.toBeNull();
      expect(descriptionBox).not.toBeNull();
      expect(cardBox).not.toBeNull();
      expect(imageBox).not.toBeNull();

      expect(headingBox!.x).toBeCloseTo(32, 0);
      expect(headingBox!.width).toBeCloseTo(viewportWidth - 64, 0);
      expect(descriptionBox!.x).toBeCloseTo(32, 0);
      expect(descriptionBox!.width).toBeCloseTo(viewportWidth - 64, 0);
      expect(cardBox!.x).toBeCloseTo(0, 0);
      expect(cardBox!.width).toBeCloseTo(viewportWidth, 0);
      expect(imageBox!.width / imageBox!.height).toBeGreaterThan(1.45);
      await expect(getHeadingTypography(heading)).resolves.toEqual(
        await getHeadingTypography(propertiesHeading),
      );

      const hasHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      );
      expect(hasHorizontalOverflow).toBe(false);
    });
  }

  test("keeps the examples section at the existing 80px desktop inset", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/instruktor/dodaj");

    const examples = page.getByRole("region", { name: "Strony innych nauczycieli" });
    const heading = examples.getByRole("heading", { name: "Strony innych nauczycieli" });
    const propertiesHeading = page.getByRole("heading", { name: "Co zawiera Twoja strona" });
    const card = examples.locator('a[href="/instruktor/anna-kowalska"]');

    const headingBox = await heading.boundingBox();
    const cardBox = await card.boundingBox();

    expect(headingBox).not.toBeNull();
    expect(cardBox).not.toBeNull();
    expect(headingBox!.x).toBeCloseTo(80, 0);
    expect(cardBox!.x).toBeCloseTo(80, 0);
    await expect(getHeadingTypography(heading)).resolves.toEqual(
      await getHeadingTypography(propertiesHeading),
    );
  });

  test("matches the mobile schedule benefit composition", async ({ page }) => {
    await page.setViewportSize({ width: 402, height: 900 });
    await page.goto("/instruktor/dodaj");

    const benefits = page.getByRole("region", { name: "Co daje strona na joga.yoga?" });
    const card = benefits.getByTestId("instructor-schedule-benefit");
    const title = card.getByRole("heading", { name: "Jeden grafik z różnych miejsc" });
    const description = card.getByText("Połącz zajęcia z kilku studiów w jeden grafik");

    const cardBox = await card.boundingBox();
    const titleBox = await title.boundingBox();
    const descriptionBox = await description.boundingBox();

    expect(cardBox).not.toBeNull();
    expect(titleBox).not.toBeNull();
    expect(descriptionBox).not.toBeNull();
    expect(cardBox!.width).toBeCloseTo(338, 0);
    expect(cardBox!.height).toBeCloseTo(114, 0);
    expect(titleBox!.x).toBeCloseTo(cardBox!.x + 24, 0);
    expect(descriptionBox!.x).toBeCloseTo(cardBox!.x + 68, 0);
    expect(descriptionBox!.y).toBeGreaterThan(titleBox!.y + titleBox!.height);
  });

  test("matches the desktop schedule benefit composition", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/instruktor/dodaj");

    const benefits = page.getByRole("region", { name: "Co daje strona na joga.yoga?" });
    const card = benefits.getByTestId("instructor-schedule-benefit");
    const title = card.getByRole("heading", { name: "Jeden grafik z różnych miejsc" });
    const description = card.getByText("Połącz zajęcia z kilku studiów w jeden grafik");

    const cardBox = await card.boundingBox();
    const titleBox = await title.boundingBox();
    const descriptionBox = await description.boundingBox();

    expect(cardBox).not.toBeNull();
    expect(titleBox).not.toBeNull();
    expect(descriptionBox).not.toBeNull();
    expect(cardBox!.width).toBeCloseTo(568, 0);
    expect(cardBox!.height).toBeCloseTo(81, 0);
    expect(titleBox!.x).toBeCloseTo(cardBox!.x + 92, 0);
    expect(descriptionBox!.x).toBeCloseTo(titleBox!.x, 0);
    expect(descriptionBox!.y).toBeGreaterThan(titleBox!.y);
  });

  test("validates an empty profile query before generation", async ({ page }) => {
    await page.setViewportSize({ width: 402, height: 900 });
    await page.goto("/instruktor/dodaj");

    await page.getByRole("button", { name: "Zobacz szkic strony" }).click();
    await expect(page.locator("#instructor-query-mobile-error")).toHaveText(
      "Podaj imię i nazwisko albo link do swojego profilu.",
    );
  });

  test("does not keep or redirect the removed create route", async ({ page }) => {
    const response = await page.goto("/create");

    expect(response?.status()).toBe(404);
    await expect(page).toHaveURL(/\/create$/);
  });

  test("canonicalizes the internal instructor route", async ({ page }) => {
    await page.goto("/instructor/dodaj");

    await expect(page).toHaveURL(/\/instruktor\/dodaj$/);
  });
});
