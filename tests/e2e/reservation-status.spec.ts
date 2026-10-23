import { expect, type Page, test } from "@playwright/test";

async function setup(page: Page) {
  const state = {
    summary: {
      id: "original",
      occurrence_id: "session",
      status: "booked",
      funding_type: "drop_in",
      amount_owed: 50,
      sport_card_surcharge: null as number | null,
      confirmation_pending: false as boolean | undefined,
      payment_required: false,
      payment: {
        method: "cash",
        amount: 50 as number | null,
        currency: "PLN",
        is_paid: false as boolean | null,
      } as
        | {
            method: string | null;
            amount: number | null;
            currency: string | null;
            is_paid: boolean | null;
          }
        | undefined,
    },
    detail: {
      id: "session",
      start_time: "2099-10-25T08:00:00Z",
      end_time: "2099-10-25T09:15:00Z",
      calendar_date: "2099-10-25",
      status: "scheduled",
      template_title: "Restorative Yoga",
      duration_minutes: 75,
      level: "advanced",
      style: "Restorative",
      room_name: "Biała",
      is_modified: false,
      studio: {
        id: "studio",
        name: "Studio testowe",
        organizer_kind: "studio",
        passes: [],
        sport_card_acceptances: [],
        accepts_cash: true,
        accepts_stripe: false,
        accepts_bank_transfer: false,
        room_count: 1,
      },
      viewer_booking: {
        id: "original",
        status: "booked",
        funding_type: "drop_in",
        amount_owed: 50,
        currency: "PLN",
        payment_method: "cash",
        is_paid: false as boolean | undefined,
        can_cancel: true,
      },
    },
    reads: [] as string[],
  };
  await page.addInitScript(() => {
    localStorage.setItem(
      "access_token",
      `e30.${btoa(JSON.stringify({ sub: "viewer", email: "viewer@example.com" }))}.fixture`,
    );
    document.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style");
      style.textContent = "nextjs-portal{display:none!important}";
      document.head.append(style);
    });
  });
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (!["localhost", "127.0.0.1"].includes(url.hostname)) return route.abort();
    if (url.port !== "8010") return route.continue();
    expect(route.request().method()).toBe("GET");
    state.reads.push(url.pathname);
    let json: unknown = [];
    if (url.pathname === "/me") json = { id: "viewer", email: "viewer@example.com" };
    else if (url.pathname === "/bookings/original") json = state.summary;
    else if (url.pathname === "/public/occurrences/session/detail") json = state.detail;
    else if (url.pathname === "/users/me/bookings")
      json = {
        bookings: [
          {
            booking_id: "original",
            occurrence_id: "session",
            event_title: "Restorative Yoga",
            event_type: "class",
            studio_name: "Studio testowe",
            start_time: state.detail.start_time,
            status: state.summary.status,
            funding: state.summary.funding_type,
            is_past: false,
            color: "green",
            duration_minutes: 75,
          },
        ],
        inquiries: [],
        upcoming_count: 1,
        inquiry_count: 0,
      };
    return route.fulfill({ json });
  });
  return state;
}

async function open(page: Page, query = "") {
  await page.goto(`/account/bookings/original${query}`);
  await expect(page.getByRole("heading", { name: "Restorative Yoga" })).toBeVisible();
  const cookies = page.getByRole("button", { name: "Tylko niezbędne" });
  if (await cookies.isVisible()) await cookies.click();
}

const fact = (page: Page, label: string) => page.getByText(label, { exact: true }).locator("..");

test("cash and sports-card amounts remain separate from reservation confirmation", async ({
  page,
}, testInfo) => {
  const s = await setup(page);
  await open(page);
  await expect(page.getByText("Rezerwacja potwierdzona", { exact: true })).toBeVisible();
  await expect(fact(page, "Status płatności")).toContainText("Do zapłaty");
  await expect(fact(page, "Kwota")).toContainText("50,00 PLN");
  await page.screenshot({ path: testInfo.outputPath("cash-desktop.png"), fullPage: true });
  s.summary.funding_type = "sport_card";
  s.summary.sport_card_surcharge = 16;
  s.summary.payment!.amount = 16;
  await page.setViewportSize({ width: 320, height: 900 });
  await page.reload();
  await expect(fact(page, "Sposób opłaty")).toContainText("Karta sportowa");
  await expect(fact(page, "Kwota")).toContainText("16,00 PLN");
  await expect(fact(page, "Dopłata do karty")).toContainText("16,00 PLN");
  await expect(fact(page, "Status płatności")).toContainText("Do zapłaty");
  const badge = page.getByText("Rezerwacja potwierdzona", { exact: true });
  await expect(badge).toBeVisible();
  expect(await badge.evaluate((el) => getComputedStyle(el).whiteSpace)).toBe("normal");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("card-mobile.png"), fullPage: true });
  await page.getByRole("button", { name: "Wróć", exact: true }).click();
  await expect(page).toHaveURL(/\/account\/bookings$/);
  await page.getByRole("button").filter({ hasText: "Restorative Yoga" }).click();
  await expect(badge).toBeVisible();
  await expect(fact(page, "Kwota")).toContainText("16,00 PLN");
  expect(s.reads.filter((p) => p === "/bookings/original").length).toBeGreaterThanOrEqual(3);
  s.detail.studio.organizer_kind = "solo";
  await page.reload();
  await expect(fact(page, "Płatność")).toContainText("Płatność na miejscu");
});

test("online return-looking URL cannot confirm or pay a pending booking", async ({
  page,
}, testInfo) => {
  const s = await setup(page);
  s.summary.confirmation_pending = true;
  s.summary.payment!.method = "blik";
  // Checkout already started: payment_required is false, confirmation is still pending.
  await open(page, "?success=true&paid=true");
  await expect(page.getByText("Oczekuje na potwierdzenie", { exact: true })).toBeVisible();
  await expect(page.getByText("Rezerwacja potwierdzona", { exact: true })).toHaveCount(0);
  await expect(fact(page, "Status płatności")).toContainText("Do zapłaty");
  await page.screenshot({ path: testInfo.outputPath("pending-desktop.png"), fullPage: true });
  s.summary.confirmation_pending = false;
  s.summary.payment!.is_paid = true;
  await page.reload();
  await expect(page.getByText("Rezerwacja potwierdzona", { exact: true })).toBeVisible();
  await expect(fact(page, "Status płatności")).toContainText("Opłacona");
  s.summary.status = "cancelled";
  s.summary.payment!.is_paid = false;
  await page.reload();
  await expect(page.getByText("Odwołana", { exact: true })).toBeVisible();
  await expect(page.getByText("Status płatności", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Odwołaj rezerwację" })).toHaveCount(0);
});

test("old cancelled booking never borrows the later rebooking payment or cancellation facts", async ({
  page,
}, testInfo) => {
  const s = await setup(page);
  s.summary.status = "cancelled";
  s.summary.payment = { method: "cash", amount: 25, currency: "EUR", is_paid: false };
  s.detail.viewer_booking.id = "later-rebooking";
  s.detail.viewer_booking.amount_owed = 70;
  s.detail.viewer_booking.is_paid = true;
  await open(page);
  await expect(page.getByText("Odwołana", { exact: true })).toBeVisible();
  await expect(fact(page, "Kwota")).toContainText("25,00 EUR");
  await expect(page.getByText(/70,00/)).toHaveCount(0);
  await expect(page.getByText("Status płatności", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Odwołaj rezerwację" })).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath("cancelled-desktop.png"), fullPage: true });
  // An older server without the new projection also cannot leak the new booking's facts.
  s.summary.payment = undefined;
  s.summary.amount_owed = 25;
  await page.reload();
  await expect(fact(page, "Kwota")).toContainText("25,00");
  await expect(page.getByText("Status płatności", { exact: true })).toHaveCount(0);
});

test("no-show, past, unknown payment and existing pass retain truthful presentation", async ({
  page,
}) => {
  const s = await setup(page);
  s.summary.status = "no_show";
  await open(page);
  await expect(page.getByText("Nieobecność", { exact: true })).toBeVisible();
  await expect(page.getByText("Rezerwacja potwierdzona", { exact: true })).toHaveCount(0);
  s.summary.status = "booked";
  s.detail.start_time = "2020-01-01T08:00:00Z";
  await page.reload();
  await expect(page.getByText("Zakończone", { exact: true })).toBeVisible();
  s.detail.start_time = "2099-10-25T08:00:00Z";
  s.summary.funding_type = "use_pass";
  s.summary.payment = { method: null, amount: null, currency: null, is_paid: true };
  await page.reload();
  await expect(fact(page, "Sposób opłaty")).toContainText("Karnet");
  await expect(page.getByText("Kwota", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Status płatności", { exact: true })).toHaveCount(0);
  s.summary.funding_type = "unknown";
  s.summary.payment!.is_paid = null;
  await page.reload();
  await expect(page.getByText("Status płatności", { exact: true })).toHaveCount(0);
  s.summary.status = "unrecognized";
  await page.reload();
  await expect(page.getByText("Rezerwacja potwierdzona", { exact: true })).toHaveCount(0);
  s.summary.status = "booked";
  s.summary.payment = undefined;
  s.summary.confirmation_pending = undefined;
  s.detail.viewer_booking.is_paid = undefined;
  await page.reload();
  await expect(page.getByText("Status płatności", { exact: true })).toHaveCount(0);
});
