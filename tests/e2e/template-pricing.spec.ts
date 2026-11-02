import { expect, type Page, test } from "@playwright/test";

import type { TemplateStudioPricing } from "../../src/app/account/partner/class-templates/types";

async function setup(page: Page, cash = true, multiple = false) {
  const state = {
    settings: [] as TemplateStudioPricing[],
    requests: [] as { path: string; data: Record<string, unknown> }[],
    stale: false,
    trialAvailable: true,
    existingBookingId: null as string | null,
    loseTrialOnSubmit: false,
    userId: "owner",
    ownedPass: false,
    failPurchase: false,
    price: 12.34,
    quote: "first",
    saved: 0,
    roster: [] as Record<string, unknown>[],
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
    const path = url.pathname;
    const method = route.request().method();
    const data = ["POST", "PATCH"].includes(method) ? route.request().postDataJSON() : null;
    if (data) state.requests.push({ path, data });
    let json: unknown = [];
    let status = 200;
    if (path === "/me")
      json = {
        id: state.userId,
        email: "owner@example.com",
        partner: { id: "partner", phone_verified: true },
      };
    else if (path === "/partner/me") json = { id: "partner", phone_verified: true };
    else if (path === "/partner/capabilities")
      json = {
        managed_studios: multiple
          ? [
              { id: "studio", name: "Studio A" },
              { id: "studio-b", name: "Studio B" },
            ]
          : [{ id: "studio", name: "Studio" }],
        teaching_studios: [],
        business_mode: "studio",
        has_events: false,
        landing_tab: "grafik",
      };
    else if (path === "/studios/studio-b")
      json = { id: "studio-b", name: "Studio B", drop_in_price: 70, currency: "PLN" };
    else if (path === "/studios/studio")
      json = { id: "studio", name: "Studio", drop_in_price: 50, currency: "PLN" };
    else if (path === "/class-templates/template") {
      if (method === "PATCH") {
        state.settings = data.studio_pricing ?? state.settings;
        state.saved++;
      }
      json = {
        id: "template",
        title: "Hatha",
        duration_minutes: 60,
        language: "polski",
        studio_pricing: state.settings,
      };
    } else if (path === "/public/occurrences/session/detail")
      json = {
        id: "session",
        start_time: "2099-11-01T12:00:00Z",
        end_time: "2099-11-01T13:00:00Z",
        calendar_date: "2099-11-01",
        template_title: "Hatha",
        status: "scheduled",
        is_modified: false,
        studio: {
          id: "studio",
          name: "Studio",
          slug: "studio",
          accepts_cash: cash,
          accepts_stripe: false,
          passes: [],
          sport_card_acceptances: [],
          room_count: 0,
          drop_in_price: state.price,
          currency: "EUR",
        },
      };
    else if (path === "/occurrences/session/booking-options" || path.endsWith("/walk-in-options"))
      json = {
        seat_available: true,
        drop_in_price: state.price,
        currency: "EUR",
        studio_drop_in_price: 50,
        studio_currency: "PLN",
        entry_name: "Poranna grupa",
        entry_conditions: "Zajęcia dla początkujących",
        trial_enabled: true,
        trial_available: state.trialAvailable,
        existing_booking_id: state.existingBookingId,
        entry_quote: state.quote,
        existing_passes: state.ownedPass
          ? [{ user_pass_id: "owned", pass_name: "Mój karnet", entries_remaining: 8 }]
          : [],
        buy_and_use_options: [
          {
            pass_id: "pass",
            name: "Karnet",
            price: 200,
            currency: "PLN",
            session_count: 4,
            duration_days: 30,
          },
        ],
        sport_card_options: [{ studio_sport_card_id: "card", name: "MultiSport", fee: 5 }],
        accepts_sport_cards: true,
        accepts_cash: cash,
        online_payment_methods: ["card"],
        drop_in_online_payment_methods: [],
      };
    else if (path === "/occurrences/session/bookings") {
      if (state.stale || state.loseTrialOnSubmit) {
        if (state.loseTrialOnSubmit) {
          state.trialAvailable = false;
          state.loseTrialOnSubmit = false;
        }
        state.stale = false;
        state.price = 19.25;
        state.quote = "second";
        status = 409;
        json = { detail: { code: "entry_quote_changed" } };
      } else
        json = {
          id: "booking",
          occurrence_id: "session",
          status: "booked",
          funding_type: data.funding_type,
          amount_owed: data.funding_type === "trial" ? null : state.price,
          payment_required: false,
          payment: { currency: "EUR" },
          entry_terms: { name: "Poranna grupa", currency: "EUR" },
        };
    }
    if (path === "/class-sessions/session")
      json = {
        id: "session",
        studio_id: "studio",
        organizer_kind: "studio",
        calendar_date: "2099-11-01",
        start_time: "2099-11-01T12:00:00Z",
        end_time: "2099-11-01T13:00:00Z",
        template_title: "Hatha",
        role: "owner",
        status: "scheduled",
        capacity: 20,
        recurrence_frequency: "once",
        recurrence_days: [],
      };
    if (path.endsWith("/search-users"))
      json = {
        studio_clients: [
          {
            user_id: "client",
            name: "Anna",
            email: "anna@example.com",
            note: null,
            pass_context: null,
          },
        ],
      };
    if (path.endsWith("/walk-in")) {
      state.roster = [
        {
          booking_id: "trial-booking",
          user_id: "client",
          user_name: "Anna",
          user_email: "anna@example.com",
          status: "booked",
          funding_type: "trial",
          amount_owed: null,
          checked_in_at: null,
          needs_settlement: false,
          needs_card_check: false,
          is_overdue: false,
        },
      ];
      json = state.roster[0];
    }
    if (path.endsWith("/roster")) json = state.roster;
    if (path === "/bookings/trial-booking/confirm") {
      state.roster[0].checked_in_at = new Date().toISOString();
      json = state.roster[0];
    }
    if (path === "/bookings/trial-booking/undo-confirm") {
      state.roster[0].checked_in_at = null;
      json = state.roster[0];
    }
    if (path === "/public/passes/pass/detail")
      json = {
        id: "pass",
        name: "Karnet",
        price: 200,
        currency: "PLN",
        session_count: 4,
        duration_days: 30,
        studio: {
          id: "studio",
          name: "Studio",
          slug: "studio",
          accepts_cash: true,
          accepts_stripe: false,
          online_payment_methods: [],
        },
      };
    if (path === "/passes/pass/purchase") {
      if (state.failPurchase) {
        state.failPurchase = false;
        status = 400;
        json = { detail: "Zakup nie powiódł się." };
      } else
        json = {
          id: "purchase",
          pass_name: "Karnet",
          entries_total: 4,
          price: 200,
          currency: "PLN",
          amount_owed: 200,
          payment_required: false,
          studio_slug: "studio",
        };
    }
    return route.fulfill({ status, json });
  });
  return state;
}

for (const width of [1280, 390]) {
  test(`template modal save cancel reset and inheritance at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const state = await setup(page);
    await page.goto("/account/partner/class-templates/template/edit");
    await page.getByRole("button", { name: "Dostosuj cenę" }).click();
    const modal = page.getByRole("dialog");
    await expect(modal.getByLabel("Cena jednego wejścia")).toHaveValue("50");
    await page.screenshot({
      path: `/tmp/h367-modal-${width}.png`,
      fullPage: false,
      animations: "disabled",
    });
    await modal.getByLabel("Pierwsze zajęcia próbne gratis").click();
    await modal.getByRole("button", { name: "Anuluj", exact: true }).click();
    expect(state.saved).toBe(0);
    await page.getByRole("button", { name: "Dostosuj cenę" }).click();
    await expect(modal.getByLabel("Pierwsze zajęcia próbne gratis")).not.toBeChecked();
    await modal.getByLabel("Pierwsze zajęcia próbne gratis").click();
    await modal.getByLabel("Nazwa", { exact: true }).fill("Poranna grupa");
    await modal.getByRole("button", { name: "Zastosuj" }).click();
    expect(state.saved).toBe(0);
    await page.getByRole("button", { name: "Zapisz zmiany", exact: true }).click();
    await expect.poll(() => state.saved).toBe(1);
    expect(state.settings[0]).toMatchObject({
      amount: null,
      currency: null,
      trial_enabled: true,
      name: "Poranna grupa",
    });
    await page.goto("/account/partner/class-templates/template/edit");
    await page.getByRole("button", { name: "Dostosuj cenę" }).click();
    await expect(modal.getByLabel("Pierwsze zajęcia próbne gratis")).toBeChecked();
    await modal.getByLabel("Cena jednego wejścia").fill("0");
    await modal.getByRole("button", { name: "Zastosuj" }).click();
    await expect(modal.getByRole("alert")).toContainText("dodatnią cenę");
    await modal.getByLabel("Cena jednego wejścia").fill("12.34");
    await modal.getByRole("combobox", { name: "Waluta wejścia" }).click();
    await page.getByRole("option", { name: "EUR", exact: true }).click();
    await modal.getByRole("button", { name: "Zastosuj" }).click();
    await page.getByRole("button", { name: "Zapisz zmiany", exact: true }).click();
    await expect.poll(() => state.saved).toBe(2);
    expect(state.settings[0]).toMatchObject({ amount: 12.34, currency: "EUR" });
    await page.goto("/account/partner/class-templates/template/edit");
    await page.getByRole("button", { name: "Dostosuj cenę" }).click();
    await expect(modal.getByLabel("Cena jednego wejścia")).toHaveValue("12.34");
    await expect(modal.getByRole("link", { name: "Utwórz wydarzenie." })).toHaveAttribute(
      "target",
      "_blank",
    );
    await modal.getByRole("button", { name: "Przywróć ustawienia studia" }).click();
    await modal.getByRole("button", { name: "Zastosuj" }).click();
    await page.getByRole("button", { name: "Zapisz zmiany", exact: true }).click();
    await expect.poll(() => state.saved).toBe(3);
    expect(state.settings[0]).toMatchObject({
      amount: null,
      currency: null,
      trial_enabled: false,
      name: null,
      conditions: null,
    });
  });
}

test("automatic trial skips payments even without cash or provider", async ({ page }) => {
  const state = await setup(page, false);
  await page.goto("/book/class/session");
  await expect(
    page.getByRole("button", { name: "Zarezerwuj bezpłatnie", exact: true }),
  ).toBeEnabled();
  await expect(page.getByRole("heading", { name: "Jak zapłacisz?" })).toHaveCount(0);
  await page.getByRole("button", { name: "Zarezerwuj bezpłatnie", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Zarezerwowane!" })).toBeVisible();
  await expect(
    page.getByText("Pierwsze zajęcia próbne — bezpłatnie", { exact: true }),
  ).toBeVisible();
  expect(state.requests.filter((r) => r.path.includes("/bookings"))).toEqual([
    {
      path: "/occurrences/session/bookings",
      data: { funding_type: "trial", entry_quote: "first" },
    },
  ]);
  expect(state.requests.some((r) => r.path.endsWith("/payment"))).toBe(false);
});

test("EUR entry replaces default and stale quote requires another selection", async ({ page }) => {
  const state = await setup(page);
  state.stale = true;
  state.trialAvailable = false;
  await page.goto("/book/class/session");
  await page.getByRole("button", { name: /Poranna grupa/ }).click();
  await expect(page.getByRole("button", { name: /Zapłać online/ })).toHaveCount(0);
  await expect(page.getByText("Zajęcia dla początkujących", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /^Zarezerwuj ·/ }).click();
  await expect(
    page.getByText("Warunki wejścia zmieniły się. Sprawdź je i potwierdź ponownie."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Wybierz sposób płatności", exact: true }),
  ).toBeDisabled();
  expect(state.requests.filter((r) => r.path.endsWith("/bookings"))).toHaveLength(1);
  await page.getByRole("button", { name: /Poranna grupa/ }).click();
  await expect(page.getByRole("button", { name: /^Zarezerwuj ·/ })).toContainText("19,25");
  await page.getByRole("button", { name: /^Zarezerwuj ·/ }).click();
  expect(state.requests.at(-1)?.data.entry_quote).toBe("second");
});

test("reception selects trial automatically and checks in without collecting money", async ({
  page,
}) => {
  const state = await setup(page);
  await page.goto("/account/partner/studio/studio/front-desk/session");
  await page.getByRole("button", { name: "Dodaj uczestnika" }).click();
  await page.getByPlaceholder("Imię, nazwisko lub email").fill("Anna");
  await page.getByRole("button", { name: /Anna/ }).click();
  await page.getByRole("button", { name: "Zarezerwuj bezpłatnie", exact: true }).click();
  await expect(
    page.getByText("Pierwsze zajęcia próbne — bezpłatnie", { exact: true }),
  ).toBeVisible();
  expect(state.requests.find((r) => r.path.endsWith("/walk-in"))?.data).toMatchObject({
    funding_type: "trial",
    entry_quote: "first",
  });
  await page.getByRole("button", { name: "Potwierdź", exact: true }).click();
  await expect.poll(() => state.roster[0].checked_in_at).not.toBeNull();
  await expect(page.getByText(/zapłacono/)).toHaveCount(0);
  await page.getByRole("button", { name: "Cofnij", exact: true }).click();
  await expect.poll(() => state.roster[0].checked_in_at).toBeNull();
});

test("multiple studios require a choice and keep their local settings separate", async ({
  page,
}) => {
  const state = await setup(page, true, true);
  await page.goto("/account/partner/class-templates/template/edit");
  await expect(page.getByRole("button", { name: "Dostosuj cenę" })).toBeDisabled();
  await page.getByRole("combobox", { name: "Studio dla ceny zajęć" }).click();
  await page.getByRole("option", { name: "Studio A", exact: true }).click();
  await page.getByRole("button", { name: "Dostosuj cenę" }).click();
  const modal = page.getByRole("dialog");
  await modal.getByLabel("Pierwsze zajęcia próbne gratis").click();
  await modal.getByRole("button", { name: "Zastosuj" }).click();
  await page.getByRole("combobox", { name: "Studio dla ceny zajęć" }).click();
  await page.getByRole("option", { name: "Studio B", exact: true }).click();
  await page.getByRole("button", { name: "Dostosuj cenę" }).click();
  await expect(modal.getByLabel("Cena jednego wejścia")).toHaveValue("70");
  await expect(modal.getByLabel("Pierwsze zajęcia próbne gratis")).not.toBeChecked();
  await modal.getByLabel("Cena jednego wejścia").fill("80");
  await modal.getByRole("button", { name: "Zastosuj" }).click();
  await page.getByRole("button", { name: "Zapisz zmiany", exact: true }).click();
  await expect.poll(() => state.saved).toBe(1);
  expect(state.settings.find((s) => s.studio_id === "studio")).toMatchObject({
    amount: null,
    trial_enabled: true,
  });
  expect(state.settings.find((s) => s.studio_id === "studio-b")).toMatchObject({
    amount: 80,
    trial_enabled: false,
  });
});

for (const width of [1280, 390]) {
  test(`automatic first trial hides spending and offers standalone pass after success ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const state = await setup(page);
    state.ownedPass = true;
    await page.goto("/book/class/session");
    await expect(
      page.getByRole("button", { name: "Zarezerwuj bezpłatnie", exact: true }),
    ).toBeEnabled();
    await expect(
      page.getByText(
        "Pierwsza rezerwacja tych zajęć jest bezpłatna. Nie wykorzystasz wejścia z karnetu.",
      ),
    ).toBeVisible();
    for (const name of [/Poranna grupa/, /Mój karnet/, /Karta sportowa/, /Kup karnet/]) {
      await expect(page.getByRole("button", { name })).toHaveCount(0);
    }
    expect(state.requests.filter((r) => r.path.endsWith("/bookings"))).toHaveLength(0);
    await page.screenshot({ path: `/tmp/h368-trial-${width}.png`, animations: "disabled" });
    await page.getByRole("button", { name: "Zarezerwuj bezpłatnie", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Zarezerwowane!" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Karnety na kolejne zajęcia" })).toBeVisible();
    await expect(page.getByText(/Ważność karnetu liczy się od zakupu/)).toBeVisible();
    await page.getByRole("button", { name: "Kup karnet", exact: true }).click();
    await expect(page).toHaveURL(/\/book\/pass\/pass$/);
    expect(state.requests.filter((r) => r.path.endsWith("/bookings"))).toHaveLength(1);
    expect(state.requests.some((r) => r.path.endsWith("/purchase"))).toBe(false);
  });
}

test("stale trial refreshes choices without auto spending an owned pass", async ({ page }) => {
  const state = await setup(page);
  state.ownedPass = true;
  state.loseTrialOnSubmit = true;
  await page.goto("/book/class/session");
  await page.getByRole("button", { name: "Zarezerwuj bezpłatnie", exact: true }).click();
  await expect(
    page.getByText("Warunki wejścia zmieniły się. Sprawdź je i potwierdź ponownie."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Pierwsze zajęcia próbne — bezpłatnie/ }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Wybierz sposób płatności", exact: true }),
  ).toBeDisabled();
  expect(state.requests.filter((r) => r.path.endsWith("/bookings"))).toHaveLength(1);
  await page.getByRole("button", { name: /Mój karnet/ }).click();
  expect(state.requests.filter((r) => r.path.endsWith("/bookings"))).toHaveLength(1);
});

test("existing occurrence booking shows its record instead of a purchase", async ({ page }) => {
  const state = await setup(page);
  state.trialAvailable = false;
  state.existingBookingId = "booking";
  await page.goto("/book/class/session");
  await expect(
    page.getByRole("heading", { name: "Masz już rezerwację na te zajęcia" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Zobacz rezerwację" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Poranna grupa/ })).toHaveCount(0);
  expect(state.requests.filter((r) => r.path.endsWith("/bookings"))).toHaveLength(0);
});

test("account reload gets personal trial availability afresh", async ({ page }) => {
  const state = await setup(page);
  await page.goto("/book/class/session");
  await expect(
    page.getByRole("button", { name: "Zarezerwuj bezpłatnie", exact: true }),
  ).toBeEnabled();
  state.userId = "returning-customer";
  state.trialAvailable = false;
  await page.reload();
  await expect(page.getByRole("button", { name: /Poranna grupa/ })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Zarezerwuj bezpłatnie", exact: true }),
  ).toHaveCount(0);
});

test("standalone purchase failure and retry keep the successful trial", async ({ page }) => {
  const state = await setup(page);
  await page.goto("/book/class/session");
  await page.getByRole("button", { name: "Zarezerwuj bezpłatnie", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Zarezerwowane!" })).toBeVisible();
  await page.getByRole("button", { name: "Kup karnet", exact: true }).click();
  state.failPurchase = true;
  await page.getByRole("button", { name: /^Kup karnet ·/ }).click();
  await expect(page.getByText("Zakup nie powiódł się.")).toBeVisible();
  await page.getByRole("button", { name: /^Kup karnet ·/ }).click();
  await expect(page.getByRole("heading", { name: /Karnet/ })).toBeVisible();
  expect(state.requests.filter((r) => r.path.endsWith("/bookings"))).toHaveLength(1);
  expect(state.requests.filter((r) => r.path.endsWith("/purchase"))).toHaveLength(2);
  expect(state.requests.some((r) => r.path.endsWith("/cancel"))).toBe(false);
});
