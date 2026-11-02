import { expect, type Page, test } from "@playwright/test";

async function setup(page: Page, solo = false) {
  const state = {
    failSearch: false,
    failCreate: false,
    createGate: null as Promise<void> | null,
    created: null as { user_id: string; email: string; name: string; note: string | null } | null,
    roster: [] as Record<string, unknown>[],
    requests: [] as { path: string; method: string; data: unknown }[],
    candidates: [
      {
        user_id: "many",
        name: "Aleksandra Bardzo Długie Nazwisko Testowe",
        email: "many@example.com",
        note: null as string | null,
        pass_context: "Karnet na bardzo wiele zajęć w studiu — ważny do grudnia",
        past_booking_count: 124,
        last_past_booking_at: "2026-10-20T12:00:00Z",
      },
      {
        user_id: "one",
        name: "Jan",
        email: "one@example.com",
        note: null as string | null,
        pass_context: null,
        past_booking_count: 1,
        last_past_booking_at: "2026-10-19T12:00:00Z",
      },
      {
        user_id: "zero",
        name: "Ewa",
        email: "zero@example.com",
        note: null as string | null,
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
    else if (path.endsWith("/new-user") && method === "POST") {
      if (state.createGate) await state.createGate;
      if (state.failCreate) {
        status = 503;
        json = { detail: "Nie udało się zapisać uczestnika. Spróbuj ponownie." };
      } else {
        const body = route.request().postDataJSON();
        state.created = {
          user_id: "new",
          email: body.email,
          name: body.name || "",
          note: body.note || null,
        };
        json = state.created;
      }
    } else if (path.endsWith("/walk-in") && method === "POST" && state.created) {
      state.candidates.push({
        ...state.created,
        pass_context: null,
        past_booking_count: 0,
        last_past_booking_at: null,
      });
      state.roster = [
        {
          booking_id: "new-booking",
          user_id: state.created.user_id,
          user_name: state.created.name,
          user_email: state.created.email,
          status: "booked",
          funding_type: "drop_in",
          payment_status: "unpaid",
          amount_owed: 50,
          checked_in_at: null,
          needs_settlement: true,
          is_overdue: false,
        },
      ];
      json = state.roster[0];
    } else if (path.endsWith("/roster")) json = state.roster;
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

for (const width of [390, 1440]) {
  test(`reception name and plain multiline note survive confirmation and refresh (${width}px)`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 900 });
    const state = await setup(page, width === 1440);
    const dialog = await open(page);
    await dialog.getByRole("button", { name: "Utwórz użytkownika" }).click();
    const name = "anna / grupa 2 — 李 <3 z bardzo długą nazwą";
    const note =
      "Pierwszy raz — kontakt po 17:00.\n<b>zwykły tekst</b>  dwie spacje\nhttps://example.com/" +
      "bardzodlugilink".repeat(15);
    await dialog.getByLabel("Email", { exact: true }).fill("new@example.com");
    await dialog.getByLabel("Imię (opcjonalnie)").fill(`  ${name}  `);
    await dialog.getByLabel("Notatka (opcjonalnie)").fill(`\n${note}\n`);
    await page.screenshot({ path: info.outputPath("participant-form.png") });
    await dialog.getByRole("button", { name: "Utwórz i dodaj" }).click();
    await expect(
      dialog.getByRole("button", { name: "Dodaj rezerwację", exact: true }),
    ).toBeEnabled();
    expect(state.requests.filter((r) => r.method !== "GET")).toEqual([
      {
        path: "/studios/studio/front-desk/new-user",
        method: "POST",
        data: { email: "new@example.com", name, note },
      },
    ]);
    await expect(dialog.getByText(name, { exact: true })).toBeVisible();
    await dialog.getByRole("button", { name: "Dodaj rezerwację", exact: true }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.getByText(name, { exact: true })).toBeVisible();
    expect(state.requests.filter((r) => r.method !== "GET").map((r) => r.path)).toEqual([
      "/studios/studio/front-desk/new-user",
      "/studios/studio/occurrences/session/walk-in",
    ]);
    await page.reload();
    await page.getByRole("button", { name: "Dodaj uczestnika", exact: true }).click();
    const row = dialog.getByRole("button").filter({ hasText: name });
    const noteBlock = row.locator(".whitespace-pre-wrap");
    await expect(noteBlock).toHaveText(note);
    await expect(row.locator("b")).toHaveCount(0);
    await expect(row).toContainText("Ostatnia: —");
    await expect(row).toHaveAccessibleName(/Rezerwacje na zakończone zajęcia: 0$/);
    await expect(dialog.getByText("Klient", { exact: true })).toHaveCount(0);
    await expect(dialog.getByText(/Odbyte rezerwacje/)).toHaveCount(0);
    expect(await noteBlock.evaluate((e) => e.previousElementSibling?.textContent)).toContain(
      "Ostatnia:",
    );
    expect(await row.evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(true);
    expect(await noteBlock.evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(true);
    await row.scrollIntoViewIfNeeded();
    await page.screenshot({ path: info.outputPath("participant-note.png") });
    await dialog.getByRole("button", { name: "Utwórz użytkownika" }).click();
    await expect(dialog.getByLabel("Imię (opcjonalnie)")).toHaveValue("");
    await expect(dialog.getByLabel("Notatka (opcjonalnie)")).toHaveValue("");
  });
}

test("reception preserves a failed draft, prevents duplicate submit and clears drafts on cancel/close", async ({
  page,
}) => {
  const state = await setup(page);
  const dialog = await open(page);
  await dialog.getByRole("button", { name: "Utwórz użytkownika" }).click();
  await dialog.getByLabel("Email", { exact: true }).fill("retry@example.com");
  await dialog.getByLabel("Imię (opcjonalnie)").fill("Żaneta 2 / grupa");
  await dialog.getByLabel("Notatka (opcjonalnie)").fill("Zachowaj\nnotatkę.");
  state.failCreate = true;
  await dialog.getByRole("button", { name: "Utwórz i dodaj" }).click();
  await expect(
    page.getByText("Nie udało się zapisać uczestnika. Spróbuj ponownie.").first(),
  ).toBeVisible();
  await expect(dialog.getByLabel("Imię (opcjonalnie)")).toHaveValue("Żaneta 2 / grupa");
  await expect(dialog.getByLabel("Notatka (opcjonalnie)")).toHaveValue("Zachowaj\nnotatkę.");
  state.failCreate = false;
  let release!: () => void;
  state.createGate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await dialog.getByRole("button", { name: "Utwórz i dodaj" }).click();
  await expect(dialog.getByRole("button", { name: "Tworzę..." })).toBeDisabled();
  await expect
    .poll(() => state.requests.filter((r) => r.path.endsWith("/new-user")).length)
    .toBe(2);
  release();
  await expect(dialog.getByRole("button", { name: "Dodaj rezerwację", exact: true })).toBeEnabled();
  expect(state.requests.filter((r) => r.method !== "GET" && !r.path.endsWith("/new-user"))).toEqual(
    [],
  );
  await dialog.getByRole("button", { name: "Wybierz inną osobę" }).click();
  await dialog.getByRole("button", { name: "Utwórz użytkownika" }).click();
  await expect(dialog.getByLabel("Notatka (opcjonalnie)")).toHaveValue("");
  await dialog.getByLabel("Imię (opcjonalnie)").fill("Discard");
  await dialog.getByLabel("Notatka (opcjonalnie)").fill("Discard note");
  await dialog.getByRole("button", { name: "Wróć do wyszukiwania" }).click();
  await dialog.getByRole("button", { name: "Utwórz użytkownika" }).click();
  await expect(dialog.getByLabel("Imię (opcjonalnie)")).toHaveValue("");
  await expect(dialog.getByLabel("Notatka (opcjonalnie)")).toHaveValue("");
  await dialog.getByLabel("Notatka (opcjonalnie)").fill("Close discards this");
  await dialog.getByRole("button", { name: "Zamknij", exact: true }).click();
  await page.getByRole("button", { name: "Dodaj uczestnika", exact: true }).click();
  await dialog.getByRole("button", { name: "Utwórz użytkownika" }).click();
  await expect(dialog.getByLabel("Notatka (opcjonalnie)")).toHaveValue("");
  await dialog.getByLabel("Email", { exact: true }).fill("email.only@example.com");
  await dialog.getByLabel("Imię (opcjonalnie)").fill("   ");
  await dialog.getByLabel("Notatka (opcjonalnie)").fill(" \n ");
  await dialog.getByRole("button", { name: "Utwórz i dodaj" }).click();
  await expect(dialog.getByRole("button", { name: "Dodaj rezerwację", exact: true })).toBeEnabled();
  expect(state.requests.filter((r) => r.path.endsWith("/new-user")).at(-1)?.data).toEqual({
    email: "email.only@example.com",
  });
});
