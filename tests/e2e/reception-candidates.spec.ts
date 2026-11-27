import { expect, type Page, test } from "@playwright/test";

import type { SessionDetailResponse } from "../../src/app/account/partner/schedule/types";
import type { ReviewItem } from "../../src/app/account/partner/studio/[studioId]/front-desk/types";

type DeskViewer = "owner" | "manager" | "front_desk" | "instructor";

async function setup(page: Page, solo = false, viewer: DeskViewer = "owner") {
  const state = {
    isCancelled: false,
    cancellationExpected: null as number | null,
    cancellationQueued: 1,
    emailStatus: null as SessionDetailResponse["cancellation_email_status"],
    needsReview: [] as ReviewItem[],
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
    if (!["8000", "8010", "18478"].includes(url.port)) return route.continue();
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
    else if (path === "/partner/payment-attention") {
      json = { paid_without_seat: [], needs_review: state.needsReview };
    } else if (path === "/partner/reconciliation") {
      json = { sessions: [], total: 0, cancellation_review_count: state.needsReview.length };
    } else if (path === "/class-grafik/week") {
      const today = new Date().toISOString().slice(0, 10);
      json = {
        days: [
          {
            occurrences: [
              {
                id: "session",
                studio_id: "studio",
                template_title: "Hatha",
                calendar_date: today,
                start_time: `${today}T12:00:00Z`,
                end_time: `${today}T13:00:00Z`,
                status: state.isCancelled ? "cancelled" : "scheduled",
                organizer_kind: "studio",
                cancellation_email_warning: (state.emailStatus?.unconfirmed ?? 0) > 0,
              },
            ],
          },
        ],
      };
    } else if (path === "/payments/review-items/unknown/resolve") {
      if (route.request().postDataJSON()?.refund_outcome === "settled") {
        state.needsReview = [];
      }
      json = {};
    } else if (path === "/partner/capabilities")
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
        role: viewer === "instructor" ? "instructor" : "owner",
        can_write_schedule: viewer === "owner" || viewer === "manager",
        can_view_finance: viewer === "owner" || viewer === "manager",
        status: state.isCancelled ? "cancelled" : "scheduled",
        notified_count: state.isCancelled ? state.cancellationQueued : 0,
        cancellation_expected_recipients: state.cancellationExpected,
        cancellation_email_status: state.emailStatus,
        capacity: 20,
        recurrence_frequency: "once",
        recurrence_days: [],
      };
    else if (path === "/class-sessions/cancel/preview")
      json = {
        scope: "single",
        items: [],
        total_affected: 1,
        notification_summary: { total_recipients: 2, total_booked_seats: 2 },
      };
    else if (path === "/class-sessions/cancel/commit") {
      json = {
        scope: "single",
        updated: [],
        created: [],
        cancelled: ["session"],
        deleted: [],
        expected_recipients: state.cancellationExpected,
        queued_recipients: state.cancellationQueued,
        already_cancelled: state.isCancelled,
      };
      state.isCancelled = true;
    } else if (path.endsWith("/search-users")) {
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
    } else if (path === "/bookings/participant-booking/confirm" && state.isCancelled) {
      status = 409;
      json = { detail: { code: "session_cancelled", message: "Ta sesja została odwołana." } };
    } else if (path.endsWith("/roster")) json = state.isCancelled ? [] : state.roster;
    else if (path.startsWith("/notifications")) json = { items: [], unread_count: 0 };
    return route.fulfill({ status, json });
  });
  return state;
}
async function gotoRoster(page: Page) {
  await page.goto("/account/partner/studio/studio/front-desk/session");
  const cookies = page.getByRole("button", { name: "Tylko niezbędne" });
  if (await cookies.isVisible()) await cookies.click();
}

async function open(page: Page) {
  await gotoRoster(page);
  await page.getByRole("button", { name: "Dodaj uczestnika", exact: true }).click();
  return page.getByRole("dialog");
}

test("cancelled Solo session links to evidence-based refund review", async ({ page }) => {
  const state = await setup(page, true);
  state.isCancelled = true;
  state.needsReview = [
    {
      id: "unknown",
      source: "unknown_refund",
      detail: "Wynik zwrotu jest nieznany.",
      created_at: "2099-10-26T12:00:00Z",
      order_id: "order-original",
      booking_id: "booking-original",
      transaction_id: "refund-original",
      payment_id: "payment-original",
      class_title: "Hatha",
      occurrence_start_time: "2099-10-26T12:00:00Z",
      user_name: "Anna Test",
      organizer_cancelled: true,
      amount: 45,
      currency: "PLN",
      can_retry_refund: false,
      actions: ["verify_refund"],
    },
  ];
  await gotoRoster(page);
  await page.getByRole("link", { name: "Sprawdź rozliczenia" }).click();
  await expect(page).toHaveURL(/\/account\/partner\/reconciliation/);
  const review = page.getByRole("article").filter({ hasText: "Anna Test" });
  await expect(review.getByText("Sprawdź status zwrotu u operatora")).toBeVisible();
  await expect(review.getByText(/Hatha.*12:00/)).toBeVisible();
  await review.getByText("Dane rezerwacji i płatności").click();
  await expect(review.getByText("booking-original", { exact: true })).toBeVisible();
  await expect(review.getByRole("button", { name: "Ponów zwrot" })).toHaveCount(0);
  await expect(review.getByRole("button", { name: "Zapisz wykonany zwrot" })).toHaveCount(0);
  await review.getByRole("button", { name: "Zapisz status u operatora" }).click();
  await expect(review.getByRole("button", { name: "Zwrot w toku" })).toBeDisabled();
  await review.getByLabel("Potwierdzenie zwrotu").fill("Operator potwierdził przetwarzanie");
  await review.getByRole("button", { name: "Zwrot w toku" }).click();
  await expect(review.getByRole("button", { name: "Zapisz status u operatora" })).toBeVisible();
  await page.reload();
  await expect(review.getByText("Sprawdź status zwrotu u operatora")).toBeVisible();
  await review.getByRole("button", { name: "Zapisz status u operatora" }).click();
  await review.getByLabel("Potwierdzenie zwrotu").fill("Potwierdzenie przelewu nr 47");
  await review.getByRole("button", { name: "Zwrot wykonany", exact: true }).click();
  await expect(review).toHaveCount(0);
  expect(
    state.requests
      .filter((request) => request.path === "/payments/review-items/unknown/resolve")
      .map((request) => request.data),
  ).toEqual([
    { refund_outcome: "pending", note: "Operator potwierdził przetwarzanie" },
    { refund_outcome: "settled", note: "Potwierdzenie przelewu nr 47" },
  ]);
});

test("cancellation and reception report the committed empty queue and repeat", async ({ page }) => {
  const state = await setup(page);
  state.cancellationExpected = 0;
  state.cancellationQueued = 0;
  const cancelPage = "/account/partner/schedule/cancel/session";
  const empty = page.getByText("Nie było zapisanych uczestników.", { exact: true });
  for (const headline of ["Sesja odwołana", "Sesja była już odwołana"]) {
    await page.goto(cancelPage);
    const cookies = page.getByRole("button", { name: "Tylko niezbędne" });
    if (await cookies.isVisible()) await cookies.click();
    await page.getByRole("button", { name: "Zobacz podgląd zmian", exact: true }).click();
    await page.getByRole("button", { name: "Odwołaj sesję", exact: true }).click();
    await expect(page.getByRole("heading", { name: headline })).toBeVisible();
    await expect(empty).toBeVisible();
  }
  await gotoRoster(page);
  await expect(empty).toBeVisible();
  state.cancellationExpected = 2;
  state.cancellationQueued = 1;
  await page.reload();
  await expect(page.getByText(/W kolejce są powiadomienia dla 1 osoby/)).toBeVisible();
  await expect(page.getByText(/Liczba zapisanych uczestników objętych zmianą: 2/)).toBeVisible();
  await expect(empty).toHaveCount(0);
});

test("studio email result refreshes and leaves a warning in the schedule", async ({ page }) => {
  const state = await setup(page);
  state.cancellationExpected = 2;
  state.cancellationQueued = 2;
  state.emailStatus = { expected: 2, accepted: 0, pending: 2, unconfirmed: 0 };
  await page.goto("/account/partner/schedule/cancel/session");
  const cookies = page.getByRole("button", { name: "Tylko niezbędne" });
  if (await cookies.isVisible()) await cookies.click();
  await page.getByRole("button", { name: "Zobacz podgląd zmian", exact: true }).click();
  await page.getByRole("button", { name: "Odwołaj sesję", exact: true }).click();
  await page.getByRole("link", { name: "Sprawdź wysyłkę e-maili" }).click();
  await expect(page.getByText("Oczekuje na wysyłkę lub ponowienie: 2.")).toBeVisible();
  state.emailStatus = { expected: 2, accepted: 1, pending: 0, unconfirmed: 1 };
  const warning = page.getByText(/Brak potwierdzenia wysyłki: 1/);
  await expect(warning).toBeVisible({ timeout: 10000 });
  await expect(page.getByText("Operator pocztowy przyjął 1 z 2 e-maili.")).toBeVisible();
  await page.reload();
  await expect(warning).toBeVisible();
  await page.goto("/account/partner/schedule");
  const cancelledCard = page
    .getByRole("button")
    .filter({ hasText: "Brak potwierdzenia wysyłki e-maili" });
  await cancelledCard.click();
  await expect(warning).toBeVisible();
});

for (const viewer of ["owner", "manager", "front_desk", "instructor"] as const) {
  test(`schedule commands follow the session capability for ${viewer}`, async ({ page }) => {
    await setup(page, false, viewer);
    await gotoRoster(page);
    await expect(page.getByText("Hatha", { exact: true })).toBeVisible();
    const menu = page.getByRole("button", { name: "Więcej akcji" });
    if (viewer === "owner" || viewer === "manager") {
      await menu.click();
      for (const option of ["Edytuj sesję", "Zmień prowadzącego", "Odwołaj sesję"]) {
        await expect(page.getByRole("menuitem", { name: option })).toBeVisible();
      }
    } else {
      await expect(menu).toHaveCount(0);
      if (viewer === "front_desk") {
        await expect(page.getByRole("button", { name: "Dodaj uczestnika" })).toBeVisible();
      } else {
        await expect(page.getByText("Uczestnicy", { exact: true })).toBeVisible();
        await expect(page.getByRole("button", { name: "Dodaj uczestnika" })).toHaveCount(0);
      }
    }
  });
}

test("stale desk confirmation switches to the cancelled session", async ({ page }) => {
  const state = await setup(page, false, "front_desk");
  state.roster = [
    {
      booking_id: "participant-booking",
      user_id: "participant",
      user_email: "participant@example.com",
      status: "booked",
      funding_type: "sport_card",
      payment_status: "paid",
      amount_owed: 15,
      checked_in_at: null,
      needs_settlement: false,
      is_overdue: false,
    },
  ];
  await gotoRoster(page);
  const confirm = page.getByRole("button", { name: /^Potwierdź/ });
  await expect(confirm).toBeVisible();

  state.isCancelled = true;
  await confirm.click();
  await expect(page.getByText("Sesja odwołana", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Dodaj uczestnika" })).toHaveCount(0);
  await expect(confirm).toHaveCount(0);
  await expect(page.getByText("Anuluj potwierdzenie")).toHaveCount(0);
  expect(
    state.requests.filter((request) => request.path === "/bookings/participant-booking/confirm"),
  ).toHaveLength(1);
  await expect
    .poll(() => state.requests.filter((r) => r.path === "/class-sessions/session").length)
    .toBeGreaterThan(1);
});

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
