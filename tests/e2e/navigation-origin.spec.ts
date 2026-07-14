import { expect, test } from "@playwright/test";

const STORAGE_KEY = "detail-navigation-origin";

test.describe("detail navigation origin", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("renders the logo on cold entry", async ({ page }) => {
    await page.goto("/instruktor/hero-fixture");
    await expect(page.getByTestId("public-header-mobile-navigation")).toHaveAttribute("href", "/");
    await expect(page.getByLabel("Strona główna")).toBeVisible();
    await expect(page.getByLabel("Wróć")).toHaveCount(0);
  });

  test("records and overwrites the origin when a detail link navigates", async ({ page }) => {
    await page.goto("/instruktor/navigation-fixture");
    await page.evaluate((key) => {
      sessionStorage.setItem(
        key,
        JSON.stringify({ target: "/wydarzenia/old-event", origin: "/wyjazdy" }),
      );
    }, STORAGE_KEY);
    const detailLink = page.locator('a[href^="/wydarzenia/"]').first();
    const target = await detailLink.getAttribute("href");
    expect(target).not.toBeNull();

    await detailLink.click();
    await expect
      .poll(() =>
        page.evaluate((key) => JSON.parse(sessionStorage.getItem(key) ?? "null"), STORAGE_KEY),
      )
      .toEqual({ target, origin: "/instruktor/navigation-fixture" });
  });

  test("uses only an origin whose target exactly matches the current page", async ({ page }) => {
    await page.goto("/delete-account");
    await page.evaluate(
      ({ key }) => {
        sessionStorage.setItem(
          key,
          JSON.stringify({
            target: "/instruktor/hero-fixture",
            origin: "/wydarzenia/source-event",
          }),
        );
      },
      { key: STORAGE_KEY },
    );

    await page.goto("/instruktor/hero-fixture");
    await expect(page.getByTestId("public-header-mobile-navigation")).toHaveAttribute(
      "href",
      "/wydarzenia/source-event",
    );

    await page.reload();
    await expect(page.getByTestId("public-header-mobile-navigation")).toHaveAttribute(
      "href",
      "/wydarzenia/source-event",
    );
  });

  test("renders the logo instead of consuming a stale origin", async ({ page }) => {
    await page.goto("/delete-account");
    await page.evaluate(
      ({ key }) => {
        sessionStorage.setItem(
          key,
          JSON.stringify({ target: "/wydarzenia/event-a", origin: "/wyjazdy" }),
        );
      },
      { key: STORAGE_KEY },
    );

    await page.goto("/instruktor/hero-fixture");
    await expect(page.getByTestId("public-header-mobile-navigation")).toHaveAttribute("href", "/");
    await expect(page.getByLabel("Strona główna")).toBeVisible();
    await expect(page.getByLabel("Wróć")).toHaveCount(0);
  });
});

test("keeps the desktop logo behavior on detail pages", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/instruktor/hero-fixture");

  await expect(page.locator("header a.hidden.md\\:flex")).toBeVisible();
  await expect(page.getByTestId("public-header-mobile-navigation")).toBeHidden();
});
