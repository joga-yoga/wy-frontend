import { expect, test } from "@playwright/test";

function expectCloseTo(value: number, expected: number, tolerance = 3) {
  expect(Math.abs(value - expected)).toBeLessThanOrEqual(tolerance);
}

test.describe("instructor profile hero", () => {
  test("matches the mobile Hero-2 layout", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/instructor/hero-fixture");

    const hero = page.getByTestId("instructor-hero");
    const heroCard = page.getByTestId("instructor-hero-card");
    const avatar = page.getByTestId("instructor-hero-avatar");
    const info = page.getByTestId("instructor-hero-info");
    const name = page.getByTestId("instructor-hero-name");
    const shortBio = page.getByTestId("instructor-hero-short-bio");
    const highlights = page.getByTestId("instructor-highlights");
    const certificate = page.getByTestId("instructor-highlight-certificate");
    const studio = page.getByTestId("instructor-highlight-studio");
    const location = page.getByTestId("instructor-highlight-location");
    const experience = page.getByTestId("instructor-highlight-experience");
    const language = page.getByTestId("instructor-highlight-language");

    await expect(hero).toBeVisible();
    await expect(name).toContainText("Nadolny Przemek");
    await expect(shortBio).toBeVisible();
    await expect(certificate).toContainText("RYT500");
    await expect(studio).toContainText("Studio: Bodhi Yoga Shala");
    await expect(location).toContainText("Łódź");
    await expect(experience).toContainText("Hatha");
    await expect(language).toContainText("język: polski");

    const heroCardBox = await heroCard.boundingBox();
    const avatarBox = await avatar.boundingBox();
    const infoBox = await info.boundingBox();
    const nameBox = await name.boundingBox();
    const bioBox = await shortBio.boundingBox();
    const highlightsBox = await highlights.boundingBox();
    const certificateBox = await certificate.boundingBox();
    const studioBox = await studio.boundingBox();
    const locationBox = await location.boundingBox();
    const experienceBox = await experience.boundingBox();
    const languageBox = await language.boundingBox();

    expect(heroCardBox).not.toBeNull();
    expect(avatarBox).not.toBeNull();
    expect(infoBox).not.toBeNull();
    expect(nameBox).not.toBeNull();
    expect(bioBox).not.toBeNull();
    expect(highlightsBox).not.toBeNull();
    expect(certificateBox).not.toBeNull();
    expect(studioBox).not.toBeNull();
    expect(locationBox).not.toBeNull();
    expect(experienceBox).not.toBeNull();
    expect(languageBox).not.toBeNull();

    expectCloseTo(heroCardBox!.width, 354);
    expectCloseTo(heroCardBox!.height, 166);
    expectCloseTo(avatarBox!.width, 130);
    expectCloseTo(avatarBox!.height, 130);
    expectCloseTo(infoBox!.height, 142);

    expect(infoBox!.x).toBeGreaterThan(avatarBox!.x + avatarBox!.width);
    expect(nameBox!.x).toBeGreaterThan(avatarBox!.x + avatarBox!.width);
    expect(bioBox!.y).toBeGreaterThan(nameBox!.y);
    expect(highlightsBox!.y).toBeGreaterThan(heroCardBox!.y + heroCardBox!.height);
    expect(studioBox!.y).toBeGreaterThan(certificateBox!.y);
    expect(locationBox!.y).toBeGreaterThan(studioBox!.y);
    expect(experienceBox!.y).toBeGreaterThan(locationBox!.y);
    expect(languageBox!.y).toBeGreaterThan(experienceBox!.y);

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(hasHorizontalOverflow).toBe(false);
  });

  test("scales the same hero system on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/instructor/hero-fixture");

    const heroCard = page.getByTestId("instructor-hero-card");
    const avatar = page.getByTestId("instructor-hero-avatar");
    const info = page.getByTestId("instructor-hero-info");
    const highlights = page.getByTestId("instructor-highlights");

    await expect(page.getByTestId("instructor-hero")).toBeVisible();
    await expect(highlights).toContainText("Asztanga");

    const heroCardBox = await heroCard.boundingBox();
    const avatarBox = await avatar.boundingBox();
    const infoBox = await info.boundingBox();

    expect(heroCardBox).not.toBeNull();
    expect(avatarBox).not.toBeNull();
    expect(infoBox).not.toBeNull();

    expect(heroCardBox!.width).toBeGreaterThan(900);
    expectCloseTo(heroCardBox!.height, 260);
    expectCloseTo(avatarBox!.width, 190);
    expectCloseTo(avatarBox!.height, 190);
    expectCloseTo(infoBox!.height, 196);

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(hasHorizontalOverflow).toBe(false);
  });
});
