import { expect, test } from "@playwright/test";

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
