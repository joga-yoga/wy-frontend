import { expect, type Page, test } from "@playwright/test";

import type { StudioPass } from "../../src/app/account/partner/studio/[studioId]/edit/types";

async function setup(page: Page, existing: StudioPass[] = [], local = false) {
  const requests: { method: string; body: StudioPass }[] = [];
  const control = { fail: false, delay: false };
  await page.addInitScript(() => {
    const payload = btoa(JSON.stringify({ sub: "pass-owner", email: "owner@example.com" }));
    localStorage.setItem("access_token", `e30.${payload}.fixture`);
    document.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style");
      style.textContent = "nextjs-portal{display:none !important}";
      document.head.appendChild(style);
    });
  });
  await page.route(
    /https?:\/\/[^/]+\/(?:me|partner\/.*|studios\/pass-studio.*|notifications.*)(?:\?.*)?$/,
    async (route) => {
      const req = route.request();
      const path = new URL(req.url()).pathname;
      let json: unknown = {};
      let status = 200;
      if (path === "/me")
        json = {
          id: "pass-owner",
          email: "owner@example.com",
          partner: { id: "pass-partner", phone_verified: true },
        };
      else if (path === "/partner/me") json = { id: "pass-partner", phone_verified: true };
      else if (path === "/partner/capabilities")
        json = {
          business_mode: local ? "studio" : "solo",
          solo_studio_id: local ? null : "pass-studio",
          managed_studios: [],
          teaching_studios: [],
          has_events: false,
          has_instructor_profile: !local,
          landing_tab: "grafik",
        };
      else if (path === "/studios/pass-studio")
        json = { id: "pass-studio", name: "Studio próbne", passes: existing };
      else if (path.startsWith("/studios/pass-studio/passes")) {
        const body = req.postDataJSON() as StudioPass;
        requests.push({ method: req.method(), body });
        if (control.delay) await new Promise((resolve) => setTimeout(resolve, 500));
        if (control.fail) {
          status = 503;
          json = { detail: "Nie udało się zapisać karnetu. Spróbuj ponownie." };
        } else json = { ...body, id: existing[0]?.id ?? `saved-${requests.length}` };
      } else if (path.startsWith("/notifications")) json = { items: [], unread_count: 0 };
      await route.fulfill({ status, json });
    },
  );
  await page.goto(
    local ? "/account/partner/studio/create?step=manual" : "/account/partner/solo-booking/passes",
  );
  const cookies = page.getByRole("button", { name: "Tylko niezbędne" });
  if (await cookies.isVisible()) await cookies.click();
  return { requests, control };
}
const form = (page: Page) => page.getByRole("dialog", { name: /Nowy karnet|Edytuj karnet/ });
async function fillRequired(page: Page, name = "Karnet 8 wejść", price = "240,5") {
  await form(page).getByLabel("Nazwa karnetu", { exact: true }).fill(name);
  await form(page).getByLabel("Cena karnetu", { exact: true }).fill(price);
  await form(page).getByLabel("Cena karnetu", { exact: true }).blur();
}

for (const width of [375, 1440])
  test(`presets, finite validation, live preview and save at ${width}px`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 900 });
    const { requests } = await setup(page);
    await page.getByRole("button", { name: "Dodaj karnet", exact: true }).click();
    const dialog = form(page);
    const save = dialog.getByRole("button", { name: "Utwórz karnet" });
    await expect(dialog.getByLabel("Nazwa karnetu", { exact: true })).toHaveValue("");
    await expect(dialog.getByLabel("Cena karnetu", { exact: true })).toHaveValue("");
    await expect(save).toBeDisabled();
    await expect(dialog.locator('[aria-invalid="true"]')).toHaveCount(0);
    await expect(dialog.getByRole("button", { name: "8", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(dialog.getByRole("button", { name: "30 dni", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await page.mouse.move(0, 0);
    await page.screenshot({
      animations: "disabled",
      path: info.outputPath(`initial-${width}.png`),
    });
    for (const preset of ["4", "12", "8", "60 dni", "90 dni", "30 dni"]) {
      await dialog.getByRole("button", { name: preset, exact: true }).click();
      await expect(dialog.getByRole("button", { name: preset, exact: true })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    }
    await fillRequired(page);
    await expect(dialog.getByLabel("Cena karnetu", { exact: true })).toHaveValue("240,50");
    await expect(dialog.getByText("30,06 zł za jedno wejście")).toBeVisible();
    await page.mouse.move(0, 0);
    await page.screenshot({ animations: "disabled", path: info.outputPath(`ready-${width}.png`) });
    const assets = await dialog.locator('img[src^="/images/pass-form/"]').evaluateAll((images) =>
      images
        .filter((img) => img.getBoundingClientRect().width > 0)
        .map((img) => {
          const image = img as HTMLImageElement;
          return {
            src: image.getAttribute("src"),
            loaded: image.complete && image.naturalWidth > 0,
            width: image.getBoundingClientRect().width,
            height: image.getBoundingClientRect().height,
            expectedWidth: Number(image.getAttribute("width")),
            expectedHeight: Number(image.getAttribute("height")),
          };
        }),
    );
    for (const asset of assets) {
      expect(asset.loaded, asset.src!).toBe(true);
      expect(asset.width).toBe(asset.expectedWidth);
      expect(asset.height).toBe(asset.expectedHeight);
    }

    await dialog.getByRole("button", { name: "Inna", exact: true }).click();
    for (const invalid of ["", "0", "-1", "2.5", "NaN"]) {
      await dialog.getByRole("textbox", { name: "Liczba wejść", exact: true }).fill(invalid);
      await dialog.getByRole("textbox", { name: "Liczba wejść", exact: true }).blur();
      await expect(save).toBeDisabled();
    }
    await dialog.getByRole("textbox", { name: "Liczba wejść", exact: true }).fill("10");
    await dialog.getByRole("button", { name: "Inny", exact: true }).click();
    for (const preset of ["180 dni", "365 dni"]) {
      await dialog.getByRole("button", { name: preset, exact: true }).click();
      await expect(dialog.getByRole("textbox", { name: "Ważność", exact: true })).toHaveValue(
        preset.split(" ")[0],
      );
    }
    await dialog.getByRole("textbox", { name: "Ważność", exact: true }).fill("1.5");
    await dialog.getByRole("textbox", { name: "Ważność", exact: true }).blur();
    await expect(save).toBeDisabled();
    await dialog.getByRole("textbox", { name: "Ważność", exact: true }).fill("45");
    await dialog.getByRole("button", { name: /Dodaj opis/ }).click();
    await dialog
      .getByLabel("Opis · opcjonalnie")
      .fill("Dla osób, które chcą praktykować regularnie.");
    for (const invalid of ["0", "-12", "NaN", "1,234"]) {
      await dialog.getByLabel("Cena karnetu", { exact: true }).fill(invalid);
      await dialog.getByLabel("Cena karnetu", { exact: true }).blur();
      await expect(save).toBeDisabled();
    }
    await dialog.getByLabel("Cena karnetu", { exact: true }).fill("0");
    await dialog.getByLabel("Cena karnetu", { exact: true }).blur();
    await page.mouse.move(0, 0);
    const priceError = dialog.getByText(/Wpisz cenę większą niż 0/);
    await priceError.scrollIntoViewIfNeeded();
    await expect(priceError).toBeVisible();
    await page.screenshot({ animations: "disabled", path: info.outputPath(`error-${width}.png`) });
    await dialog.getByRole("switch", { name: "Bez limitu", exact: true }).click();
    await expect(dialog.getByRole("textbox", { name: "Liczba wejść", exact: true })).toHaveCount(0);
    await dialog.getByRole("switch", { name: "Bez terminu", exact: true }).click();
    await expect(dialog.getByRole("textbox", { name: "Ważność", exact: true })).toHaveCount(0);
    await fillRequired(page, "Karnet Open", "320");
    await expect(dialog.getByText(/za jedno wejście/)).toHaveCount(0);
    await page.mouse.move(0, 0);
    await page.screenshot({
      animations: "disabled",
      path: info.outputPath(`unlimited-${width}.png`),
    });
    await dialog.getByRole("switch", { name: "Bez limitu", exact: true }).click();
    await expect(dialog.getByRole("textbox", { name: "Liczba wejść", exact: true })).toHaveValue(
      "10",
    );
    await expect(dialog.getByRole("button", { name: "Inna", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(dialog).toBeVisible();
    expect(await dialog.evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(true);
    await save.click();
    await expect(dialog).toHaveCount(0);
    expect(requests).toHaveLength(1);
    expect(requests[0].body).toMatchObject({
      session_count: 10,
      duration_days: null,
      price: 320,
      currency: "PLN",
    });
    await expect(page.getByText("Karnet Open", { exact: true })).toHaveCount(1);
  });

test("custom edit preserves currency, retries failed save once and prevents duplicate clicks", async ({
  page,
}) => {
  const { requests, control } = await setup(page, [
    {
      id: "custom",
      name: "Karnet własny",
      price: 99.9,
      currency: "EUR",
      session_count: 7,
      duration_days: 45,
      description: "Opis zapisany",
    },
  ]);
  await page.getByRole("button", { name: "Edytuj", exact: true }).click();
  const dialog = form(page);
  await expect(dialog.getByRole("textbox", { name: "Liczba wejść", exact: true })).toHaveValue("7");
  await expect(dialog.getByRole("textbox", { name: "Ważność", exact: true })).toHaveValue("45");
  await expect(dialog.getByLabel("Opis · opcjonalnie")).toHaveValue("Opis zapisany");
  await expect(dialog.getByLabel("Cena karnetu", { exact: true })).toHaveValue("99,90");
  await dialog.getByRole("switch", { name: "Bez limitu", exact: true }).click();
  await dialog.getByLabel("Opis · opcjonalnie").fill("");
  control.fail = true;
  control.delay = true;
  await dialog.getByRole("button", { name: "Zapisz zmiany" }).click();
  await expect(dialog.getByRole("button", { name: "Zapisywanie…" })).toBeDisabled();
  await expect(dialog.getByRole("alert")).toBeVisible();
  await expect(dialog.getByLabel("Nazwa karnetu", { exact: true })).toHaveValue("Karnet własny");
  control.fail = false;
  await dialog.getByRole("button", { name: "Zapisz zmiany" }).evaluate((el: HTMLButtonElement) => {
    el.click();
    el.click();
  });
  await expect(dialog).toHaveCount(0);
  expect(requests).toHaveLength(2);
  expect(requests[1]).toMatchObject({
    method: "PUT",
    body: { session_count: null, duration_days: 45, currency: "EUR", price: 99.9, description: "" },
  });
  await expect(page.getByText("Karnet własny", { exact: true })).toHaveCount(1);
});

test("all dismissal paths share dirty confirmation and untouched close is immediate", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await setup(page);
  await page.getByRole("button", { name: "Dodaj karnet", exact: true }).click();
  await form(page).getByRole("button", { name: "Zamknij", exact: true }).click();
  await expect(form(page)).toHaveCount(0);
  await page.getByRole("button", { name: "Dodaj karnet", exact: true }).click();
  await form(page).getByLabel("Nazwa karnetu", { exact: true }).fill("Moje zmiany");
  await page.keyboard.press("Tab");
  await expect(form(page).getByRole("switch", { name: "Bez limitu", exact: true })).toBeFocused();
  await page.keyboard.press("Space");
  await expect(form(page).getByRole("switch", { name: "Bez limitu", exact: true })).toBeChecked();
  for (const close of [
    async () => page.keyboard.press("Escape"),
    async () => form(page).getByRole("button", { name: "Zamknij", exact: true }).click(),
    async () => form(page).getByRole("button", { name: "Anuluj", exact: true }).click(),
  ]) {
    await close();
    const confirm = page.getByRole("alertdialog");
    await expect(confirm).toBeVisible();
    await confirm.getByRole("button", { name: "Wróć do edycji" }).click();
    await expect(form(page).getByLabel("Nazwa karnetu", { exact: true })).toHaveValue(
      "Moje zmiany",
    );
  }
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  await form(page).getByLabel("Nazwa karnetu", { exact: true }).blur();
  const header = form(page).locator('[data-slot="drawer-header"]');
  const box = (await header.boundingBox())!;
  // The shared drawer supports touch dismissal; mouse text selection is ignored.
  const cdp = await page.context().newCDPSession(page);
  const x = box.x + box.width / 2;
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y: box.y + 8 }],
  });
  for (let distance = 50; distance <= 650; distance += 50) {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x, y: box.y + 8 + distance }],
    });
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await cdp.detach();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.getByRole("alertdialog").getByRole("button", { name: "Odrzuć zmiany" }).click();
  await expect(form(page)).toHaveCount(0);
});

test("unsaved studio receives a local pass without a pass API request", async ({ page }) => {
  const { requests } = await setup(page, [], true);
  await page.getByRole("button", { name: "Dodaj karnet", exact: true }).click();
  await fillRequired(page, "Karnet lokalny", "100,25");
  await form(page).getByRole("switch", { name: "Bez limitu", exact: true }).click();
  await form(page).getByRole("switch", { name: "Bez terminu", exact: true }).click();
  await form(page).getByRole("button", { name: "Utwórz karnet" }).click();
  await expect(form(page)).toHaveCount(0);
  expect(requests).toHaveLength(0);
  await expect(page.getByText("Karnet lokalny", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Karnet lokalny/ }).click();
  await expect(form(page).getByRole("switch", { name: "Bez limitu", exact: true })).toBeChecked();
  await expect(form(page).getByRole("switch", { name: "Bez terminu", exact: true })).toBeChecked();
  await form(page).getByRole("switch", { name: "Bez limitu", exact: true }).click();
  await form(page).getByRole("switch", { name: "Bez terminu", exact: true }).click();
  await fillRequired(page, "Karnet lokalny poprawiony", "101");
  await form(page).getByRole("button", { name: "Zapisz zmiany" }).click();
  await expect(form(page)).toHaveCount(0);
  await expect(page.getByText("Karnet lokalny", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Karnet lokalny poprawiony", { exact: true })).toHaveCount(1);
  expect(requests).toHaveLength(0);
});
