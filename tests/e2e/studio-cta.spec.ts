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

  test("shows suggestions after three characters and supports keyboard selection", async ({
    page,
  }) => {
    await page.route("http://localhost:8000/public/studios/search**", async (route) => {
      await route.fulfill({
        json: [
          {
            id: "studio-1",
            name: "Studio Światło",
            slug: "studio-swiatlo",
            address: "Długa 1",
            city: "Warszawa",
            image_id: null,
            is_claimed: false,
          },
          {
            id: "studio-3",
            name: "Dom Jogi",
            slug: "dom-jogi",
            address: "Leśna 3",
            city: "Gdańsk",
            image_id: null,
            is_claimed: true,
          },
        ],
      });
    });
    await page.setViewportSize({ width: 402, height: 850 });
    await page.goto("/studio/dodaj");
    const input = page.getByRole("combobox", { name: "Wpisz nazwę studia" });
    await input.fill("Stu");
    await expect(page.getByRole("option", { name: /Studio Światło/ })).toBeVisible();
    await expect(page.getByRole("option", { name: /Dom Jogi/ })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await input.press("ArrowDown");
    await input.press("Enter");
    await expect(
      page
        .getByRole("form", { name: "Generator strony studia jogi" })
        .getByText("Wybrano istniejące studio"),
    ).toBeVisible();
  });

  test("generates a preview and preview does not render live schedule links", async ({ page }) => {
    await page.route("http://localhost:8000/public/studios/search**", async (route) => {
      await route.fulfill({ json: [] });
    });
    await page.route("http://localhost:8000/studio-profile-drafts/generate", async (route) => {
      await route.fulfill({
        json: {
          draft_id: "studio-preview-fixture",
          public_token: "studio-preview-fixture",
          public_url: "/studio/dodaj/preview/studio-preview-fixture",
          draft_kind: "generated",
          status: "generated",
          profile: {},
          sources: [],
          confidence: {},
          image_provenance: {},
          error_message: null,
          expires_at: "2026-08-18T00:00:00.000Z",
        },
      });
    });
    await page.setViewportSize({ width: 402, height: 850 });
    await page.goto("/studio/dodaj");
    const input = page.getByRole("combobox", { name: "Wpisz nazwę studia" });
    await input.fill("Nowe studio");
    await page.getByRole("button", { name: "Zobacz szkic" }).click();
    await expect(page).toHaveURL(/\/studio\/dodaj\/preview\/studio-preview-fixture$/);
    await expect(page.getByRole("heading", { name: "Studio Światło" })).toBeVisible();
    await expect(page.getByRole("link", { name: /grafik/i })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Załóż konto i zarządzaj studiem" })).toBeVisible();
  });
});
