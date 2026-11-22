import { expect, test } from "@playwright/test";

test("the homepage links to both catalogues and the mobile tabs connect them", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Tylko niezbędne" }).click();
  await expect(page.getByRole("heading", { name: "Pokaż swoją jogę" })).toBeVisible();
  const footer = page.getByRole("contentinfo");
  await expect(footer.getByRole("link", { name: "Wyjazdy jogowe i retrity" })).toHaveAttribute(
    "href",
    "/wyjazdy",
  );
  await footer.getByRole("link", { name: "Wydarzenia i warsztaty jogowe" }).click();
  await expect(page).toHaveURL(/\/wydarzenia$/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://joga.yoga/wydarzenia",
  );

  const header = page.getByRole("banner");
  await expect(header.getByRole("link", { name: "Wydarzenia", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await header.getByRole("link", { name: "Wyjazdy", exact: true }).click();
  await expect(page).toHaveURL(/\/wyjazdy$/);
  await header.getByRole("link", { name: "Wydarzenia", exact: true }).click();
  await expect(page).toHaveURL(/\/wydarzenia$/);
  await header.getByRole("link", { name: "Strona główna", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Pokaż swoją jogę" })).toBeVisible();
});

test("workshop sorting, search and filter reset stay on the catalogue", async ({ page }) => {
  await page.goto("/wydarzenia");
  await page.getByRole("button", { name: "Tylko niezbędne" }).click();
  await page.getByRole("button", { name: "Sortuj według daty" }).click();
  await expect(page).toHaveURL(/\/wydarzenia\?sortBy=start_date&sortOrder=asc$/);
  await page.getByRole("button", { name: "Szukaj wydarzeń" }).click();
  await page.getByPlaceholder("Wyszukaj warsztaty...").fill("joga");
  await expect(page).toHaveURL(/\/wydarzenia\?.*search=joga/);
  await page.getByRole("button", { name: "Close search" }).click();
  await expect(page).toHaveURL(/\/wydarzenia\?sortBy=start_date&sortOrder=asc$/);
  await page.getByRole("button", { name: "Pokaż wydarzenia online" }).click();
  await expect(page).toHaveURL(/\/wydarzenia\?.*is_online=true/);
  await page.getByRole("button", { name: "Filtruj wydarzenia" }).click();
  await page.getByText("Wyczyść wszystko", { exact: true }).click();
  await page.getByRole("button", { name: "Pokaż wyniki" }).click();
  await expect(page).toHaveURL(/\/wydarzenia$/);
});

test("legacy catalogue and partner URLs redirect to the matching page", async ({ request }) => {
  for (const [source, destination] of [
    ["/workshops?sortBy=start_date", "/wydarzenia?sortBy=start_date"],
    ["/partners", "/"],
    ["/wydarzenia/partners", "/"],
    ["/wyjazdy/partners", "/"],
    ["/workshops/partners", "/"],
    ["/retreats/partners", "/"],
  ]) {
    const response = await request.get(source, { maxRedirects: 0 });
    expect(response.status(), source).toBe(308);
    expect(response.headers().location, source).toBe(destination);
  }
});
