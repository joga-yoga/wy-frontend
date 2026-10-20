import { readFileSync } from "node:fs";

import { type Browser, type BrowserContext, expect, type Page, test } from "@playwright/test";

interface Identity {
  token: string;
  user_id: string;
  instructor_id?: string;
  slug?: string;
}
interface Fixtures {
  solo: Identity;
  solo_new: Identity;
  studio: Identity;
  venue_owner: Identity;
  student: Identity;
  student_two: Identity;
  venue: { id: string; name: string; address: string; slug: string };
  date: string;
}

const fixturePath = process.env.SOLO_ACCEPTANCE_FIXTURES;
const fixtures: Fixtures | undefined = fixturePath
  ? JSON.parse(readFileSync(fixturePath, "utf8"))
  : undefined;
const apiUrl = process.env.INTEGRATION_API_URL ?? "http://localhost:18000";
let templateId: string;
let occurrenceId: string;
let carrierId: string;

async function signedIn(browser: Browser, identity: Identity): Promise<BrowserContext> {
  const context = await browser.newContext({ locale: "pl-PL", timezoneId: "Europe/Warsaw" });
  await context.addInitScript(
    (token) => localStorage.setItem("access_token", token),
    identity.token,
  );
  return context;
}

async function dismissCookies(page: Page) {
  const essential = page.getByRole("button", { name: "Tylko niezbędne" });
  if (await essential.isVisible()) await essential.click();
}

async function caps(context: BrowserContext, identity: Identity) {
  const response = await context.request.get(`${apiUrl}/partner/capabilities`, {
    headers: { Authorization: `Bearer ${identity.token}` },
  });
  expect(response.ok()).toBeTruthy();
  return response.json();
}

test.describe.serial("solo booking with real API and PostgreSQL", () => {
  test.skip(
    !fixtures,
    "Set SOLO_ACCEPTANCE_FIXTURES to disposable seeded identities; never use production.",
  );

  test("initial confirmation preserves inputs, cancellation and retry; setup commits once", async ({
    browser,
  }) => {
    const identity = fixtures!.solo;
    const context = await signedIn(browser, identity);
    try {
      const page = await context.newPage();
      await page.goto("/account/partner/menu");
      await dismissCookies(page);
      await expect(
        page.getByText("Jedno konto, jeden sposób zarządzania.", { exact: false }),
      ).toBeVisible();
      await page.getByRole("link", { name: /Włącz zapisy na moje zajęcia/ }).click();
      await page.getByRole("button", { name: "Wg pory zajęć", exact: true }).click();
      await page.locator('input[type="time"]').fill("21:30");
      await page.locator('input[type="number"]').fill("3");
      let businessRequests = 0;
      page.on("request", (request) => {
        if (request.method() === "POST" && request.url().endsWith("/partner/solo-booking"))
          businessRequests++;
      });
      const save = page.getByRole("button", { name: "Zapisz ustawienia", exact: true });
      for (const cancel of ["Wróć", "Zamknij", "Escape"]) {
        await save.click();
        const dialog = page.getByRole("dialog");
        await expect(dialog.getByRole("heading", { name: "Własny grafik zajęć" })).toBeVisible();
        expect(
          await dialog.evaluate((element) => element.contains(document.activeElement)),
        ).toBeTruthy();
        if (cancel === "Escape") await page.keyboard.press("Escape");
        else await dialog.getByRole("button", { name: cancel, exact: true }).click();
        await expect(dialog).toBeHidden();
        await expect(page.locator('input[type="time"]')).toHaveValue("21:30");
        await expect(page.locator('input[type="number"]')).toHaveValue("3");
        expect((await caps(context, identity)).business_mode).toBeNull();
      }
      expect(businessRequests).toBe(0);

      // Inject a transport failure once; all normal saves still hit the real API/database.
      await page.route("**/partner/solo-booking", (route) => route.abort(), { times: 1 });
      await save.click();
      await page.getByRole("dialog").getByRole("button", { name: "Potwierdź i zapisz" }).click();
      await expect(
        page.getByText("Nie udało się zapisać ustawień. Spróbuj ponownie."),
      ).toBeVisible();
      expect((await caps(context, identity)).business_mode).toBeNull();
      await save.click();
      const committed = page.waitForResponse(
        (r) => r.url().endsWith("/partner/solo-booking") && r.status() === 200,
      );
      await page.getByRole("dialog").getByRole("button", { name: "Potwierdź i zapisz" }).click();
      carrierId = (await (await committed).json()).studio_id;
      await expect(page).toHaveURL(/\/account\/partner\/menu$/);
      await expect(page.getByRole("link", { name: /Utwórz studio/ })).toBeHidden();
      expect((await caps(context, identity)).business_mode).toBe("solo");
      expect(businessRequests).toBe(2); // One aborted request, one successful business operation.
    } finally {
      await context.close();
    }
  });

  test("shared template and once schedule keep venue separate from organizer", async ({
    browser,
  }) => {
    const context = await signedIn(browser, fixtures!.solo);
    try {
      const page = await context.newPage();
      await page.goto("/account/partner/class-templates/create");
      await dismissCookies(page);
      await page.getByLabel("Nazwa", { exact: true }).fill("Własna joga testowa");
      await page.getByLabel("Cena jednego wejścia").fill("45");
      await page.getByLabel("Domyślny limit").fill("2");
      await page.getByRole("combobox", { name: "Miejsce zajęć" }).fill("Przestrzeń Testowa");
      await page.getByRole("option", { name: /Studio Przestrzeń Testowa/ }).click();
      await expect(page.getByRole("radio", { name: "Tylko adres", exact: true })).toBeChecked();
      await expect(page.getByText("Domyślny prowadzący", { exact: true })).toBeHidden();
      const created = page.waitForResponse(
        (r) => r.url().endsWith("/class-templates") && r.request().method() === "POST",
      );
      await page.getByRole("button", { name: "Zapisz szablon" }).click();
      const template = await (await created).json();
      templateId = template.id;
      expect(template.default_instructor_id).toBe(fixtures!.solo.instructor_id);
      expect(template.venue_source_studio_id).toBe(fixtures!.venue.id);
      await page.goto(`/account/partner/class-schedules/create?templateId=${templateId}`);
      await page.getByRole("button", { name: "Raz", exact: true }).click();
      await page
        .getByRole("button", { name: new Date().toLocaleDateString("pl-PL"), exact: true })
        .click();
      const date = new Date(`${fixtures!.date}T12:00:00`);
      await page.locator(`[data-day="${date.toLocaleDateString("pl-PL")}"]`).click();
      await page.locator('input[type="time"]').fill("16:00");
      await page.getByRole("button", { name: "Podgląd →" }).click();
      await expect(page.getByRole("heading", { name: "Powstanie 1 sesja" })).toBeVisible();
      const scheduled = page.waitForResponse(
        (r) => r.url().endsWith("/class-schedules") && r.request().method() === "POST",
      );
      await page.getByRole("button", { name: "Utwórz grafik", exact: true }).click();
      occurrenceId = (await (await scheduled).json()).occurrences[0].id;
      const detail = await (
        await context.request.get(`${apiUrl}/public/occurrences/${occurrenceId}/detail`)
      ).json();
      expect(detail.studio.id).toBe(carrierId);
      expect(detail.studio.id).not.toBe(fixtures!.venue.id);
      expect(detail.studio.name).toBe("Anna Testowa");
      expect(detail.studio.address).toBe(fixtures!.venue.address);
      expect(detail.studio.slug).toBeNull();
      expect(detail.studio.drop_in_price).toBe(45);
      const headers = { Authorization: `Bearer ${fixtures!.venue_owner.token}` };
      const studioTemplate = await context.request.post(`${apiUrl}/class-templates`, {
        headers,
        data: {
          title: "Zajęcia organizowane przez studio",
          default_instructor_id: fixtures!.solo.instructor_id,
        },
      });
      expect(studioTemplate.ok()).toBeTruthy();
      const studioSchedule = await context.request.post(`${apiUrl}/class-schedules`, {
        headers,
        data: {
          template_id: (await studioTemplate.json()).id,
          studio_id: fixtures!.venue.id,
          instructor_ids: [fixtures!.solo.instructor_id],
          frequency: "once",
          from_date: fixtures!.date,
          start_time: "18:00:00",
        },
      });
      expect(studioSchedule.ok()).toBeTruthy();
    } finally {
      await context.close();
    }
  });

  test("public booking and reload keep registered highlight and solo payment wording", async ({
    browser,
  }) => {
    const context = await signedIn(browser, fixtures!.student);
    try {
      const page = await context.newPage();
      await page.goto(`/book/class/${occurrenceId}`);
      await dismissCookies(page);
      await expect(page.getByText(/gotówką|gotówka/i)).toHaveCount(0);
      const oneEntry = page.getByText("Pojedyncze wejście", { exact: true });
      await oneEntry.click();
      await page.getByRole("button", { name: /Zarezerwuj ·/ }).click();
      await expect(page.getByText(/Twoje miejsce jest zaklepane/)).toBeVisible();
      await expect(page.getByText(/gotówką|gotówka/i)).toHaveCount(0);
      await page.goto(`/instruktor/${fixtures!.solo.slug}/grafik?class=wlasna-joga-testowa`);
      await expect(page.getByText("Własna joga testowa", { exact: true })).toBeVisible();
      await expect(
        page.getByText(/Masz rezerwację|Zapisano|Zapisane|Zarezerwowano|Twoja rezerwacja/).first(),
      ).toBeVisible();
      await page.reload();
      await dismissCookies(page);
      await expect(
        page.getByText(/Masz rezerwację|Zapisano|Zapisane|Zarezerwowano|Twoja rezerwacja/).first(),
      ).toBeVisible();
      await expect(
        page.getByText("Zajęcia organizowane przez studio", { exact: true }),
      ).toBeVisible();
      await expect(page.getByText(fixtures!.venue.name, { exact: true })).toBeVisible();
      await page.screenshot({
        path: "/tmp/joga-solo-acceptance/solo-public-booked.png",
        fullPage: true,
      });
    } finally {
      await context.close();
    }
  });

  test("initial studio save uses the same confirmation and retains its separate mode", async ({
    browser,
  }) => {
    const context = await signedIn(browser, fixtures!.studio);
    try {
      const page = await context.newPage();
      await page.goto("/account/partner/studio/create");
      await dismissCookies(page);
      await page.getByLabel("Nazwa studia", { exact: true }).fill("Nowe Studio Testowe");
      await page
        .getByRole("button", { name: /Zapisz/ })
        .last()
        .click();
      const dialog = page.getByRole("dialog");
      await expect(dialog.getByRole("heading", { name: "Zarządzanie studiem" })).toBeVisible();
      await dialog.getByRole("button", { name: "Wróć", exact: true }).click();
      expect((await caps(context, fixtures!.studio)).business_mode).toBeNull();
      await expect(page.getByLabel("Nazwa studia", { exact: true })).toHaveValue(
        "Nowe Studio Testowe",
      );
      await page
        .getByRole("button", { name: /Zapisz/ })
        .last()
        .click();
      await dialog.getByRole("button", { name: "Potwierdź i zapisz" }).click();
      await expect(page).toHaveURL(/\/studio\/[^/]+\/edit$/);
      expect((await caps(context, fixtures!.studio)).business_mode).toBe("studio");
      await page.goto("/account/partner/menu");
      await expect(page.getByRole("link", { name: /Włącz zapisy na moje zajęcia/ })).toBeHidden();
    } finally {
      await context.close();
    }
  });

  test("operational menu reuses clients, optional pass editor and payment settings", async ({
    browser,
  }) => {
    const context = await signedIn(browser, fixtures!.solo);
    try {
      const page = await context.newPage();
      await page.goto("/account/partner/menu");
      await dismissCookies(page);
      await expect(page.getByRole("link", { name: /Profil studia/ })).toBeHidden();
      await expect(page.getByRole("link", { name: /^Instruktorzy/ })).toBeHidden();
      await page.getByRole("link", { name: /^Klienci/ }).click();
      await expect(page.getByText("Student Testowy", { exact: true })).toBeVisible();
      await expect(page.getByText("Organizator Studia", { exact: true })).toBeHidden();
      await page.goto("/account/partner/menu");
      await page.getByRole("link", { name: /^Karnety/ }).click();
      await page.getByRole("button", { name: "Dodaj karnet", exact: true }).click();
      const dialog = page.getByRole("dialog");
      await dialog.getByPlaceholder("np. Karnet miesięczny").fill("Karnet testowy");
      await dialog.getByPlaceholder("Cena w PLN").fill("120");
      await dialog.getByRole("button", { name: "Zapisz karnet", exact: true }).click();
      await expect(dialog).toBeHidden();
      await expect(page.getByText("Karnet testowy", { exact: true })).toBeVisible();
      await page.goto("/account/partner/menu");
      await page.getByRole("link", { name: /Płatności i odwołania/ }).click();
      await expect(page.getByText("Płatność na miejscu", { exact: true })).toBeVisible();
      await expect(page.getByText(/gotówką|gotówka|Karty sportowe/i)).toHaveCount(0);
      await expect(page.getByRole("dialog")).toBeHidden();
    } finally {
      await context.close();
    }
  });

  test("new eligible account can confirm solo on mobile with keyboard focus contained", async ({
    browser,
  }) => {
    const context = await signedIn(browser, fixtures!.solo_new);
    try {
      const page = await context.newPage();
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto("/account/partner/solo-booking");
      await dismissCookies(page);
      await page.getByRole("button", { name: "Zapisz ustawienia", exact: true }).click();
      const dialog = page.getByRole("dialog");
      await expect(dialog.getByRole("heading", { name: "Własny grafik zajęć" })).toBeVisible();
      for (let i = 0; i < 8; i++) {
        await page.keyboard.press("Tab");
        await expect
          .poll(() => dialog.evaluate((element) => element.contains(document.activeElement)))
          .toBeTruthy();
      }
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBeTruthy();
      await page.screenshot({
        path: "/tmp/joga-solo-acceptance/solo-mobile-confirmation.png",
        fullPage: true,
      });
      await dialog.getByRole("button", { name: "Potwierdź i zapisz" }).click();
      await expect(page).toHaveURL(/\/account\/partner\/menu$/);
      expect((await caps(context, fixtures!.solo_new)).business_mode).toBe("solo");
      await page.getByRole("link", { name: /Płatności i odwołania/ }).click();
      await expect(page.getByText("Płatność na miejscu", { exact: true })).toBeVisible();
      await expect(page.getByRole("dialog")).toBeHidden();
    } finally {
      await context.close();
    }
  });
});
