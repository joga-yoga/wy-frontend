import { readFileSync } from "node:fs";

import { expect, test } from "@playwright/test";

// Fresh verified accounts in the isolated DB; no external credentials or delivery.
const fixturePath = process.env.STUDIO_SETUP_IDENTITIES;
const fixtures = fixturePath
  ? (JSON.parse(readFileSync(fixturePath, "utf8")) as {
      api_url: string;
      desktop: { token: string; name: string };
      mobile: { token: string; name: string };
      claim: { token: string; name: string };
      unclaimed: { id: string; name: string };
    })
  : undefined;
const setup = "/account/partner/studio/create";

test.beforeEach(async ({ context }) => {
  test.skip(!fixtures, "Set STUDIO_SETUP_IDENTITIES to disposable local identities.");
  expect(new URL(fixtures!.api_url).hostname).toBe("localhost");
  await context.route("**/*", (route) => {
    const url = new URL(route.request().url());
    return ["localhost", "127.0.0.1"].includes(url.hostname) ? route.continue() : route.abort();
  });
  await context.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style");
      style.textContent = "nextjs-portal { display:none !important }";
      document.head.appendChild(style);
    });
  });
});

for (const device of ["desktop", "mobile"] as const) {
  test(`${device}: search, Fitssey, manual creation and durable scoped opt-out`, async ({
    context,
    page,
    browser,
  }, info) => {
    const identity = fixtures![device];
    await page.setViewportSize(
      device === "desktop" ? { width: 1440, height: 1000 } : { width: 390, height: 844 },
    );
    await context.addInitScript(
      (token) => localStorage.setItem("access_token", token),
      identity.token,
    );
    await page.goto(setup);
    const cookies = page.getByRole("button", { name: "Tylko niezbędne" });
    if (await cookies.isVisible()) await cookies.click();
    await page.getByLabel("Nazwa studia", { exact: true }).fill(identity.name);
    await expect(page.getByText("Nie znaleziono studia o tej nazwie.")).toBeVisible();
    await page.getByRole("button", { name: "Nie ma tu mojego studia" }).click();
    await expect(page.getByRole("link", { name: /Przenieś studio z Fitssey/ })).toBeVisible();
    await page.screenshot({ path: info.outputPath(`setup-${device}.png`), fullPage: true });
    await page.getByRole("link", { name: /Przenieś studio z Fitssey/ }).click();
    await expect(page.getByLabel("UUID konta Fitssey")).toBeVisible();
    await page.getByLabel("UUID konta Fitssey").fill(`h333-${device}-${Date.now()}`);
    await page.getByLabel("Klucz API", { exact: true }).fill("local-fixture-only");
    await page.getByRole("button", { name: "Połącz i sprawdź dane" }).click();
    await expect(page.getByRole("heading", { name: "Sprawdzamy konfigurację" })).toBeVisible();
    // No worker runs here: connection alone must not close a setup or create a studio.
    await page.goto(setup);
    await page.getByLabel("Nazwa studia", { exact: true }).fill(identity.name);
    await page.getByRole("button", { name: "Nie ma tu mojego studia" }).click();
    await page.getByRole("button", { name: "Utwórz studio ręcznie", exact: true }).click();
    await expect(page.locator("input#name")).toHaveValue(identity.name);
    await page.locator("input#name").fill(`${identity.name} ręcznie`);
    await page.getByRole("button", { name: "Wróć do wyszukiwania" }).click();
    await page.getByRole("button", { name: "Utwórz studio ręcznie", exact: true }).click();
    await expect(page.locator("input#name")).toHaveValue(`${identity.name} ręcznie`);
    await page.getByRole("button", { name: "Zapisz", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Zarządzanie studiem" })).toHaveCount(0);
    await expect(page).toHaveURL(/\/studio\/[a-f0-9-]+\/edit$/);
    const studioId = page.url().split("/").at(-2)!;
    await page.goto("/account/partner/menu");
    await expect(page.getByRole("link", { name: /Przenieś studio z Fitssey/ })).toBeVisible();
    await page.screenshot({ path: info.outputPath(`menu-${device}.png`), fullPage: true });
    await page.getByRole("link", { name: /Przenieś studio z Fitssey/ }).click();
    await expect(page).toHaveURL(new RegExp(`studioId=${studioId}`));
    await expect(page.getByText(/Import nie zastąpi ani nie połączy danych/)).toBeVisible();
    // Ordinary back navigation retains eligibility.
    await page.getByRole("link", { name: "Wróć do studia" }).click();
    await expect(page.getByRole("link", { name: /Przenieś studio z Fitssey/ })).toBeVisible();
    await page.getByRole("link", { name: /Przenieś studio z Fitssey/ }).click();
    await page.getByRole("button", { name: "Nie potrzebuję przenoszenia" }).click();
    await expect(page).toHaveURL(new RegExp(`/menu/studio/${studioId}$`));
    await page.reload();
    await expect(page.getByRole("link", { name: "Profil studia", exact: false })).toBeVisible();
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("link", { name: /Przenieś studio z Fitssey/ })).toHaveCount(0);
    await page.screenshot({ path: info.outputPath(`closed-${device}.png`), fullPage: true });
    await page.goto(`/account/partner/studio/import/fitssey?studioId=${studioId}`);
    await expect(page).toHaveURL(new RegExp(`/menu/studio/${studioId}$`));
    // A separate browser session reauthenticates; closure is server-side.
    const fresh = await browser.newContext();
    await fresh.addInitScript(
      (token) => localStorage.setItem("access_token", token),
      identity.token,
    );
    const freshPage = await fresh.newPage();
    await freshPage.goto(`/account/partner/menu/studio/${studioId}`);
    await expect(
      freshPage.getByRole("link", { name: "Profil studia", exact: false }),
    ).toBeVisible();
    await freshPage.waitForLoadState("networkidle");
    await expect(freshPage.getByRole("link", { name: /Przenieś studio z Fitssey/ })).toHaveCount(0);
    const created = await context.request.post(`${fixtures!.api_url}/studios`, {
      headers: { Authorization: `Bearer ${identity.token}` },
      data: { name: `${identity.name} drugie`, currency: "PLN" },
    });
    expect(created.ok()).toBeTruthy();
    const second = await created.json();
    await freshPage.goto(`/account/partner/menu/studio/${second.id}`);
    await expect(freshPage.getByRole("link", { name: /Przenieś studio z Fitssey/ })).toBeVisible();
    await fresh.close();
  });
}

test("search result uses the existing preview and confirmed claim", async ({
  context,
  page,
}, info) => {
  await context.addInitScript(
    (token) => localStorage.setItem("access_token", token),
    fixtures!.claim.token,
  );
  await page.goto(setup);
  await page.getByLabel("Nazwa studia", { exact: true }).fill(fixtures!.unclaimed.name);
  await expect(page.getByRole("button", { name: "Zarządzaj", exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath("claim-search.png"), fullPage: true });
  await page.getByRole("button", { name: "Zarządzaj", exact: true }).click();
  await expect(page).toHaveURL(/\/studio\/dodaj\/preview\//);
  const cookies = page.getByRole("button", { name: "Tylko niezbędne" });
  if (await cookies.isVisible()) await cookies.click();
  await page.getByRole("link", { name: "Załóż konto i zarządzaj studiem" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Potwierdź i przejmij" }).click();
  await expect(page).toHaveURL(new RegExp(`/studio/${fixtures!.unclaimed.id}/edit$`));
  await page.goto("/account/partner/menu");
  await expect(page.getByRole("link", { name: /Przenieś studio z Fitssey/ })).toBeVisible();
});
