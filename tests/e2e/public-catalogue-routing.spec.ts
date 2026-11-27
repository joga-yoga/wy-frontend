import { expect, test } from "@playwright/test";

import { expectIntactDismissal } from "../popup-dismissal";

test("public studio pass drawers preserve their contents during dismissal", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/studio/popup-fixture");
  await page.getByRole("button", { name: "Tylko niezbędne", exact: true }).click();
  const popup = page.locator('[data-slot="drawer-popup"]');
  for (const [name, description] of [
    ["Karnet poranny", "Poranna praktyka"],
    ["Karnet wieczorny", "Wieczorna praktyka"],
  ]) {
    await page.getByRole("button", { name: new RegExp(name) }).click();
    await expect(popup.getByRole("heading", { name }).first()).toBeAttached();
    await expect(popup).toContainText(description);
    await expectIntactDismissal(
      popup,
      () => popup.getByRole("button", { name: "Zamknij", exact: true }).click(),
      "slide-down",
    );
  }
  await page.getByRole("button", { name: /MultiSport/ }).click();
  await expect(popup).toContainText("Dopłata na recepcji");
  await expectIntactDismissal(popup, () =>
    popup.getByRole("button", { name: "Zamknij", exact: true }).click(),
  );
});

test("public session detail keeps the outgoing class on link dismissal and browser Back", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/public/occurrences/*/detail?**", (route) => {
    const id = new URL(route.request().url()).pathname.split("/")[3];
    return route.fulfill({
      json: {
        id,
        template_title: id === "saved" ? "Zapisane zajęcia" : "Kolejne zajęcia",
        description: "Opis sesji pozostaje widoczny.",
        status: "cancelled",
        start_time: "2099-11-01T12:00:00Z",
        end_time: "2099-11-01T13:00:00Z",
        calendar_date: "2099-11-01",
        studio: { id: "studio-1", name: "Studio Światło", room_count: 0 },
      },
    });
  });
  await page.goto("/studio/popup-fixture?from=test&occurrence=saved");
  const cookies = page.getByRole("button", { name: "Tylko niezbędne", exact: true });
  if (await cookies.isVisible()) await cookies.click();
  const popup = page.locator('[data-slot="drawer-popup"]');
  await expect(popup).toContainText("Zapisane zajęcia");
  await expect(popup).toContainText("Opis sesji pozostaje widoczny.");
  await expectIntactDismissal(popup, () =>
    popup.getByRole("button", { name: "Zamknij", exact: true }).click(),
  );
  await expect(page).toHaveURL(/\?from=test$/);

  await page.evaluate(() => {
    const url = new URL(location.href);
    url.searchParams.set("occurrence", "following");
    history.pushState(null, "", url);
  });
  await expect(popup).toContainText("Kolejne zajęcia");
  await expect(popup).not.toContainText("Zapisane zajęcia");
  await expectIntactDismissal(popup, async () => {
    await page.goBack();
  });
  await expect(page).toHaveURL(/\?from=test$/);
});

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
