import { expect, test } from "@playwright/test";

test.describe("studio CTA landing", () => {
  test("uses the static dodaj route and renders real studio cards", async ({ page }) => {
    const response = await page.goto("/studio/dodaj");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "Pokaż swoje studio jogi" })).toBeVisible();
    const examples = page.getByRole("region", { name: "Studia, które już tworzą z nami" });
    await expect(examples.getByRole("link")).toHaveCount(3);
    await expect(examples.getByRole("heading", { name: "Studio Światło" })).toBeVisible();
  });

  for (const width of [320, 375, 402, 1440]) {
    test(`has no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 850 });
      await page.goto("/studio/dodaj");
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      );
      expect(overflow).toBe(false);
    });
  }

  test("discovers both stores and selects a draft with the keyboard", async ({ page }) => {
    await page.route("**/studio-setup/search**", (route) =>
      route.fulfill({
        json: [
          {
            kind: "studio",
            id: "studio-1",
            name: "Studio Światło",
            city: "Warszawa",
            address: "Długa 1",
            action: "edit",
          },
          {
            kind: "directory",
            id: "directory-1",
            name: "Studio Światło",
            city: "Kraków",
            address: "Leśna 2",
            action: "claim",
          },
          {
            kind: "studio",
            id: "studio-3",
            name: "Dom Jogi",
            city: "Gdańsk",
            address: "Leśna 3",
            action: "managed",
          },
        ],
      }),
    );
    let selected: unknown;
    await page.route("**/studio-setup/drafts", (route) => {
      selected = route.request().postDataJSON();
      return route.fulfill({ json: { public_token: "selected-directory" } });
    });
    await page.setViewportSize({ width: 402, height: 850 });
    await page.goto("/studio/dodaj");
    const discovery = page
      .getByRole("region", { name: "Znajdź swoje studio" })
      .filter({ visible: true });
    await discovery.getByRole("textbox", { name: "Nazwa studia" }).fill("Studio");
    await expect(discovery.getByText("Warszawa · Długa 1")).toBeVisible();
    await expect(discovery.getByText("Kraków · Leśna 2")).toBeVisible();
    await expect(discovery.getByText("Profil jest już zarządzany")).toBeVisible();
    await expect(discovery.getByRole("link", { name: "Dodaj studio ręcznie" })).toBeVisible();
    await expect(discovery.getByRole("link", { name: "Przenieś dane z Fitssey" })).toBeVisible();
    await discovery.getByRole("button", { name: "To moje studio" }).focus();
    await page.keyboard.press("Enter");
    await expect.poll(() => selected).toEqual({ kind: "directory", id: "directory-1" });
    await expect(page).toHaveURL(/draft(?:=|%3D)selected-directory/);
  });

  test("loaded desktop results keep the full discovery card and both alternatives accessible", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.route("**/studio-setup/search**", (route) =>
      route.fulfill({
        json: Array.from({ length: 10 }, (_, index) => ({
          kind: "directory",
          id: `source-${index}`,
          name: `Studio ${index}`,
          city: "Warszawa",
          address: "Długa 1",
          action: "claim",
        })),
      }),
    );
    await page.goto("/studio/dodaj");
    const cookies = page.getByRole("button", { name: "Tylko niezbędne", exact: true });
    if (await cookies.isVisible()) await cookies.click();
    const discovery = page
      .getByRole("region", { name: "Znajdź swoje studio" })
      .filter({ visible: true });
    await discovery.getByRole("textbox", { name: "Nazwa studia" }).fill("Studio");
    await expect(discovery.getByRole("button", { name: "To moje studio" })).toHaveCount(10);
    const bounds = await discovery.evaluate((element) => ({
      cardBottom: element.getBoundingClientRect().bottom,
      heroBottom: element.closest("main > section")!.getBoundingClientRect().bottom,
    }));
    expect(bounds.cardBottom).toBeLessThanOrEqual(bounds.heroBottom);
    await discovery.getByRole("link", { name: "Dodaj studio ręcznie" }).click({ trial: true });
    await discovery.getByRole("link", { name: "Przenieś dane z Fitssey" }).click({ trial: true });
  });

  test("keeps manual and import alternatives after empty lookup or an error", async ({ page }) => {
    await page.route("**/studio-setup/search**", (route) => route.fulfill({ json: [] }));
    await page.goto("/studio/dodaj");
    const discovery = page
      .getByRole("region", { name: "Znajdź swoje studio" })
      .filter({ visible: true });
    await discovery.getByRole("textbox", { name: "Nazwa studia" }).fill("Nowa szkoła");
    await expect(discovery.getByText("Nie znaleziono studia")).toBeVisible();
    await expect(discovery.getByRole("link", { name: "Dodaj studio ręcznie" })).toBeVisible();
    await page.route("**/studio-setup/search**", (route) =>
      route.fulfill({ status: 503, json: {} }),
    );
    await discovery.getByRole("textbox", { name: "Nazwa studia" }).fill("Inna szkoła");
    await expect(
      discovery.getByText("Nie udało się wyszukać studia. Spróbuj ponownie."),
    ).toBeVisible();
    await expect(discovery.getByRole("link", { name: "Przenieś dane z Fitssey" })).toBeVisible();
  });

  test("legacy preview still has no live schedule links", async ({ page }) => {
    await page.goto("/studio/dodaj/preview/studio-preview-fixture");
    await expect(page.getByRole("heading", { name: "Studio Światło" })).toBeVisible();
    await expect(page.getByRole("link", { name: /grafik/i })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Załóż konto i zarządzaj studiem" })).toBeVisible();
  });
});
