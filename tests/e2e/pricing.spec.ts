import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "wy.cookie_consent.v1",
      JSON.stringify({ analytics: false, marketing: false, decided: true }),
    );
  });
  await page.goto("/cennik");
});

test("default inputs keep Flex selected while recommending Balans with transparent totals", async ({
  page,
}) => {
  await expect(page.getByRole("heading", { name: "Wybierz sposób rozliczenia" })).toBeVisible();
  await expect(page.getByRole("radio", { name: "Flex", exact: true })).toBeChecked();
  await expect(
    page.getByRole("slider", { name: "Sprzedaż nowym klientom z joga.yoga / mies." }),
  ).toHaveAttribute("aria-valuenow", "1000");
  await expect(page.getByRole("slider", { name: "Zapisów miesięcznie" })).toHaveAttribute(
    "aria-valuenow",
    "250",
  );
  await expect(page.getByTestId("result-flex")).toContainText(/181,43\s*zł/);
  await expect(page.getByTestId("result-flex")).toContainText(/0\s*zł brutto \/ mies\./);
  await expect(page.getByTestId("result-balans")).toContainText(/148,50\s*zł/);
  await expect(page.getByTestId("result-balans")).toContainText(/87,00\s*zł brutto \/ mies\./);
  await expect(page.getByTestId("result-balans")).toContainText("POLECANY");
  await expect(page.getByTestId("result-przestrzen")).toContainText(/175\s*zł/);
  await expect(page.getByTestId("result-flex")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("result-balans")).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByRole("link", { name: /Wybieram Flex za 0 zł brutto/ })).toHaveAttribute(
    "href",
    "/studio/dodaj",
  );
  await expect(page.locator("main")).not.toContainText(/marketplace/i);
});

test("plan radio selection updates the CTA and included features with keyboard support", async ({
  page,
}) => {
  const flex = page.getByRole("radio", { name: "Flex", exact: true });
  await flex.focus();
  await flex.press("ArrowDown");
  await expect(page.getByRole("radio", { name: "Balans", exact: true })).toBeChecked();
  await expect(
    page.getByRole("link", { name: /Wybieram Balans za 87,00 zł brutto/ }),
  ).toHaveAttribute("href", "/studio/dodaj");
  const features = page.getByRole("region", { name: "Funkcje planu Balans" });
  await expect(features).toContainText("500 zapisów na zajęcia miesięcznie free");
  await expect(features.getByText(/Krótki adres profilu/)).toContainText("— w planie");
  await expect(features.getByRole("list", { name: "Funkcje niedostępne w planie" })).toHaveText(
    /Znak czarnego lotosu.*Nielimitowane zapisy online i lista rezerwowa.*0% prowizji od nowych klientów z joga\.yoga/,
  );
  await page.getByRole("radio", { name: "Przestrzeń", exact: true }).check();
  await expect(
    page.getByRole("link", { name: /Wybieram Przestrzeń za 175,00 zł brutto/ }),
  ).toHaveAttribute("href", "/studio/dodaj");
  await expect(
    page
      .getByRole("region", { name: "Funkcje planu Przestrzeń" })
      .getByRole("list", { name: "Funkcje niedostępne w planie" }),
  ).toHaveCount(0);
});

test("both sliders recalculate recommendation and totals without changing selection or CTA", async ({
  page,
}) => {
  const sales = page.getByRole("slider", {
    name: "Sprzedaż nowym klientom z joga.yoga / mies.",
  });
  const registrations = page.getByRole("slider", { name: "Zapisów miesięcznie" });
  await sales.fill("200"); // Third Figma tick: 3 000 zł.
  await expect(sales).toHaveAttribute("aria-valuenow", "3000");
  await expect(page.getByTestId("result-flex")).toContainText(/452,03\s*zł/);
  await expect(page.getByTestId("result-balans")).toContainText(/271,50\s*zł/);
  await expect(page.getByTestId("result-przestrzen")).toContainText("POLECANY");
  await expect(page.getByRole("radio", { name: "Flex", exact: true })).toBeChecked();
  await expect(page.getByRole("link", { name: /Wybieram Flex za 0 zł brutto/ })).toBeVisible();
  await sales.focus();
  await sales.press("Home");
  await registrations.focus();
  await registrations.press("End");
  await expect(registrations).toHaveAttribute("aria-valuenow", "1000");
  await expect(page.getByTestId("result-flex")).toContainText(/276,75\s*zł/);
  await expect(page.getByTestId("result-balans")).toContainText(/240,75\s*zł/);
  await expect(page.getByTestId("result-przestrzen")).toContainText(/175\s*zł/);
  await registrations.press("Home");
  await expect(page.getByTestId("result-flex")).toContainText("POLECANY");
  await expect(page.getByRole("radio", { name: "Flex", exact: true })).toBeChecked();
  await expect(page.getByRole("link", { name: /Wybieram Flex za 0 zł brutto/ })).toBeVisible();
});

test("calculator result buttons select plans independently of the recommendation", async ({
  page,
}) => {
  const przestrzenResult = page.getByTestId("result-przestrzen");
  await przestrzenResult.focus();
  await przestrzenResult.press("Enter");

  await expect(przestrzenResult).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("radio", { name: "Przestrzeń", exact: true })).toBeChecked();
  await expect(page.getByTestId("result-balans")).toContainText("POLECANY");
  await expect(
    page.getByRole("link", { name: /Wybieram Przestrzeń za 175,00 zł brutto/ }),
  ).toHaveAttribute("href", "/studio/dodaj");

  await page.getByTestId("result-balans").press("Space");
  await expect(page.getByRole("radio", { name: "Balans", exact: true })).toBeChecked();
  await expect(page.getByTestId("result-balans")).toHaveAttribute("aria-pressed", "true");
});

test("commission disclosure starts expanded and supports click, Enter and Space", async ({
  page,
}) => {
  const toggle = page.getByRole("button", { name: "Jak to działa?" });
  const panel = page.locator("#commission-explanation");
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(toggle).toHaveAttribute("aria-controls", "commission-explanation");
  await expect(panel).toBeVisible();
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(panel).toBeHidden();
  await toggle.press("Enter");
  await expect(panel).toBeVisible();
  await toggle.press("Space");
  await expect(panel).toBeHidden();
});

for (const width of [320, 430, 768, 1440]) {
  test(`layout at ${width}px has no horizontal overflow and the CTA does not cover content`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    const calculator = await page
      .getByRole("region", { name: "Sprawdź, który plan opłaca się Twojemu studiu" })
      .boundingBox();
    const footer = await page.getByRole("contentinfo").boundingBox();
    expect(calculator!.y + calculator!.height).toBeLessThanOrEqual(footer!.y);
    await expect(page.getByRole("link", { name: /Wybieram Flex/ })).toBeVisible();
  });
}

test("close returns to the preceding page", async ({ page }) => {
  await page.goto("/system-dla-studiow-jogi");
  await page.getByRole("link", { name: "Zobacz pełny cennik" }).click();
  await expect(page).toHaveURL(/\/cennik$/);
  await page.getByRole("button", { name: "Zamknij cennik" }).click();
  await expect(page).toHaveURL(/\/system-dla-studiow-jogi$/);
});
