import { expect, type Page, test } from "@playwright/test";

async function setup(page: Page, solo = false) {
  const state = {
    failSearch: false,
    requests: [] as { path: string; method: string; data: unknown }[],
    candidates: [
      {
        user_id: "many",
        name: "Aleksandra Bardzo Długie Nazwisko Testowe",
        email: "many@example.com",
        pass_context: "Karnet na bardzo wiele zajęć w studiu — ważny do grudnia",
        past_booking_count: 124,
        last_past_booking_at: "2026-10-20T12:00:00Z",
      },
      {
        user_id: "one",
        name: "Jan",
        email: "one@example.com",
        pass_context: null,
        past_booking_count: 1,
        last_past_booking_at: "2026-10-19T12:00:00Z",
      },
      {
        user_id: "zero",
        name: "Ewa",
        email: "zero@example.com",
        pass_context: null,
        past_booking_count: 0,
        last_past_booking_at: null,
      },
    ],
  };
  await page.addInitScript(() =>
    localStorage.setItem(
      "access_token",
      `e30.${btoa(JSON.stringify({ sub: "owner", email: "owner@example.com" }))}.fixture`,
    ),
  );
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (!["localhost", "127.0.0.1"].includes(url.hostname)) return route.abort();
    if (!["8000", "8010"].includes(url.port)) return route.continue();
    const path = url.pathname,
      method = route.request().method();
    state.requests.push({
      path,
      method,
      data: method === "GET" ? null : route.request().postDataJSON(),
    });
    let json: unknown = [],
      status = 200;
    if (path === "/me")
      json = {
        id: "owner",
        email: "owner@example.com",
        partner: { id: "partner", phone_verified: true },
      };
    else if (path === "/partner/me") json = { id: "partner", phone_verified: true };
    else if (path === "/partner/capabilities")
      json = {
        business_mode: solo ? "solo" : "studio",
        solo_studio_id: solo ? "studio" : null,
        managed_studios: solo ? [] : [{ id: "studio", name: "Studio" }],
        teaching_studios: [],
        has_events: false,
        has_instructor_profile: solo,
        landing_tab: "grafik",
      };
    else if (path === "/class-sessions/session")
      json = {
        id: "session",
        studio_id: "studio",
        organizer_kind: solo ? "solo" : "studio",
        calendar_date: "2099-10-26",
        start_time: "2099-10-26T12:00:00Z",
        end_time: "2099-10-26T13:00:00Z",
        template_title: "Hatha",
        role: "owner",
        status: "scheduled",
        capacity: 20,
        recurrence_frequency: "once",
        recurrence_days: [],
      };
    else if (path.endsWith("/search-users")) {
      if (state.failSearch) {
        status = 503;
        json = { detail: "Unavailable" };
      } else {
        const q = (url.searchParams.get("q") || "").toLowerCase();
        json = {
          studio_clients: state.candidates.filter((c) =>
            `${c.name} ${c.email}`.toLowerCase().includes(q),
          ),
        };
      }
    } else if (path.endsWith("/walk-in-options"))
      json = {
        seat_available: true,
        drop_in_price: 50,
        currency: "PLN",
        existing_passes: [],
        accepts_sport_cards: false,
        sport_card_options: [],
        buy_and_use_options: [],
        accepts_cash: true,
        online_payment_methods: [],
      };
    else if (path.startsWith("/notifications")) json = { items: [], unread_count: 0 };
    return route.fulfill({ status, json });
  });
  return state;
}
async function open(page: Page) {
  await page.goto("/account/partner/studio/studio/front-desk/session");
  const cookies = page.getByRole("button", { name: "Tylko niezbędne" });
  if (await cookies.isVisible()) await cookies.click();
  await page.getByRole("button", { name: "Dodaj uczestnika", exact: true }).click();
  return page.getByRole("dialog");
}

for (const [width, solo] of [
  [390, false],
  [1440, true],
] as const) {
  test(`reception count remains exact, accessible and side-effect free (${width}px, solo=${solo})`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 900 });
    const state = await setup(page, solo);
    const dialog = await open(page);
    await expect(
      dialog.getByText("Rezerwacje na zakończone zajęcia", { exact: true }),
    ).toBeVisible();
    await expect(dialog.getByText("Klient", { exact: true })).toHaveCount(0);
    await expect(dialog.getByText(/Odbyte rezerwacje/)).toHaveCount(0);
    const rows = dialog.getByRole("button").filter({ hasText: "Ostatnia:" });
    await expect(rows).toHaveCount(3);
    for (const [i, c] of state.candidates.entries()) {
      await expect(rows.nth(i)).toHaveAccessibleName(
        new RegExp(`Rezerwacje na zakończone zajęcia: ${c.past_booking_count}$`),
      );
      await expect(rows.nth(i)).toContainText(c.name);
      const badge = rows.nth(i).locator("span:has(> .sr-only)");
      await expect(badge).toHaveClass(/bg-gray-100/);
      const box = await badge.boundingBox(),
        bounds = await dialog.boundingBox();
      expect(box!.x + box!.width).toBeLessThanOrEqual(bounds!.x + bounds!.width);
      expect(box!.width).toBeGreaterThan(20);
    }
    await expect(rows.nth(0)).toContainText("Ostatnia: 20.10.2026");
    await expect(rows.nth(2)).toContainText("Ostatnia: —");
    await page.screenshot({ path: info.outputPath("candidate-counts.png") });
    await rows.nth(2).focus();
    await page.keyboard.press("Enter");
    await expect(
      dialog.getByRole("button", { name: "Dodaj rezerwację", exact: true }),
    ).toBeEnabled();
    expect(state.requests.filter((r) => r.method !== "GET")).toEqual([]);
    await dialog.getByRole("button", { name: "Wybierz inną osobę" }).click();
    await dialog.getByLabel("Imię, nazwisko lub email").fill("missing");
    await expect(dialog.getByText("Nie znaleziono klientów.")).toBeVisible();
    state.failSearch = true;
    await dialog.getByLabel("Imię, nazwisko lub email").fill("Jan");
    await expect(dialog.getByText("Nie udało się załadować klientów.")).toBeVisible();
    state.failSearch = false;
    await dialog.getByRole("button", { name: "Spróbuj ponownie" }).click();
    await expect(rows).toHaveCount(1);
    await expect(rows).toContainText("Jan");
    expect(state.requests.filter((r) => r.method !== "GET")).toEqual([]);
  });
}
